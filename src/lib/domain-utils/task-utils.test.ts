import {
  getPriorityFromLabel,
  getPriorityLabel,
  getStatusFromLabel,
  getStatusLabel,
} from './task-utils';

describe('task-utils mapping', () => {
  it('maps API task status values to UI labels', () => {
    expect(getStatusLabel('todo')).toBe('To Do');
    expect(getStatusLabel('in-progress')).toBe('In Progress');
    expect(getStatusLabel('blocked')).toBe('Blocked');
    expect(getStatusLabel('cancelled')).toBe('Cancelled');
  });

  it('maps UI status labels back to API values', () => {
    expect(getStatusFromLabel('To Do')).toBe('todo');
    expect(getStatusFromLabel('In Progress')).toBe('in-progress');
    expect(getStatusFromLabel('Blocked')).toBe('blocked');
    expect(getStatusFromLabel('Cancelled')).toBe('cancelled');
  });

  it('maps API priorities and UI labels consistently', () => {
    expect(getPriorityLabel('critical')).toBe('Critical');
    expect(getPriorityFromLabel('Critical')).toBe('critical');
    expect(getPriorityFromLabel('High')).toBe('high');
  });
});
