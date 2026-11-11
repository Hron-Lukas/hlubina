function update(dt) {
  gameTime += dt;
  updatePlayer(dt);
  if (state !== "playing") return;
  updateEnemies(dt);
  updateProjectiles(dt);
  updatePickups(dt);
  updateEffects(dt);
  updateParticles(dt);
  updateFloats(dt);
  updateWave(dt);
  updateCamera(dt);
  updateInteractPrompt();
  hudTimer += dt;
  if (hudTimer > 0.07) {
    hudTimer = 0;
    updateHud();
  }
}

function updatePlayer(dt) {
  player.attackTimer = Math.max(0, player.attackTimer - dt);
  player.invuln = Math.max(0, player.invuln - dt);
  player.recoil = Math.max(0, player.recoil - dt * 8);
  camera.shake = Math.max(0, camera.shake - dt * 32);

  let mx = 0;
  let my = 0;
  if (keys.w || keys.arrowup) my -= 1;
  if (keys.s || keys.arrowdown) my += 1;
  if (keys.a || keys.arrowleft) mx -= 1;
  if (keys.d || keys.arrowright) mx += 1;
  const moving = mx !== 0 || my !== 0;
  player.moving = moving;

  if (moving) {
    const len = Math.hypot(mx, my);
    mx /= len;
    my /= len;
    const speed = playerSpeed();
    player.x += mx * speed * dt;
    player.y += my * speed * dt;
    player.walkPhase += dt * 11;
    player.dustTimer -= dt;
    if (player.dustTimer <= 0) {
      player.dustTimer = 0.16;
      addParticle(player.x - mx * 12, player.y - my * 12, {
        vx: rand(-12, 12) - mx * 18,
        vy: rand(-12, 12) - my * 18,
        life: 0.4,
        size: rand(2, 5),
        color: "#5c5f4e",
        kind: "smoke",
        drag: 4,
      });
    }
  }

  player.x = clamp(player.x, 28, WORLD.w - 28);
  player.y = clamp(player.y, 28, WORLD.h - 28);

  const aimX = mouse.x + camera.x - player.x;
  const aimY = mouse.y + camera.y - player.y;
  if (mouse.inside && Math.abs(aimX) + Math.abs(aimY) > 2) {
    player.aim = Math.atan2(aimY, aimX);
  } else if (moving) {
    player.aim = Math.atan2(my, mx);
  }

  if ((mouse.down || keys[" "]) && player.attackTimer <= 0) {
    tryAttack();
  }
}

function tryAttack() {
  const weapon = inventory[selectedSlot];
  if (!weapon) return;
  player.attackTimer = weapon.cd;
  player.recoil = 1;
  if (weapon.type === "melee") {
    meleeAttack(weapon);
  } else {
    rangedAttack(weapon);
  }
}

function meleeAttack(weapon) {
  const angle = player.aim;
  const mult = playerDamageMult();
  let hitAny = false;

  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    if (enemy.spawnDelay > 0 || enemy.dead) continue;
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const d = Math.hypot(dx, dy);
    if (d > weapon.range + enemy.radius) continue;
    const enemyAngle = Math.atan2(dy, dx);
    if (Math.abs(angleDiff(enemyAngle, angle)) > weapon.arc / 2 + Math.atan2(enemy.radius, Math.max(12, d))) continue;
    const crit = Math.random() < 0.09;
    const damage = weapon.dmg * mult * (crit ? 1.75 : 1);
    damageEnemy(enemy, damage, enemyAngle, weapon.knock, crit, weapon.rarityColor);
    hitAny = true;
  }

  effects.push({
    kind: "swing",
    x: player.x,
    y: player.y,
    angle,
    arc: weapon.arc,
    range: weapon.range,
    life: 0.18,
    maxLife: 0.18,
    color: weapon.rarity === "common" ? "#e8d6a6" : weapon.rarityColor,
  });

  for (let i = 0; i < (hitAny ? 5 : 2); i++) {
    const a = angle + rand(-weapon.arc / 2, weapon.arc / 2);
    const r = rand(weapon.range * 0.45, weapon.range * 0.9);
    addParticle(player.x + Math.cos(a) * r, player.y + Math.sin(a) * r, {
      vx: Math.cos(a) * rand(25, 90),
      vy: Math.sin(a) * rand(25, 90),
      life: rand(0.15, 0.35),
      size: rand(1, 2.5),
      color: hitAny ? "#ffd27a" : "#a29a7d",
      kind: "spark",
      drag: 5,
    });
  }

  camera.shake = Math.max(camera.shake, hitAny ? 3.2 : 1);
  sfx(hitAny ? "hit" : "swing");
}

function rangedAttack(weapon) {
  const mult = playerDamageMult();
  const muzzleX = player.x + Math.cos(player.aim) * 34;
  const muzzleY = player.y + Math.sin(player.aim) * 34;
  const count = weapon.pellets || 1;

  for (let i = 0; i < count; i++) {
    const angle = player.aim + (Math.random() * 2 - 1) * weapon.spread;
    const speed = weapon.speed;
    projectiles.push({
      x: muzzleX,
      y: muzzleY,
      prevX: muzzleX,
      prevY: muzzleY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: weapon.range / speed,
      maxLife: weapon.range / speed,
      damage: weapon.dmg * mult,
      radius: weapon.template === "shotgun" ? 3 : 4,
      color: weapon.rarityColor,
      hostile: false,
      pierce: weapon.pierce || 0,
      hitIds: new Set(),
      crit: Math.random() < 0.08,
    });
  }

  effects.push({
    kind: "muzzle",
    x: muzzleX,
    y: muzzleY,
    angle: player.aim,
    life: 0.08,
    maxLife: 0.08,
    color: weapon.rarityColor,
  });

  for (let i = 0; i < 4; i++) {
    const a = player.aim + rand(-0.25, 0.25);
    addParticle(muzzleX, muzzleY, {
      vx: Math.cos(a) * rand(60, 190),
      vy: Math.sin(a) * rand(60, 190),
      life: rand(0.08, 0.2),
      size: rand(1, 2.5),
      color: weapon.rarityColor,
      kind: "spark",
      drag: 7,
    });
  }

  camera.shake = Math.max(camera.shake, weapon.template === "shotgun" ? 5 : 1.4);
  sfx(weapon.template === "shotgun" ? "shotgun" : "shoot");
}

function damageEnemy(enemy, damage, angle, knockback, crit, color) {
  if (enemy.dead || enemy.spawnDelay > 0) return;
  enemy.hp -= damage;
  enemy.flash = 0.1;
  enemy.kx = (enemy.kx || 0) + Math.cos(angle) * knockback;
  enemy.ky = (enemy.ky || 0) + Math.sin(angle) * knockback;
  addFloatText(enemy.x + rand(-4, 4), enemy.y - enemy.radius - 8, `${crit ? "!" : ""}${Math.round(damage)}`, crit ? "#ffd166" : "#f1e7ca", crit ? 14 : 11);

  for (let i = 0; i < (crit ? 9 : 5); i++) {
    const a = angle + rand(-1.2, 1.2);
    addParticle(enemy.x, enemy.y, {
      vx: Math.cos(a) * rand(50, 190),
      vy: Math.sin(a) * rand(50, 190),
      life: rand(0.15, 0.38),
      size: rand(1, 2.8),
      color: i % 3 === 0 ? color : "#ffb45d",
      kind: "spark",
      drag: 5,
    });
  }

  if (enemy.hp <= 0) killEnemy(enemy);
}

function killEnemy(enemy) {
  if (enemy.dead) return;
  enemy.dead = true;
  const index = enemies.indexOf(enemy);
  if (index >= 0) enemies.splice(index, 1);
  kills += 1;
  camera.shake = Math.max(camera.shake, enemy.elite ? 7 : 3.5);
  sfx("kill");

  for (let i = 0; i < (enemy.elite ? 24 : 15); i++) {
    const a = rand(0, TAU);
    addParticle(enemy.x, enemy.y, {
      vx: Math.cos(a) * rand(40, 260),
      vy: Math.sin(a) * rand(40, 260),
      life: rand(0.25, 0.7),
      size: rand(1, enemy.elite ? 5 : 3.4),
      color: choose(["#ff8a42", "#e8b25c", enemy.color, "#6b3a28"]),
      kind: i % 4 === 0 ? "smoke" : "spark",
      drag: 4,
    });
  }

  effects.push({
    kind: "ring",
    x: enemy.x,
    y: enemy.y,
    radius: enemy.radius,
    endRadius: enemy.radius * 3.4,
    life: 0.35,
    maxLife: 0.35,
    color: enemy.elite ? "#e6b657" : "#e77a43",
  });

  spawnDrops(enemy);
}

function spawnDrops(enemy) {
  const coinCount = 1 + Math.floor(Math.random() * 3);
  const total = Math.max(coinCount, enemy.coins);
  let remaining = total;

  for (let i = 0; i < coinCount; i++) {
    const value = i === coinCount - 1 ? remaining : Math.max(1, Math.floor(total / coinCount));
    remaining -= value;
    const angle = rand(0, TAU);
    const force = rand(30, 110);
    pickups.push({
      kind: "coin",
      x: enemy.x + rand(-5, 5),
      y: enemy.y + rand(-5, 5),
      vx: Math.cos(angle) * force,
      vy: Math.sin(angle) * force,
      value,
      delay: 0.2,
      bob: rand(0, TAU),
      life: 24,
    });
  }

  const weaponChance = Math.min(0.58, 0.2 + player.upgrades.luck * 0.018 + waveState.number * 0.005 + (enemy.elite ? 0.12 : 0));
  if (Math.random() < weaponChance) {
    const weapon = generateWeapon(waveState.number, enemy.elite ? 1 : 0);
    spawnWeaponPickup(enemy.x + rand(-10, 10), enemy.y + rand(-10, 10), weapon, 0.45);
  }

  if (Math.random() < 0.065) {
    pickups.push({
      kind: "medkit",
      x: enemy.x + rand(-8, 8),
      y: enemy.y + rand(-8, 8),
      vx: rand(-45, 45),
      vy: rand(-45, 45),
      delay: 0.25,
      bob: rand(0, TAU),
      life: 26,
    });
  }
}

function spawnWeaponPickup(x, y, weapon, delay = 0.4, quiet = false) {
  const angle = rand(0, TAU);
  pickups.push({
    kind: "weapon",
    x: clamp(x, 40, WORLD.w - 40),
    y: clamp(y, 40, WORLD.h - 40),
    vx: Math.cos(angle) * rand(20, 75),
    vy: Math.sin(angle) * rand(20, 75),
    weapon,
    delay,
    bob: rand(0, TAU),
    life: 45,
    quiet,
  });
  effects.push({
    kind: "ring",
    x,
    y,
    radius: 8,
    endRadius: 38,
    life: 0.3,
    maxLife: 0.3,
    color: weapon.rarityColor,
  });
}

function chooseEnemyType(wave) {
  const options = [["scav", 10]];
  if (wave >= 2) options.push(["drone", 6]);
  if (wave >= 3) options.push(["stalker", 5]);
  if (wave >= 4) options.push(["gunner", 4]);
  if (wave >= 5) options.push(["brute", 3]);
  if (wave >= 8) {
    options[0][1] = 7;
    options.push(["brute", 5], ["gunner", 6], ["stalker", 7]);
  }
  const total = options.reduce((sum, option) => sum + option[1], 0);
  let roll = Math.random() * total;
  for (const option of options) {
    roll -= option[1];
    if (roll <= 0) return option[0];
  }
  return "scav";
}

function findSpawnPos() {
  for (let i = 0; i < 14; i++) {
    const angle = rand(0, TAU);
    const radius = rand(620, 850);
    const x = player.x + Math.cos(angle) * radius;
    const y = player.y + Math.sin(angle) * radius;
    if (x > 70 && x < WORLD.w - 70 && y > 70 && y < WORLD.h - 70) {
      return { x, y };
    }
  }
  return {
    x: clamp(player.x + rand(-1, 1) * 700, 70, WORLD.w - 70),
    y: clamp(player.y + rand(-1, 1) * 700, 70, WORLD.h - 70),
  };
}

function spawnEnemy(typeId, elite = false) {
  const base = ENEMY_TYPES[typeId];
  const wave = waveState.number;
  const hpScale = 1 + Math.max(0, wave - 1) * 0.17;
  const dmgScale = 1 + Math.max(0, wave - 1) * 0.09;
  const speedScale = 1 + Math.min(0.22, Math.max(0, wave - 1) * 0.014);
  const pos = findSpawnPos();
  const eliteScale = elite ? 1.7 : 1;
  const maxHp = base.hp * hpScale * eliteScale;
  const enemy = {
    id: ++enemySeq,
    type: typeId,
    name: base.name,
    x: pos.x,
    y: pos.y,
    radius: base.radius * (elite ? 1.13 : 1),
    hp: maxHp,
    maxHp,
    speed: base.speed * speedScale * (elite ? 0.94 : 1),
    dmg: base.dmg * dmgScale * (elite ? 1.2 : 1),
    coins: Math.round(rand(base.coins[0], base.coins[1]) * (1 + Math.max(0, wave - 1) * 0.08) * (elite ? 2 : 1)),
    color: base.color,
    eye: base.eye,
    elite,
    ranged: !!base.ranged,
    preferred: base.preferred || 0,
    fireCd: base.fireCd || 0,
    projSpeed: base.projSpeed || 0,
    projDmg: (base.projDmg || 0) * dmgScale,
    angle: rand(0, TAU),
    walkPhase: rand(0, TAU),
    attackTimer: rand(0.4, 1.5),
    attackFlash: 0,
    flash: 0,
    spawnDelay: 0.55,
    kx: 0,
    ky: 0,
    dead: false,
  };
  enemies.push(enemy);

  effects.push({
    kind: "ring",
    x: enemy.x,
    y: enemy.y,
    radius: enemy.radius * 0.5,
    endRadius: enemy.radius * 3,
    life: 0.55,
    maxLife: 0.55,
    color: elite ? "#e6b657" : "#e05a3d",
  });

  for (let i = 0; i < 12; i++) {
    const a = rand(0, TAU);
    addParticle(enemy.x, enemy.y, {
      vx: Math.cos(a) * rand(25, 100),
      vy: Math.sin(a) * rand(25, 100),
      life: rand(0.3, 0.7),
      size: rand(1, 3),
      color: elite ? "#e6b657" : "#d85b3b",
      kind: "spark",
      drag: 4,
    });
  }
}

function updateEnemies(dt) {
  for (const enemy of enemies) {
    enemy.flash = Math.max(0, enemy.flash - dt);
    enemy.attackFlash = Math.max(0, (enemy.attackFlash || 0) - dt);
    enemy.attackTimer = Math.max(0, (enemy.attackTimer || 0) - dt);
    enemy.walkPhase = (enemy.walkPhase || 0) + dt * enemy.speed * 0.08;
    enemy.kx = (enemy.kx || 0) * Math.pow(0.0015, dt);
    enemy.ky = (enemy.ky || 0) * Math.pow(0.0015, dt);
    enemy.x += (enemy.kx || 0) * dt;
    enemy.y += (enemy.ky || 0) * dt;

    if (enemy.spawnDelay > 0) {
      enemy.spawnDelay -= dt;
      continue;
    }

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const d = Math.hypot(dx, dy) || 1;
    const nx = dx / d;
    const ny = dy / d;
    enemy.angle = Math.atan2(dy, dx);

    let moveX = 0;
    let moveY = 0;

    if (enemy.ranged) {
      if (d > enemy.preferred + 45) {
        moveX = nx;
        moveY = ny;
      } else if (d < enemy.preferred - 70) {
        moveX = -nx;
        moveY = -ny;
      } else {
        const side = enemy.id % 2 === 0 ? 1 : -1;
        moveX = -ny * side * 0.7;
        moveY = nx * side * 0.7;
      }
      if (d < enemy.preferred + 180 && enemy.attackTimer <= 0) {
        enemyShoot(enemy);
        enemy.attackTimer = enemy.fireCd * rand(0.85, 1.2);
      }
    } else {
      moveX = nx;
      moveY = ny;
      if (d < enemy.radius + player.radius + 8 && enemy.attackTimer <= 0) {
        hurtPlayer(enemy.dmg, enemy.angle);
        enemy.attackTimer = 1.05;
        enemy.attackFlash = 0.18;
      }
    }

    const strafe = Math.sin(ambientTime * 1.8 + enemy.id) * 0.16;
    enemy.x += (moveX - ny * strafe) * enemy.speed * dt;
    enemy.y += (moveY + nx * strafe) * enemy.speed * dt;
    enemy.x = clamp(enemy.x, 30, WORLD.w - 30);
    enemy.y = clamp(enemy.y, 30, WORLD.h - 30);
  }

  for (let i = 0; i < enemies.length; i++) {
    const a = enemies[i];
    if (a.spawnDelay > 0) continue;
    for (let j = i + 1; j < enemies.length; j++) {
      const b = enemies[j];
      if (b.spawnDelay > 0) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const minDist = a.radius + b.radius;
      const d = Math.hypot(dx, dy);
      if (d > 0 && d < minDist) {
        const push = ((minDist - d) / d) * 0.5;
        a.x -= dx * push;
        a.y -= dy * push;
        b.x += dx * push;
        b.y += dy * push;
      }
    }
    const pdx = player.x - a.x;
    const pdy = player.y - a.y;
    const pd = Math.hypot(pdx, pdy);
    const minPlayer = a.radius + player.radius - 2;
    if (pd > 0 && pd < minPlayer) {
      const push = (minPlayer - pd) / pd;
      a.x -= pdx * push * 0.5;
      a.y -= pdy * push * 0.5;
    }
    a.x = clamp(a.x, 30, WORLD.w - 30);
    a.y = clamp(a.y, 30, WORLD.h - 30);
  }
}

function enemyShoot(enemy) {
  const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
  const finalAngle = angle + rand(-0.07, 0.07);
  const speed = enemy.projSpeed;
  projectiles.push({
    x: enemy.x + Math.cos(finalAngle) * (enemy.radius + 5),
    y: enemy.y + Math.sin(finalAngle) * (enemy.radius + 5),
    prevX: enemy.x,
    prevY: enemy.y,
    vx: Math.cos(finalAngle) * speed,
    vy: Math.sin(finalAngle) * speed,
    life: 2.2,
    maxLife: 2.2,
    damage: enemy.projDmg,
    radius: 5,
    color: "#ff633f",
    hostile: true,
    pierce: 0,
    hitIds: new Set(),
  });
  enemy.attackFlash = 0.18;
  effects.push({
    kind: "muzzle",
    x: enemy.x + Math.cos(finalAngle) * (enemy.radius + 6),
    y: enemy.y + Math.sin(finalAngle) * (enemy.radius + 6),
    angle: finalAngle,
    life: 0.09,
    maxLife: 0.09,
    color: "#ff633f",
  });
}

function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const projectile = projectiles[i];
    projectile.prevX = projectile.x;
    projectile.prevY = projectile.y;
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.life -= dt;

    let remove = projectile.life <= 0;
    if (projectile.x < 0 || projectile.y < 0 || projectile.x > WORLD.w || projectile.y > WORLD.h) remove = true;

    if (!remove && projectile.hostile) {
      if (segmentCircle(projectile.prevX, projectile.prevY, projectile.x, projectile.y, player.x, player.y, player.radius + projectile.radius)) {
        hurtPlayer(projectile.damage, Math.atan2(projectile.vy, projectile.vx));
        for (let j = 0; j < 6; j++) {
          const a = Math.atan2(projectile.vy, projectile.vx) + rand(-1, 1);
          addParticle(projectile.x, projectile.y, {
            vx: Math.cos(a) * rand(30, 130),
            vy: Math.sin(a) * rand(30, 130),
            life: rand(0.15, 0.35),
            size: rand(1, 2.8),
            color: "#ff7a4d",
            kind: "spark",
            drag: 5,
          });
        }
        remove = true;
      }
    } else if (!remove) {
      for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j];
        if (enemy.spawnDelay > 0 || projectile.hitIds.has(enemy.id)) continue;
        if (segmentCircle(projectile.prevX, projectile.prevY, projectile.x, projectile.y, enemy.x, enemy.y, enemy.radius + projectile.radius)) {
          projectile.hitIds.add(enemy.id);
          const damage = projectile.damage * (projectile.crit ? 1.75 : 1);
          damageEnemy(enemy, damage, Math.atan2(projectile.vy, projectile.vx), 90, projectile.crit, projectile.color);
          if (projectile.pierce > 0) {
            projectile.pierce -= 1;
          } else {
            remove = true;
            break;
          }
        }
      }
    }

    if (remove) projectiles.splice(i, 1);
  }
}

function hurtPlayer(amount, angle) {
  if (state !== "playing" || player.invuln > 0) return;
  const reduced = amount * (1 - playerArmor());
  player.hp -= reduced;
  player.invuln = 0.32;
  camera.shake = Math.max(camera.shake, 8);
  flashDamage();
  sfx("hurt");
  addFloatText(player.x, player.y - 30, `-${Math.round(reduced)}`, "#ff7d67", 13);

  for (let i = 0; i < 12; i++) {
    const a = angle + Math.PI + rand(-1.1, 1.1);
    addParticle(player.x, player.y, {
      vx: Math.cos(a) * rand(40, 170),
      vy: Math.sin(a) * rand(40, 170),
      life: rand(0.2, 0.5),
      size: rand(1, 3.5),
      color: choose(["#ff6b4a", "#d64b39", "#ffd166"]),
      kind: "spark",
      drag: 5,
    });
  }

  if (player.hp <= 0) {
    player.hp = 0;
    endGame();
  }
}

function pickupWeapon(pickup, index) {
  const weapon = pickup.weapon;
  const empty = inventory.indexOf(null);
  if (empty >= 0) {
    inventory[empty] = weapon;
    if (!inventory[selectedSlot]) selectedSlot = empty;
    removePickup(pickup);
    toast(`${weapon.rarityName}: ${weapon.name}`, ["epic", "legendary"].includes(weapon.rarity) ? "rare" : "good");
    sfx("pickup");
    renderHotbar();
    return true;
  }
  if (index !== undefined && index >= 0) {
    const old = inventory[index];
    inventory[index] = weapon;
    removePickup(pickup);
    if (old) spawnWeaponPickup(player.x + rand(-28, 28), player.y + rand(-28, 28), old, 1.1);
    toast(`Vyměněno: ${old ? old.name : "prázdný slot"} → ${weapon.name}`, ["epic", "legendary"].includes(weapon.rarity) ? "rare" : "");
    sfx("pickup");
    renderHotbar();
    return true;
  }
  return false;
}

function removePickup(pickup) {
  const index = pickups.indexOf(pickup);
  if (index >= 0) pickups.splice(index, 1);
  if (nearWeapon === pickup) nearWeapon = null;
}

function updatePickups(dt) {
  for (let i = pickups.length - 1; i >= 0; i--) {
    const pickup = pickups[i];
    pickup.life -= dt;
    pickup.delay = Math.max(0, pickup.delay - dt);
    pickup.bob += dt * 2.4;
    pickup.x += pickup.vx * dt;
    pickup.y += pickup.vy * dt;
    const friction = Math.max(0, 1 - dt * 4);
    pickup.vx *= friction;
    pickup.vy *= friction;
    pickup.x = clamp(pickup.x, 24, WORLD.w - 24);
    pickup.y = clamp(pickup.y, 24, WORLD.h - 24);

    if (pickup.life <= 0) {
      pickups.splice(i, 1);
      if (nearWeapon === pickup) nearWeapon = null;
      continue;
    }

    const dx = player.x - pickup.x;
    const dy = player.y - pickup.y;
    const d = Math.hypot(dx, dy) || 1;

    if (pickup.kind === "coin") {
      const magnet = playerMagnet();
      if (pickup.delay <= 0 && d < magnet) {
        const pull = clamp(1 - d / magnet, 0.15, 1);
        pickup.vx += (dx / d) * 1100 * pull * dt;
        pickup.vy += (dy / d) * 1100 * pull * dt;
      }
      if (d < 20) {
        earnMoney(pickup.value);
        addFloatText(player.x + rand(-8, 8), player.y - 28, `+${pickup.value}`, "#ffc35f", 11);
        sfx("coin");
        pickups.splice(i, 1);
        continue;
      }
    } else if (pickup.kind === "medkit") {
      const magnet = playerMagnet() * 0.7;
      if (pickup.delay <= 0 && d < magnet) {
        pickup.vx += (dx / d) * 900 * dt;
        pickup.vy += (dy / d) * 900 * dt;
      }
      if (d < 25) {
        const before = player.hp;
        player.hp = Math.min(player.maxHp, player.hp + 30);
        addFloatText(player.x, player.y - 30, `+${Math.round(player.hp - before)} HP`, "#a6c36b", 12);
        sfx("pickup");
        pickups.splice(i, 1);
        continue;
      }
    } else if (pickup.kind === "weapon") {
      if (pickup.delay <= 0 && d < 30 && inventory.includes(null)) {
        pickupWeapon(pickup);
        continue;
      }
    }
  }
}

function updateEffects(dt) {
  for (let i = effects.length - 1; i >= 0; i--) {
    effects[i].life -= dt;
    if (effects[i].life <= 0) effects.splice(i, 1);
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    particle.life -= dt;
    if (particle.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    const damping = Math.max(0, 1 - particle.drag * dt);
    particle.vx *= damping;
    particle.vy *= damping;
    if (particle.kind === "smoke") {
      particle.size += dt * 7;
      particle.vy -= dt * 5;
    }
  }
}

function updateFloats(dt) {
  for (let i = floatTexts.length - 1; i >= 0; i--) {
    const float = floatTexts[i];
    float.life -= dt;
    float.y -= dt * 28;
    if (float.life <= 0) floatTexts.splice(i, 1);
  }
}

function updateWave(dt) {
  if (waveState.active) {
    if (waveState.toSpawn > 0) {
      waveState.spawnTimer -= dt;
      if (waveState.spawnTimer <= 0) {
        const eliteChance = Math.min(0.22, 0.02 + waveState.number * 0.012);
        spawnEnemy(chooseEnemyType(waveState.number), Math.random() < eliteChance);
        waveState.toSpawn -= 1;
        waveState.spawnTimer = waveState.spawnInterval;
      }
    } else if (enemies.length === 0) {
      completeWave();
    }
  } else if (waveState.breakTimer > 0) {
    waveState.breakTimer -= dt;
    if (waveState.breakTimer <= 0) startWave(waveState.number + 1);
  }
}

function updateCamera(dt) {
  const targetX = clamp(player.x - vw / 2, 0, Math.max(0, WORLD.w - vw));
  const targetY = clamp(player.y - vh / 2, 0, Math.max(0, WORLD.h - vh));
  const smooth = Math.min(1, dt * 8);
  camera.x += (targetX - camera.x) * smooth;
  camera.y += (targetY - camera.y) * smooth;
}

function getNearbyWeapon() {
  let nearest = null;
  let best = 64;
  for (const pickup of pickups) {
    if (pickup.kind !== "weapon" || pickup.delay > 0) continue;
    const d = Math.hypot(player.x - pickup.x, player.y - pickup.y);
    if (d < best) {
      best = d;
      nearest = pickup;
    }
  }
  return nearest;
}

function updateInteractPrompt() {
  if (state !== "playing") {
    ui.interactPrompt.classList.remove("show");
    return;
  }
  nearWeapon = getNearbyWeapon();
  if (!nearWeapon) {
    ui.interactPrompt.classList.remove("show");
    return;
  }
  const empty = inventory.indexOf(null);
  if (empty >= 0) {
    ui.interactPrompt.innerHTML = `<kbd>E</kbd> SEBRAT <span style="color:${nearWeapon.weapon.rarityColor}">${nearWeapon.weapon.name}</span>`;
  } else {
    const current = inventory[selectedSlot];
    ui.interactPrompt.innerHTML = `<kbd>E</kbd> VYMĚNIT ${current ? current.name : "slot"} → <span style="color:${nearWeapon.weapon.rarityColor}">${nearWeapon.weapon.name}</span>`;
  }
  ui.interactPrompt.classList.add("show");
}

function interact() {
  if (state !== "playing") return;
  const pickup = getNearbyWeapon();
  if (!pickup) return;
  const empty = inventory.indexOf(null);
  if (empty >= 0) {
    pickupWeapon(pickup);
  } else {
    pickupWeapon(pickup, selectedSlot);
  }
}
