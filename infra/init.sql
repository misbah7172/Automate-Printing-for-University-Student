-- Initialize the AutoPrint database
-- This script runs when the PostgreSQL container starts for the first time

\c autoprint_db;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for better performance
-- These will be created by Sequelize migrations, but included here for reference

-- Set default permissions
GRANT ALL PRIVILEGES ON DATABASE autoprint_db TO autoprint_user;

-- Create some sample data (optional, for development)
-- This will be handled by Sequelize seeders in actual implementation