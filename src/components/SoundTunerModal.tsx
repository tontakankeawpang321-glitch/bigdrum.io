import React, { useState } from 'react';
import { Sliders, Download, Volume2, RotateCcw, Play, Check, Sparkles, X, Layers } from 'lucide-react';
import { DrumSoundParams, HitType } from '../types';
import { SOUND_PRESETS, DEFAULT_SOUND_PARAMS } from '../data/presetRhythms';
import { drumAudio } from '../audio/drumAudioEngine';
import { audioBufferToWav, downloadBlob } from '../audio/wavEncoder';

interface SoundTunerModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: DrumSoundParams;
  onChangeParams: (newParams: DrumSoundParams) => void;
}

export const SoundTunerModal: React.FC<SoundTunerModalProps> = ({
  isOpen,
  onClose,
  params,
  onChangeParams,
}) => {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSliderChange = (field: keyof DrumSoundParams, val: number) => {
    onChangeParams({
      ...params,
      [field]: val,
    });
  };

  const handleTestHit = (type: HitType) => {
    drumAudio.triggerHit(type, params, 1.0);
  };

  const handleDownloadWav = async (type: HitType) => {
    setIsExporting(type);
    try {
      const buffer = await drumAudio.renderHitToBuffer(type, params);
      const blob = audioBufferToWav(buffer);
      const safeName = params.name.replace(/[^a-zA-Z0-9ก-๙]/g, '_');
      downloadBlob(blob, `bass_drum_${type}_${safeName}.wav`);
    } catch (err) {
      console.error('Failed to export WAV audio:', err);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#1a1b1f] border border-[#2d2e35] rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-[#0f0f12] border-b border-[#2d2e35] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#e63946]/20 text-[#e63946] border border-[#e63946]/30 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">ปรับแต่งเสียงกลองใหญ่ (Sound Synthesizer)</h3>
              <p className="text-xs text-[#8e9299]">ตั้งค่าโทนเสียง ความตึง ความก้อง และดาวน์โหลดไฟล์เสียง .WAV</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#2a2c33] hover:bg-[#33353e] flex items-center justify-center text-[#8e9299] hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-5 text-xs">
          {/* Presets Selection */}
          <div className="space-y-2">
            <label className="font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#e63946]" />
              <span>เลือกพรีเซ็ตเสียงสำเร็จรูป (Presets)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(SOUND_PRESETS).map(([key, preset]) => {
                const isSelected = params.name === preset.name;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      onChangeParams({ ...preset });
                      drumAudio.triggerHit('center', preset, 1.0);
                    }}
                    className={`p-2.5 rounded-xl text-left border transition flex flex-col justify-between h-16 ${
                      isSelected
                        ? 'bg-[#e63946]/20 border-[#e63946] text-white shadow-md'
                        : 'bg-[#2a2c33]/60 border-[#2d2e35] text-slate-300 hover:bg-[#2a2c33]'
                    }`}
                  >
                    <span className="font-bold leading-tight line-clamp-2">{preset.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#e63946] self-end" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Test Play Controls */}
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between gap-2">
            <span className="font-bold text-slate-300">ทดลองฟังเสียงที่ปรับ:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTestHit('center')}
                className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg flex items-center gap-1 transition"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>หน้ากลอง</span>
              </button>
              <button
                onClick={() => handleTestHit('rim')}
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-1 transition"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>ขอบไม้</span>
              </button>
              <button
                onClick={() => handleTestHit('mute')}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-1 transition"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>ซับเสียง</span>
              </button>
            </div>
          </div>

          {/* Detailed Tuning Sliders */}
          <div className="space-y-4 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
            <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider">1. ความถี่และความตึงหนังกลอง (Head Pitch & Decay)</h4>

            {/* Base Pitch */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300 font-medium">
                <span>ความตึง / คีย์เสียง (Base Pitch)</span>
                <span className="text-amber-400 font-mono">{params.pitch} Hz</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                step="1"
                value={params.pitch}
                onChange={e => handleSliderChange('pitch', parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Decay Time */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300 font-medium">
                <span>ความก้องหางเสียง (Decay Time)</span>
                <span className="text-amber-400 font-mono">{params.decay.toFixed(2)} วินาที</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.05"
                value={params.decay}
                onChange={e => handleSliderChange('decay', parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Pitch Sweep Punch */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300 font-medium">
                <span>น้ำหนักพุ่งเมื่อกระทบ (Pitch Bend Punch)</span>
                <span className="text-amber-400 font-mono">+{params.pitchSweep} Hz</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="2"
                value={params.pitchSweep}
                onChange={e => handleSliderChange('pitchSweep', parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Muffle / Damping */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300 font-medium">
                <span>การซับเสียง / ผ้ารอบขอบ (Muffle Level)</span>
                <span className="text-amber-400 font-mono">{Math.round(params.muffleAmount * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.9"
                step="0.05"
                value={params.muffleAmount}
                onChange={e => handleSliderChange('muffleAmount', parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-4 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
            <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider">2. เสียงการตีขอบไม้และมิติห้อง (Rim & Spatial)</h4>

            {/* Rim Pitch */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300 font-medium">
                <span>ความถี่เสียงขอบไม้ (Rim Pitch)</span>
                <span className="text-amber-400 font-mono">{params.rimPitch} Hz</span>
              </div>
              <input
                type="range"
                min="400"
                max="1200"
                step="25"
                value={params.rimPitch}
                onChange={e => handleSliderChange('rimPitch', parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Bass Boost */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300 font-medium">
                <span>การเพิ่มย่านเสียงเบสลึก (Sub-Bass Boost)</span>
                <span className="text-amber-400 font-mono">+{params.bassBoost} dB</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={params.bassBoost}
                onChange={e => handleSliderChange('bassBoost', parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Reverb Size */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300 font-medium">
                <span>เสียงสะท้อนห้อง/สนาม (Reverb Room)</span>
                <span className="text-amber-400 font-mono">{Math.round(params.reverbSize * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.05"
                value={params.reverbSize}
                onChange={e => handleSliderChange('reverbSize', parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* WAV Export Section (ดาวน์โหลดเสียงที่แต่งได้) */}
          <div className="p-3.5 bg-gradient-to-r from-amber-950/40 via-slate-950 to-slate-950 rounded-2xl border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลดไฟล์เสียง (.WAV)</span>
              </div>
              <span className="text-[10px] text-slate-400">44.1kHz / 16-bit PCM</span>
            </div>
            <p className="text-[11px] text-slate-400">
              ส่งออกเสียงกลองใหญ่ที่คุณปรับแต่งเป็นไฟล์เสียงความละเอียดสูง เพื่อนำไปใช้ต่อในโปรแกรมแต่งเพลงอื่นๆ
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                onClick={() => handleDownloadWav('center')}
                disabled={isExporting !== null}
                className="py-2 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl border border-slate-700 flex items-center justify-center gap-1 transition active:scale-95 disabled:opacity-50"
              >
                <Download className="w-3 h-3 text-red-400" />
                <span>เสียงหน้ากลอง</span>
              </button>

              <button
                onClick={() => handleDownloadWav('rim')}
                disabled={isExporting !== null}
                className="py-2 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl border border-slate-700 flex items-center justify-center gap-1 transition active:scale-95 disabled:opacity-50"
              >
                <Download className="w-3 h-3 text-blue-400" />
                <span>เสียงขอบไม้</span>
              </button>

              <button
                onClick={() => handleDownloadWav('mute')}
                disabled={isExporting !== null}
                className="py-2 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl border border-slate-700 flex items-center justify-center gap-1 transition active:scale-95 disabled:opacity-50"
              >
                <Download className="w-3 h-3 text-emerald-400" />
                <span>เสียงซับมิวท์</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#0f0f12] border-t border-[#2d2e35] flex items-center justify-between">
          <button
            onClick={() => {
              onChangeParams({ ...DEFAULT_SOUND_PARAMS });
              drumAudio.triggerHit('center', DEFAULT_SOUND_PARAMS, 1.0);
            }}
            className="px-3 py-1.5 bg-[#2a2c33] hover:bg-[#33353e] text-slate-300 rounded-xl text-xs flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>คืนค่าเริ่มต้น</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#e63946] hover:bg-[#d62839] text-white font-bold rounded-xl text-xs transition shadow-lg shadow-[#e63946]/30"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
};
