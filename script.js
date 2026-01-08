/* ================= COURSE DATABASE (TEMP) ================= */
const coursesDB = {
  England: {
    Surrey: {
      "Walton Heath": {
        tees: {
          White: { slope: 130, rating: 72.4, par: 72 },
          Yellow: { slope: 128, rating: 71.1, par: 72 }
        }
      },
      "Sunningdale Old": {
        tees: {
          White: { slope: 132, rating: 73.2, par: 70 },
          Yellow: { slope: 129, rating: 71.9, par: 70 }
        }
      }
    }
  }
};

let currentCourses = {};
let selectedCourse = null;
let courseSlope, courseRating, coursePar;

/* ================= NAVIGATION ================= */
function showSection(id, btn) {
  document.querySelectorAll(".section").forEach(s => s.style.display = "none");
  document.getElementById(id).style.display = "block";

  document.querySelectorAll(".nav button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

/* ================= COURSE SELECTION ================= */
document.getElementById("country").addEventListener("change", e => {
  const countySelect = document.getElementById("county");
  countySelect.innerHTML = `<option value="">Select</option>`;

  const country = e.target.value;
  if (!coursesDB[country]) return;

  Object.keys(coursesDB[country]).forEach(county => {
    const opt = document.createElement("option");
    opt.value = county;
    opt.textContent = county;
    countySelect.appendChild(opt);
  });
});

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

function filterCourses() {
  const term = document.getElementById("courseSearch").value.toLowerCase();
  document.querySelectorAll("#courseList li").forEach(li => {
    li.style.display = li.textContent.toLowerCase().includes(term) ? "block" : "none";
  });
}

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
  const tee = document.getElementById("tee").value;
  const data = selectedCourse.tees[tee];

  courseSlope = data.slope;
  courseRating = data.rating;
  coursePar = data.par;

  calculate4BBB();
}

/* ================= 4BBB ================= */
function calculate4BBB() {
  if (!courseSlope || !courseRating || !coursePar) return;

  const rows = document.querySelectorAll("#players tbody tr");
  let playing = [];

  rows.forEach(r => r.style.background = "");

  rows.forEach(row => {
    const index = parseFloat(row.cells[1].querySelector("input").value);
    if (isNaN(index)) {
      row.cells[2].textContent = "";
      row.cells[3].textContent = "";
      row.cells[4].textContent = "";
      return;
    }

    const course = (index * courseSlope / 113) + (courseRating - coursePar);
    const play = course * 0.9;

    const c = Math.round(course);
    const p = Math.round(play);

    row.cells[2].textContent = c;
    row.cells[3].textContent = p;

    playing.push(p);
  });

  if (!playing.length) return;
  const low = Math.min(...playing);

  rows.forEach(row => {
    const p = parseInt(row.cells[3].textContent);
    if (!isNaN(p)) {
      row.cells[4].textContent = p - low;
      if (p === low) row.style.background = "#e8f5e9";
    }
  });
}

/* ================= STABLEFORD ================= */
function calculateStableford() {
  let total = 0;

  document.querySelectorAll("#stableTable tbody tr").forEach(row => {
    const par = parseInt(row.cells[1].querySelector("input").value);
    const gross = parseInt(row.cells[2].querySelector("input").value);
    if (isNaN(par) || isNaN(gross)) return;

    const diff = gross - par;
    let pts = diff <= -3 ? 5 :
              diff === -2 ? 4 :
              diff === -1 ? 3 :
              diff === 0 ? 2 :
              diff === 1 ? 1 : 0;

    row.cells[3].textContent = pts;
    total += pts;
  });

  alert("Total Stableford Points: " + total);
}

/* ================= STROKE PLAY ================= */
function calculateStrokePlay() {
  let total = 0;
  document.querySelectorAll("#strokeTable tbody tr").forEach(row => {
    const gross = parseInt(row.cells[2].querySelector("input").value);
    if (!isNaN(gross)) total += gross;
  });

  document.getElementById("strokeTotal").textContent =
    "Total Gross Score: " + total;
}