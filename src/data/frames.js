const base = import.meta.env.BASE_URL;

export const SEQUENCE = Array.from({ length: 60 }, (_, idx) => `${base}sequence/frame-${String(idx + 1).padStart(3, "0")}.webp`);

export const FRAMES = Array.from({ length: 7 }, (_, idx) => `${base}frames/frame-${idx + 1}.webp`);

export default FRAMES;
