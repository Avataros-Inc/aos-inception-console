import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ConfigProvider, useConfig } from '../ConfigContext';
import { mockApiResponses } from '../../test/testUtils';

// Mock the postgrestAPI module
vi.mock('../../postgrestAPI', () => ({
  getEnvironments: vi.fn(),
}));

const mockCharacters = mockApiResponses.characters;

function createWrapper(characters = mockCharacters) {
  return function Wrapper({ children }) {
    return (
      <ConfigProvider characters={characters}>
        {children}
      </ConfigProvider>
    );
  };
}

describe('ConfigContext', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Mock getEnvironments
    const { getEnvironments } = await import('../../postgrestAPI');
    getEnvironments.mockResolvedValue(mockApiResponses.environments);
  });

  it('provides initial config with first character', () => {
    const { result } = renderHook(() => useConfig(), {
      wrapper: createWrapper(),
    });

    expect(result.current.config.avatar).toBe('1');
    expect(result.current.characters).toEqual(mockCharacters);
  });

  it('updates config when updateConfig is called', () => {
    const { result } = renderHook(() => useConfig(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.updateConfig('avatar', '2');
    });

    expect(result.current.config.avatar).toBe('2');
  });

  it('handles nested config updates', () => {
    const { result } = renderHook(() => useConfig(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.updateConfig('voice_config.voice_id', 'new-voice');
    });

    expect(result.current.config.voice_config.voice_id).toBe('new-voice');
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useConfig());
    }).toThrow('useConfig must be used within a ConfigProvider');
    
    consoleSpy.mockRestore();
  });
});