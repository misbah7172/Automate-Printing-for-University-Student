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
      console.log('🔄 Running database migrations...');
      try {
        const { exec } = require('child_process');
        await new Promise((resolve, reject) => {
          exec('npx sequelize-cli db:migrate', (error, stdout, stderr) => {
            if (error) {
              console.log('ℹ️  Migration output:', stdout);
              console.log('⚠️  Migration warnings:', stderr);
              // Don't fail if migrations already applied
              resolve();
            } else {
              console.log('✅ Migrations completed:', stdout);
              resolve();
            }
          });
        });
      } catch (error) {
        console.log('ℹ️  Migration note:', error.message);
        // Continue anyway as migrations might already be applied
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