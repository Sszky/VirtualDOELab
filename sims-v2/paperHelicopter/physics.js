/**
 * physics.js — เอนจินฟิสิกส์ของ Paper Helicopter Simulator (เขียนใหม่ ไม่ใช่สูตร regression)
 *
 * โมเดล: เฮลิคอปเตอร์กระดาษตกแบบหมุน (autorotation) — ใบพัดที่หมุนทำตัวเหมือน "จาน" รับลม
 *   มวล     m = ความหนาแน่นกระดาษ × (พื้นที่ใบพัด 2·WL·WW + พื้นที่ลำตัว BL·BW) + มวลคลิปหนีบกระดาษ
 *   พื้นที่ A = π·WL²  (วงกลมที่ปลายใบพัดกวาด)
 *   Cd       = CD_ROTOR × (WW / 4 cm)^WIDTH_EXPONENT  (ใบกว้าง = solidity สูง รับลมได้มากขึ้น)
 *   ช่วงแรกหลังปล่อยใบพัดยังหมุนไม่เต็มที่ → Cd ค่อย ๆ เพิ่มจาก SPINUP_START×Cd ถึง Cd ภายใน SPINUP_TIME_S
 *   สมการ: m·dv/dt = −m·g + ½·ρ·Cd·A·v²  (v เป็นลบตอนตก) อินทิเกรตด้วย RK4 จนถึงพื้น แล้ว interpolate จุดแตะพื้น
 * โหมด stochastic: ใส่ Gaussian noise 3% ให้ Cd และมวล (แทนความคลาดเคลื่อนของการตัด/พับกระดาษจริง)
 *
 * ข้อจำกัดที่ยอมรับ: ไม่จำลองการเอียง/ส่าย ไม่คิดแรงต้านของลำตัวแยก และถือว่าใบพัดหมุนคงที่หลังช่วง spin-up
 */
(function (global) {
  'use strict';

  const CONSTANTS = {
    RHO_AIR: 1.225,           // kg/m^3
    G: 9.81,                  // m/s^2
    PAPER_KG_PER_M2: 0.08,    // กระดาษ A4 80 แกรม
    CLIP_MASS_KG: 0.0005,     // คลิปหนีบกระดาษ 0.5 g
    CD_ROTOR: 0.8,            // Cd ของจานใบพัดที่ความกว้างใบ 4 cm
    REF_WING_WIDTH_CM: 4,
    WIDTH_EXPONENT: 0.8,
    SPINUP_TIME_S: 0.3,
    SPINUP_START: 0.25,
    DT: 0.001,
    RECORD_EVERY_N_STEPS: 10, // เก็บจุด trajectory ทุก ~0.01 s
    MAX_SIM_TIME_S: 30,
    NOISE_STD: 0.03,
  };

  function normalNoise() {
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /** มวล (kg) จากขนาดชิ้นส่วน (cm) */
  function massKg(WL, WW, BL, BW) {
    const paperAreaM2 = (2 * WL * WW + BL * BW) / 1e4;
    return CONSTANTS.PAPER_KG_PER_M2 * paperAreaM2 + CONSTANTS.CLIP_MASS_KG;
  }

  function rotorCd(WW) {
    return CONSTANTS.CD_ROTOR * Math.pow(WW / CONSTANTS.REF_WING_WIDTH_CM, CONSTANTS.WIDTH_EXPONENT);
  }

  /** smoothstep 0→1 ในช่วง spin-up */
  function spinupFactor(t) {
    const f = Math.min(1, t / CONSTANTS.SPINUP_TIME_S);
    const s = f * f * (3 - 2 * f);
    return CONSTANTS.SPINUP_START + (1 - CONSTANTS.SPINUP_START) * s;
  }

  /**
   * @param {{WL:number, WW:number, BL:number, BW:number, heightM:number, mode:string}} input  ขนาดเป็น cm
   */
  function simulateDrop(input) {
    const params = {
      WL: Number(input.WL),
      WW: Number(input.WW),
      BL: Number(input.BL),
      BW: Number(input.BW),
      heightM: Number(input.heightM),
      mode: input.mode === 'stochastic' ? 'stochastic' : 'deterministic',
    };
    const warnings = [];

    let m = massKg(params.WL, params.WW, params.BL, params.BW);
    let cd = rotorCd(params.WW);
    if (params.mode === 'stochastic') {
      cd *= 1 + CONSTANTS.NOISE_STD * normalNoise();
      m *= 1 + CONSTANTS.NOISE_STD * normalNoise();
    }
    const area = Math.PI * (params.WL / 100) ** 2;
    const k = 0.5 * CONSTANTS.RHO_AIR * area; // แรงต้าน = k·Cd·v²

    // a(t, v): v เป็นลบตอนตก → แรงต้านชี้ขึ้น (บวก)
    const accel = (t, v) => -CONSTANTS.G + (k * cd * spinupFactor(t) * v * v) / m * (v < 0 ? 1 : -1);

    let t = 0;
    let y = params.heightM;
    let v = 0;
    let step = 0;
    const trajectory = [{ t: 0, y, v: 0 }];
    const dt = CONSTANTS.DT;

    while (t < CONSTANTS.MAX_SIM_TIME_S) {
      const k1y = v;
      const k1v = accel(t, v);
      const k2y = v + 0.5 * dt * k1v;
      const k2v = accel(t + 0.5 * dt, v + 0.5 * dt * k1v);
      const k3y = v + 0.5 * dt * k2v;
      const k3v = accel(t + 0.5 * dt, v + 0.5 * dt * k2v);
      const k4y = v + dt * k3v;
      const k4v = accel(t + dt, v + dt * k3v);

      const yNext = y + (dt / 6) * (k1y + 2 * k2y + 2 * k3y + k4y);
      const vNext = v + (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);

      if (yNext <= 0) {
        // interpolate จุดแตะพื้นระหว่างสเต็ป
        const frac = y / (y - yNext);
        t += frac * dt;
        v = v + (vNext - v) * frac;
        y = 0;
        trajectory.push({ t, y: 0, v: -v });
        break;
      }

      t += dt;
      y = yNext;
      v = vNext;
      step++;
      if (step % CONSTANTS.RECORD_EVERY_N_STEPS === 0) trajectory.push({ t, y, v: -v });
    }

    if (y > 0) warnings.push({ key: 'maxSimTimeExceeded' });

    return {
      trajectory,
      summary: {
        time: t,
        impactSpeed: Math.abs(v),
        massG: m * 1000,
        cd,
      },
      warnings,
      params,
    };
  }

  global.HelicopterPhysics = { simulateDrop, massKg, rotorCd, CONSTANTS };
})(typeof window !== 'undefined' ? window : globalThis);
