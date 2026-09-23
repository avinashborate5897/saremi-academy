const fs = require('fs');
let content = fs.readFileSync('src/components/classroom/LiveClassroomModal.tsx', 'utf-8');

// Import audioSynthesis
content = content.replace("import { motion, AnimatePresence } from 'motion/react';", "import { motion, AnimatePresence } from 'motion/react';\nimport { playTablaSound, playTanpuraPluck } from '../../lib/audioSynthesis';");

// Replace playPluck and playClick
const oldPlayPluckRegex = /const playPluck = \([\s\S]*?catch \{\n      \/\/ Audio fallback\n    \}\n  \};/;
content = content.replace(oldPlayPluckRegex, '');

const oldStrumSeqRegex = /const pluckSequence = \(\) => \{\n      \/\/ 1st string \(Pa\/Ma\/Ni\)[\s\S]*?\};/;
const newStrumSeq = `const pluckSequence = () => {
      const ctx = getAudioContext();
      if (!ctx) return;
      playTanpuraPluck(ctx, firstStringFreq, tanpuraVolume);
      setTimeout(() => playTanpuraPluck(ctx, root * 2, tanpuraVolume), 700);
      setTimeout(() => playTanpuraPluck(ctx, root * 2, tanpuraVolume), 1400);
      setTimeout(() => playTanpuraPluck(ctx, root, tanpuraVolume), 2100);
    };`;
content = content.replace(oldStrumSeqRegex, newStrumSeq);

const oldPlayClickRegex = /const playClick = \(isSam: boolean\) => \{[\s\S]*?catch \{\n      \/\/ ignore\n    \}\n  \};/;
const newPlayClick = `const playClick = (isSam: boolean, isKhali: boolean = false) => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    let soundType: 'dha' | 'dhin' | 'tin' | 'na' = 'na';
    if (isSam) soundType = 'dha';
    else if (isKhali) soundType = 'tin';
    else soundType = 'dhin';
    
    playTablaSound(ctx, soundType, 300);
  };`;
content = content.replace(oldPlayClickRegex, newPlayClick);

const oldMetroIntervalRegex = /metroIntervalRef.current = setInterval\(\(\) => \{[\s\S]*?return next;\n      \}\);\n    \}, intervalMs\);/;
const newMetroInterval = `metroIntervalRef.current = window.setInterval(() => {
      setCurrentBeat((prev) => {
        const next = prev >= selectedTaal.beats ? 1 : prev + 1;
        const isSom = next === 1;
        const isKhali = (selectedTaal as any).khali ? (selectedTaal as any).khali.includes(next) : false;
        playClick(isSom, isKhali);
        return next;
      });
    }, intervalMs);`;
content = content.replace(oldMetroIntervalRegex, newMetroInterval);

// Layout inline fix
content = content.replace(
  '<div className="flex-1 bg-[#090D14] relative flex flex-col p-2 sm:p-4 overflow-hidden w-full">',
  '<div className="flex-1 flex flex-col overflow-hidden relative min-w-0">\n          <div className="flex-1 bg-[#090D14] relative flex flex-col p-2 sm:p-4 overflow-hidden w-full min-h-0">'
);

const oldSheetStartRegex = /\{\/\* Mobile Companion Bottom Sheet \(Sliding Drawer\) \*\/\}[\s\S]*?className="lg:hidden fixed bottom-0 left-0 right-0 z-50 max-h-\[85vh\] bg-\[#131A26\] border-t border-gray-700\/80 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"/;
const newSheetStart = `</div>
        {/* Mobile Companion Split Panel (Inline) */}
        <AnimatePresence>
          {isMobilePanelOpen && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: '45vh' }}
                exit={{ height: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className="lg:hidden w-full bg-[#131A26] border-t border-gray-700/80 shadow-2xl flex flex-col overflow-hidden flex-shrink-0"`;
content = content.replace(oldSheetStartRegex, newSheetStart);

content = content.replace('<span>Minimize to Video</span>', '<span>Minimize</span>');
content = content.replace("? 'Tanpura & Taal continue playing in the background while you sing and view the teacher.'", "? 'Tanpura & Taal continue playing in the background while you sing.'");

const oldSheetEndRegex = /<\/div>\n              <\/motion\.div>\n            <\/>\n          \)}\n        <\/AnimatePresence>/;
const newSheetEnd = `</div>
              </motion.div>
          )}
        </AnimatePresence>`;
content = content.replace(oldSheetEndRegex, newSheetEnd);

fs.writeFileSync('src/components/classroom/LiveClassroomModal.tsx', content);
