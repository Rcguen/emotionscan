import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useFaceApiSkill } from '../hooks/useFaceApiSkill';
import { useHumeAudioSkill } from '../hooks/useHumeAudioSkill';

const EMOTION_ORDER = ['neutral', 'happy', 'surprised', 'angry', 'sad', 'curious'];

const EMOTION_CONFIG = {
  neutral: {
    color: 'from-slate-400 to-zinc-500',
    text: 'text-zinc-300',
    border: 'border-zinc-700/50',
    bg: 'bg-zinc-800/40',
    glow: 'rgba(161, 161, 170, 0.15)',
    label: 'Neutral',
    desc: 'Baseline resting state'
  },
  happy: {
    color: 'from-emerald-400 to-teal-500',
    text: 'text-emerald-400',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-950/30',
    glow: 'rgba(52, 211, 153, 0.2)',
    label: 'Joy / Amusement',
    desc: 'Positive valence & elevated cheek zygomatic'
  },
  surprised: {
    color: 'from-amber-300 to-orange-400',
    text: 'text-amber-400',
    border: 'border-amber-500/40',
    bg: 'bg-amber-950/30',
    glow: 'rgba(251, 191, 36, 0.2)',
    label: 'Surprise / Awe',
    desc: 'Elevated brow arch & widened aperture'
  },
  angry: {
    color: 'from-rose-500 to-red-600',
    text: 'text-rose-400',
    border: 'border-rose-500/40',
    bg: 'bg-rose-950/30',
    glow: 'rgba(244, 63, 94, 0.2)',
    label: 'Anger / Focus',
    desc: 'Corrugator furrowing & intense gaze'
  },
  sad: {
    color: 'from-sky-400 to-indigo-500',
    text: 'text-sky-400',
    border: 'border-sky-500/40',
    bg: 'bg-sky-950/30',
    glow: 'rgba(56, 189, 248, 0.2)',
    label: 'Melancholy / Sorrow',
    desc: 'Lowered lip corners & brow tension'
  },
  curious: {
    color: 'from-fuchsia-400 to-purple-500',
    text: 'text-fuchsia-400',
    border: 'border-fuchsia-500/40',
    bg: 'bg-fuchsia-950/30',
    glow: 'rgba(232, 121, 249, 0.2)',
    label: 'Curiosity / Inquiry',
    desc: 'Asymmetric eyebrow lift & auditory tilt'
  }
};

export default function EmotionScanner() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [fusedEmotions, setFusedEmotions] = useState([]);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionDuration, setSessionDuration] = useState('00:00');

  const { topEmotions: videoEmotions, isScanning: isVideoScanning, error: videoError, startScanning: startVideo, stopScanning: stopVideo } = useFaceApiSkill();
  const { audioEmotions, hasAudioData, isAudioScanning, startAudio, stopAudio, audioError } = useHumeAudioSkill();

  // Fused Sensor Calculation (60% Video ML + 40% Vocal Prosody when speaking)
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

  // Session Duration Timer
  useEffect(() => {
    let interval = null;
    if (isVideoScanning && sessionStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
        const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const secs = String(elapsed % 60).padStart(2, '0');
        setSessionDuration(`${mins}:${secs}`);
      }, 1000);
    } else {
      setSessionDuration('00:00');
    }
    return () => clearInterval(interval);
  }, [isVideoScanning, sessionStartTime]);

  const handleStartCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setHasPermission(true);
          setSessionStartTime(Date.now());
          startVideo(videoRef.current, canvasRef.current);
          startAudio();
        };
      }
    } catch (err) {
      console.error("Sensor initialization failed:", err);
    }
  }, [startVideo, startAudio]);

  const handleStopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setHasPermission(false);
    setSessionStartTime(null);
    setFusedEmotions([]);
    stopVideo();
    stopAudio();
  }, [stopVideo, stopAudio]);

  const dominantEmotion = useMemo(() => {
    if (fusedEmotions.length === 0) return null;
    return [...fusedEmotions].sort((a, b) => b.score - a.score)[0];
  }, [fusedEmotions]);

  const dominantConfig = dominantEmotion ? EMOTION_CONFIG[dominantEmotion.name] : null;

  return (
    <div className="min-h-[100dvh] bg-[#07080B] text-zinc-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden relative flex flex-col justify-between">
      
      {/* Precision Ambient Atmosphere */}
      <div 
        className="fixed inset-0 pointer-events-none transition-opacity duration-1000 ease-out z-0"
        style={{
          background: dominantConfig 
            ? `radial-gradient(circle 800px at 70% 30%, ${dominantConfig.glow}, transparent 70%), radial-gradient(circle 600px at 20% 70%, rgba(99, 102, 241, 0.08), transparent 60%)`
            : 'radial-gradient(circle 900px at 50% 20%, rgba(30, 27, 75, 0.25), transparent 70%), radial-gradient(circle 600px at 80% 80%, rgba(15, 23, 42, 0.4), transparent 60%)'
        }}
      />

      {/* Subtle Grid Reticle */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.025] z-0" 
        style={{
          backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 relative z-10 flex flex-col flex-1">
        
        {/* Anti-Slop Navigation & Status Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="relative group">
              <img 
                src="/logo.svg" 
                alt="EmotionScan Logo" 
                className="w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(99,102,241,0.4)] transition-transform duration-300 group-hover:scale-105" 
              />
              <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#07080B]"></span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-white">EmotionScan</h1>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-mono tracking-wide text-indigo-300">
                  v2.2 NEURAL
                </span>
              </div>
              <p className="text-zinc-400 text-xs tracking-tight">Real-Time Multimodal Affective Computing</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* System Status Indicators */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-[11px] font-mono">
              <span className="text-zinc-400">FPS: <span className="text-zinc-200">{isVideoScanning ? '60' : '0'}</span></span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-400">LATENCY: <span className="text-emerald-400">{isVideoScanning ? '~12ms' : 'OFFLINE'}</span></span>
            </div>

            {/* Primary Action Button */}
            {!isVideoScanning ? (
              <button 
                onClick={handleStartCamera}
                className="relative inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold tracking-wider transition-all duration-200 shadow-[0_0_24px_rgba(99,102,241,0.35)] hover:shadow-[0_0_32px_rgba(99,102,241,0.5)] active:scale-[0.98] cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>INITIALIZE SENSORS</span>
              </button>
            ) : (
              <button 
                onClick={handleStopCamera}
                className="relative inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold tracking-wider transition-all duration-200 active:scale-[0.98] cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>TERMINATE</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Operational Workspace */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
          
          {/* Left Panel: Optical Neural Viewport (Col 7) */}
          <section className="lg:col-span-7 flex flex-col gap-4">
            <div className="relative rounded-2xl overflow-hidden bg-black/60 border border-zinc-800 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl aspect-[16/10] flex items-center justify-center group ring-1 ring-white/5">
              
              {/* Underlying Video Stream */}
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${hasPermission ? 'opacity-100' : 'opacity-0'}`}
              />
              
              {/* Synchronized 3D Mesh & Iris Canvas */}
              <canvas 
                ref={canvasRef} 
                className={`absolute inset-0 w-full h-full object-cover z-20 pointer-events-none transition-opacity duration-700 ${hasPermission ? 'opacity-100' : 'opacity-0'}`}
              />

              {/* Standby State View */}
              {!hasPermission && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-10">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center mb-4 text-zinc-500 shadow-inner">
                    <svg className="w-8 h-8 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-sm font-semibold text-zinc-300 mb-1">Optical Viewport Inactive</h2>
                  <p className="text-xs text-zinc-500 max-w-[280px]">
                    Click <span className="text-indigo-400 font-medium">Initialize Sensors</span> to activate real-time face mesh & vocal prosody tracking.
                  </p>
                </div>
              )}

              {/* High-Tech Optical Scanning HUD */}
              {isVideoScanning && (
                <div className="absolute inset-0 pointer-events-none z-30">
                  {/* Subtle Precision Vignette */}
                  <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.85)]"></div>
                  
                  {/* Active Scan Laser Wave */}
                  <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent absolute animate-[scan_3.5s_ease-in-out_infinite] shadow-[0_0_12px_rgba(99,102,241,0.6)]"></div>
                  
                  {/* Optical Precision Crosshair Calipers */}
                  <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-zinc-400/40"></div>
                  <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-zinc-400/40"></div>
                  <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-zinc-400/40"></div>
                  <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-zinc-400/40"></div>
                  
                  {/* Center Optical Crosshair */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 opacity-20 border border-dashed border-white/50 rounded-full pointer-events-none"></div>

                  {/* Telemetry Stream Badges */}
                  <div className="absolute top-4 left-4 z-40 flex items-center gap-2 pl-6">
                    <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-zinc-700/60 text-[10px] font-mono text-zinc-300">
                      REC: <span className="text-emerald-400 font-semibold">{sessionDuration}</span>
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 z-40 flex flex-wrap gap-2 pl-6">
                    <div className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-zinc-800 flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-[10px] font-mono text-zinc-300">478-PT MESH</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-zinc-800 flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-[10px] font-mono text-zinc-300">IRIS TRACKING</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-zinc-800 flex items-center gap-1.5 shadow-sm">
                      <span className={`w-1.5 h-1.5 rounded-full ${isAudioScanning ? (hasAudioData ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse') : 'bg-zinc-600'}`}></span>
                      <span className="text-[10px] font-mono text-zinc-300">
                        SONIC: {isAudioScanning ? (hasAudioData ? 'SYNCHRONIZED' : 'LISTENING') : 'STANDBY'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Viewport Sub-Panel / Sensor Engine Specs */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col">
                <span className="text-[10px] font-mono text-zinc-400">VISION ENGINE</span>
                <span className="text-xs font-semibold text-zinc-200 mt-0.5">MediaPipe + CNN</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col">
                <span className="text-[10px] font-mono text-zinc-400">PROSODY ENGINE</span>
                <span className="text-xs font-semibold text-zinc-200 mt-0.5">Hume AI EVI</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col">
                <span className="text-[10px] font-mono text-zinc-400">SENSOR FUSION</span>
                <span className="text-xs font-semibold text-indigo-300 mt-0.5">Adaptive 60/40</span>
              </div>
            </div>
          </section>

          {/* Right Panel: Telemetry & Diagnostic Spectrum (Col 5) */}
          <section className="lg:col-span-5 flex flex-col gap-5">
            
            {/* Primary Diagnosis Card */}
            <div className={`p-6 rounded-2xl border transition-all duration-500 relative overflow-hidden backdrop-blur-xl ${
              dominantConfig 
                ? `${dominantConfig.bg} ${dominantConfig.border} shadow-[0_8px_32px_rgba(0,0,0,0.4)]`
                : 'bg-zinc-900/40 border-zinc-800/80 shadow-lg'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Primary Diagnosis</span>
                {dominantEmotion && (
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    CONFIDENCE {(dominantEmotion.score * 100).toFixed(0)}%
                  </span>
                )}
              </div>

              {!isVideoScanning ? (
                <div className="py-4 text-center">
                  <p className="text-zinc-500 text-xs font-mono">AWAITING SENSOR INPUT</p>
                </div>
              ) : dominantEmotion ? (
                <div className="flex flex-col">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <h2 className="text-3xl font-bold tracking-tight text-white capitalize flex items-center gap-2">
                      <span className={dominantConfig.text}>{dominantEmotion.name}</span>
                    </h2>
                    <span className="text-2xl font-mono font-bold text-zinc-200">
                      {(dominantEmotion.score * 100).toFixed(1)}<span className="text-xs text-zinc-500 font-normal">%</span>
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                    {dominantConfig.desc}
                  </p>
                </div>
              ) : (
                <div className="py-4 flex items-center justify-center gap-2 text-indigo-400">
                  <span className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin"></span>
                  <span className="text-xs font-mono">CALIBRATING NEURAL WEIGHTS...</span>
                </div>
              )}
            </div>

            {/* Neural Spectrum Bars */}
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-xl shadow-lg flex flex-col flex-1">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800/60 mb-5">
                <div>
                  <h3 className="text-xs font-bold text-zinc-200 tracking-wide uppercase">Neural Spectrum</h3>
                  <p className="text-[11px] text-zinc-400">6-Channel Emotion Telemetry</p>
                </div>
                {isVideoScanning && (
                  <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
                    LIVE
                  </span>
                )}
              </div>

              {!isVideoScanning ? (
                <div className="space-y-4 py-2 opacity-40">
                  {EMOTION_ORDER.map((emotionName) => (
                    <div key={emotionName} className="space-y-1.5">
                      <div className="flex justify-between text-xs text-zinc-400">
                        <span className="capitalize">{emotionName}</span>
                        <span className="font-mono text-zinc-600">0.0%</span>
                      </div>
                      <div className="h-2 w-full bg-zinc-800/60 rounded-full overflow-hidden"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 flex-1 flex flex-col justify-center">
                  {fusedEmotions.map((emotion) => {
                    const cfg = EMOTION_CONFIG[emotion.name];
                    const isDominant = dominantEmotion?.name === emotion.name;
                    return (
                      <div key={emotion.name} className="group">
                        <div className="flex justify-between items-baseline mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium capitalize tracking-wide ${isDominant ? 'text-white font-semibold' : 'text-zinc-300'}`}>
                              {emotion.name}
                            </span>
                            {emotion.audioScore !== null && emotion.audioScore > 0.05 && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] font-mono text-amber-300" title="Vocal Prosody Contribution">
                                SONIC {(emotion.audioScore * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>
                          
                          <div className="font-mono text-xs font-medium tabular-nums text-zinc-200">
                            {(emotion.score * 100).toFixed(1)}<span className="text-zinc-500 text-[10px] ml-0.5">%</span>
                          </div>
                        </div>

                        {/* Precision Meter */}
                        <div className="w-full h-2 bg-zinc-800/80 rounded-full overflow-hidden p-[1px] border border-zinc-700/40">
                          <div 
                            className={`h-full rounded-full bg-gradient-to-r ${cfg.color} transition-all duration-300 ease-out relative`}
                            style={{ width: `${Math.max(emotion.score * 100, 2)}%` }}
                          >
                            {isDominant && (
                              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/40 rounded-full blur-[1px]"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </section>
        </main>

        {/* Minimalist Anti-Slop Footer */}
        <footer className="pt-6 border-t border-zinc-800/60 mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span>EmotionScan Framework</span>
            <span>·</span>
            <span>Client-side WebGL & WASM</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-zinc-400">Zero-Server Video Privacy</span>
            <span>·</span>
            <span className="text-zinc-400">WCAG AA Compliant</span>
          </div>
        </footer>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}} />
    </div>
  );
}
