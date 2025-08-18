// Polyfills for browser compatibility
import { Buffer } from 'buffer';

// Make Buffer available globally
window.global = window.global ?? window;
window.Buffer = window.Buffer ?? Buffer;
window.process = window.process ?? { env: {} };