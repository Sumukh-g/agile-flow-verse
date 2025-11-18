"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RedisClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisClient = void 0;
exports.getRedis = getRedis;
const common_1 = require("@nestjs/common");
// Singleton instance for getRedis() function
let redisInstance = null;
let RedisClient = RedisClient_1 = class RedisClient {
    constructor() {
        this.logger = new common_1.Logger(RedisClient_1.name);
        this.mockCache = new Map();
        this.connected = false;
    }
    async onModuleInit() {
        // In development, use in-memory cache if Redis not available
        if (process.env.REDIS_URL) {
            this.logger.log('Redis URL configured, using in-memory fallback for development');
        }
        else {
            this.logger.warn('Redis not configured, using in-memory cache');
        }
        this.connected = true;
        redisInstance = this;
    }
    async get(key) {
        return this.mockCache.get(key) || null;
    }
    async set(key, value) {
        this.mockCache.set(key, value);
    }
    async setex(key, seconds, value) {
        this.mockCache.set(key, value);
        // In a real implementation, this would expire after 'seconds'
        setTimeout(() => {
            this.mockCache.delete(key);
        }, seconds * 1000);
    }
    async del(key) {
        const existed = this.mockCache.has(key);
        this.mockCache.delete(key);
        return existed ? 1 : 0;
    }
    async exists(key) {
        return this.mockCache.has(key) ? 1 : 0;
    }
    async ping() {
        return 'PONG';
    }
    async expire(key, seconds) {
        if (this.mockCache.has(key)) {
            setTimeout(() => {
                this.mockCache.delete(key);
            }, seconds * 1000);
            return 1;
        }
        return 0;
    }
    async incr(key) {
        const current = this.mockCache.get(key);
        const newValue = current ? parseInt(current, 10) + 1 : 1;
        this.mockCache.set(key, newValue.toString());
        return newValue;
    }
};
exports.RedisClient = RedisClient;
exports.RedisClient = RedisClient = RedisClient_1 = __decorate([
    (0, common_1.Injectable)()
], RedisClient);
// Export getRedis function for backward compatibility
function getRedis() {
    if (!redisInstance) {
        // Create a temporary instance if not initialized yet
        redisInstance = new RedisClient();
        redisInstance.onModuleInit();
    }
    return redisInstance;
}
