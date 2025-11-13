import { Logger } from '@nestjs/common';

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

// Optional env vars with defaults
const optionalEnvVars = {
  'REDIS_URL': 'redis://localhost:6379',
  'CORS_ORIGINS': 'http://localhost:5173,http://localhost:3000',
  'PORT': '3000',
  'NODE_ENV': 'development'
};

export function validateEnvironment() {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  // Set defaults for optional variables
  Object.entries(optionalEnvVars).forEach(([key, defaultValue]) => {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
      Logger.warn(`Using default value for ${key}: ${defaultValue}`);
    }
  });
  
  if (missing.length > 0) {
    Logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    Logger.error('Please check your .env file and ensure all required variables are set.');
    process.exit(1);
  }
  
  if (process.env.NODE_ENV === 'production') {
    // Additional production checks
    if (process.env.JWT_SECRET?.includes('change-in-production')) {
      Logger.error('Cannot use default JWT_SECRET in production');
      process.exit(1);
    }
    
    if (process.env.JWT_REFRESH_SECRET?.includes('change-in-production')) {
      Logger.error('Cannot use default JWT_REFRESH_SECRET in production');
      process.exit(1);
    }
    
    if (!process.env.CORS_ORIGINS || process.env.CORS_ORIGINS === '*') {
      Logger.error('CORS_ORIGINS must be explicitly set in production (not *)');
      process.exit(1);
    }
  }
  
  Logger.log('Environment validation passed ✓');
}

