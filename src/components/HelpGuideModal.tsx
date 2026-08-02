import React from 'react';
import { HelpCircle, Sparkles, Volume2, Music, Download, Upload, X } from 'lucide-react';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#1a1b1f] border border-[#2d2e35] rounded-3xl w-full max-w-md max-h-[88vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#0f0f12] border-b border-[#2d2e35] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#e63946]/20 text-[#e63946] border border-[#e63946]/30 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">คู่มือการใช้งานแอพกลองใหญ่สากล</h3>
              <p className="text-xs text-[#8e9299]">คำแนะนำการตี ปรับแต่งเสียง และการเซฟส่งออกโปรเจค</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#2a2c33] hover:bg-[#33353e] flex items-center justify-center text-[#8e9299] hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="space-y-2 bg-[#0f0f12] p-3 rounded-2xl border border-[#2d2e35]">
            <h4 className="font-bold text-[#e63946] flex items-center gap-1.5">
              <Volume2 className="w-4 h-4" />
              <span>1. ตำแหน่งการตีหน้ากลอง (Hit Zones)</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-[#8e9299]">
              <li><strong className="text-white">ตรงกลางหน้ากลอง (Center Boom):</strong> เสียงทุ้มลึก กังวาน เบสตึ้บ</li>
              <li><strong className="text-white">ริมหน้ากลอง (Edge Ring):</strong> เสียงสูงขึ้น มีเสียงสะท้อนวงหนัง</li>
              <li><strong className="text-white">ขอบไม้กลอง (Wooden Rimshot):</strong> เสียงตีขอบไม้ดังก๊อก คมชัด</li>
              <li><strong className="text-white">ปุ่มซับเสียง (Hand Mute):</strong> กดเพื่อเอามือซับหนังกลอง เสียงจะกระชับสั้น</li>
            </ul>
          </div>

          <div className="space-y-2 bg-[#0f0f12] p-3 rounded-2xl border border-[#2d2e35]">
            <h4 className="font-bold text-[#e63946] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>2. การปรับแต่งเสียง & ดาวน์โหลด .WAV</span>
            </h4>
            <p className="text-[#8e9299]">
              กดปุ่ม <strong className="text-white">"ปรับเสียง"</strong> เพื่อเลือกพรีเซ็ตวงโยธวาทิต หรือปรับตั้งความตึง (Pitch) ความก้อง (Decay) และดาวน์โหลดไฟล์เสียง .WAV ไปใช้งานต่อได้ทันที
            </p>
          </div>

          <div className="space-y-2 bg-[#0f0f12] p-3 rounded-2xl border border-[#2d2e35]">
            <h4 className="font-bold text-[#e63946] flex items-center gap-1.5">
              <Music className="w-4 h-4" />
              <span>3. การแต่งเพลง & นำเข้า/ส่งออกโปรเจค</span>
            </h4>
            <p className="text-[#8e9299]">
              ใช้เครื่องมือ <strong className="text-white">Sequencer</strong> แต่งจังหวะกลอง หรือใช้ระบบ <strong className="text-white">อัดสด</strong> แล้วกดดาวน์โหลดเพลง .WAV หรือบันทึกโปรเจคเป็นไฟล์ <strong className="text-white">.JSON</strong> เพื่อนำกลับมาโหลดภายหลัง
            </p>
          </div>

          <div className="space-y-2 bg-[#0f0f12] p-3 rounded-2xl border border-[#2d2e35]">
            <h4 className="font-bold text-[#e63946] flex items-center gap-1.5">
              <span>⌨️ คีย์บอร์ดลัด (Desktop Keyboard Shortcuts)</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <span className="bg-[#2a2c33] px-2 py-1 rounded-lg"><strong>Spacebar</strong> = ตีตรงกลาง</span>
              <span className="bg-[#2a2c33] px-2 py-1 rounded-lg"><strong>R Key</strong> = ตีขอบไม้ (Rim)</span>
              <span className="bg-[#2a2c33] px-2 py-1 rounded-lg"><strong>E Key</strong> = ตีริมหน้ากลอง</span>
              <span className="bg-[#2a2c33] px-2 py-1 rounded-lg"><strong>M Key</strong> = ตีแบบซับเสียง</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0f0f12] border-t border-[#2d2e35] text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#e63946] hover:bg-[#d62839] text-white font-bold rounded-xl text-xs transition shadow-md shadow-[#e63946]/30"
          >
            เข้าใจแล้ว
          </button>
        </div>
      </div>
    </div>
  );
};
