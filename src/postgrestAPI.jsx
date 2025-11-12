// export const API_BASE_URL = 'http://192.168.4.118:8080';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;

// Event dispatcher for authentication errors
const authEventDispatcher = new EventTarget();

export const setSessionObj = (sessionObj) => {
  localStorage.setItem('session', JSON.stringify(sessionObj));
};

export const getSession = () => {
  const sessionStr = localStorage.getItem('session');
  return sessionStr ? JSON.parse(sessionStr) : null;
};

export const getSessionToken = () => {
  const sessionObj = getSession();
  return sessionObj?.token || null;
};

export const removeSession = () => {
  localStorage.removeItem('session');
};

export const getOrgId = () => {
  const sessionObj = getSession();
  return sessionObj?.org_id || null;
};

// Custom fetch wrapper that handles 401 responses
export const authenticatedFetch = async (url, options = {}) => {
  const token = getSessionToken();

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  // Handle 401 Unauthorized responses
  if (response.status === 401) {
    // For DELETE operations, log but don't auto-logout to prevent disruption
    if (options.method === 'DELETE') {
      console.warn('DELETE operation received 401 - this might be expected for ended sessions');
      // Don't automatically logout for DELETE operations
      return response;
    }

    // Clear the invalid session
    removeSession();

    // Dispatch auth error event
    authEventDispatcher.dispatchEvent(
      new CustomEvent('authError', {
        detail: { status: 401, message: 'Session expired. Please log in again.' },
      })
    );

    // Redirect to login
    window.location.hash = '/login';

    // Throw error to prevent further processing
    throw new Error('Authentication failed. Please log in again.');
  }

  return response;
};

// Function to listen for authentication errors
export const onAuthError = (callback) => {
  authEventDispatcher.addEventListener('authError', callback);

  // Return cleanup function
  return () => {
    authEventDispatcher.removeEventListener('authError', callback);
  };
};

// Hardcoded authorization token (will be replaced with cookie-based auth later)
// TODO: remove
const ORG_ID = getOrgId();

// Enhanced cache configuration with different TTL for different resources
const CACHE_CONFIG = {
  characters: { duration: 10 * 60 * 1000, maxAge: 30 * 60 * 1000 }, // 10 min default, 30 min max
  environments: { duration: 15 * 60 * 1000, maxAge: 60 * 60 * 1000 }, // 15 min default, 1 hour max
  sessions: { duration: 30 * 1000, maxAge: 2 * 60 * 1000 }, // 30 sec default, 2 min max (sessions change frequently)
  renders: { duration: 2 * 60 * 1000, maxAge: 10 * 60 * 1000 }, // 2 min default, 10 min max
};

// Cache storage with metadata
const cache = new Map();

// Request deduplication - prevent multiple simultaneous requests for the same resource
const pendingRequests = new Map();

/**
 * Enhanced caching system with request deduplication and per-resource TTL
 * @param {string} resourcePath - API resource path
 * @param {Object} options - Caching options
 * @param {boolean} options.forceRefresh - Bypass cache
 * @param {string} options.cacheKey - Custom cache key (default: resourcePath)
 * @param {number} options.ttl - Custom TTL in milliseconds
 * @param {string} options.query - Optional query string to append
 * @returns {Promise<Array>} Promise resolving to the requested data
 */
const fetchWithCache = async (resourcePath, options = {}) => {
  const { forceRefresh = false, query = '', ttl } = options;
  const cacheKey = `${resourcePath}${query}`;
  const now = Date.now();

  // Determine cache duration based on resource type
  const resourceType = resourcePath.split('/')[0];
  const cacheConfig = CACHE_CONFIG[resourceType] || { duration: 5 * 60 * 1000 }; // default 5 min
  const cacheDuration = ttl || cacheConfig.duration;

  // Check for existing pending request to avoid duplicates
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  // Check if we have valid cached data
  const cachedEntry = cache.get(cacheKey);
  if (!forceRefresh && cachedEntry && now - cachedEntry.timestamp < cacheDuration) {
    return cachedEntry.data;
  }

  // Create and store the request promise
  const requestPromise = (async () => {
    try {
      const endpoint = `${API_BASE_URL}/${resourcePath}${query}`;
      const response = await authenticatedFetch(endpoint, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      // Update cache with metadata
      cache.set(cacheKey, {
        data,
        timestamp: now,
        resourceType,
        hits: (cachedEntry?.hits || 0) + 1,
      });

      return data;
    } catch (error) {
      console.error(`Error fetching ${resourcePath}:`, error);
      throw error;
    } finally {
      // Remove from pending requests
      pendingRequests.delete(cacheKey);
    }
  })();

  // Store the promise to prevent duplicate requests
  pendingRequests.set(cacheKey, requestPromise);

  return requestPromise;
};

/**
 * Enhanced cache invalidation with smart cleanup
 * @param {string|null} resourcePath - Resource path to invalidate, or null for all
 * @param {Object} options - Invalidation options
 * @param {boolean} options.includeExpired - Also clean up expired entries
 */
export const invalidateCache = (resourcePath = null, options = {}) => {
  const { includeExpired = true } = options;
  const now = Date.now();

  if (resourcePath === null) {
    // Clear entire cache
    cache.clear();
    pendingRequests.clear();
  } else {
    // Clear specific resource and its queries
    const keysToDelete = [];
    for (const [key, entry] of cache.entries()) {
      if (key.startsWith(resourcePath)) {
        keysToDelete.push(key);
      } else if (includeExpired) {
        // Also cleanup expired entries while we're at it
        const cacheConfig = CACHE_CONFIG[entry.resourceType] || { maxAge: 30 * 60 * 1000 };
        if (now - entry.timestamp > cacheConfig.maxAge) {
          keysToDelete.push(key);
        }
      }
    }

    keysToDelete.forEach((key) => cache.delete(key));
  }
};

// Character-specific functions using the generic cache system

/**
 * Fetches all characters
 * @param {boolean} forceRefresh - If true, bypasses the cache
 * @returns {Promise<Array>} Promise resolving to character data
 */
export const getCharacters = async (forceRefresh = false) => {
  const query = '?available=eq.true';
  return fetchWithCache('characters', { query, forceRefresh });
};

/**
 * Fetches a specific character by ID
 * @param {number|string} id - Character ID
 * @param {boolean} forceRefresh - If true, bypasses the cache
 * @returns {Promise<Object>} Promise resolving to a character object
 */
export const getCharacterById = async (id, forceRefresh = false) => {
  const query = `?id=eq.${id}`;
  const result = await fetchWithCache('characters', { query, forceRefresh });
  return result[0]; // PostgREST returns an array, but we want the single object
};

/**
 * Invalidates the character cache
 */
export const invalidateCharacterCache = () => {
  invalidateCache('characters');
};

/**
 * Updates a specific field for a character
 * @param {string} id - Character ID to update
 * @param {string} key - Field name to update
 * @param {any} value - New value for the field
 * @returns {Promise<Object>} Promise resolving to the updated character
 */
export const updateCharacter = async (id, key, value) => {
  // Prepare the update payload with just the field to be updated
  const updateData = {
    [key]: value,
  };

  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/characters?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        Prefer: 'return=representation', // Ask PostgresREST to return the updated record
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const updatedCharacter = await response.json();

    //     // TODO: if "[]" is returned then the update was likely unsucessful, also the header is probs not 200
    if (updatedCharacter.length === 0) {
      throw new Error('Update failed - probably permissions');
    }

    // Invalidate the characters cache since we've made a change
    invalidateCache('characters');

    return updatedCharacter[0]; // PostgresREST returns an array
  } catch (error) {
    console.error(`Error updating character ${id}:`, error);
    throw error;
  }
};

export const insertRenderJob = async (jobtype, config, id = null) => {
  // Prepare the update payload with just the field to be updated
  const insertData = {
    jobtype: jobtype,
    config: config,
  };
  if (id !== null) {
    insertData['id'] = id;
  }

  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/renderjobs`, {
      method: 'POST',
      headers: {
        Prefer: 'return=representation', // Ask PostgresREST to return the updated record
      },
      body: JSON.stringify(insertData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const insertedRenderJob = await response.json();

    return insertedRenderJob[0]['id'];
  } catch (error) {
    console.error(`Error inserting render job:`, error);
    throw error;
  }
};

// TODO: limit to last 30 or do pagination
export const getRenderJobs = async () => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/renderjobs?org_id=eq.${ORG_ID}&order=created_at.desc`, {
      method: 'GET',
      headers: {
        Prefer: 'return=representation', // Ask PostgresREST to return the updated record
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const renderjobs = await response.json();

    return renderjobs;
  } catch (error) {
    console.error(`Error inserting render job:`, error);
    throw error;
  }
};

export const getRenderJob = async (jobId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/renderjobs?id=eq.${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getSessionToken()}`,
        Prefer: 'return=representation',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    const renderjobs = await response.json();
    return renderjobs[0];
  } catch (error) {
    console.error('Error fetching render job:', error);
    throw error;
  }
};

export const updateRenderJob = async (jobId, updates) => {
  try {
    const response = await fetch(`${API_BASE_URL}/renderjobs?id=eq.${jobId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getSessionToken()}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const updatedJob = await response.json();
    return updatedJob[0];
  } catch (error) {
    console.error(`Error updating render job ${jobId}:`, error);
    throw error;
  }
};

// Convenience functions using the generic update function
export const cancelRenderJob = (jobId) => updateRenderJob(jobId, { jobstatus: 2 }); // Suspended

export const retryRenderJob = (jobId) => updateRenderJob(jobId, { jobstatus: 0 }); // Unknown (or 6 for Pending)

export const getApiKeys = async () => {
  try {
    // ?select=*,org_users!fk_user_id(name,email)&org_id=eq.${ORG_ID}
    // ?org_id=eq.${ORG_ID}
    const response = await authenticatedFetch(
      `${API_BASE_URL}/apikeys?select=*,org_users!fk_user_id(name,email)&org_id=eq.${ORG_ID}`,
      {
        method: 'GET',
        headers: {
          Prefer: 'return=representation', // Ask PostgresREST to return the updated record
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const renderjobs = await response.json();

    return renderjobs;
  } catch (error) {
    console.error(`Error inserting render job:`, error);
    throw error;
  }
};

export const createApiKey = async ({ name, expires_at }) => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/apikeys`, {
      method: 'POST',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        name,
        expires_at,
        org_id: ORG_ID,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data; // Return the created API key
  } catch (error) {
    console.error('Error creating API key:', error);
    throw error;
  }
};

export const getPresignedUrl = async ({ fileName, fileType }) => {
  try {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/presigned?filename=${fileName}&contentType=${fileType}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const presignedUrlData = await response.json();
    return presignedUrlData;
  } catch (error) {
    console.error(`Error getting presigned URL:`, error);
    throw error;
  }
};

export const checkVideoStatus = async (renderJobID) => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/video/${renderJobID}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const videoData = await response.json();
    return videoData;
  } catch (error) {
    console.error(`Error checking video status:`, error);
    throw error;
  }
};

// New livestream API functions
// Create a new livestream session using the Swagger API
export const createLivestream = async (config) => {
  try {
    let environment_id = config.environment;

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(environment_id);

    if (!isUUID) {
      try {
        const environments = await getEnvironments();
        const environment = environments.find(
          (env) => env.name === environment_id || env.id === environment_id || env.path === environment_id
        );

        if (environment) {
          environment_id = environment.id;
        } else {
          console.warn('Environment not found, using first available environment');
          environment_id = environments[0]?.id;
        }
      } catch (error) {
        console.error('Failed to fetch environments for lookup:', error);
        throw new Error('Could not resolve environment ID');
      }
    }

    const requestBody = {
      avatar_id: config.avatar,
      environment_id: environment_id,
      camera: config.camera || { preset: 'Preset1', resolution: '1920x1080' },
      user_token: getSessionToken(),
    };

    if (config.voice_config && Object.keys(config.voice_config).length > 0) {
      requestBody.voice = config.voice_config;
    }

    if (config.llm_config && Object.keys(config.llm_config).length > 0) {
      requestBody.llm = config.llm_config;
    }

    if (config.a2f_config && Object.keys(config.a2f_config).length > 0) {
      requestBody.lipsync = config.a2f_config;
    }

    console.log('Creating livestream with config:', JSON.stringify(requestBody, null, 2));

    const startTime = Date.now();
    const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/live`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Livestream creation failed:', response.status, errorData);

      // Special handling for 503 Service Unavailable - session is created but service is unavailable
      if (response.status === 503) {
        let sessionId = null;
        try {
          // Try to parse response as JSON to extract session ID
          const errorJson = JSON.parse(errorData);
          sessionId = errorJson.id || errorJson.session_id || errorJson.sessionId;
        } catch (e) {
          // If JSON parse fails, try to extract UUID from error text
          const uuidMatch = errorData.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
          if (uuidMatch) {
            sessionId = uuidMatch[0];
          }
        }

        const error = new Error(`Service temporarily unavailable: ${errorData}`);
        error.status = 503;
        error.sessionId = sessionId;
        throw error;
      }

      // For other errors, include status code in the error
      const error = new Error(`Failed to create livestream: ${errorData}`);
      error.status = response.status;
      throw error;
    }

    const livestream = await response.json();
    const duration = Date.now() - startTime;
    console.log(`Livestream created successfully in ${duration}ms:`, livestream.id);

    // Invalidate session cache since we have a new session
    invalidateCache('api/v1/live');

    return livestream.id || livestream; // Return the livestream ID or full object
  } catch (error) {
    console.error(`Error creating livestream:`, error);

    // If error already has status and sessionId (from our 503 handling), preserve them
    if (error.status) {
      throw error;
    }

    // Enhanced error handling with more specific messages for legacy string-based errors
    if (error.message.includes('401')) {
      const newError = new Error('Authentication failed. Please login again.');
      newError.status = 401;
      throw newError;
    } else if (error.message.includes('403')) {
      const newError = new Error('Permission denied. Check your account privileges.');
      newError.status = 403;
      throw newError;
    } else if (error.message.includes('429')) {
      const newError = new Error('Too many requests. Please wait a moment and try again.');
      newError.status = 429;
      throw newError;
    } else if (error.message.includes('500')) {
      const newError = new Error('Server error. Please try again later.');
      newError.status = 500;
      throw newError;
    }

    throw error;
  }
};

// Delete a livestream session using the Swagger API
export const deleteLivestream = async (jobId) => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/live/${jobId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      // Successful deletion
      const result = await response.json();
      console.log('DELETE successful, response:', result);
      return result;
    } else if (response.status === 401) {
      // Handle 401 specifically - session might already be ended
      try {
        const responseText = await response.text();
        console.log('DELETE 401 response text:', responseText);

        // Try to parse as JSON to see if we get session info
        try {
          const data = JSON.parse(responseText);
          if (data.error === 'unauthorized' && data.jobstatus === 3) {
            console.log('Session already ended (jobstatus: 3), treating as successful cleanup');
            return { success: true, alreadyEnded: true, jobstatus: 3 };
          }
        } catch {
          // Not JSON, handle as regular unauthorized
        }

        console.warn('DELETE received 401 - session may already be ended');
        return { success: false, error: 'unauthorized', alreadyEnded: true };
      } catch (parseError) {
        console.error('Error parsing 401 response:', parseError);
        return { success: false, error: 'unauthorized' };
      }
    } else {
      // Other error status codes
      try {
        const errorData = await response.json();
        console.error('DELETE error response:', errorData);
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      } catch {
        // If we can't parse the error response, just use the status
        console.error('DELETE failed with status:', response.status);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
    }
  } catch (error) {
    console.error(`Error deleting livestream ${jobId}:`, error);
    // Don't re-throw auth errors to prevent logout
    if (error.message.includes('Authentication failed')) {
      console.warn('Authentication error on DELETE - ignoring to prevent logout');
      return { success: false, error: 'Authentication failed' };
    }
    throw error;
  }
};

// Fetch environments from API
export const getEnvironments = async () => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/uassets?type=eq.env`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const environments = await response.json();
    return environments;
  } catch (error) {
    console.error(`Error fetching environments:`, error);
    throw error;
  }
};

// New live session API functions
// Get all live sessions for the organization
export const getLiveSessions = async () => {
  try {
    // Use renderjobs endpoint with jobtype filter for livestreams
    const response = await authenticatedFetch(`${API_BASE_URL}/renderjobs?jobtype=eq.live&order=created_at.desc`, {
      method: 'GET',
      headers: {
        Prefer: 'return=representation',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const liveSessions = await response.json();
    return liveSessions;
  } catch (error) {
    console.error(`Error fetching live sessions:`, error);
    throw error;
  }
};

// Get a specific live session by ID with smart caching
export const getLiveSession = async (sessionId, options = {}) => {
  const { forceRefresh = false, enableCache = true } = options;

  try {
    if (enableCache) {
      // Use enhanced caching with short TTL for session data (since it changes frequently)
      return await fetchWithCache(`api/v1/live/${sessionId}`, {
        forceRefresh,
        ttl: 30 * 1000, // 30 seconds cache for session data
        cacheKey: `session_${sessionId}`,
      });
    } else {
      // Direct fetch without caching
      const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/live/${sessionId}`, {
        method: 'GET',
        headers: {
          Prefer: 'return=representation',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return await response.json();
    }
  } catch (error) {
    console.error(`Error fetching live session ${sessionId}:`, error);
    throw error;
  }
};

// Update a live session
export const updateLiveSession = async (sessionId, updates) => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/live/${sessionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const updatedSession = await response.json();
    return updatedSession;
  } catch (error) {
    console.error(`Error updating live session ${sessionId}:`, error);
    throw error;
  }
};

// File management API functions

/**
 * Get all files accessible by the authenticated user/organization
 * @param {Object} options - Query options
 * @param {string} options.org_id - Filter by organization ID
 * @param {string} options.user_id - Filter by user ID
 * @param {number} options.limit - Maximum number of files to return (default 100)
 * @param {number} options.offset - Number of files to skip for pagination (default 0)
 * @param {string} options.order_by - Field to order by (default "created_at")
 * @param {string} options.order_direction - Order direction "asc" or "desc" (default "desc")
 * @returns {Promise<Array>} Promise resolving to array of file metadata
 */
export const getFiles = async (options = {}) => {
  try {
    const {
      org_id,
      user_id,
      limit = 100,
      offset = 0,
      order_by = 'created_at',
      order_direction = 'desc',
    } = options;

    // Build query string
    const params = new URLSearchParams();
    if (org_id) params.append('org_id', org_id);
    if (user_id) params.append('user_id', user_id);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    params.append('order_by', order_by);
    params.append('order_direction', order_direction);

    const response = await authenticatedFetch(
      `${API_BASE_URL}/api/v1/files?${params.toString()}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const files = await response.json();
    return files;
  } catch (error) {
    console.error('Error fetching files:', error);
    throw error;
  }
};

/**
 * Get a file's metadata and presigned URL by ID
 * @param {string} fileId - The file ID
 * @returns {Promise<Object>} Promise resolving to file metadata with presigned URL
 */
export const getFileById = async (fileId) => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/file/${fileId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const file = await response.json();
    return file;
  } catch (error) {
    console.error(`Error fetching file ${fileId}:`, error);
    throw error;
  }
};

/**
 * Update a file's metadata (e.g., pretty name)
 * @param {string} fileId - The file ID to update
 * @param {Object} updates - The updates to apply
 * @param {string} updates.pretty_name - New pretty name for the file
 * @returns {Promise<Object>} Promise resolving to updated file metadata
 */
export const updateFile = async (fileId, updates) => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/file/${fileId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Error updating file ${fileId}:`, error);
    throw error;
  }
};

/**
 * Delete a file by ID
 * @param {string} fileId - The file ID to delete
 * @returns {Promise<Object>} Promise resolving to success response
 */
export const deleteFile = async (fileId) => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/file/${fileId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Error deleting file ${fileId}:`, error);
    throw error;
  }
};

/**
 * Upload a new file
 * @param {File} file - The file to upload
 * @param {string} prettyName - Optional user-friendly name for the file
 * @returns {Promise<Object>} Promise resolving to file metadata
 */
export const uploadFile = async (file, prettyName = null) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (prettyName) {
      formData.append('pretty_name', prettyName);
    }

    // Note: Don't set Content-Type header for FormData - the browser will automatically
    // set it with the proper boundary for multipart/form-data
    const token = getSessionToken();
    const response = await fetch(`${API_BASE_URL}/api/v1/file`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const fileMetadata = await response.json();
    return fileMetadata;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};
