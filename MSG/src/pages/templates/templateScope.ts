import type {
  MessageTask,
  MessageTemplate,
  RuleContentVersion,
  TemplateUsageScope,
} from '../../domain/types';

type EntryScope = Exclude<TemplateUsageScope, 'shared'>;

export const isReusableMessageTemplate = (
  template: Pick<MessageTemplate, 'owner'>,
) => template.owner !== '临时任务';

export const templateSupportsScope = (
  template: Pick<MessageTemplate, 'usageScope'>,
  scope: EntryScope,
) => {
  const usageScope = template.usageScope || 'shared';
  return usageScope === scope || usageScope === 'shared';
};

export const inferTemplateUsageScope = (
  templateId: string,
  tasks: Array<Pick<MessageTask, 'templateId' | 'triggerType'>>,
  ruleVersions: Array<Pick<RuleContentVersion, 'templateId'>>,
): TemplateUsageScope => {
  const usedByManualTask = tasks.some(
    (task) => task.templateId === templateId && task.triggerType !== 'event',
  );
  const usedByEvent =
    tasks.some(
      (task) => task.templateId === templateId && task.triggerType === 'event',
    ) || ruleVersions.some((version) => version.templateId === templateId);
  if (usedByManualTask && !usedByEvent) return 'manual';
  if (usedByEvent && !usedByManualTask) return 'event';
  return 'shared';
};

export const normalizeTemplateUsageScopes = (
  templates: MessageTemplate[],
  tasks: Array<Pick<MessageTask, 'templateId' | 'triggerType'>>,
  ruleVersions: Array<Pick<RuleContentVersion, 'templateId'>>,
): MessageTemplate[] =>
  templates.map((template) => ({
    ...template,
    usageScope:
      template.usageScope ||
      inferTemplateUsageScope(template.id, tasks, ruleVersions),
  }));
