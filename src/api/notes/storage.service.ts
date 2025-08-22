import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';

const ROOT = resolve(process.cwd(), 'storage');

export class LocalStorageService {
  async saveAttachment(tenantId: string, noteId: string, filename: string, content: Buffer) {
    const dir = join(ROOT, tenantId, 'notes', noteId);
    await fs.mkdir(dir, { recursive: true });
    const id = randomUUID();
    const path = join(dir, id + '_' + filename);
    await fs.writeFile(path, content);
    return path;
  }

  async signUrl(path: string): Promise<string> {
    // Simple dev stub
    return `http://localhost:${process.env.PORT || 3000}/dev-signed-url/${encodeURIComponent(path)}`;
  }
} 