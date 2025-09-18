import React from 'react';
import { render } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { ConfigProvider } from '../contexts/ConfigContext';
import { AvatarLivestreamProvider } from '../contexts/AvatarLivestreamContext';

// Mock characters for testing
const mockCharacters = [
  {
    id: '1',
    name: 'Test Avatar',
    a2f_config: {},
    voice_config: {},
    llm_config: {},
  },
];

// Custom render function with all providers
export function renderWithProviders(ui, { characters = mockCharacters, ...renderOptions } = {}) {
  function Wrapper({ children }) {
    return (
      <HashRouter>
        <AvatarLivestreamProvider>
          <ConfigProvider characters={characters}>
            {children}
          </ConfigProvider>
        </AvatarLivestreamProvider>
      </HashRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock API responses
export const mockApiResponses = {
  characters: mockCharacters,
  environments: [
    {
      id: 'env-1',
      name: 'Test Environment',
      path: 'TestEnv',
    },
  ],
  liveSessions: [],
};

// Helper function to mock fetch responses
export function mockFetchResponse(data, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

// Helper to mock JWT tokens
export function mockJwtToken(payload = { org_id: 'test-org', exp: Date.now() / 1000 + 3600 }) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const signature = 'mock-signature';
  return `${header}.${body}.${signature}`;
}