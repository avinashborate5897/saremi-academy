const fs = require('fs');
let content = fs.readFileSync('src/components/public/ToolsView.tsx', 'utf-8');

const head = `import React, { useState, useEffect } from 'react';
import { Play, Square, Volume2, RotateCcw, Sliders, Clock, Sparkles, CheckCircle } from 'lucide-react';
import { Button, Card, Badge } from '../../design-system';
import { SEOHead } from '../SEOHead';
import { useTanpura, useMetronome } from '../../hooks/useAudioTools';

export const ToolsView: React.FC = () => {
  const { 
    tanpuraPlaying, setTanpuraPlaying, 
    selectedRoot, setSelectedRoot, 
    tuningType, setTuningType, 
    tanpuraVolume, setTanpuraVolume 
  } = useTanpura();

  const { 
    tala, setTala, 
    bpm, setBpm, 
    metronomePlaying, setMetronomePlaying, 
    currentBeat, currentTalaConfig 
  } = useMetronome();
`;

const timerActiveRegex = /const \[timerActive, setTimerActive\] = useState\(false\);/;
const match = content.match(timerActiveRegex);
if (match) {
  content = head + '\n  ' + content.slice(match.index);
  fs.writeFileSync('src/components/public/ToolsView.tsx', content);
} else {
  console.log("Could not find timerActive");
}
