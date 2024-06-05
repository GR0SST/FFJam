export const mbs = {
  '30s': 12000,
  '45s': 8000,
  '59s': 12000,
  '60s': 12000,
} as const;

export const calculateBitrate = (duration: number, maxWeight: number) => {
  return ((duration / maxWeight) * 8) * 1000;
}

export const bitrate = (dur: keyof typeof mbs) => {
  return mbs[dur] || mbs['45s'];
};
