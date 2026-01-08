/* ================= GLOBALS ================= */
let coursesDB = {};
let currentCourses = {};
let selectedCourse = null;
let courseSlope, courseRating, coursePar;

/* ================= LOAD COURSE DATABASE ================= */
async function loadCourses() {
  try {
    const res = await fetch("./courses/courses-gb.json");
    coursesDB = await res.json();
    console.log("Courses loaded:", coursesDB);
    enableCourseSelectors(); // FIX 3: only enable after load
  } catch (err) {
    console.error("Failed to load course database", err);
  }
}

loadCourses();

/* ================= NAVIGATION ================= */
function showSection(id, btn) {
  document.querySelectorAll(".section").forEach(s => {
    s.style.display = "none";
  });
  document.getElementById(id).style.display = "block";

  document.querySelectorAll(".nav button").forEach(b => {
    b.classList.remove("active");
  });
  btn.classList.add("active");
}

/* ================= ENABLE COURSE SELECTORS (FIX 3) ================= */
function enableCourseSelectors() {
  const countrySelect = document.getElementById("country");
  const countySelect = document.getElementById("county");

  countrySelect.addEventListener("change", () => {
    countySelect.innerHTML = `<option value="">Select</option>`;
    const country = countrySelect.value;

    if (!coursesDB[country]) return;

    Object.keys(coursesDB[country]).forEach(county => {
      const opt = document.createElement("option");
      opt.value = county;
      opt.textContent = county;
      countySelect.appendChild(opt);
    });
  });
}

/* ================= COURSE SEARCH ================= */
function searchCourses() {
  const country = document.getElementById("country").value;
  const county = document.getElementById("county").value;

  if (!coursesDB[country] || !coursesDB[country][county]) return;

  currentCourses = coursesDB[country][county];
  const list = document.getElementById("courseList");
  list.innerHTML = "";

  Object.keys(currentCourses).sort().forEach(course => {
    const li = document.createElement("li");
    li.textContent = course;
    li.onclick = () => selectCourse(course);
    list.appendChild(li);
  });

  document.getElementById("courseResults").style.display = "block";
}

/* ================= FILTER COURSES ================= */
function filterCourses() {
  const term = document.getElementById("courseSearch").value.toLowerCase();
  document.querySelectorAll("#courseList li").forEach(li => {
    li.style.display = li.textContent.toLowerCase().includes(term)
      ? "block"
      : "none";
  });
}

/* ================= COURSE & TEE SELECTION ================= */
function selectCourse(courseName) {
  selectedCourse = currentCourses[courseName];
  const teeSelect = document.getElementById("tee");
  teeSelect.innerHTML = "";

  Object.keys(selectedCourse.tees).forEach(tee => {
    const opt = document.createElement("option");
    opt.value = tee;
    opt.textContent = tee;
    teeSelect.appendChild(opt);
  });

  document.getElementById("teeSelector").style.display = "block";
  applyCourseData();
}

function applyCourseData() {
  if (!selectedCourse) return;

  const tee = document.getElementById("tee").value;
  const data = selectedCourse.tees[tee];

  courseSlope = data.slope;
  courseRating = data.rating;
  coursePar = data.par;

  calculate4BBB();
}

/* ================= 4BBB CALCULATION ================= */
function calculate4BBB() {
  if (!courseSlope || !courseRating || !coursePar) return;

  const rows = document.querySelectorAll("#players tbody tr");
  let playingHandicaps = [];

  rows.forEach(row => row.style.background = "");

  rows.forEach(row => {
    const index = parseFloat(row.cells[1].querySelector("input").value);

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
    tbody.innerHTML +=
      `<tr>
        <td>${i}</td>
        <td><input></td>
        <td><input></td>
        <td></td>
      </tr>`;
  }
})();

function calculateStableford() {
  let total = 0;

  document.querySelectorAll("#stableTable tbody tr").forEach(row => {
    const par = parseInt(row.cells[1].querySelector("input").value);
    const gross = parseInt(row.cells[2].querySelector("input").value);

    if (isNaN(par) || isNaN(gross)) return;

    const diff = gross - par;
    const points =
      diff <= -3 ? 5 :
      diff === -2 ? 4 :
      diff === -1 ? 3 :
      diff === 0 ? 2 :
      diff === 1 ? 1 : 0;

    row.cells[3].textContent = points;
    total += points;
  });

  alert("Total Stableford Points: " + total);
}

/* ================= STROKE PLAY ================= */
(function buildStrokePlay() {
  const tbody = document.querySelector("#strokeTable tbody");
  if (!tbody) return;

  for (let i = 1; i <= 18; i++) {
    tbody.innerHTML +=
      `<tr>
        <td>${i}</td>
        <td><input></td>
        <td><input></td>
      </tr>`;
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