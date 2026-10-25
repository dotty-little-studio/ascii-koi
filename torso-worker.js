var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// controller-jointyield.cjs
var require_controller_jointyield = __commonJS({
  "controller-jointyield.cjs"(exports, module) {
    "use strict";
    var clamp = (x, a, b) => Math.max(a, Math.min(b, x));
    var angle = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
    var N = 20;
    var DT = 0.1;
    var SAVE = 5;
    var STEPS = 160;
    function width(s) {
      return s < 0.1 ? 0.105 * Math.pow(Math.sin(s / 0.1 * Math.PI / 2), 0.45) : s < 0.3 ? 0.105 + 0.025 * Math.sin((s - 0.1) / 0.2 * Math.PI / 2) : s < 0.84 ? 0.023 + 0.107 * (1 - (s - 0.3) / 0.54) : 0.023 * (1 - (s - 0.84) / 0.16);
    }
    var RANGE = [];
    for (let a = 0; a < 19; a += 2) {
      const b = Math.min(19, a + 2);
      let w = 0;
      for (let s = a; s <= b; s += 0.25) w = Math.max(w, width(s / 19));
      RANGE.push([a * 2, b * 2, w]);
    }
    function pointSegment(px, py, ax, ay, bx, by) {
      const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
      const t = l ? clamp(((px - ax) * dx + (py - ay) * dy) / l, 0, 1) : 0;
      return (px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2;
    }
    function segmentDistance(ax, ay, bx, by, cx, cy, dx, dy) {
      const abx = bx - ax, aby = by - ay, cdx = dx - cx, cdy = dy - cy, den = abx * cdy - aby * cdx;
      if (Math.abs(den) > 1e-9) {
        const ux = cx - ax, uy = cy - ay, s = (ux * cdy - uy * cdx) / den, t = (ux * aby - uy * abx) / den;
        if (s >= 0 && s <= 1 && t >= 0 && t <= 1) return 0;
      }
      return Math.sqrt(Math.min(pointSegment(ax, ay, cx, cy, dx, dy), pointSegment(bx, by, cx, cy, dx, dy), pointSegment(cx, cy, ax, ay, bx, by), pointSegment(dx, dy, ax, ay, bx, by)));
    }
    function geometry(sh, nodes) {
      const seg = [];
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const [a, b, w] of RANGE) {
        const ax = nodes[a], ay = nodes[a + 1], bx = nodes[b], by = nodes[b + 1], r = sh.length * w;
        const loX = Math.min(ax, bx), hiX = Math.max(ax, bx), loY = Math.min(ay, by), hiY = Math.max(ay, by);
        seg.push([ax, ay, bx, by, r, loX, hiX, loY, hiY]);
        x0 = Math.min(x0, loX - r);
        x1 = Math.max(x1, hiX + r);
        y0 = Math.min(y0, loY - r);
        y1 = Math.max(y1, hiY + r);
      }
      return { seg, x0, x1, y0, y1 };
    }
    function geometryGap(a, b, cap = Infinity) {
      let min = cap;
      if (Number.isFinite(cap)) {
        const x = Math.max(0, a.x0 - b.x1, b.x0 - a.x1), y = Math.max(0, a.y0 - b.y1, b.y0 - a.y1);
        if (x * x + y * y > (cap + 7) ** 2) return cap;
      }
      for (const p of a.seg) for (const q of b.seg) {
        const r = p[4] + q[4] + 7, dx = Math.max(0, p[5] - q[6], q[5] - p[6]), dy = Math.max(0, p[7] - q[8], q[7] - p[8]);
        if (min + r >= 0 && dx * dx + dy * dy >= (min + r) ** 2) continue;
        const g = segmentDistance(p[0], p[1], p[2], p[3], q[0], q[1], q[2], q[3]) - r;
        if (g < min) min = g;
      }
      return min;
    }
    function clearance(a, an, b, bn) {
      return geometryGap(geometry(a, an), geometry(b, bn));
    }
    function wallHeading(nodes, h, length, heading, world) {
      const pad = length * 0.4 + 40, fade = length * 0.48, look = length * 0.4, rx = Math.cos(h) * look, ry = Math.sin(h) * look;
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (let j = 0; j < 40; j += 2) {
        const x = nodes[j], y = nodes[j + 1];
        x0 = Math.min(x0, x, x + rx);
        x1 = Math.max(x1, x, x + rx);
        y0 = Math.min(y0, y, y + ry);
        y1 = Math.max(y1, y, y + ry);
      }
      const l = clamp((pad + fade - x0) / fade, 0, 1), r = clamp((x1 - world.width + pad + fade) / fade, 0, 1), t = clamp((pad + fade - y0) / fade, 0, 1), b = clamp((y1 - world.height + pad + fade) / fade, 0, 1);
      const peak = Math.max(l, r, t, b), keep = 1 - 0.94 * peak * peak;
      return Math.atan2(Math.sin(heading) * keep + t * t - b * b, Math.cos(heading) * keep + l * l - r * r);
    }
    function simulate(sh, heading, scale, world) {
      const nodes = Float64Array.from(sh.nodes), frames = [];
      let h = sh.heading, v = sh.speed, turn = sh.turn || 0, edge = 0;
      const slow = clamp(world.koiAvoidance?.get(sh.id)?.slow || 0, 0, 1);
      for (let step = 1; step <= STEPS; step++) {
        const target = wallHeading(nodes, h, sh.length, heading, world), limit = Math.max(0.28, Math.min(0.8, v / (sh.length * 0.18)));
        turn += (clamp(angle(h, target) * 2, -limit, limit) - turn) * (1 - Math.exp(-DT * 4));
        h += turn * DT;
        const t = world.time + step * DT, z = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 / (19 + sh.id * 2.3) + sh.id * 2.1), q = clamp((z - 0.22) / 0.6, 0, 1), calm = 0.48 + 0.52 * q * q * (3 - 2 * q);
        const predictedSlow = 0;
        const targetV = (18 + sh.length * 0.022) * calm * (1 - 0.55 * predictedSlow) * scale;
        v += (targetV - v) * DT * 0.45;
        nodes[0] += Math.cos(h) * v * DT;
        nodes[1] += Math.sin(h) * v * DT;
        let back = h + Math.PI;
        for (let k = 1; k < N; k++) {
          let a = Math.atan2(nodes[k * 2 + 1] - nodes[(k - 1) * 2 + 1], nodes[k * 2] - nodes[(k - 1) * 2]);
          a = back + clamp(angle(back, a), -0.1, 0.1);
          nodes[k * 2] = nodes[(k - 1) * 2] + Math.cos(a) * sh.length / 19;
          nodes[k * 2 + 1] = nodes[(k - 1) * 2 + 1] + Math.sin(a) * sh.length / 19;
          back = a;
        }
        if (step % SAVE === 0) {
          frames.push(geometry(sh, nodes));
          for (let j = 0; j < 20; j += 2) {
            const radius = sh.length * width(j / 19), x = nodes[j * 2], y = nodes[j * 2 + 1], bad = Math.max(0, radius - x, x + radius - world.width, radius - y, y + radius - world.height);
            edge += bad * bad;
          }
        }
      }
      return { frames, edge };
    }
    function nominal(sh, world) {
      const x = sh.nodes[0], y = sh.nodes[1], o = Math.min(world.width, world.height), sx = (x - world.width / 2) / (world.width / o), sy = y - world.height / 2, c = Math.hypot(sx, sy) || 1;
      const r = sh.orbitRadius * (1 + 0.15 * Math.sin(world.time * 0.05 + sh.id)), k = clamp((r - c) / r, -1, 1);
      return Math.atan2(Math.sin(sh.heading) + Math.sin(sh.heading + (sh.wander || 0)) * 0.45 + (sx / c * sh.orbitDir + sy / c * k * 0.9) * 0.55, Math.cos(sh.heading) + Math.cos(sh.heading + (sh.wander || 0)) * 0.45 + (-sy / c * sh.orbitDir + sx / c * k * 0.9) * 0.55);
    }
    function candidateList(sh, world, rank) {
      const base = nominal(sh, world), previous = world.torsoPlan?.get(sh.id), list = [];
      const append = (heading, scale) => {
        if (list.some((c) => Math.abs(angle(c.heading, heading)) < 0.035 && c.scale === scale)) return;
        const d = angle(base, heading), change = previous?.weight ? angle(previous.heading, heading) : d;
        const side = d === 0 ? 0 : Math.sign(d), oldSide = previous?.side || 0;
        const comfort = (1 + 2 / (rank + 1)) * (d * d * 0.5 + (1 - scale) * 3) + change * change * 0.65 + (oldSide && side && oldSide !== side ? 0.9 : 0);
        const path = simulate(sh, heading, scale, world);
        list.push({ heading, scale, weight: 1, side: Math.abs(d) > 0.2 ? side : oldSide, comfort: comfort + path.edge * 4e-4, ...path });
      };
      append(base, 1);
      if (previous?.weight) append(previous.heading, previous.scale || 1);
      for (const offset of [0, -0.7, 0.7, -1.5, 1.5, -2.4, 2.4, Math.PI]) for (const scale of [1, 0.7, 0.45]) append(sh.heading + offset, scale);
      append(base, 0.8);
      return list;
    }
    function pairMetrics(a, ca, b, cb, current) {
      let early = 0, earlySum = 0, later = 0, sum = 0, margin = 0, minGap = Infinity;
      for (let k = 0; k < ca.frames.length; k++) {
        const gap = geometryGap(ca.frames[k], cb.frames[k], 14), penetration = Math.max(0, -gap), t = (k + 1) * 0.5;
        minGap = Math.min(minGap, gap);
        if (k < 6) {
          early = Math.max(early, penetration);
          earlySum += penetration * penetration;
        }
        later = Math.max(later, penetration);
        sum += penetration * penetration / (1 + t * 0.2);
        margin += Math.max(0, 14 - gap) ** 2 / (1 + t * 0.1);
      }
      return { early, earlySum, later, sum, margin, minGap };
    }
    function plan(world) {
      const fish = world.sharks.filter((s) => s.kind === "koi").sort((a, b) => a.id - b.id), result = /* @__PURE__ */ new Map();
      if (!fish.length) return result;
      const lists = fish.map((s, i) => candidateList(s, world, i)), pairs = [];
      for (let i = 0; i < fish.length; i++) for (let j = i + 1; j < fish.length; j++) {
        const matrix = [], current = clearance(fish[i], fish[i].nodes, fish[j], fish[j].nodes);
        for (const a of lists[i]) {
          const row = [];
          for (const b of lists[j]) row.push(pairMetrics(fish[i], a, fish[j], b, current));
          matrix.push(row);
        }
        pairs.push({ i, j, matrix });
      }
      let best = null;
      const selected = [];
      function visit(i) {
        if (i < fish.length) {
          for (let c = 0; c < lists[i].length; c++) {
            selected[i] = c;
            visit(i + 1);
          }
          return;
        }
        let early = 0, earlySum = 0, later = 0, sum = 0, margin = 0, comfort = 0;
        for (const p of pairs) {
          const m = p.matrix[selected[p.i]][selected[p.j]];
          early = Math.max(early, m.early);
          earlySum += m.earlySum;
          later = Math.max(later, m.later);
          sum += m.sum;
          margin += m.margin;
        }
        for (let k = 0; k < fish.length; k++) comfort += lists[k][selected[k]].comfort;
        const key = [early > 0.5 ? 1 : 0, early > 0.5 ? early + earlySum * 3e-3 : 0, later > 0.5 ? 1 : 0, later > 0.5 ? later + sum * 3e-3 : 0, margin * 2e-3 + comfort];
        let better = !best;
        if (best) for (let k = 0; k < key.length; k++) {
          if (Math.abs(key[k] - best.key[k]) < 1e-8) continue;
          better = key[k] < best.key[k];
          break;
        }
        if (better) best = { key, selected: selected.slice() };
      }
      visit(0);
      for (let i = 0; i < fish.length; i++) {
        const c = lists[i][best.selected[i]];
        result.set(fish[i].id, { heading: c.heading, scale: c.scale, weight: 1, side: c.side });
      }
      result.diagnostics = best.key;
      return result;
    }
    module.exports = { plan, clearance, width };
  }
});

// worker-entry.cjs
var require_worker_entry = __commonJS({
  "worker-entry.cjs"() {
    var { plan } = require_controller_jointyield();
    onmessage = ({ data }) => {
      try {
        postMessage({ id: data.id, time: data.time, plan: [...plan(data.world)] });
      } catch (error) {
        postMessage({ id: data.id, time: data.time, error: String(error) });
      }
    };
  }
});
export default require_worker_entry();
