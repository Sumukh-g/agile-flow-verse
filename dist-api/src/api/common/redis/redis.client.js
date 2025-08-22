"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedis = getRedis;
const ioredis_1 = __importDefault(require("ioredis"));
let client = null;
function getRedis() {
    if (!client) {
        const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
        client = new ioredis_1.default(url, { lazyConnect: true });
        client.on('error', (e) => console.error('Redis error', e));
    }
    return client;
}
