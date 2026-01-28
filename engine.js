/**
 * Recovery Gear Assistant – Decision Engine
 * Safety-first recovery logic
 */

/* ==========================
   ENUMS & CONSTANTS
========================== */

const Assistance = {
  SOLO: "solo",
  ASSISTED: "assisted"
};

const Gear = {
  TRACTION_BOARDS: "traction_boards",
  SPADE: "spade",
  DEFLATOR: "deflator",
  COMPRESSOR: "compressor",
  TOW_STRAP: "tow_strap",
  KINETIC_ROPE: "kinetic_rope",
  SNATCH_STRAP: "snatch_strap",
  SOFT_SHACKLE: "soft_shackle",
  BOW_SHACKLE: "bow_shackle",
  WINCH: "winch",
  TREE_PROTECTOR: "tree_protector",
  WINCH_EXTENSION: "winch_extension",
  DAMPER: "damper",
  JACK: "jack",
  BASE_PLATE: "base_plate"
};

/* ==========================
   HELPER FUNCTIONS
========================== */

function hasAny(set, items) {
  return items.some(i => set.has(i));
}

function tyreAdvice(terrain, weight) {
  const light = weight && weight <= 1500;

  if (terrain === "sand") {
    return light
      ? "Lower tyre pressures to ±0.8–1.2 bar. Try a gentle drive-out."
      : "Lower tyre pressures to ±1.0–1.4 bar. Try a gentle drive-out.";
  }
  if (terrain === "mud") {
    return "Slightly reduce tyre pressures (±1.2–1.6 bar). Avoid wheelspin.";
  }
  if (terrain === "rock") {
    return "Reduce tyre pressures moderately (±1.4–1.8 bar) for grip.";
  }
  return "Adjust tyre pressures if safe, then attempt a gentle drive-out.";
}

function safetyWarnings(hasRatedFront, hasRatedRear, towBallOnly) {
  const w = [];
  if (towBallOnly) {
    w.push("DO NOT recover from a tow ball – extremely dangerous.");
  }
  if (!hasRatedFront && !hasRatedRear) {
    w.push("No rated recovery points – avoid kinetic recoveries.");
  }
  w.push("Clear spectators at least 1.5× strap length.");
  w.push("Use a damper on winch lines and straps.");
  w.push("Always start with the gentlest recovery method.");
  return w;
}

/* ==========================
   MAIN DECISION ENGINE
========================== */

function recommendRecovery(input) {
  const {
    terrain,
    stuckType,
    assistance,
    winchFitted,
    hasRatedFront,
    hasRatedRear,
    onlyTowBall,
    vehicleWeightKg,
    availableGear
  } = input;

  const gearSet = new Set(availableGear || []);
  const warnings = safetyWarnings(hasRatedFront, hasRatedRear, onlyTowBall);

  /* ----- First actions (always) ----- */
  const firstAction = [];
  firstAction.push(tyreAdvice(terrain, vehicleWeightKg));
  if (gearSet.has(Gear.SPADE)) {
    firstAction.push("Dig ramps in front of tyres and clear under diffs.");
  }

  /* ----- Primary recovery ----- */
  let primary = null;

  /* Traction boards */
  if (
    gearSet.has(Gear.TRACTION_BOARDS) &&
    (terrain === "sand" || terrain === "mud" || stuckType === "spinning" || stuckType === "bogged")
  ) {
    primary = {
      method: "Traction boards",
      reason: "Low-risk self-recovery suitable for sand and mud.",
      gear: ["Traction boards", gearSet.has(Gear.SPADE) ? "Spade" : null].filter(Boolean),
      steps: [
        "Stop spinning wheels.",
        "Dig a shallow ramp in front of tyres.",
        "Place traction boards tight against tyres.",
        "Engage low range and drive out gently."
      ],
      safety: [
        "Stand clear – boards can eject.",
        "Avoid aggressive throttle."
      ]
    };
  }

  /* High-centered */
  if (!primary && stuckType === "high_centered") {
    primary = {
      method: "Jack and pack",
      reason: "Vehicle is bellied out and needs lift and packing.",
      gear: ["Jack", "Spade"],
      steps: [
        "Stabilise vehicle.",
        "Lift safely using correct jacking point.",
        "Pack under wheels.",
        "Lower vehicle and drive out gently."
      ],
      safety: [
        "Never put body parts under a vehicle on a jack.",
        "Use a base plate on soft ground."
      ]
    };
  }

  /* Winch */
  if (!primary && winchFitted && gearSet.has(Gear.WINCH)) {
    primary = {
      method: "Winch recovery",
      reason: "Controlled and safest assisted recovery.",
      gear: ["Winch", "Tree protector", "Damper"],
      steps: [
        "Select a solid anchor point.",
        "Use tree protector if anchoring to a tree.",
        "Rig winch line with damper.",
        "Winch slowly while steering straight."
      ],
      safety: [
        "Keep people clear of the winch line.",
        "Avoid shock loading."
      ]
    };
  }

  /* Tow pull */
  if (
    !primary &&
    assistance === Assistance.ASSISTED &&
    gearSet.has(Gear.TOW_STRAP) &&
    (hasRatedFront || hasRatedRear) &&
    !onlyTowBall
  ) {
    primary = {
      method: "Tow pull (static)",
      reason: "Gentle assisted pull without kinetic force.",
      gear: ["Tow strap", "Rated recovery points"],
      steps: [
        "Connect to rated recovery points only.",
        "Agree on signals.",
        "Tow vehicle pulls smoothly.",
        "Stuck vehicle assists gently."
      ],
      safety: [
        "No jerking.",
        "Stop immediately if something looks wrong."
      ]
    };
  }

  /* Kinetic recovery – LAST */
  if (
    !primary &&
    assistance === Assistance.ASSISTED &&
    hasAny(gearSet, [Gear.KINETIC_ROPE, Gear.SNATCH_STRAP]) &&
    (hasRatedFront || hasRatedRear) &&
    !onlyTowBall
  ) {
    primary = {
      method: "Kinetic recovery",
      reason: "Effective but higher risk – last resort.",
      gear: ["Kinetic rope / Snatch strap", "Damper"],
      steps: [
        "Clear all spectators well away.",
        "Connect to rated recovery points.",
        "Perform a gentle rolling pull.",
        "Stop and reassess after each attempt."
      ],
      safety: [
        "Never connect to a tow ball.",
        "Do not repeat aggressive pulls."
      ]
    };
  }

  /* Fallback */
  if (!primary) {
    primary = {
      method: "Self recovery only",
      reason: "Limited gear or unsafe attachment points.",
      gear: ["Spade", "Tyre deflator"],
      steps: [
        "Lower tyre pressures.",
        "Dig ramps and clear under diffs.",
        "Attempt gentle drive-out.",
        "Call for professional recovery if unsuccessful."
      ],
      safety: [
        "Do not improvise recovery points."
      ]
    };
  }

  return {
    summary: `Terrain: ${terrain}, Stuck: ${stuckType}, Assistance: ${assistance}`,
    firstAction,
    primary,
    secondary: null,
    warnings
  };
}

/* ==========================
   EXPORT FOR APP
========================== */

window.recommendRecovery = recommendRecovery;
