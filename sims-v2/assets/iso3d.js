/**
 * iso3d.js — ตัววาดโมเดล low-poly แบบ isometric ออกมาเป็น SVG แบน (ไม่ใช้ไลบรารี)
 *
 * แนวคิด: ประกอบโมเดลจากชิ้นพื้นฐาน (กล่อง, กระบอก, กรวย, ทรงกลม, แผ่นรูปทรง) เป็นหน้า polygon 3D
 * แล้วตอน render: หา normal ของแต่ละหน้า -> ตัดหน้าที่หันหลังทิ้ง -> ลงเงาตามทิศแสง -> ฉายแบบ isometric
 * -> เรียงจากไกลไปใกล้ (painter's algorithm) -> ได้ <polygon> สีทึบ ดูเป็นโมเดล 3D แต่เป็น SVG ล้วน
 *
 * แกนโลก: x, y อยู่บนพื้น, z ชี้ขึ้น — ผู้ชมมองจากทิศ (+1,+1,+1)
 * ฉาย: sx = (x − y)·cos30°, sy = (x + y)·sin30° − z
 */
(function (global) {
  'use strict';

  const C = Math.cos(Math.PI / 6);
  const S = 0.5;
  const VIEW = norm([1, 1, 1]); // จากพื้นผิวไปหาผู้ชม
  const LIGHT = norm([-0.25, 0.6, 1]); // หน้าบนสว่างสุด ด้านซ้ายกลาง ด้านขวามืด
  const AMBIENT = 0.5;
  const DIFFUSE = 0.55;

  // ---------------------------------------------------------------- vector
  function norm(v) {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  }
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

  /** ฐานตั้งฉากสองแกน (u, w) ของแกน a */
  function basis(axis) {
    const a = norm(axis);
    const helper = Math.abs(a[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
    const u = norm(cross(a, helper));
    const w = cross(a, u);
    return [a, u, w];
  }

  function project(p) {
    return [(p[0] - p[1]) * C, (p[0] + p[1]) * S - p[2]];
  }

  /** หมุนจุดรอบแกนใดๆ (Rodrigues) ผ่านจุด pivot */
  function rotatePoint(p, axis, deg, pivot) {
    const k = norm(axis);
    const t = (deg * Math.PI) / 180;
    const v = sub(p, pivot);
    const cos = Math.cos(t);
    const sin = Math.sin(t);
    const r = add(add(mul(v, cos), mul(cross(k, v), sin)), mul(k, dot(k, v) * (1 - cos)));
    return add(r, pivot);
  }

  // ---------------------------------------------------------------- สี
  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  /** k < 1 มืดลง, k > 1 ผสมขาว */
  function shade(hex, k) {
    const [r, g, b] = hexToRgb(hex);
    const f = (c) => Math.round(k <= 1 ? c * k : c + (255 - c) * Math.min(1, k - 1));
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  }

  // ---------------------------------------------------------------- ชิ้นพื้นฐาน
  // item: { kind:'face', pts, color, ref, twoSided, inward, opacity, flat, layer }
  //       { kind:'line', pts, color, width, layer, opacity }

  function face(pts, color, opt) {
    return Object.assign({ kind: 'face', pts, color }, opt || {});
  }

  function line(pts, color, width, opt) {
    return Object.assign({ kind: 'line', pts, color, width: width || 0.1 }, opt || {});
  }

  function box(o, size, color, opt) {
    const [x, y, z] = o;
    const [w, d, h] = size;
    const P = (i, j, k) => [x + i * w, y + j * d, z + k * h];
    const ref = [x + w / 2, y + d / 2, z + h / 2];
    const o2 = Object.assign({ ref }, opt || {});
    return [
      face([P(0, 0, 1), P(1, 0, 1), P(1, 1, 1), P(0, 1, 1)], color, o2),
      face([P(0, 0, 0), P(0, 1, 0), P(1, 1, 0), P(1, 0, 0)], color, o2),
      face([P(1, 0, 0), P(1, 1, 0), P(1, 1, 1), P(1, 0, 1)], color, o2),
      face([P(0, 0, 0), P(0, 0, 1), P(0, 1, 1), P(0, 1, 0)], color, o2),
      face([P(0, 1, 0), P(0, 1, 1), P(1, 1, 1), P(1, 1, 0)], color, o2),
      face([P(0, 0, 0), P(1, 0, 0), P(1, 0, 1), P(0, 0, 1)], color, o2),
    ];
  }

  /** คานเอียงตามทิศใดๆ: จาก p0 ไปตาม dir ยาว len กว้าง w หนา t (up = ทิศความกว้าง) */
  function beam(p0, dir, len, w, t, color, opt) {
    const a = norm(dir);
    const up = (opt && opt.up) || (Math.abs(a[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]);
    const u = norm(cross(a, up)); // ความกว้าง
    const v = cross(u, a); // ความหนา
    const P = (s, i, j) => add(add(add(p0, mul(a, s * len)), mul(u, (i - 0.5) * w)), mul(v, (j - 0.5) * t));
    const ref = add(p0, mul(a, len / 2));
    const o2 = Object.assign({ ref }, opt || {});
    return [
      face([P(0, 0, 0), P(0, 1, 0), P(0, 1, 1), P(0, 0, 1)], color, o2),
      face([P(1, 0, 0), P(1, 0, 1), P(1, 1, 1), P(1, 1, 0)], color, o2),
      face([P(0, 0, 0), P(1, 0, 0), P(1, 1, 0), P(0, 1, 0)], color, o2),
      face([P(0, 0, 1), P(0, 1, 1), P(1, 1, 1), P(1, 0, 1)], color, o2),
      face([P(0, 0, 0), P(0, 0, 1), P(1, 0, 1), P(1, 0, 0)], color, o2),
      face([P(0, 1, 0), P(1, 1, 0), P(1, 1, 1), P(0, 1, 1)], color, o2),
    ];
  }

  function ring(center, u, w, r, n) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      pts.push(add(center, add(mul(u, r * Math.cos(t)), mul(w, r * Math.sin(t)))));
    }
    return pts;
  }

  /** กระบอก/กรวยตัด: รัศมีฐาน r0 ปลาย r1 ตามแกน axis ยาว len (lenSeg = แบ่งตามยาวลดปัญหาเรียงลำดับ) */
  function frustum(base, axis, r0, r1, len, color, opt) {
    const o = opt || {};
    const n = o.seg || 16;
    const lenSeg = o.lenSeg || 1;
    const [a, u, w] = basis(axis);
    const ref = add(base, mul(a, len / 2));
    const items = [];
    const rings = [];
    for (let s = 0; s <= lenSeg; s++) {
      const f = s / lenSeg;
      rings.push(ring(add(base, mul(a, len * f)), u, w, r0 + (r1 - r0) * f, n));
    }
    const sideColor = o.sideColor || color;
    for (let s = 0; s < lenSeg; s++) {
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const c = o.stripes ? o.stripes[i % o.stripes.length] : sideColor;
        items.push(face([rings[s][i], rings[s][j], rings[s + 1][j], rings[s + 1][i]], c, { ref, opacity: o.opacity, smooth: true }));
      }
    }
    if (o.caps !== false) {
      if (r0 > 0.001) items.push(face(rings[0].slice().reverse(), o.capColor || color, { ref, opacity: o.opacity }));
      if (r1 > 0.001) items.push(face(rings[lenSeg], o.topColor || o.capColor || color, { ref, opacity: o.opacity }));
    }
    return items;
  }

  function cylinder(base, axis, r, len, color, opt) {
    return frustum(base, axis, r, r, len, color, opt);
  }

  function cone(base, axis, r, len, color, opt) {
    return frustum(base, axis, r, 0.0001, len, color, Object.assign({ caps: true }, opt || {}));
  }

  /** ท่อกลวง/วงแหวน (ม้วนเทป, ห่วงกรรไกร): ผิวนอก ผิวใน และหน้าวงแหวนสองด้าน */
  function tube(base, axis, rOut, rIn, len, color, opt) {
    const o = opt || {};
    const n = o.seg || 18;
    const [a, u, w] = basis(axis);
    const top = add(base, mul(a, len));
    const ob = ring(base, u, w, rOut, n);
    const ot = ring(top, u, w, rOut, n);
    const ib = ring(base, u, w, rIn, n);
    const it = ring(top, u, w, rIn, n);
    const items = [];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const mid = add(base, mul(a, len / 2));
      items.push(face([ob[i], ob[j], ot[j], ot[i]], color, { ref: mid, opacity: o.opacity, smooth: true }));
      items.push(face([ib[i], it[i], it[j], ib[j]], o.innerColor || color, { ref: mid, inward: true, opacity: o.opacity, smooth: true }));
      items.push(face([ot[i], ot[j], it[j], it[i]], o.capColor || color, { ref: mid, opacity: o.opacity }));
      items.push(face([ob[i], ib[i], ib[j], ob[j]], o.capColor || color, { ref: mid, opacity: o.opacity }));
    }
    return items;
  }

  /** ทรงกลม (top=true = ครึ่งบน) zScale บีบแนวตั้ง, colors สลับตามแนวแบ่ง (ร่มชูชีพ) */
  function sphere(c, r, color, opt) {
    const o = opt || {};
    const seg = o.seg || 12;
    const rings = o.rings || 8;
    const zs = o.zScale || 1;
    const from = o.top ? 0 : -Math.PI / 2;
    const P = (i, j) => {
      const th = (i / seg) * Math.PI * 2 + (o.twist || 0);
      const ph = from + (j / rings) * (Math.PI / 2 - from);
      return [c[0] + r * Math.cos(ph) * Math.cos(th), c[1] + r * Math.cos(ph) * Math.sin(th), c[2] + r * zs * Math.sin(ph)];
    };
    const items = [];
    for (let j = 0; j < rings; j++) {
      for (let i = 0; i < seg; i++) {
        const col = o.colors ? o.colors[i % o.colors.length] : color;
        const pts = j === rings - 1 ? [P(i, j), P(i + 1, j), P(i, j + 1)] : [P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)];
        items.push(face(pts, col, { ref: c, opacity: o.opacity, twoSided: !!o.top }));
      }
    }
    return items;
  }

  /** แผ่นรูปทรงอิสระ (poly2D ในระนาบ origin+u·x+v·y) ดันหนา thick ตาม normal */
  function extrude(poly, origin, uDir, vDir, thick, color, opt) {
    const u = norm(uDir);
    const v = norm(vDir);
    const nrm = norm(cross(u, v));
    const P = (p, k) => add(add(add(origin, mul(u, p[0])), mul(v, p[1])), mul(nrm, k * thick));
    const bottom = poly.map((p) => P(p, 0));
    const top = poly.map((p) => P(p, 1));
    let cx = 0;
    let cy = 0;
    poly.forEach((p) => {
      cx += p[0] / poly.length;
      cy += p[1] / poly.length;
    });
    const ref = P([cx, cy], 0.5);
    const o2 = Object.assign({ ref }, opt || {});
    const items = [face(top, color, o2), face(bottom.slice().reverse(), color, o2)];
    for (let i = 0; i < poly.length; i++) {
      const j = (i + 1) % poly.length;
      items.push(face([bottom[i], bottom[j], top[j], top[i]], (opt && opt.edgeColor) || color, o2));
    }
    return items;
  }

  // ---------------------------------------------------------------- transform
  function mapPoints(items, fn) {
    return items.map((it) => {
      const out = Object.assign({}, it, { pts: it.pts.map(fn) });
      if (it.ref) out.ref = fn(it.ref);
      return out;
    });
  }

  function rotate(items, axis, deg, pivot) {
    return mapPoints(items, (p) => rotatePoint(p, axis, deg, pivot || [0, 0, 0]));
  }

  function translate(items, d) {
    return mapPoints(items, (p) => add(p, d));
  }

  function setLayer(items, layer) {
    return items.map((it) => Object.assign({}, it, { layer }));
  }

  // ---------------------------------------------------------------- render
  function newellNormal(pts) {
    let nx = 0;
    let ny = 0;
    let nz = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      nx += (a[1] - b[1]) * (a[2] + b[2]);
      ny += (a[2] - b[2]) * (a[0] + b[0]);
      nz += (a[0] - b[0]) * (a[1] + b[1]);
    }
    return norm([nx, ny, nz]);
  }

  function centroid(pts) {
    const c = [0, 0, 0];
    pts.forEach((p) => {
      c[0] += p[0] / pts.length;
      c[1] += p[1] / pts.length;
      c[2] += p[2] / pts.length;
    });
    return c;
  }

  const fmt = (n) => (Math.round(n * 100) / 100).toString();

  /**
   * @param items  ชิ้นส่วนทั้งหมด
   * @param opt    { bounds: [[x0,y0,z0],[x1,y1,z1]] (viewBox คงที่), pad, title, className }
   */
  function render(items, opt) {
    const o = opt || {};
    const drawn = [];
    items.forEach((it) => {
      const c = centroid(it.pts);
      const depth = c[0] + c[1] + c[2];
      if (it.kind === 'line') {
        drawn.push({ it, depth, layer: it.layer || 0 });
        return;
      }
      let n = newellNormal(it.pts);
      if (it.ref) {
        const out = dot(n, sub(c, it.ref));
        if ((it.inward && out > 0) || (!it.inward && out < 0)) n = mul(n, -1);
      }
      let facing = dot(n, VIEW);
      if (facing <= 0.001) {
        if (!it.twoSided) return;
        n = mul(n, -1);
        facing = -facing;
      }
      const light = it.flat ? 1 : AMBIENT + DIFFUSE * Math.max(0, dot(n, LIGHT));
      drawn.push({ it, depth, layer: it.layer || 0, fill: shade(it.color, light) });
    });
    drawn.sort((a, b) => a.layer - b.layer || a.depth - b.depth);

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const grow = (p) => {
      const [sx, sy] = project(p);
      minX = Math.min(minX, sx);
      maxX = Math.max(maxX, sx);
      minY = Math.min(minY, sy);
      maxY = Math.max(maxY, sy);
    };
    if (o.bounds) {
      const [a, b] = o.bounds;
      [a[0], b[0]].forEach((x) => [a[1], b[1]].forEach((y) => [a[2], b[2]].forEach((z) => grow([x, y, z]))));
    } else {
      items.forEach((it) => it.pts.forEach(grow));
    }
    const pad = o.pad == null ? 0.4 : o.pad;
    minX -= pad;
    minY -= pad;
    maxX += pad;
    maxY += pad;

    const parts = drawn.map((d) => {
      const pts = d.it.pts.map((p) => project(p).map(fmt).join(',')).join(' ');
      const op = d.it.opacity != null ? ` fill-opacity="${d.it.opacity}"` : '';
      if (d.it.kind === 'line') {
        const lop = d.it.opacity != null ? ` stroke-opacity="${d.it.opacity}"` : '';
        return `<polyline points="${pts}" fill="none" stroke="${d.it.color}" stroke-width="${d.it.width}" stroke-linecap="round" stroke-linejoin="round"${lop}/>`;
      }
      const stroke = d.it.opacity != null && d.it.opacity < 1 ? '' : ` stroke="${d.fill}" stroke-width="0.04" stroke-linejoin="round"`;
      return `<polygon points="${pts}" fill="${d.fill}"${op}${stroke}/>`;
    });
    const w = maxX - minX;
    const h = maxY - minY;
    const cls = o.className ? ` class="${o.className}"` : '';
    const title = o.title ? `<title>${o.title}</title>` : '';
    return `<svg${cls} xmlns="http://www.w3.org/2000/svg" viewBox="${fmt(minX)} ${fmt(minY)} ${fmt(w)} ${fmt(h)}" role="img"${o.title ? '' : ' aria-hidden="true"'}>${title}${parts.join('')}</svg>`;
  }

  global.Iso3D = {
    add,
    sub,
    mul,
    norm,
    cross,
    dot,
    rotatePoint,
    face,
    line,
    box,
    beam,
    frustum,
    cylinder,
    cone,
    tube,
    sphere,
    extrude,
    rotate,
    translate,
    setLayer,
    mapPoints,
    render,
    project,
  };
})(typeof window !== 'undefined' ? window : globalThis);
