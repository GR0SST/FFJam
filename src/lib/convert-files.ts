import cliProgress from 'cli-progress';
import ffmpeg from 'fluent-ffmpeg';
import { mkdir } from 'node:fs/promises';
import { currentEncoder } from '../main.ts';
import type { VideoProp, convert } from '../types.ts';
import { bitrate, calculateBitrate } from './bitrate.ts';
import { clearLastLines } from './clear-last-lines.ts';
import { file } from 'bun';
import { renameSync } from 'node:fs';

const convert = async (data: convert) => {
  const { videoPath, audioPath, output, bitrate, duration, update } = data;
  return new Promise((res) => {
    const video = ffmpeg().input(videoPath);
    audioPath && video.input(audioPath);
    video.videoCodec(currentEncoder.encoder);
    const options = [
      '-c:a aac',
      '-vtag hvc1',
      '-preset medium',
      `-maxrate ${bitrate * currentEncoder.multilier}k`,
      `-bufsize ${bitrate * currentEncoder.multilier}k`,
      `-b:v ${bitrate * currentEncoder.multilier}k`,
      '-y',
    ];
    options.push(...currentEncoder.options);
    audioPath && options.push('-map 1:a:0', '-map 0:v:0');
    video.outputOptions(options);
    video.duration(duration);
    video.on('error', () => res(false));
    video.on('end', () => res(true));
    video.on('progress', (progress) => update(progress));

    video.saveToFile(output);
  });
};

export const convertFiles = async (outputPath: string, titles: VideoProp) => {
  for (const title of Object.values(titles)) {
    for (const e of Object.values(title.resize)) {
      const [resize, titleName, id, btn, loc, duration] = e.args;
      const titleFolder = `${outputPath}/cream/${titleName}_${id}`;
      await mkdir(titleFolder, { recursive: true });
      const startTime = new Date().getTime();
      const bar = new cliProgress.SingleBar(
        {
          format: '{bar} ' + '| {percentage}% ' + e.name,
        },
        cliProgress.Presets.shades_classic,
      );
      bar.start(100, 0);
      const update = (progress: any) => bar.update(Math.round(progress.percent));
      const output = `${titleFolder}/${e.name}.mp4`;
      await convert({
        videoPath: e.path,
        audioPath: title.sound,
        bitrate: bitrate(duration as unknown as any),
        output,
        duration: parseInt(duration),
        update,
      });
      bar.stop();
      clearLastLines(1);
      const newFileSize = Math.floor(file(output).size / 1000000);
      renameSync(
        output,
        `${titleFolder}/${resize}_${titleName}_${id}_${btn}_${loc}_${duration}_${newFileSize}mb.mp4`,
      );
      const elapsed = ((new Date().getTime() - startTime) / 1000).toFixed();
      console.log(`${e.name} converted within ${elapsed}s.`);
    }
  }
  return titles;
};

export const applovinConvert = async (outputPath: string, titles: VideoProp) => {
  const resizes = ['1920x1080', '1080x1920'];
  for (const title of Object.values(titles)) {
    for (const e of Object.values(title.resize)) {
      const [resize, titleName, id, btn, loc, duration] = e.args;
      if (resizes.includes(resize)) {
        const titleFolder = `${outputPath}/applovin/${titleName}_${id}`;
        await mkdir(titleFolder, { recursive: true });
        const startTime = new Date().getTime();
        const bar = new cliProgress.SingleBar(
          {
            format: '{bar} ' + '| {percentage}% ' + e.name,
          },
          cliProgress.Presets.shades_classic,
        );
        bar.start(100, 0);
        const update = (progress: any) => bar.update(Math.round(progress.percent));
        const output = `${titleFolder}/${e.name}.mp4`;
        await convert({
          videoPath: e.path,
          audioPath: title.sound,
          bitrate: calculateBitrate(duration as any, 50), //bitrate(duration as any) - 10,
          output,
          duration: parseInt(duration),
          update,
        });
        bar.stop();
        clearLastLines(1);
        const newFileSize = Math.floor(file(output).size / 1000000);
        renameSync(
          output,
          `${titleFolder}/${resize}_${titleName}_${id}_${btn}_${loc}_${duration}_${newFileSize}mb.mp4`,
        );
        console.log(
          `Applovin variant for ${e.name} created within ${(
            (new Date().getTime() - startTime) /
            1000
          ).toFixed()}s.`,
        );
      }
    }
  }
  return true;
};
