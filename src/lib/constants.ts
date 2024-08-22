export const SUPPORTED_AUDIO_FORMATS: string[] = ['.wav', '.mp3'] as const;
export const SUPPORTED_VIDEO_FORMATS: string[] = ['.mp4', '.avi', '.mov'] as const;

export enum SupportedOS {
  Darwin = 'darwin',
  Win32 = 'win32',
}

export const LAST_FFMPEG_RELEASE: string =
  'https://github.com/icedterminal/ffmpeg-installer/releases/tag/6.1.1.20240201';

export const SYSTEM_CODEC_CONFIG = {
  [SupportedOS.Darwin]: {
    encoder: 'hevc_videotoolbox',
    options: [],
    multilier: 1.4,
    executable: 'https://github.com/GR0SST/FFJam/raw/dev/bin/ffj',
  },
  [SupportedOS.Win32]: {
    encoder: 'hevc_nvenc',
    options: ['-vf format=yuv420p'],
    multilier: 1,
    executable: 'https://github.com/GR0SST/FFJam/raw/dev/bin/ffj.exe',
  },
} as const;
