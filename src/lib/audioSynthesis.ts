export const playTablaSound = (ctx: AudioContext, type: 'dha' | 'dhin' | 'tin' | 'na', baseFreq: number = 150) => {
  if (!ctx) return;
  const now = ctx.currentTime;
  
  if (type === 'dha' || type === 'dhin') {
    // Low bass (Bayan) - deep resonant boom
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    
    // Pitch envelope (glides down for Dha, stays flatter for Dhin)
    osc.frequency.setValueAtTime(120, now);
    if (type === 'dha') {
       osc.frequency.exponentialRampToValueAtTime(65, now + 0.2);
    } else {
       osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
    }
    
    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + (type === 'dha' ? 0.6 : 0.4));
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.7);
  }
  
  if (type === 'dha' || type === 'na' || type === 'tin') {
    // High rim/tonal (Dayan) - sharp strike
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    // Triangle gives a hollow woody tone
    osc.type = 'triangle';
    
    // Tin is slightly higher pitch and more muted
    const pitchMultiplier = type === 'tin' ? 1.15 : 1.0;
    osc.frequency.setValueAtTime(baseFreq * pitchMultiplier, now);
    
    const attackVol = type === 'tin' ? 0.4 : 0.8;
    gain.gain.setValueAtTime(attackVol, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + (type === 'tin' ? 0.4 : 0.3));
    
    // Add noise for the sharp skin strike/rim attack
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
       data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 2500;
    noiseFilter.Q.value = 1.5;
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(type === 'na' || type === 'dha' ? 0.6 : 0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.5);
    noise.start(now);
  }
};

export const playTanpuraPluck = (ctx: AudioContext, freq: number, volume: number = 0.7) => {
  if (!ctx) return;
  const now = ctx.currentTime;
  
  const osc = ctx.createOscillator();
  const harmonic1 = ctx.createOscillator();
  const harmonic2 = ctx.createOscillator();
  const gain = ctx.createGain();

  // Sawtooth creates the rich Jivari (buzzing thread) overtone spectrum
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, now);

  harmonic1.type = 'sine';
  harmonic1.frequency.setValueAtTime(freq * 2, now);
  
  harmonic2.type = 'triangle';
  harmonic2.frequency.setValueAtTime(freq * 3, now);

  // Soft lowpass filter to simulate the acoustic gourd resonance and warm up the sawtooth
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(freq * 6, now); // let some overtones through
  filter.Q.value = 0.5;

  // Envelopes: Tanpura has a soft attack and a very long, swelling decay
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(volume * 0.4, now + 0.15); // Swell up
  gain.gain.exponentialRampToValueAtTime(0.001, now + 4.5); // Long resonant decay

  osc.connect(filter);
  
  const h1Gain = ctx.createGain();
  h1Gain.gain.value = 0.3;
  harmonic1.connect(h1Gain);
  h1Gain.connect(filter);
  
  const h2Gain = ctx.createGain();
  h2Gain.gain.value = 0.15;
  harmonic2.connect(h2Gain);
  h2Gain.connect(filter);
  
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  harmonic1.start(now);
  harmonic2.start(now);
  
  osc.stop(now + 5.0);
  harmonic1.stop(now + 5.0);
  harmonic2.stop(now + 5.0);
};
