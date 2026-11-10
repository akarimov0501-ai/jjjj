import { POI_LOCATIONS } from '../world/structures.js';
import { WORLD_SIZE } from '../world/terrain.js';

export class Minimap {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.range = 600; // Ko'rinish radiusi
  }

  update(playerPos, playerRotY, enemies = []) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // 1. Orqa fon (Radar to'ri)
    ctx.fillStyle = '#0a101d';
    ctx.fillRect(0, 0, w, h);

    // Dumaloq radar doiralari
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.arc(cx, cy, 35, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 70, 0, Math.PI * 2);
    ctx.stroke();

    // O'q chiziqlari (Crosshair)
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    const scale = (w / 2) / this.range;

    // 2. Qiziqarli nuqtalar (POI ob'ektlari)
    for (const key in POI_LOCATIONS) {
      const poi = POI_LOCATIONS[key];
      const dx = poi.x - playerPos.x;
      const dz = poi.z - playerPos.z;

      const mapX = cx + dx * scale;
      const mapY = cy + dz * scale;

      const distSq = (mapX - cx) ** 2 + (mapY - cy) ** 2;
      if (distSq < (w / 2 - 8) ** 2) {
        ctx.beginPath();
        ctx.arc(mapX, mapY, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // 3. Dushman dronlar (Qizil miltillovchi nuqtalar)
    if (enemies && enemies.length > 0) {
      const time = performance.now() / 200;
      const blink = Math.sin(time) > 0;

      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (!e.isAlive) continue;

        const dx = e.mesh.position.x - playerPos.x;
        const dz = e.mesh.position.z - playerPos.z;

        const mapX = cx + dx * scale;
        const mapY = cy + dz * scale;

        const distSq = (mapX - cx) ** 2 + (mapY - cy) ** 2;
        if (distSq < (w / 2 - 8) ** 2) {
          ctx.beginPath();
          ctx.arc(mapX, mapY, blink ? 4.5 : 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ff0044';
          ctx.shadowColor = '#ff0044';
          ctx.shadowBlur = blink ? 8 : 4;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }

    // 4. O'yinchi belgisi (Markazda aylanuvchi uchburchak)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-playerRotY + Math.PI);

    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(6, 7);
    ctx.lineTo(0, 4);
    ctx.lineTo(-6, 7);
    ctx.closePath();

    ctx.fillStyle = '#ff0077';
    ctx.shadowColor = '#ff0077';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.restore();
  }
}
