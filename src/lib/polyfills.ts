// Polyfill for indexedDB during SSR
// This provides a stub so that code trying to access indexedDB during SSR doesn't crash

// Export a no-op object that matches the indexedDB interface structure
export const indexedDB =
  typeof window !== "undefined"
    ? window.indexedDB
    : (undefined as unknown as IDBFactory);
