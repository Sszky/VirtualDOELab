/**
 * physics.js — เอนจินฟิสิกส์ของ Parachute Simulator
 *
 * ย้ายมาจาก simulate() ใน VirtualDOELab/parachute/parachute.js แบบคงตัวเลข/สูตรเดิมทุกตัว
 * (ผลเวลาตกต้องเท่ากับหน้าเดิมทุกหลัก) ต่างกันแค่:
 *  - เป็นฟังก์ชันบริสุทธิ์ ไม่อ่าน DOM (เรียกทดสอบจาก console ได้)
 *  - เก็บ trajectory {t, y, v} ไว้ให้ app.js เล่นแอนิเมชันตามตำแหน่งจริง
 *
 * โมเดล: ปล่อยจากนิ่งที่ความสูง heightM แรงโน้มถ่วง + แรงต้านอากาศแบบกำลังสอง
 *   F_drag = ½·ρ·Cd·A·v²,  A = พื้นที่วงกลมของร่ม,  Cd = shapeCd × materialFactor × (1 + (string − 40)·0.0015)
 *   อินทิเกรตแบบ Euler ทีละ dt = 0.005 s จนถึงพื้น
 * โหมด stochastic: คูณเวลาตกด้วย (1 + n·0.035) และความเร็วด้วย (1 + n·0.02), n ~ N(0,1) ตัวเดียวกัน (เหมือนหน้าเดิม)
 */
(function (global) {
  'use strict';

  const CONSTANTS = {
    MASS_KG: 0.12,
    RHO_AIR: 1.225,
    G: 9.81,
    DT: 0.005,
    MAX_SIM_TIME_S: 60,
    RECORD_EVERY_N_STEPS: 4, // เก็บจุด trajectory ทุก ~0.02 s
    NOISE_TIME: 0.035,
    NOISE_SPEED: 0.02,
  };

  const SHAPE_CD = { round: 1.5, square: 1.28, hexagon: 1.4 };
  const MATERIAL_FACTOR = { plastic: 1.02, nylon: 1.08, paper: 0.92 };

  /** Box-Muller เหมือนหน้าเดิม */
  function normalNoise() {
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function dragCoefficient(shape, material, stringCm) {
    return SHAPE_CD[shape] * MATERIAL_FACTOR[material] * (1 + (stringCm - 40) * 0.0015);
  }

  /**
   * @param {{shape:string, material:string, diameterCm:number, stringCm:number, heightM:number, mode:string}} input
   * @returns {{trajectory:Array<{t:number,y:number,v:number}>, summary:{time:number, impactSpeed:number, cd:number}, warnings:Array, params:object}}
   */
  function simulateDrop(input) {
    const params = {
      shape: SHAPE_CD[input.shape] ? input.shape : 'round',
      material: MATERIAL_FACTOR[input.material] ? input.material : 'plastic',
      diameterCm: Number(input.diameterCm),
      stringCm: Number(input.stringCm),
      heightM: Number(input.heightM),
      mode: input.mode === 'stochastic' ? 'stochastic' : 'deterministic',
    };
    const warnings = [];

    const diameter = params.diameterCm / 100;
    const area = Math.PI * (diameter / 2) ** 2;
    const cd = dragCoefficient(params.shape, params.material, params.stringCm);

    let remainingHeight = params.heightM;
    let velocity = 0;
    let time = 0;
    let step = 0;
    const trajectory = [{ t: 0, y: remainingHeight, v: 0 }];

    // ลูปเดียวกับหน้าเดิมทุกบรรทัด (Euler, ความเร็วไม่ติดลบ)
    while (remainingHeight > 0 && time < CONSTANTS.MAX_SIM_TIME_S) {
      const dragForce = 0.5 * CONSTANTS.RHO_AIR * cd * area * velocity ** 2;
      const acceleration = CONSTANTS.G - dragForce / CONSTANTS.MASS_KG;
      velocity = Math.max(0, velocity + acceleration * CONSTANTS.DT);
      remainingHeight -= velocity * CONSTANTS.DT;
      time += CONSTANTS.DT;
      step++;
      if (step % CONSTANTS.RECORD_EVERY_N_STEPS === 0 || remainingHeight <= 0) {
        trajectory.push({ t: time, y: Math.max(0, remainingHeight), v: velocity });
      }
    }

    if (remainingHeight > 0) {
      warnings.push({ key: 'maxSimTimeExceeded' });
    }

    let timeFactor = 1;
    let speedFactor = 1;
    if (params.mode === 'stochastic') {
      const noise = normalNoise();
      timeFactor = 1 + noise * CONSTANTS.NOISE_TIME;
      speedFactor = 1 + noise * CONSTANTS.NOISE_SPEED;
    }

    const finalTime = Math.max(0.1, time * timeFactor);
    // ยืดแกนเวลาของ trajectory ด้วยตัวคูณเดียวกัน → แอนิเมชันถึงพื้นตรงกับเวลาในตาราง
    const scaled = trajectory.map((p) => ({
      t: (p.t / time) * finalTime,
      y: p.y,
      v: p.v * speedFactor,
    }));

    return {
      trajectory: scaled,
      summary: { time: finalTime, impactSpeed: velocity * speedFactor, cd },
      warnings,
      params,
    };
  }

  global.ParachutePhysics = { simulateDrop, dragCoefficient, CONSTANTS, SHAPE_CD, MATERIAL_FACTOR };
})(typeof window !== 'undefined' ? window : globalThis);
