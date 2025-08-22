import type { Prisma, PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContextStore = {
  traceId: string;
  tenantId: string;
  userId: string | null;
  roles: string[];
  prisma: PrismaClient | Prisma.TransactionClient;
};

export const requestContext = new AsyncLocalStorage<RequestContextStore>(); 