"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorrelationIdMiddleware = CorrelationIdMiddleware;
const crypto_1 = require("crypto");
function CorrelationIdMiddleware(req, _res, next) {
    const existing = req.headers['x-trace-id'];
    req.traceId = existing || (0, crypto_1.randomUUID)();
    next();
}
