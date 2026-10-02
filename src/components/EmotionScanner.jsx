import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useFaceApiSkill } from '../hooks/useFaceApiSkill';
import { useHumeAudioSkill } from '../hooks/useHumeAudioSkill';

const EMOTION_ORDER = ['neutral', 'happy', 'surprised', 'angry', 'sad', 'curious'];
const EMOTION_COLORS = {
  neutral: 'from-gray-300 to-gray-500 text-gray-400',
  happy: 'from-emerald-400 to-teal-500 text-emerald-400',
  surprised: 'from-amber-300 to-orange-400 text-amber-400',
  angry: 'from-rose-500 to-red-600 text-rose-500',
  sad: 'from-blue-400 to-indigo-500 text-blue-400',
  curious: 'from-fuchsia-400 to-purple-500 text-fuchsia-400'
};
const EMOTION_EMOJIS = {
  neutral: '😐',
  happy: '😊',
  surprised: '😲',
  angry: '😡',
  sad: '😢',
  curious: '🤔'
};

export default function EmotionScanner() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [fusedEmotions, setFusedEmotions] = useState([]);
  
  const { topEmotions: videoEmotions, isScanning: isVideoScanning, error: videoError, startScanning: startVideo, stopScanning: stopVideo } = useFaceApiSkill();
  const { audioEmotions, hasAudioData, isAudioScanning, startAudio, stopAudio, audioError } = useHumeAudioSkill();

  useEffect(() => {
    if (videoEmotions.length === 0) return;
    const fused = EMOTION_ORDER.map(emotionName => {
      const videoData = videoEmotions.find(e => e.name === emotionName);
      const vScore = videoData ? videoData.score : 0;
      const audioScore = audioEmotions[emotionName] || 0;
      const shouldBlend = isAudioScanning && hasAudioData;
      const finalScore = shouldBlend ? (vScore * 0.6) + (audioScore * 0.4) : vScore;
      return {
        name: emotionName,
        score: finalScore,
        videoScore: vScore,
        audioScore: shouldBlend ? audioScore : null
      };
    });
    setFusedEmotions(fused);
  }, [videoEmotions, audioEmotions, isAudioScanning, hasAudioData]);

  const handleStartCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setHasPermission(true);
          startVideo(videoRef.current, canvasRef.current);
          startAudio();
        };
      }
    } catch (err) {
      console.error("Camera access denied or failed", err);
    }
  }, [startVideo, startAudio]);

  const handleStopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setHasPermission(false);
    setFusedEmotions([]);
    stopVideo();
    stopAudio();
  }, [stopVideo, stopAudio]);

  const dominantEmotion = fusedEmotions.length > 0 
    ? [...fusedEmotions].sort((a, b) => b.score - a.score)[0] 
    : null;

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      {/* Immersive Background Glow based on dominant emotion */}
      <div 
        className="absolute inset-0 opacity-20 transition-all duration-1000 ease-in-out blur-[120px] pointer-events-none"
        style={{
          background: dominantEmotion 
            ? `radial-gradient(circle at 50% 50%, var(--tw-gradient-stops))`
            : 'radial-gradient(circle at 50% 50%, #1e1b4b, #000000)'
        }}
      >
        {dominantEmotion && (
          <div className={`absolute inset-0 bg-gradient-to-r ${EMOTION_COLORS[dominantEmotion.name].split(' ')[0]} ${EMOTION_COLORS[dominantEmotion.name].split(' ')[1]}`}></div>
        )}
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 md:py-12 relative z-10 flex flex-col min-h-screen">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 md:mb-12">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">EmotionScan</h1>
              <p className="text-slate-400 text-xs tracking-widest uppercase mt-0.5">Neural Biometric Engine</p>
            </div>
          </div>
          
          {/* Controls */}
          <div>
            {!isVideoScanning ? (
              <button 
                onClick={handleStartCamera}
                className="group relative px-6 py-3 rounded-full overflow-hidden bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative text-sm font-semibold text-white tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  INITIALIZE SENSORS
                </span>
              </button>
            ) : (
              <button 
                onClick={handleStopCamera}
                className="px-6 py-3 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all active:scale-95"
              >
                <span className="text-sm font-semibold text-rose-400 tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  TERMINATE
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
          
          {/* Left Column: Camera Feed */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="relative rounded-[2rem] overflow-hidden bg-black/40 border border-white/5 shadow-2xl backdrop-blur-3xl aspect-[16/10] flex items-center justify-center group ring-1 ring-white/10">
              
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${hasPermission ? 'opacity-100' : 'opacity-0'}`}
              />
              <canvas 
                ref={canvasRef} 
                className={`absolute inset-0 w-full h-full object-cover z-20 pointer-events-none transition-opacity duration-1000 ${hasPermission ? 'opacity-100' : 'opacity-0'}`}
              />
              
              {/* Standby UI */}
              {!hasPermission && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                  <svg className="w-16 h-16 mb-6 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm tracking-[0.2em] font-medium uppercase text-slate-400">Sensors Offline</span>
                </div>
              )}

              {/* Scanning Overlay Effect */}
              {isVideoScanning && (
                <div className="absolute inset-0 pointer-events-none z-30">
                  {/* Subtle vignette */}
                  <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]"></div>
                  {/* Scanning line */}
                  <div className="w-full h-[1px] bg-indigo-500/30 absolute animate-[scan_4s_ease-in-out_infinite] shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                  {/* Crosshairs */}
                  <div className="absolute top-8 left-8 w-4 h-4 border-t-2 border-l-2 border-white/20"></div>
                  <div className="absolute top-8 right-8 w-4 h-4 border-t-2 border-r-2 border-white/20"></div>
                  <div className="absolute bottom-8 left-8 w-4 h-4 border-b-2 border-l-2 border-white/20"></div>
                  <div className="absolute bottom-8 right-8 w-4 h-4 border-b-2 border-r-2 border-white/20"></div>
                </div>
              )}

              {/* Active Sensor Badges */}
              {isVideoScanning && (
                <div className="absolute bottom-6 left-6 z-40 flex gap-3">
                  <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                    <span className="text-[10px] font-mono tracking-wider text-emerald-400">VISION: ML ACTIVE</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${isAudioScanning ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`}></div>
                    <span className={`text-[10px] font-mono tracking-wider ${isAudioScanning ? 'text-amber-400' : 'text-slate-500'}`}>
                      AUDIO: {isAudioScanning ? 'FUSION ACTIVE' : 'STANDBY'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Telemetry */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Primary Diagnosis */}
            <div className="rounded-[2rem] bg-white/5 border border-white/5 backdrop-blur-xl p-8 relative overflow-hidden h-48 flex flex-col justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
              
              {!isVideoScanning ? (
                <div className="text-center">
                  <p className="text-slate-500 font-mono text-sm tracking-widest">AWAITING SUBJECT</p>
                </div>
              ) : dominantEmotion ? (
                <div className="relative z-10 flex flex-col items-center">
                  <span className="text-[10px] font-mono tracking-[0.2em] text-slate-400 uppercase mb-3">Primary Diagnosis</span>
                  <div className="flex items-center justify-center gap-4">
                    <span className="text-5xl drop-shadow-2xl">{EMOTION_EMOJIS[dominantEmotion.name]}</span>
                    <div className="flex flex-col">
                      <span className="text-slate-300 text-sm">{dominantEmotion.score > 0.4 ? 'Subject is' : 'Subject is mostly'}</span>
                      <span className={`text-4xl font-bold tracking-tight capitalize ${EMOTION_COLORS[dominantEmotion.name].split(' ')[2]}`} style={{ textShadow: '0 0 20px currentColor' }}>
                        {dominantEmotion.name}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-indigo-400/50">
                  <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-3"></div>
                  <p className="font-mono text-[10px] tracking-widest">PROCESSING...</p>
                </div>
              )}
            </div>

            {/* Neural Spectrum */}
            <div className="rounded-[2rem] bg-white/5 border border-white/5 backdrop-blur-xl p-8 flex-1 flex flex-col relative">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-semibold tracking-widest text-slate-300 uppercase">Neural Spectrum</h3>
                {isVideoScanning && <span className="text-[10px] font-mono text-slate-500">LIVE FEED</span>}
              </div>

              {!isVideoScanning ? (
                 <div className="flex-1 flex items-center justify-center">
                    <div className="w-full space-y-6">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"></div>
                      ))}
                    </div>
                 </div>
              ) : (
                <div className="space-y-6 flex-1 flex flex-col justify-center">
                  {fusedEmotions.map((emotion) => (
                    <div key={emotion.name} className="w-full">
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-sm font-medium text-slate-300 capitalize tracking-wide flex items-center gap-2">
                          <span className="text-lg">{EMOTION_EMOJIS[emotion.name]}</span>
                          {emotion.name}
                        </span>
                        
                        <div className="flex items-baseline gap-2">
                          {emotion.audioScore > 0 && (
                             <span className="text-[10px] text-amber-400/70 font-mono tracking-tighter" title="Sonic Prosody Input">
                               ♪ {(emotion.audioScore * 100).toFixed(0)}%
                             </span>
                          )}
                          <span className="font-mono text-sm text-white font-medium">
                            {(emotion.score * 100).toFixed(1)}<span className="text-slate-500 text-xs ml-0.5">%</span>
                          </span>
                        </div>
                      </div>

                      {/* Premium Bar Design */}
                      <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden ring-1 ring-white/5 shadow-inner relative">
                        <div 
                          className={`absolute top-0 bottom-0 left-0 rounded-full bg-gradient-to-r ${EMOTION_COLORS[emotion.name].split(' ')[0]} ${EMOTION_COLORS[emotion.name].split(' ')[1]} transition-all duration-300 ease-out`}
                          style={{ width: `${Math.max(emotion.score * 100, 2)}%` }}
                        >
                          <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-r from-transparent to-white/40 mix-blend-overlay"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}} />
    </div>
  );
}
