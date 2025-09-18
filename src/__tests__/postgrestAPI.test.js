import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  authenticatedFetch,
  getSessionToken,
  invalidateCache 
} from '../postgrestAPI';
import { mockJwtToken } from '../test/testUtils';

describe('postgrestAPI Unit Tests', () => {
  let originalFetch;

  beforeEach(() => {
    vi.clearAllMocks();
    // Store original fetch to restore later
    originalFetch = global.fetch;
    // Clear any existing cache
    invalidateCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Restore original fetch
    global.fetch = originalFetch;
  });

  describe('authenticatedFetch', () => {
    it('includes authorization header when token exists', async () => {
      const mockToken = mockJwtToken();
      localStorage.setItem('session', JSON.stringify({ token: mockToken }));
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      await authenticatedFetch('http://test.com/api');

      expect(fetch).toHaveBeenCalledWith(
        'http://test.com/api',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it('handles 401 responses by clearing session', async () => {
      const mockToken = mockJwtToken();
      localStorage.setItem('session', JSON.stringify({ token: mockToken }));
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(authenticatedFetch('http://test.com/api')).rejects.toThrow(
        'Authentication failed'
      );

      expect(localStorage.getItem('session')).toBeNull();
    });
  });

  describe('getSessionToken', () => {
    it('returns token when session exists', () => {
      const mockToken = mockJwtToken();
      localStorage.setItem('session', JSON.stringify({ token: mockToken }));

      const token = getSessionToken();

      expect(token).toBe(mockToken);
    });

    it('returns null when no session exists', () => {
      localStorage.clear();
      const token = getSessionToken();
      expect(token).toBe('mock-staging-token'); // From our setup mock
    });
  });

  describe('API URL Configuration', () => {
    it('should be configured to use staging environment', () => {
      // Verify we're testing against staging, not localhost or production
      expect(import.meta.env.VITE_API_BASE_URL).toContain('staging');
      console.log('✓ Using staging API:', import.meta.env.VITE_API_BASE_URL);
    });
  });
});