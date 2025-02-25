import 'cross-fetch/polyfill';

// Re-export the global fetch function
const fetchPolyfill = globalThis.fetch;
export default fetchPolyfill; 