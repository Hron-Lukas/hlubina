use macroquad::prelude::*;
use std::cell::RefCell;

const WORLD_W: f32 = 2800.0;
const WORLD_H: f32 = 2100.0;
const MAX_SLOTS: usize = 5;
const AMBER: Color = Color::new(0.91, 0.63, 0.24, 1.0);

thread_local! {
    static UI_FONT: RefCell<Option<Font>> = const { RefCell::new(None) };
}

#[derive(Clone, Copy, PartialEq)]
enum Mode {
    Menu,
    Playing,
    Shop,
    Paused,
    GameOver,
}

#[derive(Clone, Copy, PartialEq)]
enum WeaponKind {
    Melee,
    Ranged,
}

#[derive(Clone)]
struct Weapon {
    name: &'static str,
    kind: WeaponKind,
    damage: f32,
    cooldown: f32,
    range: f32,
    spread: f32,
    projectiles: usize,
    pierce: i32,
    quality: usize,
}

impl Weapon {
    fn color(&self) -> Color {
        [
            Color::new(0.55, 0.61, 0.55, 1.),
            GREEN,
            SKYBLUE,
            VIOLET,
            GOLD,
        ][self.quality]
    }
    fn scaled_damage(&self) -> f32 {
        self.damage * [1.0, 1.2, 1.48, 1.85, 2.35][self.quality]
    }
}

#[derive(Clone, Copy)]
struct Enemy {
    pos: Vec2,
    vel: Vec2,
    hp: f32,
    max_hp: f32,
    radius: f32,
    speed: f32,
    damage: f32,
    elite: bool,
    shoot_timer: f32,
    kind: usize,
}

#[derive(Clone, Copy)]
struct Bullet {
    pos: Vec2,
    vel: Vec2,
    damage: f32,
    life: f32,
    pierce: i32,
    from_player: bool,
}

#[derive(Clone, Copy)]
enum DropKind {
    Scrap,
    Medkit,
    Weapon,
}

#[derive(Clone)]
struct Drop {
    pos: Vec2,
    kind: DropKind,
    value: i32,
    weapon: Option<Weapon>,
    life: f32,
}

struct Game {
    mode: Mode,
    player: Vec2,
    hp: f32,
    max_hp: f32,
    money: i32,
    wave: i32,
    kills: i32,
    wave_left: i32,
    spawn_timer: f32,
    intermission: f32,
    attack_timer: f32,
    invuln: f32,
    aim: Vec2,
    slots: [Option<Weapon>; MAX_SLOTS],
    active: usize,
    enemies: Vec<Enemy>,
    bullets: Vec<Bullet>,
    drops: Vec<Drop>,
    upgrades: [i32; 6],
    elapsed: f32,
}

impl Game {
    fn new() -> Self {
        let mut slots: [Option<Weapon>; MAX_SLOTS] = [None, None, None, None, None];
        slots[0] = Some(Weapon {
            name: "KRUMPÁČ",
            kind: WeaponKind::Melee,
            damage: 18.,
            cooldown: 0.42,
            range: 64.,
            spread: 1.45,
            projectiles: 0,
            pierce: 0,
            quality: 0,
        });
        Self {
            mode: Mode::Menu,
            player: vec2(WORLD_W / 2., WORLD_H / 2.),
            hp: 100.,
            max_hp: 100.,
            money: 0,
            wave: 0,
            kills: 0,
            wave_left: 0,
            spawn_timer: 0.,
            intermission: 0.,
            attack_timer: 0.,
            invuln: 0.,
            aim: vec2(1., 0.),
            slots,
            active: 0,
            enemies: vec![],
            bullets: vec![],
            drops: vec![],
            upgrades: [0; 6],
            elapsed: 0.,
        }
    }

    fn reset(&mut self) {
        *self = Self::new();
        self.mode = Mode::Playing;
        self.start_wave();
    }

    fn start_wave(&mut self) {
        self.wave += 1;
        self.wave_left = 5 + self.wave * 2;
        self.spawn_timer = 0.4;
        self.intermission = 0.;
    }

    fn active_weapon(&self) -> Option<&Weapon> {
        self.slots[self.active].as_ref()
    }

    fn spawn_enemy(&mut self) {
        if self.wave_left <= 0 {
            return;
        }
        let angle = rand::gen_range(0., std::f32::consts::TAU);
        let distance = rand::gen_range(620., 850.);
        let mut pos = self.player + vec2(angle.cos(), angle.sin()) * distance;
        pos.x = pos.x.clamp(40., WORLD_W - 40.);
        pos.y = pos.y.clamp(40., WORLD_H - 40.);
        let roll = rand::gen_range(0, 100);
        let kind = if self.wave >= 5 && roll < 18 {
            4
        } else if self.wave >= 4 && roll < 36 {
            3
        } else if self.wave >= 3 && roll < 54 {
            2
        } else if self.wave >= 2 && roll < 72 {
            1
        } else {
            0
        };
        let (hp, speed, damage, radius) = [
            (42., 74., 9., 15.),
            (30., 104., 7., 12.),
            (32., 150., 11., 13.),
            (76., 56., 12., 19.),
            (190., 44., 22., 25.),
        ][kind];
        let elite = rand::gen_range(0., 1.) < (0.02 + self.wave as f32 * 0.012).min(0.22);
        let scale = 1. + (self.wave - 1).max(0) as f32 * 0.17;
        self.enemies.push(Enemy {
            pos,
            vel: Vec2::ZERO,
            hp: hp * scale * if elite { 1.7 } else { 1. },
            max_hp: hp * scale * if elite { 1.7 } else { 1. },
            radius: radius * if elite { 1.13 } else { 1. },
            speed: speed
                * (1. + self.wave as f32 * 0.014).min(1.22)
                * if elite { 0.94 } else { 1. },
            damage: damage * (1. + self.wave as f32 * 0.09) * if elite { 1.2 } else { 1. },
            elite,
            shoot_timer: rand::gen_range(1., 2.),
            kind,
        });
        self.wave_left -= 1;
    }

    fn random_weapon(&self, reward: bool) -> Weapon {
        let pool: &[(&str, WeaponKind, f32, f32, f32, f32, usize, i32, i32)] = &[
            (
                "TRUBKOVÝ KLÍČ",
                WeaponKind::Melee,
                27.,
                0.58,
                72.,
                1.3,
                0,
                0,
                1,
            ),
            (
                "ŘEZNÝ NŮŽ",
                WeaponKind::Melee,
                20.,
                0.24,
                58.,
                1.02,
                0,
                0,
                1,
            ),
            (
                "BOURACÍ KLADIVO",
                WeaponKind::Melee,
                58.,
                0.88,
                84.,
                1.9,
                0,
                0,
                3,
            ),
            (
                "ŘETĚZOVÁ PILA",
                WeaponKind::Melee,
                13.,
                0.13,
                66.,
                1.02,
                0,
                0,
                3,
            ),
            (
                "ŠROTOVÁ PISTOLE",
                WeaponKind::Ranged,
                17.,
                0.31,
                720.,
                0.025,
                1,
                0,
                1,
            ),
            (
                "HŘEBÍKOVAČKA",
                WeaponKind::Ranged,
                9.,
                0.10,
                650.,
                0.075,
                1,
                0,
                2,
            ),
            (
                "ŠROTOVNICE",
                WeaponKind::Ranged,
                11.,
                0.78,
                430.,
                0.30,
                5,
                0,
                2,
            ),
            (
                "PRŮBOJNÁ PUŠKA",
                WeaponKind::Ranged,
                58.,
                0.92,
                1000.,
                0.008,
                1,
                2,
                4,
            ),
            (
                "OBLOUKOVÝ VYBÍJEČ",
                WeaponKind::Ranged,
                31.,
                0.024,
                620.,
                0.04,
                1,
                1,
                5,
            ),
        ];
        let available: Vec<_> = pool.iter().filter(|x| self.wave >= x.8).collect();
        let item = available[rand::gen_range(0, available.len())];
        let mut quality = 0usize;
        let luck = self.upgrades[4] as f32;
        let r = rand::gen_range(0., 100.);
        let legendary = 1.5 + luck * 0.65;
        let epic = 4. + luck * 1.1 + legendary;
        let rare = 12. + luck * 1.7 + epic;
        let uncommon = 32. + luck * 2.4 + rare;
        if r < legendary {
            quality = 4;
        } else if r < epic {
            quality = 3;
        } else if r < rare {
            quality = 2;
        } else if r < uncommon {
            quality = 1;
        }
        Weapon {
            name: item.0,
            kind: item.1,
            damage: item.2 * (1. + (self.wave - 1).max(0) as f32 * 0.1),
            cooldown: item.3,
            range: item.4,
            spread: item.5,
            projectiles: item.6,
            pierce: item.7,
            quality: if reward && quality == 0 { 1 } else { quality },
        }
    }

    fn try_attack(&mut self) {
        if self.attack_timer > 0. {
            return;
        }
        let weapon = match self.active_weapon().cloned() {
            Some(w) => w,
            None => return,
        };
        self.attack_timer = weapon.cooldown * (1. - (weapon.quality as f32) * 0.02);
        let damage = weapon.scaled_damage() * (1. + self.upgrades[0] as f32 * 0.15);
        match weapon.kind {
            WeaponKind::Melee => {
                for enemy in &mut self.enemies {
                    let delta = enemy.pos - self.player;
                    if delta.length() <= weapon.range + enemy.radius
                        && delta.normalize_or_zero().dot(self.aim) > weapon.spread.cos()
                    {
                        enemy.hp -= damage
                            * if rand::gen_range(0., 1.) < 0.09 {
                                1.75
                            } else {
                                1.
                            };
                        enemy.vel += self.aim * 145.;
                    }
                }
            }
            WeaponKind::Ranged => {
                for _ in 0..weapon.projectiles {
                    let angle =
                        self.aim.to_angle() + rand::gen_range(-weapon.spread, weapon.spread);
                    self.bullets.push(Bullet {
                        pos: self.player + self.aim * 24.,
                        vel: vec2(angle.cos(), angle.sin()) * 900.,
                        damage,
                        life: weapon.range / 900.,
                        pierce: weapon.pierce,
                        from_player: true,
                    });
                }
            }
        }
    }

    fn update(&mut self, dt: f32) {
        if self.mode != Mode::Playing {
            return;
        }
        self.elapsed += dt;
        self.attack_timer = (self.attack_timer - dt).max(0.);
        self.invuln = (self.invuln - dt).max(0.);
        let mut movement = vec2(0., 0.);
        if is_key_down(KeyCode::W) || is_key_down(KeyCode::Up) {
            movement.y -= 1.;
        }
        if is_key_down(KeyCode::S) || is_key_down(KeyCode::Down) {
            movement.y += 1.;
        }
        if is_key_down(KeyCode::A) || is_key_down(KeyCode::Left) {
            movement.x -= 1.;
        }
        if is_key_down(KeyCode::D) || is_key_down(KeyCode::Right) {
            movement.x += 1.;
        }
        if movement.length_squared() > 0. {
            self.player +=
                movement.normalize() * (220. * (1. + self.upgrades[3] as f32 * 0.06)) * dt;
        }
        self.player.x = self.player.x.clamp(24., WORLD_W - 24.);
        self.player.y = self.player.y.clamp(24., WORLD_H - 24.);
        let mouse = mouse_position();
        let screen_center = vec2(screen_width() / 2., screen_height() / 2.);
        self.aim = (vec2(mouse.0, mouse.1) - screen_center).normalize_or_zero();
        if self.aim.length_squared() < 0.01 {
            self.aim = vec2(1., 0.);
        }
        if is_mouse_button_down(MouseButton::Left) || is_key_down(KeyCode::Space) {
            self.try_attack();
        }
        for i in 0..MAX_SLOTS {
            if is_key_pressed(
                [
                    KeyCode::Key1,
                    KeyCode::Key2,
                    KeyCode::Key3,
                    KeyCode::Key4,
                    KeyCode::Key5,
                ][i],
            ) {
                self.active = i;
            }
        }
        if is_key_pressed(KeyCode::E) {
            self.pickup();
        }
        if is_key_pressed(KeyCode::Q) {
            self.slots[self.active] = None;
        }
        if is_key_pressed(KeyCode::B) {
            self.mode = Mode::Shop;
        }
        if is_key_pressed(KeyCode::Escape) {
            self.mode = Mode::Paused;
        }

        self.spawn_timer -= dt;
        if self.wave_left > 0 && self.spawn_timer <= 0. {
            self.spawn_enemy();
            self.spawn_timer = (0.64 - self.wave as f32 * 0.024).max(0.18);
        }
        if self.wave_left == 0 && self.enemies.is_empty() {
            if self.intermission <= 0. {
                self.intermission = 5.;
                self.money += 8 + self.wave * 6;
                self.hp = (self.hp + self.max_hp * 0.12).min(self.max_hp);
                self.drops.push(Drop {
                    pos: self.player + vec2(35., 0.),
                    kind: DropKind::Weapon,
                    value: 0,
                    weapon: Some(self.random_weapon(true)),
                    life: 45.,
                });
            }
            self.intermission -= dt;
            if self.intermission <= 0. {
                self.start_wave();
            }
        }
        self.update_bullets(dt);
        self.update_enemies(dt);
        for drop in &mut self.drops {
            drop.life -= dt;
        }
        self.drops.retain(|d| d.life > 0.);
        self.collect_nearby();
        if self.hp <= 0. {
            self.mode = Mode::GameOver;
        }
    }

    fn update_enemies(&mut self, dt: f32) {
        for enemy in &mut self.enemies {
            let delta = self.player - enemy.pos;
            let distance = delta.length().max(1.);
            let direction = delta / distance;
            if enemy.kind == 1 || enemy.kind == 3 {
                let preferred = if enemy.kind == 1 { 285. } else { 335. };
                enemy.vel = if distance > preferred + 25. {
                    direction * enemy.speed
                } else if distance < preferred - 25. {
                    -direction * enemy.speed * 0.07
                } else {
                    vec2(-direction.y, direction.x) * enemy.speed * 0.045
                };
                enemy.shoot_timer -= dt;
                if enemy.shoot_timer <= 0. {
                    self.bullets.push(Bullet {
                        pos: enemy.pos,
                        vel: direction * 430.,
                        damage: enemy.damage,
                        life: 3.,
                        pierce: 0,
                        from_player: false,
                    });
                    enemy.shoot_timer = if enemy.kind == 1 { 2.15 } else { 2.45 };
                }
            } else {
                enemy.vel = direction * enemy.speed;
            }
            enemy.pos += enemy.vel * dt;
            if distance < enemy.radius + 16. && self.invuln <= 0. {
                let armor = (1. - self.upgrades[1] as f32 * 0.065).max(0.32);
                self.hp -= enemy.damage * armor;
                self.invuln = 0.32;
            }
        }
        let len = self.enemies.len();
        for a in 0..len {
            for b in (a + 1)..len {
                let delta = self.enemies[b].pos - self.enemies[a].pos;
                if delta.length_squared() < 900. {
                    let push = delta.normalize_or_zero() * 2.;
                    self.enemies[a].pos -= push;
                    self.enemies[b].pos += push;
                }
            }
        }
        let mut defeated = vec![];
        for (i, e) in self.enemies.iter().enumerate() {
            if e.hp <= 0. {
                defeated.push(i);
            }
        }
        for i in defeated.into_iter().rev() {
            let e = self.enemies.remove(i);
            self.kills += 1;
            self.money += rand::gen_range(1, 4) * (if e.elite { 2 } else { 1 });
            self.drops.push(Drop {
                pos: e.pos,
                kind: DropKind::Scrap,
                value: rand::gen_range(1, 4),
                weapon: None,
                life: 24.,
            });
            if rand::gen_range(0., 1.)
                < (0.020
                    + self.upgrades[4] as f32 * 0.018
                    + self.wave as f32 * 0.005
                    + if e.elite { 0.12 } else { 0. })
                .min(0.58)
            {
                self.drops.push(Drop {
                    pos: e.pos + vec2(12., 0.),
                    kind: DropKind::Weapon,
                    value: 0,
                    weapon: Some(self.random_weapon(false)),
                    life: 45.,
                });
            }
            if rand::gen_range(0., 1.) < 0.065 {
                self.drops.push(Drop {
                    pos: e.pos + vec2(-10., 0.),
                    kind: DropKind::Medkit,
                    value: 30,
                    weapon: None,
                    life: 26.,
                });
            }
        }
    }

    fn update_bullets(&mut self, dt: f32) {
        for bullet in &mut self.bullets {
            bullet.pos += bullet.vel * dt;
            bullet.life -= dt;
        }
        for bullet in &mut self.bullets {
            if bullet.from_player {
                for enemy in &mut self.enemies {
                    if enemy.pos.distance(bullet.pos) < enemy.radius + 5. {
                        enemy.hp -= bullet.damage;
                        bullet.pierce -= 1;
                        if bullet.pierce < 0 {
                            bullet.life = 0.;
                            break;
                        }
                    }
                }
            } else if self.player.distance(bullet.pos) < 18. && self.invuln <= 0. {
                let armor = (1. - self.upgrades[1] as f32 * 0.065).max(0.32);
                self.hp -= bullet.damage * armor;
                self.invuln = 0.32;
                bullet.life = 0.;
            }
        }
        self.bullets.retain(|b| {
            b.life > 0. && b.pos.x > 0. && b.pos.x < WORLD_W && b.pos.y > 0. && b.pos.y < WORLD_H
        });
    }

    fn collect_nearby(&mut self) {
        for drop in &mut self.drops {
            if matches!(drop.kind, DropKind::Scrap | DropKind::Medkit)
                && drop.pos.distance(self.player) < 105.
            {
                drop.pos += (self.player - drop.pos).normalize_or_zero() * 130. * get_frame_time();
            }
        }
        let mut remove = vec![];
        for (i, drop) in self.drops.iter().enumerate() {
            if drop.pos.distance(self.player) < 25. {
                match drop.kind {
                    DropKind::Scrap => self.money += drop.value,
                    DropKind::Medkit => self.hp = (self.hp + drop.value as f32).min(self.max_hp),
                    DropKind::Weapon => {}
                }
                if !matches!(drop.kind, DropKind::Weapon) {
                    remove.push(i);
                }
            }
        }
        for i in remove.into_iter().rev() {
            self.drops.remove(i);
        }
    }

    fn pickup(&mut self) {
        let index = self
            .drops
            .iter()
            .position(|d| matches!(d.kind, DropKind::Weapon) && d.pos.distance(self.player) < 45.);
        if let Some(i) = index {
            let weapon = self.drops[i].weapon.clone().unwrap();
            if let Some(slot) = self.slots.iter().position(|s| s.is_none()) {
                self.slots[slot] = Some(weapon);
                self.drops.remove(i);
            } else {
                self.slots[self.active] = Some(weapon);
                self.drops.remove(i);
            }
        }
    }

    fn upgrade(&mut self, i: usize) {
        let bases = [40, 45, 35, 50, 60, 30];
        let growth = [1.55, 1.60, 1.50, 1.58, 1.62, 1.50];
        let max = [15, 10, 12, 10, 10, 8];
        if self.upgrades[i] >= max[i] {
            return;
        }
        let price = (bases[i] as f32 * (growth[i] as f32).powi(self.upgrades[i])).round() as i32;
        if self.money >= price {
            self.money -= price;
            self.upgrades[i] += 1;
            if i == 2 {
                self.max_hp += 20.;
                self.hp += 20.;
            }
        }
    }
}

fn conf() -> Conf {
    Conf {
        window_title: "HLUBINA // Sektor 7".into(),
        window_width: 1280,
        window_height: 720,
        window_resizable: true,
        ..Default::default()
    }
}

fn camera(game: &Game) -> Camera2D {
    Camera2D {
        target: game.player,
        zoom: vec2(2. / screen_width(), -2. / screen_height()),
        ..Default::default()
    }
}

fn draw_world(game: &Game) {
    set_camera(&camera(game));
    clear_background(Color::new(0.035, 0.05, 0.04, 1.));
    draw_rectangle(0., 0., WORLD_W, WORLD_H, Color::new(0.045, 0.065, 0.05, 1.));
    let start_x = (game.player.x - 900.).max(0.);
    let start_y = (game.player.y - 650.).max(0.);
    for x in (start_x as i32 / 80 * 80..(game.player.x + 900.) as i32).step_by(80) {
        draw_line(
            x as f32,
            start_y,
            x as f32,
            (game.player.y + 650.).min(WORLD_H),
            1.,
            Color::new(0.08, 0.12, 0.09, 1.),
        );
    }
    for y in (start_y as i32 / 80 * 80..(game.player.y + 650.) as i32).step_by(80) {
        draw_line(
            start_x,
            y as f32,
            (game.player.x + 900.).min(WORLD_W),
            y as f32,
            1.,
            Color::new(0.08, 0.12, 0.09, 1.),
        );
    }
    let decor_start_x = (game.player.x - 1000.).max(40.) as i32;
    let decor_end_x = (game.player.x + 1000.).min(WORLD_W - 40.) as i32;
    let decor_start_y = (game.player.y - 720.).max(40.) as i32;
    let decor_end_y = (game.player.y + 720.).min(WORLD_H - 40.) as i32;
    for gx in (decor_start_x / 160 * 160..decor_end_x).step_by(160) {
        for gy in (decor_start_y / 160 * 160..decor_end_y).step_by(160) {
            let seed = (gx / 160 * 37 + gy / 160 * 91).unsigned_abs() % 11;
            let x = gx as f32 + 28.;
            let y = gy as f32 + 34.;
            if seed == 0 || seed == 5 {
                draw_rectangle(x, y, 62., 35., Color::new(0.13, 0.16, 0.13, 1.));
                draw_rectangle_lines(x, y, 62., 35., 2., Color::new(0.29, 0.34, 0.27, 0.8));
                draw_line(
                    x + 8.,
                    y + 8.,
                    x + 54.,
                    y + 27.,
                    2.,
                    Color::new(0.08, 0.10, 0.08, 1.),
                );
                draw_line(
                    x + 54.,
                    y + 8.,
                    x + 8.,
                    y + 27.,
                    2.,
                    Color::new(0.08, 0.10, 0.08, 1.),
                );
            } else if seed == 2 || seed == 8 {
                draw_circle(x + 18., y + 22., 14., Color::new(0.28, 0.24, 0.16, 1.));
                draw_circle_lines(x + 18., y + 22., 15., 3., Color::new(0.47, 0.39, 0.22, 1.));
                draw_circle(x + 49., y + 18., 11., Color::new(0.25, 0.23, 0.17, 1.));
                draw_circle_lines(x + 49., y + 18., 12., 2., Color::new(0.43, 0.37, 0.23, 1.));
            } else if seed == 3 || seed == 9 {
                draw_line(
                    x,
                    y + 18.,
                    x + 70.,
                    y + 18.,
                    8.,
                    Color::new(0.18, 0.21, 0.17, 1.),
                );
                draw_line(
                    x + 10.,
                    y + 18.,
                    x + 60.,
                    y + 18.,
                    3.,
                    Color::new(0.52, 0.33, 0.16, 1.),
                );
                draw_circle(x + 10., y + 18., 7., Color::new(0.34, 0.38, 0.31, 1.));
                draw_circle(x + 60., y + 18., 7., Color::new(0.34, 0.38, 0.31, 1.));
            } else if seed == 6 {
                draw_circle(x + 34., y + 12., 5., AMBER);
                draw_circle_lines(
                    x + 34.,
                    y + 12.,
                    12.,
                    2.,
                    Color::new(0.91, 0.63, 0.24, 0.28),
                );
                draw_rectangle(x + 30., y + 17., 8., 28., Color::new(0.18, 0.22, 0.17, 1.));
            }
        }
    }
    for x in (100..2700).step_by(310) {
        draw_rectangle(x as f32, 180., 110., 20., Color::new(0.12, 0.15, 0.12, 1.));
        draw_rectangle(x as f32, 182., 110., 3., AMBER);
    }
    for d in &game.drops {
        match d.kind {
            DropKind::Scrap => {
                draw_circle(d.pos.x, d.pos.y, 7., GOLD);
                draw_circle_lines(d.pos.x, d.pos.y, 10., 2., Color::new(1., 0.075, 0.02, 0.03));
            }
            DropKind::Medkit => {
                draw_rectangle(d.pos.x - 7., d.pos.y - 7., 14., 14., RED);
                draw_line(d.pos.x - 4., d.pos.y, d.pos.x + 4., d.pos.y, 2., WHITE);
                draw_line(d.pos.x, d.pos.y - 4., d.pos.x, d.pos.y + 4., 2., WHITE);
            }
            DropKind::Weapon => {
                draw_circle(
                    d.pos.x,
                    d.pos.y,
                    11.,
                    d.weapon.as_ref().map(|w| w.color()).unwrap_or(WHITE),
                );
                draw_circle_lines(d.pos.x, d.pos.y, 15., 2., WHITE);
            }
        }
    }
    for b in &game.bullets {
        draw_circle(
            b.pos.x,
            b.pos.y,
            4.,
            if b.from_player { AMBER } else { RED },
        );
    }
    for e in &game.enemies {
        let color = match e.kind {
            0 => Color::new(0.55, 0.65, 0.50, 1.),
            1 => SKYBLUE,
            2 => VIOLET,
            3 => ORANGE,
            _ => RED,
        };
        draw_circle(e.pos.x, e.pos.y, e.radius, color);
        if e.elite {
            draw_circle_lines(e.pos.x, e.pos.y, e.radius + 5., 3., GOLD);
        }
        draw_rectangle(
            e.pos.x - e.radius,
            e.pos.y - e.radius - 10.,
            e.radius * 2.,
            3.,
            Color::new(0.10, 0.10, 0.10, 1.),
        );
        draw_rectangle(
            e.pos.x - e.radius,
            e.pos.y - e.radius - 10.,
            e.radius * 2. * (e.hp / e.max_hp).max(0.),
            3.,
            RED,
        );
    }
    let player_color = if game.invuln > 0. {
        WHITE
    } else {
        Color::new(0.80, 0.72, 0.48, 1.)
    };
    draw_circle(game.player.x, game.player.y, 16., player_color);
    draw_line(
        game.player.x,
        game.player.y,
        game.player.x + game.aim.x * 28.,
        game.player.y + game.aim.y * 28.,
        5.,
        AMBER,
    );
    set_default_camera();
}

fn text(s: &str, x: f32, y: f32, size: f32, color: Color) {
    UI_FONT.with(|font| {
        if let Some(font) = font.borrow().as_ref() {
            draw_text_ex(
                s,
                x,
                y,
                TextParams {
                    font: Some(font),
                    font_size: size as u16,
                    color,
                    ..Default::default()
                },
            );
        } else {
            draw_text(s, x, y, size, color);
        }
    });
}

fn draw_hud(game: &Game) {
    let w = screen_width();
    let h = screen_height();
    draw_rectangle(0., 0., w, 92., Color::new(0.02, 0.028, 0.022, 0.28));
    draw_line(
        20.,
        91.,
        w - 20.,
        91.,
        1.,
        Color::new(0.40, 0.48, 0.39, 0.18),
    );

    draw_rectangle(20., 16., 42., 42., Color::new(0.07, 0.10, 0.075, 0.88));
    draw_rectangle_lines(20., 16., 42., 42., 1., Color::new(0.55, 0.62, 0.50, 0.45));
    text("H", 34., 46., 28., AMBER);
    text("HLUBINA", 73., 35., 19., Color::new(0.84, 0.85, 0.78, 1.));
    text(
        "SEKTOR 7 // SMĚNA BEZ KONCE",
        73.,
        52.,
        9.,
        Color::new(0.42, 0.46, 0.41, 1.),
    );

    let stats_x = 330.;
    let stats_y = 16.;
    draw_rectangle(
        stats_x,
        stats_y,
        405.,
        52.,
        Color::new(0.025, 0.035, 0.028, 0.82),
    );
    draw_rectangle_lines(
        stats_x,
        stats_y,
        405.,
        52.,
        1.,
        Color::new(0.43, 0.51, 0.42, 0.22),
    );
    text(
        "INTEGRITA",
        stats_x + 12.,
        stats_y + 14.,
        9.,
        Color::new(0.48, 0.52, 0.46, 1.),
    );
    draw_rectangle(
        stats_x + 12.,
        stats_y + 22.,
        150.,
        10.,
        Color::new(0.08, 0.10, 0.08, 1.),
    );
    draw_rectangle(
        stats_x + 12.,
        stats_y + 22.,
        150. * (game.hp / game.max_hp).max(0.),
        10.,
        Color::new(0.75, 0.25, 0.19, 1.),
    );
    text(
        &format!("{:.0} / {:.0}", game.hp.max(0.), game.max_hp),
        stats_x + 12.,
        stats_y + 46.,
        13.,
        Color::new(0.82, 0.82, 0.75, 1.),
    );
    text(
        "ŠROT",
        stats_x + 183.,
        stats_y + 14.,
        9.,
        Color::new(0.48, 0.52, 0.46, 1.),
    );
    text(
        &format!("{}", game.money),
        stats_x + 183.,
        stats_y + 39.,
        17.,
        GOLD,
    );
    text(
        "VLNA",
        stats_x + 260.,
        stats_y + 14.,
        9.,
        Color::new(0.48, 0.52, 0.46, 1.),
    );
    text(
        &format!("{}", game.wave),
        stats_x + 260.,
        stats_y + 39.,
        17.,
        AMBER,
    );
    text(
        "ELIMINACE",
        stats_x + 315.,
        stats_y + 14.,
        9.,
        Color::new(0.48, 0.52, 0.46, 1.),
    );
    text(
        &format!("{}", game.kills),
        stats_x + 315.,
        stats_y + 39.,
        17.,
        Color::new(0.82, 0.82, 0.75, 1.),
    );

    let actions = [("B", "DÍLNA"), ("M", "♪"), ("H", "?"), ("ESC", "Ⅱ")];
    let action_start = w - 252.;
    for (i, (key, label)) in actions.iter().enumerate() {
        let x = action_start + i as f32 * 70.;
        let width = if i == 0 { 70. } else { 42. };
        draw_rectangle(x, 18., width, 36., Color::new(0.045, 0.06, 0.047, 0.90));
        draw_rectangle_lines(x, 18., width, 36., 1., Color::new(0.50, 0.57, 0.47, 0.32));
        if i == 0 {
            text(key, x + 8., 33., 9., AMBER);
            text(label, x + 27., 41., 9., Color::new(0.72, 0.74, 0.67, 1.));
        } else {
            text(label, x + 15., 42., 16., Color::new(0.72, 0.74, 0.67, 1.));
        }
    }

    if game.wave_left > 0 {
        text(
            &format!(
                "ZBÝVÁ NEPŘÁTEL: {}",
                game.wave_left + game.enemies.len() as i32
            ),
            w - 240.,
            77.,
            9.,
            Color::new(0.55, 0.58, 0.52, 1.),
        );
    } else if game.intermission > 0. {
        text(
            &format!("DALŠÍ VLNA ZA {:.1}", game.intermission),
            w - 190.,
            77.,
            9.,
            AMBER,
        );
    }

    let deck_y = h - 112.;
    draw_rectangle(
        20.,
        deck_y,
        230.,
        74.,
        Color::new(0.025, 0.035, 0.028, 0.84),
    );
    draw_rectangle_lines(
        20.,
        deck_y,
        230.,
        74.,
        1.,
        Color::new(0.43, 0.50, 0.42, 0.24),
    );
    text(
        "AKTIVNÍ ZBRAŇ",
        34.,
        deck_y + 16.,
        8.,
        Color::new(0.35, 0.39, 0.34, 1.),
    );
    if let Some(wpn) = game.active_weapon() {
        text(wpn.name, 34., deck_y + 39., 16., wpn.color());
        text(
            &format!("{:.0} DMG // {:.2}s", wpn.scaled_damage(), wpn.cooldown),
            34.,
            deck_y + 59.,
            10.,
            Color::new(0.61, 0.63, 0.57, 1.),
        );
    }

    let slot_w = 82.;
    let slot_h = 90.;
    let slot_gap = 7.;
    let base = w / 2. - (slot_w * 5. + slot_gap * 4.) / 2.;
    for i in 0..MAX_SLOTS {
        let x = base + i as f32 * (slot_w + slot_gap);
        let y = h - slot_h - 16.;
        draw_rectangle(x, y, slot_w, slot_h, Color::new(0.035, 0.047, 0.037, 0.94));
        draw_rectangle(
            x,
            y,
            slot_w,
            3.,
            if i == game.active {
                AMBER
            } else {
                Color::new(0.18, 0.23, 0.18, 1.)
            },
        );
        draw_rectangle_lines(
            x,
            y,
            slot_w,
            slot_h,
            1.,
            if i == game.active {
                Color::new(0.91, 0.63, 0.24, 0.8)
            } else {
                Color::new(0.45, 0.52, 0.44, 0.30)
            },
        );
        text(
            &(i + 1).to_string(),
            x + 8.,
            y + 17.,
            10.,
            Color::new(0.55, 0.58, 0.52, 1.),
        );
        if let Some(wpn) = &game.slots[i] {
            draw_circle(x + slot_w / 2., y + 40., 18., wpn.color());
            draw_circle_lines(
                x + slot_w / 2.,
                y + 40.,
                22.,
                1.,
                Color::new(0.82, 0.83, 0.75, 0.3),
            );
            text(wpn.name, x + 7., y + 74., 8., wpn.color());
        } else {
            text(
                "＋",
                x + slot_w / 2. - 8.,
                y + 50.,
                22.,
                Color::new(0.25, 0.30, 0.25, 1.),
            );
        }
    }

    let right_x = w - 235.;
    draw_rectangle(
        right_x,
        deck_y,
        215.,
        74.,
        Color::new(0.025, 0.035, 0.028, 0.80),
    );
    draw_rectangle_lines(
        right_x,
        deck_y,
        215.,
        74.,
        1.,
        Color::new(0.43, 0.50, 0.42, 0.20),
    );
    text(
        "WASD",
        right_x + 14.,
        deck_y + 23.,
        10.,
        Color::new(0.78, 0.78, 0.71, 1.),
    );
    text(
        "pohyb",
        right_x + 65.,
        deck_y + 23.,
        9.,
        Color::new(0.43, 0.47, 0.42, 1.),
    );
    text(
        "LMB",
        right_x + 14.,
        deck_y + 43.,
        10.,
        Color::new(0.78, 0.78, 0.71, 1.),
    );
    text(
        "útok",
        right_x + 65.,
        deck_y + 43.,
        9.,
        Color::new(0.43, 0.47, 0.42, 1.),
    );
    text(
        "E",
        right_x + 119.,
        deck_y + 23.,
        10.,
        Color::new(0.78, 0.78, 0.71, 1.),
    );
    text(
        "sebrat",
        right_x + 139.,
        deck_y + 23.,
        9.,
        Color::new(0.43, 0.47, 0.42, 1.),
    );
    text(
        "Q",
        right_x + 119.,
        deck_y + 43.,
        10.,
        Color::new(0.78, 0.78, 0.71, 1.),
    );
    text(
        "odhodit",
        right_x + 139.,
        deck_y + 43.,
        9.,
        Color::new(0.43, 0.47, 0.42, 1.),
    );
    text(
        "LMB / SPACE  útok aktivní zbraní",
        w / 2. - 105.,
        h - 4.,
        8.,
        Color::new(0.30, 0.34, 0.30, 1.),
    );
}

fn draw_overlay_backdrop() {
    draw_rectangle(
        0.,
        0.,
        screen_width(),
        screen_height(),
        Color::new(0.012, 0.018, 0.014, 0.72),
    );
    draw_circle(
        screen_width() / 2.,
        screen_height() * 0.38,
        screen_height() * 0.65,
        Color::new(0.18, 0.24, 0.17, 0.16),
    );
}

fn panel(x: f32, y: f32, width: f32, height: f32, accent: Color) {
    draw_rectangle(x, y, width, height, Color::new(0.035, 0.05, 0.038, 0.96));
    draw_rectangle(
        x + 1.,
        y + 1.,
        width - 2.,
        20.,
        Color::new(0.8, 0.85, 0.75, 0.025),
    );
    draw_rectangle_lines(x, y, width, height, 1., Color::new(0.55, 0.62, 0.52, 0.34));
    draw_line(x, y, x + width - 20., y, 2., accent);
    draw_line(
        x + width,
        y + 20.,
        x + width,
        y + height,
        1.,
        Color::new(0.55, 0.62, 0.52, 0.22),
    );
}

fn draw_shop(game: &Game) {
    draw_overlay_backdrop();
    let width = screen_width().min(1010.);
    let x = (screen_width() - width) / 2.;
    let y = 42.;
    let height = (screen_height() - 84.).max(500.);
    panel(x, y, width, height, AMBER);
    draw_circle(x + 28., y + 30., 4., AMBER);
    text(
        "DÍLNA // TERMINÁL 04",
        x + 43.,
        y + 34.,
        10.,
        Color::new(0.68, 0.70, 0.62, 1.),
    );
    text(
        "VYLEPŠENÍ VÝBAVY",
        x + 24.,
        y + 78.,
        29.,
        Color::new(0.86, 0.84, 0.75, 1.),
    );
    text(
        "B / ESC  zavře dílnu",
        x + width - 185.,
        y + 33.,
        9.,
        Color::new(0.47, 0.51, 0.45, 1.),
    );
    text(
        &format!("ŠROT: {}", game.money),
        x + width - 170.,
        y + 77.,
        16.,
        GOLD,
    );
    let names = [
        "SERVO ÚDERU",
        "PANCÉŘOVÉ PLÁTY",
        "CHLADICÍ JÁDRO",
        "EXO-SERVO",
        "SPEKTRÁLNÍ SKENER",
        "POLNÍ MAGNET",
    ];
    let effects = [
        "+15 % poškození",
        "-6.5 % poškození",
        "+20 max integrity",
        "+6 % rychlost",
        "lepší rarity",
        "+28 % magnet",
    ];
    for i in 0..6 {
        let col = i % 2;
        let row = i / 2;
        let card_x = x + 24. + col as f32 * ((width - 72.) / 2.);
        let card_y = y + 112. + row as f32 * 82.;
        let price = [40, 45, 35, 50, 60, 30][i] as f32
            * ([1.55_f32, 1.6, 1.5, 1.58, 1.62, 1.5][i]).powi(game.upgrades[i]);
        let card_width = (width - 72.) / 2.;
        draw_rectangle(
            card_x,
            card_y,
            card_width,
            68.,
            Color::new(0.045, 0.065, 0.048, 0.92),
        );
        draw_rectangle_lines(
            card_x,
            card_y,
            card_width,
            68.,
            1.,
            Color::new(0.50, 0.58, 0.48, 0.28),
        );
        text(
            &format!("[{}] {}", i + 1, names[i]),
            card_x + 16.,
            card_y + 24.,
            15.,
            LIGHTGRAY,
        );
        text(
            &format!(
                "LVL {}   {}   {:.0} ŠROTU",
                game.upgrades[i], effects[i], price
            ),
            card_x + 16.,
            card_y + 49.,
            11.,
            if game.money >= price.round() as i32 {
                GREEN
            } else {
                GRAY
            },
        );
    }
    let repair = ((game.max_hp - game.hp) * 0.65).ceil().max(8.);
    draw_rectangle(
        x + 24.,
        y + height - 79.,
        width - 48.,
        50.,
        Color::new(0.05, 0.07, 0.05, 0.92),
    );
    draw_rectangle_lines(
        x + 24.,
        y + height - 79.,
        width - 48.,
        50.,
        1.,
        Color::new(0.50, 0.58, 0.48, 0.25),
    );
    text(
        &format!("[R] OPRAVIT INTEGRITU  ({:.0} ŠROTU)", repair),
        x + 42.,
        y + height - 49.,
        14.,
        if game.money >= repair.round() as i32 {
            GREEN
        } else {
            GRAY
        },
    );
}

fn draw_pause() {
    draw_overlay_backdrop();
    let width = 440.;
    let height = 365.;
    let x = (screen_width() - width) / 2.;
    let y = (screen_height() - height) / 2.;
    panel(x, y, width, height, AMBER);
    draw_circle(x + 30., y + 31., 4., AMBER);
    text(
        "SMĚNA POZASTAVENA",
        x + 45.,
        y + 35.,
        10.,
        Color::new(0.68, 0.70, 0.62, 1.),
    );
    text(
        "PAUZA",
        x + 28.,
        y + 91.,
        42.,
        Color::new(0.88, 0.86, 0.77, 1.),
    );
    text(
        "Továrna počká. Tvůj šrot taky.",
        x + 29.,
        y + 123.,
        12.,
        Color::new(0.52, 0.56, 0.50, 1.),
    );
    let buttons = [
        ("ENTER", "POKRAČOVAT"),
        ("B", "DÍLNA"),
        ("H", "OVLÁDÁNÍ"),
        ("R", "NOVÁ SMĚNA"),
    ];
    for (i, (key, label)) in buttons.iter().enumerate() {
        let by = y + 151. + i as f32 * 46.;
        let fill = if i == 0 {
            Color::new(0.70, 0.38, 0.10, 1.)
        } else {
            Color::new(0.06, 0.08, 0.06, 0.95)
        };
        draw_rectangle(x + 28., by, width - 56., 37., fill);
        draw_rectangle_lines(
            x + 28.,
            by,
            width - 56.,
            37.,
            1.,
            if i == 0 {
                Color::new(0.95, 0.69, 0.30, 0.85)
            } else {
                Color::new(0.50, 0.58, 0.48, 0.30)
            },
        );
        text(
            key,
            x + 43.,
            by + 24.,
            10.,
            if i == 0 {
                Color::new(0.15, 0.10, 0.04, 1.)
            } else {
                AMBER
            },
        );
        text(
            label,
            x + 105.,
            by + 24.,
            11.,
            if i == 0 {
                Color::new(0.15, 0.10, 0.04, 1.)
            } else {
                Color::new(0.76, 0.77, 0.69, 1.)
            },
        );
    }
}

fn draw_gameover(game: &Game) {
    draw_overlay_backdrop();
    let width = 440.;
    let height = 390.;
    let x = (screen_width() - width) / 2.;
    let y = (screen_height() - height) / 2.;
    panel(x, y, width, height, RED);
    draw_circle(x + 30., y + 31., 4., RED);
    text(
        "SIGNÁL OPERÁTORA ZTRACEN",
        x + 45.,
        y + 35.,
        10.,
        Color::new(0.78, 0.45, 0.40, 1.),
    );
    text(
        "SMĚNA UKONČENA",
        x + 28.,
        y + 91.,
        31.,
        Color::new(0.91, 0.68, 0.62, 1.),
    );
    text(
        "Sektor 7 si tě pamatuje. Zkus to znovu.",
        x + 29.,
        y + 123.,
        12.,
        Color::new(0.62, 0.54, 0.51, 1.),
    );
    let stats = [
        ("DOSAŽENÁ VLNA", format!("{}", game.wave)),
        ("ELIMINACE", format!("{}", game.kills)),
        ("VYDĚLANÝ ŠROT", format!("{}", game.money)),
        ("ČAS SMĚNY", format!("{:.0}s", game.elapsed)),
    ];
    for (i, (label, value)) in stats.iter().enumerate() {
        let col = i % 2;
        let row = i / 2;
        let sx = x + 28. + col as f32 * 192.;
        let sy = y + 151. + row as f32 * 61.;
        draw_rectangle(sx, sy, 184., 55., Color::new(0.045, 0.06, 0.05, 0.90));
        draw_rectangle_lines(sx, sy, 184., 55., 1., Color::new(0.50, 0.58, 0.48, 0.22));
        text(
            label,
            sx + 12.,
            sy + 18.,
            8.,
            Color::new(0.42, 0.46, 0.41, 1.),
        );
        text(
            value,
            sx + 12.,
            sy + 42.,
            17.,
            Color::new(0.84, 0.82, 0.75, 1.),
        );
    }
    draw_rectangle(
        x + 28.,
        y + height - 57.,
        width - 56.,
        39.,
        Color::new(0.70, 0.25, 0.18, 1.),
    );
    text(
        "NOVÁ SMĚNA  →",
        x + 150.,
        y + height - 32.,
        12.,
        Color::new(0.17, 0.06, 0.04, 1.),
    );
}

fn draw_start_menu() {
    let w = screen_width();
    let h = screen_height();
    clear_background(Color::new(0.018, 0.024, 0.02, 1.));

    draw_circle(
        w * 0.72,
        h * 0.42,
        h * 0.55,
        Color::new(0.25, 0.16, 0.06, 0.10),
    );
    draw_rectangle(0., 0., w, h, Color::new(0.016, 0.024, 0.019, 0.70));
    draw_rectangle(0., 0., w * 0.72, h, Color::new(0.012, 0.018, 0.014, 0.42));

    for x in (0..(w as i32 + 56)).step_by(56) {
        draw_line(
            x as f32,
            0.,
            x as f32,
            h,
            1.,
            Color::new(0.42, 0.50, 0.40, 0.075),
        );
    }
    for y in (0..(h as i32 + 56)).step_by(56) {
        draw_line(
            0.,
            y as f32,
            w,
            y as f32,
            1.,
            Color::new(0.42, 0.50, 0.40, 0.075),
        );
    }
    draw_rectangle(
        w * 0.72,
        0.,
        w * 0.28,
        h,
        Color::new(0.018, 0.025, 0.020, 0.45),
    );

    draw_line(21., 21., 91., 21., 1., Color::new(0.91, 0.63, 0.24, 0.45));
    draw_line(21., 21., 21., 91., 1., Color::new(0.91, 0.63, 0.24, 0.45));
    draw_line(
        w - 21.,
        h - 21.,
        w - 91.,
        h - 21.,
        1.,
        Color::new(0.91, 0.63, 0.24, 0.45),
    );
    draw_line(
        w - 21.,
        h - 21.,
        w - 21.,
        h - 91.,
        1.,
        Color::new(0.91, 0.63, 0.24, 0.45),
    );

    let left = (w * 0.07).clamp(34., 90.);
    let title_y = (h * 0.28).max(190.);
    draw_circle(left + 3., title_y - 82., 3., GREEN);
    text(
        "AUTOMATIZACE SELHALA // 03:47",
        left + 16.,
        title_y - 78.,
        11.,
        Color::new(0.55, 0.58, 0.53, 1.),
    );
    text(
        "HLUBINA",
        left,
        title_y,
        82.,
        Color::new(0.91, 0.89, 0.82, 1.),
    );
    text("7", left + 360., title_y - 4., 50., AMBER);
    draw_line(
        left + 4.,
        title_y + 12.,
        left + 124.,
        title_y + 12.,
        3.,
        Color::new(0.91, 0.63, 0.24, 0.85),
    );
    draw_line(
        left + 124.,
        title_y + 12.,
        left + 205.,
        title_y + 12.,
        3.,
        Color::new(0.91, 0.63, 0.24, 0.0),
    );
    text(
        "Továrna zmlkla. Ve skladech se něco probudilo.",
        left,
        title_y + 57.,
        17.,
        Color::new(0.66, 0.67, 0.61, 1.),
    );
    text(
        "Vezmi krumpáč a vydělej si na cestu ven.",
        left,
        title_y + 82.,
        17.,
        Color::new(0.66, 0.67, 0.61, 1.),
    );

    let card_x = left;
    let card_y = title_y + 111.;
    let card_w = 164.;
    let card_h = 61.;
    let keys = [
        ("WASD", "↑↓←→", "Pohyb po sektoru"),
        ("MYŠ", "", "Míření zbraně"),
        ("LMB", "SPACE", "Útok"),
        ("1–5", "", "Volba slotu"),
        ("E", "", "Sebrat / vyměnit"),
        ("Q", "", "Odhodit zbraň"),
        ("B", "", "Dílna a vylepšení"),
        ("ESC", "", "Pauza"),
    ];
    for (i, (key, second, label)) in keys.iter().enumerate() {
        let x = card_x + (i % 4) as f32 * (card_w + 1.);
        let y = card_y + (i / 4) as f32 * (card_h + 1.);
        draw_rectangle(x, y, card_w, card_h, Color::new(0.035, 0.05, 0.035, 0.94));
        draw_rectangle_lines(x, y, card_w, card_h, 1., Color::new(0.42, 0.49, 0.41, 0.18));
        let mut key_x = x + 11.;
        for value in [*key, *second].iter().filter(|value| !value.is_empty()) {
            let width = measure_text(value, None, 10, 1.).width + 12.;
            draw_rectangle(key_x, y + 10., width, 17., Color::new(0.10, 0.13, 0.10, 1.));
            draw_rectangle_lines(
                key_x,
                y + 10.,
                width,
                17.,
                1.,
                Color::new(0.53, 0.59, 0.50, 0.35),
            );
            text(
                value,
                key_x + 6.,
                y + 22.,
                10.,
                Color::new(0.83, 0.82, 0.75, 1.),
            );
            key_x += width + 4.;
        }
        text(
            label,
            x + 11.,
            y + 48.,
            10.,
            Color::new(0.55, 0.58, 0.53, 1.),
        );
    }

    let button_y = card_y + card_h * 2. + 25.;
    draw_rectangle(left, button_y, 190., 48., Color::new(0.75, 0.40, 0.10, 1.));
    draw_rectangle(
        left + 1.,
        button_y + 1.,
        188.,
        22.,
        Color::new(1.0, 0.78, 0.36, 0.18),
    );
    text(
        "ZAHÁJIT SMĚNU",
        left + 18.,
        button_y + 30.,
        13.,
        Color::new(0.09, 0.07, 0.03, 1.),
    );
    text(
        "→",
        left + 158.,
        button_y + 31.,
        20.,
        Color::new(0.09, 0.07, 0.03, 1.),
    );
    text(
        "Inventář má 5 slotů. Zbraně vypadávají z nepřátel.",
        left + 214.,
        button_y + 20.,
        10.,
        Color::new(0.37, 0.41, 0.36, 1.),
    );
    text(
        "Za šrot kupuješ trvalá vylepšení v dílně.",
        left + 214.,
        button_y + 36.,
        10.,
        Color::new(0.37, 0.41, 0.36, 1.),
    );
}

#[macroquad::main(conf)]
async fn main() {
    let ui_font = load_ttf_font_from_bytes(include_bytes!("../assets/LiberationSans-Regular.ttf"))
        .expect("bundled UI font must load");
    UI_FONT.with(|font| *font.borrow_mut() = Some(ui_font));
    let mut game = Game::new();
    loop {
        let dt = get_frame_time().min(0.05);
        if game.mode == Mode::Menu
            && (is_key_pressed(KeyCode::Enter)
                || is_key_pressed(KeyCode::Space)
                || is_mouse_button_pressed(MouseButton::Left))
        {
            game.reset();
        }
        if game.mode == Mode::GameOver
            && (is_key_pressed(KeyCode::Enter)
                || is_key_pressed(KeyCode::Space)
                || is_key_pressed(KeyCode::R))
        {
            game.reset();
        }
        if game.mode == Mode::Paused {
            if is_key_pressed(KeyCode::Escape) || is_key_pressed(KeyCode::Enter) {
                game.mode = Mode::Playing;
            }
            if is_key_pressed(KeyCode::B) {
                game.mode = Mode::Shop;
            }
            if is_key_pressed(KeyCode::R) {
                game.reset();
            }
        }
        if game.mode == Mode::Shop {
            if is_key_pressed(KeyCode::Escape) || is_key_pressed(KeyCode::B) {
                game.mode = Mode::Playing;
            }
            for i in 0..6 {
                if is_key_pressed(
                    [
                        KeyCode::Key1,
                        KeyCode::Key2,
                        KeyCode::Key3,
                        KeyCode::Key4,
                        KeyCode::Key5,
                        KeyCode::Key6,
                    ][i],
                ) {
                    game.upgrade(i);
                }
            }
            if is_key_pressed(KeyCode::R) {
                let cost = ((game.max_hp - game.hp) * 0.65).ceil().max(8.) as i32;
                if game.money >= cost {
                    game.money -= cost;
                    game.hp = game.max_hp;
                }
            }
        }
        game.update(dt);
        if game.mode == Mode::Menu {
            draw_start_menu();
        } else {
            draw_world(&game);
            draw_hud(&game);
            if game.mode == Mode::Shop {
                draw_shop(&game);
            }
            if game.mode == Mode::Paused {
                draw_pause();
            }
            if game.mode == Mode::GameOver {
                draw_gameover(&game);
            }
        }
        next_frame().await;
    }
}
