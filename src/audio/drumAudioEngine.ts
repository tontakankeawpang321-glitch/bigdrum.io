import { DrumSoundParams, HitType, SongProject } from '../types';

class DrumAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbGainNode: GainNode | null = null;
  private isMuted: boolean = false;

  public initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.9;

      // Create synthetic Reverb impulse
      this.reverbNode = this.ctx.createConvolver();
      this.reverbNode.buffer = this.createImpulseResponse(this.ctx, 1.8, 2.5);
      
      this.reverbGainNode = this.ctx.createGain();
      this.reverbGainNode.gain.value = 0.25;

      this.reverbNode.connect(this.reverbGainNode);
      this.reverbGainNode.connect(this.masterGain);

      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    return this.ctx;
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }

  public setMasterVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime, 0.02);
    }
  }

  private createImpulseResponse(ctx: BaseAudioContext, duration: number, decay: number): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const factor = Math.pow(1 - n, decay);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }

    return impulse;
  }

  /**
   * Play a drum hit using current sound settings
   */
  public triggerHit(
    type: HitType,
    params: DrumSoundParams,
    velocity: number = 1.0,
    timeOffset: number = 0,
    customCtx?: BaseAudioContext,
    customDestination?: AudioNode
  ) {
    const ctx = customCtx || this.initContext();
    const startTime = (customCtx ? 0 : ctx.currentTime) + timeOffset;
    const vel = Math.max(0.1, Math.min(1.0, velocity));

    if (type === 'rim') {
      this.synthesizeRimHit(ctx, startTime, params, vel, customDestination);
    } else {
      this.synthesizeHeadHit(ctx, startTime, type, params, vel, customDestination);
    }
  }

  /**
   * Synthesize main drumhead strike (Center, Edge, Mute)
   */
  private synthesizeHeadHit(
    ctx: BaseAudioContext,
    startTime: number,
    type: HitType,
    params: DrumSoundParams,
    velocity: number,
    customDestination?: AudioNode
  ) {
    // Determine base parameters according to hit zone
    let basePitch = params.pitch;
    let decayTime = params.decay;
    let pitchSweep = params.pitchSweep;
    let muffle = params.muffleAmount;
    let malletHardness = params.malletHardness;

    if (type === 'edge') {
      basePitch *= 1.25; // Higher fundamental ring
      decayTime *= 1.1;
      pitchSweep *= 0.6;
      malletHardness *= 0.7;
    } else if (type === 'mute') {
      decayTime *= 0.25; // Quick choked sound
      muffle = Math.max(0.7, muffle);
      basePitch *= 0.95;
    }

    // Velocity scaling
    const vol = velocity * (params.masterVolume || 0.9);
    const effectiveDecay = decayTime * (1 - muffle * 0.7);

    // 1. Fundamental Sub-Bass Oscillator
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();

    osc.type = 'sine';
    const startFreq = basePitch + pitchSweep * velocity;
    const endFreq = basePitch;

    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(10, endFreq), startTime + Math.min(0.12, effectiveDecay));

    oscGain.gain.setValueAtTime(vol * 1.2, startTime);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, startTime + effectiveDecay);

    // 2. Harmonic Body Overtone
    const bodyOsc = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(startFreq * (params.bodyTone || 1.0), startTime);
    bodyOsc.frequency.exponentialRampToValueAtTime(endFreq * 0.9, startTime + 0.08);

    bodyGain.gain.setValueAtTime(vol * 0.4 * (1 - muffle), startTime);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, startTime + effectiveDecay * 0.6);

    // 3. Mallet Transient Attack (Felt punch click)
    const noiseBuffer = this.createNoiseBuffer(ctx, 0.05);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1200 + malletHardness * 2500, startTime);
    noiseFilter.Q.setValueAtTime(2.0, startTime);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(vol * malletHardness * 0.8, startTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.03);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);

    // 4. Low-pass Muffle filter
    const muffleFilter = ctx.createBiquadFilter();
    muffleFilter.type = 'lowpass';
    const cutoffFreq = Math.max(120, 2500 * (1 - muffle));
    muffleFilter.frequency.setValueAtTime(cutoffFreq, startTime);

    // 5. Bass EQ Boost
    const bassEQ = ctx.createBiquadFilter();
    bassEQ.type = 'lowshelf';
    bassEQ.frequency.setValueAtTime(80, startTime);
    bassEQ.gain.setValueAtTime(params.bassBoost || 0, startTime);

    // Connect nodes
    osc.connect(oscGain);
    bodyOsc.connect(bodyGain);

    oscGain.connect(muffleFilter);
    bodyGain.connect(muffleFilter);
    noiseGain.connect(muffleFilter);

    muffleFilter.connect(bassEQ);

    // Route to destination or engine master gain
    const destinationNode = customDestination || this.masterGain;
    if (destinationNode) {
      bassEQ.connect(destinationNode);

      // Route dry to reverb if enabled
      if (!customDestination && this.reverbNode && params.reverbSize > 0) {
        if (this.reverbGainNode) {
          this.reverbGainNode.gain.setValueAtTime(params.reverbSize * 0.5, startTime);
        }
        bassEQ.connect(this.reverbNode);
      }
    }

    // Play oscillators
    osc.start(startTime);
    osc.stop(startTime + effectiveDecay + 0.05);

    bodyOsc.start(startTime);
    bodyOsc.stop(startTime + effectiveDecay + 0.05);

    noiseSource.start(startTime);
    noiseSource.stop(startTime + 0.05);
  }

  /**
   * Synthesize wooden rim click (Rimshot)
   */
  private synthesizeRimHit(
    ctx: BaseAudioContext,
    startTime: number,
    params: DrumSoundParams,
    velocity: number,
    customDestination?: AudioNode
  ) {
    const vol = velocity * (params.rimVolume || 0.85) * (params.masterVolume || 0.9);
    const rimFreq = params.rimPitch || 750;
    const rimDecay = params.rimDecay || 0.12;

    // Wood tone oscillator
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(rimFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(rimFreq * 0.6, startTime + rimDecay);

    const oscFilter = ctx.createBiquadFilter();
    oscFilter.type = 'bandpass';
    oscFilter.frequency.setValueAtTime(rimFreq, startTime);
    oscFilter.Q.setValueAtTime(4.0, startTime);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(vol * 0.9, startTime);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, startTime + rimDecay);

    // Wooden strike transient noise
    const noiseBuf = this.createNoiseBuffer(ctx, 0.04);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuf;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(1500, startTime);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(vol * 0.7, startTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.03);

    osc.connect(oscFilter);
    oscFilter.connect(oscGain);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);

    const destinationNode = customDestination || this.masterGain;
    if (destinationNode) {
      oscGain.connect(destinationNode);
      noiseGain.connect(destinationNode);
    }

    osc.start(startTime);
    osc.stop(startTime + rimDecay + 0.02);

    noiseSource.start(startTime);
    noiseSource.stop(startTime + 0.04);
  }

  private createNoiseBuffer(ctx: BaseAudioContext, duration: number): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * Render a single hit sound to an AudioBuffer for WAV export
   */
  public async renderHitToBuffer(type: HitType, params: DrumSoundParams): Promise<AudioBuffer> {
    const sampleRate = 44100;
    const duration = type === 'rim' ? 0.5 : Math.max(1.0, params.decay + 0.5);
    const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

    const masterGain = offlineCtx.createGain();
    masterGain.gain.value = 1.0;
    masterGain.connect(offlineCtx.destination);

    this.triggerHit(type, params, 1.0, 0, offlineCtx, masterGain);

    return await offlineCtx.startRendering();
  }

  /**
   * Render full song project sequence to AudioBuffer for WAV export
   */
  public async renderProjectToBuffer(project: SongProject): Promise<AudioBuffer> {
    const sampleRate = 44100;
    const bpm = project.bpm || 120;
    const stepDuration = 60 / bpm / 4; // 16th notes
    const totalSteps = project.stepsCount || 16;
    const loopDuration = totalSteps * stepDuration;
    const tailTime = 2.0; // reverb/decay tail
    const totalDuration = loopDuration + tailTime;

    const offlineCtx = new OfflineAudioContext(2, sampleRate * totalDuration, sampleRate);

    const masterGain = offlineCtx.createGain();
    masterGain.gain.value = 0.95;
    masterGain.connect(offlineCtx.destination);

    // Optional reverb node in offline context
    const reverbNode = offlineCtx.createConvolver();
    reverbNode.buffer = this.createImpulseResponse(offlineCtx, 1.5, 2.0);
    const reverbGain = offlineCtx.createGain();
    reverbGain.gain.value = project.soundParams.reverbSize * 0.4;
    reverbNode.connect(reverbGain);
    reverbGain.connect(masterGain);

    // Iterate through tracks and trigger active steps
    project.tracks.forEach(track => {
      const type = track.id as HitType;
      track.steps.forEach((step, stepIndex) => {
        if (step.active) {
          const timeOffset = stepIndex * stepDuration;
          this.triggerHit(type, project.soundParams, step.velocity || 0.7, timeOffset, offlineCtx, masterGain);
        }
      });
    });

    return await offlineCtx.startRendering();
  }
}

export const drumAudio = new DrumAudioEngine();
