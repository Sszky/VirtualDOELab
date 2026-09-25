/**
 * physics.js — เอนจินฟิสิกส์ของ Catapult Simulator (เขียนเอง ไม่ได้ยกโค้ดจากที่ใด)
 *
 * เครื่องแบบ Statapult มองด้านข้าง: ฐาน + เสาตั้ง + แขนหมุนรอบจุดหมุนที่โคนเสา
 * มุมแขน θ วัดจากแนวนอนด้านหน้า: แขนตั้งตรง = 90°, แขนนอนราบไปด้านหลัง = 180°
 *
 * สองช่วง:
 *  1) แขนเหวี่ยง (หลักพลังงาน):
 *     หนังยางเป็นสปริงขึงจากจุดบนเสา (สูง E จากจุดหมุน) ไปหมุดบนแขน (ห่าง D จากจุดหมุน)
 *     พลังงานที่ปล่อย = ½k[(L(A)−L0)² − (L(B)−L0)²] (ช่วงหย่อน L<L0 ไม่มีแรง)
 *     หักงานที่ใช้ยกแขน+ถ้วย+ลูกบอลขึ้น แล้วคูณประสิทธิภาพ η → พลังงานจลน์การหมุน ½Iω²
 *     ลูกบอลหลุดที่มุม B ด้วยความเร็ว v0 = ω·C ตั้งฉากกับแขน (มุมยิง = B − 90°)
 *  2) ลอยอิสระ: ลูกปิงปอง แรงโน้มถ่วง + แรงต้านอากาศกำลังสอง อินทิเกรตด้วย RK4 จนถึงพื้น
 *
 * ข้อจำกัดที่ยอมรับ: ไม่คิดการสั่นของแขน/ฐาน ไม่คิดการลื่นของบอลในถ้วย และถือว่าบอลหลุดทันทีที่แขนชนตัวกั้น
 */
(function (global) {
  'use strict';

  const CONSTANTS = {
    PIVOT_HEIGHT_M: 0.08,    // จุดหมุนสูงจากพื้น
    TOWER_OFFSET_M: 0.02,    // เสาอยู่หน้าจุดหมุนเล็กน้อย
    ARM_LENGTH_M: 0.45,
    ARM_MASS_KG: 0.06,
    CUP_MASS_KG: 0.01,
    BALL_MASS_KG: 0.0027,    // ลูกปิงปอง
    BALL_DIAM_M: 0.04,
    BALL_CD: 0.5,
    BAND_K: 95,              // N/m
    BAND_REST_M: 0.1,        // ความยาวหนังยางตอนไม่ยืด
    EFFICIENCY: 0.8,         // สัดส่วนพลังงานหนังยางที่กลายเป็นความเร็วแขนจริง
    RHO_AIR: 1.225,
    G: 9.81,
    MIN_GAP_DEG: 5,          // มุมง้าง (A) ต้องมากกว่ามุมยิง (B) อย่างน้อยเท่านี้
    DT: 0.001,
    RECORD_EVERY_N_STEPS: 5,
    MAX_SIM_TIME_S: 10,
    NOISE_ENERGY: 0.03,
    NOISE_FIRING_DEG: 0.5,
  };

  const RANGES = {
    releaseDeg: [120, 185],
    firingDeg: [90, 140],
    cupCm: [20, 40],
    pinCm: [8, 24],
    bungeeCm: [14, 30],
  };

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const rad = (deg) => (deg * Math.PI) / 180;

  function normalNoise() {
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /** ตำแหน่งจุดต่าง ๆ ของเครื่อง (m) ที่มุมแขน θ — app.js ใช้วาดรูปด้วยสูตรเดียวกัน */
  function geometry(thetaDeg, p) {
    const c = CONSTANTS;
    const t = rad(thetaDeg);
    const pivot = { x: 0, y: c.PIVOT_HEIGHT_M };
    const along = (r) => ({ x: pivot.x + r * Math.cos(t), y: pivot.y + r * Math.sin(t) });
    return {
      pivot,
      tip: along(c.ARM_LENGTH_M),
      cup: along(p.cupCm / 100),
      pin: along(p.pinCm / 100),
      anchor: { x: c.TOWER_OFFSET_M, y: pivot.y + p.bungeeCm / 100 },
    };
  }

  function bandLength(thetaDeg, p) {
    const g = geometry(thetaDeg, p);
    return Math.hypot(g.anchor.x - g.pin.x, g.anchor.y - g.pin.y);
  }

  function bandEnergy(length, k) {
    const stretch = Math.max(0, length - CONSTANTS.BAND_REST_M);
    return 0.5 * k * stretch * stretch;
  }

  function clampInputs(input) {
    const warnings = [];
    const p = {};
    for (const key of Object.keys(RANGES)) {
      p[key] = clamp(Number(input[key]), RANGES[key][0], RANGES[key][1]);
    }
    if (p.releaseDeg < p.firingDeg + CONSTANTS.MIN_GAP_DEG) {
      p.releaseDeg = Math.min(RANGES.releaseDeg[1], p.firingDeg + CONSTANTS.MIN_GAP_DEG);
      warnings.push({ key: 'releaseRaised', params: { value: p.releaseDeg } });
    }
    p.mode = input.mode === 'stochastic' ? 'stochastic' : 'deterministic';
    return { params: p, warnings };
  }

  /**
   * @param {{releaseDeg, firingDeg, cupCm, pinCm, bungeeCm, mode}} input
   * @returns {{trajectory, summary:{distance, flightTime, maxHeight, launchSpeed, launchAngleDeg}, warnings, params}}
   */
  function simulateLaunch(input) {
    const c = CONSTANTS;
    const { params, warnings } = clampInputs(input);

    let k = c.BAND_K;
    let eta = c.EFFICIENCY;
    let firingDeg = params.firingDeg;
    if (params.mode === 'stochastic') {
      k *= 1 + c.NOISE_ENERGY * normalNoise();
      eta *= 1 + c.NOISE_ENERGY * normalNoise();
      firingDeg += c.NOISE_FIRING_DEG * normalNoise();
    }

    // ---- ช่วงที่ 1: แขนเหวี่ยง ----
    const cupR = params.cupCm / 100;
    const releaseE = bandEnergy(bandLength(params.releaseDeg, params), k);
    const firingE = bandEnergy(bandLength(firingDeg, params), k);
    const liftMoment = c.ARM_MASS_KG * c.G * (c.ARM_LENGTH_M / 2) + (c.CUP_MASS_KG + c.BALL_MASS_KG) * c.G * cupR;
    const liftWork = liftMoment * (Math.sin(rad(firingDeg)) - Math.sin(rad(params.releaseDeg)));
    const inertia = (c.ARM_MASS_KG * c.ARM_LENGTH_M ** 2) / 3 + (c.CUP_MASS_KG + c.BALL_MASS_KG) * cupR ** 2;
    const kinetic = eta * (releaseE - firingE) - liftWork;
    if (kinetic <= 0) warnings.push({ key: 'noLaunch' });
    const omega = Math.sqrt(Math.max(0, (2 * kinetic) / inertia));
    const launchSpeed = omega * cupR;

    // ---- ช่วงที่ 2: ลอยอิสระ ----
    const start = geometry(firingDeg, params).cup;
    const t0 = rad(firingDeg);
    let x = start.x;
    let y = start.y;
    let vx = launchSpeed * Math.sin(t0);
    let vy = -launchSpeed * Math.cos(t0);
    const area = Math.PI * (c.BALL_DIAM_M / 2) ** 2;
    const dragK = (0.5 * c.RHO_AIR * c.BALL_CD * area) / c.BALL_MASS_KG;
    const deriv = (svx, svy) => {
      const speed = Math.hypot(svx, svy);
      return { ax: -dragK * speed * svx, ay: -c.G - dragK * speed * svy };
    };

    let t = 0;
    let step = 0;
    let maxHeight = y;
    const dt = c.DT;
    const trajectory = [{ t: 0, x, y, vx, vy, phase: 2 }];

    while (t < c.MAX_SIM_TIME_S) {
      const k1 = deriv(vx, vy);
      const k2 = deriv(vx + 0.5 * dt * k1.ax, vy + 0.5 * dt * k1.ay);
      const k3 = deriv(vx + 0.5 * dt * k2.ax, vy + 0.5 * dt * k2.ay);
      const k4 = deriv(vx + dt * k3.ax, vy + dt * k3.ay);
      const nvx = vx + (dt / 6) * (k1.ax + 2 * k2.ax + 2 * k3.ax + k4.ax);
      const nvy = vy + (dt / 6) * (k1.ay + 2 * k2.ay + 2 * k3.ay + k4.ay);
      const nx = x + (dt / 6) * (vx + 2 * (vx + 0.5 * dt * k1.ax) + 2 * (vx + 0.5 * dt * k2.ax) + (vx + dt * k3.ax));
      const ny = y + (dt / 6) * (vy + 2 * (vy + 0.5 * dt * k1.ay) + 2 * (vy + 0.5 * dt * k2.ay) + (vy + dt * k3.ay));

      if (ny <= 0) {
        const frac = y / (y - ny);
        t += frac * dt;
        x += (nx - x) * frac;
        vx += (nvx - vx) * frac;
        vy += (nvy - vy) * frac;
        y = 0;
        trajectory.push({ t, x, y, vx, vy, phase: 2 });
        break;
      }

      t += dt;
      x = nx;
      y = ny;
      vx = nvx;
      vy = nvy;
      if (y > maxHeight) maxHeight = y;
      step++;
      if (step % c.RECORD_EVERY_N_STEPS === 0) trajectory.push({ t, x, y, vx, vy, phase: 2 });
    }

    if (y > 0) warnings.push({ key: 'maxSimTimeExceeded' });

    return {
      trajectory,
      summary: {
        distance: Math.max(0, x), // กรณีไม่มีแรงพอ บอลหล่นหลังจุดหมุน -> นับเป็น 0
        flightTime: t,
        maxHeight,
        launchSpeed,
        launchAngleDeg: firingDeg - 90,
      },
      warnings,
      params: { ...params },
    };
  }

  global.CatapultPhysics = { simulateLaunch, geometry, bandLength, CONSTANTS, RANGES };
})(typeof window !== 'undefined' ? window : globalThis);
