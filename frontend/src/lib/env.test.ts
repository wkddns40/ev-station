import { describe, expect, it } from 'vitest';
import { VITE_API_BASE_URL, VITE_DEMO_MODE } from './env';

describe('env accessor', () => {
  it('VITE_DEMO_MODE is a boolean', () => {
    expect(typeof VITE_DEMO_MODE).toBe('boolean');
  });

  it('VITE_API_BASE_URL is a string (empty string when unset)', () => {
    expect(typeof VITE_API_BASE_URL).toBe('string');
  });
});
