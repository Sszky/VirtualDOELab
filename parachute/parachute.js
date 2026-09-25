// ============================================================
// 1. ELEMENTS AND INPUT CONTROLS
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
    subtitle:
      "Change four factors, run the drop, and compare the response.",
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
    drive: "Save to Drive",
    driveSaving: "Saving...",
    driveSaved: "Saved!",
    sizeShort: "Size",
    stringShort: "String",
    empty: "Run your first experiment to collect data.",
    chart: "Main effects preview",
    chartHint: "Mean fall time by canopy size",
    chartEmpty: "Complete at least two runs to compare results.",
    modelTitle: "How the model works",
    modelText:
      "The simulator integrates gravity and quadratic air resistance in small time steps. Shape and material affect the drag coefficient; canopy size controls projected area; string length applies a small stability adjustment. Stochastic mode adds normally distributed experimental noise.",
    educational:
      "Educational simulation — results are model estimates.",
  },

  th: {
    eyebrow: "ห้องทดลอง DOE เสมือน · โมดูล 01",
    title: "การทดลองร่มชูชีพ",
    subtitle:
      "ปรับทั้ง 4 ตัวแปร ทดลองปล่อยร่ม และนำผลลัพธ์มาเปรียบเทียบ",
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
    drive: "บันทึกลง Drive",
    driveSaving: "กำลังบันทึก...",
    driveSaved: "บันทึกแล้ว!",
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
// 3. APPLICATION STATE AND CONSTANTS
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

const colors = {
  plastic: "#a61936",
  nylon: "#7a0019",
  paper: "#d5a62e",
};

// ============================================================
// 4. UPDATE PARACHUTE PREVIEW
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

  $("parachute").style.setProperty("--canopy", `${canopyWidth}px`);
  $("parachute").style.setProperty("--cord", `${cordLength}px`);
}

// ============================================================
// 5. RANDOM EXPERIMENTAL NOISE
// ============================================================

function normalNoise() {
  let u = 0;
  let v = 0;

  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();

  return (
    Math.sqrt(-2 * Math.log(u)) *
    Math.cos(2 * Math.PI * v)
  );
}

// ============================================================
// 6. PHYSICS CALCULATION
// ============================================================

function simulate() {
  const diameter = Number(controls.size.value) / 100;
  const area = Math.PI * (diameter / 2) ** 2;

  const mass = 0.12;
  const airDensity = 1.225;
  const gravity = 9.81;
  const timeStep = 0.005;

  const dragCoefficient =
    shapeCd[controls.shape.value] *
    materialFactor[controls.material.value] *
    (1 + (Number(controls.stringLength.value) - 40) * 0.0015);

  let remainingHeight = Number(controls.height.value);
  let velocity = 0;
  let time = 0;

  while (remainingHeight > 0 && time < 60) {
    const dragForce =
      0.5 *
      airDensity *
      dragCoefficient *
      area *
      velocity ** 2;

    const acceleration = gravity - dragForce / mass;

    velocity = Math.max(0, velocity + acceleration * timeStep);
    remainingHeight -= velocity * timeStep;
    time += timeStep;
  }

  const selectedMode = document.querySelector(
    "input[name=mode]:checked"
  ).value;

  if (selectedMode === "stochastic") {
    const noise = normalNoise();
    time *= 1 + noise * 0.035;
    velocity *= 1 + noise * 0.02;
  }

  return {
    time: Math.max(0.1, time),
    velocity,
    cd: dragCoefficient,
  };
}

// ============================================================
// 7. RUN ANIMATION
// ============================================================

function run() {
  if (animationId) cancelAnimationFrame(animationId);

  const result = simulate();

  const duration = Math.min(
    5000,
    Math.max(1600, result.time * 650)
  );

  const startTime = performance.now();

  $("status").className = "status running";
  $("status").textContent = i18n[language].running;
  $("runButton").disabled = true;

  $("timeValue").textContent = "…";
  $("velocityValue").textContent = "…";
  $("dragValue").textContent = result.cd.toFixed(2);

  function animateFrame(currentTime) {
    const progress = Math.min(
      1,
      (currentTime - startTime) / duration
    );

    const easedProgress =
      progress < 0.65
        ? progress * 0.78
        : 0.507 + (progress - 0.65) * 1.408;

    const parachutePosition = 18 + easedProgress * 285;
    $("parachute").style.top = `${parachutePosition}px`;

    if (progress < 1) {
      animationId = requestAnimationFrame(animateFrame);
    } else {
      finishExperiment(result);
    }
  }

  animationId = requestAnimationFrame(animateFrame);
}

// ============================================================
// 8. SAVE EXPERIMENT RESULT
// ============================================================

function finishExperiment(result) {
  $("status").className = "status done";
  $("status").textContent = i18n[language].complete;
  $("runButton").disabled = false;

  $("timeValue").textContent = result.time.toFixed(2);
  $("velocityValue").textContent = result.velocity.toFixed(2);

  const selectedMode = document.querySelector(
    "input[name=mode]:checked"
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
    velocity: Number(result.velocity.toFixed(3)),
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
        <td colspan="2">${i18n[language].empty}</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = [...runs]
    .reverse()
    .map((experiment) => {
      const runNumber = String(experiment.run).padStart(2, "0");

      const details = [
        i18n[language][experiment.shape],
        i18n[language][experiment.material],
        `${experiment.size} cm`,
        `${experiment.string} cm`,
        i18n[language][experiment.mode],
      ].join(" · ");

      return `
        <tr>
          <td>
            #${runNumber}
            <small class="record-details">${details}</small>
          </td>
          <td>
            <strong>${experiment.time.toFixed(2)} s</strong>
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
  const chartView = $("chartView").value;

  const width = canvas.clientWidth || 500;
  const height = canvas.clientHeight || 210;
  const pixelRatio = window.devicePixelRatio || 1;

  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);

  $("chartHint").textContent =
    chartView === "run"
      ? language === "th"
        ? "เวลาตกของการทดลองแต่ละครั้ง"
        : "Fall time for each experiment run"
      : language === "th"
        ? "เวลาเฉลี่ยแยกตามขนาดร่ม"
        : "Mean fall time by canopy size";

  if (runs.length === 0) {
    $("chartEmpty").hidden = false;
    $("chartEmpty").textContent =
      language === "th"
        ? "เริ่มทดลองเพื่อแสดงกราฟ"
        : "Run an experiment to display the chart.";
    return;
  }

  $("chartEmpty").hidden = true;

  let points;

  if (chartView === "run") {
    // แสดงทุกการทดลองตามลำดับที่กด Run
    points = runs.map((experiment) => ({
      label: `#${experiment.run}`,
      x: experiment.run,
      y: experiment.time,
    }));
  } else {
    // รวมการทดลองที่ขนาดร่มเท่ากัน แล้วหาเวลาเฉลี่ย
    const groups = new Map();

    runs.forEach((experiment) => {
      if (!groups.has(experiment.size)) {
        groups.set(experiment.size, []);
      }

      groups.get(experiment.size).push(experiment.time);
    });

    points = [...groups.entries()]
      .sort(([sizeA], [sizeB]) => sizeA - sizeB)
      .map(([size, times]) => ({
        label: `${size} cm`,
        x: size,
        y:
          times.reduce((sum, time) => sum + time, 0) /
          times.length,
      }));
  }

  const padding = {
    left: 44,
    right: 24,
    top: 24,
    bottom: 36,
  };

  const graphWidth =
    width - padding.left - padding.right;

  const graphHeight =
    height - padding.top - padding.bottom;

  const maxTime = Math.max(
    1,
    ...points.map((point) => point.y),
  );

  // เริ่มแกน Y ที่ 0 เพื่อให้เห็นความต่างตามสัดส่วนจริง
  const yMax = Math.ceil(maxTime * 1.15);

  const xMin = Math.min(...points.map((point) => point.x));
  const xMax = Math.max(...points.map((point) => point.x));

  function toX(value) {
    if (xMin === xMax) {
      return padding.left + graphWidth / 2;
    }

    return (
      padding.left +
      ((value - xMin) / (xMax - xMin)) * graphWidth
    );
  }

  function toY(value) {
    return (
      padding.top +
      (1 - value / yMax) * graphHeight
    );
  }

  const styles = getComputedStyle(document.body);
  const lineColor =
    styles.getPropertyValue("--line").trim() || "#e7dadd";

  const mutedColor =
    styles.getPropertyValue("--muted").trim() || "#79656a";

  context.font = "11px system-ui";
  context.textBaseline = "middle";

  // เส้นตารางและตัวเลขบนแกน Y
  for (let index = 0; index <= 4; index++) {
    const value = (yMax * (4 - index)) / 4;
    const y = padding.top + (index * graphHeight) / 4;

    context.beginPath();
    context.strokeStyle = lineColor;
    context.lineWidth = 1;
    context.moveTo(padding.left, y);
    context.lineTo(width - padding.right, y);
    context.stroke();

    context.fillStyle = mutedColor;
    context.fillText(value.toFixed(1), 4, y);
  }

  // เส้นเชื่อมจุด: จะแสดงเมื่อมีอย่างน้อย 2 จุด
  if (points.length > 1) {
    context.beginPath();

    points.forEach((point, index) => {
      const x = toX(point.x);
      const y = toY(point.y);

      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    });

    context.strokeStyle = "#a61936";
    context.lineWidth = 3;
    context.stroke();
  }

  // จุดข้อมูลและชื่อบนแกน X
  const labelEvery = Math.max(
    1,
    Math.ceil(points.length / 8),
  );

  points.forEach((point, index) => {
    const x = toX(point.x);
    const y = toY(point.y);

    context.beginPath();
    context.arc(x, y, 5, 0, Math.PI * 2);
    context.fillStyle = "#ffffff";
    context.fill();

    context.strokeStyle = "#7a0019";
    context.lineWidth = 3;
    context.stroke();

    if (
      index % labelEvery === 0 ||
      index === points.length - 1
    ) {
      context.fillStyle = mutedColor;
      context.textAlign = "center";
      context.fillText(
        point.label,
        x,
        height - 15,
      );
    }
  });

  context.textAlign = "start";
}
// ============================================================
// 11. CREATE CSV CONTENT
// ============================================================

function createCSVContent() {
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

  return [columns, ...rows]
    .map((row) => row.join(","))
    .join("\n");
}

// ============================================================
// 12. EXPORT CSV TO COMPUTER
// ============================================================

function exportCSV() {
  if (runs.length === 0) {
    alert("Please run an experiment first.");
    return;
  }

  const csvContent = createCSVContent();

  const csvFile = new Blob([csvContent], {
    type: "text/csv;charset=utf-8",
  });

  const downloadLink = document.createElement("a");
  downloadLink.href = URL.createObjectURL(csvFile);
  downloadLink.download = "parachute-experiments.csv";
  downloadLink.click();

  URL.revokeObjectURL(downloadLink.href);
}

// ============================================================
// 13. RESET CONTROLS
// ============================================================

function resetControls() {
  controls.shape.value = "round";
  controls.material.value = "plastic";
  controls.size.value = 50;
  controls.stringLength.value = 40;
  controls.height.value = 20;

  document.querySelector(
    'input[value="deterministic"]'
  ).checked = true;

  $("modeHint").textContent = i18n[language].detHint;
  $("parachute").style.top = "18px";

  updateLabels();
}

// ============================================================
// 14. UPDATE EXPERIMENT MODE
// ============================================================

function updateModeHint(selectedRadio) {
  const hintKey =
    selectedRadio.value === "stochastic"
      ? "stochHint"
      : "detHint";

  $("modeHint").textContent = i18n[language][hintKey];
}

// ============================================================
// 15. CHANGE LANGUAGE
// ============================================================

function changeLanguage() {
  language = language === "en" ? "th" : "en";

  $("languageButton").textContent =
    language === "en" ? "TH" : "EN";

  document.documentElement.lang = language;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const textKey = element.dataset.i18n;
    element.textContent = i18n[language][textKey];
  });

  const selectedMode = document.querySelector(
    "input[name=mode]:checked"
  ).value;

  const hintKey =
    selectedMode === "stochastic" ? "stochHint" : "detHint";

  $("modeHint").textContent = i18n[language][hintKey];

  renderHistory();
  drawChart();
}

// ============================================================
// 16. CHANGE COLOR THEME
// ============================================================

function changeTheme() {
  document.body.classList.toggle("dark");

  const darkModeEnabled = document.body.classList.contains("dark");
  $("themeButton").textContent = darkModeEnabled ? "☀" : "☾";

  drawChart();
}

// ============================================================
// 17. GOOGLE DRIVE SETTINGS
// ============================================================

// Replace this with your real OAuth Web Client ID.
const GOOGLE_CLIENT_ID =
  "YOUR_CLIENT_ID.apps.googleusercontent.com";

const GOOGLE_DRIVE_SCOPE =
  "https://www.googleapis.com/auth/drive.file";

let googleTokenClient = null;

// ============================================================
// 18. INITIALIZE GOOGLE AUTHORIZATION
// ============================================================

function initializeGoogleDrive() {
  if (
    typeof google === "undefined" ||
    !google.accounts?.oauth2
  ) {
    alert("Google services are still loading. Please try again.");
    return false;
  }

  googleTokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: GOOGLE_DRIVE_SCOPE,

    callback: async (tokenResponse) => {
      if (
        tokenResponse.error ||
        !tokenResponse.access_token
      ) {
        console.error(tokenResponse);
        alert("Google authorization failed.");
        return;
      }

      await uploadCSVToDrive(tokenResponse.access_token);
    },
  });

  return true;
}

// ============================================================
// 19. REQUEST GOOGLE DRIVE ACCESS
// ============================================================

function saveToGoogleDrive() {
  if (runs.length === 0) {
    alert("Please run an experiment first.");
    return;
  }

  if (GOOGLE_CLIENT_ID.startsWith("YOUR_CLIENT_ID")) {
    alert(
      "Please add your Google OAuth Client ID in parachute.js."
    );
    return;
  }

  if (!googleTokenClient) {
    const initialized = initializeGoogleDrive();
    if (!initialized) return;
  }

  googleTokenClient.requestAccessToken({
    prompt: "",
  });
}

// ============================================================
// 20. UPLOAD CSV TO USER'S GOOGLE DRIVE
// ============================================================

async function uploadCSVToDrive(accessToken) {
  const driveButton = $("driveButton");

  driveButton.disabled = true;
  driveButton.textContent = i18n[language].driveSaving;

  try {
    const csvContent = createCSVContent();
    const fileName = `parachute-experiments-${Date.now()}.csv`;

    const metadata = {
      name: fileName,
      mimeType: "text/csv",
    };

    const boundary = `parachute_doe_${Date.now()}`;

    const requestBody =
      `--${boundary}\r\n` +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      "Content-Type: text/csv; charset=UTF-8\r\n\r\n" +
      `${csvContent}\r\n` +
      `--${boundary}--`;

    const response = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files" +
        "?uploadType=multipart" +
        "&fields=id,name,webViewLink",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: requestBody,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error(errorData);

      throw new Error(
        errorData.error?.message ||
          "Google Drive upload failed."
      );
    }

    const uploadedFile = await response.json();
    driveButton.textContent = i18n[language].driveSaved;

    const openFile = confirm(
      `${uploadedFile.name} was saved to Google Drive. Open it now?`
    );

    if (openFile && uploadedFile.webViewLink) {
      window.open(
        uploadedFile.webViewLink,
        "_blank",
        "noopener,noreferrer"
      );
    }
  } catch (error) {
    console.error(error);

    alert(
      "Unable to save the file to Google Drive: " +
        error.message
    );
  } finally {
    setTimeout(() => {
      driveButton.textContent = i18n[language].drive;
      driveButton.disabled = false;
    }, 1500);
  }
}

// ============================================================
// 21. EVENT LISTENERS
// ============================================================

Object.values(controls).forEach((control) => {
  control.addEventListener("input", updateLabels);
});

document.querySelectorAll("input[name=mode]").forEach((radioButton) => {
  radioButton.addEventListener("change", () => {
    updateModeHint(radioButton);
  });
});

$("runButton").addEventListener("click", run);
$("resetButton").addEventListener("click", resetControls);

$("clearButton").addEventListener("click", () => {
  runs = [];
  renderHistory();
  drawChart();
});

$("exportButton").addEventListener("click", exportCSV);
$("driveButton").addEventListener("click", saveToGoogleDrive);
$("languageButton").addEventListener("click", changeLanguage);
$("themeButton").addEventListener("click", changeTheme);

window.addEventListener("resize", drawChart);

// ============================================================
// 22. INITIAL PAGE SETUP
// ============================================================

updateLabels();
drawChart();