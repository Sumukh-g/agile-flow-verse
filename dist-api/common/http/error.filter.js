"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ErrorFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorFilter = void 0;
const common_1 = require("@nestjs/common");
let ErrorFilter = ErrorFilter_1 = class ErrorFilter {
    constructor() {
        this.logger = new common_1.Logger(ErrorFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();
        const req = ctx.getRequest();
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const traceId = req.headers['x-trace-id'] || req.traceId;
        const code = exception?.response?.code ||
            (exception instanceof common_1.HttpException ? exception.name : 'InternalServerError');
        const message = exception?.response?.message ||
            exception?.message ||
            'An unexpected error occurred';
        const details = exception?.response?.details || undefined;
        // Log error for tracking
        const errorContext = {
            traceId,
            status,
            code,
            method: req.method,
            url: req.url,
            userId: req.user?.id,
            tenantId: req.headers['x-tenant-id'],
            userAgent: req.headers['user-agent'],
            ip: req.ip,
        };
        if (status >= 500) {
            // Server errors - log with full context
            this.logger.error(`${code}: ${message}`, exception.stack, JSON.stringify(errorContext));
            // In production, send to error tracking service
            if (process.env.NODE_ENV === 'production') {
                // TODO: Integrate with Sentry/Datadog
                // errorTracker.captureException(exception, errorContext);
            }
        }
        else if (status >= 400) {
            // Client errors - log at warn level
            this.logger.warn(`${code}: ${message}`, JSON.stringify(errorContext));
        }
        // Don't expose internal error details in production
        const isProduction = process.env.NODE_ENV === 'production';
        const shouldExposeDetails = !isProduction || status < 500;
        res.status(status).json({
            traceId,
            code,
            message: shouldExposeDetails ? message : 'An unexpected error occurred',
            ...(shouldExposeDetails && details ? { details } : {}),
            ...(shouldExposeDetails && !isProduction ? { stack: exception.stack } : {}),
        });
    }
};
exports.ErrorFilter = ErrorFilter;
exports.ErrorFilter = ErrorFilter = ErrorFilter_1 = __decorate([
    (0, common_1.Catch)()
], ErrorFilter);
