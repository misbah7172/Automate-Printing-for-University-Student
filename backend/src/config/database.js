require('dotenv').config();

module.exports = {
  development: {
    url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_8uexFD5ArTqV@ep-divine-credit-ad52ykm7.c-2.us-east-1.aws.neon.tech/neondb',
    dialect: 'postgres',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  },
  test: {
    url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_8uexFD5ArTqV@ep-divine-credit-ad52ykm7.c-2.us-east-1.aws.neon.tech/neondb',
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  },
  production: {
    url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_8uexFD5ArTqV@ep-divine-credit-ad52ykm7.c-2.us-east-1.aws.neon.tech/neondb',
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 10000
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};