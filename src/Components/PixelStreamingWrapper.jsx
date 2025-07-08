// Copyright Epic Games, Inc. All Rights Reserved.

import React, { useEffect, useRef, useState } from 'react';
import {
    Config,
    PixelStreaming
} from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.4';

export const PixelStreamingWrapper = ({ initialSettings }) => {
    // A reference to parent div element that the Pixel Streaming library attaches into:
    const videoParent = useRef(null);

    // Pixel streaming library instance is stored into this state variable after initialization:
    const [pixelStreaming, setPixelStreaming] = useState(null);
    
    // A boolean state variable that determines if the Click to play overlay is shown:
    const [clickToPlayVisible, setClickToPlayVisible] = useState(false);

    // Run on component mount:
    useEffect(() => {
        if (videoParent.current) {
            // Attach Pixel Streaming library to videoParent element:
            const config = new Config({ initialSettings });
            const streaming = new PixelStreaming(config, {
                videoElementParent: videoParent.current
            });
            
            // register a playStreamRejected handler to show Click to play overlay if needed:
            streaming.addEventListener('playStreamRejected', () => {
                console.log('playStreamRejected');
                setClickToPlayVisible(true);
            });

            streaming.addEventListener('videoInitialized', () => {
                // Attempt to play automatically
                streaming.play().catch(() => {
                  // If autoplay is blocked, show the click-to-play overlay
                  console.log('videoInitialized playStreamRejected');
                  setClickToPlayVisible(true);
                });
              });            

            // Save the library instance into component state so that it can be accessed later:
            setPixelStreaming(streaming);

            // Clean up on component unmount:
            return () => {
                try {
                    streaming.disconnect();
                } catch {}
            };
        }
    }, []);

    // console.log('Pixel Streaming Wrapper', { pixelStreaming, clickToPlayVisible });

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                position: 'relative'
            }}
        >
            <div id="video-parent"
                style={{
                    width: '100%',
                    height: '100%'
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
                        backgroundColor: 'rgba(0, 0, 0, 0.5)'
                    }}
                    onClick={() => {
                        pixelStreaming?.play();
                        setClickToPlayVisible(false);
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
                    >Click to play</div>
                </div>
            )}
        </div>
    );
};