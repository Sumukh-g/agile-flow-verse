"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const zod_1 = require("zod");
const createTaskInput = zod_1.z.object({
    title: zod_1.z.string().min(1),
    projectId: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
});
const summarizeNotesInput = zod_1.z.object({
    noteIds: zod_1.z.array(zod_1.z.string()).min(1),
});
const postUpdateInput = zod_1.z.object({
    message: zod_1.z.string().min(1),
});
class AiService {
    // Stubs that enforce schemas; provider integration added later
    async toolCreateTask(input) {
        createTaskInput.parse(input);
        return { ok: true, tool: 'createTask', input };
    }
    async toolSummarizeNotes(input) {
        summarizeNotesInput.parse(input);
        return { ok: true, tool: 'summarizeNotes', input, summary: '(mock summary)' };
    }
    async toolPostUpdate(input) {
        postUpdateInput.parse(input);
        return { ok: true, tool: 'postUpdate', input };
    }
}
exports.AiService = AiService;
