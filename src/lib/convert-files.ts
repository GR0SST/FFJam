import ffmpeg from 'fluent-ffmpeg';
import { renameSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { SYSTEM_CONFIG } from '../main.ts';
import type { VideoProp, convert } from '../types.ts';
import { bitrate } from './bitrate.ts';
import { file } from 'bun';
import * as p from '@clack/prompts';

const convert = async (data: convert) => {
  const { videoPath, audioPath, output, bitrate, duration } = data;
  return new Promise((res) => {
    const video = ffmpeg().input(videoPath);
    audioPath && video.input(audioPath);
    video.videoCodec(SYSTEM_CONFIG.encoder);
    const options = [
      '-c:a aac',
      '-vtag hvc1',
      '-preset medium',
      `-maxrate ${bitrate * SYSTEM_CONFIG.multilier}k`,
      `-bufsize ${bitrate * SYSTEM_CONFIG.multilier}k`,
      `-b:v ${bitrate * SYSTEM_CONFIG.multilier}k`,
      '-y',
    ];
    options.push(...SYSTEM_CONFIG.options);
    audioPath && options.push('-map 1:a:0', '-map 0:v:0');
    video.outputOptions(options);
    video.duration(duration);
    video.on('error', () => res(false));
    video.on('end', () => res(true));

    video.saveToFile(output);
  });
};

export const convertFiles = async (outputPath: string, titles: VideoProp) => {
  for (const title of Object.values(titles)) {
    for (const e of Object.values(title.resize)) {
      const fileSpinner = p.spinner();
      fileSpinner.start(`Converting ${e.name}`);
      const [resize, titleName, id, btn, loc, duration] = e.args;
      const titleFolder = `${outputPath}/cream/${titleName}_${id}`;
      await mkdir(titleFolder, { recursive: true });
      const startTime = new Date().getTime();

      const output = `${titleFolder}/${e.name}.mp4`;
      await convert({
        videoPath: e.path,
        audioPath: title.sound,
        bitrate: bitrate(duration as unknown as any),
        output,
        duration: parseInt(duration),
      });
      const newFileSize = Math.floor(file(output).size / 1000000);
      renameSync(
        output,
        `${titleFolder}/${resize}_${titleName}_${id}_${btn}_${loc}_${duration}_${newFileSize}mb.mp4`,
      );
      fileSpinner.stop(`${e.name} was successfully converted!`);
      const elapsed = ((new Date().getTime() - startTime) / 1000).toFixed();
      p.note(`${e.name} converted within ${elapsed}s.`);
    }
  }
  return titles;
};
