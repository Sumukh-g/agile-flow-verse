"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStorageService = void 0;
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const path_1 = require("path");
const ROOT = (0, path_1.resolve)(process.cwd(), 'storage');
class LocalStorageService {
    async saveAttachment(tenantId, noteId, filename, content) {
        const dir = (0, path_1.join)(ROOT, tenantId, 'notes', noteId);
        await fs_1.promises.mkdir(dir, { recursive: true });
        const id = (0, crypto_1.randomUUID)();
        const path = (0, path_1.join)(dir, id + '_' + filename);
        await fs_1.promises.writeFile(path, content);
        return path;
    }
    async signUrl(path) {
        // Simple dev stub
        return `http://localhost:${process.env.PORT || 3000}/dev-signed-url/${encodeURIComponent(path)}`;
    }
}
exports.LocalStorageService = LocalStorageService;
