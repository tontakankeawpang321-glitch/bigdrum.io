export type HitType = 'center' | 'edge' | 'rim' | 'mute';

export interface DrumSoundParams {
  name: string;
  // Head Pitch & Tone
  pitch: number;          // Fundamental frequency in Hz (e.g. 45 - 90 Hz)
  decay: number;          // Decay time in seconds (0.1 - 3.5)
  pitchSweep: number;     // Pitch drop amount in Hz (10 - 80)
  malletHardness: number; // Click transient level (0 - 1)
  muffleAmount: number;   // Damping percentage (0 - 1)
  drive: number;          // Tube warmth / distortion (0 - 1)
  
  // Body & Tone EQ
  bassBoost: number;      // Low end gain in dB (-6 to +12)
  bodyTone: number;       // Mid resonance (0.2 - 2.0)
  
  // Rim Parameters
  rimPitch: number;       // Pitch of wooden rim hit in Hz (400 - 1200)
  rimDecay: number;       // Decay of rim click (0.05 - 0.4)
  rimVolume: number;      // Volume of rim hit (0 - 1)
  
  // Spatial / Room
  reverbSize: number;     // Reverb room mix (0 - 1)
  masterVolume: number;   // 0 - 1
}

export interface StepNote {
  active: boolean;
  type: HitType;
  velocity: number; // 0.2 (soft), 0.6 (normal), 1.0 (accent)
}

export type SequencerTrackType = 'center' | 'edge' | 'rim' | 'mute';

export interface SequencerTrack {
  id: SequencerTrackType;
  name: string;
  color: string;
  steps: StepNote[];
}

export interface RecordedEvent {
  timestampMs: number;
  type: HitType;
  velocity: number;
}

export interface SongProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  bpm: number;
  stepsCount: number; // 8, 16, 32
  timeSignature: '4/4' | '3/4' | '6/8';
  tracks: SequencerTrack[];
  recordedEvents?: RecordedEvent[];
  soundParams: DrumSoundParams;
}
