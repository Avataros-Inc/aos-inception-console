import React, { useState, useRef, useEffect } from 'react';
import { Button, Form, Spinner, Alert } from 'react-bootstrap';
import { Mic, Stop, Upload, Play, Trash } from 'react-bootstrap-icons';
import A2FConfigTab from './ConfigTabs/A2FConfigTab';
import VisualConfigTab from './ConfigTabs/VisualConfigTab';
import { insertRenderJob, API_BASE_URL, getSessionToken  } from './postgrestAPI';
import RenderJobVideo from './Components/RenderJobVideo';
const styles = {
  rightSidebar: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '480px',
    height: '100vh',
    backgroundColor: '#ffffff',
    borderLeft: '1px solid #e9ecef',
    padding: '20px',
    overflowY: 'auto',
    zIndex: 900
  },
  mainContent: {
    paddingRight: '480px',
  },
  audioUploader: {
    border: '2px dashed #ced4da',
    borderRadius: '8px',
    padding: '40px',
    textAlign: 'center',
    cursor: 'pointer',
    marginBottom: '20px',
    backgroundColor: '#f8f9fa',
    transition: 'all 0.3s ease'
  },
  audioUploaderHover: {
    backgroundColor: '#e9ecef',
    borderColor: '#adb5bd'
  },
  recorderControls: {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '20px'
  },
  audioPreview: {
    marginTop: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  waveform: {
    flex: 1,
    height: '60px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    position: 'relative',
    overflow: 'hidden'
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  spinnerContainer: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    textAlign: 'center'
  }  
};

const AudioToAvatar = ({ characters }) => {
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

  const [config, setConfig] = useState({
    avatar: characters[0].id,
    environment: 'Map_Env_Basic_01',
    a2f_config: characters[0].a2f_config,
    voice_config: characters[0].voice_config,
  });  
  const [activeTab, setActiveTab] = useState('visual');

  const updateConfig = (key, value) => {
    setConfig({ ...config, [key]: value });
    if (key === 'avatar') {
      for (const character of characters) {
        if (character.id === value) {
          setConfig(prev => ({ 
            ...prev, 
            a2f_config: character.a2f_config,
            voice_config: character.voice_config 
          }));
          break;
        }
      }
    }
  };

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
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
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
          'Authorization': `Bearer ${getSessionToken()}`,
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload audio file');
      }

      const result = await uploadResponse.json();

      // Step 3: Call insertRenderJob with the S3 key
      const jobConfig = {
        ...config,
        audio_key: result.objectKey // Pass the S3 key instead of the file
      };

      const job_id = await insertRenderJob("audio-to-avatar", jobConfig, result.jobID);
      console.log("Job ID: ", job_id);
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
        mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
      }
      clearInterval(timerRef.current);
    };
  }, [audioUrl]);

  return (
    <div>

 {/* Loading Overlay */}
 {isSubmitting && (
        <div style={styles.overlay}>
          <div style={styles.spinnerContainer}>
            <Spinner animation="border" role="status" className="mb-3">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <h5>Uploading audio and starting video generation...</h5>
            <p>Please don't close this window</p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {submitError && (
        <Alert variant="danger" onClose={() => setSubmitError(null)} dismissible className="mb-3">
          {submitError}
        </Alert>
      )}


      <div style={styles.mainContent}>
        <h2>Audio to Avatar</h2>
        
        {/* Audio Upload Area */}
        <div 
          style={{...styles.audioUploader, ...(isHovering ? styles.audioUploaderHover : {})}}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current.click()}
        >
          <Upload size={48} className="mb-3" style={{ color: '#6c757d' }} />
          <h5>Drag & drop an audio file here, or click to browse</h5>
          <p className="text-muted">Supports MP3, WAV, OGG (Max 50MB)</p>
          <Form.Control 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="audio/*"
            style={{ display: 'none' }}
          />
        </div>
        
        {/* Or Divider */}
        <div className="text-center my-3">
          <span className="text-muted">OR</span>
        </div>
        
        {/* Recording Controls */}
        <div style={styles.recorderControls}>
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
        
        {/* Audio Preview */}
        {audioUrl && (
          <div style={styles.audioPreview}>
            <div style={styles.waveform}>
              {/* In a real app, you would render a waveform here using a library like wavesurfer.js */}
            </div>
            <span>{formatTime(audioDuration)}</span>
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
          <div>
            {audioFile && (
              <span className="text-muted">
                {audioFile.name} • {Math.round(audioFile.size / 1024)} KB • {formatTime(audioDuration)}
              </span>
            )}
          </div>
          <Button 
            variant="dark" 
            className="px-4" 
            onClick={generateVideo}
            disabled={!audioFile}
          >
            Generate Video
          </Button>
        </div>
        <div className="d-flex justify-content-between align-items-center mt-4">
        < RenderJobVideo renderJobID={currentRenderJob} />
        </div>

      </div>
      
      {/* Right Settings Sidebar */}
      <div style={styles.rightSidebar}>
        <div className="d-flex border-bottom pb-2 mb-3">
          <Button 
            variant={activeTab === 'visual' ? 'primary' : 'light'} 
            className="me-2 py-1 px-2"
            onClick={() => setActiveTab('visual')}
            size="sm"
          >
            Visual
          </Button>
          <Button 
            variant={activeTab === 'a2f' ? 'primary' : 'light'} 
            className="me-2 py-1 px-2"
            onClick={() => setActiveTab('a2f')}
            size="sm"
          >
            A2F Config
          </Button>
        </div>
        
        {activeTab === 'a2f' && (
          <A2FConfigTab updateConfig={updateConfig} config={config}/>
        )}
        
        {activeTab === 'visual' && (
          <VisualConfigTab characters={characters} updateConfig={updateConfig} config={config} />
        )}
      </div>
    </div>
  );
};

export default AudioToAvatar;