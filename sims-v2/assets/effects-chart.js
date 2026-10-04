/**
 * effects-chart.js — กราฟ Main Effects / Interaction ที่ใช้ร่วมกันทั้ง 4 การทดลอง
 *  - เลือกตัวแปรแกน Y ได้ (ผลตอบทุกตัวที่อยู่ในตาราง)
 *  - error bar = ช่วงความเชื่อมั่น 95% จาก pure error (ความคลาดเคลื่อนของรอบที่ตั้งค่าเหมือนกันทุกปัจจัย ในโหมด stochastic)
 *  - วาดได้ตั้งแต่บันทึกผลครั้งแรก
 *  - ชี้/แตะที่จุดหรือปลาย error bar แล้วขึ้นกล่องบอกค่า
 *  - ดาวน์โหลดรูปกราฟเป็น PNG (มีชื่อกราฟ ชื่อแกน และลายน้ำ "Simulated data")
 *
 * โหลดหลัง i18n.js และก่อน app.js — แต่ละหน้าเรียก EffectsChart.create(config) แล้วสั่ง render() เมื่อข้อมูล/ภาษาเปลี่ยน
 *
 * config:
 *   factors:       [{ key, label(): string, format(value: string): string, levels?: string[] }]  (levels = ปัจจัยแบบตัวเลือก เรียงตามนี้)
 *   responses:     [{ key, labelKey, unit, digits }]  ตัวแรก = ค่าเริ่มต้นของแกน Y
 *   replicateKeys: คีย์ที่ต้องเท่ากันทุกตัวถึงนับเป็นการทำซ้ำ (ปัจจัยทั้งหมด + ค่าคงที่ เช่นความสูง)
 *   getResults():  แถวผลการทดลองทั้งหมด (มี mode = 'deterministic' | 'stochastic')
 *   lang():        ภาษาปัจจุบัน
 *   filePrefix:    ต้นชื่อไฟล์ PNG
 */
(function (global) {
  'use strict';

  const DICT = {
    en: {
      effectsResponseLabel: 'Response (Y-axis)',
      effectsDownloadPng: 'Download PNG',
      fxHint: 'Mean {y} at each level',
      fxEmpty: 'Log at least one run to see this chart.',
      fxSameFactor: 'Choose two different factors to compare.',
      fxCi: 'Error bars: 95% confidence interval from pure error (s = {s}, df = {df}).',
      fxNeedReplicates: 'Repeat the same settings at least twice in Stochastic mode to see 95% confidence-interval error bars.',
      fxDeterministic: 'Deterministic runs have no random noise, so there are no error bars. Use Stochastic mode and repeat the same settings to see them.',
      fxMean: 'Mean',
      fxCiRange: '95% CI',
      fxCiUpper: 'Upper 95% CI',
      fxCiLower: 'Lower 95% CI',
      fxPngMain: 'Main Effects Plot for {y}',
      fxPngInteraction: 'Interaction Plot for {y}',
      fxPngRuns: '{n} runs',
      fxWatermark: 'Simulated data — Virtual DOE Lab',
    },
    th: {
      effectsResponseLabel: 'ผลตอบ (แกน Y)',
      effectsDownloadPng: 'ดาวน์โหลด PNG',
      fxHint: 'ค่าเฉลี่ย {y} ที่แต่ละระดับ',
      fxEmpty: 'บันทึกผลอย่างน้อย 1 ครั้งเพื่อดูกราฟนี้',
      fxSameFactor: 'เลือกปัจจัยสองตัวที่ต่างกันเพื่อเปรียบเทียบ',
      fxCi: 'Error bar: ช่วงความเชื่อมั่น 95% จาก pure error (s = {s}, df = {df})',
      fxNeedReplicates: 'ทำซ้ำค่าเดิมอย่างน้อย 2 ครั้งในโหมด Stochastic เพื่อดู error bar (ช่วงความเชื่อมั่น 95%)',
      fxDeterministic: 'โหมด Deterministic ไม่มีความคลาดเคลื่อนสุ่ม จึงไม่มี error bar ใช้โหมด Stochastic และทำซ้ำค่าเดิมเพื่อดู',
      fxMean: 'ค่าเฉลี่ย',
      fxCiRange: 'CI 95%',
      fxCiUpper: 'ขอบบน CI 95%',
      fxCiLower: 'ขอบล่าง CI 95%',
      fxPngMain: 'กราฟผลกระทบหลักของ {y}',
      fxPngInteraction: 'กราฟปฏิสัมพันธ์ของ {y}',
      fxPngRuns: '{n} รอบ',
      fxWatermark: 'Simulated data — Virtual DOE Lab',
    },
  };

  // เติมคำแปลลงพจนานุกรมของหน้า (ไม่ทับ key ที่หน้านั้นมีอยู่แล้ว) — applyTranslations ของหน้าจะแปล data-i18n ให้เอง
  if (global.I18N) {
    Object.keys(DICT).forEach((lang) => {
      global.I18N[lang] = global.I18N[lang] || {};
      Object.keys(DICT[lang]).forEach((key) => {
        if (!(key in global.I18N[lang])) global.I18N[lang][key] = DICT[lang][key];
      });
    });
  }

  const PALETTE = ['#2563eb', '#0ea5e9', '#f59e0b', '#16a34a', '#7c3aed', '#dc2626', '#0f766e', '#b45309'];
  const INK = '#0f172a';
  const NAVY = '#0b1c33';
  const MUTED = '#64748b';
  const GRID = '#e2e8f0';
  const FONT = '"IBM Plex Sans Thai", "Chakra Petch", system-ui, sans-serif';
  const FONT_DISPLAY = '"Chakra Petch", "IBM Plex Sans Thai", system-ui, sans-serif';

  // ค่า t สองหาง 95% ตาม df (1–30) เกินนั้นประมาณด้วย 1.96 + 2.5/df (คลาดไม่เกิน 0.003)
  const T95 = [12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.16, 2.145, 2.131,
    2.12, 2.11, 2.101, 2.093, 2.086, 2.08, 2.074, 2.069, 2.064, 2.06, 2.056, 2.052, 2.048, 2.045, 2.042];
  function tCritical(df) {
    return df <= 30 ? T95[df - 1] : 1.96 + 2.5 / df;
  }

  const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

  /** ระยะห่างเส้นกริดที่อ่านง่าย (1, 2, 2.5, 5 × 10^k) */
  function niceStep(raw) {
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  }

  function stepDecimals(step) {
    const s = String(Number(step.toPrecision(6)));
    return s.includes('.') ? s.split('.')[1].length : 0;
  }

  function create(cfg) {
    const $ = (id) => document.getElementById(id);
    const els = {
      modeRadios: document.querySelectorAll('input[name="effectsMode"]'),
      response: $('effectsResponse'),
      factorX: $('effectsFactorX'),
      factorGroup: $('effectsFactorGroup'),
      factorGroupWrap: $('effectsFactorGroupWrap'),
      title: $('effectsChartTitle'),
      hint: $('effectsChartHint'),
      canvas: $('effectsChart'),
      empty: $('effectsChartEmpty'),
      legend: $('effectsLegend'),
      note: $('effectsNote'),
      pngBtn: $('effectsPngBtn'),
    };
    const card = els.canvas.parentElement;

    const tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    tooltip.hidden = true;
    tooltip.setAttribute('role', 'status');
    card.appendChild(tooltip);

    let targets = []; // จุด/ปลาย error bar ที่วาดอยู่บนจอ (พิกัด CSS px ใน canvas) ใช้หาว่าเมาส์ชี้อะไร
    let current = null; // ข้อมูลกราฟล่าสุด ใช้ซ้ำตอนดาวน์โหลด PNG

    const t = (key) => {
      const dict = (global.I18N && global.I18N[cfg.lang()]) || DICT.en;
      return key in dict ? dict[key] : DICT.en[key] || key;
    };
    const fill = (key, vars) => t(key).replace(/\{(\w+)\}/g, (_, name) => (name in vars ? vars[name] : ''));

    const factor = (key) => cfg.factors.find((f) => f.key === key);
    const responseDef = () => cfg.responses.find((r) => r.key === els.response.value) || cfg.responses[0];
    const plotMode = () => document.querySelector('input[name="effectsMode"]:checked')?.value || 'main';
    const fmtY = (r, v) => `${v.toFixed(r.digits)}${r.unit ? ` ${r.unit}` : ''}`;

    // ---------------------------------------------------------------- ตัวเลือก
    els.response.innerHTML = cfg.responses.map((r) => `<option value="${r.key}"></option>`).join('');
    els.response.value = cfg.responses[0].key;

    function refreshResponseLabels() {
      Array.from(els.response.options).forEach((opt) => {
        const r = cfg.responses.find((x) => x.key === opt.value);
        opt.textContent = t(r.labelKey);
      });
    }

    /** กันเลือกปัจจัยตัวเดียวกันทั้งแกน X และปัจจัยจัดกลุ่ม */
    function syncGroupOptions() {
      const xVal = els.factorX.value;
      Array.from(els.factorGroup.options).forEach((opt) => {
        opt.disabled = opt.value === xVal;
      });
      if (els.factorGroup.value === xVal) {
        const next = Array.from(els.factorGroup.options).find((o) => !o.disabled);
        if (next) els.factorGroup.value = next.value;
      }
      els.factorGroupWrap.hidden = plotMode() !== 'interaction';
    }

    // ---------------------------------------------------------------- คำนวณ
    function orderedValues(key, values) {
      const f = factor(key);
      const unique = [...new Set(values.map(String))];
      if (f && f.levels) return f.levels.filter((l) => unique.includes(l));
      return unique.map(Number).sort((a, b) => a - b).map(String);
    }

    /**
     * pure error: รวมรอบโหมด stochastic ที่ตั้งค่าเหมือนกันทุกตัวใน replicateKeys เป็นกลุ่ม
     * s² = Σ(y − ȳกลุ่ม)² / Σ(nกลุ่ม − 1) นับเฉพาะกลุ่มที่มีอย่างน้อย 2 รอบ
     */
    function pureError(rows, yKey) {
      const groups = new Map();
      rows.forEach((r) => {
        if (r.mode !== 'stochastic') return;
        const k = cfg.replicateKeys.map((key) => String(r[key])).join('|');
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(r[yKey]);
      });
      let ss = 0;
      let df = 0;
      groups.forEach((ys) => {
        if (ys.length < 2) return;
        const m = mean(ys);
        ys.forEach((y) => {
          ss += (y - m) ** 2;
        });
        df += ys.length - 1;
      });
      return {
        df,
        s: df > 0 ? Math.sqrt(ss / df) : null,
        hasStochastic: rows.some((r) => r.mode === 'stochastic'),
      };
    }

    function computeSeries(rows, xKey, groupKey, yKey, pe) {
      const xValues = orderedValues(xKey, rows.map((r) => r[xKey]));
      const halfWidth = (n) => (pe.s != null ? (tCritical(pe.df) * pe.s) / Math.sqrt(n) : null);
      const pointsOf = (subset) =>
        xValues
          .map((xv) => {
            const ys = subset.filter((r) => String(r[xKey]) === xv).map((r) => r[yKey]);
            if (ys.length === 0) return null;
            return { x: xv, y: mean(ys), n: ys.length, ci: halfWidth(ys.length) };
          })
          .filter(Boolean);

      if (!groupKey) return { xValues, series: [{ label: null, points: pointsOf(rows) }] };
      const groupValues = orderedValues(groupKey, rows.map((r) => r[groupKey]));
      return {
        xValues,
        series: groupValues.map((gv) => ({
          label: factor(groupKey).format(gv),
          points: pointsOf(rows.filter((r) => String(r[groupKey]) === gv)),
        })),
      };
    }

    // ---------------------------------------------------------------- วาด
    /**
     * วาดกราฟลง context ที่ตำแหน่ง (0,0) ขนาด W×H (หน่วย CSS px)
     * opts: { scale, xLabel, yLabel, response, xKey, collect }  scale ขยายตัวอักษร/เส้นสำหรับรูป PNG
     */
    function draw(ctx, W, H, data, opts) {
      const s = opts.scale || 1;
      const pad = { left: 62 * s, right: 18 * s, top: 14 * s, bottom: 50 * s };
      const x0 = pad.left;
      const x1 = W - pad.right;
      const y0 = pad.top;
      const y1 = H - pad.bottom;
      const all = data.series.flatMap((se) => se.points);

      // ช่วงแกน Y ครอบทั้งจุดและปลาย error bar
      let lo = Math.min(...all.map((p) => p.y - (p.ci || 0)));
      let hi = Math.max(...all.map((p) => p.y + (p.ci || 0)));
      const allPositive = all.every((p) => p.y >= 0);
      if (hi - lo < 1e-9) {
        const d = Math.max(Math.abs(hi) * 0.1, 0.1);
        lo -= d;
        hi += d;
      } else {
        const m = (hi - lo) * 0.12;
        lo -= m;
        hi += m;
      }
      if (allPositive && lo < 0) lo = 0;
      const step = niceStep((hi - lo) / 4);
      lo = Math.floor(lo / step) * step;
      hi = Math.ceil(hi / step) * step;
      const decimals = stepDecimals(step);
      const toY = (v) => y1 - ((v - lo) / (hi - lo)) * (y1 - y0);

      // ตำแหน่งแกน X: ค่าเดียว = กลางกราฟ, หลายค่า = เว้นระยะเท่ากันตามลำดับ (ไม่ชิดขอบ)
      const nx = data.xValues.length;
      const inset = Math.min(36 * s, (x1 - x0) / 6);
      const xIndex = new Map(data.xValues.map((v, i) => [v, i]));
      const baseX = (xv) =>
        nx === 1 ? (x0 + x1) / 2 : x0 + inset + (xIndex.get(xv) * (x1 - x0 - 2 * inset)) / (nx - 1);
      // interaction ที่มี error bar: เลื่อนแต่ละเส้นออกจากกันเล็กน้อย bar จะได้ไม่ทับกัน
      const k = data.series.length;
      const hasBars = all.some((p) => p.ci != null);
      const dodge = (si) => (k > 1 && hasBars ? (si - (k - 1) / 2) * Math.min(7 * s, 24 / k) : 0);

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // เส้นกริด + ตัวเลขแกน Y
      ctx.font = `${11 * s}px ${FONT}`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let v = lo; v <= hi + step / 2; v += step) {
        const y = toY(v);
        ctx.strokeStyle = GRID;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x1, y);
        ctx.stroke();
        ctx.fillStyle = MUTED;
        ctx.fillText(v.toFixed(decimals), x0 - 8 * s, y);
      }

      // แกน
      ctx.strokeStyle = NAVY;
      ctx.lineWidth = 1.25 * s;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0, y1);
      ctx.lineTo(x1, y1);
      ctx.stroke();

      // ตัวเลขแกน X (ค่าเยอะเกิน ~10 ค่า เว้นบางค่ากันทับกัน)
      const stride = Math.ceil(nx / 10);
      const xf = factor(opts.xKey);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = MUTED;
      data.xValues.forEach((xv, i) => {
        if (i % stride !== 0 && i !== nx - 1) return;
        const px = baseX(xv);
        ctx.strokeStyle = NAVY;
        ctx.beginPath();
        ctx.moveTo(px, y1);
        ctx.lineTo(px, y1 + 4 * s);
        ctx.stroke();
        ctx.fillText(xf.format(xv), px, y1 + 8 * s);
      });

      // ชื่อแกน
      ctx.fillStyle = INK;
      ctx.font = `600 ${12 * s}px ${FONT}`;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(opts.xLabel, (x0 + x1) / 2, H - 6 * s);
      ctx.save();
      ctx.translate(14 * s, (y0 + y1) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textBaseline = 'middle';
      ctx.fillText(opts.yLabel, 0, 0);
      ctx.restore();

      // error bar → เส้น → จุด
      data.series.forEach((se, si) => {
        const color = PALETTE[si % PALETTE.length];
        const pts = se.points.map((p) => ({ ...p, px: baseX(p.x) + dodge(si), py: toY(p.y) }));

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5 * s;
        pts.forEach((p) => {
          if (p.ci == null || p.ci <= 0) return;
          const top = toY(p.y + p.ci);
          const bottom = toY(p.y - p.ci);
          const cap = 5 * s;
          ctx.beginPath();
          ctx.moveTo(p.px, top);
          ctx.lineTo(p.px, bottom);
          ctx.moveTo(p.px - cap, top);
          ctx.lineTo(p.px + cap, top);
          ctx.moveTo(p.px - cap, bottom);
          ctx.lineTo(p.px + cap, bottom);
          ctx.stroke();
          if (opts.collect) {
            targets.push({ kind: 'upper', x: p.px, y: top, point: p, series: se, value: p.y + p.ci });
            targets.push({ kind: 'lower', x: p.px, y: bottom, point: p, series: se, value: p.y - p.ci });
          }
        });

        ctx.lineWidth = 2.5 * s;
        ctx.beginPath();
        pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.px, p.py) : ctx.lineTo(p.px, p.py)));
        ctx.stroke();

        pts.forEach((p) => {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(p.px, p.py, 5 * s, 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = 2.5 * s;
          ctx.stroke();
          if (opts.collect) targets.push({ kind: 'point', x: p.px, y: p.py, point: p, series: se });
        });
      });
      ctx.restore();
    }

    function noteText(pe, r) {
      if (pe.s != null) return fill('fxCi', { s: pe.s.toFixed(r.digits + 1), df: pe.df });
      return pe.hasStochastic ? t('fxNeedReplicates') : t('fxDeterministic');
    }

    function render() {
      refreshResponseLabels();
      syncGroupOptions();
      hideTooltip();
      targets = [];

      const rows = cfg.getResults();
      const mode = plotMode();
      const xKey = els.factorX.value;
      const groupKey = mode === 'interaction' ? els.factorGroup.value : null;
      const r = responseDef();
      const xLabel = factor(xKey).label();
      const yLabel = t(r.labelKey);

      els.title.textContent = groupKey ? `${xLabel} × ${factor(groupKey).label()}` : xLabel;
      els.hint.textContent = fill('fxHint', { y: yLabel });

      const canvas = els.canvas;
      const ctx = canvas.getContext('2d');
      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth || 700;
      const height = canvas.clientHeight || 300;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const sameFactor = groupKey === xKey;
      if (sameFactor || rows.length === 0) {
        els.empty.textContent = sameFactor ? t('fxSameFactor') : t('fxEmpty');
        els.empty.hidden = false;
        els.legend.hidden = true;
        els.legend.innerHTML = '';
        els.note.hidden = true;
        els.pngBtn.disabled = true;
        current = null;
        return;
      }
      els.empty.hidden = true;

      const pe = pureError(rows, r.key);
      const data = computeSeries(rows, xKey, groupKey, r.key, pe);
      draw(ctx, width, height, data, { xLabel, yLabel, response: r, xKey, collect: true });

      if (groupKey) {
        els.legend.hidden = false;
        els.legend.innerHTML = data.series
          .map(
            (se, i) =>
              `<span class="effects-legend-item"><span class="effects-legend-swatch" style="background:${PALETTE[i % PALETTE.length]}"></span>${se.label}</span>`
          )
          .join('');
      } else {
        els.legend.hidden = true;
        els.legend.innerHTML = '';
      }

      els.note.hidden = false;
      els.note.textContent = noteText(pe, r);
      els.pngBtn.disabled = false;
      current = { rows, mode, xKey, groupKey, r, xLabel, yLabel, pe, data };
    }

    // ---------------------------------------------------------------- tooltip
    function hideTooltip() {
      tooltip.hidden = true;
    }

    function showTooltipAt(clientX, clientY) {
      if (!current || targets.length === 0) return hideTooltip();
      const rect = els.canvas.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;
      let best = null;
      let bestScore = 12; // ระยะจับ 12px — จุดได้เปรียบกว่าปลาย bar นิดหน่อยเมื่ออยู่ใกล้กัน
      targets.forEach((tg) => {
        const score = Math.hypot(tg.x - mx, tg.y - my) - (tg.kind === 'point' ? 2 : 0);
        if (score <= bestScore) {
          bestScore = score;
          best = tg;
        }
      });
      if (!best) return hideTooltip();

      const { r, xLabel, xKey } = current;
      const p = best.point;
      const xText = `${xLabel}: ${factor(xKey).format(p.x)}`;
      const group = best.series.label ? `${factor(current.groupKey).label()}: ${best.series.label}<br>` : '';
      if (best.kind === 'point') {
        const ci = p.ci != null ? `<br>${t('fxCiRange')}: ${fmtY(r, p.y - p.ci)} – ${fmtY(r, p.y + p.ci)}` : '';
        tooltip.innerHTML = `<strong>${xText}</strong><br>${group}${t('fxMean')}: ${fmtY(r, p.y)}<br>n = ${p.n}${ci}`;
      } else {
        const label = best.kind === 'upper' ? t('fxCiUpper') : t('fxCiLower');
        tooltip.innerHTML = `<strong>${label}: ${fmtY(r, best.value)}</strong><br>${group}${xText}`;
      }

      tooltip.hidden = false;
      // วางเหนือจุด ไม่ให้ล้นขอบการ์ด (ถ้าเหนือจุดไม่พอ ย้ายไปใต้จุด)
      const left = els.canvas.offsetLeft + best.x;
      const top = els.canvas.offsetTop + best.y;
      const w = tooltip.offsetWidth;
      const h = tooltip.offsetHeight;
      const maxLeft = card.clientWidth - w - 6;
      tooltip.style.left = `${Math.max(6, Math.min(maxLeft, left - w / 2))}px`;
      tooltip.style.top = `${top - h - 12 >= 0 ? top - h - 12 : top + 14}px`;
    }

    els.canvas.addEventListener('pointermove', (e) => showTooltipAt(e.clientX, e.clientY));
    els.canvas.addEventListener('pointerdown', (e) => showTooltipAt(e.clientX, e.clientY));
    els.canvas.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse') hideTooltip();
    });
    document.addEventListener('pointerdown', (e) => {
      if (e.target !== els.canvas) hideTooltip();
    });

    // ---------------------------------------------------------------- PNG
    function downloadPng() {
      if (!current) return;
      const { rows, mode, xKey, groupKey, r, xLabel, yLabel, pe, data } = current;
      const W = 1000;
      const H = 560;
      const ratio = 1.6; // ได้ไฟล์ 1600 × 896 px
      const canvas = document.createElement('canvas');
      canvas.width = W * ratio;
      canvas.height = H * ratio;
      const ctx = canvas.getContext('2d');
      ctx.scale(ratio, ratio);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
      ctx.fillStyle = NAVY;
      ctx.font = `700 22px ${FONT_DISPLAY}`;
      ctx.fillText(fill(mode === 'interaction' ? 'fxPngInteraction' : 'fxPngMain', { y: yLabel }), 32, 42);
      ctx.fillStyle = MUTED;
      ctx.font = `13px ${FONT}`;
      const sub = groupKey ? `${xLabel} × ${factor(groupKey).label()}` : xLabel;
      ctx.fillText(`${sub}  ·  ${fill('fxPngRuns', { n: rows.length })}`, 32, 64);

      // legend (interaction) แถวเดียวมุมขวาบน
      if (groupKey) {
        ctx.font = `13px ${FONT}`;
        let lx = W - 32;
        ctx.textAlign = 'right';
        for (let i = data.series.length - 1; i >= 0; i--) {
          const label = data.series[i].label;
          ctx.fillStyle = INK;
          ctx.fillText(label, lx, 64);
          lx -= ctx.measureText(label).width + 8;
          ctx.fillStyle = PALETTE[i % PALETTE.length];
          ctx.beginPath();
          ctx.arc(lx - 5, 59.5, 5, 0, Math.PI * 2);
          ctx.fill();
          lx -= 26;
        }
        ctx.textAlign = 'left';
      }

      ctx.save();
      ctx.translate(16, 84);
      draw(ctx, W - 32, H - 84 - 48, data, { scale: 1.2, xLabel, yLabel, response: r, xKey, collect: false });
      ctx.restore();

      ctx.font = `12px ${FONT}`;
      ctx.fillStyle = MUTED;
      ctx.textAlign = 'left';
      ctx.fillText(noteText(pe, r), 32, H - 18);
      ctx.textAlign = 'right';
      ctx.fillText(t('fxWatermark'), W - 32, H - 18);

      const name = [cfg.filePrefix, mode === 'interaction' ? 'interaction' : 'main_effects', xKey, groupKey, r.key]
        .filter(Boolean)
        .join('_');
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, 'image/png');
    }

    // ---------------------------------------------------------------- events
    els.modeRadios.forEach((radio) => radio.addEventListener('change', render));
    els.factorX.addEventListener('change', render);
    els.factorGroup.addEventListener('change', render);
    els.response.addEventListener('change', render);
    els.pngBtn.addEventListener('click', downloadPng);

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(render, 120);
    });

    return { render };
  }

  global.EffectsChart = { create };
})(window);
