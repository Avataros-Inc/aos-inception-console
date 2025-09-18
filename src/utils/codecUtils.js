/**
 * Utility functions for WebRTC codec detection and selection
 */

/**
 * Check if a specific video codec is supported by the browser
 * @param {string} codec - The codec to check (e.g., 'video/H264', 'video/VP8', 'video/VP9')
 * @returns {boolean} - True if codec is supported
 */
export const isCodecSupported = (codec) => {
  try {
    // Normalize codec format
    const normalizedCodec = codec.toLowerCase().startsWith('video/') ? codec : `video/${codec}`;

    // Check if RTCRtpReceiver.getCapabilities is available
    if (typeof RTCRtpReceiver === 'undefined' || !RTCRtpReceiver.getCapabilities) {
      console.warn('RTCRtpReceiver.getCapabilities not available, using fallback');
      // Fallback: assume VP8 is supported (most widely supported codec)
      return normalizedCodec.includes('vp8');
    }

    // Get the capabilities for video transceivers
    const capabilities = RTCRtpReceiver.getCapabilities('video');

    if (!capabilities || !capabilities.codecs) {
      console.warn('No video capabilities found, using fallback');
      return normalizedCodec.includes('vp8');
    }

    // Check if the codec is in the list of supported codecs
    const supported = capabilities.codecs.some((supportedCodec) => {
      const supportedMimeType = supportedCodec.mimeType.toLowerCase();
      const requestedMimeType = normalizedCodec.toLowerCase();

      // Check for exact match or codec name match
      if (supportedMimeType === requestedMimeType) {
        return true;
      }

      // Check if the codec name matches (e.g., 'h264' in 'video/h264')
      const supportedCodecName = supportedMimeType.split('/')[1];
      const requestedCodecName = requestedMimeType.split('/')[1];

      return supportedCodecName === requestedCodecName;
    });

    return supported;
  } catch (error) {
    console.warn('Error checking codec support for', codec, ':', error);
    // Fallback to VP8 on error
    return codec.toLowerCase().includes('vp8');
  }
};

/**
 * Get the best supported codec from a list of preferred codecs
 * @param {string[]} preferredCodecs - Array of preferred codecs in order of preference
 * @returns {string} - The best supported codec or VP8 as fallback
 */
export const getBestSupportedCodec = (preferredCodecs = ['video/VP8', 'video/H264', 'video/VP9']) => {
  try {
    // Normalize the preferred codecs to ensure consistent format
    const normalizedPreferred = preferredCodecs.map((codec) =>
      codec.toLowerCase().startsWith('video/') ? codec : `video/${codec}`
    );

    for (const codec of normalizedPreferred) {
      if (isCodecSupported(codec)) {
        // Extract just the codec name (e.g., 'H264' from 'video/H264')
        const codecName = codec.split('/')[1];
        return codecName;
      }
    }

    console.warn('No preferred codecs supported, falling back to VP8');
    return 'VP8';
  } catch (error) {
    console.error('Error selecting best codec:', error);
    return 'VP8'; // Safe fallback
  }
};
