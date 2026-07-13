import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';
import { resetPrototypeStore } from '../store/prototypeStore';

beforeEach(() => resetPrototypeStore());

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}
