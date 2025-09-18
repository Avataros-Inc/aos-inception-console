import { describe, it, expect } from 'vitest';

describe('Sample test', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2);
  });

  it('should verify test environment is working', () => {
    expect(typeof describe).toBe('function');
    expect(typeof it).toBe('function');
    expect(typeof expect).toBe('function');
  });
});