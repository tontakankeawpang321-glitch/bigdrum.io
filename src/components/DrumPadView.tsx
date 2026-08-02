import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Music, Sparkles, Smartphone, RotateCcw, Hand, VolumeX } from 'lucide-react';
import { DrumSoundParams, HitType } from '../types';
import { drumAudio } from '../audio/drumAudioEngine';

interface DrumPadViewProps {
  soundParams: DrumSoundParams;
  onRecordHit?: (type: HitType, velocity: number) => void;
  isRecording?: boolean;
  onOpenSoundTuner: () => void;
  onOpenSequencer: () => void;
  onOpenProjects: () => void;
  onUpdateSoundParams?: (newParams: DrumSoundParams) => void;
}

interface RippleEffect {
  id: string;
  x: number;
  y: number;
  color: string;
  type: HitType;
}

export const DrumPadView: React.FC<DrumPadViewProps> = ({
  soundParams,
  onRecordHit,
  isRecording = false,
  onOpenSoundTuner,
  onOpenSequencer,
  onOpenProjects,
  onUpdateSoundParams,
}) => {
  const [ripples, setRipples] = useState<RippleEffect[]>([]);
  const [activeZone, setActiveZone] = useState<HitType | null>(null);
  const [isHandMuted, setIsHandMuted] = useState(false);
  const drumRef = useRef<HTMLDivElement>(null);

  // Trigger sound hit and animation
  const triggerHitZone = useCallback(
    (type: HitType, clientX?: number, clientY?: number, customVelocity?: number) => {
      let finalType = type;
      if (isHandMuted && type !== 'rim') {
        finalType = 'mute';
      }

      const velocity = customVelocity ?? (finalType === 'mute' ? 0.6 : 0.9);

      // Play audio
      drumAudio.triggerHit(finalType, soundParams, velocity);

      // Report hit for live recording if active
      if (onRecordHit) {
        onRecordHit(finalType, velocity);
      }

      // Trigger haptic feedback if available on mobile
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        try {
          navigator.vibrate(finalType === 'rim' ? 15 : 30);
        } catch {
          // Ignore
        }
      }

      // Active zone visual pulse
      setActiveZone(finalType);
      setTimeout(() => setActiveZone(null), 150);

      // Add ripple effect if coordinates provided
      if (clientX !== undefined && clientY !== undefined && drumRef.current) {
        const rect = drumRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        let color = '#ef4444'; // Red for center
        if (finalType === 'rim') color = '#3b82f6'; // Blue for rim
        if (finalType === 'edge') color = '#f59e0b'; // Amber for edge
        if (finalType === 'mute') color = '#10b981'; // Green for mute

        const newRipple: RippleEffect = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          x,
          y,
          color,
          type: finalType,
        };

        setRipples(prev => [...prev.slice(-8), newRipple]);
        setTimeout(() => {
          setRipples(prev => prev.filter(r => r.id !== newRipple.id));
        }, 500);
      }
    },
    [soundParams, isHandMuted, onRecordHit]
  );

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        triggerHitZone('center');
      } else if (e.code === 'KeyR') {
        triggerHitZone('rim');
      } else if (e.code === 'KeyE') {
        triggerHitZone('edge');
      } else if (e.code === 'KeyM') {
        triggerHitZone('mute');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerHitZone]);

  // Handle drum click/touch location analysis
  const handleDrumPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!drumRef.current) return;

    const rect = drumRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const dx = clickX - centerX;
    const dy = clickY - centerY;
    const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = rect.width / 2;

    const normalizedDist = distanceFromCenter / maxRadius;

    let hitType: HitType = 'center';
    if (normalizedDist > 0.82) {
      hitType = 'rim'; // Red wooden rim outer border
    } else if (normalizedDist > 0.58) {
      hitType = 'edge'; // Edge ring of drumhead
    } else {
      hitType = 'center'; // Center drumhead boom
    }

    // Velocity based on distance or pressure if available
    let velocity = 0.85;
    if (e.pressure && e.pressure > 0) {
      velocity = Math.min(1.0, 0.4 + e.pressure * 0.6);
    }

    triggerHitZone(hitType, e.clientX, e.clientY, velocity);
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full max-w-md mx-auto bg-[#1a1b1f] text-slate-100 p-3 sm:p-4 rounded-3xl shadow-2xl border border-[#2d2e35] relative overflow-hidden select-none">
      {/* Background Stage Glow */}
      <div className="absolute inset-0 bg-radial from-[#e63946]/10 via-[#0f0f12] to-[#0f0f12] pointer-events-none" />

      {/* Header controls inside mobile frame */}
      <div className="w-full flex items-center justify-between z-10 bg-[#22242a] p-2.5 rounded-2xl border border-[#2d2e35] shadow-lg mb-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#e63946] flex items-center justify-center shadow-md shadow-[#e63946]/30">
            <Volume2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              กลองใหญ่สากล <span className="text-[10px] bg-[#e63946]/20 text-[#e63946] border border-[#e63946]/40 px-1.5 py-0.5 rounded-md font-mono font-bold">PRO CONCERT</span>
            </h2>
            <p className="text-[11px] text-[#8e9299] truncate max-w-[150px]">{soundParams.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onUpdateSoundParams && (
            <button
              onClick={() => {
                const currentVol = soundParams.masterVolume || 1.0;
                let nextVol = 1.0;
                if (currentVol < 1.25) nextVol = 1.5;
                else if (currentVol < 1.75) nextVol = 2.0;
                else nextVol = 1.0;

                const newParams = {
                  ...soundParams,
                  masterVolume: nextVol,
                  rimVolume: nextVol,
                };
                onUpdateSoundParams(newParams);
                drumAudio.triggerHit('center', newParams, 1.0);
              }}
              className={`px-2 py-1.5 text-xs font-bold rounded-xl border flex items-center gap-1 transition active:scale-95 shadow ${
                (soundParams.masterVolume || 1.0) >= 1.9
                  ? 'bg-[#e63946] text-white border-[#e63946] shadow-[#e63946]/40 font-mono'
                  : (soundParams.masterVolume || 1.0) >= 1.4
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-mono'
                  : 'bg-[#2a2c33] text-slate-300 border-[#2d2e35] font-mono'
              }`}
              title="สลับความดัง: 100% -> 150% -> 200%"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#e63946]" />
              <span>{Math.round((soundParams.masterVolume || 1.0) * 100)}%</span>
            </button>
          )}

          <button
            onClick={onOpenSoundTuner}
            className="px-2.5 py-1.5 bg-[#2a2c33] hover:bg-[#33353e] text-slate-200 text-xs font-medium rounded-xl border border-[#2d2e35] flex items-center gap-1.5 transition active:scale-95 shadow"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>ปรับเสียง</span>
          </button>
        </div>
      </div>

      {/* Quick Hit Zone Indicator Badge */}
      <div className="w-full flex items-center justify-center gap-1.5 z-10 text-[11px] font-medium my-1">
        <span
          className={`px-2.5 py-1 rounded-full border transition-all duration-150 ${
            activeZone === 'center'
              ? 'bg-red-500/20 text-red-300 border-red-500 shadow-sm shadow-red-500/50 scale-105'
              : 'bg-slate-900/80 text-slate-400 border-slate-800'
          }`}
        >
          🎯 หน้ากลอง
        </span>
        <span
          className={`px-2.5 py-1 rounded-full border transition-all duration-150 ${
            activeZone === 'edge'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-sm shadow-amber-500/50 scale-105'
              : 'bg-slate-900/80 text-slate-400 border-slate-800'
          }`}
        >
          ⭕ ริมกลอง
        </span>
        <span
          className={`px-2.5 py-1 rounded-full border transition-all duration-150 ${
            activeZone === 'rim'
              ? 'bg-blue-500/20 text-blue-300 border-blue-500 shadow-sm shadow-blue-500/50 scale-105'
              : 'bg-slate-900/80 text-slate-400 border-slate-800'
          }`}
        >
          🪵 ขอบไม้
        </span>
        {isHandMuted && (
          <span className="px-2.5 py-1 rounded-full border bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm animate-pulse">
            ✋ ซับเสียงอยู่
          </span>
        )}
      </div>

      {/* Main Drum Interactive View */}
      <div className="relative w-full my-auto flex items-center justify-center p-1 sm:p-2 z-10 flex-1 min-h-[220px]">
        {/* 3D Bass Drum Container styled identically to reference image */}
        <motion.div
          ref={drumRef}
          onPointerDown={handleDrumPointerDown}
          animate={{
            scale: activeZone ? 0.985 : 1.0,
            rotate: activeZone === 'rim' ? 0.5 : activeZone === 'center' ? -0.5 : 0,
          }}
          transition={{ type: 'spring', stiffness: 600, damping: 30 }}
          className="relative w-full max-w-[270px] xs:max-w-[310px] sm:max-w-[340px] aspect-square rounded-full cursor-pointer touch-none shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-4 border-slate-900 group select-none"
        >
          {/* Drum Shell Side Depth & Stripes (Behind hoop) */}
          <div className="absolute -inset-2.5 rounded-full bg-gradient-to-tr from-slate-200 via-slate-100 to-slate-300 shadow-2xl -z-10 overflow-hidden">
            {/* Red & Blue Stripes on white drum shell like reference image */}
            <div className="absolute top-1/2 left-0 right-0 h-10 -translate-y-1/2 bg-gradient-to-r from-red-600 via-white to-blue-600 opacity-20 transform -rotate-12" />
          </div>

          {/* RED OUTER WOODEN HOOP / RIM (ขอบกลองไม้สีแดงสด) */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-600 via-red-700 to-red-900 border-[14px] border-red-700 shadow-inner flex items-center justify-center overflow-hidden">
            {/* Metallic Claws & Tension Lugs Around Rim (10 Metal Lug Brackets like image) */}
            {Array.from({ length: 10 }).map((_, i) => {
              const angle = (i * 360) / 10;
              const rad = (angle * Math.PI) / 180;
              const percent = 48; // Position near rim inner edge
              const x = 50 + percent * Math.cos(rad);
              const y = 50 + percent * Math.sin(rad);

              return (
                <div
                  key={i}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: `translate(-50%, -50%) rotate(${angle + 90}deg)`,
                  }}
                  className="absolute pointer-events-none z-20"
                >
                  {/* Metal Claw Bracket */}
                  <div className="w-3.5 h-6 bg-gradient-to-r from-slate-300 via-slate-100 to-slate-400 rounded-sm shadow-md border border-slate-500 flex flex-col items-center justify-between p-0.5">
                    <div className="w-2 h-1 bg-slate-800 rounded-full" />
                    <div className="w-2.5 h-1.5 bg-slate-400 border border-slate-600" />
                  </div>
                </div>
              );
            })}

            {/* Inner Dark Rim Shadow Gap */}
            <div className="w-full h-full rounded-full bg-slate-900/40 p-2 shadow-inner flex items-center justify-center">
              {/* WHITE DRUM HEAD (หนังกลองสากลสีครีม/ขาว) */}
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-slate-50 via-amber-50/60 to-slate-200 border border-amber-200/50 shadow-[inset_0_10px_30px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center overflow-hidden">
                {/* Skin Texture Overtone Lines */}
                <div className="absolute inset-0 bg-radial from-transparent via-amber-100/20 to-slate-400/20 pointer-events-none" />

                {/* Edge Strike Ring Line Indicator */}
                <div className="absolute inset-8 rounded-full border border-dashed border-slate-400/30 pointer-events-none" />

                {/* "REGENT" Style Emblem Logo in upper-center like reference image */}
                <div className="relative z-10 flex flex-col items-center justify-center -mt-8 opacity-80 pointer-events-none select-none">
                  <div className="flex items-center gap-1 text-slate-900 font-black tracking-tighter text-2xl">
                    <div className="w-8 h-8 rounded-full border-4 border-slate-900 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-slate-900" />
                    </div>
                  </div>
                  <span className="text-[13px] font-extrabold tracking-widest text-slate-900 uppercase font-serif mt-0.5">REGENT</span>
                  <span className="text-[9px] font-semibold text-slate-600 tracking-wider">CONCERT BASS</span>
                </div>

                {/* Center Target Indicator */}
                <div className="absolute w-20 h-20 rounded-full border border-red-500/20 flex items-center justify-center pointer-events-none">
                  <div className="w-3 h-3 rounded-full bg-red-500/30" />
                </div>

                {/* Hit Ripples Rendering */}
                {ripples.map(r => (
                  <motion.div
                    key={r.id}
                    initial={{ scale: 0.1, opacity: 0.9 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    style={{
                      left: r.x,
                      top: r.y,
                      backgroundColor: r.color,
                    }}
                    className="absolute w-12 h-12 -ml-6 -mt-6 rounded-full blur-sm pointer-events-none z-30"
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Touch Control Pad Buttons for Mobile Accessibility */}
      <div className="w-full grid grid-cols-4 gap-2 z-10 my-2">
        <button
          onClick={() => triggerHitZone('center')}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-gradient-to-b from-red-600 to-red-800 text-white font-bold shadow-lg shadow-red-900/40 border border-red-500/50 active:scale-95 transition"
        >
          <span className="text-xs">🎯 กลาง</span>
          <span className="text-[10px] text-red-200 font-normal">Center Boom</span>
        </button>

        <button
          onClick={() => triggerHitZone('edge')}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-gradient-to-b from-amber-600 to-amber-800 text-white font-bold shadow-lg shadow-amber-900/40 border border-amber-500/50 active:scale-95 transition"
        >
          <span className="text-xs">⭕ ริม</span>
          <span className="text-[10px] text-amber-200 font-normal">Edge Ring</span>
        </button>

        <button
          onClick={() => triggerHitZone('rim')}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-gradient-to-b from-blue-600 to-blue-800 text-white font-bold shadow-lg shadow-blue-900/40 border border-blue-500/50 active:scale-95 transition"
        >
          <span className="text-xs">🪵 ขอบไม้</span>
          <span className="text-[10px] text-blue-200 font-normal">Rim Shot</span>
        </button>

        <button
          onClick={() => setIsHandMuted(!isHandMuted)}
          className={`flex flex-col items-center justify-center p-2.5 rounded-2xl font-bold shadow-lg border active:scale-95 transition ${
            isHandMuted
              ? 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-900/40'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          {isHandMuted ? <VolumeX className="w-4 h-4 text-emerald-200 mb-0.5" /> : <Hand className="w-4 h-4 text-slate-300 mb-0.5" />}
          <span className="text-xs">{isHandMuted ? 'ซับเสียงอยู่' : '✋ ซับเสียง'}</span>
          <span className="text-[10px] opacity-80 font-normal">Hand Mute</span>
        </button>
      </div>

      {/* Main Bottom Navigation Bar for Composer, Sequencer, & Projects */}
      <div className="w-full grid grid-cols-2 gap-2 z-10 pt-1 border-t border-[#2d2e35]">
        <button
          onClick={onOpenSequencer}
          className="py-2.5 px-3 bg-[#e63946] hover:bg-[#d62839] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#e63946]/30 transition active:scale-95"
        >
          <Music className="w-4 h-4" />
          <span>แต่งเพลง / จังหวะ (Sequencer)</span>
        </button>

        <button
          onClick={onOpenProjects}
          className="py-2.5 px-3 bg-[#2a2c33] hover:bg-[#33353e] text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 border border-[#2d2e35] shadow-md transition active:scale-95"
        >
          <Smartphone className="w-4 h-4 text-[#8e9299]" />
          <span>บันทึกโปรเจค / ส่งออก</span>
        </button>
      </div>
    </div>
  );
};
