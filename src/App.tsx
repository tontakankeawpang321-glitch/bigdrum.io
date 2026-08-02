import React, { useState, useEffect } from 'react';
import { Volume2, Sparkles, Music, FolderKanban, HelpCircle, Disc, Smartphone, RotateCcw } from 'lucide-react';
import { SongProject, DrumSoundParams, HitType, RecordedEvent } from './types';
import { createSampleCadenceProject, DEFAULT_SOUND_PARAMS } from './data/presetRhythms';
import { DrumPadView } from './components/DrumPadView';
import { SoundTunerModal } from './components/SoundTunerModal';
import { SongSequencer } from './components/SongSequencer';
import { LiveRecorder } from './components/LiveRecorder';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { HelpGuideModal } from './components/HelpGuideModal';

export default function App() {
  const [project, setProject] = useState<SongProject>(createSampleCadenceProject());
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedEvents, setRecordedEvents] = useState<RecordedEvent[]>([]);
  const [recordStartTime, setRecordStartTime] = useState<number>(0);

  // Modal States
  const [isSoundTunerOpen, setIsSoundTunerOpen] = useState<boolean>(false);
  const [isSequencerOpen, setIsSequencerOpen] = useState<boolean>(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isMobileFrameView, setIsMobileFrameView] = useState<boolean>(true);

  // Handle live recording event capture
  const handleRecordHit = (type: HitType, velocity: number) => {
    if (!isRecording) return;
    const now = Date.now();
    const timestampMs = now - recordStartTime;

    setRecordedEvents(prev => [
      ...prev,
      {
        timestampMs,
        type,
        velocity,
      },
    ]);
  };

  const handleToggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordedEvents([]);
      setRecordStartTime(Date.now());
    } else {
      setIsRecording(false);
    }
  };

  const handleUpdateSoundParams = (newParams: DrumSoundParams) => {
    setProject(prev => ({
      ...prev,
      soundParams: newParams,
      updatedAt: new Date().toISOString(),
    }));
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-[#0f0f12] text-slate-100 flex flex-col items-center justify-between p-2 font-sans select-none overflow-hidden">
      {/* Global Top App Bar */}
      <header className="w-full max-w-md flex items-center justify-between p-2 bg-[#1a1b1f] backdrop-blur-lg border border-[#2d2e35] rounded-2xl shadow-xl z-20 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#e63946] flex items-center justify-center shadow-md shadow-[#e63946]/30 font-bold text-white shrink-0">
            <Volume2 className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
              <span className="truncate">กลองใหญ่สากล</span>
              <span className="text-[9px] bg-[#e63946]/20 text-[#e63946] border border-[#e63946]/40 px-1 py-0.2 rounded font-mono font-bold shrink-0">
                PRO
              </span>
            </h1>
            <p className="text-[10px] text-[#8e9299] truncate max-w-[130px]">{project.name}</p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsSoundTunerOpen(true)}
            className="px-2.5 py-1.5 bg-[#2a2c33] hover:bg-[#33353e] text-slate-200 text-xs font-medium rounded-xl border border-[#2d2e35] flex items-center gap-1.5 transition active:scale-95 shadow"
            title="ปรับแต่งเสียงกลอง"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>ปรับเสียง</span>
          </button>

          <button
            onClick={() => setIsProjectsOpen(true)}
            className="p-1.5 bg-[#2a2c33] hover:bg-[#33353e] text-slate-300 rounded-xl border border-[#2d2e35] transition active:scale-95"
            title="จัดการโปรเจค"
          >
            <FolderKanban className="w-4 h-4 text-sky-400" />
          </button>

          <button
            onClick={() => setIsMobileFrameView(!isMobileFrameView)}
            className={`p-1.5 rounded-xl border transition active:scale-95 ${
              isMobileFrameView
                ? 'bg-[#e63946]/20 text-[#e63946] border-[#e63946]/50 shadow-sm shadow-[#e63946]/30'
                : 'bg-[#2a2c33] text-slate-400 border-[#2d2e35]'
            }`}
            title="สลับโหมดหน้าจอมือถือ"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Drum View Container */}
      <main className="w-full max-w-md flex-1 flex flex-col items-center justify-between my-1.5 overflow-y-auto space-y-1.5">
        <DrumPadView
          soundParams={project.soundParams}
          onRecordHit={handleRecordHit}
          isRecording={isRecording}
          onOpenSoundTuner={() => setIsSoundTunerOpen(true)}
          onOpenSequencer={() => setIsSequencerOpen(true)}
          onOpenProjects={() => setIsProjectsOpen(true)}
          onUpdateSoundParams={handleUpdateSoundParams}
        />

        {/* Live Recorder Drawer below drum */}
        <div className="w-full shrink-0">
          <LiveRecorder
            isRecording={isRecording}
            onToggleRecording={handleToggleRecording}
            events={recordedEvents}
            onClearEvents={() => setRecordedEvents([])}
            project={project}
          />
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="w-full max-w-md text-center text-[10px] text-slate-500 py-0.5 shrink-0">
        <span>แอพกลองใหญ่สากล • Concert & Marching Bass Studio</span>
      </footer>

      {/* Modals */}
      <SoundTunerModal
        isOpen={isSoundTunerOpen}
        onClose={() => setIsSoundTunerOpen(false)}
        params={project.soundParams}
        onChangeParams={handleUpdateSoundParams}
      />

      <SongSequencer
        isOpen={isSequencerOpen}
        onClose={() => setIsSequencerOpen(false)}
        project={project}
        onChangeProject={setProject}
      />

      <ProjectManagerModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        currentProject={project}
        onSelectProject={setProject}
      />

      <HelpGuideModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
