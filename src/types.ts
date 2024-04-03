export interface VideoProp {
  [key: string]: {
    resize: { [key: string]: VideoResizeOpts };
    id: string;
    sound?: string;
  };
}

export interface VideoResizeOpts {
  name: string;
  args: string[];
  path: string;
}

export type convert = {
  videoPath: string;
  audioPath: string;
  output: string;
  bitrate: number;
  duration: number;
  update: Function;
};