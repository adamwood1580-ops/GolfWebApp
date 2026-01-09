/* ================= GLOBALS ================= */
let coursesDB = {};
let currentCourses = {};
let selectedCourse = null;
let courseSlope, courseRating, coursePar;

let adminSelected = { country: null, county: null, course: null };

/* ================= LOAD COURSE DATABASE ================= */
async function loadCourses() {
  try {
    console.log("Loading course database…");

    // Try ./courses/... first, then courses/... as fallback, with cache-busting
    let res;
    try {
      res = await fetch("./courses/courses-gb.json?v=3");
      if (!res.ok) throw new Error("Bad path ./courses");
    } catch (e) {
      console.warn("Fallback fetch path used:", e.message);
      res = await fetch("courses/courses-gb.json?v=3");
    }

    const text = await res.text();
    console.log("Raw JSON text (first 200 chars):", text.slice(0, 200));

    try {
      coursesDB = JSON.parse(text);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr);
      alert("⚠ Error parsing courses-gb.json. Check console and validate JSON.");
      return;
    }

    console.log("Parsed coursesDB keys:", Object.keys(coursesDB));

    populateCountryDropdowns();
    enableCourseSelectors();
    initAdminSelectors();
  } catch (err) {
    console.error("JSON failed to load at all:", err);
    alert("⚠ Could not load course data at all. Check console for details.");
  }
}

loadCourses();

/* ================= POPULATE COUNTRY DROPDOWNS ================= */
function populateCountryDropdowns() {
  const countrySelect = document.getElementById("country");
  const adminCountry = document.getElementById("adminCountry");

  const countries = Object.keys(coursesDB || {});

  if (countrySelect) {
    countrySelect.innerHTML = '<option value="">Select</option>';
    countries.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      countrySelect.appendChild(opt);
    });
  }

  if (adminCountry) {
    adminCountry.innerHTML = '<option value="">Select</option>';
    countries.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      adminCountry.appendChild(opt);
    });
  }
}

/* ================= NAVIGATION ================= */
function showSection(id, btn) {
  document.querySelectorAll(".section").forEach(section => {
    section.style.display = "none";
  });
  const target = document.getElementById(id);
  if (target) target.style.display = "block";

  document.querySelectorAll(".nav button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

/* ================= 4BBB: COUNTRY & COUNTY SELECTORS ================= */
function enableCourseSelectors() {
  const countrySelect = document.getElementById("country");
  const countySelect = document.getElementById("county");

  if (!countrySelect || !countySelect) return;

  countrySelect.onchange = function () {
    const countryVal = countrySelect.value;
    countySelect.innerHTML = '<option value="">Select</option>';

    const resultsDiv = document.getElementById("courseResults");
    const teeSelectorDiv = document.getElementById("teeSelector");
    if (resultsDiv) resultsDiv.style.display = "none";
    if (teeSelectorDiv) teeSelectorDiv.style.display = "none";

    if (!coursesDB[countryVal]) return;

    Object.keys(coursesDB[countryVal]).forEach(county => {
      const opt = document.createElement("option");
      opt.value = county;
      opt.textContent = county;
      countySelect.appendChild(opt);
    });
  };
}

/* ================= 4BBB: COURSE SEARCH & FILTER ================= */
function searchCourses() {
  const countryVal = document.getElementById("country").value;
  const countyVal = document.getElementById("county").value;
  const resultsDiv = document.getElementById("courseResults");
  const list = document.getElementById("courseList");

  if (!coursesDB[countryVal] || !coursesDB[countryVal][countyVal]) {
    resultsDiv.style.display = "none";
    list.innerHTML = "";
    return;
  }

  currentCourses = coursesDB[countryVal][countyVal];
  list.innerHTML = "";

  Object.keys(currentCourses).sort().forEach(course => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = course;
    btn.onclick = () => selectCourse(course);
    li.appendChild(btn);
    list.appendChild(li);
  });

  resultsDiv.style.display = "block";
}

function filterCourses() {
  const term = document.getElementById("courseSearch").value.toLowerCase();
  document.querySelectorAll("#courseList li button").forEach(btn => {
    btn.parentElement.style.display =
      btn.textContent.toLowerCase().includes(term) ? "block" : "none";
  });
}

/* ================= 4BBB: COURSE & TEE SELECTION ================= */
function selectCourse(courseName) {
  selectedCourse = currentCourses[courseName];
  const teeSelect = document.getElementById("tee");
  const teeSelectorDiv = document.getElementById("teeSelector");

  teeSelect.innerHTML = "";
  if (!selectedCourse || !selectedCourse.tees) {
    teeSelectorDiv.style.display = "none";
    return;
  }

  Object.keys(selectedCourse.tees).forEach(teeName => {
    const opt = document.createElement("option");
    opt.value = teeName;
    opt.textContent = teeName;
    teeSelect.appendChild(opt);
  });

  teeSelectorDiv.style.display = "block";
  applyCourseData();
}

function applyCourseData() {
  if (!selectedCourse) return;
  const teeName = document.getElementById("tee").value;
  const data = selectedCourse.tees[teeName];
  if (!data) return;

  courseSlope = data.slope;
  courseRating = data.rating;
  coursePar = data.par;

  // auto-fill hole pars if defined
  if (Array.isArray(data.holes) && data.holes.length === 18) {
    const stableRows = document.querySelectorAll("#stableTable tbody tr");
    const strokeRows = document.querySelectorAll("#strokeTable tbody tr");
    data.holes.forEach((parVal, i) => {
      if (stableRows[i]) {
        const p = stableRows[i].cells[2].querySelector("input"); // Par col in Stableford
        if (p) p.value = parVal;
      }
      if (strokeRows[i]) {
        const p2 = strokeRows[i].cells[1].querySelector("input"); // Par col in Stroke
        if (p2) p2.value = parVal;
      }
    });
  }

  // auto-fill stroke index if defined
  if (Array.isArray(data.si) && data.si.length === 18) {
    const stableRows = document.querySelectorAll("#stableTable tbody tr");
    data.si.forEach((siVal, i) => {
      if (stableRows[i]) {
        const s = stableRows[i].cells[1].querySelector("input"); // SI col
        if (s) s.value = siVal;
      }
    });
  }

  calculate4BBB();
}

/* ========== SHARED: COURSE HANDICAP FROM INDEX ========== */
function computeCourseHandicapFromIndex(index) {
  if (isNaN(index)) return null;
  if (!courseSlope || !courseRating || !coursePar) {
    alert("Please select a course and tee in the 4BBB tab first.");
    return null;
  }
  const courseHandicap = (index * courseSlope / 113) + (courseRating - coursePar);
  return Math.round(courseHandicap);
}

/* Used by Stableford handicap panel */
function updateStableCourseHandicap() {
  const idxInput = document.getElementById("stableIndex");
  const out = document.getElementById("stableCourseHcp");
  const idx = parseFloat(idxInput.value);

  if (isNaN(idx)) {
    out.value = "";
    return;
  }

  const ch = computeCourseHandicapFromIndex(idx);
  if (ch !== null) out.value = ch;
}

/* Used by Stroke Play handicap panel */
function updateStrokeCourseHandicap() {
  const idxInput = document.getElementById("strokeIndex");
  const out = document.getElementById("strokeCourseHcp");
  const idx = parseFloat(idxInput.value);

  if (isNaN(idx)) {
    out.value = "";
    return;
  }

  const ch = computeCourseHandicapFromIndex(idx);
  if (ch !== null) out.value = ch;
}

/* ================= 4BBB: CALCULATION ================= */
function calculate4BBB() {
  if (!courseSlope || !courseRating || !coursePar) return;

  const rows = document.querySelectorAll("#players tbody tr");
  let playingHandicaps = [];

  rows.forEach(row => row.style.background = "");

  rows.forEach(row => {
    const indexInput = row.cells[1].querySelector("input");
    const index = parseFloat(indexInput.value);

    if (isNaN(index)) {
      row.cells[2].textContent = "";
      row.cells[3].textContent = "";
      row.cells[4].textContent = "";
      return;
    }

    const courseHandicap =
      (index * courseSlope / 113) + (courseRating - coursePar);
    const playingHandicap = courseHandicap * 0.9;

    const roundedCourse = Math.round(courseHandicap);
    const roundedPlaying = Math.round(playingHandicap);

    row.cells[2].textContent = roundedCourse;
    row.cells[3].textContent = roundedPlaying;

    playingHandicaps.push(roundedPlaying);
  });

  if (!playingHandicaps.length) return;

  const lowest = Math.min(...playingHandicaps);

  rows.forEach(row => {
    const playing = parseInt(row.cells[3].textContent);
    if (!isNaN(playing)) {
      row.cells[4].textContent = playing - lowest;
      if (playing === lowest) {
        row.style.background = "#e8f5e9";
      }
    }
  });
}

/* ================= STABLEFORD ================= */
(function buildStableford() {
  const tbody = document.querySelector("#stableTable tbody");
  if (!tbody) return;

  for (let i = 1; i <= 18; i++) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i}</td>
      <td><input type="number"></td>   <!-- SI -->
      <td><input type="number"></td>   <!-- Par -->
      <td><input type="number"></td>   <!-- Gross -->
      <td></td>
    `;
    tbody.appendChild(tr);
  }
})();

function calculateStableford() {
  let total = 0;

  // Get course handicap (can be 0 if not set)
  const chVal = parseInt(document.getElementById("stableCourseHcp").value);
  const courseHcp = isNaN(chVal) ? 0 : Math.max(chVal, 0); // ignore negative for now

  const rows = document.querySelectorAll("#stableTable tbody tr");
  const numHoles = rows.length || 18;

  const baseStrokes = Math.floor(courseHcp / numHoles);
  const extraStrokes = courseHcp % numHoles;

  rows.forEach(row => {
    const si = parseInt(row.cells[1].querySelector("input").value);
    const par = parseInt(row.cells[2].querySelector("input").value);
    const gross = parseInt(row.cells[3].querySelector("input").value);

    if (isNaN(par) || isNaN(gross)) {
      row.cells[4].textContent = "";
      return;
    }

    // Strokes allocated on this hole
    let strokes = baseStrokes;

    // Extra stroke for the hardest `extraStrokes` holes (SI 1..extraStrokes)
    if (
      courseHcp > 0 &&
      !isNaN(si) &&
      si >= 1 &&
      si <= numHoles &&
      si <= extraStrokes
    ) {
      strokes += 1;
    }

    const net = gross - strokes;
    const diff = net - par; // how many over/under par net

    const points =
      diff <= -3 ? 5 :
      diff === -2 ? 4 :
      diff === -1 ? 3 :
      diff === 0 ? 2 :
      diff === 1 ? 1 : 0;

    row.cells[4].textContent = points;
    total += points;
  });

  alert("Total Net Stableford Points: " + total);
}

/* ================= STROKE PLAY ================= */
(function buildStrokePlay() {
  const tbody = document.querySelector("#strokeTable tbody");
  if (!tbody) return;

  for (let i = 1; i <= 18; i++) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i}</td>
      <td><input type="number"></td>   <!-- Par -->
      <td><input type="number"></td>   <!-- Gross -->
    `;
    tbody.appendChild(tr);
  }
})();

function calculateStrokePlay() {
  let total = 0;

  document.querySelectorAll("#strokeTable tbody tr").forEach(row => {
    const gross = parseInt(row.cells[2].querySelector("input").value);
    if (!isNaN(gross)) total += gross;
  });

  document.getElementById("strokeTotal").textContent =
    "Total Gross Score: " + total;
}

/* ================= ADMIN: INITIALISE SELECTORS ================= */
function initAdminSelectors() {
  const adminCountry = document.getElementById("adminCountry");
  const adminCounty = document.getElementById("adminCounty");
  const courseList = document.getElementById("adminCourseList");
  const teeEditor = document.getElementById("teeEditor");

  if (!adminCountry || !adminCounty) return;

  adminCounty.innerHTML = '<option value="">Select</option>';
  if (courseList) courseList.innerHTML = "";
  if (teeEditor) teeEditor.innerHTML = "";

  adminSelected = { country: null, county: null, course: null };
}

/* ================= ADMIN: COUNTRY & COUNTY CHANGE ================= */
function adminCountryChanged() {
  const adminCountry = document.getElementById("adminCountry");
  const adminCounty = document.getElementById("adminCounty");
  const courseList = document.getElementById("adminCourseList");
  const teeEditor = document.getElementById("teeEditor");

  const country = adminCountry.value;

  adminCounty.innerHTML = '<option value="">Select</option>';
  courseList.innerHTML = "";
  teeEditor.innerHTML = "";
  adminSelected = { country: country || null, county: null, course: null };

  if (!country || !coursesDB[country]) return;

  Object.keys(coursesDB[country]).forEach(county => {
    const opt = document.createElement("option");
    opt.value = county;
    opt.textContent = county;
    adminCounty.appendChild(opt);
  });
}

function adminCountyChanged() {
  const country = document.getElementById("adminCountry").value;
  const county = document.getElementById("adminCounty").value;
  const courseList = document.getElementById("adminCourseList");
  const teeEditor = document.getElementById("teeEditor");

  courseList.innerHTML = "";
  teeEditor.innerHTML = "";
  adminSelected = { country, county: county || null, course: null };

  if (!country || !county || !coursesDB[country] || !coursesDB[country][county]) return;

  const courses = coursesDB[country][county];
  const ul = document.createElement("ul");

  Object.keys(courses).sort().forEach(name => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = name;
    btn.onclick = () => adminSelectCourse(name);
    li.appendChild(btn);
    ul.appendChild(li);
  });

  courseList.appendChild(ul);
}

/* ================= ADMIN: SELECT COURSE & EDIT TEES ================= */
function adminSelectCourse(courseName) {
  const country = document.getElementById("adminCountry").value;
  const county = document.getElementById("adminCounty").value;

  if (!country || !county || !coursesDB[country] || !coursesDB[country][county]) return;
  if (!coursesDB[country][county][courseName]) return;

  adminSelected = { country, county, course: courseName };
  renderTeeEditor();
}

function renderTeeEditor() {
  const { country, county, course } = adminSelected;
  const container = document.getElementById("teeEditor");
  if (!container || !country || !county || !course) {
    if (container) container.innerHTML = "";
    return;
  }

  const courseObj = coursesDB[country][county][course];
  const tees = courseObj.tees || {};

  let html = `<h3>${course}</h3>
    <table>
      <thead>
        <tr>
          <th>Tee Name</th>
          <th>Slope</th>
          <th>Rating</th>
          <th>Par</th>
        </tr>
      </thead>
      <tbody>`;

  Object.entries(tees).forEach(([name, data]) => {
    html += `
      <tr>
        <td><input class="tee-name" type="text" value="${name}"></td>
        <td><input class="tee-slope" type="number" step="1" value="${data.slope ?? ""}"></td>
        <td><input class="tee-rating" type="number" step="0.1" value="${data.rating ?? ""}"></td>
        <td><input class="tee-par" type="number" step="1" value="${data.par ?? ""}"></td>
      </tr>`;
  });

  // row for a new tee
  html += `
      <tr>
        <td><input class="tee-name" type="text" placeholder="New tee name"></td>
        <td><input class="tee-slope" type="number" step="1"></td>
        <td><input class="tee-rating" type="number" step="0.1"></td>
        <td><input class="tee-par" type="number" step="1"></td>
      </tr>
      </tbody>
    </table>
    <button type="button" class="action" onclick="saveTeeChanges()">Save Changes</button>
  `;

  container.innerHTML = html;
}

function saveTeeChanges() {
  const { country, county, course } = adminSelected;
  if (!country || !county || !course) return;

  const container = document.getElementById("teeEditor");
  const rows = container.querySelectorAll("tbody tr");
  const newTees = {};

  rows.forEach(row => {
    const name = row.querySelector(".tee-name").value.trim();
    const slopeVal = row.querySelector(".tee-slope").value;
    const ratingVal = row.querySelector(".tee-rating").value;
    const parVal = row.querySelector(".tee-par").value;

    if (!name) return;

    const slope = parseFloat(slopeVal);
    const rating = parseFloat(ratingVal);
    const par = parseInt(parVal);

    if (isNaN(slope) || isNaN(rating) || isNaN(par)) return;

    newTees[name] = { slope, rating, par };
  });

  if (!Object.keys(newTees).length) {
    alert("No valid tees to save.");
    return;
  }

  coursesDB[country][county][course].tees = newTees;
  alert("Tees saved in memory. Use 'Download JSON' to export.");
}

/* ================= ADMIN: EXPORT / IMPORT JSON ================= */
function exportCourses() {
  const dataStr = JSON.stringify(coursesDB, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "courses-gb-updated.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importCourses(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      coursesDB = data;
      alert("Course database imported into memory.");
      populateCountryDropdowns();
      enableCourseSelectors();
      initAdminSelectors();
    } catch (err) {
      console.error("Import failed", err);
      alert("Invalid JSON file.");
    }
  };
  reader.readAsText(file);
}