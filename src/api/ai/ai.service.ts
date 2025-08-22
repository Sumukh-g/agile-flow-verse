import { z } from 'zod';

const createTaskInput = z.object({
  title: z.string().min(1),
  projectId: z.string().min(1),
  description: z.string().optional(),
});
const summarizeNotesInput = z.object({
  noteIds: z.array(z.string()).min(1),
});
const postUpdateInput = z.object({
  message: z.string().min(1),
});

export type AgentRole = 'Intake' | 'Planner' | 'Comms' | 'Summarizer';

export class AiService {
  // Stubs that enforce schemas; provider integration added later
  async toolCreateTask(input: z.infer<typeof createTaskInput>) {
    createTaskInput.parse(input);
    return { ok: true, tool: 'createTask', input };
  }
  async toolSummarizeNotes(input: z.infer<typeof summarizeNotesInput>) {
    summarizeNotesInput.parse(input);
    return { ok: true, tool: 'summarizeNotes', input, summary: '(mock summary)' };
  }
  async toolPostUpdate(input: z.infer<typeof postUpdateInput>) {
    postUpdateInput.parse(input);
    return { ok: true, tool: 'postUpdate', input };
  }
} 