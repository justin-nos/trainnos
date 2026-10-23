// Session-based funnels. A session counts toward a step only if it reached
// every earlier step too, so counts never increase.
import {FUNNELS} from "./config.mjs";

const rate = (n, d) => (d ? n / d : null);

export function computeFunnel(sessions, funnelKey, {source, device} = {}) {
  const funnel = FUNNELS[funnelKey];
  if (!funnel) throw new Error(`Unknown funnel: ${funnelKey}`);
  const matching = sessions.filter(
    s => (!source || s.source === source) && (!device || s.device === device),
  );

  const counts = funnel.steps.map(() => 0);
  for (const s of matching) {
    for (let i = 0; i < funnel.steps.length; i++) {
      const {key} = funnel.steps[i];
      if (key !== "visit" && !s.reached?.[key]) break;
      counts[i]++;
    }
  }

  return {
    key: funnelKey,
    label: funnel.label,
    steps: funnel.steps.map((step, i) => ({
      ...step,
      count: counts[i],
      rateFromStart: rate(counts[i], counts[0]),
      rateFromPrev: i === 0 ? null : rate(counts[i], counts[i - 1]),
    })),
  };
}

// The step transition that loses the largest share of visitors, or null.
export function biggestDrop(steps) {
  let worst = null;
  for (let i = 1; i < steps.length; i++) {
    const prev = steps[i - 1];
    if (!prev.count) continue;
    const lost = 1 - steps[i].count / prev.count;
    if (lost > 0 && (!worst || lost > worst.lost)) {
      worst = {from: prev.label, to: steps[i].label, lost};
    }
  }
  return worst;
}
