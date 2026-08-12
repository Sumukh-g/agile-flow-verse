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
    const productionErrors: string[] = [];

    if (process.env.JWT_SECRET?.includes('change-in-production')) {
      productionErrors.push('Cannot use the default JWT_SECRET in production');
    }

    if (process.env.JWT_REFRESH_SECRET?.includes('change-in-production')) {
      productionErrors.push('Cannot use the default JWT_REFRESH_SECRET in production');
    }

    // The optional-var defaults above set localhost values; in production those
    // must be explicitly configured, otherwise the app silently runs against a
    // local Redis / permissive CORS that will not exist in prod.
    const corsOrigins = process.env.CORS_ORIGINS;
    if (!corsOrigins || corsOrigins === '*') {
      productionErrors.push('CORS_ORIGINS must be explicitly set in production (not "*")');
    } else if (/localhost|127\.0\.0\.1/.test(corsOrigins)) {
      productionErrors.push('CORS_ORIGINS must not point at localhost in production');
    }

    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      productionErrors.push('REDIS_URL must be explicitly set in production');
    } else if (/localhost|127\.0\.0\.1/.test(redisUrl)) {
      productionErrors.push('REDIS_URL must not point at localhost in production');
    }

    if (productionErrors.length > 0) {
      productionErrors.forEach((err) => Logger.error(err));
      Logger.error('Refusing to start with an insecure/incomplete production configuration.');
      process.exit(1);
    }
  }
  
  Logger.log('Environment validation passed ✓');
}

