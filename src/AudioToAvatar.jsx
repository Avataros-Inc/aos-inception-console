import React, { useState, useRef, useEffect } from 'react';
import { Form, Spinner, Alert } from 'react-bootstrap';
import { Mic, Stop, Upload, Play, Trash } from 'react-bootstrap-icons';
import ConfigSidebar from '@/Components/ConfigSidebar';
import { useConfig } from './contexts/ConfigContext';
import { useTopBarOffset } from './Components/TopBar';
import { insertRenderJob, API_BASE_URL, getSessionToken } from './postgrestAPI';
import RenderJobVideo from './Components/RenderJobVideo';
import { Button } from '@/Components/Button';

const AudioToAvatar = () => {
  const { config } = useConfig();
  const { topOffset } = useTopBarOffset();
  const [audioFile, setAudioFile] = useState(null);
  const [currentRenderJob, setCurrentRenderJob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);

      // Get duration when metadata is loaded
      const audio = new Audio(url);
      audio.onloadedmetadata = () => {
        setAudioDuration(audio.duration);
      };
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsHovering(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);

      const audio = new Audio(url);
      audio.onloadedmetadata = () => {
        setAudioDuration(audio.duration);
      };
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsHovering(true);
  };

  const handleDragLeave = () => {
    setIsHovering(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);
        setAudioFile(new File([audioBlob], 'recording.wav'));

        const audio = new Audio(audioUrl);
        audio.onloadedmetadata = () => {
          setAudioDuration(audio.duration);
        };
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      clearInterval(timerRef.current);
      setIsRecording(false);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const removeAudio = () => {
    setAudioFile(null);
    setAudioUrl(null);
    setAudioDuration(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const generateVideo = async () => {
    if (!audioFile) {
      setSubmitError('Please upload or record an audio file first');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const uploadResponse = await fetch(`${API_BASE_URL}/audio`, {
        method: 'POST',
        body: (() => {
          const formData = new FormData();
          formData.append('file', audioFile);
          return formData;
        })(),
        headers: {
          Authorization: `Bearer ${getSessionToken()}`,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload audio file');
      }

      const result = await uploadResponse.json();

      // Step 3: Call insertRenderJob with the S3 key
      const jobConfig = {
        ...config,
        audio_key: result.objectKey, // Pass the S3 key instead of the file
      };

      const job_id = await insertRenderJob('audio-to-avatar', jobConfig, result.jobID);
      console.log('Job ID: ', job_id);
      setCurrentRenderJob(job_id);
      // alert(`Video generation started! Job ID: ${job_id}`);
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitError(error.message || 'Failed to submit job');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream?.getTracks().forEach((track) => track.stop());
      }
      clearInterval(timerRef.current);
    };
  }, [audioUrl]);

  return (
    <div className="relative mr-[480px] overflow-hidden">
      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]">
          <div className="bg-bg-secondary p-8 rounded-lg text-center border border-border-subtle">
            <Spinner animation="border" role="status" className="mb-3 text-accent-mint">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <h5 className="text-text-primary">Uploading audio and starting video generation...</h5>
            <p className="text-text-secondary">Please don't close this window</p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {submitError && (
        <Alert variant="danger" onClose={() => setSubmitError(null)} dismissible className="mb-3">
          {submitError}
        </Alert>
      )}

      <div className="relative w-full overflow-y-auto">
        <h2 className="gradient-text text-3xl font-bold mb-6">Audio to Avatar</h2>

        {/* Audio Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer mb-5 transition-all duration-300 ${
            isHovering ? 'bg-bg-secondary border-accent-mint' : 'bg-bg-secondary/50 border-border-subtle'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current.click()}
        >
          <Upload size={48} className="mb-3 text-text-secondary" />
          <h5 className="text-text-primary mb-2">Drag & drop an audio file here, or click to browse</h5>
          <p className="text-text-secondary">Supports MP3, WAV, OGG (Max 50MB)</p>
          <Form.Control
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="audio/*"
            style={{ display: 'none' }}
          />

          {/* Or Divider */}
          <div className="text-center my-4">
            <span className="text-text-secondary">OR</span>
          </div>

          {/* Recording Controls */}
          <div className="flex justify-center gap-4">
            {isRecording ? (
              <>
                <Button variant="danger" onClick={stopRecording}>
                  <Stop className="me-2" />
                  Stop Recording ({formatTime(recordingTime)})
                </Button>
              </>
            ) : (
              <Button variant="primary" onClick={startRecording}>
                <Mic className="me-2" />
                Record with Microphone
              </Button>
            )}
          </div>
        </div>

        {/* Audio Preview */}
        {audioUrl && (
          <div className="mt-5 flex items-center gap-4">
            <div className="flex-1 h-15 bg-bg-secondary rounded relative overflow-hidden border border-border-subtle">
              {/* In a real app, you would render a waveform here using a library like wavesurfer.js */}
            </div>
            <span className="text-text-primary">{formatTime(audioDuration)}</span>
            <Button variant="outline-primary" size="sm" onClick={playAudio}>
              <Play />
            </Button>
            <Button variant="outline-danger" size="sm" onClick={removeAudio}>
              <Trash />
            </Button>
            <audio ref={audioRef} src={audioUrl} hidden />
          </div>
        )}

        {/* Generate Button */}
        <div className="d-flex justify-content-between align-items-center mt-4">
          <Button className="px-4" onClick={generateVideo} disabled={!audioFile}>
            Generate Video
          </Button>
          <div>
            {audioFile && (
              <span className="text-text-secondary">
                {audioFile.name} • {Math.round(audioFile.size / 1024)} KB • {formatTime(audioDuration)}
              </span>
            )}
          </div>
        </div>
        <div className="d-flex justify-content-between align-items-center mt-4">
          <RenderJobVideo renderJobID={currentRenderJob} />
        </div>
      </div>
      <ConfigSidebar visual a2f topOffset={topOffset} />
    </div>
  );
};

export default AudioToAvatar;
