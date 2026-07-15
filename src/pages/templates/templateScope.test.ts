import { describe, expect, it } from 'vitest';
import type {
  MessageTask,
  MessageTemplate,
  RuleContentVersion,
} from '../../domain/types';
import {
  inferTemplateUsageScope,
  normalizeTemplateUsageScopes,
  templateSupportsScope,
} from './templateScope';

const template = (usageScope: MessageTemplate['usageScope']) =>
  ({ id: 'TPL-1', usageScope }) as MessageTemplate;

describe('template workflow scope', () => {
  it('shows shared templates in both views without leaking dedicated templates', () => {
    expect(templateSupportsScope(template('manual'), 'manual')).toBe(true);
    expect(templateSupportsScope(template('manual'), 'event')).toBe(false);
    expect(templateSupportsScope(template('event'), 'manual')).toBe(false);
    expect(templateSupportsScope(template('shared'), 'manual')).toBe(true);
    expect(templateSupportsScope(template('shared'), 'event')).toBe(true);
  });

  it('infers legacy scope from artificial tasks and event content versions', () => {
    const manualTasks = [
      { templateId: 'TPL-MANUAL', triggerType: 'manual' },
      { templateId: 'TPL-SHARED', triggerType: 'manual' },
      { templateId: 'TPL-LEGACY-EVENT', triggerType: 'event' },
    ] as MessageTask[];
    const eventVersions = [
      { templateId: 'TPL-EVENT' },
      { templateId: 'TPL-SHARED' },
    ] as RuleContentVersion[];

    expect(
      inferTemplateUsageScope('TPL-MANUAL', manualTasks, eventVersions),
    ).toBe('manual');
    expect(
      inferTemplateUsageScope('TPL-EVENT', manualTasks, eventVersions),
    ).toBe('event');
    expect(
      inferTemplateUsageScope('TPL-LEGACY-EVENT', manualTasks, eventVersions),
    ).toBe('event');
    expect(
      inferTemplateUsageScope('TPL-SHARED', manualTasks, eventVersions),
    ).toBe('shared');
    expect(
      inferTemplateUsageScope('TPL-UNUSED', manualTasks, eventVersions),
    ).toBe('shared');
  });

  it('fills only missing scope values during legacy migration', () => {
    const templates = [
      { id: 'TPL-MANUAL' },
      { id: 'TPL-EVENT' },
      { id: 'TPL-PRESERVED', usageScope: 'manual' },
    ] as MessageTemplate[];
    const tasks = [
      { templateId: 'TPL-MANUAL', triggerType: 'manual' },
    ] as MessageTask[];
    const versions = [{ templateId: 'TPL-EVENT' }] as RuleContentVersion[];

    expect(normalizeTemplateUsageScopes(templates, tasks, versions)).toEqual([
      expect.objectContaining({ id: 'TPL-MANUAL', usageScope: 'manual' }),
      expect.objectContaining({ id: 'TPL-EVENT', usageScope: 'event' }),
      expect.objectContaining({ id: 'TPL-PRESERVED', usageScope: 'manual' }),
    ]);
  });
});
