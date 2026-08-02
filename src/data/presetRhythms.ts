import { DrumSoundParams, SongProject } from '../types';

export const DEFAULT_SOUND_PARAMS: DrumSoundParams = {
  name: 'วงโยธวาทิต สแตนดาร์ด (Marching Standard)',
  pitch: 56,
  decay: 1.1,
  pitchSweep: 42,
  malletHardness: 0.65,
  muffleAmount: 0.15,
  drive: 0.2,
  bassBoost: 4,
  bodyTone: 1.0,
  rimPitch: 750,
  rimDecay: 0.12,
  rimVolume: 0.85,
  reverbSize: 0.25,
  masterVolume: 0.9,
};

export const SOUND_PRESETS: Record<string, DrumSoundParams> = {
  marching: {
    ...DEFAULT_SOUND_PARAMS,
    name: 'วงโยธวาทิต สแตนดาร์ด (Marching Standard)',
  },
  orchestral: {
    name: 'วงออร์เคสตรา ก้องกังวาน (Concert Hall Boom)',
    pitch: 42,
    decay: 2.2,
    pitchSweep: 30,
    malletHardness: 0.45,
    muffleAmount: 0.05,
    drive: 0.1,
    bassBoost: 6,
    bodyTone: 1.3,
    rimPitch: 680,
    rimDecay: 0.18,
    rimVolume: 0.75,
    reverbSize: 0.55,
    masterVolume: 0.9,
  },
  subbass: {
    name: 'เบสสนาม กระหึ่มทรงพลัง (Sub-Bass Field Punch)',
    pitch: 36,
    decay: 1.4,
    pitchSweep: 55,
    malletHardness: 0.8,
    muffleAmount: 0.0,
    drive: 0.4,
    bassBoost: 8,
    bodyTone: 1.1,
    rimPitch: 850,
    rimDecay: 0.10,
    rimVolume: 0.9,
    reverbSize: 0.3,
    masterVolume: 0.9,
  },
  dampened: {
    name: 'ซับเสียง กระชับหนักแน่น (Dampened Tight)',
    pitch: 52,
    decay: 0.45,
    pitchSweep: 35,
    malletHardness: 0.85,
    muffleAmount: 0.65,
    drive: 0.25,
    bassBoost: 3,
    bodyTone: 0.8,
    rimPitch: 800,
    rimDecay: 0.08,
    rimVolume: 0.8,
    reverbSize: 0.1,
    masterVolume: 0.9,
  },
  vintage: {
    name: 'กลองใหญ่ไม้ คลาสสิก (Vintage Wooden Rim)',
    pitch: 48,
    decay: 1.3,
    pitchSweep: 25,
    malletHardness: 0.5,
    muffleAmount: 0.2,
    drive: 0.15,
    bassBoost: 2,
    bodyTone: 1.5,
    rimPitch: 620,
    rimDecay: 0.15,
    rimVolume: 0.95,
    reverbSize: 0.2,
    masterVolume: 0.9,
  },
};

export function createEmptyProject(name = 'เพลงกลองใหม่'): SongProject {
  const stepsCount = 16;
  const createSteps = () => Array.from({ length: stepsCount }, () => ({ active: false, type: 'center' as const, velocity: 0.6 }));

  return {
    id: `project-${Date.now()}`,
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    bpm: 112,
    stepsCount: 16,
    timeSignature: '4/4',
    soundParams: { ...DEFAULT_SOUND_PARAMS },
    tracks: [
      { id: 'center', name: 'ตีตรงกลาง (Center Boom)', color: '#ef4444', steps: createSteps() },
      { id: 'edge', name: 'ตีริมหน้ากลอง (Edge Ring)', color: '#f59e0b', steps: createSteps() },
      { id: 'rim', name: 'ตีขอบไม้ (Wooden Rimshot)', color: '#3b82f6', steps: createSteps() },
      { id: 'mute', name: 'ตีแบบซับเสียง (Muted Tap)', color: '#10b981', steps: createSteps() },
    ],
  };
}

export function createSampleCadenceProject(): SongProject {
  const project = createEmptyProject('จังหวะเดินแถว วงโยธวาทิต (Marching Cadence)');
  project.bpm = 120;
  
  // Center beats on 1, 5, 9, 13 (quarters) and accents
  const centerHits = [0, 4, 8, 12, 14];
  const rimHits = [2, 6, 10, 11, 15];
  const edgeHits = [3, 7];

  centerHits.forEach(stepIdx => {
    project.tracks[0].steps[stepIdx] = {
      active: true,
      type: 'center',
      velocity: stepIdx === 0 || stepIdx === 8 ? 1.0 : 0.7,
    };
  });

  rimHits.forEach(stepIdx => {
    project.tracks[2].steps[stepIdx] = {
      active: true,
      type: 'rim',
      velocity: 0.8,
    };
  });

  edgeHits.forEach(stepIdx => {
    project.tracks[1].steps[stepIdx] = {
      active: true,
      type: 'edge',
      velocity: 0.5,
    };
  });

  return project;
}
