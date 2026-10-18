import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

if (typeof window !== 'undefined') {
  // Polyfill para matchMedia em ambiente de teste jsdom
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
