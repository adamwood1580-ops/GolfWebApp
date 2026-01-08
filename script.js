/* ================= GLOBALS ================= */
let coursesDB = {};
let currentCourses = {};
let selectedCourse = null;
let courseSlope, courseRating, coursePar;

/* ================= LOAD COURSE DATABASE ================= */
fetch("./courses/courses-gb.json")
  .then(res => res.json())
  .then(data => coursesDB = data)
  .catch(err => console.error("Course DB load failed", err));

/* ================= NAV ================= */
function showSection(id, btn) {
  document.querySelectorAll(".section").forEach(s => s.style.display = "none");
  document.getElementById(id).style.display = "block";
  document.querySelectorAll(".nav button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

/* ================= COUNTRY → COUNTY ================= */
document.getElementById("country").addEventListener("change", e => {
  const county = document.getElementById("county");
  county.innerHTML = `<option value="">Select</option>`;
  if (!coursesDB[e.target.value]) return;

  Object.keys(coursesDB[e.target.value]).forEach(c => {
    county.innerHTML += `<option value="${c}">${c}</option>`;
  });
});

/* ================= COURSE SEARCH ================= */
function searchCourses() {
  const country = country.value;
  const countyVal = county.value;
  if (!coursesDB[country]?.[countyVal]) return;

  currentCourses = coursesDB[country][countyVal];
  const list = document.getElementById("courseList");
  list.innerHTML = "";

  Object.keys(currentCourses).sort().forEach(c => {
    const li = document.createElement("li");
    li.textContent = c;
    li.onclick = () => selectCourse(c);
    list.appendChild(li);
  });

  document.getElementById("courseResults").style.display = "block";
}

/* ================= FILTER ================= */
function filterCourses() {
  const term = courseSearch.value.toLowerCase();
  document.querySelectorAll("#courseList li").forEach(li => {
    li.style.display = li.textContent.toLowerCase().includes(term) ? "block" : "none";
  });
}

/* ================= COURSE SELECT ================= */
function selectCourse(name) {
  selectedCourse = currentCourses[name];
  const tee = document.getElementById("tee");
  tee.innerHTML = "";

  Object.keys(selectedCourse.tees).forEach(t => {
    tee.innerHTML += `<option value="${t}">${t}</option>`;
  });

  document.getElementById("teeSelector").style.display = "block";
  applyCourseData();
}

function applyCourseData() {
  const data = selectedCourse.tees[tee.value];
  courseSlope = data.slope;
  courseRating = data.rating;
  coursePar = data.par;
  calculate4BBB();
}

/* ================= 4BBB ================= */
function calculate4BBB() {
  if (!courseSlope) return;
  const rows = document.querySelectorAll("#players tbody tr");
  let plays = [];

  rows.forEach(r => r.style.background = "");

  rows.forEach(row => {
    const index = parseFloat(row.cells[1].querySelector("input").value);
    if (isNaN(index)) return;

    const course = (index * courseSlope / 113) + (courseRating - coursePar);
    const playing = Math.round(course * 0.9);

    row.cells[2].textContent = Math.round(course);
    row.cells[3].textContent = playing;
    plays.push(playing);
  });

  if (!plays.length) return;
  const low = Math.min(...plays);

  rows.forEach(row => {
    const p = parseInt(row.cells[3].textContent);
    if (!isNaN(p)) {
      row.cells[4].textContent = p - low;
      if (p === low) row.style.background = "#e8f5e9";
    }
  });
}

/* ================= STABLEFORD ================= */
(function buildStableford() {
  const tbody = document.querySelector("#stableTable tbody");
  for (let i = 1; i <= 18; i++) {
    tbody.innerHTML += `<tr><td>${i}</td><td><input></td><td><input></td><td></td></tr>`;
  }
})();

function calculateStableford() {
  let total = 0;
  document.querySelectorAll("#stableTable tbody tr").forEach(r => {
    const par = +r.cells[1].querySelector("input").value;
    const gross = +r.cells[2].querySelector("input").value;
    if (!par || !gross) return;
    const diff = gross - par;
    const pts = diff <= -3 ? 5 : diff === -2 ? 4 : diff === -1 ? 3 : diff === 0 ? 2 : diff === 1 ? 1 : 0;
    r.cells[3].textContent = pts;
    total += pts;
  });
  alert("Total Stableford Points: " + total);
}

/* ================= STROKE PLAY ================= */
(function buildStroke() {
  const tbody = document.querySelector("#strokeTable tbody");
  for (let i = 1; i <= 18; i++) {
    tbody.innerHTML += `<tr><td>${i}</td><td><input></td><td><input></td></tr>`;
  }
})();

function calculateStrokePlay() {
  let total = 0;
  document.querySelectorAll("#strokeTable tbody tr").forEach(r => {
    const g = +r.cells[2].querySelector("input").value;
    if (g) total += g;
  });
  strokeTotal.textContent = "Total Gross Score: " + total;
}