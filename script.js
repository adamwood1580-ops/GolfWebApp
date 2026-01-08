/* ================= NAVIGATION ================= */
function showSection(id, btn) {
  document.querySelectorAll(".section").forEach(section => {
    section.style.display = "none";
  });

  document.getElementById(id).style.display = "block";

  document.querySelectorAll(".nav button").forEach(button => {
    button.classList.remove("active");
  });

  btn.classList.add("active");
}

/* ================= 4BBB ================= */
function calculate4BBB() {
  const slope = parseFloat(document.getElementById("slope").value);
  const rating = parseFloat(document.getElementById("rating").value);
  const par = parseFloat(document.getElementById("par").value);

  if (isNaN(slope) || isNaN(rating) || isNaN(par)) return;

  const rows = document.querySelectorAll("#players tbody tr");
  let playingHandicaps = [];

  // Clear highlights
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

    // WHS course handicap formula
    const courseHandicap = (index * slope / 113) + (rating - par);
    const playingHandicap = courseHandicap * 0.9;

    const roundedCourse = Math.round(courseHandicap);
    const roundedPlaying = Math.round(playingHandicap);

    row.cells[2].textContent = roundedCourse;
    row.cells[3].textContent = roundedPlaying;

    playingHandicaps.push(roundedPlaying);
  });

  if (playingHandicaps.length === 0) return;

  const lowest = Math.min(...playingHandicaps);

  rows.forEach(row => {
    const playing = parseInt(row.cells[3].textContent);
    if (!isNaN(playing)) {
      row.cells[4].textContent = playing - lowest;

      // Highlight lowest handicap
      if (playing === lowest) {
        row.style.background = "#e8f5e9";
      }
    }
  });
}

/* Auto-recalculate 4BBB on input changes */
document.addEventListener("input", event => {
  if (event.target.closest("#fourbbb")) {
    calculate4BBB();
  }
});

/* ================= STABLEFORD ================= */
function calculateStableford() {
  let total = 0;

  document.querySelectorAll("#stableTable tbody tr").forEach(row => {
    const par = parseInt(row.cells[1].querySelector("input").value);
    const gross = parseInt(row.cells[2].querySelector("input").value);

    if (isNaN(par) || isNaN(gross)) {
      row.cells[3].textContent = "";
      return;
    }

    const diff = gross - par;
    let points = 0;

    if (diff <= -3) points = 5;
    else if (diff === -2) points = 4;
    else if (diff === -1) points = 3;
    else if (diff === 0) points = 2;
    else if (diff === 1) points = 1;

    row.cells[3].textContent = points;
    total += points;
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