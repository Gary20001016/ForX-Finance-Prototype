import '@testing-library/jest-dom/vitest';
import { Message } from '@arco-design/web-react';
import { act } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { resetPrototypeStore } from '../store/prototypeStore';

beforeEach(() => resetPrototypeStore());

afterEach(async () => {
  // Arco's global Message uses a portal whose transition outlives the rendered
  // page. Close it explicitly and drain exit/DatePicker callbacks before jsdom
  // removes `window`.
  await act(async () => {
    Message.clear();
    await new Promise((resolve) => setTimeout(resolve, 350));
  });
});

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
