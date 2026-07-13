// @vitest-environment node
import { expect, it } from 'vitest';
import config from '../../vite.config';

it('excludes nested git worktrees from the main test suite', () => {
  expect(config).toMatchObject({
    test: {
      exclude: expect.arrayContaining(['**/.worktrees/**']),
    },
  });
});
