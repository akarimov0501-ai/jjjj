import * as THREE from 'three';

/**
 * HTML5 Canvas orqali xotirada generatsiya qilinadigan ultra-aniqlikdagi protsedural teksturalar.
 * Tashqi fayllarsiz PBR (Normal, Roughness, Shading) effektlarini beradi.
 */

// 1. Tosh va qoya qatlamlari Normal Map
export function generateRockNormalTexture(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Simplex-style noise approximation
      const nx = Math.sin(x * 0.1) * Math.cos(y * 0.08) + Math.sin(x * 0.03 + y * 0.05);
      const ny = Math.cos(x * 0.08) * Math.sin(y * 0.1) + Math.cos(x * 0.04 - y * 0.03);

      // Normal vector (-1 to 1) -> (0 to 255)
      const r = Math.floor((nx * 0.5 + 0.5) * 255);
      const g = Math.floor((ny * 0.5 + 0.5) * 255);
      const b = 255; // Yuqoriga qaragan normal

      const idx = (y * size + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(30, 30);
  return texture;
}

// 2. Suv to'lqinlari Normal Map
export function generateWaterNormalTexture(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v1 = Math.sin(x * 0.08 + y * 0.06);
      const v2 = Math.cos(x * 0.05 - y * 0.07);
      const v3 = Math.sin((x + y) * 0.1);

      const dx = (v1 + v3) * 0.4;
      const dy = (v2 + v3) * 0.4;

      const r = Math.floor((dx * 0.5 + 0.5) * 255);
      const g = Math.floor((dy * 0.5 + 0.5) * 255);
      const b = 240;

      const idx = (y * size + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(40, 40);
  return texture;
}
