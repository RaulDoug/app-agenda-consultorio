if (typeof window !== 'undefined') {
  await import('@testing-library/jest-dom');
  await import('fake-indexeddb/auto');

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
