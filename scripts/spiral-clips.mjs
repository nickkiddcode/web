// Builds the silent 10-second loops used by the homepage spiral experiment.
// One clip per project video: first 10s, no audio, 480px wide, H.264 (looks like a GIF, ~20x smaller,
// and plays as a smooth GPU texture). Also writes a poster frame and src/data/spiral-videos.json.
//
//   FFMPEG=path/to/ffmpeg FFPROBE=path/to/ffprobe node scripts/spiral-clips.mjs
//
// Sources: the project's embed where it was downloadable, otherwise the matching master file on F:.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const FFPROBE = process.env.FFPROBE || 'ffprobe';
const SCRATCH = process.env.SPIRAL_SRC || 'C:/Users/Nick/AppData/Local/Temp/claude/F--Design-Personal-Claudecode/ee9eb514-316f-41c0-b5ce-1c7bd2e9a568/scratchpad/reel';
const clips = (f) => path.join(SCRATCH, 'clips', f);
const dl = (f) => path.join(SCRATCH, 'spiralclips', f);
const F = 'F:/Design';

// slug = project id in src/content/projects; poster = seconds into the source for the still
const SOURCES = [
  ['dragonfly-brand-launch', 'dragonfly-1', clips('dragonfly_1.mp4'), 1.5],
  ['dragonfly-brand-launch', 'dragonfly-2', clips('dragonfly_2.mp4'), 2],
  ['dragonfly-brand-launch', 'dragonfly-3', clips('dragonfly_3.mp4'), 3],
  ['fluence-design-and-content', 'fluence-tj', clips('fluence_tj.mp4'), 4],
  ['fluence-design-and-content', 'fluence-roman', clips('fluence_roman.mp4'), 4],
  ['fluence-design-and-content', 'fluence-nicole', clips('fluence_nicole.mp4'), 3],
  ['snapdragon', 'snapdragon-1', clips('give55_1.webm'), 2],
  ['snapdragon', 'snapdragon-2', clips('give55_2.webm'), 3],
  ['snapdragon', 'snapdragon-3', clips('give55_3.webm'), 3],
  ['snapdragon', 'snapdragon-4', clips('give55_4.mp4'), 3],
  ['great-minds-poc', 'great-minds', clips('greatminds_1.mp4'), 2],
  ['4r', '4r-ad-square', `${F}/Clients/Rasor/4R_FBAd1.mp4`, 2],
  ['4r', '4r-ad-4x5', `${F}/Clients/Rasor/VerticalAd.mp4`, 2],
  ['4r', '4r-built-vertical', `${F}/Clients/Rasor/Builtforyourfamily-vert.mp4`, 2],
  ['audi-dealership', 'audi-1', dl('audi_1.mkv'), 2],
  ['audi-dealership', 'audi-2', dl('audi_2.mkv'), 2],
  ['audi-dealership', 'audi-3', dl('audi_3.mkv'), 2],
  ['roomvy', 'roomvy-intro', `${F}/Clients/ORganize me/HBC/Roomvyintro_AME/Final Comp.mp4`, 2.0],
  ['pathfinder-studios', 'pathfinder-reel', `${F}/Pathfinder/Website/Pathfinder-rebrand-reel.mp4`, 2.5],
  ['pwc', 'playwrights-reel', `${F}/Pathfinder/PathfinderReel_PWC.mp4`, 3],
];

const out = 'public/assets/spiral';
mkdirSync(out, { recursive: true });
mkdirSync('src/data', { recursive: true });

const manifest = {};
for (const [slug, id, src, posterAt] of SOURCES) {
  process.stdout.write(`${id} ... `);
  const mp4 = `${out}/${id}.mp4`;
  const jpg = `${out}/${id}.jpg`;
  const vf = 'scale=480:-2:flags=lanczos,fps=24,format=yuv420p';
  execFileSync(FFMPEG, ['-y', '-v', 'error', '-i', src, '-t', '10', '-an', '-vf', vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', '30', '-movflags', '+faststart', mp4]);
  execFileSync(FFMPEG, ['-y', '-v', 'error', '-ss', String(posterAt), '-i', mp4, '-frames:v', '1', '-q:v', '5', jpg]);
  const [w, h] = execFileSync(FFPROBE, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', mp4]).toString().trim().split(',').map(Number);
  (manifest[slug] ||= []).push({ id, src: `/assets/spiral/${id}.mp4`, poster: `/assets/spiral/${id}.jpg`, w, h });
  console.log(`${w}x${h}`);
}
writeFileSync('src/data/spiral-videos.json', JSON.stringify(manifest, null, 2));
console.log(`wrote ${SOURCES.length} clips + src/data/spiral-videos.json`);
