#!/usr/bin/env node

/**
 * Production startup script for AutoPrint Backend
 * Ensures database connectivity and runs migrations before starting the server
 */

const { sequelize } = require('./src/models');
const path = require('path');

async function startServer() {
  console.log('🚀 Starting AutoPrint Backend...');
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Port: ${process.env.PORT || 3000}`);

  try {
    // Test database connection
    console.log('🔍 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Run migrations in production
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Checking database migrations...');
      try {
        // Try to sync the database (this will create tables if they don't exist)
        await sequelize.sync({ alter: false });
        console.log('✅ Database schema synchronized.');
      } catch (error) {
        console.log('ℹ️  Database sync note:', error.message);
        // Continue anyway as database might already be set up
      }
    }

    // Start the main application
    console.log('🌟 Starting application server...');
    require('./src/index');

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Graceful shutdown...');
  try {
    await sequelize.close();
    console.log('✅ Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM. Graceful shutdown...');
  try {
    await sequelize.close();
    console.log('✅ Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the server
startServer();