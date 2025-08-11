/**
 * Network diagnostics utilities for WebRTC troubleshooting
 */

/**
 * Test STUN server connectivity
 * @param {string} stunUrl - STUN server URL
 * @returns {Promise<boolean>} - True if STUN server is reachable
 */
const testStunServer = async (stunUrl = 'stun:stun.l.google.com:19302') => {
  try {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: stunUrl }],
    });

    // Create a data channel to trigger ICE gathering
    pc.createDataChannel('test');

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        pc.close();
        resolve(false);
      }, 5000); // 5 second timeout

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          clearTimeout(timeout);
          pc.close();
          resolve(true);
        }
      };

      pc.createOffer().then((offer) => pc.setLocalDescription(offer));
    });
  } catch (error) {
    console.error('Error testing STUN server:', error);
    return false;
  }
};

/**
 * Get network type information
 * @returns {Object} - Network connection information
 */
const getNetworkInfo = () => {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  if (connection) {
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      downlinkMax: connection.downlinkMax,
      rtt: connection.rtt,
      saveData: connection.saveData,
      type: connection.type,
    };
  }

  return { error: 'Network information not available' };
};

/**
 * Diagnose WebRTC connectivity issues
 * @param {boolean} verbose - Enable verbose logging
 * @returns {Promise<Object>} - Diagnostic results
 */
export const diagnoseWebRTCConnectivity = async (verbose = false) => {
  if (verbose) console.log('🔍 Starting WebRTC connectivity diagnosis...');

  const results = {
    webrtcSupport: typeof RTCPeerConnection !== 'undefined',
    networkInfo: getNetworkInfo(),
    stunTests: {},
  };

  // Test common STUN servers
  const stunServers = [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302',
    'stun:stun.cloudflare.com:3478',
  ];

  if (verbose) console.log('Testing STUN servers...');
  for (const stunUrl of stunServers) {
    try {
      const isReachable = await testStunServer(stunUrl);
      results.stunTests[stunUrl] = isReachable;
      if (verbose) console.log(`${stunUrl}: ${isReachable ? '✅ Reachable' : '❌ Not reachable'}`);
    } catch (error) {
      results.stunTests[stunUrl] = false;
      if (verbose) console.log(`${stunUrl}: ❌ Error - ${error.message}`);
    }
  }

  // Check if any STUN servers are working
  const workingStunServers = Object.values(results.stunTests).filter(Boolean).length;

  if (workingStunServers === 0) {
    console.warn('⚠️ No STUN servers are reachable. You may be behind a restrictive firewall.');
    if (verbose) {
      console.log('💡 Recommendations:');
      console.log('  - Contact your network administrator');
      console.log('  - Try connecting from a different network');
      console.log('  - Configure TURN servers for NAT traversal');
    }
  } else if (verbose) {
    console.log(`✅ ${workingStunServers} STUN server(s) are reachable`);
  }

  return results;
};
