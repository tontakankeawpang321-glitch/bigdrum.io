import React, { useState, useEffect, useRef } from 'react';
import { Disc, Play, Square, Download, Trash2, Clock, Volume2, Music, Check, Sparkles } from 'lucide-react';
import { RecordedEvent, SongProject } from '../types';
import { drumAudio } from '../audio/drumAudioEngine';
import { audioBufferToWav, downloadBlob } from '../audio/wavEncoder';

interface LiveRecorderProps {
  isRecording: boolean;
  onToggleRecording: () => void;
  events: RecordedEvent[];
  onClearEvents: () => void;
  project: SongProject;
}

export const LiveRecorder: React.FC<LiveRecorderProps> = ({
  isRecording,
  onToggleRecording,
  events,
  onClearEvents,
  project,
}) => {
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const [isExportingWav, setIsExportingWav] = useState(false);
  const playbackTimersRef = useRef<number[]>([]);

  // Stop playback when unmounting or clear
  useEffect(() => {
    return () => {
      playbackTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  const handleStartPlayback = () => {
    if (events.length === 0) return;
    setIsPlayingBack(true);
    playbackTimersRef.current.forEach(clearTimeout);
    playbackTimersRef.current = [];

    events.forEach(evt => {
      const timer = window.setTimeout(() => {
        drumAudio.triggerHit(evt.type, project.soundParams, evt.velocity);
      }, evt.timestampMs);
      playbackTimersRef.current.push(timer);
    });

    const totalDuration = events[events.length - 1].timestampMs + 1000;
    const endTimer = window.setTimeout(() => {
      setIsPlayingBack(false);
    }, totalDuration);
    playbackTimersRef.current.push(endTimer);
  };

  const handleStopPlayback = () => {
    playbackTimersRef.current.forEach(clearTimeout);
    playbackTimersRef.current = [];
    setIsPlayingBack(false);
  };

  // Render song project OR live events to WAV audio file
  const handleExportSongWav = async () => {
    setIsExportingWav(true);
    try {
      const buffer = await drumAudio.renderProjectToBuffer(project);
      const blob = audioBufferToWav(buffer);
      const safeName = project.name.replace(/[^a-zA-Z0-9ก-๙]/g, '_');
      downloadBlob(blob, `${safeName}_song.wav`);
    } catch (err) {
      console.error('Failed to export song audio:', err);
    } finally {
      setIsExportingWav(false);
    }
  };

  return (
    <div className="w-full bg-[#1a1b1f] border border-[#2d2e35] rounded-2xl p-3 text-slate-100 space-y-3 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#e63946]/20 text-[#e63946] border border-[#e63946]/30 flex items-center justify-center">
            <Disc className={`w-4 h-4 ${isRecording ? 'animate-spin text-[#e63946]' : ''}`} />
          </div>
          <div>
            <h4 className="font-bold text-xs text-white">การบันทึกการตีสด (Live Recorder)</h4>
            <p className="text-[10px] text-[#8e9299]">บันทึกจังหวะขณะตีสด และส่งออกเป็นไฟล์เพลง .WAV</p>
          </div>
        </div>

        {/* Record Toggle Button */}
        <button
          onClick={onToggleRecording}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition active:scale-95 ${
            isRecording
              ? 'bg-[#e63946] text-white animate-pulse shadow-[#e63946]/40'
              : 'bg-[#2a2c33] text-slate-200 hover:bg-[#33353e] border border-[#2d2e35]'
          }`}
        >
          <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-white' : 'bg-[#e63946]'}`} />
          <span>{isRecording ? 'กำลังอัด...' : 'เริ่มอัดสด'}</span>
        </button>
      </div>

      {/* Stats and Playback Controls */}
      <div className="flex items-center justify-between bg-[#0f0f12] p-2 rounded-xl border border-[#2d2e35] text-xs">
        <div className="flex items-center gap-3">
          <span className="text-[#8e9299] font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{events.length} ตัวโน้ตที่บันทึก</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {events.length > 0 && (
            <>
              {isPlayingBack ? (
                <button
                  onClick={handleStopPlayback}
                  className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg flex items-center gap-1 transition"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>หยุด</span>
                </button>
              ) : (
                <button
                  onClick={handleStartPlayback}
                  className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg flex items-center gap-1 transition"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>ฟังการตี</span>
                </button>
              )}

              <button
                onClick={onClearEvents}
                className="p-1 bg-[#2a2c33] hover:bg-[#33353e] text-[#8e9299] hover:text-[#e63946] rounded-lg transition"
                title="ล้างข้อมูลการอัด"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* Export Song Audio WAV */}
          <button
            onClick={handleExportSongWav}
            disabled={isExportingWav}
            className="px-3 py-1.5 bg-[#e63946] hover:bg-[#d62839] text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-[#e63946]/20 transition active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ดาวน์โหลดเพลง (.WAV)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
