/**
 * Automation/Workflow API Client
 */

import { apiClient } from '../api-client';
import {
  Workflow,
  CreateWorkflowDto,
  UpdateWorkflowDto,
  WorkflowExecution,
  TestWorkflowResult,
} from './types';

export const automationApi = {
  /**
   * Get all workflows
   */
  async getWorkflows(projectId?: string): Promise<Workflow[]> {
    return apiClient.get('/automation/workflows', { params: { projectId } });
  },

  /**
   * Get a single workflow by ID
   */
  async getWorkflow(id: string): Promise<Workflow> {
    return apiClient.get(`/automation/workflows/${id}`);
  },

  /**
   * Create a new workflow
   */
  async createWorkflow(data: CreateWorkflowDto): Promise<Workflow> {
    return apiClient.post('/automation/workflows', data);
  },

  /**
   * Update an existing workflow
   */
  async updateWorkflow(id: string, data: UpdateWorkflowDto): Promise<Workflow> {
    return apiClient.put(`/automation/workflows/${id}`, data);
  },

  /**
   * Delete a workflow
   */
  async deleteWorkflow(id: string): Promise<void> {
    return apiClient.delete(`/automation/workflows/${id}`);
  },

  /**
   * Test a workflow with sample data
   */
  async testWorkflow(id: string, sampleData: any): Promise<TestWorkflowResult> {
    return apiClient.post(`/automation/workflows/${id}/test`, sampleData);
  },

  /**
   * Get workflow execution history
   */
  async getExecutions(workflowId: string, limit = 50): Promise<WorkflowExecution[]> {
    // Note: This endpoint might need to be added to the backend
    return apiClient.get(`/automation/workflows/${workflowId}/executions`, { params: { limit } });
  },
};

