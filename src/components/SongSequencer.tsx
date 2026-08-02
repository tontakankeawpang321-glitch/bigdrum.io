import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Pause, RotateCcw, Music, Sliders, Zap, Sparkles, X, ChevronDown, Repeat } from 'lucide-react';
import { SongProject, StepNote, HitType } from '../types';
import { drumAudio } from '../audio/drumAudioEngine';
import { createSampleCadenceProject } from '../data/presetRhythms';

interface SongSequencerProps {
  isOpen: boolean;
  onClose: () => void;
  project: SongProject;
  onChangeProject: (updatedProject: SongProject) => void;
}

export const SongSequencer: React.FC<SongSequencerProps> = ({
  isOpen,
  onClose,
  project,
  onChangeProject,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedVelocity, setSelectedVelocity] = useState<number>(0.7); // 0.3, 0.7, 1.0
  const timerRef = useRef<number | null>(null);

  // Playback Loop Engine
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const bpm = project.bpm || 120;
    const intervalMs = (60 / bpm / 4) * 1000; // 16th note timing

    timerRef.current = window.setInterval(() => {
      setCurrentStep(prevStep => {
        const nextStep = (prevStep + 1) % project.stepsCount;

        // Trigger notes active on nextStep
        project.tracks.forEach(track => {
          const note = track.steps[nextStep];
          if (note && note.active) {
            drumAudio.triggerHit(track.id as HitType, project.soundParams, note.velocity || 0.7);
          }
        });

        return nextStep;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, project]);

  if (!isOpen) return null;

  const handleStepClick = (trackIndex: number, stepIndex: number) => {
    const updatedTracks = [...project.tracks];
    const currentNote = updatedTracks[trackIndex].steps[stepIndex];

    if (!currentNote.active) {
      // Activate with selected velocity
      updatedTracks[trackIndex].steps[stepIndex] = {
        active: true,
        type: updatedTracks[trackIndex].id as HitType,
        velocity: selectedVelocity,
      };
      // Audition hit
      drumAudio.triggerHit(updatedTracks[trackIndex].id as HitType, project.soundParams, selectedVelocity);
    } else {
      // Cycle velocity or deactivate: 0.3 -> 0.7 -> 1.0 -> off
      if (currentNote.velocity < 0.5) {
        currentNote.velocity = 0.7;
        drumAudio.triggerHit(updatedTracks[trackIndex].id as HitType, project.soundParams, 0.7);
      } else if (currentNote.velocity < 0.9) {
        currentNote.velocity = 1.0;
        drumAudio.triggerHit(updatedTracks[trackIndex].id as HitType, project.soundParams, 1.0);
      } else {
        currentNote.active = false;
      }
    }

    onChangeProject({
      ...project,
      tracks: updatedTracks,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleClearAll = () => {
    const updatedTracks = project.tracks.map(track => ({
      ...track,
      steps: track.steps.map(() => ({ active: false, type: track.id as HitType, velocity: 0.7 })),
    }));

    onChangeProject({
      ...project,
      tracks: updatedTracks,
    });
  };

  const handleLoadSampleCadence = () => {
    const sample = createSampleCadenceProject();
    onChangeProject({
      ...sample,
      id: project.id,
      name: project.name,
      soundParams: project.soundParams,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#1a1b1f] border border-[#2d2e35] rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Sequencer Header */}
        <div className="p-3.5 bg-[#0f0f12] border-b border-[#2d2e35] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#e63946]/20 text-[#e63946] border border-[#e63946]/30 flex items-center justify-center">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">เครื่องมือแต่งเพลงกลอง (Song Sequencer)</h3>
              <p className="text-[11px] text-[#8e9299]">แต่งจังหวะกลองใหญ่สากล วงโยธวาทิต หรือจังหวะที่คุณออกแบบเอง</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsPlaying(false);
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[#2a2c33] hover:bg-[#33353e] flex items-center justify-center text-[#8e9299] hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Transport Controls Bar */}
        <div className="p-3 bg-[#0f0f12]/80 border-b border-[#2d2e35] flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Play/Stop Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-4 py-2 font-bold rounded-xl flex items-center gap-2 shadow-lg transition active:scale-95 ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950'
                  : 'bg-[#e63946] hover:bg-[#d62839] text-white shadow-[#e63946]/30'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'หยุดเล่น (Pause)' : 'เล่นจังหวะ (Play)'}</span>
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep(0);
              }}
              className="p-2 bg-[#2a2c33] hover:bg-[#33353e] text-slate-300 rounded-xl border border-[#2d2e35] transition"
              title="Reset Step"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>

          {/* BPM Tempo Control */}
          <div className="flex items-center gap-2 bg-[#1a1b1f] p-1.5 px-3 rounded-xl border border-[#2d2e35]">
            <span className="text-[#8e9299] font-medium">ความเร็ว (BPM):</span>
            <span className="font-bold font-mono text-[#e63946] text-sm">{project.bpm}</span>
            <input
              type="range"
              min="50"
              max="200"
              step="1"
              value={project.bpm}
              onChange={e => onChangeProject({ ...project, bpm: parseInt(e.target.value) })}
              className="w-24 accent-[#e63946] h-1.5 bg-[#2d2e35] rounded-lg cursor-pointer"
            />
          </div>

          {/* Velocity Selection Preset */}
          <div className="flex items-center gap-1 bg-[#1a1b1f] p-1 rounded-xl border border-[#2d2e35]">
            <span className="text-[10px] text-[#8e9299] px-1">น้ำหนัก:</span>
            <button
              onClick={() => setSelectedVelocity(0.3)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                selectedVelocity === 0.3 ? 'bg-[#e63946]/30 text-[#e63946] border border-[#e63946]/50' : 'text-[#8e9299]'
              }`}
            >
              เบา (Soft)
            </button>
            <button
              onClick={() => setSelectedVelocity(0.7)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                selectedVelocity === 0.7 ? 'bg-[#e63946]/30 text-[#e63946] border border-[#e63946]/50' : 'text-[#8e9299]'
              }`}
            >
              ปานกลาง
            </button>
            <button
              onClick={() => setSelectedVelocity(1.0)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                selectedVelocity === 1.0 ? 'bg-[#e63946]/30 text-[#e63946] border border-[#e63946]/50' : 'text-[#8e9299]'
              }`}
            >
              กระแทก (Accent)
            </button>
          </div>
        </div>

        {/* Step Grid Container */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-4 flex-1">
          {/* Quick Preset Pattern Loader */}
          <div className="flex items-center justify-between text-xs bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
            <span className="text-slate-300 font-medium">จังหวะสำเร็จรูป:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLoadSampleCadence}
                className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-bold rounded-lg border border-indigo-500/40 flex items-center gap-1 transition"
              >
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>จังหวะเดินแถว (Marching Cadence)</span>
              </button>
              <button
                onClick={handleClearAll}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>ล้างโน้ต</span>
              </button>
            </div>
          </div>

          {/* Grid Tracks */}
          <div className="space-y-3">
            {project.tracks.map((track, trackIdx) => (
              <div key={`${track.id}-${trackIdx}`} className="p-2.5 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: track.color }} />
                    {track.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">16 STEPS</span>
                </div>

                {/* 16 Step Buttons */}
                <div className="grid grid-cols-16 gap-1">
                  {track.steps.map((step, stepIdx) => {
                    const isCurrent = isPlaying && currentStep === stepIdx;
                    const isBeatQuarter = stepIdx % 4 === 0;

                    let opacity = 'opacity-30';
                    if (step.velocity > 0.8) opacity = 'opacity-100 scale-105';
                    else if (step.velocity > 0.5) opacity = 'opacity-80';
                    else opacity = 'opacity-50';

                    return (
                      <button
                        key={stepIdx}
                        onClick={() => handleStepClick(trackIdx, stepIdx)}
                        className={`aspect-square rounded-lg border flex flex-col items-center justify-center transition-all duration-100 ${
                          isCurrent
                            ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-950 z-10'
                            : ''
                        } ${
                          step.active
                            ? 'shadow-md border-transparent text-white font-bold'
                            : isBeatQuarter
                            ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700'
                            : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800'
                        }`}
                        style={{
                          backgroundColor: step.active ? track.color : undefined,
                        }}
                      >
                        {step.active && (
                          <div className={`w-1.5 h-1.5 rounded-full bg-white ${opacity}`} />
                        )}
                        {!step.active && isBeatQuarter && (
                          <div className="w-1 h-1 rounded-full bg-slate-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#0f0f12] border-t border-[#2d2e35] flex items-center justify-between text-xs">
          <p className="text-[#8e9299]">💡 คลิกปุ่มสี่เหลี่ยมเพื่อใส่/ลบโน้ต (คลิกซ้ำเพื่อเปลี่ยนน้ำหนักเสียง)</p>

          <button
            onClick={() => {
              setIsPlaying(false);
              onClose();
            }}
            className="px-5 py-2 bg-[#e63946] hover:bg-[#d62839] text-white font-bold rounded-xl shadow-md shadow-[#e63946]/30 transition"
          >
            ใช้จังหวะนี้
          </button>
        </div>
      </div>
    </div>
  );
};
