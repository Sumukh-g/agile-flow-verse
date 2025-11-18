"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = exports.LogLevel = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
    LogLevel[LogLevel["VERBOSE"] = 4] = "VERBOSE";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
let LoggerService = class LoggerService {
    constructor() {
        this.logger = new common_2.Logger('Application');
        this.logLevel = this.getLogLevelFromEnv();
    }
    getLogLevelFromEnv() {
        const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
        switch (level) {
            case 'ERROR':
                return LogLevel.ERROR;
            case 'WARN':
                return LogLevel.WARN;
            case 'INFO':
                return LogLevel.INFO;
            case 'DEBUG':
                return LogLevel.DEBUG;
            case 'VERBOSE':
                return LogLevel.VERBOSE;
            default:
                return LogLevel.INFO;
        }
    }
    log(message, context) {
        if (this.logLevel >= LogLevel.INFO) {
            this.logger.log(message, context);
        }
    }
    error(message, trace, context) {
        if (this.logLevel >= LogLevel.ERROR) {
            this.logger.error(message, trace, context);
            // In production, send to error tracking service
            if (process.env.NODE_ENV === 'production') {
                this.sendToErrorTracking(message, trace, context);
            }
        }
    }
    warn(message, context) {
        if (this.logLevel >= LogLevel.WARN) {
            this.logger.warn(message, context);
        }
    }
    debug(message, context) {
        if (this.logLevel >= LogLevel.DEBUG) {
            this.logger.debug(message, context);
        }
    }
    verbose(message, context) {
        if (this.logLevel >= LogLevel.VERBOSE) {
            this.logger.verbose(message, context);
        }
    }
    async sendToErrorTracking(message, trace, context) {
        // Integration point for Sentry/Datadog/etc
        // This would typically send errors to your error tracking service
        if (process.env.SENTRY_DSN) {
            // await Sentry.captureException(new Error(message), { extra: { trace, context } });
        }
        if (process.env.DATADOG_API_KEY) {
            // Send to Datadog
        }
    }
    setLogLevel(level) {
        this.logLevel = level;
    }
};
exports.LoggerService = LoggerService;
exports.LoggerService = LoggerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], LoggerService);
