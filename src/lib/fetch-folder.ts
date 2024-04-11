import { readdir } from 'node:fs/promises';
import { SUPPORTED_AUDIO_FORMATS, SUPPORTED_VIDEO_FORMATS } from './constants.ts';
import { consola } from 'consola';
import type { VideoProp } from '../types.ts';

import { centerAlign } from 'consola/utils';

const isSizeValid = (size: string): boolean => /^\d+mb$/.test(size);
const isDurationValid = (duration: string): boolean => /^\d+s$/.test(duration);
const isIdValid = (id: string): boolean => /\bvideo\d+v\d+\b/.test(id);
const isNonNumeric = (value: string): boolean => /^[^\d]+$/.test(value);
const isResizeValid = (resize: string): boolean => /\b\d{3,4}x\d{3,4}\b/.test(resize);

const isNameValid = (args: string[]): any => {
  const [resize, title, id, btn, loc, duration, size] = args;
  const validation =  [
    isResizeValid(resize),
    isNonNumeric(title),
    isIdValid(id),
    isNonNumeric(btn),
    isNonNumeric(loc),
    isDurationValid(duration),
    isSizeValid(size)
  ];
  
  return {
    isValid:!validation.some(e=>!e),
    output:args.map((e,i)=>{
      if(validation[i])
        return e 
      else return e.red
    }).join("_")
  }
};

export const fetchFolder = async (path: string): Promise<VideoProp> => {
  const titles: VideoProp = {};

  const addedList: string[] = [];

  try {
    const folders = await readdir(path);

    const videos = folders.filter((file) =>
      SUPPORTED_VIDEO_FORMATS.some((ext) => file.endsWith(ext)),
    );
    const audios = folders.filter((file) =>
      SUPPORTED_AUDIO_FORMATS.some((ext) => file.endsWith(ext)),
    );

    for (const video of videos) {
      const name = video.substring(0, video.lastIndexOf('.')) || video;
      const args = name.toLowerCase().split('_');
      const [resize, _title, id, _btn, loc] = args;
      const nameCheck = isNameValid(args)
      
      if (!nameCheck.isValid) {
        consola.warn(`Bad naming ${nameCheck.output} - skipping`);
        continue;
      }

      if (titles[id]?.resize[resize] && titles[id].resize[resize].args[4] === loc) {
        consola.warn(`Duplicates found ${video} and ${titles[id].resize[resize].name}`);
        continue;
      }

      titles[id] = titles[id] || { resize: {}, id };

      titles[id].resize[resize] = {
        name: args.join('_'),
        args,
        path: `${path}/${video}`,
      };

      addedList.push(`Added ${name}`);
    }

    consola.box(addedList.join('\n'));

    const audioList: string[] = [];

    for (const audio of audios) {
      const name = audio.substring(0, audio.lastIndexOf('.')) || audio;
      const [title, id] = name.toLowerCase().split('_');
      if (titles[id]) {
        titles[id].sound = `${path}/${audio}`;
        audioList.push(`Appended ${audio} to ${title}_${id}`);
      } else {
        consola.warn(`Creative for ${audio} not found`);
      }
    }

    consola.start(centerAlign('AUDIO', 35));
    consola.box(audioList.join('\n'));

    Object.values(titles).forEach((item) => {
      if (!item.sound) console.warn(`WARNING: Sound for ${item.id} not found`.yellow);
    });
  } catch (error) {
    consola.error('Error occurred while reading folder:', error);
  }

  return titles;
};
