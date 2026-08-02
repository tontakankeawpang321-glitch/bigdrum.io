import React, { useState, useEffect, useRef } from 'react';
import { FolderKanban, Download, Upload, Plus, Trash2, Edit2, Play, Check, X, FileJson, Sparkles } from 'lucide-react';
import { SongProject } from '../types';
import { createEmptyProject, createSampleCadenceProject } from '../data/presetRhythms';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: SongProject;
  onSelectProject: (project: SongProject) => void;
}

const LOCAL_STORAGE_KEY = 'marching_bass_drum_projects_v1';

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  onSelectProject,
}) => {
  const [projects, setProjects] = useState<SongProject[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load local saved projects
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setProjects(JSON.parse(saved));
      } else {
        // Initialize with default sample
        const sample = createSampleCadenceProject();
        setProjects([sample]);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([sample]));
      }
    } catch {
      // Fallback
    }
  }, []);

  const saveProjectsToStorage = (updatedList: SongProject[]) => {
    setProjects(updatedList);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
    } catch {
      // Ignore
    }
  };

  if (!isOpen) return null;

  // Save current active project
  const handleSaveCurrentProject = () => {
    const existingIndex = projects.findIndex(p => p.id === currentProject.id);
    const updatedProject = {
      ...currentProject,
      updatedAt: new Date().toISOString(),
    };

    let newProjects: SongProject[] = [];
    if (existingIndex >= 0) {
      newProjects = [...projects];
      newProjects[existingIndex] = updatedProject;
    } else {
      newProjects = [updatedProject, ...projects];
    }

    saveProjectsToStorage(newProjects);
  };

  const handleCreateNewProject = () => {
    const newProj = createEmptyProject(`เพลงกลองใหม่ #${projects.length + 1}`);
    const updated = [newProj, ...projects];
    saveProjectsToStorage(updated);
    onSelectProject(newProj);
  };

  const handleDeleteProject = (id: string) => {
    const filtered = projects.filter(p => p.id !== id);
    saveProjectsToStorage(filtered);
  };

  // JSON Export (บันทึกโปรเจคเพลง)
  const handleExportProjectJson = (proj: SongProject) => {
    const jsonString = JSON.stringify(proj, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = proj.name.replace(/[^a-zA-Z0-9ก-๙]/g, '_');
    a.download = `marching_drum_project_${safeName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // JSON Import (นำโปรเจคเข้าได้)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const content = event.target?.result as string;
        const imported = JSON.parse(content) as SongProject;

        if (!imported.tracks || !imported.soundParams) {
          throw new Error('รูปแบบไฟล์โปรเจคไม่ถูกต้อง');
        }

        // Assign fresh ID if duplicate
        imported.id = `project-${Date.now()}`;
        imported.updatedAt = new Date().toISOString();

        const updatedList = [imported, ...projects];
        saveProjectsToStorage(updatedList);
        onSelectProject(imported);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        setImportError('ไม่สามารถอ่านไฟล์โปรเจคได้ กรุณาใช้ไฟล์ .json ของแอพกลองใหญ่');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#1a1b1f] border border-[#2d2e35] rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#0f0f12] border-b border-[#2d2e35] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#e63946]/20 text-[#e63946] border border-[#e63946]/30 flex items-center justify-center">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">จัดการโปรเจคเพลง (Project Manager)</h3>
              <p className="text-xs text-[#8e9299]">บันทึก นำเข้า และส่งออกไฟล์โปรเจค .JSON</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#2a2c33] hover:bg-[#33353e] flex items-center justify-center text-[#8e9299] hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Quick Actions (Save & Import & Create) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSaveCurrentProject}
              className="p-3 bg-[#e63946] hover:bg-[#d62839] text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#e63946]/30 transition active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>บันทึกเพลงปัจจุบัน</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-[#2a2c33] hover:bg-[#33353e] text-slate-200 border border-[#2d2e35] font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
            >
              <Upload className="w-4 h-4 text-[#e63946]" />
              <span>นำเข้าโปรเจค (.JSON)</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {importError && (
            <div className="p-3 bg-red-950/80 border border-red-500/50 text-red-300 rounded-xl">
              {importError}
            </div>
          )}

          {/* Project List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300">รายการโปรเจคทั้งหมด ({projects.length})</span>
              <button
                onClick={handleCreateNewProject}
                className="text-amber-400 hover:underline flex items-center gap-1 font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>สร้างโปรเจคใหม่</span>
              </button>
            </div>

            <div className="space-y-2">
              {projects.map((proj, projIdx) => {
                const isActive = proj.id === currentProject.id;
                const isEditing = editingId === proj.id;

                return (
                  <div
                    key={`${proj.id}-${projIdx}`}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between gap-2 ${
                      isActive
                        ? 'bg-amber-500/10 border-amber-500/60 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2 py-1 text-xs w-full"
                          />
                          <button
                            onClick={() => {
                              const updated = projects.map(p => (p.id === proj.id ? { ...p, name: editName } : p));
                              saveProjectsToStorage(updated);
                              setEditingId(null);
                            }}
                            className="p-1 text-emerald-400"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white truncate text-xs">{proj.name}</h4>
                          {isActive && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded-md font-bold">
                              ใช้งานอยู่
                            </span>
                          )}
                        </div>
                      )}
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {proj.bpm} BPM • {new Date(proj.updatedAt).toLocaleDateString('th-TH')}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {!isActive && (
                        <button
                          onClick={() => {
                            onSelectProject(proj);
                            onClose();
                          }}
                          className="px-2.5 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-[11px] flex items-center gap-1 transition"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>โหลด</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleExportProjectJson(proj)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                        title="ดาวน์โหลดไฟล์โปรเจค .JSON"
                      >
                        <FileJson className="w-4 h-4 text-blue-400" />
                      </button>

                      <button
                        onClick={() => {
                          setEditingId(proj.id);
                          setEditName(proj.name);
                        }}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                        title="เปลี่ยนชื่อ"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {projects.length > 1 && (
                        <button
                          onClick={() => handleDeleteProject(proj.id)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 rounded-xl transition"
                          title="ลบโปรเจค"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
