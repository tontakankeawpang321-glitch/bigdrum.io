import { DrumSoundParams, HitType, SongProject } from '../types';

class DrumAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private limiterNode: DynamicsCompressorNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbGainNode: GainNode | null = null;
  private isUnlocked: boolean = false;

  constructor() {
    // Auto attach global touch/pointer listeners to unlock WebAudio on iOS / Android mobile browsers
    if (typeof window !== 'undefined') {
      const unlockEvents = ['touchstart', 'touchend', 'pointerdown', 'mousedown', 'keydown'];
      const unlockHandler = () => {
        this.unlockMobileAudio();
        if (this.isUnlocked) {
          unlockEvents.forEach(evt => window.removeEventListener(evt, unlockHandler, true));
        }
      };
      unlockEvents.forEach(evt => window.addEventListener(evt, unlockHandler, true));
    }
  }

  public initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      // Configure destination for Mono output to guarantee maximum mobile speaker compatibility
      try {
        this.ctx.destination.channelCount = 1;
        this.ctx.destination.channelCountMode = 'explicit';
        this.ctx.destination.channelInterpretation = 'speakers';
      } catch {
        // Fallback for browsers that restrict channelCount modification
      }

      // 1. Dynamics Compressor / Peak Limiter (Prevents bass clipping & crackling on phone speakers)
      this.limiterNode = this.ctx.createDynamicsCompressor();
      this.limiterNode.threshold.setValueAtTime(-2, this.ctx.currentTime);
      this.limiterNode.knee.setValueAtTime(6, this.ctx.currentTime);
      this.limiterNode.ratio.setValueAtTime(15, this.ctx.currentTime);
      this.limiterNode.attack.setValueAtTime(0.002, this.ctx.currentTime);
      this.limiterNode.release.setValueAtTime(0.08, this.ctx.currentTime);
      this.limiterNode.connect(this.ctx.destination);

      // 2. Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.9;
      this.masterGain.connect(this.limiterNode);

      // 3. Synthetic Mono Reverb Impulse
      this.reverbNode = this.ctx.createConvolver();
      this.reverbNode.buffer = this.createImpulseResponse(this.ctx, 1.6, 2.5);

      this.reverbGainNode = this.ctx.createGain();
      this.reverbGainNode.gain.value = 0.2;

      this.reverbNode.connect(this.reverbGainNode);
      this.reverbGainNode.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    return this.ctx;
  }

  /**
   * Unlock WebAudio for iOS Safari & Android mobile browsers
   */
  public unlockMobileAudio() {
    const ctx = this.initContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }

    // Play a tiny 1-sample silent buffer to prime mobile hardware
    if (ctx && !this.isUnlocked) {
      try {
        const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        this.isUnlocked = true;
      } catch {
        // Ignore
      }
    }
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }

  public setMasterVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(2.0, vol)), this.ctx.currentTime, 0.02);
    }
  }

  /**
   * Create a MONO impulse response buffer for punchy room reverberation without phase cancellation
   */
  private createImpulseResponse(ctx: BaseAudioContext, duration: number, decay: number): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    // 1 Channel = Pure Mono Reverb
    const impulse = ctx.createBuffer(1, length, sampleRate);
    const channel = impulse.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const factor = Math.pow(1 - n, decay);
      channel[i] = (Math.random() * 2 - 1) * factor;
    }

    return impulse;
  }

  /**
   * Soft-clipping saturation curve for Tube Drive warmth
   */
  private makeDistortionCurve(amount: number): Float32Array {
    const k = Math.max(0.1, amount * 25);
    const n = 44100;
    const curve = new Float32Array(n);
    const deg = Math.PI / 180;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
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
    this.unlockMobileAudio();
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
    let basePitch = params.pitch;
    let decayTime = params.decay;
    let pitchSweep = params.pitchSweep;
    let muffle = params.muffleAmount;
    let malletHardness = params.malletHardness;

    if (type === 'edge') {
      basePitch *= 1.22; // Higher fundamental ring
      decayTime *= 1.1;
      pitchSweep *= 0.55;
      malletHardness *= 0.7;
    } else if (type === 'mute') {
      decayTime *= 0.22; // Quick choked sound
      muffle = Math.max(0.75, muffle);
      basePitch *= 0.95;
    }

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

    oscGain.gain.setValueAtTime(vol * 1.15, startTime);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, startTime + effectiveDecay);

    // 2. Harmonic Body Overtone
    const bodyOsc = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(startFreq * (params.bodyTone || 1.0), startTime);
    bodyOsc.frequency.exponentialRampToValueAtTime(endFreq * 0.9, startTime + 0.08);

    bodyGain.gain.setValueAtTime(vol * 0.35 * (1 - muffle), startTime);
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
    noiseGain.gain.setValueAtTime(vol * malletHardness * 0.75, startTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.03);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);

    // 4. Low-pass Muffle filter
    const muffleFilter = ctx.createBiquadFilter();
    muffleFilter.type = 'lowpass';
    const cutoffFreq = Math.max(120, 2600 * (1 - muffle));
    muffleFilter.frequency.setValueAtTime(cutoffFreq, startTime);

    // 5. Bass EQ Boost
    const bassEQ = ctx.createBiquadFilter();
    bassEQ.type = 'lowshelf';
    bassEQ.frequency.setValueAtTime(80, startTime);
    bassEQ.gain.setValueAtTime(params.bassBoost || 0, startTime);

    // Connect sound generators
    osc.connect(oscGain);
    bodyOsc.connect(bodyGain);

    oscGain.connect(muffleFilter);
    bodyGain.connect(muffleFilter);
    noiseGain.connect(muffleFilter);

    muffleFilter.connect(bassEQ);

    // 6. Tube Drive / Warm Saturation (if drive > 0)
    let outputNode: AudioNode = bassEQ;
    if (params.drive && params.drive > 0) {
      const shaper = ctx.createWaveShaper();
      shaper.curve = this.makeDistortionCurve(params.drive);
      shaper.oversample = '2x';
      bassEQ.connect(shaper);
      outputNode = shaper;
    }

    // Route to destination node or engine master gain
    const destinationNode = customDestination || this.masterGain;
    if (destinationNode) {
      outputNode.connect(destinationNode);

      // Route dry signal to mono reverb if enabled
      if (!customDestination && this.reverbNode && params.reverbSize > 0) {
        if (this.reverbGainNode) {
          this.reverbGainNode.gain.setValueAtTime(params.reverbSize * 0.45, startTime);
        }
        outputNode.connect(this.reverbNode);
      }
    }

    // Start oscillators
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

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(rimFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(rimFreq * 0.6, startTime + rimDecay);

    const oscFilter = ctx.createBiquadFilter();
    oscFilter.type = 'bandpass';
    oscFilter.frequency.setValueAtTime(rimFreq, startTime);
    oscFilter.Q.setValueAtTime(4.0, startTime);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(vol * 0.85, startTime);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, startTime + rimDecay);

    const noiseBuf = this.createNoiseBuffer(ctx, 0.04);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuf;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(1500, startTime);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(vol * 0.65, startTime);
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
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * Render a single hit sound to a MONO AudioBuffer for WAV export
   */
  public async renderHitToBuffer(type: HitType, params: DrumSoundParams): Promise<AudioBuffer> {
    const sampleRate = (this.ctx && this.ctx.sampleRate) || 44100;
    const duration = type === 'rim' ? 0.5 : Math.max(1.0, params.decay + 0.5);
    // 1 channel = MONO Audio rendering
    const offlineCtx = new OfflineAudioContext(1, Math.floor(sampleRate * duration), sampleRate);

    const masterGain = offlineCtx.createGain();
    masterGain.gain.value = 1.0;
    masterGain.connect(offlineCtx.destination);

    this.triggerHit(type, params, 1.0, 0, offlineCtx, masterGain);

    return await offlineCtx.startRendering();
  }

  /**
   * Render full song project sequence to a MONO AudioBuffer for WAV export
   */
  public async renderProjectToBuffer(project: SongProject): Promise<AudioBuffer> {
    const sampleRate = (this.ctx && this.ctx.sampleRate) || 44100;
    const bpm = project.bpm || 120;
    const stepDuration = 60 / bpm / 4; // 16th notes
    const totalSteps = project.stepsCount || 16;
    const loopDuration = totalSteps * stepDuration;
    const tailTime = 2.0; // reverb/decay tail
    const totalDuration = loopDuration + tailTime;

    // 1 channel = MONO Audio rendering
    const offlineCtx = new OfflineAudioContext(1, Math.floor(sampleRate * totalDuration), sampleRate);

    const masterGain = offlineCtx.createGain();
    masterGain.gain.value = 0.95;
    masterGain.connect(offlineCtx.destination);

    // Reverb node in offline context (Mono)
    if (project.soundParams.reverbSize > 0) {
      const reverbNode = offlineCtx.createConvolver();
      reverbNode.buffer = this.createImpulseResponse(offlineCtx, 1.5, 2.0);
      const reverbGain = offlineCtx.createGain();
      reverbGain.gain.value = project.soundParams.reverbSize * 0.4;
      reverbNode.connect(reverbGain);
      reverbGain.connect(masterGain);
    }

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
