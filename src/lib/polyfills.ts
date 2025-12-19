// Polyfill for indexedDB during SSR/Node.
// Some libraries (e.g. Blockly) touch indexedDB at module-evaluation time.
// Ensure the global exists so imports don't throw ReferenceError on the server.
const globalObject =
  typeof globalThis !== "undefined"
    ? (globalThis as { indexedDB?: IDBFactory | undefined })
    : undefined;

if (globalObject && typeof globalObject.indexedDB === "undefined") {
  // Prefer the browser implementation when available, otherwise stub as undefined.
  globalObject.indexedDB =
    typeof window !== "undefined" ? window.indexedDB : undefined;
}

export const indexedDB = globalObject?.indexedDB;
