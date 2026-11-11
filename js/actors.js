function roundedRectPath(g, x, y, w, h, r) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  g.beginPath();
  g.moveTo(x + radius, y);
  g.lineTo(x + w - radius, y);
  g.quadraticCurveTo(x + w, y, x + w, y + radius);
  g.lineTo(x + w, y + h - radius);
  g.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  g.lineTo(x + radius, y + h);
  g.quadraticCurveTo(x, y + h, x, y + h - radius);
  g.lineTo(x, y + radius);
  g.quadraticCurveTo(x, y, x + radius, y);
  g.closePath();
}

function drawWeaponGlyph(g, template, color, accent) {
  g.save();
  g.rotate(-0.55);
  g.lineCap = "round";
  g.lineJoin = "round";
  g.shadowBlur = 7;
  g.shadowColor = accent;
  const steel = "#c8ccc0";
  const dark = "#343a33";

  if (template === "pickaxe") {
    g.strokeStyle = "#8a6137";
    g.lineWidth = 4.5;
    g.beginPath();
    g.moveTo(-16, 18);
    g.lineTo(9, -9);
    g.stroke();
    g.strokeStyle = steel;
    g.lineWidth = 4.2;
    g.beginPath();
    g.moveTo(-8, -17);
    g.quadraticCurveTo(3, -25, 17, -16);
    g.stroke();
    g.strokeStyle = accent;
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(-5, -14);
    g.quadraticCurveTo(3, -20, 14, -13);
    g.stroke();
  } else if (template === "pipe") {
    g.strokeStyle = "#aab0a3";
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(-16, 18);
    g.lineTo(8, -7);
    g.stroke();
    g.beginPath();
    g.arc(13, -13, 8, 0.35, 3.9);
    g.stroke();
    g.strokeStyle = accent;
    g.lineWidth = 1.3;
    g.beginPath();
    g.arc(13, -13, 8, 0.35, 3.9);
    g.stroke();
  } else if (template === "knife") {
    g.strokeStyle = "#6b4a2a";
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(-17, 16);
    g.lineTo(-3, 3);
    g.stroke();
    g.fillStyle = steel;
    g.strokeStyle = accent;
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(-1, 2);
    g.lineTo(15, -14);
    g.lineTo(22, -9);
    g.lineTo(6, 7);
    g.closePath();
    g.fill();
    g.stroke();
  } else if (template === "sledge") {
    g.strokeStyle = "#7c5a34";
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(-17, 19);
    g.lineTo(10, -8);
    g.stroke();
    g.save();
    g.translate(13, -11);
    g.rotate(Math.PI / 4);
    g.fillStyle = "#858b80";
    g.strokeStyle = accent;
    g.lineWidth = 1.5;
    g.fillRect(-11, -7, 22, 14);
    g.strokeRect(-11, -7, 22, 14);
    g.restore();
  } else if (template === "chainsaw") {
    g.fillStyle = "#795a32";
    g.strokeStyle = "#c09a63";
    g.lineWidth = 1.4;
    roundedRectPath(g, -13, -9, 21, 18, 3);
    g.fill();
    g.stroke();
    g.strokeStyle = "#444b42";
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(-13, 0);
    g.lineTo(-20, 0);
    g.stroke();
    g.strokeStyle = steel;
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(7, -2);
    g.lineTo(27, -2);
    g.stroke();
    g.lineWidth = 1.5;
    for (let x = 9; x < 28; x += 5) {
      g.beginPath();
      g.moveTo(x, -6);
      g.lineTo(x + 2, -2);
      g.stroke();
    }
    g.fillStyle = accent;
    g.fillRect(-8, -6, 4, 4);
  } else if (template === "plasma") {
    g.strokeStyle = "#424940";
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(-17, 17);
    g.lineTo(1, 0);
    g.stroke();
    g.strokeStyle = accent;
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(1, 0);
    g.lineTo(26, -12);
    g.stroke();
    g.strokeStyle = "#e9fff9";
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(2, -1);
    g.lineTo(25, -12);
    g.stroke();
  } else if (template === "pistol") {
    g.fillStyle = "#71766a";
    g.strokeStyle = dark;
    g.lineWidth = 1.5;
    roundedRectPath(g, -10, -6, 21, 12, 2);
    g.fill();
    g.stroke();
    g.fillStyle = "#3b4038";
    roundedRectPath(g, -8, 3, 8, 14, 2);
    g.fill();
    g.strokeStyle = steel;
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(9, 0);
    g.lineTo(27, 0);
    g.stroke();
    g.strokeStyle = accent;
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(-6, -4);
    g.lineTo(6, -4);
    g.stroke();
  } else if (template === "nailgun") {
    g.fillStyle = "#65706b";
    g.strokeStyle = dark;
    g.lineWidth = 1.5;
    roundedRectPath(g, -11, -7, 20, 14, 2);
    g.fill();
    g.stroke();
    g.strokeStyle = steel;
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(8, 0);
    g.lineTo(27, 0);
    g.stroke();
    g.strokeStyle = accent;
    g.lineWidth = 2;
    g.beginPath();
    g.arc(13, 0, 4, 0, TAU);
    g.arc(18, 0, 3, 0, TAU);
    g.stroke();
    g.fillStyle = "#3a4039";
    g.fillRect(-9, 5, 7, 10);
  } else if (template === "smg") {
    g.fillStyle = "#777568";
    g.strokeStyle = dark;
    g.lineWidth = 1.5;
    roundedRectPath(g, -13, -6, 24, 12, 2);
    g.fill();
    g.stroke();
    g.fillStyle = "#3a3f37";
    roundedRectPath(g, -3, 5, 8, 14, 2);
    g.fill();
    g.strokeStyle = steel;
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(10, 0);
    g.lineTo(28, 0);
    g.stroke();
    g.beginPath();
    g.moveTo(-13, 0);
    g.lineTo(-20, 0);
    g.stroke();
    g.strokeStyle = accent;
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(-8, -3);
    g.lineTo(6, -3);
    g.stroke();
  } else if (template === "shotgun") {
    g.fillStyle = "#6b4c2f";
    g.strokeStyle = dark;
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(-18, -5);
    g.lineTo(-7, -8);
    g.lineTo(-7, 8);
    g.lineTo(-18, 5);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = "#777b6d";
    roundedRectPath(g, -8, -7, 17, 14, 2);
    g.fill();
    g.stroke();
    g.strokeStyle = steel;
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(4, -3);
    g.lineTo(29, -3);
    g.moveTo(4, 3);
    g.lineTo(29, 3);
    g.stroke();
    g.strokeStyle = accent;
    g.lineWidth = 1.3;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(9, 0);
    g.stroke();
  } else if (template === "rifle") {
    g.strokeStyle = steel;
    g.lineWidth = 3.5;
    g.beginPath();
    g.moveTo(3, 0);
    g.lineTo(31, 0);
    g.stroke();
    g.fillStyle = "#6f786f";
    g.strokeStyle = dark;
    g.lineWidth = 1.4;
    roundedRectPath(g, -11, -5, 17, 10, 2);
    g.fill();
    g.stroke();
    g.fillStyle = "#4a3d2d";
    g.beginPath();
    g.moveTo(-11, -4);
    g.lineTo(-21, -7);
    g.lineTo(-21, 7);
    g.lineTo(-11, 4);
    g.closePath();
    g.fill();
    g.stroke();
    g.strokeStyle = accent;
    g.lineWidth = 2;
    g.beginPath();
    g.arc(-2, -8, 4, 0, TAU);
    g.stroke();
    g.strokeStyle = "#343a33";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(-3, 3);
    g.lineTo(-1, 10);
    g.stroke();
  } else if (template === "arc") {
    g.fillStyle = "#5d6660";
    g.strokeStyle = dark;
    g.lineWidth = 1.5;
    roundedRectPath(g, -11, -7, 19, 14, 3);
    g.fill();
    g.stroke();
    g.strokeStyle = accent;
    g.lineWidth = 2.2;
    g.beginPath();
    g.arc(12, 0, 7, 0, TAU);
    g.stroke();
    g.beginPath();
    g.arc(20, 0, 4, 0, TAU);
    g.stroke();
    g.fillStyle = accent;
    g.beginPath();
    g.arc(23, 0, 2, 0, TAU);
    g.fill();
    g.strokeStyle = "#3b413a";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(-11, 0);
    g.lineTo(-18, 0);
    g.stroke();
  }

  g.restore();
}

function drawHeldWeapon(weapon) {
  ctx.save();
  ctx.translate(-player.recoil * 2.5, 0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowBlur = 5;
  ctx.shadowColor = weapon.rarityColor;
  const steel = "#c8ccc0";
  const accent = weapon.rarityColor;

  if (weapon.type === "melee") {
    if (weapon.template === "pickaxe") {
      ctx.strokeStyle = "#7d572f";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(26, 0);
      ctx.stroke();
      ctx.strokeStyle = steel;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(21, -10);
      ctx.quadraticCurveTo(30, 0, 21, 10);
      ctx.stroke();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(23, -7);
      ctx.quadraticCurveTo(28, 0, 23, 7);
      ctx.stroke();
    } else if (weapon.template === "knife") {
      ctx.strokeStyle = "#5b4027";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(5, 0);
      ctx.stroke();
      ctx.fillStyle = steel;
      ctx.beginPath();
      ctx.moveTo(5, -2.5);
      ctx.lineTo(29, 0);
      ctx.lineTo(5, 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (weapon.template === "pipe") {
      ctx.strokeStyle = "#aab0a3";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(23, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(26, 0, 6, -1.8, 1.8);
      ctx.stroke();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(26, 0, 6, -1.8, 1.8);
      ctx.stroke();
    } else if (weapon.template === "sledge") {
      ctx.strokeStyle = "#73512f";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(24, 0);
      ctx.stroke();
      ctx.fillStyle = "#858b80";
      ctx.fillRect(23, -8, 9, 16);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.3;
      ctx.strokeRect(23, -8, 9, 16);
    } else if (weapon.template === "chainsaw") {
      ctx.fillStyle = "#795a32";
      roundedRectPath(ctx, -1, -7, 17, 14, 3);
      ctx.fill();
      ctx.strokeStyle = "#c09a63";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.strokeStyle = steel;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(16, -1);
      ctx.lineTo(31, -1);
      ctx.stroke();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      for (let x = 18; x < 32; x += 4) {
        ctx.beginPath();
        ctx.moveTo(x, -4);
        ctx.lineTo(x + 2, -1);
        ctx.stroke();
      }
    } else if (weapon.template === "plasma") {
      ctx.strokeStyle = "#424940";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(10, 0);
      ctx.stroke();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(33, 0);
      ctx.stroke();
      ctx.strokeStyle = "#eafffa";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(11, 0);
      ctx.lineTo(32, 0);
      ctx.stroke();
    }
  } else {
    if (weapon.template === "pistol" || weapon.template === "nailgun") {
      ctx.fillStyle = "#6f7468";
      roundedRectPath(ctx, 0, -5, 15, 10, 2);
      ctx.fill();
      ctx.strokeStyle = "#343a33";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.strokeStyle = steel;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(13, 0);
      ctx.lineTo(27, 0);
      ctx.stroke();
      ctx.fillStyle = "#3a3f37";
      ctx.fillRect(1, 3, 5, 9);
      if (weapon.template === "nailgun") {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(17, 0, 3, 0, TAU);
        ctx.stroke();
      }
    } else if (weapon.template === "smg") {
      ctx.fillStyle = "#777568";
      roundedRectPath(ctx, 0, -5, 18, 10, 2);
      ctx.fill();
      ctx.strokeStyle = "#343a33";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#3a3f37";
      ctx.fillRect(5, 4, 6, 11);
      ctx.strokeStyle = steel;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(17, 0);
      ctx.lineTo(29, 0);
      ctx.stroke();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(2, -2);
      ctx.lineTo(12, -2);
      ctx.stroke();
    } else if (weapon.template === "shotgun") {
      ctx.fillStyle = "#6b4c2f";
      ctx.beginPath();
      ctx.moveTo(-4, -5);
      ctx.lineTo(3, -7);
      ctx.lineTo(3, 7);
      ctx.lineTo(-4, 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#777b6d";
      roundedRectPath(ctx, 2, -6, 14, 12, 2);
      ctx.fill();
      ctx.strokeStyle = steel;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(14, -2.5);
      ctx.lineTo(31, -2.5);
      ctx.moveTo(14, 2.5);
      ctx.lineTo(31, 2.5);
      ctx.stroke();
    } else if (weapon.template === "rifle") {
      ctx.fillStyle = "#6f786f";
      roundedRectPath(ctx, -1, -4, 16, 8, 2);
      ctx.fill();
      ctx.fillStyle = "#4a3d2d";
      ctx.beginPath();
      ctx.moveTo(-1, -3);
      ctx.lineTo(-8, -5);
      ctx.lineTo(-8, 5);
      ctx.lineTo(-1, 3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = steel;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(34, 0);
      ctx.stroke();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(6, -7, 3, 0, TAU);
      ctx.stroke();
    } else if (weapon.template === "arc") {
      ctx.fillStyle = "#5d6660";
      roundedRectPath(ctx, 0, -6, 15, 12, 3);
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(18, 0, 6, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(25, 0, 3, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(28, 0, 1.7, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawPlayer() {
  const blink = player.invuln > 0 && Math.sin(gameTime * 52) > 0;
  ctx.save();
  ctx.globalAlpha = blink ? 0.62 : 1;

  const glow = ctx.createRadialGradient(player.x, player.y, 16, player.x, player.y, 155);
  glow.addColorStop(0, "rgba(255, 178, 82, 0.055)");
  glow.addColorStop(1, "rgba(255, 178, 82, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 155, 0, TAU);
  ctx.fill();

  ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
  ctx.beginPath();
  ctx.ellipse(player.x + 4, player.y + 8, 19, 12, 0, 0, TAU);
  ctx.fill();

  ctx.translate(player.x, player.y);
  ctx.rotate(player.aim);

  const stride = player.moving ? Math.sin(player.walkPhase) * 5 : 0;
  ctx.fillStyle = "#292e28";
  roundedRectPath(ctx, -15 + stride, -12, 15, 8, 3);
  ctx.fill();
  roundedRectPath(ctx, -15 - stride, 4, 15, 8, 3);
  ctx.fill();
  ctx.fillStyle = "#6b705e";
  ctx.fillRect(-12 + stride, -10, 5, 4);
  ctx.fillRect(-12 - stride, 6, 5, 4);

  ctx.fillStyle = "#242922";
  roundedRectPath(ctx, -19, -9, 10, 18, 3);
  ctx.fill();
  ctx.strokeStyle = "#52594c";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#c58a36";
  ctx.fillRect(-17, -5, 4, 4);
  ctx.fillStyle = "#6fc4ac";
  ctx.fillRect(-17, 2, 4, 4);

  ctx.fillStyle = "#444b40";
  ctx.strokeStyle = "#818876";
  ctx.lineWidth = 1.5;
  roundedRectPath(ctx, -10, -12, 25, 24, 5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#2d332b";
  roundedRectPath(ctx, -5, -8, 15, 16, 3);
  ctx.fill();
  ctx.strokeStyle = "#5f6859";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#596151";
  ctx.beginPath();
  ctx.arc(-3, -11, 5, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-3, 11, 5, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = "#3b4138";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(5, -8);
  ctx.lineTo(13, -5);
  ctx.moveTo(5, 8);
  ctx.lineTo(15, 8);
  ctx.stroke();

  ctx.fillStyle = "#343a31";
  ctx.strokeStyle = "#7c8370";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(10, 0, 8, 0, TAU);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f0a63f";
  ctx.shadowBlur = 10;
  ctx.shadowColor = "#ffb24f";
  ctx.beginPath();
  ctx.moveTo(13, -4);
  ctx.lineTo(18, -2);
  ctx.lineTo(18, 2);
  ctx.lineTo(13, 4);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  const weapon = inventory[selectedSlot];
  if (weapon) {
    ctx.save();
    ctx.translate(15, 8);
    drawHeldWeapon(weapon);
    ctx.restore();
  } else {
    ctx.fillStyle = "#4a5144";
    ctx.beginPath();
    ctx.arc(17, 8, 4.5, 0, TAU);
    ctx.fill();
  }

  ctx.restore();
}

function drawEnemy(enemy) {
  if (enemy.x < camera.x - 90 || enemy.y < camera.y - 90 || enemy.x > camera.x + vw + 90 || enemy.y > camera.y + vh + 90) return;

  if (enemy.spawnDelay > 0) {
    const progress = 1 - enemy.spawnDelay / 0.55;
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(ambientTime * 2.4);
    ctx.strokeStyle = enemy.elite ? "rgba(230, 182, 87, 0.8)" : "rgba(224, 90, 61, 0.8)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius * (1.8 - progress * 0.8), 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = `rgba(224, 90, 61, ${0.08 + progress * 0.14})`;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius * (1.8 - progress * 0.8), 0, TAU);
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.beginPath();
  ctx.ellipse(enemy.x + 3, enemy.y + enemy.radius * 0.75, enemy.radius * 1.05, enemy.radius * 0.55, 0, 0, TAU);
  ctx.fill();

  if (enemy.elite) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(ambientTime * 0.7);
    ctx.strokeStyle = "rgba(230, 182, 87, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 7]);
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius + 8, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  ctx.translate(enemy.x, enemy.y);
  ctx.rotate(enemy.angle);
  const flash = enemy.flash > 0;
  const bodyColor = flash ? "#f6ead0" : enemy.color;

  if (enemy.type === "scav") drawScav(enemy, bodyColor);
  else if (enemy.type === "drone") drawDrone(enemy, bodyColor);
  else if (enemy.type === "stalker") drawStalker(enemy, bodyColor);
  else if (enemy.type === "gunner") drawGunner(enemy, bodyColor);
  else if (enemy.type === "brute") drawBrute(enemy, bodyColor);

  if (enemy.attackFlash > 0) {
    ctx.strokeStyle = `rgba(255, 92, 55, ${Math.min(1, enemy.attackFlash * 6)})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius + 6, -0.75, 0.75);
    ctx.stroke();
  }

  ctx.restore();

  if (enemy.hp < enemy.maxHp) {
    const width = enemy.radius * 2.5;
    const x = enemy.x - width / 2;
    const y = enemy.y - enemy.radius - 15;
    ctx.fillStyle = "rgba(4, 6, 4, 0.8)";
    ctx.fillRect(x - 1, y - 1, width + 2, 5);
    ctx.fillStyle = enemy.elite ? "#e6b657" : "#d9583f";
    ctx.fillRect(x, y, width * clamp(enemy.hp / enemy.maxHp, 0, 1), 3);
  }

  if (enemy.elite) {
    ctx.fillStyle = "#e6b657";
    ctx.beginPath();
    ctx.moveTo(enemy.x, enemy.y - enemy.radius - 23);
    ctx.lineTo(enemy.x + 4, enemy.y - enemy.radius - 19);
    ctx.lineTo(enemy.x, enemy.y - enemy.radius - 15);
    ctx.lineTo(enemy.x - 4, enemy.y - enemy.radius - 19);
    ctx.closePath();
    ctx.fill();
  }
}

function drawScav(enemy, color) {
  const stride = Math.sin(enemy.walkPhase) * 4;
  ctx.fillStyle = "#3b2c20";
  roundedRectPath(ctx, -14 + stride, -11, 15, 7, 2);
  ctx.fill();
  roundedRectPath(ctx, -14 - stride, 4, 15, 7, 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.strokeStyle = "#2d2218";
  ctx.lineWidth = 1.4;
  roundedRectPath(ctx, -10, -10, 20, 20, 3);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#5c4733";
  roundedRectPath(ctx, -8, -7, 7, 14, 2);
  ctx.fill();

  ctx.strokeStyle = "#7a5b3b";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(2, -9);
  ctx.lineTo(12, -13);
  ctx.moveTo(2, 9);
  ctx.lineTo(12, 13);
  ctx.stroke();

  ctx.fillStyle = "#5c4b3b";
  ctx.strokeStyle = "#33261c";
  ctx.beginPath();
  ctx.arc(10, 0, 6, 0, TAU);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = enemy.eye;
  ctx.shadowBlur = 8;
  ctx.shadowColor = enemy.eye;
  ctx.beginPath();
  ctx.arc(14, 0, 2.1, 0, TAU);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = "#9a8466";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(15, -13);
  ctx.lineTo(20, -16);
  ctx.moveTo(15, 13);
  ctx.lineTo(20, 16);
  ctx.stroke();
}

function drawDrone(enemy, color) {
  const hover = Math.sin(ambientTime * 6 + enemy.id) * 2.5;
  ctx.translate(0, hover);

  ctx.strokeStyle = "rgba(160, 185, 178, 0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-4, -13, 7, 0, TAU);
  ctx.arc(-4, 13, 7, 0, TAU);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.strokeStyle = "#28302c";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(-9, -10);
  ctx.lineTo(-4, 0);
  ctx.lineTo(-9, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#333b36";
  ctx.beginPath();
  ctx.arc(-3, -13, 3, 0, TAU);
  ctx.arc(-3, 13, 3, 0, TAU);
  ctx.fill();

  ctx.fillStyle = enemy.eye;
  ctx.shadowBlur = 9;
  ctx.shadowColor = enemy.eye;
  ctx.beginPath();
  ctx.arc(8, 0, 2.4, 0, TAU);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawStalker(enemy, color) {
  const sway = Math.sin(enemy.walkPhase) * 2;
  ctx.fillStyle = color;
  ctx.strokeStyle = "#292129";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(4, -7);
  ctx.lineTo(-14, -4 + sway);
  ctx.lineTo(-17, 0);
  ctx.lineTo(-14, 4 + sway);
  ctx.lineTo(4, 7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "#a49aa7";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(1, 6);
  ctx.lineTo(17, 14);
  ctx.moveTo(1, -6);
  ctx.lineTo(17, -14);
  ctx.stroke();

  ctx.fillStyle = enemy.eye;
  ctx.shadowBlur = 8;
  ctx.shadowColor = enemy.eye;
  ctx.beginPath();
  ctx.ellipse(10, 0, 3, 1.7, 0, 0, TAU);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawGunner(enemy, color) {
  ctx.strokeStyle = "#34362b";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-5, -10);
  ctx.lineTo(-14, -17);
  ctx.moveTo(-5, 10);
  ctx.lineTo(-14, 17);
  ctx.moveTo(-12, 0);
  ctx.lineTo(-20, 0);
  ctx.stroke();

  ctx.fillStyle = "#30362c";
  ctx.beginPath();
  ctx.arc(-3, 0, 14, 0, TAU);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.strokeStyle = "#2b2c22";
  ctx.lineWidth = 1.4;
  roundedRectPath(ctx, -8, -8, 17, 16, 3);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "#9aa18e";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(5, 0);
  ctx.lineTo(25, 0);
  ctx.stroke();
  ctx.strokeStyle = "#4c5143";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(5, 0);
  ctx.lineTo(25, 0);
  ctx.stroke();

  ctx.fillStyle = enemy.eye;
  ctx.shadowBlur = 9;
  ctx.shadowColor = enemy.eye;
  ctx.beginPath();
  ctx.arc(1, 0, 2.6, 0, TAU);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawBrute(enemy, color) {
  const stride = Math.sin(enemy.walkPhase) * 3;
  ctx.fillStyle = "#3a3024";
  roundedRectPath(ctx, -19 + stride, -17, 14, 12, 3);
  ctx.fill();
  roundedRectPath(ctx, -19 - stride, 5, 14, 12, 3);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.strokeStyle = "#2b241b";
  ctx.lineWidth = 2;
  roundedRectPath(ctx, -16, -17, 31, 34, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#66513d";
  ctx.beginPath();
  ctx.arc(-6, -18, 9, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-6, 18, 9, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = "#4e4434";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(7, -15);
  ctx.lineTo(18, -18);
  ctx.moveTo(7, 15);
  ctx.lineTo(18, 18);
  ctx.stroke();

  ctx.fillStyle = "#3b3126";
  ctx.strokeStyle = "#796047";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(14, 0, 8, 0, TAU);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = enemy.eye;
  ctx.shadowBlur = 12;
  ctx.shadowColor = enemy.eye;
  ctx.beginPath();
  ctx.arc(2, 0, 5, 0, TAU);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = "#c7a16a";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-13, -13);
  ctx.lineTo(-7, -7);
  ctx.moveTo(-13, 13);
  ctx.lineTo(-7, 7);
  ctx.stroke();
}
