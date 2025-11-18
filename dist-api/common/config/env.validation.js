"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnvironment = validateEnvironment;
const common_1 = require("@nestjs/common");
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
function validateEnvironment() {
    const missing = requiredEnvVars.filter(key => !process.env[key]);
    // Set defaults for optional variables
    Object.entries(optionalEnvVars).forEach(([key, defaultValue]) => {
        if (!process.env[key]) {
            process.env[key] = defaultValue;
            common_1.Logger.warn(`Using default value for ${key}: ${defaultValue}`);
        }
    });
    if (missing.length > 0) {
        common_1.Logger.error(`Missing required environment variables: ${missing.join(', ')}`);
        common_1.Logger.error('Please check your .env file and ensure all required variables are set.');
        process.exit(1);
    }
    if (process.env.NODE_ENV === 'production') {
        // Additional production checks
        if (process.env.JWT_SECRET?.includes('change-in-production')) {
            common_1.Logger.error('Cannot use default JWT_SECRET in production');
            process.exit(1);
        }
        if (process.env.JWT_REFRESH_SECRET?.includes('change-in-production')) {
            common_1.Logger.error('Cannot use default JWT_REFRESH_SECRET in production');
            process.exit(1);
        }
        if (!process.env.CORS_ORIGINS || process.env.CORS_ORIGINS === '*') {
            common_1.Logger.error('CORS_ORIGINS must be explicitly set in production (not *)');
            process.exit(1);
        }
    }
    common_1.Logger.log('Environment validation passed ✓');
}
