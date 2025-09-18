import '@testing-library/jest-dom';

// Use staging environment for testing (loaded from .env file)
// This allows tests to run against real backend services

// Mock only browser-specific APIs that don't exist in test environment
// But keep fetch available for real API calls to staging

// Mock WebSocket for components that use it (but don't prevent real websocket usage)
global.WebSocket = vi.fn().mockImplementation(() => ({
  close: vi.fn(),
  send: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1, // OPEN
}));

// Mock browser-specific APIs
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock localStorage for browser storage
const localStorageMock = {
  getItem: vi.fn((key) => {
    if (key === 'session') {
      // Return a mock session token for testing
      return JSON.stringify({
        token: 'mock-staging-token',
        org_id: 'test-org-id',
      });
    }
    return null;
  }),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Add environment info for debugging
console.log('Test environment API URL:', import.meta.env?.VITE_API_BASE_URL || 'Not set');