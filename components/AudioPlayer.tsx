
import React, { useState, useEffect, useRef } from 'react';
import { PlayIcon, PauseIcon } from './icons';

interface AudioPlayerProps {
  audioBase64: string;
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  // Assuming mono audio at 24000 sample rate from Gemini TTS
  const numChannels = 1;
  const sampleRate = 24000;
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}


export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioBase64 }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef(0);
  const startedAtRef = useRef(0);
  const animationFrameRef = useRef(0);

  useEffect(() => {
    const initializeAudio = async () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const decodedBytes = decode(audioBase64);
        const buffer = await decodeAudioData(decodedBytes, audioContextRef.current);
        setAudioBuffer(buffer);
        setDuration(buffer.duration);
      } catch (error) {
        console.error("Failed to decode audio data:", error);
      }
    };
    initializeAudio();

    return () => {
      sourceRef.current?.stop();
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [audioBase64]);

  const updateProgress = () => {
    if (!isPlaying || !audioContextRef.current || !sourceRef.current) return;
    
    const elapsedTime = audioContextRef.current.currentTime - startedAtRef.current;
    const newCurrentTime = startTimeRef.current + elapsedTime;
    
    if (newCurrentTime < duration) {
        setCurrentTime(newCurrentTime);
        setProgress((newCurrentTime / duration) * 100);
        animationFrameRef.current = requestAnimationFrame(updateProgress);
    } else {
        setIsPlaying(false);
        setCurrentTime(duration);
        setProgress(100);
        startTimeRef.current = 0;
    }
  };


  const handlePlayPause = () => {
    if (!audioContextRef.current || !audioBuffer) return;

    if (isPlaying) {
      sourceRef.current?.stop();
      setIsPlaying(false);
      startTimeRef.current = currentTime; // Save position
      cancelAnimationFrame(animationFrameRef.current);
    } else {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      sourceRef.current = source;

      startedAtRef.current = audioContextRef.current.currentTime;
      
      const offset = startTimeRef.current % duration;
      source.start(0, offset);
      setIsPlaying(true);
      
      source.onended = () => {
        if (isPlaying) {
            setIsPlaying(false);
            startTimeRef.current = 0;
            setCurrentTime(0);
            setProgress(0);
        }
        cancelAnimationFrame(animationFrameRef.current);
      };
      
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-4 w-full bg-gray-700/50 p-3 rounded-lg">
      <button
        onClick={handlePlayPause}
        disabled={!audioBuffer}
        className="p-3 bg-blue-600 rounded-full text-white hover:bg-blue-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
      </button>
      <div className="flex-grow flex items-center gap-3">
        <span className="text-sm font-mono text-gray-300 w-12 text-center">{formatTime(currentTime)}</span>
        <div className="w-full bg-gray-600 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full"
            style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}
          ></div>
        </div>
        <span className="text-sm font-mono text-gray-400 w-12 text-center">{formatTime(duration)}</span>
      </div>
    </div>
  );
};
