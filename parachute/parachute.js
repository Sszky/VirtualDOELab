// ============================================================
// 1. ELEMENT HELPERS AND INPUT CONTROLS
// ============================================================

const $ = (id) => document.getElementById(id);

const controls = {
  shape: $("shape"),
  material: $("material"),
  size: $("size"),
  stringLength: $("stringLength"),
  height: $("height"),
};

// ============================================================
// 2. LANGUAGE TEXT
// ============================================================

const i18n = {
  en: {
    eyebrow: "VIRTUAL DOE LAB · MODULE 01",
    title: "Parachute experiment",
    subtitle: "Change four factors, run the drop, and compare the response.",
    factors: "Set factors",
    reset: "Reset",
    shape: "Canopy shape",
    round: "Round",
    square: "Square",
    hexagon: "Hexagon",
    material: "Material",
    plastic: "Plastic",
    nylon: "Nylon",
    paper: "Paper",
    size: "Canopy diameter",
    string: "String length",
    height: "Drop height",
    mode: "Experiment mode",
    deterministic: "Deterministic",
    stochastic: "Stochastic",
    detHint: "Same factors always produce the same result.",
    stochHint: "Adds random noise to imitate real experiments.",
    run: "Run experiment",
    simulate: "Simulate",
    ready: "Ready",
    running: "Running",
    complete: "Complete",
    fallTime: "Fall time",
    velocity: "Impact speed",
    drag: "Drag coefficient",
    resultsLabel: "EXPERIMENT DATA",
    results: "Run history",
    clear: "Clear",
    export: "Export CSV",
    sizeShort: "Size",
    stringShort: "String",
    empty: "Run your first experiment to collect data.",
    chart: "Main effects preview",
    chartHint: "Mean fall time by canopy size",
    chartEmpty: "Complete at least two runs to compare results.",
    modelTitle: "How the model works",
    modelText:
      "The simulator integrates gravity and quadratic air resistance in small time steps. Shape and material affect the drag coefficient; canopy size controls projected area; string length applies a small stability adjustment. Stochastic mode adds normally distributed experimental noise.",
    educational: "Educational simulation — results are model estimates.",
  },

  th: {
    eyebrow: "ห้องทดลอง DOE เสมือน · โมดูล 01",
    title: "การทดลองร่มชูชีพ",
    subtitle: "ปรับปัจจัยทั้งสี่ ทดลองปล่อยร่ม และเปรียบเทียบผลตอบสนอง",
    factors: "กำหนดปัจจัย",
    reset: "รีเซ็ต",
    shape: "รูปทรงร่ม",
    round: "วงกลม",
    square: "สี่เหลี่ยม",
    hexagon: "หกเหลี่ยม",
    material: "วัสดุ",
    plastic: "พลาสติก",
    nylon: "ไนลอน",
    paper: "กระดาษ",
    size: "เส้นผ่านศูนย์กลางร่ม",
    string: "ความยาวเชือก",
    height: "ความสูงที่ปล่อย",
    mode: "โหมดการทดลอง",
    deterministic: "ค่าคงที่",
    stochastic: "มีความสุ่ม",
    detHint: "ปัจจัยเดิมจะให้ผลลัพธ์เท่าเดิมเสมอ",
    stochHint: "เพิ่มสัญญาณรบกวนแบบสุ่มให้เหมือนการทดลองจริง",
    run: "เริ่มการทดลอง",
    simulate: "การจำลอง",
    ready: "พร้อม",
    running: "กำลังทดลอง",
    complete: "เสร็จแล้ว",
    fallTime: "เวลาตก",
    velocity: "ความเร็วขณะถึงพื้น",
    drag: "สัมประสิทธิ์แรงต้าน",
    resultsLabel: "ข้อมูลการทดลอง",
    results: "ประวัติการทดลอง",
    clear: "ล้างข้อมูล",
    export: "ส่งออก CSV",
    sizeShort: "ขนาดร่ม",
    stringShort: "ความยาวเชือก",
    empty: "เริ่มการทดลองครั้งแรกเพื่อบันทึกข้อมูล",
    chart: "ตัวอย่างกราฟ Main effects",
    chartHint: "เวลาเฉลี่ยแยกตามขนาดร่ม",
    chartEmpty: "ทดลองอย่างน้อยสองครั้งเพื่อเปรียบเทียบผล",
    modelTitle: "แบบจำลองทำงานอย่างไร",
    modelText:
      "ระบบคำนวณแรงโน้มถ่วงและแรงต้านอากาศแบบกำลังสองทีละช่วงเวลาสั้น ๆ รูปทรงและวัสดุมีผลต่อค่าสัมประสิทธิ์แรงต้าน ขนาดร่มกำหนดพื้นที่รับลม และความยาวเชือกปรับเสถียรภาพเล็กน้อย โหมดสุ่มจะเพิ่มค่าความคลาดเคลื่อนแบบแจกแจงปกติ",
    educational: "สื่อเพื่อการศึกษา — ผลลัพธ์เป็นค่าประมาณจากแบบจำลอง",
  },
};

// ============================================================
// 3. APPLICATION STATE AND SIMULATION CONSTANTS
// ============================================================

let language = "en";
let runs = [];
let animationId = null;

const shapeCd = {
  round: 1.5,
  square: 1.28,
  hexagon: 1.4,
};

const materialFactor = {
  plastic: 1.02,
  nylon: 1.08,
  paper: 0.92,
};

// These colors match the burgundy CSS theme.
const colors = {
  plastic: "#a61936",
  nylon: "#7a0019",
  paper: "#d5a62e",
};

// ============================================================
// 4. UPDATE THE PARACHUTE PREVIEW
// ============================================================

function updateLabels() {
  $("sizeOutput").value = `${controls.size.value} cm`;
  $("stringOutput").value = `${controls.stringLength.value} cm`;
  $("heightOutput").value = `${controls.height.value} m`;

  $("maxHeight").textContent = `${controls.height.value} m`;
  $("midHeight").textContent = `${controls.height.value / 2} m`;

  $("canopy").className = `canopy ${controls.shape.value}`;
  $("canopy").style.background = colors[controls.material.value];

  const canopyWidth =
    85 + (Number(controls.size.value) - 30) * 1.15;

  const cordLength =
    28 + (Number(controls.stringLength.value) - 20) * 0.45;

  $("parachute").style.setProperty(
    "--canopy",
    `${canopyWidth}px`,
  );

  $("parachute").style.setProperty(
    "--cord",
    `${cordLength}px`,
  );
}

// ============================================================
// 5. RANDOM EXPERIMENTAL NOISE
// ============================================================

function normalNoise() {
  let u = 0;
  let v = 0;

  while (u === 0) {
    u = Math.random();
  }

  while (v === 0) {
    v = Math.random();
  }

  return (
    Math.sqrt(-2 * Math.log(u)) *
    Math.cos(2 * Math.PI * v)
  );
}

// ============================================================
// 6. PHYSICS CALCULATION
// ============================================================

function simulate() {
  // Convert canopy diameter from centimetres to metres.
  const diameter =
    Number(controls.size.value) / 100;

  // Area of a circular canopy.
  const area =
    Math.PI * (diameter / 2) ** 2;

  // Physical constants.
  const mass = 0.12;
  const airDensity = 1.225;
  const gravity = 9.81;
  const timeStep = 0.005;

  // Calculate drag coefficient using selected factors.
  const dragCoefficient =
    shapeCd[controls.shape.value] *
    materialFactor[controls.material.value] *
    (
      1 +
      (Number(controls.stringLength.value) - 40) *
        0.0015
    );

  let remainingHeight =
    Number(controls.height.value);

  let velocity = 0;
  let time = 0;

  // Calculate movement until the parachute reaches the ground.
  while (remainingHeight > 0 && time < 60) {
    const dragForce =
      0.5 *
      airDensity *
      dragCoefficient *
      area *
      velocity ** 2;

    const acceleration =
      gravity - dragForce / mass;

    velocity = Math.max(
      0,
      velocity + acceleration * timeStep,
    );

    remainingHeight -=
      velocity * timeStep;

    time += timeStep;
  }

  const selectedMode = document.querySelector(
    "input[name=mode]:checked",
  ).value;

  // Add random variation in stochastic mode.
  if (selectedMode === "stochastic") {
    const noise = normalNoise();

    time *= 1 + noise * 0.035;
    velocity *= 1 + noise * 0.02;
  }

  return {
    time: Math.max(0.1, time),
    velocity: velocity,
    cd: dragCoefficient,
  };
}

// ============================================================
// 7. RUN THE ANIMATION
// ============================================================

function run() {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }

  const result = simulate();

  const duration = Math.min(
    5000,
    Math.max(1600, result.time * 650),
  );

  const startTime = performance.now();

  $("status").className = "status running";
  $("status").textContent =
    i18n[language].running;

  $("runButton").disabled = true;

  $("timeValue").textContent = "…";
  $("velocityValue").textContent = "…";
  $("dragValue").textContent =
    result.cd.toFixed(2);

  function animateFrame(currentTime) {
    const progress = Math.min(
      1,
      (currentTime - startTime) / duration,
    );

    const easedProgress =
      progress < 0.65
        ? progress * 0.78
        : 0.507 +
          (progress - 0.65) * 1.408;

    const parachutePosition =
      18 + easedProgress * 285;

    $("parachute").style.top =
      `${parachutePosition}px`;

    if (progress < 1) {
      animationId =
        requestAnimationFrame(animateFrame);
    } else {
      finishExperiment(result);
    }
  }

  animationId =
    requestAnimationFrame(animateFrame);
}

// ============================================================
// 8. SAVE THE EXPERIMENT RESULT
// ============================================================

function finishExperiment(result) {
  $("status").className = "status done";
  $("status").textContent =
    i18n[language].complete;

  $("runButton").disabled = false;

  $("timeValue").textContent =
    result.time.toFixed(2);

  $("velocityValue").textContent =
    result.velocity.toFixed(2);

  const selectedMode = document.querySelector(
    "input[name=mode]:checked",
  ).value;

  const experiment = {
    run: runs.length + 1,
    shape: controls.shape.value,
    material: controls.material.value,
    size: Number(controls.size.value),
    string: Number(controls.stringLength.value),
    height: Number(controls.height.value),
    mode: selectedMode,
    time: Number(result.time.toFixed(3)),
    velocity: Number(
      result.velocity.toFixed(3),
    ),
    cd: Number(result.cd.toFixed(3)),
  };

  runs.push(experiment);

  renderHistory();
  drawChart();
}

// ============================================================
// 9. EXPERIMENT HISTORY TABLE
// ============================================================

function renderHistory() {
  const tableBody = $("historyBody");

  if (runs.length === 0) {
    tableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="7">
          ${i18n[language].empty}
        </td>
      </tr>
    `;

    return;
  }

  tableBody.innerHTML = [...runs]
    .reverse()
    .map((experiment) => {
      const runNumber = String(
        experiment.run,
      ).padStart(2, "0");

      return `
        <tr>
          <td>#${runNumber}</td>

          <td>
            ${i18n[language][experiment.shape]}
          </td>

          <td>
            ${i18n[language][experiment.material]}
          </td>

          <td>${experiment.size} cm</td>

          <td>${experiment.string} cm</td>

          <td>
            ${i18n[language][experiment.mode]}
          </td>

          <td>
            <strong>
              ${experiment.time.toFixed(2)} s
            </strong>
          </td>
        </tr>
      `;
    })
    .join("");
}

// ============================================================
// 10. MAIN EFFECTS CHART
// ============================================================

function drawChart() {
  const canvas = $("chart");
  const context = canvas.getContext("2d");

  const pixelRatio =
    window.devicePixelRatio || 1;

  const width =
    canvas.clientWidth || 500;

  const height =
    canvas.clientHeight || 210;

  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;

  context.scale(pixelRatio, pixelRatio);
  context.clearRect(0, 0, width, height);

  if (runs.length < 2) {
    $("chartEmpty").hidden = false;
    return;
  }

  $("chartEmpty").hidden = true;

  // Group fall times by canopy size.
  const groups = {};

  runs.forEach((experiment) => {
    if (!groups[experiment.size]) {
      groups[experiment.size] = [];
    }

    groups[experiment.size].push(
      experiment.time,
    );
  });

  // Calculate mean fall time for each size.
  const points = Object.keys(groups)
    .sort((a, b) => Number(a) - Number(b))
    .map((size) => {
      const times = groups[size];

      const totalTime = times.reduce(
        (total, currentTime) =>
          total + currentTime,
        0,
      );

      return {
        x: Number(size),
        y: totalTime / times.length,
      };
    });

  const padding = {
    left: 43,
    right: 16,
    top: 18,
    bottom: 34,
  };

  const minimumY =
    Math.min(
      ...points.map((point) => point.y),
    ) * 0.95;

  const maximumY =
    Math.max(
      ...points.map((point) => point.y),
    ) *
      1.05 || 1;

  const xStep =
    (width -
      padding.left -
      padding.right) /
    Math.max(1, points.length - 1);

  function convertToY(value) {
    const graphHeight =
      height -
      padding.top -
      padding.bottom;

    return (
      padding.top +
      ((maximumY - value) /
        (maximumY - minimumY || 1)) *
        graphHeight
    );
  }

  const styles =
    getComputedStyle(document.body);

  context.strokeStyle =
    styles.getPropertyValue("--line");

  context.fillStyle =
    styles.getPropertyValue("--muted");

  context.lineWidth = 1;
  context.font = "11px system-ui";

  // Draw horizontal grid lines.
  for (let index = 0; index < 4; index++) {
    const y =
      padding.top +
      (
        index *
        (
          height -
          padding.top -
          padding.bottom
        )
      ) /
        3;

    const labelValue =
      maximumY -
      (
        index *
        (maximumY - minimumY)
      ) /
        3;

    context.beginPath();
    context.moveTo(padding.left, y);
    context.lineTo(
      width - padding.right,
      y,
    );
    context.stroke();

    context.fillText(
      labelValue.toFixed(1),
      4,
      y + 4,
    );
  }

  // Draw burgundy chart line.
  context.strokeStyle = "#a61936";
  context.lineWidth = 3;
  context.beginPath();

  points.forEach((point, index) => {
    const x =
      padding.left + index * xStep;

    const y = convertToY(point.y);

    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });

  context.stroke();

  // Draw chart points.
  points.forEach((point, index) => {
    const x =
      padding.left + index * xStep;

    const y = convertToY(point.y);

    context.fillStyle = "#ffffff";
    context.beginPath();

    context.arc(
      x,
      y,
      5,
      0,
      Math.PI * 2,
    );

    context.fill();

    context.strokeStyle = "#7a0019";
    context.lineWidth = 3;
    context.stroke();

    context.fillStyle =
      styles.getPropertyValue("--muted");

    context.fillText(
      `${point.x} cm`,
      x - 15,
      height - 10,
    );
  });
}

// ============================================================
// 11. EXPORT RESULTS AS CSV
// ============================================================

function exportCSV() {
  if (runs.length === 0) {
    return;
  }

  const columns = [
    "run",
    "shape",
    "material",
    "size_cm",
    "string_cm",
    "height_m",
    "mode",
    "fall_time_s",
    "impact_velocity_m_s",
    "drag_coefficient",
  ];

  const rows = runs.map((experiment) => [
    experiment.run,
    experiment.shape,
    experiment.material,
    experiment.size,
    experiment.string,
    experiment.height,
    experiment.mode,
    experiment.time,
    experiment.velocity,
    experiment.cd,
  ]);

  const csvContent = [columns, ...rows]
    .map((row) => row.join(","))
    .join("\n");

  const csvFile = new Blob(
    [csvContent],
    {
      type: "text/csv",
    },
  );

  const downloadLink =
    document.createElement("a");

  downloadLink.href =
    URL.createObjectURL(csvFile);

  downloadLink.download =
    "parachute-experiments.csv";

  downloadLink.click();

  URL.revokeObjectURL(
    downloadLink.href,
  );
}

// ============================================================
// 12. RESET CONTROLS
// ============================================================

function resetControls() {
  controls.shape.value = "round";
  controls.material.value = "plastic";
  controls.size.value = 50;
  controls.stringLength.value = 40;
  controls.height.value = 20;

  document.querySelector(
    'input[value="deterministic"]',
  ).checked = true;

  $("modeHint").textContent =
    i18n[language].detHint;

  $("parachute").style.top = "18px";

  updateLabels();
}

// ============================================================
// 13. CHANGE EXPERIMENT MODE
// ============================================================

function updateModeHint(selectedRadio) {
  const hintKey =
    selectedRadio.value === "stochastic"
      ? "stochHint"
      : "detHint";

  $("modeHint").textContent =
    i18n[language][hintKey];
}

// ============================================================
// 14. CHANGE LANGUAGE
// ============================================================

function changeLanguage() {
  language =
    language === "en" ? "th" : "en";

  $("languageButton").textContent =
    language === "en" ? "TH" : "EN";

  document.documentElement.lang =
    language;

  document
    .querySelectorAll("[data-i18n]")
    .forEach((element) => {
      const textKey =
        element.dataset.i18n;

      element.textContent =
        i18n[language][textKey];
    });

  const selectedMode =
    document.querySelector(
      "input[name=mode]:checked",
    ).value;

  const hintKey =
    selectedMode === "stochastic"
      ? "stochHint"
      : "detHint";

  $("modeHint").textContent =
    i18n[language][hintKey];

  renderHistory();
  drawChart();
}

// ============================================================
// 15. CHANGE COLOR THEME
// ============================================================

function changeTheme() {
  document.body.classList.toggle("dark");

  const darkModeEnabled =
    document.body.classList.contains(
      "dark",
    );

  $("themeButton").textContent =
    darkModeEnabled ? "☀" : "☾";

  drawChart();
}

// ============================================================
// 16. EVENT LISTENERS
// ============================================================

Object.values(controls).forEach(
  (control) => {
    control.addEventListener(
      "input",
      updateLabels,
    );
  },
);

document
  .querySelectorAll("input[name=mode]")
  .forEach((radioButton) => {
    radioButton.addEventListener(
      "change",
      () => {
        updateModeHint(radioButton);
      },
    );
  });

$("runButton").addEventListener(
  "click",
  run,
);

$("resetButton").addEventListener(
  "click",
  resetControls,
);

$("clearButton").addEventListener(
  "click",
  () => {
    runs = [];
    renderHistory();
    drawChart();
  },
);

$("exportButton").addEventListener(
  "click",
  exportCSV,
);

$("languageButton").addEventListener(
  "click",
  changeLanguage,
);

$("themeButton").addEventListener(
  "click",
  changeTheme,
);

window.addEventListener(
  "resize",
  drawChart,
);

// ============================================================
// 17. INITIAL PAGE SETUP
// ============================================================

updateLabels();
drawChart();