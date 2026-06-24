import { EventEmitter } from 'events';
import type { Request, Response, NextFunction } from 'express';
import type { AuthService } from '../../../application/services/AuthService.js';

export function createAuthMiddleware(authService: AuthService) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized', message: 'Missing token' });
      return;
    }
    const token = header.slice(7);
    const user = authService.verifyToken(token);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
      return;
    }
    (req as Request & { user: typeof user }).user = user;
    next();
  };
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
}

export const eventBus = new EventEmitter();
