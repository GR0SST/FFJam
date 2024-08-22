import { which, semver } from 'bun';
import { consola } from 'consola';
import ffmpeg from 'fluent-ffmpeg';
import os from 'os';
import meta from '../bin/meta.json';
import * as p from '@clack/prompts';
import color from 'picocolors';
import { LAST_FFMPEG_RELEASE, SupportedOS, SYSTEM_CODEC_CONFIG } from './lib/constants.ts';
import { convertFiles } from './lib/convert-files.ts';
import { env, exit } from 'process';
import { fetchFolder } from './lib/fetch-folder.ts';

const ffmpegPath = which('ffmpeg');

const curOS = os.platform();

interface ResponseData {
  version: string;
}

export const SYSTEM_CONFIG = SYSTEM_CODEC_CONFIG[curOS as SupportedOS];

async function main() {
  console.clear();

  p.intro(`${color.bgCyan(color.black(' FFJam - Internal Video Converter '))}`);

  const cli = await p.group(
    {
      checkForUpdate: async () => {
        const response = await fetch(
          'https://raw.githubusercontent.com/GR0SST/FFJam/dev/bin/meta.json',
        );

        if (!response.ok) {
          throw new Error('Failed to fetch update information');
        }

        const data = (await response.json()) as ResponseData;

        const isUpToDate = semver.satisfies(meta.version, `^${data.version}`);

        if (!isUpToDate) {
          consola.box(
            color.dim(
              `New version available! ${meta.name} version: ${data.version}\nDownload link: ${SYSTEM_CONFIG.executable}`,
            ),
          );
          return p.cancel('Operation was cancelled duo to old version!');
        }

        p.note('The FFjam tool is up to date!');
      },

      systemCheck: () => {
        if (!ffmpegPath) {
          consola.box(
            color.dim(
              `The ffmpeg is missing, install it from\n[FFmpeg_Full.msi] ${color.bgYellow(LAST_FFMPEG_RELEASE)}`,
            ),
          );

          return p.cancel('Operation was cancelled duo to missing FFmpeg package!');
        }

        ffmpeg.setFfmpegPath(ffmpegPath);
      },

      start: async () => {
        let path = process.cwd();

        if (env.NODE_ENV === 'development') {
          path += '/test';
        }

        const outputPath = path + '/output';

        const fetchFolderSpinner = p.spinner();
        fetchFolderSpinner.start('Loading all the folders');
        const folder = await fetchFolder(path);
        fetchFolderSpinner.stop('All folders fetched successfully!');

        await convertFiles(outputPath, folder);
      },
    },
    {
      onCancel: () => {
        p.cancel('Operation cancelled.');
        exit(0);
      },
    },
  );
}

// const bootstrap = async () => {
//   const folder = await fetchFolder(path);
//   consola.log('-------------CONVERTING-----------');
//   console.time('CONVERTING_FILES');
//   await convertFiles(outputPath, folder);
//   console.timeEnd('CONVERTING_FILES');
//   consola.log('------------------------------\n\n');
//   consola.log('-------------APPLOVIN-------------');
//   console.time('CONVERTING_APPLOVIN');
//   await applovinConvert(outputPath, folder);
//   consola.log('------------------------------\n\n');
//   console.timeEnd('CONVERTING_APPLOVIN');
// };

main().catch(console.error);
