import React, { useEffect, useRef, useState } from 'react';
import { Card } from 'react-bootstrap';
import { API_BASE_URL } from '../../config/api';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import './SynchronizedVideoPlayer.css';

const SynchronizedVideoPlayer = ({ 
  resource, 
  socket, 
  sessionId, 
  isHost 
}) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialize video player
  useEffect(() => {
    if (videoRef.current) {
      // Set up event listeners
      const video = videoRef.current;
      
      const handleLoadedMetadata = () => {
        setDuration(video.duration);
      };
      
      const handleTimeUpdate = () => {
        if (!isSeeking && !isSyncing) {
          setCurrentTime(video.currentTime);
        }
      };
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('timeupdate', handleTimeUpdate);
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [isSeeking, isSyncing]);

  // Socket.io event handlers
  useEffect(() => {
    if (!socket) return;

    // Handle play event
    const handlePlay = (data) => {
      if (videoRef.current) {
        setIsSyncing(true);
        videoRef.current.currentTime = data.currentTime;
        videoRef.current.play().then(() => {
          setIsPlaying(true);
          setIsSyncing(false);
        }).catch(error => {
          console.error('Error playing video:', error);
          setIsSyncing(false);
        });
      }
    };

    // Handle pause event
    const handlePause = (data) => {
      if (videoRef.current) {
        setIsSyncing(true);
        videoRef.current.currentTime = data.currentTime;
        videoRef.current.pause();
        setIsPlaying(false);
        setIsSyncing(false);
      }
    };

    // Handle seek event
    const handleSeek = (data) => {
      if (videoRef.current) {
        setIsSyncing(true);
        videoRef.current.currentTime = data.currentTime;
        setCurrentTime(data.currentTime);
        setIsSyncing(false);
      }
    };

    // Register event listeners
    socket.on('video-play', handlePlay);
    socket.on('video-pause', handlePause);
    socket.on('video-seek', handleSeek);

    return () => {
      // Clean up event listeners
      socket.off('video-play', handlePlay);
      socket.off('video-pause', handlePause);
      socket.off('video-seek', handleSeek);
    };
  }, [socket, sessionId]);

  // Play/Pause handlers
  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        
        // Emit play event to other participants
        if (socket) {
          socket.emit('video-play', {
            sessionId,
            currentTime: videoRef.current.currentTime
          });
        }
      }).catch(error => {
        console.error('Error playing video:', error);
      });
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      
      // Emit pause event to other participants
      if (socket) {
        socket.emit('video-pause', {
          sessionId,
          currentTime: videoRef.current.currentTime
        });
      }
    }
  };

  // Seek handlers
  const handleSeekChange = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    setIsSeeking(true);
  };

  const handleSeekEnd = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = currentTime;
      
      // Emit seek event to other participants
      if (socket) {
        socket.emit('video-seek', {
          sessionId,
          currentTime
        });
      }
    }
    setIsSeeking(false);
  };

  // Skip forward/backward
  const handleSkipForward = () => {
    if (videoRef.current) {
      const newTime = Math.min(videoRef.current.currentTime + 10, duration);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      
      // Emit seek event to other participants
      if (socket) {
        socket.emit('video-seek', {
          sessionId,
          currentTime: newTime
        });
      }
    }
  };

  const handleSkipBackward = () => {
    if (videoRef.current) {
      const newTime = Math.max(videoRef.current.currentTime - 10, 0);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      
      // Emit seek event to other participants
      if (socket) {
        socket.emit('video-seek', {
          sessionId,
          currentTime: newTime
        });
      }
    }
  };

  // Format time (seconds to MM:SS)
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="synchronized-video-player mb-4">
      <div className="video-container">
        <video
          ref={videoRef}
          className="w-100"
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          <source src={`${API_BASE_URL}/${resource.file}`} type="video/mp4" />
          Votre navigateur ne supporte pas la lecture de vidéos.
        </video>
      </div>
      
      <div className="video-controls p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="time-display">{formatTime(currentTime)}</span>
          <div className="control-buttons">
            <button 
              className="btn btn-sm btn-light me-2" 
              onClick={handleSkipBackward}
              title="Reculer de 10 secondes"
            >
              <SkipBack size={16} />
            </button>
            
            {isPlaying ? (
              <button 
                className="btn btn-sm btn-primary me-2" 
                onClick={handlePause}
                title="Pause"
              >
                <Pause size={16} />
              </button>
            ) : (
              <button 
                className="btn btn-sm btn-primary me-2" 
                onClick={handlePlay}
                title="Lecture"
              >
                <Play size={16} />
              </button>
            )}
            
            <button 
              className="btn btn-sm btn-light" 
              onClick={handleSkipForward}
              title="Avancer de 10 secondes"
            >
              <SkipForward size={16} />
            </button>
          </div>
          <span className="time-display">{formatTime(duration)}</span>
        </div>
        
        <input
          type="range"
          className="form-range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          onChange={handleSeekChange}
          onMouseUp={handleSeekEnd}
          onTouchEnd={handleSeekEnd}
        />
        
        {isSyncing && (
          <div className="sync-indicator">
            Synchronisation en cours...
          </div>
        )}
      </div>
    </Card>
  );
};

export default SynchronizedVideoPlayer;
