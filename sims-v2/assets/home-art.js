/**
 * home-art.js — โมเดล isometric ของหน้า home (อาศัย Iso3D จาก iso3d.js)
 *  - diorama 4 การทดลอง: ก้อนสนามหญ้า + อุปกรณ์ (ไม่มีผนัง ไม่มีคน) พร้อมท่าขยับตอน hover
 *  - เครื่องมือทดลอง 9 ชิ้นที่กระจายรอบหัวข้อ hero (นิ่ง ไม่ขยับ)
 * ทุกฟังก์ชัน build รับ t (0..1 = ช่วงแอนิเมชัน) และต้องคืนท่าพักเมื่อ t = 0 หรือ 1
 */
(function (global) {
  'use strict';

  const I = global.Iso3D;
  const { box, beam, cylinder, frustum, cone, tube, sphere, extrude, line, face, rotate, translate, setLayer, rotatePoint, add, mul, norm } = I;

  const COL = {
    grass: '#7cc26b',
    grassDark: '#5ea64f',
    soil: '#a0703f',
    soilDark: '#7c5530',
    navy: '#1b3a6b',
    blue: '#2563eb',
    blueLight: '#93c5fd',
    amber: '#f59e0b',
    yellow: '#facc15',
    red: '#dc2626',
    white: '#f8fafc',
    paper: '#fbf7ec',
    silver: '#cbd5e1',
    steel: '#94a3b8',
    dark: '#1f2937',
    orange: '#f97316',
    wood: '#c8904f',
    woodDark: '#a8733a',
    pvc: '#4cb8ea',
    pvcJoint: '#2a93cc',
  };

  // ---------------------------------------------------------------- ส่วนร่วม
  const DIORAMA_BOUNDS = [
    [-0.3, -0.3, -1.6],
    [10.3, 10.3, 4.6],
  ];

  function groundCircle(cx, cy, r, n) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t), 0.02]);
    }
    return pts;
  }

  /** ก้อนสนามหญ้า 10x10: ชั้นดิน + ชั้นหญ้า + กอหญ้าเล็กๆ (ไม่มีผนัง ไม่มีคน) */
  function platform() {
    const items = [
      ...box([0, 0, -1.55], [10, 10, 1.2], COL.soil),
      ...box([0, 0, -0.35], [10, 10, 0.35], COL.grass),
    ];
    const tufts = [
      [1.1, 1.8],
      [8.7, 1.3],
      [1.6, 8.7],
      [8.9, 8.6],
      [5.6, 0.9],
      [0.9, 5.2],
      [9.1, 4.6],
      [3.2, 9.2],
    ];
    const deco = [];
    tufts.forEach(([x, y]) => {
      deco.push(...cone([x, y, 0], [0, 0, 1], 0.2, 0.5, COL.grassDark, { seg: 5 }));
      deco.push(...cone([x + 0.28, y + 0.12, 0], [0, 0, 1], 0.14, 0.34, COL.grassDark, { seg: 5 }));
    });
    // ก้อนหินเล็ก
    deco.push(...box([7.6, 2.2, 0], [0.35, 0.3, 0.18], '#9ca3af'));
    deco.push(...box([2.3, 6.9, 0], [0.28, 0.35, 0.14], '#9ca3af'));
    return [...setLayer(items, 0), ...setLayer(deco, 0.4)];
  }

  function shadow(cx, cy, r, opacity) {
    return [face(groundCircle(cx, cy, r, 24), '#0b1c33', { flat: true, twoSided: true, opacity: opacity || 0.16, layer: 0.5 })];
  }

  const easeOut = (x) => 1 - (1 - x) * (1 - x);
  const easeInOut = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

  // ---------------------------------------------------------------- diorama: ร่มชูชีพ
  function parachute(t) {
    const items = [...platform(), ...shadow(5, 5, 1.6)];
    const pay = [5, 5, 1.1];
    items.push(...setLayer([...box([4.35, 4.35, 0], [1.3, 1.3, 1.1], COL.navy), ...box([4.3, 4.3, 0.42], [1.4, 1.4, 0.26], COL.amber)], 1));

    // แกว่งซ้ายขวา ค่อยๆ หยุด (t=0,1 -> ท่าพัก)
    const sway = 11 * Math.sin(t * Math.PI * 3) * (1 - t);
    const axis = [1, -1, 0];
    const cc = [5, 5, 6.8];
    const canopy = rotate(sphere(cc, 3.0, COL.red, { top: true, seg: 12, rings: 5, zScale: 0.62, colors: [COL.red, COL.white] }), axis, sway, pay);
    const vent = rotate(cylinder([5, 5, 6.8 + 3.0 * 0.62 - 0.02], [0, 0, 1], 0.35, 0.08, COL.red, { seg: 10 }), axis, sway, pay);

    const corners = [
      [4.45, 4.45, 1.1],
      [5.55, 4.45, 1.1],
      [5.55, 5.55, 1.1],
      [4.45, 5.55, 1.1],
    ];
    const cords = [];
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
      const rim = rotatePoint([5 + 2.95 * Math.cos(a), 5 + 2.95 * Math.sin(a), 6.8], axis, sway, pay);
      const c = corners[Math.floor(((a + Math.PI / 4) % (Math.PI * 2)) / (Math.PI / 2)) % 4];
      cords.push(line([rim, c], '#475569', 0.06));
    }
    items.push(...setLayer(cords, 1.5), ...setLayer([...canopy, ...vent], 2));
    return items;
  }

  // ---------------------------------------------------------------- diorama: เฮลิคอปเตอร์กระดาษ
  function helicopter(t) {
    const items = [...platform(), ...shadow(5, 5, 1.6)];
    const body = [
      ...box([4.45, 4.84, 0], [1.1, 0.32, 1.1], COL.steel), // คลิปหนีบกระดาษ
      ...box([4.35, 4.92, 0.4], [1.3, 0.16, 4.4], COL.paper),
      ...box([4.05, 4.94, 3.4], [1.9, 0.14, 1.5], '#f1e9d2'), // ส่วนพับกว้างใต้ใบพัด
    ];

    const yaw = (25 * Math.PI) / 180;
    const tilt = (14 * Math.PI) / 180;
    const top = [5, 5, 4.86];
    const blades = [];
    [
      [1, COL.blueLight],
      [-1, '#dbeafe'],
    ].forEach(([sgn, col]) => {
      const u = [sgn * Math.cos(yaw) * Math.cos(tilt), sgn * Math.sin(yaw) * Math.cos(tilt), Math.sin(tilt)];
      const v = [-Math.sin(yaw), Math.cos(yaw), 0];
      blades.push(...extrude([[0, -0.7], [4.2, -0.7], [4.2, 0.7], [0, 0.7]], top, u, v, 0.06, col, { twoSided: true }));
    });

    // hover: หมุนทั้งตัว (คลิป+ลำตัว+ใบพัด) รอบแกนตั้ง 3 รอบพอดี จบที่ท่าพักเดิม — ก้อนหญ้า/เงาอยู่นิ่ง
    const spin = (1080 * easeOut(t)) % 360;
    const whole = [...setLayer(body, 1), ...setLayer(blades, 2)];
    items.push(...(spin ? rotate(whole, [0, 0, 1], spin, [5, 5, 0]) : whole));
    return items;
  }

  // ---------------------------------------------------------------- diorama: จรวดขวดน้ำ + ฐานยิง PVC + ที่สูบลม
  function rocket(t) {
    const items = [...platform(), ...shadow(4.6, 5.6, 2.2, 0.12), ...shadow(8.3, 7.8, 0.9, 0.14)];

    const pipe = (a, b, col) => {
      const d = I.sub(b, a);
      const len = Math.hypot(d[0], d[1], d[2]);
      return cylinder(a, d, 0.17, len, col || COL.pvc, { seg: 8, lenSeg: Math.max(1, Math.ceil(len / 1.2)) });
    };
    const joint = (p) => box([p[0] - 0.24, p[1] - 0.24, p[2] - 0.24], [0.48, 0.48, 0.48], COL.pvcJoint);
    const A = [3.0, 3.6, 0.2];
    const B = [6.2, 3.6, 0.2];
    const Cc = [6.2, 7.4, 0.2];
    const D = [3.0, 7.4, 0.2];
    const U1 = [3.0, 6.2, 2.0];
    const U2 = [6.2, 6.2, 2.0];
    const stand = [
      ...pipe(A, B),
      ...pipe(B, Cc),
      ...pipe(Cc, D),
      ...pipe(D, A),
      ...pipe([3.0, 6.2, 0.2], U1),
      ...pipe([6.2, 6.2, 0.2], U2),
      ...pipe(U1, U2),
      ...[A, B, Cc, D, U1, U2, [3.0, 6.2, 0.2], [6.2, 6.2, 0.2]].flatMap(joint),
    ];

    // ท่อยิง: เอียง 55° ชี้ไปทาง -y (บนจอ = ขึ้นขวา)
    const P0 = [4.6, 7.3, 0.45];
    const d = norm([0, -0.574, 0.819]);
    const at = (s) => add(P0, mul(d, s));
    stand.push(...cylinder(P0, d, 0.2, 3.4, COL.pvc, { seg: 10, lenSeg: 3 }));
    items.push(...setLayer(stand, 1));

    // สายยางจากที่สูบลมมาที่โคนท่อยิง
    items.push(...setLayer([line([[8.05, 7.55, 0.35], [7.2, 8.1, 0.12], [6.1, 8.5, 0.12], [5.0, 8.1, 0.16], [4.6, 7.55, 0.4]], '#111827', 0.13)], 0.6));

    // จรวด (ขวดคว่ำ ปากขวดเสียบท่อยิง) — hover: พุ่งขึ้นตามแกนแล้วกลับ
    const off = 1.4 * Math.sin(Math.PI * easeOut(t)) * (t < 1 ? 1 : 0);
    const s0 = 3.0 + off;
    const r = 0.62;
    const rocketParts = [
      ...frustum(at(s0), d, 0.26, r, 0.7, '#cbeafb', { seg: 14, opacity: 0.85 }),
      ...cylinder(at(s0 + 0.7), d, r, 3.4, '#d9f2ff', { seg: 14, lenSeg: 3, opacity: 0.8 }),
      ...cylinder(at(s0 + 3.2), d, r + 0.02, 0.45, COL.yellow, { seg: 14 }),
      ...cone(at(s0 + 4.1), d, r, 1.5, COL.yellow, { seg: 14 }),
    ];
    const water = cylinder(at(s0 + 0.75), d, r - 0.08, 1.3, '#3b82f6', { seg: 12, opacity: 0.45 });
    // ครีบ 4 อัน ที่โคนขวด
    const [, u, w] = (function () {
      const helper = [0, 0, 1];
      const uu = norm(I.cross(d, helper));
      return [d, uu, I.cross(d, uu)];
    })();
    const fins = [];
    for (let k = 0; k < 4; k++) {
      const ang = (k / 4) * Math.PI * 2 + Math.PI / 4;
      const radial = add(mul(u, Math.cos(ang)), mul(w, Math.sin(ang)));
      fins.push(...extrude([[0, 0], [-0.35, 1.0], [0.4, 1.0], [1.5, 0]], add(at(s0 + 0.8), mul(radial, r)), d, radial, 0.07, COL.yellow, { twoSided: true }));
    }
    items.push(...setLayer(water, 2), ...setLayer([...rocketParts, ...fins], 3));

    // ที่สูบลมจักรยาน
    const pump = [
      ...box([7.6, 7.3, 0], [1.4, 1.0, 0.22], '#334155'),
      ...cylinder([8.3, 7.8, 0.22], [0, 0, 1], 0.34, 4.0, '#d1d5db', { seg: 12, lenSeg: 3 }),
      ...cylinder([8.3, 7.8, 0.5], [0, 0, 1], 0.36, 0.55, COL.red, { seg: 12 }),
      ...cylinder([8.3, 7.8, 4.22], [0, 0, 1], 0.38, 0.22, '#475569', { seg: 12 }),
      ...cylinder([8.3, 7.8, 4.44], [0, 0, 1], 0.08, 0.45, '#9ca3af', { seg: 8 }),
      ...cylinder([7.3, 7.8, 4.95], [1, 0, 0], 0.15, 2.0, COL.dark, { seg: 8 }),
      ...cylinder([8.3, 8.1, 1.05], [0, 1, 0], 0.32, 0.18, '#e5e7eb', { seg: 14 }),
    ];
    items.push(...setLayer(pump, 1), ...setLayer([line([[8.3, 8.29, 1.05], [8.48, 8.29, 1.22]], COL.red, 0.05)], 3));
    return items;
  }

  // ---------------------------------------------------------------- diorama: เครื่องยิงหิน
  function catapult(t) {
    const items = [...platform(), ...shadow(5.1, 5.4, 2.3, 0.12)];
    const frame = [
      ...box([3.9, 2.6, 0], [2.4, 5.6, 0.45], COL.wood),
      ...box([4.8, 4.9, 0.45], [0.6, 0.45, 3.9], COL.woodDark),
      ...box([4.25, 6.35, 0.45], [0.35, 0.5, 0.85], COL.woodDark),
      ...box([5.6, 6.35, 0.45], [0.35, 0.5, 0.85], COL.woodDark),
      ...cylinder([4.2, 6.6, 1.1], [1, 0, 0], 0.12, 1.8, '#475569', { seg: 8 }),
    ];
    [1.5, 2.1, 2.7, 3.3, 3.9].forEach((z) => frame.push(...box([5.39, 5.03, z], [0.04, 0.2, 0.2], '#5b3d22')));
    items.push(...setLayer(frame, 1));

    // มุมแขนแบบ Statapult: 90 = ตั้งตรง, 180 = นอนไปด้านหลัง (+y)
    let theta;
    if (t < 0.22) theta = 152 - (152 - 94) * Math.pow(t / 0.22, 2);
    else if (t < 0.5) theta = 94;
    else theta = 94 + (152 - 94) * easeInOut((t - 0.5) / 0.5);
    const th = (theta * Math.PI) / 180;
    const P = [5.1, 6.6, 1.1];
    const a = [0, -Math.cos(th), Math.sin(th)];
    const cupDir = [0, -Math.sin(th), -Math.cos(th)];
    const at = (s) => add(P, mul(a, s));

    const arm = [
      ...beam(at(-0.4), a, 5.6, 0.38, 0.26, '#e2ad6b', { up: [0, -a[2], a[1]] }),
      ...cylinder(add(at(1.8), [-0.3, 0, 0]), [1, 0, 0], 0.09, 0.6, COL.dark, { seg: 6 }),
    ];
    const cupBase = add(at(5.0), mul(cupDir, 0.12));
    const cup = frustum(cupBase, cupDir, 0.3, 0.62, 0.45, COL.blue, { seg: 12 });
    const ball = sphere(add(cupBase, mul(cupDir, 0.75)), 0.42, COL.orange, { seg: 10, rings: 6 });
    items.push(...setLayer(arm, 2), ...setLayer([line([[5.1, 5.36, 3.5], at(1.8)], COL.red, 0.12)], 2.5), ...setLayer([...cup, ...ball], 3));
    return items;
  }

  // ---------------------------------------------------------------- เครื่องมือรอบ hero
  function orient(items, turns) {
    let out = items;
    (turns || []).forEach(([axis, deg]) => {
      out = rotate(out, axis, deg, [0, 0, 0]);
    });
    return out;
  }

  const TOOLS = {
    scissors() {
      const items = [];
      const blade = [[0, -0.3], [4.4, -0.06], [4.5, 0.05], [0, 0.3]];
      const bA = (8 * Math.PI) / 180;
      items.push(...extrude(blade, [0, 0, 0.12], [Math.cos(bA), Math.sin(bA), 0], [-Math.sin(bA), Math.cos(bA), 0], 0.1, COL.silver));
      items.push(...extrude(blade, [0, 0, -0.02], [Math.cos(-bA), Math.sin(-bA), 0], [Math.sin(bA), Math.cos(bA), 0], 0.1, COL.silver));
      items.push(...beam([0, 0, 0.12], [-1, -0.5, 0], 1.5, 0.34, 0.14, '#ea580c'));
      items.push(...beam([0, 0, -0.02], [-1, 0.5, 0], 1.5, 0.34, 0.14, '#ea580c'));
      items.push(...tube([-2.2, -1.2, 0.05], [0, 0, 1], 0.95, 0.58, 0.28, COL.orange, { seg: 18 }));
      items.push(...tube([-2.2, 1.2, -0.08], [0, 0, 1], 0.95, 0.58, 0.28, COL.orange, { seg: 18 }));
      items.push(...cylinder([0, 0, 0.22], [0, 0, 1], 0.17, 0.08, '#475569', { seg: 10 }));
      return orient(items, [[[0, 0, 1], 35], [[1, 0, 0], -30]]);
    },
    cutter() {
      const items = [
        ...beam([0, 0, 0], [1, 0, 0], 2.8, 1.0, 0.55, COL.dark, { up: [0, 0, 1] }),
        ...beam([2.8, 0, 0], [1, 0, 0], 2.3, 1.0, 0.55, COL.yellow, { up: [0, 0, 1] }),
        ...extrude([[0, -0.32], [1.2, -0.32], [1.9, 0.28], [0, 0.28]], [5.1, 0, -0.02], [1, 0, 0], [0, 1, 0], 0.05, COL.silver),
        ...box([3.3, -0.24, 0.27], [0.55, 0.48, 0.16], COL.dark),
      ];
      [5.45, 5.8].forEach((x) => items.push(line([[x, -0.32, 0.04], [x + 0.35, 0.28, 0.04]], '#64748b', 0.03, { layer: 2 })));
      return orient(items, [[[0, 0, 1], -25], [[0, 1, 0], 18]]);
    },
    paperRoll() {
      const items = [...cylinder([0, 0, 0], [1, 0, 0], 0.9, 4.6, COL.white, { seg: 18, lenSeg: 3, capColor: '#e2e8f0' })];
      const spiral = [];
      for (let k = 0; k <= 60; k++) {
        const th = (k / 60) * Math.PI * 5;
        const r = 0.12 + (0.72 * k) / 60;
        spiral.push([4.62, r * Math.cos(th), r * Math.sin(th)]);
      }
      items.push(line(spiral, '#94a3b8', 0.045, { layer: 2 }));
      // แผ่นที่คลี่ออกมา มีลายเส้นแบบพิมพ์เขียว
      const sheet = [[0.2, 0.88, -0.1], [4.4, 0.88, -0.1], [4.4, 3.4, -0.55], [0.2, 3.4, -0.55]];
      items.push(face(sheet, '#dbeafe', { twoSided: true, layer: 1 }));
      const on = (fx, fy) => [0.2 + 4.2 * fx, 0.88 + 2.52 * fy, -0.1 - 0.45 * fy + 0.02];
      items.push(line([on(0.12, 0.25), on(0.62, 0.25), on(0.62, 0.8), on(0.12, 0.8), on(0.12, 0.25)], COL.blue, 0.05, { layer: 2 }));
      items.push(line([on(0.72, 0.3), on(0.9, 0.3)], COL.blue, 0.05, { layer: 2 }));
      items.push(line([on(0.72, 0.5), on(0.9, 0.5)], COL.blue, 0.05, { layer: 2 }));
      items.push(line([on(0.72, 0.7), on(0.84, 0.7)], COL.blue, 0.05, { layer: 2 }));
      return orient(items, [[[0, 0, 1], 20], [[1, 0, 0], 12]]);
    },
    bottle() {
      const items = [
        ...setLayer(cylinder([0, 0, 0.12], [0, 0, 1], 0.66, 1.9, '#3b82f6', { seg: 16, opacity: 0.55 }), 1),
        ...setLayer(cylinder([0, 0, 0], [0, 0, 1], 0.78, 3.2, '#dbeafe', { seg: 16, lenSeg: 2, opacity: 0.6 }), 2),
        ...setLayer(frustum([0, 0, 3.2], [0, 0, 1], 0.78, 0.34, 0.8, '#dbeafe', { seg: 16, opacity: 0.6 }), 2),
        ...setLayer(cylinder([0, 0, 4.0], [0, 0, 1], 0.34, 0.3, '#dbeafe', { seg: 12, opacity: 0.6 }), 2),
        ...setLayer(cylinder([0, 0, 1.15], [0, 0, 1], 0.8, 0.9, COL.blue, { seg: 16 }), 3),
        ...setLayer(cylinder([0, 0, 4.3], [0, 0, 1], 0.4, 0.5, '#1d4ed8', { seg: 14 }), 3),
      ];
      return orient(items, [[[1, -1, 0], -22]]);
    },
    spool() {
      const items = [
        ...cylinder([0, 0, 0], [0, 0, 1], 1.05, 0.22, '#d6a569', { seg: 18 }),
        ...cylinder([0, 0, 0.22], [0, 0, 1], 0.82, 1.5, COL.red, { seg: 18, stripes: ['#ef4444', '#dc2626'] }),
        ...cylinder([0, 0, 1.72], [0, 0, 1], 1.05, 0.22, '#d6a569', { seg: 18 }),
        ...cylinder([0, 0, 1.94], [0, 0, 1], 0.24, 0.02, '#7c4a1e', { seg: 12 }),
      ];
      items.push(line([[0.7, 0.45, 1.0], [1.3, 0.7, 0.8], [1.9, 1.1, 0.5], [2.3, 1.8, 0.35], [2.1, 2.5, 0.25], [2.7, 3.1, 0.2], [3.5, 3.2, 0.15]], '#ef4444', 0.12, { layer: 3 }));
      return orient(items, [[[1, 0, 0], 15]]);
    },
    stopwatch() {
      const body = cylinder([0, -0.3, 0], [0, 1, 0], 1.5, 0.6, '#1e293b', { seg: 24, topColor: COL.white });
      body[body.length - 1].flat = true; // หน้าปัดขาวสว่าง
      const items = [
        ...body,
        ...setLayer(tube([0, 0.26, 0], [0, 1, 0], 1.64, 1.4, 0.16, COL.steel, { seg: 24 }), 2),
        ...cylinder([0, 0, 1.5], [0, 0, 1], 0.18, 0.35, COL.steel, { seg: 8 }),
        ...cylinder([0, 0, 1.85], [0, 0, 1], 0.32, 0.22, '#475569', { seg: 10 }),
        ...cylinder([1.06, 0, 1.06], [1, 0, 1], 0.14, 0.3, '#475569', { seg: 8 }),
      ];
      const Y = 0.32;
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        const r0 = k % 3 === 0 ? 1.0 : 1.15;
        items.push(line([[r0 * Math.sin(a), Y, r0 * Math.cos(a)], [1.28 * Math.sin(a), Y, 1.28 * Math.cos(a)]], '#334155', 0.06, { layer: 3 }));
      }
      items.push(line([[0, Y, 0], [0, Y, 0.95]], '#0f172a', 0.1, { layer: 3 }));
      items.push(line([[0, Y, 0], [1.0 * Math.sin(1.05), Y, 1.0 * Math.cos(1.05)]], COL.red, 0.06, { layer: 3 }));
      return orient(items, [[[0, 0, 1], -20]]);
    },
    tapeMeasure() {
      const items = [
        ...box([-1.1, -0.5, 0], [2.2, 1.0, 2.2], COL.yellow),
        ...cylinder([0, 0.5, 1.1], [0, 1, 0], 0.62, 0.08, COL.dark, { seg: 18 }),
        ...cylinder([0, 0.58, 1.1], [0, 1, 0], 0.24, 0.04, COL.yellow, { seg: 12 }),
        ...box([-0.3, -0.2, 2.2], [0.6, 0.4, 0.12], COL.dark),
        ...box([1.1, -0.28, 0.05], [4.0, 0.56, 0.05], '#fde047'),
        ...box([5.1, -0.3, 0], [0.08, 0.6, 0.35], COL.steel),
      ];
      for (let k = 0; k < 17; k++) {
        const x = 1.3 + k * 0.23;
        const len = k % 4 === 0 ? 0.3 : 0.16;
        items.push(line([[x, -0.28, 0.105], [x, -0.28 + len, 0.105]], COL.dark, 0.03, { layer: 2 }));
      }
      return orient(items, [[[0, 0, 1], 30]]);
    },
    pingPong() {
      return [...sphere([0, 0, 0], 1, '#fb923c', { seg: 14, rings: 10 }), ...sphere([1.9, 0.9, -0.5], 0.62, COL.white, { seg: 12, rings: 8 })];
    },
    tapeRoll() {
      const items = [
        ...setLayer(tube([0, 0, 0], [0, 0, 1], 1.05, 0.84, 0.95, '#b45309', { seg: 24, capColor: '#d97706' }), 1),
        ...setLayer(tube([0, 0, 0], [0, 0, 1], 1.7, 1.05, 0.95, '#bae6fd', { seg: 24, opacity: 0.72, capColor: '#e0f2fe' }), 2),
        ...setLayer([face([[1.7, 0, 0.08], [1.7, 0, 0.87], [2.3, 1.7, 0.87], [2.3, 1.7, 0.08]], '#e0f2fe', { twoSided: true, opacity: 0.8 })], 3),
      ];
      return orient(items, [[[1, 0, 0], -28], [[0, 0, 1], 15]]);
    },
  };

  // ---------------------------------------------------------------- ติดตั้งลงหน้าเว็บ
  const DIORAMAS = {
    parachute: { build: parachute, duration: 1800 },
    helicopter: { build: helicopter, duration: 1600 },
    rocket: { build: rocket, duration: 1100 },
    catapult: { build: catapult, duration: 1700 },
  };

  const reduceMotion = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)');

  function renderDiorama(el, t) {
    const d = DIORAMAS[el.dataset.art];
    el.innerHTML = I.render(d.build(t), { bounds: DIORAMA_BOUNDS, pad: 0.3, className: 'iso-svg' });
  }

  /** hover/focus ที่การ์ด -> เล่นท่าขยับหนึ่งรอบ แล้วกลับท่าพัก (ขยับเฉพาะตอน interact) */
  function bindDiorama(el) {
    const d = DIORAMAS[el.dataset.art];
    let running = false;
    const trigger = el.closest('a, button') || el;
    const play = () => {
      if (running || (reduceMotion && reduceMotion.matches)) return;
      running = true;
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / d.duration);
        renderDiorama(el, t);
        if (t < 1) requestAnimationFrame(step);
        else running = false;
      };
      requestAnimationFrame(step);
    };
    trigger.addEventListener('mouseenter', play);
    trigger.addEventListener('focus', play);
  }

  function init() {
    document.querySelectorAll('[data-art]').forEach((el) => {
      if (!DIORAMAS[el.dataset.art]) return;
      renderDiorama(el, 0);
      bindDiorama(el);
    });
    document.querySelectorAll('[data-tool]').forEach((el) => {
      const make = TOOLS[el.dataset.tool];
      if (make) el.innerHTML = I.render(make(), { pad: 0.25, className: 'iso-svg' });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  global.HomeArt = { DIORAMAS, TOOLS, DIORAMA_BOUNDS };
})(window);
