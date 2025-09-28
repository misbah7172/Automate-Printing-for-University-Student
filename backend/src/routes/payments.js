const express = require('express');
const { Payment, User, PrintJob } = require('../models');
const { asyncHandler } = require('../middleware/asyncHandler');
const { processStripePayment } = require('../services/paymentService');

const router = express.Router();

// POST /api/payments/create
router.post('/create', asyncHandler(async (req, res) => {
  const { printJobId, paymentMethod, amount } = req.body;

  // Validate print job
  const printJob = await PrintJob.findOne({
    where: { 
      id: printJobId, 
      userId: req.user.userId,
      status: 'pending'
    }
  });

  if (!printJob) {
    return res.status(404).json({ error: 'Print job not found or already paid' });
  }

  // Create payment record
  const payment = await Payment.create({
    userId: req.user.userId,
    amount: amount || printJob.totalCost,
    paymentMethod,
    description: `Print job payment - ${printJob.jobNumber}`
  });

  // Link payment to print job
  await printJob.update({ paymentId: payment.id });

  res.status(201).json({
    message: 'Payment created successfully',
    payment
  });
}));

// POST /api/payments/:id/process
router.post('/:id/process', asyncHandler(async (req, res) => {
  const { paymentMethodId, useBalance = false } = req.body;

  const payment = await Payment.findOne({
    where: { 
      id: req.params.id, 
      userId: req.user.userId,
      status: 'pending'
    },
    include: ['user', 'printJob']
  });

  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  try {
    if (useBalance) {
      // Pay with user balance
      const user = payment.user;
      if (user.balance < payment.amount) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      // Deduct from balance
      await user.update({ 
        balance: parseFloat(user.balance) - parseFloat(payment.amount)
      });

      await payment.completePayment({ source: 'balance' });
      
      // Update print job status
      if (payment.printJob) {
        await payment.printJob.updateStatus('paid');
      }

    } else if (payment.paymentMethod === 'card') {
      // Process Stripe payment
      const result = await processStripePayment(payment, paymentMethodId);
      
      if (result.success) {
        await payment.completePayment({ 
          stripePaymentIntentId: result.paymentIntentId 
        });
        
        if (payment.printJob) {
          await payment.printJob.updateStatus('paid');
        }
      } else {
        await payment.failPayment(result.error);
        return res.status(400).json({ error: result.error });
      }
    }

    res.json({
      message: 'Payment processed successfully',
      payment: await Payment.findByPk(payment.id, {
        include: ['printJob']
      })
    });

  } catch (error) {
    await payment.failPayment(error.message);
    res.status(500).json({ error: 'Payment processing failed' });
  }
}));

// GET /api/payments
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  
  const where = { userId: req.user.userId };
  if (status) where.status = status;

  const payments = await Payment.findAndCountAll({
    where,
    include: ['printJob'],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
    order: [['createdAt', 'DESC']]
  });

  res.json({
    payments: payments.rows,
    totalCount: payments.count,
    currentPage: parseInt(page),
    totalPages: Math.ceil(payments.count / parseInt(limit))
  });
}));

// GET /api/payments/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({
    where: { 
      id: req.params.id, 
      userId: req.user.userId 
    },
    include: ['user', 'printJob']
  });

  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  res.json({ payment });
}));

// POST /api/payments/:id/refund
router.post('/:id/refund', asyncHandler(async (req, res) => {
  const { amount } = req.body;

  const payment = await Payment.findOne({
    where: { 
      id: req.params.id, 
      userId: req.user.userId 
    }
  });

  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  if (!payment.canRefund()) {
    return res.status(400).json({ error: 'Payment cannot be refunded' });
  }

  try {
    await payment.refund(amount);
    
    // Add refund amount back to user balance
    const user = await User.findByPk(req.user.userId);
    const refundAmount = amount || (payment.amount - payment.refundAmount);
    await user.update({ 
      balance: parseFloat(user.balance) + parseFloat(refundAmount)
    });

    res.json({
      message: 'Refund processed successfully',
      payment
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

module.exports = router;