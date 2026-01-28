// app.js
// Connects the HTML form to the recovery engine (recommendRecovery)
// and displays the result on the page.

const GEAR_ITEMS = [
  ["traction_boards", "Traction boards"],
  ["spade", "Spade"],
  ["deflator", "Tyre deflator"],
  ["compressor", "Compressor"],
  ["tow_strap", "Tow strap (static)"],
  ["kinetic_rope", "Kinetic rope"],
  ["snatch_strap", "Snatch strap"],
  ["soft_shackle", "Soft shackle"],
  ["bow_shackle", "Bow shackle"],
  ["winch", "Winch"],
  ["tree_protector", "Tree protector"],
  ["winch_extension", "Winch extension line"],
  ["damper", "Damper"],
  ["jack", "Jack"],
  ["base_plate", "Base plate"]
];

function renderGearCheckboxes() {
  const el = document.getElementById("gearList");
  el.innerHTML = "";

  GEAR_ITEMS.forEach(([key, label]) => {
    const row = document.createElement("label");
    row.className = "checkbox-item";
    row.innerHTML = `
      <input type="checkbox" value="${key}">
      <span>${label}</span>
    `;
    el.appendChild(row);
  });
}


function getSelectedGear() {
  return Array.from(
    document.querySelectorAll("#gearList input[type=checkbox]:checked")
  ).map((cb) => cb.value);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function list(items) {
  if (!items || items.length === 0) return "<p>-</p>";
  return `<ul>${items.map(i => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
}

function renderStop(message, tips = []) {
  const out = document.getElementById("output");
  out.innerHTML = `
    <div class="card stop">
      <h3>🛑 STOP</h3>
      <p>${escapeHtml(message)}</p>
      ${tips.length ? `<h4>Safe options you CAN do:</h4>${list(tips)}` : ""}
    </div>
  `;
}

function renderResult(result) {
  const out = document.getElementById("output");
  const p = result.primary;

  out.innerHTML = `
    <div class="card warn">
      <h3>⚠️ Safety Warnings</h3>
      ${list(result.warnings)}
    </div>

    <div class="card">
      <h3>🔍 Situation Summary</h3>
      <p>${escapeHtml(result.summary)}</p>
    </div>

    <div class="card">
      <h3>✅ First Actions</h3>
      ${list(result.firstAction)}
    </div>

    <div class="card">
      <h3>✅ Primary Recommendation: ${escapeHtml(p.method)}</h3>
      <p><strong>Why:</strong> ${escapeHtml(p.reason)}</p>

      <p><strong>Gear:</strong></p>
      ${list(p.gear)}

      <p><strong>Steps:</strong></p>
      ${list(p.steps)}

      <p><strong>Safety:</strong></p>
      ${list(p.safety)}
    </div>
  `;
}

document.getElementById("runBtn").addEventListener("click", () => {
  const towBallOnly = document.getElementById("towBall").checked;
  const ratedFront = document.getElementById("ratedFront").checked;
  const ratedRear = document.getElementById("ratedRear").checked;

  // Hard safety stop: no rated points or tow ball only.
  if (towBallOnly || (!ratedFront && !ratedRear)) {
    renderStop(
      "No safe rated recovery points selected. Do NOT use tow ball or improvised points.",
      [
        "Lower tyre pressures (if appropriate) and try gentle drive-out",
        "Dig ramps and clear under diffs/belly",
        "Use traction boards if you have them",
        "Call an experienced recovery team if still stuck"
      ]
    );
    return;
  }

  const input = {
    terrain: document.getElementById("terrain").value,
    stuckType: document.getElementById("stuckType").value,
    assistance: document.getElementById("assistance").value,
    winchFitted: document.getElementById("winchFitted").value === "true",
    hasRatedFront: ratedFront,
    hasRatedRear: ratedRear,
    onlyTowBall: towBallOnly,
    vehicleWeightKg: Number(document.getElementById("weight").value) || undefined,
    availableGear: getSelectedGear()
  };

  const result = window.recommendRecovery(input);
  renderResult(result);
});

renderGearCheckboxes();

