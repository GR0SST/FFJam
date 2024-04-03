import cliProgress from 'cli-progress';
import ffmpeg from 'fluent-ffmpeg';
import { mkdir } from 'node:fs/promises';
import { currentEncoder } from '../main.ts';
import type { VideoProp, convert } from '../types.ts';
import { bitrate } from './bitrate.ts';
import { clearLastLines } from './clear-last-lines.ts';

const convert = async (data: convert) => {
  const { videoPath, audioPath, output, bitrate, duration, update } = data;
  return new Promise((res) => {
    const video = ffmpeg().input(videoPath);
    video.input(audioPath);
    video.videoCodec(currentEncoder.encoder);
    video.outputOptions([
      '-c:a aac',
      '-vtag hvc1',
      '-preset medium',
      `-maxrate ${bitrate}k`,
      `-bufsize ${bitrate}k`,
      `-b:v ${bitrate}k`,
      '-y',
      '-map 1:a:0',
      '-map 0:v:0',
    ]);
    video.duration(duration);
    video.on('error', () => res(false));
    video.on('end', () => res(true));
    video.on('progress', (progress) => update(progress));

    video.saveToFile(output);
  });
};

export const convertFiles = async (outputPath: string, titles: VideoProp) => {
  for (const title of Object.values(titles)) {
    if (!title.sound) return;
    for (const e of Object.values(title.resize)) {
      const [_resize, titleName, id, _btn, _loc, duration] = e.args;
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
      await convert({
        videoPath: e.path,
        audioPath: title.sound,
        bitrate: bitrate(duration as unknown as any),
        output: `${titleFolder}/${e.name}.mp4`,
        duration: parseInt(duration),
        update,
      });
      bar.stop();
      clearLastLines(1);
      const elapsed = ((new Date().getTime() - startTime) / 1000).toFixed();
      console.log(`${e.name} converted within ${elapsed}s.`);
    }
  }
  return titles;
};

export const applovinConvert = async (outputPath: string, titles: VideoProp) => {
  const resizes = ['1920x1080', '1080x1920'];
  for (const title of Object.values(titles)) {
    if (!title.sound) return;
    for (const e of Object.values(title.resize)) {
      const [resize, titleName, id, _btn, _loc, duration] = e.args;
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
        await convert({
          videoPath: e.path,
          audioPath: title.sound,
          bitrate: bitrate(duration as any) - 10,
          output: `${titleFolder}/${e.name}.mp4`,
          duration: parseInt(duration),
          update,
        });
        bar.stop();
        clearLastLines(1);
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
