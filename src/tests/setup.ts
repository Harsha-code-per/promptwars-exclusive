import '@testing-library/jest-dom';

// Polyfill window.localStorage for jsdom test suite
if (typeof window !== 'undefined') {
  const store: Record<string, string> = {};
  const mockStorage: Storage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => {
      store[key] = String(val);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const key of Object.keys(store)) {
        delete store[key];
      }
    },
    length: Object.keys(store).length,
    key: (index: number) => Object.keys(store)[index] || null,
  };

  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
  });

  // Mock window.print
  window.print = () => {};

  // Mock scrollIntoView
  window.HTMLElement.prototype.scrollIntoView = () => {};
}
