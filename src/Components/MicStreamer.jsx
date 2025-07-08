import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Mic, MicMute, ChatDots } from 'react-bootstrap-icons';
import { Button, Alert  } from 'react-bootstrap';

import { useMicVAD } from "@ricky0123/vad-react"

const MicrophoneStreamer = forwardRef(({ wsReadyState, sendMessage, ReadyState }, ref) => {
    const [isRecording, setIsRecording] = useState(false);
    const [hasPermission, setHasPermission] = useState(null);
    const [userTalking, setUserTalking] = useState(false);
    const [AvatarTalking, setAvatarTalking] = useState(false);
    const [muted, setMuted] = useState(true);
    
    const mediaRecorderRef = useRef(null);
    const audioContextRef = useRef(null);
    const audioChunksRef = useRef([]);
    // const { sendMessage } = useWebSocket(`ws://192.168.4.118:8082/ws`, {
    //     share: true, // Share the existing WebSocket connection
    // });

    const vad = useMicVAD({
        // model: "v5",
        // frameSamples: 512,
        startOnLoad: false,
        redemptionFrames: 8,
        onSpeechRealStart: (audio) => {
            setUserTalking(true);
            startRecording();
        },
        onSpeechEnd: (audio) => {
            setUserTalking(false);
            stopRecording();
        },
    });


    const checkMicrophonePermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            setHasPermission(true);
        } catch (err) {
            console.error('Microphone permission denied:', err);
            setHasPermission(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, channelCount: 1 });
            audioContextRef.current = new AudioContext();
            const source = audioContextRef.current.createMediaStreamSource(stream);

            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const audioData = reader.result;
                        if (wsReadyState === ReadyState.OPEN) {
                            sendMessage(JSON.stringify({
                                type: 'audioin',
                                time: Date.now(),
                                // session: livestreamId,
                                content: audioData
                            }));
                        }
                    };
                    reader.readAsDataURL(event.data);
                }
            };

            mediaRecorderRef.current.start(100); // Send data every 100ms
            setIsRecording(true);
        } catch (err) {
            console.error('Error starting recording:', err);
            setIsRecording(false);
        }
    };

    const stopRecording = () => {      
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            mediaRecorderRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        sendMessage(JSON.stringify({
            type: 'audioin',
            content: 'stop'
        }));  
        setIsRecording(false);
    };

    const handleButton = () => {
        if (AvatarTalking) {
            sendMessage(JSON.stringify({ type: 'cmd', content: "audio=stop" }));
            handleAvatarTalking(false);
            return;
        }

        if (muted) {
            vad.start();
        } else {
            vad.pause();
        }
        setMuted(!muted);

    }

    const handleAvatarTalking = (isTalking) => {
        // console.log('isTalking', isTalking);
        setAvatarTalking(isTalking);
        if (isTalking) {
            vad.pause();
        } else if (!muted) {
            vad.start();
        }
        
    };

    useImperativeHandle(ref, () => ({
        handleAvatarTalking,
      }));

    useEffect(() => {
        checkMicrophonePermission();
        return () => {
            stopRecording();
        };
    }, []);

    if (hasPermission === false) {
        return (
            <Alert variant="warning" className="mb-2">
                Microphone access denied. Please enable permissions.
            </Alert>
        );
    }

    return (
        <div className="d-flex justify-content-center mb-2">
            <Button
                variant={userTalking ? 'danger' : 'outline-primary'}
                onClick={handleButton}
                disabled={wsReadyState !== ReadyState.OPEN || hasPermission === false}
            >
                {muted ? <MicMute /> : <Mic />}
                {AvatarTalking ? <ChatDots /> : ""}
                {/* {isRecording ? ' Stop Mic' : ' Start Mic'} */}
            </Button>
            {/* {AvatarTalking ? "yapping": "not yapping"} */}
        </div>
    );
});


export default MicrophoneStreamer;