/**
 * Perlin va Simplex uslubidagi tezyurar Noise generatori
 * Relyef, tog'lar, vodiylar va daryolarni tabiiy shakllantirish uchun.
 */

// Permutatsiya jadvali (deterministic PRNG asosida)
class NoiseGenerator {
  constructor(seed = 1337) {
    this.seed = seed;
    this.p = new Uint8Array(512);
    this.permutation = new Uint8Array(256);
    this.init(seed);
  }

  // PRNG (Mulberry32)
  mulberry32(a) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  init(seed) {
    const rng = this.mulberry32(seed);
    for (let i = 0; i < 256; i++) {
      this.permutation[i] = i;
    }
    // Shuffle
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = this.permutation[i];
      this.permutation[i] = this.permutation[j];
      this.permutation[j] = tmp;
    }
    for (let i = 0; i < 512; i++) {
      this.p[i] = this.permutation[i & 255];
    }
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(t, a, b) {
    return a + t * (b - a);
  }

  grad(hash, x, y) {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise2D(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this.fade(xf);
    const v = this.fade(yf);

    const aa = this.p[this.p[X] + Y];
    const ab = this.p[this.p[X] + Y + 1];
    const ba = this.p[this.p[X + 1] + Y];
    const bb = this.p[this.p[X + 1] + Y + 1];

    const x1 = this.lerp(u, this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf));
    const x2 = this.lerp(u, this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1));

    return this.lerp(v, x1, x2);
  }

  // Fractal Brownian Motion (Ko'p qatlamli shovqin)
  fbm(x, y, octaves = 6, lacunarity = 2.0, persistence = 0.5) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }

  // Qirrali tog'lar uchun Ridge Noise
  ridgeNoise(x, y, octaves = 4) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let weight = 1;

    for (let i = 0; i < octaves; i++) {
      let v = 1.0 - Math.abs(this.noise2D(x * frequency, y * frequency));
      v = v * v;
      v *= weight;
      weight = Math.min(1.0, Math.max(0.0, v * 2.0));
      total += v * amplitude;
      frequency *= 2.1;
      amplitude *= 0.5;
    }

    return total;
  }
}

export const noiseGen = new NoiseGenerator(42);
