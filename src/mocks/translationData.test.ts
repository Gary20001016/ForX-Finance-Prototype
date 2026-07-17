import { describe, expect, it } from 'vitest';
import { templates, translationBatches } from './data';

describe('translation fixtures', () => {
  it('models external jobs and blocks templates with incomplete locale reviews', () => {
    const partial = translationBatches.find((batch) => batch.status === '无结果');

    expect(partial?.items.some((item) => item.externalTaskId && item.status === '无结果')).toBe(true);
    expect(templates.some((template) => template.translationReadiness !== '已通过')).toBe(true);
  });
});
