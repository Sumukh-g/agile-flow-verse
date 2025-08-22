"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeCursor = encodeCursor;
exports.decodeCursor = decodeCursor;
function encodeCursor(value) {
    return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}
function decodeCursor(cursor) {
    if (!cursor)
        return null;
    try {
        return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    }
    catch {
        return null;
    }
}
