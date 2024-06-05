import { consola } from 'consola';
import { exit } from 'process';
import { LAST_FFMPEG_RELEASE, SupportedOS, SYSTEM_CODEC_CONFIG } from './lib/constants.ts';
import { applovinConvert, convertFiles } from './lib/convert-files.ts';
import { fetchFolder } from './lib/fetch-folder.ts';
import { which, semver } from 'bun';
import colors from 'colors';
import ffmpeg from 'fluent-ffmpeg';
import os from 'os';
import axios from 'axios';
import readline from 'readline';
import meta from '../bin/meta.json';

const ffmpegPath = which('ffmpeg');
colors.enable();

const pressEnterKeyTo = (text: string = 'Press Enter to exit') => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  console.log(text);
  return new Promise((res) => {
    //@ts-ignore
    rl.input.on('keypress', () => {
      rl.close();
      res(true);
    });
  });
};

if (!ffmpegPath) {
  consola.warn(`The ffmpeg is missing, install it from [FFmpeg_Full.msi] ${LAST_FFMPEG_RELEASE}`);
  await pressEnterKeyTo();
  exit();
}



ffmpeg.setFfmpegPath(ffmpegPath);
consola.info('ffmpeg path:', ffmpegPath);

const curOS = os.platform();
const path = process.cwd() // + '/test';
const outputPath = path + '/output';

if (!curOS || !Object.keys(SYSTEM_CODEC_CONFIG).includes(curOS)) {
  consola.warn(`Unsupported OS: ${curOS}, Supported OS: ${Object.keys(SupportedOS).join(', ')} `);
  await pressEnterKeyTo();
  exit();
}
export const SYSTEM_CONFIG = SYSTEM_CODEC_CONFIG[curOS as SupportedOS];

const checkForUpdate = async () => {
  const req = await axios.get('https://raw.githubusercontent.com/GR0SST/FFJam/dev/bin/meta.json').catch(e => console.log("Unnable to check for updates"));
  if (!req?.data) return

  const isUpToDate = semver.satisfies(meta.version, `^${req.data.version}`)
  if (isUpToDate) return consola.info(`You are up to date! ${meta.name} version: ${meta.version}`)

  consola.warn(`New version available! ${meta.name} version: ${req.data.version}\nDownload link ${SYSTEM_CONFIG.executable}`)


  await pressEnterKeyTo("Press Enter to continue");
}
await checkForUpdate()


const bootstrap = async () => {
  const folder = await fetchFolder(path);
  consola.log('-------------CONVERTING-----------');
  console.time('CONVERTING_FILES');
  await convertFiles(outputPath, folder);
  console.timeEnd('CONVERTING_FILES');
  consola.log('------------------------------\n\n');
  consola.log('-------------APPLOVIN-------------');
  console.time('CONVERTING_APPLOVIN');
  await applovinConvert(outputPath, folder);
  consola.log('------------------------------\n\n');
  console.timeEnd('CONVERTING_APPLOVIN');
};

await bootstrap();
await pressEnterKeyTo();
exit();
