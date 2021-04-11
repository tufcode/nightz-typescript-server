export const randomRange = (min: number, max: number): number => {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
};
export const randomRangeFloat = (min: number, max: number): number => {
  // min and max included
  min *= 100;
  max *= 100;
  return Math.floor(Math.random() * (max - min + 1) + min) / 100;
};
export const clamp = (n: number, min: number, max: number): number => {
  return Math.min(Math.max(n, min), max);
};
