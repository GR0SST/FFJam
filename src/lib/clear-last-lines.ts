import { stdout } from 'process';

export const clearLastLines = (count: number) => {
  stdout.moveCursor(0, -count);
  stdout.clearScreenDown();
};
