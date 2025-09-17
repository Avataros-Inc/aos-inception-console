// Session states for livestream connections
export const SESSION_STATES = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
};

// Progress steps for better UX during connection process
export const CONNECTION_STEPS = {
  CREATING: { message: 'Creating session...', progress: 25 },
  VALIDATING: { message: 'Validating session...', progress: 50 },
  CONNECTING: { message: 'Establishing connection...', progress: 75 },
  CONNECTED: { message: 'Connected successfully!', progress: 100 },
};
