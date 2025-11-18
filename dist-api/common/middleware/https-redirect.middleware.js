"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpsRedirectMiddleware = void 0;
const common_1 = require("@nestjs/common");
let HttpsRedirectMiddleware = class HttpsRedirectMiddleware {
    use(req, res, next) {
        // Only enforce HTTPS in production
        if (process.env.NODE_ENV === 'production') {
            // Check if request is not secure
            // req.secure checks if connection is over TLS/SSL
            // x-forwarded-proto header is set by load balancers/proxies
            const isSecure = req.secure || req.get('x-forwarded-proto') === 'https';
            if (!isSecure) {
                // Redirect to HTTPS
                const host = req.get('host');
                const redirectUrl = `https://${host}${req.url}`;
                return res.redirect(301, redirectUrl);
            }
        }
        next();
    }
};
exports.HttpsRedirectMiddleware = HttpsRedirectMiddleware;
exports.HttpsRedirectMiddleware = HttpsRedirectMiddleware = __decorate([
    (0, common_1.Injectable)()
], HttpsRedirectMiddleware);
