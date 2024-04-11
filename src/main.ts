import { consola } from 'consola';
import { exit } from 'process';
import { LAST_FFMPEG_RELEASE, SupportedOS, SYSTEM_CODEC_CONFIG } from './lib/constants.ts';
import { applovinConvert, convertFiles } from './lib/convert-files.ts';
import { fetchFolder } from './lib/fetch-folder.ts';
import { which } from 'bun';
import colors from 'colors';
import ffmpeg from 'fluent-ffmpeg';
import os from 'os';
import readline from 'readline';

const ffmpegPath = which('ffmpeg');
colors.enable();

const pressEnterKeyTo = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  console.log('Press Enter to exit');
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
const path = process.cwd(); //+ '/test';
const outputPath = path + '/output';

if (!curOS || !Object.keys(SYSTEM_CODEC_CONFIG).includes(curOS)) {
  consola.warn(`Unsupported OS: ${curOS}, Supported OS: ${Object.keys(SupportedOS).join(', ')} `);
  await pressEnterKeyTo();
  exit();
}

export const currentEncoder = SYSTEM_CODEC_CONFIG[curOS as SupportedOS];

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
