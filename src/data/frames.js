const base = import.meta.env.BASE_URL;

export default Array.from({ length: 7 }, (_, idx) => `${base}frames/frame-${idx + 1}.png`);
