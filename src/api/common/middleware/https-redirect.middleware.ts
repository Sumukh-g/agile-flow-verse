import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class HttpsRedirectMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
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
}

