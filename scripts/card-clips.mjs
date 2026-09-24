// Builds the hover/feature clips for project cards (homepage featured work and the Work
// page): one silent 10-second loop per project, up to 1280px wide so it stays sharp at
// card size. The spiral experiment's 480px loops are too soft for that. Writes
// src/data/card-videos.json ({ slug: "/assets/cards/<id>.mp4" }).
//
//   FFMPEG=path/to/ffmpeg node scripts/card-clips.mjs
//
// Sources are the same masters scripts/spiral-clips.mjs uses — the first clip per project.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const SCRATCH = process.env.SPIRAL_SRC || 'C:/Users/Nick/AppData/Local/Temp/claude/F--Design-Personal-Claudecode/ee9eb514-316f-41c0-b5ce-1c7bd2e9a568/scratchpad/reel';
const clips = (f) => path.join(SCRATCH, 'clips', f);
const dl = (f) => path.join(SCRATCH, 'spiralclips', f);
const F = 'F:/Design';

// [project slug, clip id, source, optional { width, crf } override]
const SOURCES = [
  ['dragonfly-brand-launch', 'dragonfly', clips('dragonfly_1.mp4')],
  ['fluence-design-and-content', 'fluence', clips('fluence_tj.mp4')],
  ['snapdragon', 'snapdragon', clips('give55_1.webm')],
  ['great-minds-poc', 'great-minds', clips('greatminds_1.mp4')],
  ['4r', '4r', `${F}/Clients/Rasor/4R_FBAd1.mp4`, { width: 960, crf: 31 }], // grainy square source — lighter so it stays ~3.5MB
  ['audi-dealership', 'audi', dl('audi_1.mkv')],
  ['roomvy', 'roomvy', `${F}/Clients/ORganize me/HBC/Roomvyintro_AME/Final Comp.mp4`],
  ['pathfinder-studios', 'pathfinder', `${F}/Pathfinder/Website/Pathfinder-rebrand-reel.mp4`],
  ['pwc', 'playwrights', `${F}/Pathfinder/PathfinderReel_PWC.mp4`],
];

const out = 'public/assets/cards';
mkdirSync(out, { recursive: true });
const manifest = {};
for (const [slug, id, src, opt = {}] of SOURCES) {
  process.stdout.write(`${id} ... `);
  const mp4 = `${out}/${id}.mp4`;
  const vf = `scale='min(${opt.width ?? 1280},iw)':-2:flags=lanczos,fps=24,format=yuv420p`;
  execFileSync(FFMPEG, ['-y', '-v', 'error', '-i', src, '-t', '10', '-an', '-vf', vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(opt.crf ?? 26), '-movflags', '+faststart', mp4]);
  manifest[slug] = `/assets/cards/${id}.mp4`;
  console.log('ok');
}
writeFileSync('src/data/card-videos.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`wrote ${SOURCES.length} clips + src/data/card-videos.json`);
