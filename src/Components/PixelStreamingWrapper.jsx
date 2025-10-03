// Copyright Epic Games, Inc. All Rights Reserved.

import React, { useEffect, useRef, useState } from 'react';
import { Config, PixelStreaming } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.4';
import { getBestSupportedCodec } from '../utils/codecUtils';
import { diagnoseWebRTCConnectivity } from '../utils/networkDiagnostics';

export const PixelStreamingWrapper = ({ initialSettings, onPixelStreamingReady }) => {
  // A reference to parent div element that the Pixel Streaming library attaches into:
  const videoParent = useRef(null);

  // Pixel streaming library instance is stored into this state variable after initialization:
  const [pixelStreaming, setPixelStreaming] = useState(null);

  // A boolean state variable that determines if the Click to play overlay is shown:
  const [clickToPlayVisible, setClickToPlayVisible] = useState(false);

  // State for connection errors
  const [connectionError, setConnectionError] = useState(null);

  // Run on component mount:
  useEffect(() => {
    if (videoParent.current) {
      // Add global error handler for codec preference errors
      const handleUnhandledRejection = (event) => {
        if (
          event.reason &&
          event.reason.message &&
          event.reason.message.includes('setCodecPreferences') &&
          event.reason.message.includes('H264')
        ) {
          console.warn('🔧 Suppressed H264 codec preference error - using VP8 instead');
          event.preventDefault(); // Prevent the error from being logged
          return;
        }
      };

      window.addEventListener('unhandledrejection', handleUnhandledRejection);

      const initializePixelStreaming = async () => {
        try {
          // Ensure we're using a supported codec
          const modifiedSettings = { ...initialSettings };

          // Use synchronous codec selection, prioritizing VP8 for compatibility
          let bestCodec;
          if (modifiedSettings.PreferredCodec) {
            bestCodec = getBestSupportedCodec(['video/' + modifiedSettings.PreferredCodec, 'video/VP8', 'video/VP9']);
          } else {
            // Always prefer VP8 first as it's most compatible and avoids setCodecPreferences issues
            bestCodec = getBestSupportedCodec(['video/VP8', 'video/VP9', 'video/H264']);
          }

          modifiedSettings.PreferredCodec = bestCodec;
          // Force disable codec preferences to avoid H264 errors
          modifiedSettings.ForceCodecProfile = false;
          modifiedSettings.ForceTURN = false;

          // Attach Pixel Streaming library to videoParent element:
          const config = new Config({ initialSettings: modifiedSettings });
          const streaming = new PixelStreaming(config, {
            videoElementParent: videoParent.current,
          });

          // register a playStreamRejected handler to show Click to play overlay if needed:
          streaming.addEventListener('playStreamRejected', () => {
            setClickToPlayVisible(true);
          });

          streaming.addEventListener('videoInitialized', () => {
            // Video initialization successful
          });

          // Add error handling for WebRTC issues
          streaming.addEventListener('webRtcPlayerSetup', (event) => {
            const { webRtcPlayer } = event;
            if (webRtcPlayer && webRtcPlayer.pc) {
              webRtcPlayer.pc.addEventListener('connectionstatechange', () => {
                const state = webRtcPlayer.pc.connectionState;
                // Monitor connection state changes

                if (state === 'failed') {
                  console.error('❌ WebRTC connection failed');
                  setConnectionError('WebRTC connection failed. This may be due to firewall or network restrictions.');
                } else if (state === 'connected') {
                  setConnectionError(null); // Clear any previous errors
                }
              });

              webRtcPlayer.pc.addEventListener('iceconnectionstatechange', () => {
                const iceState = webRtcPlayer.pc.iceConnectionState;

                if (iceState === 'failed') {
                  console.error('❌ ICE connection failed');
                  setConnectionError('ICE connection failed. You may be behind a firewall that requires TURN servers.');

                  // Run network diagnostics to help troubleshoot
                  diagnoseWebRTCConnectivity().then((results) => {
                    console.log('Network diagnostic results:', results);
                  });
                } else if (iceState === 'connected' || iceState === 'completed') {
                  setConnectionError(null); // Clear any previous errors
                }
              });

              // Handle codec preference errors
              webRtcPlayer.pc.addEventListener('error', (error) => {
                console.error('WebRTC peer connection error:', error);
                if (error.message && error.message.includes('setCodecPreferences')) {
                  console.warn('Codec preference error detected, this may be due to codec compatibility issues');
                }
              });
            }
          });

          // Add connection error handling
          streaming.addEventListener('connectionFailed', (event) => {
            console.error('PixelStreaming connection failed:', event);
            setClickToPlayVisible(true);
          });

          streaming.addEventListener('disconnected', () => {
            // PixelStreaming disconnected
          });

          // Disable all input handlers at the library level
          if (streaming.inputController) {
            streaming.inputController.unregisterKeyboardEvents();
            streaming.inputController.unregisterMouseEvents();
            streaming.inputController.unregisterTouchEvents();
            streaming.inputController.unregisterGamepadEvents();
          }

          // Save the library instance into component state so that it can be accessed later:
          setPixelStreaming(streaming);

          // Notify parent component that PixelStreaming is ready
          if (onPixelStreamingReady) {
            onPixelStreamingReady(streaming);
          }
        } catch (error) {
          console.error('Error initializing Pixel Streaming:', error);
          setClickToPlayVisible(true);
        }
      };

      // Start the async initialization
      initializePixelStreaming();

      // Clean up on component unmount:
      return () => {
        // Remove the global error handler
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);

        if (pixelStreaming) {
          try {
            pixelStreaming.disconnect();
          } catch (error) {
            console.error('Error disconnecting streaming:', error);
          }
        }
      };
    }
    // Note: We don't include pixelStreaming in deps to avoid re-initialization
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSettings]);

  // console.log('Pixel Streaming Wrapper', { pixelStreaming, clickToPlayVisible });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        id="video-parent"
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
        ref={videoParent}
      />
      {clickToPlayVisible && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
            color: 'red',
            fontSize: '24px',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          onClick={() => {
            try {
              // Try different possible methods to start playback
              if (pixelStreaming) {
                if (typeof pixelStreaming.play === 'function') {
                  pixelStreaming.play();
                } else if (typeof pixelStreaming.requestVideoKeyframe === 'function') {
                  pixelStreaming.requestVideoKeyframe();
                } else if (typeof pixelStreaming.activate === 'function') {
                  pixelStreaming.activate();
                }
                setClickToPlayVisible(false);
              } else {
                console.error('pixelStreaming instance not available');
              }
            } catch (error) {
              console.error('Error in click handler:', error);
              // Still hide the overlay even if there's an error
              setClickToPlayVisible(false);
            }
          }}
        >
          <div
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              padding: '20px',
              maxWidth: '80%',
              textAlign: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              borderRadius: '10px',
            }}
          >
            Click to play
          </div>
        </div>
      )}
      {connectionError && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            right: '20px',
            zIndex: 2,
            backgroundColor: 'rgba(220, 53, 69, 0.9)',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'Arial, sans-serif',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>🚫 Connection Error</div>
          <div style={{ marginBottom: '8px' }}>{connectionError}</div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>
            Check the browser console for detailed diagnostics. If you're behind a firewall, contact your network
            administrator.
          </div>
          <button
            onClick={() => setConnectionError(null)}
            style={{
              marginTop: '10px',
              padding: '5px 10px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
