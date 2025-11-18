/**
 * AI Agents API Client
 */

import { apiClient } from '../api-client';
import {
  Agent,
  AgentRun,
  RunAgentDto,
} from './types';

export const agentsApi = {
  /**
   * Get all agents
   */
  async getAgents(): Promise<Agent[]> {
    // Note: This endpoint might need to be added to the backend
    return apiClient.get('/agents');
  },

  /**
   * Get a single agent by ID
   */
  async getAgent(id: string): Promise<Agent> {
    return apiClient.get(`/agents/${id}`);
  },

  /**
   * Run an agent with input data
   */
  async runAgent(data: RunAgentDto): Promise<AgentRun> {
    return apiClient.post('/agents/run', data);
  },

  /**
   * Get agent run history
   */
  async getAgentRuns(agentId?: string, limit = 50): Promise<AgentRun[]> {
    return apiClient.get('/agents/runs', { params: { agentId, limit } });
  },

  /**
   * Get a specific agent run
   */
  async getAgentRun(id: string): Promise<AgentRun> {
    return apiClient.get(`/agents/runs/${id}`);
  },

  /**
   * AI-powered actions
   */
  ai: {
    /**
     * General chat endpoint with provider/model selection
     */
    async chat(payload: {
      provider?: 'openai' | 'google' | 'gemini' | 'perplexity';
      model?: string;
      messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
      temperature?: number;
      maxTokens?: number;
    }): Promise<{ content: string }> {
      return apiClient.post('/agents/chat', payload);
    },

    /**
     * Generate tasks from a description
     */
    async generateTasks(description: string, projectId: string): Promise<{ tasks: Array<{ title: string; description: string; priority: string }> }> {
      return apiClient.post('/ai/generate-tasks', { description, projectId });
    },

    /**
     * Summarize notes
     */
    async summarizeNotes(noteIds: string[]): Promise<{ summary: string }> {
      return apiClient.post('/ai/summarize-notes', { noteIds });
    },

    /**
     * Generate project update message
     */
    async generateUpdate(projectId: string, timePeriod?: string): Promise<{ message: string }> {
      return apiClient.post('/ai/generate-update', { projectId, timePeriod });
    },

    /**
     * Analyze workflow
     */
    async analyzeWorkflow(workflowId: string): Promise<{ analysis: string; suggestions: string[] }> {
      return apiClient.post('/ai/analyze-workflow', { workflowId });
    },
  },
};

