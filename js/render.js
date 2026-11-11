function hexToRgba(hex, alpha) {
  const value = parseInt(hex.replace("#", ""), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function resize() {
  vw = window.innerWidth;
  vh = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(vw * dpr));
  canvas.height = Math.max(1, Math.round(vh * dpr));
  canvas.style.width = `${vw}px`;
  canvas.style.height = `${vh}px`;
  ctx.imageSmoothingEnabled = true;
  if (player) {
    camera.x = clamp(camera.x, 0, Math.max(0, WORLD.w - vw));
    camera.y = clamp(camera.y, 0, Math.max(0, WORLD.h - vh));
  }
}

function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, vw, vh);
  ctx.fillStyle = "#090c0a";
  ctx.fillRect(0, 0, vw, vh);

  const shakeX = (Math.random() - 0.5) * camera.shake;
  const shakeY = (Math.random() - 0.5) * camera.shake;

  ctx.save();
  ctx.translate(-camera.x + shakeX, -camera.y + shakeY);
  drawWorld();
  drawPickups();
  for (const enemy of enemies) drawEnemy(enemy);
  drawPlayer();
  drawProjectiles();
  drawEffects();
  drawParticles();
  drawFloats();
  ctx.restore();

  if (state === "playing" && mouse.inside) drawReticle();
}

function drawWorld() {
  drawFloor();
  drawStains();
  drawPlates();
  drawCracks();
  drawConveyors();
  drawVents();
  drawPipes();
  drawCrates();
  drawBarrels();
  drawLamps();
  drawEmbers();
  drawWorldBorder();
}

function drawFloor() {
  const startX = Math.max(0, Math.floor(camera.x / TILE) - 1);
  const startY = Math.max(0, Math.floor(camera.y / TILE) - 1);
  const endX = Math.min(Math.ceil(WORLD.w / TILE), Math.ceil((camera.x + vw) / TILE) + 1);
  const endY = Math.min(Math.ceil(WORLD.h / TILE), Math.ceil((camera.y + vh) / TILE) + 1);
  const colors = ["#111512", "#121713", "#101411", "#131813", "#0f1310"];

  ctx.fillStyle = "#0d110e";
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  ctx.strokeStyle = "rgba(130, 150, 125, 0.045)";
  ctx.lineWidth = 1;

  for (let ty = startY; ty < endY; ty++) {
    for (let tx = startX; tx < endX; tx++) {
      const hash = ((tx * 73856093) ^ (ty * 19349663)) >>> 0;
      const x = tx * TILE;
      const y = ty * TILE;
      ctx.fillStyle = colors[hash % colors.length];
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
      if (hash % 13 === 0) {
        ctx.fillStyle = "rgba(155, 170, 145, 0.08)";
        ctx.beginPath();
        ctx.arc(x + 8, y + 8, 1.3, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + TILE - 8, y + TILE - 8, 1.3, 0, TAU);
        ctx.fill();
      }
    }
  }

  ctx.strokeStyle = "rgba(150, 170, 145, 0.06)";
  ctx.beginPath();
  for (let x = startX * TILE; x <= endX * TILE; x += TILE * 5) {
    ctx.moveTo(x + 0.5, startY * TILE);
    ctx.lineTo(x + 0.5, endY * TILE);
  }
  for (let y = startY * TILE; y <= endY * TILE; y += TILE * 5) {
    ctx.moveTo(startX * TILE, y + 0.5);
    ctx.lineTo(endX * TILE, y + 0.5);
  }
  ctx.stroke();
}

function drawStains() {
  for (const stain of decor.stains) {
    if (stain.x + stain.rx < camera.x || stain.y + stain.rx < camera.y || stain.x - stain.rx > camera.x + vw || stain.y - stain.rx > camera.y + vh) continue;
    ctx.save();
    ctx.translate(stain.x, stain.y);
    ctx.rotate(stain.rot);
    ctx.scale(1, stain.ry / stain.rx);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, stain.rx);
    gradient.addColorStop(0, `rgba(3, 6, 3, ${stain.alpha})`);
    gradient.addColorStop(0.65, `rgba(4, 7, 4, ${stain.alpha * 0.65})`);
    gradient.addColorStop(1, "rgba(4, 7, 4, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, stain.rx, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

function drawPlates() {
  for (const plate of decor.plates) {
    if (plate.x + plate.w < camera.x - 40 || plate.y + plate.h < camera.y - 40 || plate.x - plate.w > camera.x + vw + 40 || plate.y - plate.h > camera.y + vh + 40) continue;
    ctx.save();
    ctx.translate(plate.x, plate.y);
    ctx.rotate(plate.rot);
    ctx.fillStyle = "rgba(22, 28, 22, 0.62)";
    ctx.fillRect(-plate.w / 2, -plate.h / 2, plate.w, plate.h);
    ctx.strokeStyle = "rgba(125, 145, 120, 0.12)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-plate.w / 2, -plate.h / 2, plate.w, plate.h);
    ctx.strokeStyle = "rgba(130, 150, 125, 0.08)";
    ctx.lineWidth = 1;
    ctx.strokeRect(-plate.w / 2 + 6, -plate.h / 2 + 6, plate.w - 12, plate.h - 12);

    ctx.fillStyle = "rgba(160, 175, 150, 0.12)";
    for (const sx of [-plate.w / 2 + 9, plate.w / 2 - 9]) {
      for (const sy of [-plate.h / 2 + 9, plate.h / 2 - 9]) {
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, TAU);
        ctx.fill();
      }
    }

    if (plate.hazard) {
      ctx.strokeStyle = "rgba(232, 161, 60, 0.2)";
      ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(-plate.w / 2 + 8 + i * 9, -plate.h / 2 + 7);
        ctx.lineTo(-plate.w / 2 + 15 + i * 9, -plate.h / 2 + 14);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

function drawCracks() {
  for (const crack of decor.cracks) {
    if (crack.x < camera.x - 80 || crack.y < camera.y - 80 || crack.x > camera.x + vw + 80 || crack.y > camera.y + vh + 80) continue;
    ctx.save();
    ctx.translate(crack.x, crack.y);
    ctx.strokeStyle = `rgba(2, 4, 2, ${crack.alpha})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    crack.points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    ctx.strokeStyle = "rgba(150, 165, 145, 0.05)";
    ctx.lineWidth = 0.8;
    ctx.translate(1, 1);
    ctx.stroke();
    ctx.restore();
  }
}

function drawConveyors() {
  for (const conveyor of decor.conveyors) {
    const length = conveyor.w;
    const width = conveyor.h;
    const span = conveyor.vertical ? length : length;
    if (conveyor.x + span < camera.x - 80 || conveyor.y + span < camera.y - 80 || conveyor.x - 80 > camera.x + vw + 80 || conveyor.y - 80 > camera.y + vh + 80) continue;

    ctx.save();
    ctx.translate(conveyor.x, conveyor.y);
    if (conveyor.vertical) ctx.rotate(Math.PI / 2);

    ctx.fillStyle = "#0d120e";
    ctx.fillRect(0, 0, length, width);
    ctx.strokeStyle = "rgba(100, 118, 98, 0.28)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, length, width);
    ctx.fillStyle = "#1b221b";
    ctx.fillRect(0, 0, length, 4);
    ctx.fillRect(0, width - 4, length, 4);

    ctx.save();
    ctx.beginPath();
    ctx.rect(3, 5, length - 6, width - 10);
    ctx.clip();
    const offset = (ambientTime * conveyor.speed * conveyor.dir) % 24;
    ctx.strokeStyle = "rgba(128, 146, 124, 0.18)";
    ctx.lineWidth = 2;
    for (let x = -26 + offset; x < length + 26; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 5);
      ctx.lineTo(x + 10, width - 5);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(232, 161, 60, 0.16)";
    ctx.lineWidth = 1.5;
    for (let x = 40; x < length - 20; x += 95) {
      ctx.beginPath();
      ctx.moveTo(x, width / 2 - 4);
      ctx.lineTo(x + 7, width / 2);
      ctx.lineTo(x, width / 2 + 4);
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = "rgba(232, 161, 60, 0.28)";
    ctx.fillRect(length - 3, width / 2 - 3, 3, 6);
    ctx.restore();
  }
}

function drawVents() {
  for (const vent of decor.vents) {
    if (vent.x < camera.x - 50 || vent.y < camera.y - 50 || vent.x > camera.x + vw + 50 || vent.y > camera.y + vh + 50) continue;
    ctx.save();
    ctx.translate(vent.x, vent.y);
    ctx.rotate(vent.rot);
    ctx.fillStyle = "rgba(5, 8, 5, 0.55)";
    ctx.fillRect(-vent.w / 2, -vent.h / 2, vent.w, vent.h);
    ctx.strokeStyle = "rgba(125, 142, 120, 0.2)";
    ctx.lineWidth = 1;
    ctx.strokeRect(-vent.w / 2, -vent.h / 2, vent.w, vent.h);
    for (let y = -vent.h / 2 + 3; y < vent.h / 2 - 2; y += 4) {
      ctx.beginPath();
      ctx.moveTo(-vent.w / 2 + 3, y);
      ctx.lineTo(vent.w / 2 - 3, y);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawPipes() {
  for (const pipe of decor.pipes) {
    const minX = Math.min(pipe.x1, pipe.x2) - 20;
    const maxX = Math.max(pipe.x1, pipe.x2) + 20;
    const minY = Math.min(pipe.y1, pipe.y2) - 20;
    const maxY = Math.max(pipe.y1, pipe.y2) + 20;
    if (maxX < camera.x || maxY < camera.y || minX > camera.x + vw || minY > camera.y + vh) continue;

    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    ctx.lineWidth = 17;
    ctx.beginPath();
    ctx.moveTo(pipe.x1 + 3, pipe.y1 + 4);
    ctx.lineTo(pipe.x2 + 3, pipe.y2 + 4);
    ctx.stroke();

    ctx.strokeStyle = "#272d25";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(pipe.x1, pipe.y1);
    ctx.lineTo(pipe.x2, pipe.y2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(165, 175, 150, 0.12)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pipe.x1, pipe.y1 - 2);
    ctx.lineTo(pipe.x2, pipe.y2 - 2);
    ctx.stroke();

    const length = Math.hypot(pipe.x2 - pipe.x1, pipe.y2 - pipe.y1);
    const joints = Math.max(2, Math.floor(length / 120));
    for (let i = 0; i <= joints; i++) {
      const t = i / joints;
      const x = pipe.x1 + (pipe.x2 - pipe.x1) * t;
      const y = pipe.y1 + (pipe.y2 - pipe.y1) * t;
      ctx.fillStyle = "#30382e";
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(170, 180, 155, 0.18)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#151a15";
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, TAU);
      ctx.fill();
    }

    const flow = (Math.sin(ambientTime * 1.4 + pipe.phase) + 1) / 2;
    const fx = pipe.x1 + (pipe.x2 - pipe.x1) * flow;
    const fy = pipe.y1 + (pipe.y2 - pipe.y1) * flow;
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(232, 161, 60, 0.5)";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#e8a13c";
    ctx.beginPath();
    ctx.arc(fx, fy, 2.2, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

function drawCrates() {
  for (const crate of decor.crates) {
    const s = crate.size;
    if (crate.x < camera.x - 70 || crate.y < camera.y - 70 || crate.x > camera.x + vw + 70 || crate.y > camera.y + vh + 70) continue;
    ctx.save();
    ctx.translate(crate.x, crate.y);
    ctx.rotate(crate.rot);
    ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
    ctx.fillRect(-s / 2 + 4, -s / 2 + 5, s, s);
    ctx.fillStyle = "#272a1f";
    ctx.strokeStyle = "#4e4e38";
    ctx.lineWidth = 1.5;
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.strokeRect(-s / 2, -s / 2, s, s);
    ctx.strokeStyle = "rgba(145, 128, 83, 0.32)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-s / 2 + 4, -s / 2 + 4);
    ctx.lineTo(s / 2 - 4, s / 2 - 4);
    ctx.moveTo(s / 2 - 4, -s / 2 + 4);
    ctx.lineTo(-s / 2 + 4, s / 2 - 4);
    ctx.stroke();
    ctx.fillStyle = "rgba(232, 161, 60, 0.45)";
    if (crate.hazard) {
      ctx.fillRect(-s / 2 + 4, -s / 2 + 4, s - 8, 2);
    } else {
      ctx.fillRect(-2, -2, 4, 4);
    }
    ctx.restore();
  }
}

function drawBarrels() {
  for (const barrel of decor.barrels) {
    if (barrel.x < camera.x - 40 || barrel.y < camera.y - 40 || barrel.x > camera.x + vw + 40 || barrel.y > camera.y + vh + 40) continue;
    ctx.save();
    ctx.translate(barrel.x, barrel.y);
    ctx.rotate(barrel.rot);
    ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
    ctx.beginPath();
    ctx.ellipse(3, 4, barrel.r + 2, barrel.r * 0.75, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = barrel.color;
    ctx.strokeStyle = "#28251b";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, barrel.r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(185, 165, 120, 0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, barrel.r - 3, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = "rgba(20, 24, 18, 0.5)";
    ctx.beginPath();
    ctx.arc(-1, -1, 2.5, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(232, 161, 60, 0.32)";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-barrel.r * 0.5, barrel.r * 0.25);
    ctx.lineTo(barrel.r * 0.5, barrel.r * 0.25);
    ctx.stroke();
    ctx.restore();
  }
}

function drawLamps() {
  for (const lamp of decor.lamps) {
    if (lamp.x + lamp.radius < camera.x || lamp.y + lamp.radius < camera.y || lamp.x - lamp.radius > camera.x + vw || lamp.y - lamp.radius > camera.y + vh) continue;
    const flicker = 0.82 + Math.sin(ambientTime * 6 + lamp.phase) * 0.09 + Math.sin(ambientTime * 17 + lamp.phase) * 0.03;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(lamp.x, lamp.y, 3, lamp.x, lamp.y, lamp.radius);
    glow.addColorStop(0, `rgba(255, 176, 72, ${0.14 * flicker})`);
    glow.addColorStop(0.4, `rgba(232, 161, 60, ${0.05 * flicker})`);
    glow.addColorStop(1, "rgba(232, 161, 60, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, lamp.radius, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#1c211a";
    ctx.strokeStyle = "rgba(150, 160, 135, 0.28)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 6, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffc15c";
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#ffb24f";
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 2.4, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function drawEmbers() {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const ember of decor.embers) {
    const x = ember.x + Math.sin(ambientTime * ember.speed + ember.phase) * ember.drift;
    const y = ember.y + Math.cos(ambientTime * ember.speed * 0.7 + ember.phase) * ember.drift * 0.45;
    if (x < camera.x - 20 || y < camera.y - 20 || x > camera.x + vw + 20 || y > camera.y + vh + 20) continue;
    const alpha = 0.18 + Math.sin(ambientTime * 2.2 + ember.phase) * 0.12;
    ctx.fillStyle = `rgba(255, 160, 62, ${Math.max(0.03, alpha)})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.2, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawWorldBorder() {
  ctx.save();
  ctx.strokeStyle = "rgba(232, 161, 60, 0.12)";
  ctx.lineWidth = 10;
  ctx.setLineDash([30, 22]);
  ctx.lineDashOffset = -ambientTime * 18;
  ctx.strokeRect(10, 10, WORLD.w - 20, WORLD.h - 20);
  ctx.strokeStyle = "rgba(160, 175, 150, 0.07)";
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.strokeRect(20, 20, WORLD.w - 40, WORLD.h - 40);
  ctx.restore();
}

function drawPickups() {
  for (const pickup of pickups) {
    if (pickup.x < camera.x - 90 || pickup.y < camera.y - 110 || pickup.x > camera.x + vw + 90 || pickup.y > camera.y + vh + 90) continue;
    const blink = pickup.life < 5 ? 0.45 + Math.sin(ambientTime * 12) * 0.3 : 1;

    if (pickup.kind === "coin") {
      const y = pickup.y + Math.sin(pickup.bob) * 2;
      ctx.save();
      ctx.globalAlpha = blink;
      ctx.translate(pickup.x, y);
      ctx.rotate(ambientTime * 2.2 + pickup.bob);
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#e8a13c";
      ctx.fillStyle = "#a96c23";
      ctx.strokeStyle = "#ffd27a";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-7, 0);
      ctx.lineTo(0, -7);
      ctx.lineTo(7, 0);
      ctx.lineTo(0, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#f0b14e";
      ctx.beginPath();
      ctx.arc(0, 0, 2.2, 0, TAU);
      ctx.fill();
      ctx.restore();
    } else if (pickup.kind === "medkit") {
      const y = pickup.y + Math.sin(pickup.bob) * 3;
      ctx.save();
      ctx.globalAlpha = blink;
      ctx.translate(pickup.x, y);
      ctx.rotate(Math.sin(pickup.bob * 0.6) * 0.12);
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#a6c36b";
      ctx.fillStyle = "#20271c";
      ctx.strokeStyle = "#a6c36b";
      ctx.lineWidth = 1.5;
      ctx.fillRect(-8, -8, 16, 16);
      ctx.strokeRect(-8, -8, 16, 16);
      ctx.fillStyle = "#b7d17d";
      ctx.fillRect(-1.5, -5, 3, 10);
      ctx.fillRect(-5, -1.5, 10, 3);
      ctx.restore();
    } else if (pickup.kind === "weapon") {
      const weapon = pickup.weapon;
      const y = pickup.y + Math.sin(pickup.bob) * 4;
      ctx.save();
      ctx.globalAlpha = blink;

      ctx.globalCompositeOperation = "lighter";
      const beam = ctx.createLinearGradient(pickup.x, y - 80, pickup.x, y + 12);
      beam.addColorStop(0, hexToRgba(weapon.rarityColor, 0));
      beam.addColorStop(0.62, hexToRgba(weapon.rarityColor, 0.22));
      beam.addColorStop(1, hexToRgba(weapon.rarityColor, 0.02));
      ctx.fillStyle = beam;
      ctx.fillRect(pickup.x - 13, y - 80, 26, 92);
      ctx.globalCompositeOperation = "source-over";

      const glow = ctx.createRadialGradient(pickup.x, y + 5, 2, pickup.x, y + 5, 32);
      glow.addColorStop(0, hexToRgba(weapon.rarityColor, 0.28));
      glow.addColorStop(1, hexToRgba(weapon.rarityColor, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(pickup.x, y + 5, 32, 0, TAU);
      ctx.fill();

      ctx.fillStyle = "#1a1f18";
      ctx.strokeStyle = weapon.rarityColor;
      ctx.lineWidth = 1.2;
      roundedRectPath(ctx, pickup.x - 17, y + 9, 34, 9, 2);
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.translate(pickup.x, y - 13);
      ctx.scale(0.85, 0.85);
      drawWeaponGlyph(ctx, weapon.template, weapon.color, weapon.rarityColor);
      ctx.restore();

      ctx.fillStyle = weapon.rarityColor;
      ctx.font = '700 9px "Cascadia Mono", "DejaVu Sans Mono", monospace';
      ctx.textAlign = "center";
      ctx.shadowBlur = 6;
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.fillText(weapon.name, pickup.x, y - 54);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }
}

function drawProjectiles() {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const projectile of projectiles) {
    if (projectile.x < camera.x - 40 || projectile.y < camera.y - 40 || projectile.x > camera.x + vw + 40 || projectile.y > camera.y + vh + 40) continue;
    const trailX = projectile.x - projectile.vx * 0.024;
    const trailY = projectile.y - projectile.vy * 0.024;
    ctx.strokeStyle = projectile.color;
    ctx.lineWidth = projectile.hostile ? 4 : 2.8;
    ctx.shadowBlur = 10;
    ctx.shadowColor = projectile.color;
    ctx.beginPath();
    ctx.moveTo(trailX, trailY);
    ctx.lineTo(projectile.x, projectile.y);
    ctx.stroke();
    ctx.fillStyle = projectile.hostile ? "#ffd0bd" : "#ffffff";
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.hostile ? 2.7 : 2, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawEffects() {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const effect of effects) {
    const progress = 1 - effect.life / effect.maxLife;
    const alpha = clamp(effect.life / effect.maxLife, 0, 1);
    if (effect.kind === "swing") {
      const radius = effect.range * 0.78;
      ctx.strokeStyle = hexToRgba(effect.color, alpha * 0.72);
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, radius, effect.angle - effect.arc / 2, effect.angle + effect.arc / 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255, 245, 218, ${alpha * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, radius, effect.angle - effect.arc / 2, effect.angle + effect.arc / 2);
      ctx.stroke();
    } else if (effect.kind === "muzzle") {
      ctx.strokeStyle = hexToRgba(effect.color, alpha);
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = -1; i <= 1; i++) {
        const angle = effect.angle + i * 0.25;
        ctx.moveTo(effect.x, effect.y);
        ctx.lineTo(effect.x + Math.cos(angle) * (12 + i * 3), effect.y + Math.sin(angle) * (12 + i * 3));
      }
      ctx.stroke();
    } else if (effect.kind === "ring") {
      const radius = effect.radius + (effect.endRadius - effect.radius) * progress;
      ctx.strokeStyle = hexToRgba(effect.color, alpha * 0.8);
      ctx.lineWidth = 3 * (1 - progress) + 1;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, radius, 0, TAU);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawParticles() {
  for (const particle of particles) {
    if (particle.kind === "smoke") {
      const alpha = clamp(particle.life / particle.maxLife, 0, 1) * 0.2;
      ctx.fillStyle = hexToRgba(particle.color, alpha);
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, TAU);
      ctx.fill();
    }
  }

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  for (const particle of particles) {
    if (particle.kind === "smoke") continue;
    const alpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.strokeStyle = hexToRgba(particle.color, alpha);
    ctx.lineWidth = particle.size;
    ctx.beginPath();
    ctx.moveTo(particle.x, particle.y);
    ctx.lineTo(particle.x - particle.vx * 0.025, particle.y - particle.vy * 0.025);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFloats() {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const float of floatTexts) {
    const alpha = clamp(float.life / float.maxLife, 0, 1);
    ctx.globalAlpha = alpha;
    ctx.font = `700 ${float.size}px "Cascadia Mono", "DejaVu Sans Mono", monospace`;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.68)";
    ctx.strokeText(float.text, float.x, float.y);
    ctx.fillStyle = float.color;
    ctx.fillText(float.text, float.x, float.y);
  }
  ctx.restore();
}

function drawReticle() {
  const weapon = inventory[selectedSlot];
  const color = weapon ? weapon.rarityColor : "#d6503e";
  ctx.save();
  ctx.translate(mouse.x, mouse.y);
  ctx.strokeStyle = hexToRgba(color, 0.9);
  ctx.fillStyle = hexToRgba(color, 0.9);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-15, 0);
  ctx.lineTo(-6, 0);
  ctx.moveTo(15, 0);
  ctx.lineTo(6, 0);
  ctx.moveTo(0, -15);
  ctx.lineTo(0, -6);
  ctx.moveTo(0, 15);
  ctx.lineTo(0, 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 1.5, 0, TAU);
  ctx.fill();

  if (weapon && player.attackTimer > 0) {
    const progress = clamp(1 - player.attackTimer / weapon.cd, 0, 1);
    ctx.strokeStyle = "rgba(240, 236, 215, 0.65)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, 13, -Math.PI / 2, -Math.PI / 2 + TAU * progress);
    ctx.stroke();
  }
  ctx.restore();
}

function menuCamera(dt) {
  const targetX = clamp(WORLD.w / 2 - vw / 2 + Math.sin(ambientTime * 0.09) * 150, 0, Math.max(0, WORLD.w - vw));
  const targetY = clamp(WORLD.h / 2 - vh / 2 + Math.cos(ambientTime * 0.065) * 90, 0, Math.max(0, WORLD.h - vh));
  const smooth = Math.min(1, dt * 1.1);
  camera.x += (targetX - camera.x) * smooth;
  camera.y += (targetY - camera.y) * smooth;
}

function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  ambientTime += dt;

  if (state === "playing") {
    update(dt);
  } else if (state === "menu") {
    menuCamera(dt);
  }

  render();
  requestAnimationFrame(frame);
}

function init() {
  resize();
  decor = createDecor();
  resetGame();
  state = "menu";
  window.addEventListener("resize", resize);
  lastFrame = performance.now();
  requestAnimationFrame(frame);
}

init();
