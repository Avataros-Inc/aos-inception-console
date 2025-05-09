// export const API_BASE_URL = 'http://192.168.4.118:8080';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

// Hardcoded authorization token (will be replaced with cookie-based auth later)
// TODO: remove 
const ORG_ID = 'd4f8d7e9-bbd5-4080-8149-451e56c18e61';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Cache storage - keys are resource paths, values are {data, timestamp}
const cache = {};

/**
 * Generic function to fetch data from PostgresREST with caching
 * @param {string} resourcePath - API resource path (e.g., 'characters')
 * @param {Object} options - Additional options
 * @param {boolean} options.forceRefresh - If true, bypasses the cache
 * @param {string} options.query - Optional query string to append
 * @returns {Promise<Array>} Promise resolving to the requested data
 */
const fetchWithCache = async (resourcePath, options = {}) => {
  const { forceRefresh = false, query = '' } = options;
  const cacheKey = `${resourcePath}${query}`;
  const now = Date.now();

  // Check if we have valid cached data
  if (
    !forceRefresh &&
    cache[cacheKey] &&
    cache[cacheKey].timestamp &&
    now - cache[cacheKey].timestamp < CACHE_DURATION
  ) {
    return cache[cacheKey].data;
  }

  // Otherwise, fetch from API
  try {
    const endpoint = `${API_BASE_URL}/${resourcePath}${query}`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getSessionToken()}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    // Update cache
    cache[cacheKey] = {
      data,
      timestamp: now
    };

    return data;
  } catch (error) {
    console.error(`Error fetching ${resourcePath}:`, error);
    throw error;
  }
};

/**
 * Invalidates the cache for a specific resource or all resources
 * @param {string|null} resourcePath - Resource path to invalidate, or null for all
 */
export const invalidateCache = (resourcePath = null) => {
  if (resourcePath === null) {
    // Clear entire cache
    Object.keys(cache).forEach(key => delete cache[key]);
  } else {
    // Clear specific resource and its queries
    Object.keys(cache).forEach(key => {
      if (key.startsWith(resourcePath)) {
        delete cache[key];
      }
    });
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
    [key]: value
  };

  try {
    const response = await fetch(`${API_BASE_URL}/characters?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getSessionToken()}`,
        'Prefer': 'return=representation' // Ask PostgresREST to return the updated record
      },
      body: JSON.stringify(updateData)
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
    "jobtype": jobtype,
    "config": config,
  };
  if (id !== null) {
    insertData['id'] = id;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/renderjobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getSessionToken()}`,
        'Prefer': 'return=representation' // Ask PostgresREST to return the updated record
      },
      body: JSON.stringify(insertData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const insertedRenderJob = await response.json();

    return insertedRenderJob[0]["id"];
  } catch (error) {
    console.error(`Error inserting render job:`, error);
    throw error;
  }
};


// TODO: limit to last 30 or do pagination
export const getRenderJobs = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/renderjobs?org_id=eq.${ORG_ID}&order=created_at.desc`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getSessionToken()}`,
        'Prefer': 'return=representation' // Ask PostgresREST to return the updated record
      }
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
  try  {
    const response = await fetch(`${API_BASE_URL}/renderjobs?id=eq.${jobId}`,  {
      method:  'GET',
      headers:  {
         'Content-Type':  'application/json',
         'Authorization': `Bearer ${getSessionToken()}`,
         'Prefer': 'return=representation' 
         }
       });
    if  (!response.ok)  {
      throw new Error(`HTTP error: ${response.status}`);
     }
    const renderjobs  = await response.json();
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
        'Authorization': `Bearer ${getSessionToken()}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(updates)
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
export const cancelRenderJob = (jobId) =>
  updateRenderJob(jobId, { jobstatus: 2 }); // Suspended

export const retryRenderJob = (jobId) =>
  updateRenderJob(jobId, { jobstatus: 0 }); // Unknown (or 6 for Pending)


export const getApiKeys = async () => {
  try {
    // ?select=*,org_users!fk_user_id(name,email)&org_id=eq.${ORG_ID}
    // ?org_id=eq.${ORG_ID}
    const response = await fetch(`${API_BASE_URL}/apikeys?select=*,org_users!fk_user_id(name,email)&org_id=eq.${ORG_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getSessionToken()}`,
        'Prefer': 'return=representation' // Ask PostgresREST to return the updated record
      }
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

export const createApiKey = async ({ name, expires_at }) => { };

export const getPresignedUrl = async ({ fileName, fileType }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/presigned?filename=${fileName}&contentType=${fileType}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getSessionToken()}`,
      }
    });

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
    const response = await fetch(`${API_BASE_URL}/video/${renderJobID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getSessionToken()}`,
      }      
    });
    
    if (!response.ok) {
      const retryAfter = response.headers.get('Retry-After') || '5';
      const errorData = await response.json();
      
      return {
        error: errorData.error || errorData.message || 'Failed to fetch video',
        retryAfter: parseInt(retryAfter, 10),
        status: response.status,
        exists: errorData.exists || false
      };
    }
    
    const data = await response.json();
    return { url: data.url, exists: true };
  } catch (err) {
    return {
      error: 'Network error occurred',
      retryAfter: 5,
      exists: false
    };
  }
};



