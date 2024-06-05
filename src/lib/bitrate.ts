export const calculateBitrate = (duration: number, maxWeight: number) => {
  return Math.floor((((maxWeight * 0.9) / duration) * 8) * 1000);
}

export const mbs = {
  '30s': calculateBitrate(30, 50),
  '45s': calculateBitrate(45, 100),
  '59s': calculateBitrate(59, 100),
  '60s': calculateBitrate(60, 100),
} as const;

export const bitrate = (dur: keyof typeof mbs) => {
  return mbs[dur] || mbs['45s'];
};
