/* ---------- Navigation ---------- */
function showSection(id, btn) {
  document.querySelectorAll(".section").forEach(s => s.style.display = "none");
  document.getElementById(id).style.display = "block";

  document.querySelectorAll(".nav button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

/* ---------- 4BBB ---------- */
function calculate4BBB() {
  const slope = parseFloat(document.getElementById("slope").value);
  const rating = parseFloat(document.getElementById("rating").value);
  const par = parseFloat(document.getElementById("par").value);

  const rows = document.querySelectorAll("#players tbody tr");
  let playing = [];

  rows.forEach(r => r.style.background = "");

  rows.forEach(row => {
    const index = parseFloat(row.cells[1].querySelector("input").value);
    if (isNaN(index)) return;

    const course = (index * slope / 113) + (rating - par);
    const play = course * 0.9;

    const c = Math.round(course);
    const p = Math.round(play);

    row.cells[2].textContent = c;
    row.cells[3].textContent = p;

    playing.push(p);
  });

  const low = Math.min(...playing);

  rows.forEach(row => {
    const p = parseInt(row.cells[3].textContent);
    if (!isNaN(p)) {
      row.cells[4].textContent = p - low;
      if (p === low) row.style.background = "#e8f5e9";
    }
  });
}

/* ---------- Stableford ---------- */
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

/* ---------- Stroke Play ---------- */
function calculateStrokePlay() {
  let total = 0;
  document.querySelectorAll("#strokeTable tbody tr").forEach(row => {
    const gross = parseInt(row.cells[2].querySelector("input").value);
    if (!isNaN(gross)) total += gross;
  });

  document.getElementById("strokeTotal").textContent =
    "Total Gross Score: " + total;
}
document.addEventListener("input", e => {
  if (["rating", "par", "slope"].includes(e.target.id)) {
    calculate4BBB();
  }
});