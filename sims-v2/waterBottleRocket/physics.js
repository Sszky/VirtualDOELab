/**
 * physics.js — เอนจินฟิสิกส์ของ Water Bottle Rocket Simulator
 *
 * ไฟล์นี้ไม่แตะ DOM เลย เพื่อให้เรียกทดสอบตรง ๆ จาก console ได้
 * (เช่น RocketPhysics.simulateFlight({angleDeg:50, fins:4, waterVolumeML:400, pressurePSI:35}))
 *
 * โมเดลฟิสิกส์ (สองเฟส):
 *  1) เฟสแรงขับ: ขณะยังมีน้ำในขวด ใช้สมการ Bernoulli หาความเร็วน้ำที่พุ่งออกจากหัวฉีด
 *     และสมการ adiabatic expansion หาความดันอากาศในขวดที่ลดลงเรื่อย ๆ ตามปริมาตรอากาศที่เพิ่มขึ้น
 *     แรงขับ = แรงจากโมเมนตัมของน้ำที่พุ่งออก + แรงจากผลต่างความดัน (thrust เชิงโมเมนตัม+ความดัน)
 *  2) เฟสบินอิสระ: หลังน้ำหมด ไม่มีแรงขับอีก เหลือแรงโน้มถ่วง + แรงต้านอากาศ จนกว่าจะตกพื้น
 *
 * ข้อจำกัดที่ยอมรับเป็นการลดความซับซ้อน (ระบุไว้ชัดเจน):
 *  - ละเลยแรงขับช่วงสั้น ๆ จากอากาศอัดล้วน ๆ หลังน้ำหมด (ถือว่าเปลี่ยนเป็นเฟสบินอิสระทันที)
 *  - ทิศแรงขับล็อกตามมุมยิงตลอดช่วงเผาไหม้ (สมมติฐานแท่นยิงแบบแข็ง) ไม่ได้หมุนตามทิศความเร็วจริง
 *  - ไม่มีแบบจำลองการหมุน/เสถียรภาพแบบ 6DOF — จำนวนปีก (B) มีผลแค่กับมวลรวมและสัมประสิทธิ์แรงต้านอากาศ
 */
(function (global) {     
  'use strict';

  // ---------------------------------------------------------------------
  // ค่าคงที่ (fixed) — ไม่ให้ผู้ใช้ปรับ แต่ตั้งชื่อชัดเจนเพื่อปรับจูนภายหลังได้ง่าย
  // ---------------------------------------------------------------------
  const CONSTANTS = {
    V_BOTTLE_M3: 0.0015,                          // ปริมาตรขวด 1.5 ลิตร
    NOZZLE_DIAM_M: 0.022,                         // เส้นผ่านศูนย์กลางคอขวด 22 mm
    CD_NOZZLE: 0.8,                               // discharge coefficient ของหัวฉีด
    BODY_DIAM_M: 0.089,                           // เส้นผ่านศูนย์กลางลำตัวขวด 89 mm
    M_DRY_BASE_KG: 0.15,                          // มวลจรวดเปล่า (ขวด+หัวจรวด)
    M_PER_FIN_KG: 0.01,                           // มวลเพิ่มต่อปีก 1 ชิ้น
    CD_DRAG_BASE: 0.4,                            // สัมประสิทธิ์แรงต้านอากาศพื้นฐาน
    CD_DRAG_PER_FIN: 0.02,                        // แรงต้านอากาศที่เพิ่มขึ้นต่อปีก 1 ชิ้น
    RHO_WATER: 1000,                              // kg/m^3
    RHO_AIR: 1.225,                               // kg/m^3
    P_ATM: 101325,                                // Pa
    G: 9.81,                                      // m/s^2
    GAMMA: 1.4,                                   // ดัชนี adiabatic ของอากาศ
    PSI_TO_PA: 6894.76,
    MIN_AIR_VOLUME_M3: 0.00005,                   // กันปริมาณน้ำชนขอบความจุขวด (เหลืออากาศอย่างน้อย 50 mL)
    DT_PHYSICS: 0.002,                            // s, ขนาดสเต็ปคงที่สำหรับ RK4
    RECORD_EVERY_N_STEPS: 5,                      // เก็บจุด trajectory ทุก ๆ N สเต็ป (~0.01s)
    MAX_SIM_TIME_S: 30,                           // เพดานเวลาการอินทิเกรต กันลูปไม่รู้จบ
  };

  CONSTANTS.A_NOZZLE_M2 = Math.PI * (CONSTANTS.NOZZLE_DIAM_M / 2) ** 2; // ≈ 3.801e-4 m^2
  CONSTANTS.A_REF_M2 = Math.PI * (CONSTANTS.BODY_DIAM_M / 2) ** 2;     // ≈ 6.221e-3 m^2

  /**
   * จำกัดค่า input ให้อยู่ในช่วงที่สมเหตุสมผล และแจ้งเตือนถ้ามีการปรับค่า
   */
  function clampInputs(params) {
    const warnings = [];
    let { angleDeg, fins, waterVolumeML, pressurePSI } = params;

    angleDeg = clamp(Number(angleDeg), 1, 89);

    fins = Math.round(Number(fins));
    fins = clamp(fins, 2, 8);

    pressurePSI = clamp(Number(pressurePSI), 1, 200);

    waterVolumeML = Number(waterVolumeML);
    const maxWaterML = (CONSTANTS.V_BOTTLE_M3 - CONSTANTS.MIN_AIR_VOLUME_M3) * 1e6;
    if (waterVolumeML > maxWaterML) {
      waterVolumeML = maxWaterML;
      warnings.push({ key: 'waterClamped', params: { max: maxWaterML.toFixed(0) } });
    }
    waterVolumeML = clamp(waterVolumeML, 1, maxWaterML);

    return { params: { angleDeg, fins, waterVolumeML, pressurePSI }, warnings };
  }

  function clamp(v, lo, hi) {
    return Math.min(hi, Math.max(lo, v));
  }

  /**
   * สุ่มตัวเลขแจกแจงปกติมาตรฐาน (mean=0, sd=1) ด้วยวิธี Box-Muller
   * ใช้เฉพาะโหมด stochastic เพื่อใส่สัญญาณรบกวนเล็กน้อยให้ค่าคงที่ทางฟิสิกส์บางตัว
   */
  function normalNoise() {
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /**
   * อนุพันธ์ของสถานะในเฟส 1 (แรงขับ)
   * state = [x, y, vx, vy, Vwater]
   */
  function derivativesPhase1(state, ctx) {
    const [, , vx, vy, Vwater] = state;
    const Vw = Math.max(Vwater, 0);
    const Vair = Math.max(ctx.V_BOTTLE_M3 - Vw, CONSTANTS.MIN_AIR_VOLUME_M3);

    let P = CONSTANTS.P_ATM;
    let ve = 0;
    let dVw = 0;
    let mdot = 0;
    let Fthrust = 0;

    if (Vw > 1e-9) {
      P = ctx.P0_abs * Math.pow(ctx.V_air0 / Vair, CONSTANTS.GAMMA);
      const dP = Math.max(P - CONSTANTS.P_ATM, 0);
      if (dP > 0) {
        ve = Math.sqrt((2 * dP) / CONSTANTS.RHO_WATER);
        dVw = -ctx.Cd_nozzle * CONSTANTS.A_NOZZLE_M2 * ve;
        mdot = CONSTANTS.RHO_WATER * ctx.Cd_nozzle * CONSTANTS.A_NOZZLE_M2 * ve;
        Fthrust = mdot * ve + dP * CONSTANTS.A_NOZZLE_M2;
      }
    }

    const m = ctx.m_dry + CONSTANTS.RHO_WATER * Vw;
    const FxThrust = Fthrust * Math.cos(ctx.angleRad);
    const FyThrust = Fthrust * Math.sin(ctx.angleRad);

    const speed = Math.hypot(vx, vy);
    const Fdrag = 0.5 * CONSTANTS.RHO_AIR * ctx.Cd_drag * CONSTANTS.A_REF_M2 * speed * speed;
    const dragX = speed > 1e-6 ? (-Fdrag * vx) / speed : 0;
    const dragY = speed > 1e-6 ? (-Fdrag * vy) / speed : 0;

    const ax = (FxThrust + dragX) / m;
    const ay = (FyThrust + dragY) / m - CONSTANTS.G;

    return [vx, vy, ax, ay, dVw];
  }

  /**
   * อนุพันธ์ของสถานะในเฟส 2 (บินอิสระ ไม่มีแรงขับ)
   * state = [x, y, vx, vy]
   */
  function derivativesPhase2(state, ctx) {
    const [, , vx, vy] = state;
    const m = ctx.m_dry;

    const speed = Math.hypot(vx, vy);
    const Fdrag = 0.5 * CONSTANTS.RHO_AIR * ctx.Cd_drag * CONSTANTS.A_REF_M2 * speed * speed;
    const dragX = speed > 1e-6 ? (-Fdrag * vx) / speed : 0;
    const dragY = speed > 1e-6 ? (-Fdrag * vy) / speed : 0;

    const ax = dragX / m;
    const ay = dragY / m - CONSTANTS.G;

    return [vx, vy, ax, ay];
  }

  /** RK4 หนึ่งสเต็ปสำหรับ state ที่มีความยาวเท่าใดก็ได้ */
  function rk4Step(state, dt, derivFn, ctx) {
    const n = state.length;
    const add = (a, b, scale) => a.map((v, i) => v + b[i] * scale);

    const k1 = derivFn(state, ctx);
    const k2 = derivFn(add(state, k1, dt / 2), ctx);
    const k3 = derivFn(add(state, k2, dt / 2), ctx);
    const k4 = derivFn(add(state, k3, dt), ctx);

    const next = new Array(n);
    for (let i = 0; i < n; i++) {
      next[i] = state[i] + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    }
    return next;
  }

  /** interpolate เชิงเส้นหาจุดตกพื้นที่แม่นยำระหว่างจุดก่อนหน้ากับจุดปัจจุบัน (y ข้ามศูนย์) */
  function interpolateLanding(prev, curr) {
    const y0 = prev.y;
    const y1 = curr.y;
    const frac = y0 === y1 ? 0 : y0 / (y0 - y1); // 0..1
    const lerp = (a, b) => a + (b - a) * frac;
    return {
      t: lerp(prev.t, curr.t),
      x: lerp(prev.x, curr.x),
      y: 0,
      vx: lerp(prev.vx, curr.vx),
      vy: lerp(prev.vy, curr.vy),
    };
  }

  /**
   * รันการจำลองการยิงหนึ่งครั้งแบบ synchronous ทั้งหมด แล้วคืน trajectory + สรุปผล
   *
   * @param {{angleDeg:number, fins:number, waterVolumeML:number, pressurePSI:number, mode?:'deterministic'|'stochastic'}} rawParams
   * @returns {{trajectory:Array, summary:Object, warnings:Array<{key:string,params?:Object}>, params:Object}}
   */
  function simulateFlight(rawParams) {
    const { params, warnings } = clampInputs(rawParams);
    const { angleDeg, fins, waterVolumeML, pressurePSI } = params;
    const mode = rawParams && rawParams.mode === 'stochastic' ? 'stochastic' : 'deterministic';
    params.mode = mode;

    const angleRad = (angleDeg * Math.PI) / 180;
    const V_water0 = waterVolumeML / 1e6; // mL -> m^3
    const V_air0 = CONSTANTS.V_BOTTLE_M3 - V_water0;
    const m_dry = CONSTANTS.M_DRY_BASE_KG + CONSTANTS.M_PER_FIN_KG * fins;
    const Cd_drag = CONSTANTS.CD_DRAG_BASE + CONSTANTS.CD_DRAG_PER_FIN * fins;
    const P0_abs = CONSTANTS.P_ATM + pressurePSI * CONSTANTS.PSI_TO_PA;

    // โหมด stochastic: ใส่สัญญาณรบกวนแบบ Gaussian อิสระกันเล็กน้อย (~3% SD) ให้ค่าคงที่ทางฟิสิกส์
    // 3 ตัว เพื่อจำลองความคลาดเคลื่อนจากการผลิต/ประกอบจรวดจริง — โหมด deterministic ไม่แตะค่าพวกนี้เลย
    // จึงยังคงให้ผลลัพธ์เป๊ะเหมือนเดิมทุกประการสำหรับ input เดียวกัน (ไม่กระทบ regression เดิม)
    const NOISE_STD = 0.03;
    let Cd_nozzle = CONSTANTS.CD_NOZZLE;
    let m_dry_eff = m_dry;
    let Cd_drag_eff = Cd_drag;
    if (mode === 'stochastic') {
      Cd_nozzle *= 1 + normalNoise() * NOISE_STD;
      m_dry_eff *= 1 + normalNoise() * NOISE_STD;
      Cd_drag_eff *= 1 + normalNoise() * NOISE_STD;
    }

    const ctx = {
      angleRad,
      V_BOTTLE_M3: CONSTANTS.V_BOTTLE_M3,
      V_air0,
      P0_abs,
      m_dry: m_dry_eff,
      Cd_drag: Cd_drag_eff,
      Cd_nozzle,
    };

    // ความเร็วเริ่มต้นเล็กน้อยตามแนวมุมยิง กันหารด้วยศูนย์ตอนคำนวณทิศทางแรงต้านที่ v=0
    const eps = 1e-3;
    let state5 = [0, 0, Math.cos(angleRad) * eps, Math.sin(angleRad) * eps, V_water0];
    let state4 = null;
    let phase = 1;

    let t = 0;
    let stepCount = 0;
    let burnoutTime = null;
    let burnoutSpeed = null;
    let maxAltitude = 0;
    let maxSpeed = 0;

    const trajectory = [{ t: 0, x: 0, y: 0, vx: 0, vy: 0, phase: 1 }];
    let prevSample = trajectory[0];
    let landed = null;

    while (t < CONSTANTS.MAX_SIM_TIME_S) {
      let x, y, vx, vy;

      if (phase === 1) {
        state5 = rk4Step(state5, CONSTANTS.DT_PHYSICS, derivativesPhase1, ctx);
        [x, y, vx, vy] = state5;
        if (state5[4] <= 0) {
          state5[4] = 0;
          burnoutTime = t + CONSTANTS.DT_PHYSICS;
          burnoutSpeed = Math.hypot(vx, vy);
          phase = 2;
          state4 = [x, y, vx, vy];
        }
      } else {
        state4 = rk4Step(state4, CONSTANTS.DT_PHYSICS, derivativesPhase2, ctx);
        [x, y, vx, vy] = state4;
      }

      t += CONSTANTS.DT_PHYSICS;
      stepCount++;

      if (y > maxAltitude) maxAltitude = y;
      const speed = Math.hypot(vx, vy);
      if (speed > maxSpeed) maxSpeed = speed;

      const currSample = { t, x, y, vx, vy, phase };

      // ตกพื้นเมื่อ y ข้ามศูนย์ลงมา (นับตั้งแต่สเต็ปแรกหลัง t=0 เสมอ — ไม่ต้องรอความสูงขั้นต่ำ
      // เพื่อรองรับกรณีแรงขับอ่อนเกินกว่าจะเอาชนะแรงโน้มถ่วง ซึ่งควรถือเป็น "ตกทันที ระยะ ~0"
      // แทนที่จะปล่อยให้จำลองต่อไปจนกลายเป็นค่าใต้ดินไร้ความหมาย)
      if (y <= 0) {
        landed = interpolateLanding(prevSample, currSample);
        trajectory.push({ ...landed, phase });
        break;
      }

      if (!isFinite(x) || !isFinite(y) || !isFinite(vx) || !isFinite(vy)) {
        warnings.push({ key: 'numericalInstability' });
        landed = prevSample;
        break;
      }

      if (stepCount % CONSTANTS.RECORD_EVERY_N_STEPS === 0) {
        trajectory.push(currSample);
      }
      prevSample = currSample;
    }

    if (!landed) {
      // ชนเพดานเวลาโดยไม่ตกพื้น (ไม่ควรเกิดขึ้นกับ input ปกติ) — ใช้จุดสุดท้ายแทน
      warnings.push({ key: 'maxSimTimeExceeded' });
      landed = prevSample;
      trajectory.push({ ...landed, phase });
    }

    const summary = {
      distance: landed.x,
      flightTime: landed.t,
      maxAltitude,
      burnoutTime: burnoutTime ?? landed.t,
      burnoutSpeed: burnoutSpeed ?? 0,
      maxSpeed,
    };

    return { trajectory, summary, warnings, params };
  }

  global.RocketPhysics = {
    CONSTANTS,
    simulateFlight,
    _internal: { clampInputs, rk4Step, derivativesPhase1, derivativesPhase2, normalNoise }, // สำหรับทดสอบ
  };
})(window);
