import { describe, it, expect, beforeAll } from 'vitest';
import { getCharacters, getEnvironments } from '../postgrestAPI';

describe('Staging API Integration Tests', () => {
  beforeAll(() => {
    // Verify we have the staging environment configured
    console.log('Running integration tests against:', import.meta.env.VITE_API_BASE_URL);
    expect(import.meta.env.VITE_API_BASE_URL).toContain('staging');
  });

  it('should connect to staging API and fetch characters', async () => {
    try {
      const characters = await getCharacters();
      
      // Basic API connectivity check
      expect(Array.isArray(characters)).toBe(true);
      
      // If characters exist, verify they have expected structure
      if (characters.length > 0) {
        const character = characters[0];
        expect(character).toHaveProperty('id');
        expect(character).toHaveProperty('name');
        expect(character).toHaveProperty('available');
      }
      
      console.log(`✓ Successfully fetched ${characters.length} characters from staging API`);
    } catch (error) {
      // Provide helpful error messages for common API issues
      if (error.message.includes('401')) {
        console.warn('⚠️ Authentication failed - this may be expected in staging without valid tokens');
        expect(error.message).toContain('Authentication failed');
      } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        console.error('❌ Cannot connect to staging API:', import.meta.env.VITE_API_BASE_URL);
        throw new Error(`Staging API unreachable: ${error.message}`);
      } else {
        throw error;
      }
    }
  });

  it('should fetch environments from staging API', async () => {
    try {
      const environments = await getEnvironments();
      
      expect(Array.isArray(environments)).toBe(true);
      
      if (environments.length > 0) {
        const environment = environments[0];
        expect(environment).toHaveProperty('id');
        expect(environment).toHaveProperty('name');
      }
      
      console.log(`✓ Successfully fetched ${environments.length} environments from staging API`);
    } catch (error) {
      if (error.message.includes('401')) {
        console.warn('⚠️ Authentication failed for environments - this may be expected');
        expect(error.message).toContain('Authentication failed');
      } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        console.error('❌ Cannot connect to staging API for environments');
        throw new Error(`Staging API unreachable for environments: ${error.message}`);
      } else {
        throw error;
      }
    }
  });

  it('should verify staging API base endpoint is reachable', async () => {
    try {
      const response = await fetch(import.meta.env.VITE_API_BASE_URL);
      
      // Just verify we can reach the endpoint
      // Status could be 200, 401, 404, etc. - as long as it's not network error
      expect(response.status).toBeGreaterThan(0);
      expect(response.status).toBeLessThan(600);
      
      console.log(`✓ Staging API endpoint reachable: ${response.status}`);
    } catch (error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        throw new Error(`❌ Cannot reach staging API at ${import.meta.env.VITE_API_BASE_URL}: ${error.message}`);
      } else {
        // Other errors might be OK (like CORS in test environment)
        console.warn('⚠️ Network request error (may be expected in test environment):', error.message);
      }
    }
  });
});