// Theme colors interpolate pigment and water separately; simulation uses a shared clock scale.
function pondRGB(day, dusk, night) {
  const t = globalThis.koiTheme || {dusk:0,night:0};
  return day.map((v,i)=>Math.round(v+(dusk[i]-v)*t.dusk+(night[i]-v)*t.night));
}
function pondCSS(day,dusk,night) { return `rgb(${pondRGB(day,dusk,night).join(",")})`; }
function pondPigment(g) {
  const red=g[0]>g[1]*1.2, dark=Math.max(...g)<85, pearl=Math.min(...g)>200;
  const dusk=g.map((v,i)=>Math.min(255,v+[12,2,-5][i]));
  const night=red?[207,100,75]:dark?[57,88,111]:pearl?[224,236,230]:[144,170,166];
  return pondRGB(g,dusk,night);
}
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// worker-client.cjs
var worker_client_exports = {};
__export(worker_client_exports, {
  update: () => update
});
function update(world) {
  const size = world.width + ":" + world.height;
  if (world.torsoSize !== size) {
    world.torsoSize = size;
    world.torsoPlan = null;
    world.torsoNext = 0;
  }
  if (world.torsoWorkerFailed) return;
  if (!world.torsoWorker) {
    try {
      world.torsoWorker = new Worker(new URL("./torso-worker.js", import.meta.url), { type: "module" });
      world.torsoRequestId = 0;
      world.torsoDiagnostics = { state: "starting", accepted: 0, stale: 0, lastLatencyMs: 0 };
      globalThis.__koiTorsoDiagnostics = world.torsoDiagnostics;
      world.torsoWorker.onmessage = ({ data }) => {
        if (data.id !== world.torsoPending?.id) return;
        const latency = performance.now() - world.torsoPending.sent;
        const sizeOK = world.torsoPending.size === world.torsoSize;
        world.torsoPending = null;
        if (data.error) {
          fail(world, data.error);
          return;
        }
        if (!sizeOK || world.time - data.time > 0.9) {
          world.torsoDiagnostics.stale++;
          return;
        }
        world.torsoPlan = new Map(data.plan);
        world.torsoDiagnostics.state = "active";
        world.torsoDiagnostics.accepted++;
        world.torsoDiagnostics.lastLatencyMs = latency;
        if (world.torsoDiagnostics.accepted === 1) console.info("[koi torso] worker active; first accepted plan " + Math.round(latency) + " ms");
      };
      world.torsoWorker.onerror = () => fail(world, "worker error");
    } catch (e) {
      fail(world, String(e));
      return;
    }
  }
  if (world.torsoPending) {
    if (performance.now() - world.torsoPending.sent > 1800) fail(world, "planner timeout");
    return;
  }
  if (world.time < (world.torsoNext || 0)) return;
  world.torsoNext = world.time + 0.3;
  const id = ++world.torsoRequestId;
  world.torsoPending = { id, sent: performance.now(), size: world.torsoSize };
  world.torsoWorker.postMessage({ id, time: world.time, world: { width: world.width, height: world.height, time: world.time, sharks: world.sharks.map((s) => ({ ...s, nodes: s.nodes.slice(), target: null })), torsoPlan: world.torsoPlan } });
}
function fail(world, reason) {
  console.warn("[koi torso] fallback: " + reason);
  world.torsoWorker?.terminate();
  world.torsoWorkerFailed = true;
  world.torsoPlan = null;
  world.torsoPending = null;
  if (world.torsoDiagnostics) {
    world.torsoDiagnostics.state = "fallback";
    world.torsoDiagnostics.reason = reason;
  }
}
var init_worker_client = __esm({
  "worker-client.cjs"() {
  }
});

// browser-entry.cjs
var require_browser_entry = __commonJS({
  "browser-entry.cjs"() {
    var torsoClient = (init_worker_client(), __toCommonJS(worker_client_exports));
    var ee = Object.defineProperty;
    var se = (r, t, n) => t in r ? ee(r, t, { enumerable: true, configurable: true, writable: true, value: n }) : r[t] = n;
    var d = (r, t, n) => se(r, typeof t != "symbol" ? t + "" : t, n);
    var gt = Math.PI * 2;
    var T = (r, t, n) => r < t ? t : r > n ? n : r;
    var Q = (r, t) => r + Math.random() * (t - r);
    var Kt = (r, t) => Math.floor(Q(r, t + 1));
    function ft(r, t, n) {
      const e = T((n - r) / (t - r), 0, 1);
      return e * e * (3 - 2 * e);
    }
    function vt(r, t) {
      let n = (t - r) % gt;
      return n > Math.PI && (n -= gt), n < -Math.PI && (n += gt), n;
    }
    function pt(r, t, n) {
      let e = Math.imul(r | 0, 374761393) ^ Math.imul(t | 0, 668265263) ^ Math.imul(n | 0, 1442695041);
      return e = Math.imul(e ^ e >>> 13, 1274126177), e ^= e >>> 16, (e >>> 0) / 4294967296;
    }
    var _t = 1 / 260;
    var qt = 1 / 310;
    var Et = 1 / 190;
    var Wt = 3400;
    function ne(r, t, n, e) {
      const s = r * _t + n * 0.07, a = t * qt - n * 0.05, o = (r + t) * Et + n * 0.11;
      return e.x = (-qt * Math.sin(s) * Math.sin(a) + 0.5 * Et * Math.cos(o)) * Wt, e.y = (-_t * Math.cos(s) * Math.cos(a) - 0.5 * Et * Math.cos(o)) * Wt, e;
    }
    var Mt = [{ name: "sardine", cruise: 36, maxSpeed: 64, minSpeed: 18, weight: 3, schoolSize: [18, 28], spacing: [1.8, 1.1], align: 1.6, cohesion: 1.6, jitter: 40, mill: 70, verticalDrag: 0.5 }, { name: "anchovy", cruise: 46, maxSpeed: 78, minSpeed: 22, weight: 3, schoolSize: [20, 32], spacing: [1.5, 1], align: 3.2, cohesion: 0.45, jitter: 30, mill: 0, verticalDrag: 1.4 }, { name: "silverside", cruise: 40, maxSpeed: 70, minSpeed: 20, weight: 3, schoolSize: [12, 20], spacing: [2, 1.1], align: 2.4, cohesion: 1.1, jitter: 35, mill: 0, verticalDrag: 1.6 }, { name: "mackerel", cruise: 32, maxSpeed: 60, minSpeed: 16, weight: 2, schoolSize: [5, 9], spacing: [2.6, 1.3], align: 2, cohesion: 0.9, jitter: 25, mill: 0, verticalDrag: 2 }, { name: "goby", cruise: 26, maxSpeed: 56, minSpeed: 10, weight: 1, schoolSize: [8, 12], spacing: [1.4, 1.1], align: 0.35, cohesion: 1.4, jitter: 110, mill: 0, verticalDrag: 0.3 }];
    var ie = Mt.reduce((r, t) => r + t.weight, 0);
    function Lt() {
      let r = Math.random() * ie;
      for (let t = 0; t < Mt.length; t++) if (r -= Mt[t].weight, r <= 0) return t;
      return 0;
    }
    var it = 20;
    var oe = [{ kind: "koi", size: 1 }, { kind: "koi", size: 0.84 }, { kind: "koi", size: 0.72 }];
    var Nt = 420;
    var ae = 1.4;
    var re = 1;
    var bt = 1100;
    var he = -0.6;
    var ce = class {
      constructor(t = oe, n) {
        d(this, "width", 0);
        d(this, "height", 0);
        d(this, "time", 0);
        d(this, "fish", []);
        d(this, "sharks", []);
        d(this, "events", []);
        d(this, "pointer", { x: 0, y: 0, active: false });
        d(this, "perception", 60);
        d(this, "sepX", []);
        d(this, "sepY", []);
        d(this, "foreignSep", 40);
        d(this, "bucketCols", 0);
        d(this, "bucketRows", 0);
        d(this, "bucketHead", new Int32Array(0));
        d(this, "bucketCount", new Uint16Array(0));
        d(this, "bucketNext", new Int32Array(0));
        d(this, "lastSpawn", 0);
        d(this, "tmp", { x: 0, y: 0 });
        d(this, "koiAvoidance", /* @__PURE__ */ new Map());
        d(this, "koiPassSides", /* @__PURE__ */ new Map());
        this.sharkSpecs = t, this.fishCount = n;
      }
      resize(t, n, e, s) {
        const a = this.width === 0;
        if (this.width = t, this.height = n, this.sepX = Mt.map((o) => o.spacing[0] * e), this.sepY = Mt.map((o) => o.spacing[1] * s), this.perception = Math.max(s * 3, e * 5.5), this.foreignSep = e * 3, a || this.fish.length === 0) {
          this.seed();
          return;
        }
        for (const o of this.fish) o.x = T(o.x, 0, t), o.y = T(o.y, 0, n);
      }
      seed() {
        const { width: t, height: n } = this, e = Math.min(t, n), s = T(e * 0.44, 170, 430), a = this.sharkSpecs.length;
        this.sharks = [], this.koiAvoidance.clear(), this.koiPassSides.clear();
        for (let c = 0; c < a; c++) {
          const { kind: u, size: f } = this.sharkSpecs[c], i = s * f, p = e * (u === "koi" ? Q(0.23, 0.28) : Q(0.28, 0.4)), M = c / a * gt + Q(-0.4, 0.4), l = c % 2 === 0 ? 1 : -1, b = t / 2 + Math.cos(M) * p * (t / e) * 0.9, g = n / 2 + Math.sin(M) * p, k = M + l * Math.PI / 2, v = new Float32Array(it * 2), E = i / (it - 1);
          for (let I = 0; I < it; I++) v[I * 2] = b - Math.cos(k) * E * I, v[I * 2 + 1] = g - Math.sin(k) * E * I;
          if (u === "koi") {
            const I = i * 0.4 + 40;
            let h = 1 / 0, P = -1 / 0, W = 1 / 0, U = -1 / 0;
            for (let m = 0; m < it; m++) h = Math.min(h, v[m * 2]), P = Math.max(P, v[m * 2]), W = Math.min(W, v[m * 2 + 1]), U = Math.max(U, v[m * 2 + 1]);
            const y = h < I ? I - h : P > t - I ? t - I - P : 0, O = W < I ? I - W : U > n - I ? n - I - U : 0;
            for (let m = 0; m < it; m++) v[m * 2] += y, v[m * 2 + 1] += O;
          }
          this.sharks.push({ id: c + 1, kind: u, length: i, nodes: v, heading: k, speed: 30, phase: Q(0, gt), turn: 0, hunger: Q(0.25, 0.75), wander: 0, orbitDir: l, orbitRadius: p, target: null, retargetAt: 0, depth: f });
        }
        this.sharks.sort((c, u) => c.length - u.length);
        const o = this.fishCount ?? (this.sharkSpecs.every((c) => c.kind === "koi") ? T(Math.round(t * n / 2e4), 24, 80) : T(Math.round(t * n / 4400), 85, 340));
        for (this.fish = []; this.fish.length < o; ) {
          const c = Lt(), u = Mt[c], f = Math.min(Kt(u.schoolSize[0], u.schoolSize[1]), o - this.fish.length), i = Math.random() < 0.5 ? 1 : -1, p = Q(t * 0.06, t * 0.94), M = Q(n * 0.08, n * 0.92), l = (Math.random() < 0.5 ? 0 : Math.PI) + Q(-0.5, 0.5);
          for (let b = 0; b < f; b++) this.fish.push({ x: p + Q(-1, 1) * this.sepX[c] * Math.sqrt(f), y: M + Q(-1, 1) * this.sepY[c] * Math.sqrt(f) * 0.6, vx: Math.cos(l) * u.cruise, vy: Math.sin(l) * u.cruise, species: c, alarm: 0, alive: true, respawnAt: 0, phase: Q(0, gt), turn: 0, depth: Q(0.55, 1), millDir: i });
        }
        this.bucketNext = new Int32Array(this.fish.length);
      }
      splash(t, n) {
        this.events.push({ kind: "splash", x: t, y: n });
        const e = 240;
        for (const s of this.fish) {
          if (!s.alive) continue;
          const a = s.x - t, o = s.y - n, c = Math.hypot(a, o);
          if (c > e || c < 1e-3) continue;
          const u = (1 - c / e) * 260;
          s.vx += a / c * u, s.vy += o / c * u, s.alarm = 1;
        }
      }
      step(t) {
        this.time += t, this.rebuildHash(), this.stepFish(t), this.stepSharks(t), this.respawn();
      }
      rebuildHash() {
        const t = this.perception, n = 2;
        this.bucketCols = Math.ceil(this.width / t) + n * 2, this.bucketRows = Math.ceil(this.height / t) + n * 2;
        const e = this.bucketCols * this.bucketRows;
        this.bucketHead.length !== e && (this.bucketHead = new Int32Array(e), this.bucketCount = new Uint16Array(e)), this.bucketHead.fill(-1), this.bucketCount.fill(0), this.bucketNext.length !== this.fish.length && (this.bucketNext = new Int32Array(this.fish.length));
        for (let s = 0; s < this.fish.length; s++) {
          const a = this.fish[s];
          if (!a.alive) continue;
          const o = this.bucketOf(a.x, a.y);
          this.bucketNext[s] = this.bucketHead[o], this.bucketHead[o] = s, this.bucketCount[o]++;
        }
      }
      bucketOf(t, n) {
        const e = this.perception, s = T(Math.floor(t / e) + 2, 0, this.bucketCols - 1);
        return T(Math.floor(n / e) + 2, 0, this.bucketRows - 1) * this.bucketCols + s;
      }
      stepFish(t) {
        const { fish: n, sharks: e, pointer: s, width: a, height: o, time: c } = this, u = this.perception, f = u * u, i = this.foreignSep, p = this.perception, M = this.bucketCols, l = this.bucketRows, b = this.bucketHead, g = this.bucketNext, k = this.tmp, v = Math.exp(-t * 0.7), E = Math.min(1, t * 6);
        for (let I = 0; I < n.length; I++) {
          const h = n[I];
          if (!h.alive) continue;
          const P = Mt[h.species], W = 1 + 1.8 * h.alarm, U = this.sepX[h.species] * W, y = this.sepY[h.species] * W, O = Math.hypot(h.vx, h.vy) || 1, m = h.vx / O, x = h.vy / O;
          let w = 0, D = 0, z = 0, $ = 0, Z = 0, G = 0, tt = 0, et = 0, A = 0, V = 0;
          const at = T(Math.floor(h.x / p) + 2, 0, M - 1), rt = T(Math.floor(h.y / p) + 2, 0, l - 1);
          for (let L = Math.max(0, rt - 1); L <= Math.min(l - 1, rt + 1); L++) for (let H = Math.max(0, at - 1); H <= Math.min(M - 1, at + 1); H++) {
            let q = b[L * M + H];
            for (; q !== -1; ) {
              if (q !== I) {
                const N = n[q], B = N.x - h.x, j = N.y - h.y, nt = B * B + j * j;
                if (nt < f && nt > 1e-6) {
                  const ot = Math.sqrt(nt);
                  if ((B * m + j * x) / ot > he) {
                    const Y = B / U, J = j / y, ct = Y * Y + J * J;
                    if (ct < 1) {
                      const lt = Math.sqrt(ct) || 1e-3, dt = (1 - lt) / lt;
                      z -= Y * dt, $ -= J * dt;
                    }
                    if (N.species === h.species) Z += N.vx, G += N.vy, tt += B, et += j, A++;
                    else if (ot < i) {
                      const lt = (1 - ot / i) / ot * 0.6;
                      z -= B * lt, $ -= j * lt;
                    }
                    N.alarm > V && (V = N.alarm);
                  }
                }
              }
              q = g[q];
            }
          }
          if (w += z * Nt, D += $ * Nt, A > 0) {
            const L = ae * P.align, H = re * P.cohesion * (1 - 0.8 * h.alarm);
            if (w += (Z / A - h.vx) * L + tt / A * H, D += (G / A - h.vy) * L + et / A * H, P.mill > 0) {
              const q = Math.hypot(tt, et) || 1;
              w += -et / q * h.millDir * P.mill * (1 - h.alarm), D += tt / q * h.millDir * P.mill * (1 - h.alarm);
            }
          }
          let S = 0;
          for (const L of e) {
            const H = L.length * 0.6 + 60;
            let q = 1 / 0, N = 0, B = 0;
            for (let dt = 0; dt <= 12; dt += 3) {
              const yt = L.nodes[dt * 2], mt = L.nodes[dt * 2 + 1], St = (h.x - yt) ** 2 + (h.y - mt) ** 2;
              St < q && (q = St, N = yt, B = mt);
            }
            const j = Math.sqrt(q);
            if (j >= H || j < 1e-3) continue;
            let nt = 1 - j / H;
            nt *= nt;
            const ot = (h.x - N) / j, Y = (h.y - B) / j, J = Math.cos(L.heading), ct = Math.sin(L.heading), lt = J * (h.y - L.nodes[1]) - ct * (h.x - L.nodes[0]) >= 0 ? 1 : -1;
            w += (ot * 0.7 - ct * lt * 0.9) * bt * nt, D += (Y * 0.7 + J * lt * 0.9) * bt * nt, S = Math.max(S, Math.sqrt(nt));
          }
          if (s.active) {
            const H = h.x - s.x, q = h.y - s.y, N = Math.hypot(H, q);
            if (N < 130 && N > 1e-3) {
              const B = (1 - N / 130) ** 2;
              w += H / N * bt * B, D += q / N * bt * B, S = Math.max(S, Math.sqrt(B) * 0.8);
            }
          }
          let F = Math.max(h.alarm * v, S);
          const C = V * 0.86;
          C > F && (F += (C - F) * E), h.alarm = F;
          const R = 36;
          h.x < R ? w += (R - h.x) * 7 : h.x > a - R && (w -= (h.x - (a - R)) * 7), h.y < R ? D += (R - h.y) * 7 : h.y > o - R && (D -= (h.y - (o - R)) * 7), ne(h.x, h.y, c, k), w += k.x * 0.5 + (Math.random() - 0.5) * P.jitter, D += k.y * 0.5 + (Math.random() - 0.5) * P.jitter, D -= h.vy * P.verticalDrag * (1 - 0.7 * h.alarm);
          const K = P.cruise * (1 + 1.3 * h.alarm);
          w += (K - O) * m * 1.6, D += (K - O) * x * 1.6;
          const X = Math.atan2(h.vy, h.vx);
          h.vx += w * t, h.vy += D * t;
          const st = P.maxSpeed * (1 + 1.8 * h.alarm), _ = Math.hypot(h.vx, h.vy);
          _ > st ? (h.vx *= st / _, h.vy *= st / _) : _ < P.minSpeed && _ > 1e-3 && (h.vx *= P.minSpeed / _, h.vy *= P.minSpeed / _), h.turn += (vt(X, Math.atan2(h.vy, h.vx)) / t - h.turn) * Math.min(1, t * 8), h.phase += t * (7 + Math.hypot(h.vx, h.vy) * 0.12), h.x = T(h.x + h.vx * t, -60, a + 60), h.y = T(h.y + h.vy * t, -60, o + 60);
        }
      }
      stepSharks(t) {
        torsoClient.update(this);
        const { sharks: n, width: e, height: s, time: a } = this, o = Math.min(e, s), c = e / 2, u = s / 2, f = new Map(n.map((i) => [i.id, { x: Math.cos(i.heading) * i.speed, y: Math.sin(i.heading) * i.speed, nodes: i.nodes.slice() }]));
        for (const i of n) {
          const p = i.length, M = i.nodes, l = M[0], b = M[1];
          i.hunger = Math.min(1, i.hunger + t * 0.03);
          let g = Math.cos(i.heading), k = Math.sin(i.heading);
          i.wander = T(i.wander + (Math.random() - 0.5) * t * 3.2, -1.1, 1.1), g += Math.cos(i.heading + i.wander) * 0.45, k += Math.sin(i.heading + i.wander) * 0.45, i.kind !== "koi" && a >= i.retargetAt && (i.target = this.findPrey(i), i.retargetAt = a + 0.45);
          const v = i.target;
          let E = false, I = 0;
          if (v && v.alive && i.hunger > 0.3) {
            const S = v.x + v.vx * 0.35 - l, F = v.y + v.vy * 0.35 - b, C = Math.hypot(S, F) || 1, R = 1.4 + 2.6 * i.hunger;
            g += S / C * R, k += F / C * R, E = true, I = T(1 - C / (p * 0.9), 0, 1);
          } else {
            const S = (l - c) / (e / o), F = b - u, C = Math.hypot(S, F) || 1, R = i.orbitRadius * (1 + 0.15 * Math.sin(a * 0.05 + i.id)), K = T((R - C) / R, -1, 1);
            g += (-F / C * i.orbitDir + S / C * K * 0.9) * 0.55, k += (S / C * i.orbitDir + F / C * K * 0.9) * 0.55;
          }
          let h = 0;
          if (i.kind === "koi") {
            const S = Math.cos(i.heading), F = Math.sin(i.heading), C = f.get(i.id);
            let R = 0, K = 0;
            for (const _ of n) {
              if (_ === i) continue;
              const L = f.get(_.id), H = L.x - C.x, q = L.y - C.y, N = H * H + q * q, B = p * 0.21 + _.length * 0.21 + 16;
              let j = 0, nt = 0;
              for (let Y = 0; Y < it; Y += 3) {
                const J = L.nodes[Y * 2] - l, ct = L.nodes[Y * 2 + 1] - b, lt = J * S + ct * F, dt = J * H + ct * q;
                if (lt < -p * 0.18 || dt >= 0 && Math.hypot(J, ct) > B) continue;
                const yt = 8, mt = N > 0.01 ? T(-dt / N, 0, yt) : 0, St = J + H * mt, Qt = ct + q * mt, Zt = T(1 - Math.hypot(St, Qt) / (B * 1.5), 0, 1), te = 0.55 + 0.45 * (1 - mt / yt), zt = Zt * te;
                zt > j && (j = zt, nt = S * ct - F * J);
              }
              const ot = `${i.id}:${_.id}`;
              if (j > 0.025) {
                let Y = this.koiPassSides.get(ot);
                (!Y || a > Y.until) && (Y = { side: Math.abs(nt) < B * 0.32 ? 1 : -Math.sign(nt), until: a + 3 }, this.koiPassSides.set(ot, Y)), Y.until = a + 3, R += Y.side * j, K = Math.max(K, j);
              }
            }
            const X = this.koiAvoidance.get(i.id) ?? { turn: 0, slow: 0 }, st = 1 - Math.exp(-t * 1);
            X.turn += (T(R, -1, 1) - X.turn) * st, X.slow += (K - X.slow) * st, this.koiAvoidance.set(i.id, X), g += -F * X.turn * 4, k += S * X.turn * 4, h = X.slow;
          }
          for (const S of n) if (S !== i) for (let F = 0; F < it; F += 4) {
            const C = l - S.nodes[F * 2], R = b - S.nodes[F * 2 + 1], K = Math.hypot(C, R), X = (p + S.length) * 0.45;
            if (K < X && K > 1e-3) {
              const st = (1 - K / X) * 3;
              g += C / K * st, k += R / K * st;
            }
          }
          const P = (l - c) / (e * 0.3), W = (b - u) / (s * 0.16), U = P * P + W * W;
          if (i.kind !== "koi" && U < 1) {
            const S = Math.sqrt(U) || 1e-3, F = (1 - S) * (E ? 1 : 2.5);
            g += P / S * F, k += W / S * F;
          }
          const torso = this.torsoPlan?.get(i.id);
          if (torso?.weight) {
            g = Math.cos(torso.heading) * 8;
            k = Math.sin(torso.heading) * 8;
          }
          if (i.kind === "koi") {
            const S = p * 0.4 + 40, F = p * 0.48, C = p * 0.4, R = Math.cos(i.heading) * C, K = Math.sin(i.heading) * C;
            let X = 1 / 0, st = -1 / 0, _ = 1 / 0, L = -1 / 0;
            for (let ot = 0; ot < it; ot++) {
              const Y = M[ot * 2], J = M[ot * 2 + 1];
              X = Math.min(X, Y, Y + R), st = Math.max(st, Y, Y + R), _ = Math.min(_, J, J + K), L = Math.max(L, J, J + K);
            }
            const H = T((S + F - X) / F, 0, 1), q = T((st - (e - S - F)) / F, 0, 1), N = T((S + F - _) / F, 0, 1), B = T((L - (s - S - F)) / F, 0, 1), j = Math.max(H, q, N, B), nt = 1 - 0.94 * j * j;
            g = g * nt + (H * H - q * q) * 8, k = k * nt + (N * N - B * B) * 8;
          } else {
            const S = Math.max(-l, l - e, -b, b - s);
            if (S > -p * 0.05) {
              const F = T((S + p * 0.05) / (p * 0.35), 0, 1) * 3.5, C = c - l, R = u - b, K = Math.hypot(C, R) || 1;
              g += C / K * F, k += R / K * F;
            }
          }
          const y = Math.atan2(k, g), O = torso?.weight ? Math.max(0.28, Math.min(0.8, i.speed / (p * 0.18))) : Math.min(E ? 1.7 + I : 0.8, i.speed / (p * (i.kind === "koi" ? 0.18 : 0.22))), m = O * t, x = T(vt(i.heading, y), -m, m), w = T(vt(i.heading, y) * 2, -O, O), D = i.turn + (w - i.turn) * (1 - Math.exp(-t * 4)), z = i.kind === "koi" ? D * t : x;
          i.heading += z, i.kind === "koi" ? i.turn = D : i.turn += (z / t - i.turn) * Math.min(1, t * 3);
          const $ = i.kind === "koi" ? 18 + p * 0.022 : 30 + p * 0.04, Z = 0.5 + 0.5 * Math.sin(a * gt / (19 + i.id * 2.3) + i.id * 2.1), G = T((Z - 0.22) / 0.6, 0, 1), tt = G * G * (3 - 2 * G), et = i.kind === "koi" ? 0.48 + 0.52 * tt : 1, A = E ? $ * (1.45 + I * 1.5) : $ * et * (torso?.weight ? 1 : 1 - 0.55 * h);
          i.speed += (A * (torso?.weight ? torso.scale : 1) - i.speed) * Math.min(1, t * (i.kind === "koi" ? 0.45 : 1.1)), i.phase += t * (i.kind === "koi" ? 0.85 + i.speed / 26 : 2 + i.speed / 24), M[0] += Math.cos(i.heading) * i.speed * t, M[1] += Math.sin(i.heading) * i.speed * t;
          const V = p / (it - 1), at = i.kind === "koi" ? 0.1 : 0.16;
          let rt = i.heading + Math.PI;
          for (let S = 1; S < it; S++) {
            const F = M[(S - 1) * 2], C = M[(S - 1) * 2 + 1];
            let R = Math.atan2(M[S * 2 + 1] - C, M[S * 2] - F);
            R = rt + T(vt(rt, R), -at, at), M[S * 2] = F + Math.cos(R) * V, M[S * 2 + 1] = C + Math.sin(R) * V, rt = R;
          }
          if (i.kind !== "koi" && i.hunger > 0.15) {
            const S = p * 0.05 + 8, F = M[0], C = M[1];
            for (const R of this.fish) R.alive && (R.x - F) ** 2 + (R.y - C) ** 2 < S * S && (R.alive = false, R.respawnAt = a + Q(3, 8), i.hunger = Math.max(0, i.hunger - 0.16), this.events.push({ kind: "eat", x: R.x, y: R.y }));
          }
        }
      }
      findPrey(t) {
        const n = t.length * 0.9 + 160, e = t.nodes[0], s = t.nodes[1], a = Math.cos(t.heading), o = Math.sin(t.heading);
        let c = null, u = 1 / 0, f = 1 / 0;
        for (const i of this.fish) {
          if (!i.alive) continue;
          const p = i.x - e, M = i.y - s, l = Math.hypot(p, M);
          if (l > n || l < 1e-3) continue;
          const b = (p * a + M * o) / l;
          if (b < 0.2) continue;
          const g = this.bucketCount[this.bucketOf(i.x, i.y)], k = l * (1 + (1 - b) * 0.8) * (1 + g * 0.07);
          k < u && (u = k, c = i), i === t.target && (f = k);
        }
        return t.target && f < u * 1.3 ? t.target : c;
      }
      respawn() {
        const { time: t, width: n, height: e } = this, s = [];
        for (const l of this.fish) !l.alive && l.respawnAt <= t && s.push(l);
        if (s.length === 0 || s.length < 6 && t - this.lastSpawn < 9) return;
        this.lastSpawn = t;
        const a = Kt(0, 3), o = Q(0.15, 0.85), c = a === 0 ? -20 : a === 1 ? n + 20 : o * n, u = a === 2 ? -20 : a === 3 ? e + 20 : o * e, f = Math.atan2(e / 2 - u, n / 2 - c) + Q(-0.5, 0.5), i = Lt(), p = Mt[i], M = Math.random() < 0.5 ? 1 : -1;
        for (const l of s.slice(0, p.schoolSize[1])) l.alive = true, l.species = i, l.alarm = 0, l.turn = 0, l.millDir = M, l.x = c + Q(-1, 1) * this.perception, l.y = u + Q(-1, 1) * this.perception, l.vx = Math.cos(f) * p.cruise * 1.4, l.vy = Math.sin(f) * p.cruise * 1.4;
      }
    };
    var ut = 6;
    var wt = [0.28, 0.42, 0.58, 0.74, 0.9];
    var Dt = [[48, 52, 235], [52, 205, 60], [228, 50, 44], [190, 212, 255], [144, 164, 161]];
    var le = [1, 1, 1, 1, 1];
    var Gt = Dt.length - 1;
    var At = ["#e0892c", "#e03a32", "#b44ae0", "#33c8cc", "#3cb54a", "#3150e8", "#d9c14a"];
    var Ut = ":;t%SX8#@";
    var $t = "%;tS:";
    var Yt = "@8%";
    var de = ":;";
    var fe = ".',`";
    var Xt = 1;
    var Rt = 2;
    var It = 3;
    var Bt = 4;
    var kt = 5;
    var Ft = 6;
    var jt = "#%@";
    var Tt = [0.25, 0.3, 0.75, 0.3, 0.25, 0.72, 0.75, 0.72];
    function Ct(r) {
      if (r < 0.13) return 0.09 * Math.pow(Math.sin(r / 0.13 * Math.PI / 2), 0.95);
      if (r < 0.3) return 0.09 + 0.016 * ft(0.13, 0.3, r);
      if (r < 0.84) return 0.019 + 0.087 * Math.pow(1 - (r - 0.3) / 0.54, 1.25);
      const t = (r - 0.84) / 0.16;
      return 0.019 * (1 - t) + 0.012 * Math.sin(t * Math.PI);
    }
    var ht = { koi: { halfWidth: (r) => r < 0.1 ? 0.105 * Math.pow(Math.sin(r / 0.1 * Math.PI / 2), 0.45) : r < 0.3 ? 0.105 + 0.025 * Math.sin((r - 0.1) / 0.2 * Math.PI / 2) : r < 0.84 ? 0.023 + 0.107 * Math.pow(1 - (r - 0.3) / 0.54, 1) : 0.023 * (1 - (r - 0.84) / 0.16), pectoral: [0.2, 0.48, 0.4, 0.22], falcate: false, pelvic: [0.56, 0.69, 0.67, 0.105], caudal: 0.15, dorsal: [0.35, 0.62], secondDorsal: [1, 1], eye: [0.08, 0.094], gills: [1, 1], tint: [1, 0.98, 0.91] }, classic: { halfWidth: Ct, pectoral: [0.15, 0.43, 0.55, 0.26], falcate: true, pelvic: [0.57, 0.65, 0.69, 0.085], caudal: 0.085, dorsal: [0.33, 0.47], secondDorsal: [0.71, 0.76], eye: [0.1, 0.14], gills: [0.19, 0.29], tint: [0.92, 0.97, 1.05] }, hammerhead: { halfWidth: (r) => r < 0.06 ? 0.045 : r < 0.3 ? 0.045 + 0.061 * ft(0.06, 0.3, r) : Ct(r) * 0.92, head: { span: 0.17, sweep: 0.035, depth: 0.09, notch: 0 }, pectoral: [0.17, 0.4, 0.5, 0.22], falcate: true, pelvic: [0.56, 0.63, 0.67, 0.075], caudal: 0.11, dorsal: [0.28, 0.44], secondDorsal: [0.7, 0.74], eye: null, gills: [0.16, 0.26], tint: [0.96, 0.98, 0.9] }, tiger: { halfWidth: (r) => {
      if (r < 0.13) return 0.1 * Math.pow(Math.sin(r / 0.13 * Math.PI / 2), 0.45);
      if (r < 0.3) return 0.1 + 0.014 * ft(0.13, 0.3, r);
      if (r < 0.84) return 0.019 + 0.095 * Math.pow(1 - (r - 0.3) / 0.54, 1.2);
      const t = (r - 0.84) / 0.16;
      return 0.019 * (1 - t) + 0.012 * Math.sin(t * Math.PI);
    }, pectoral: [0.15, 0.42, 0.53, 0.25], falcate: true, pelvic: [0.57, 0.65, 0.69, 0.085], caudal: 0.095, dorsal: [0.33, 0.46], secondDorsal: [0.71, 0.75], eye: [0.08, 0.12], gills: [0.19, 0.28], tint: [1.02, 0.95, 0.84] }, zebra: { halfWidth: (r) => {
      if (r < 0.1) return 0.075 * Math.pow(Math.sin(r / 0.1 * Math.PI / 2), 0.7);
      if (r < 0.28) return 0.075 + 0.025 * ft(0.1, 0.28, r);
      if (r < 0.55) return 0.022 + 0.078 * Math.pow(1 - (r - 0.28) / 0.27, 1.1);
      const t = (r - 0.55) / 0.45;
      return 0.022 * (1 - t * t) + 0.012 * Math.sin(t * Math.PI);
    }, pectoral: [0.12, 0.3, 0.36, 0.19], falcate: false, pelvic: [0.42, 0.48, 0.51, 0.065], caudal: 0, dorsal: [0.36, 0.44], secondDorsal: [0.49, 0.53], eye: [0.06, 0.09], gills: [0.13, 0.2], tint: [1.08, 0.97, 0.74] }, greathammer: { halfWidth: (r) => r < 0.05 ? 0.04 : r < 0.3 ? 0.04 + 0.07 * ft(0.05, 0.3, r) : Ct(r) * 0.95, head: { span: 0.21, sweep: 6e-3, depth: 0.085, notch: 0.014 }, pectoral: [0.16, 0.38, 0.49, 0.24], falcate: true, pelvic: [0.55, 0.62, 0.67, 0.085], caudal: 0.13, dorsal: [0.24, 0.45], secondDorsal: [0.68, 0.74], eye: null, gills: [0.15, 0.25], tint: [0.86, 0.93, 1.02] }, mako: { halfWidth: (r) => {
      if (r < 0.17) return 0.088 * Math.pow(Math.sin(r / 0.17 * Math.PI / 2), 1.5);
      if (r < 0.32) return 0.088 + 0.012 * ft(0.17, 0.32, r);
      if (r < 0.86) return 0.014 + 0.086 * Math.pow(1 - (r - 0.32) / 0.54, 1.45);
      const t = (r - 0.86) / 0.14;
      return 0.014 * (1 - t) + 0.01 * Math.sin(t * Math.PI);
    }, pectoral: [0.18, 0.4, 0.5, 0.21], falcate: true, pelvic: [0.58, 0.64, 0.68, 0.06], caudal: 0.13, dorsal: [0.34, 0.45], secondDorsal: [0.76, 0.79], eye: [0.11, 0.15], gills: [0.2, 0.3], tint: [0.78, 0.9, 1.2] }, thresher: { halfWidth: (r) => {
      if (r < 0.08) return 0.07 * Math.pow(Math.sin(r / 0.08 * Math.PI / 2), 0.75);
      if (r < 0.2) return 0.07 + 0.02 * ft(0.08, 0.2, r);
      if (r < 0.48) return 0.012 + 0.078 * Math.pow(1 - (r - 0.2) / 0.28, 1.3);
      const t = (r - 0.48) / 0.52;
      return 0.012 * (1 - t) + 6e-3 * Math.sin(t * Math.PI * 0.9) + 2e-3;
    }, pectoral: [0.12, 0.27, 0.36, 0.2], falcate: true, pelvic: [0.37, 0.41, 0.44, 0.045], caudal: 0, dorsal: [0.24, 0.32], secondDorsal: [0.45, 0.47], eye: [0.05, 0.1], gills: [0.11, 0.18], tint: [1, 0.9, 1.08] }, nurse: { halfWidth: (r) => {
      if (r < 0.08) return 0.085 * Math.pow(Math.sin(r / 0.08 * Math.PI / 2), 0.4);
      if (r < 0.3) return 0.085 + 0.02 * ft(0.08, 0.3, r);
      if (r < 0.72) return 0.022 + 0.083 * Math.pow(1 - (r - 0.3) / 0.42, 1.1);
      const t = (r - 0.72) / 0.28;
      return 0.022 * (1 - t * t) + 0.014 * Math.sin(t * Math.PI);
    }, pectoral: [0.16, 0.34, 0.4, 0.17], falcate: false, pelvic: [0.45, 0.52, 0.55, 0.075], caudal: 0, dorsal: [0.5, 0.58], secondDorsal: [0.63, 0.69], eye: [0.05, 0.075], gills: [0.14, 0.22], tint: [1.1, 0.96, 0.76] } };
    var Ot = Object.keys(ht);
    function Pt(r, t, n, e, s, a, o, c) {
      const u = (r - s) * (e - a) - (n - s) * (t - a), f = (r - o) * (a - c) - (s - o) * (t - c), i = (r - n) * (c - e) - (o - n) * (t - e), p = u < 0 || f < 0 || i < 0, M = u > 0 || f > 0 || i > 0;
      return !(p && M);
    }
    function ue(r, t, n, e, s, a) {
      r.setTransform(1, 0, 0, 1, 0, 0), r.strokeStyle = "rgba(90,103,113,0.025)", r.lineWidth = 1, r.beginPath();
      for (let o = 0; o <= Math.ceil(t / e); o++) {
        const c = Math.round(o * e * a) + 0.5;
        r.moveTo(c, 0), r.lineTo(c, n * a);
      }
      for (let o = 0; o <= Math.ceil(n / s); o++) {
        const c = Math.round(o * s * a) + 0.5;
        r.moveTo(0, c), r.lineTo(t * a, c);
      }
      r.stroke();
    }
    var pe = class {
      constructor(t) {
        d(this, "ctx");
        d(this, "bg");
        d(this, "dpr", 1);
        d(this, "width", 0);
        d(this, "height", 0);
        d(this, "cw", 12);
        d(this, "ch", 18);
        d(this, "cols", 0);
        d(this, "rows", 0);
        d(this, "fontFamily", "ui-monospace, Menlo, monospace");
        d(this, "dotKind", new Uint8Array(0));
        d(this, "dotPhase", new Float32Array(0));
        d(this, "dotFreq", new Float32Array(0));
        d(this, "energy", new Float32Array(0));
        d(this, "energyTmp", new Float32Array(0));
        d(this, "heat", new Float32Array(0));
        d(this, "bucketOf", new Uint8Array(0));
        d(this, "bucketOrder", new Int32Array(0));
        d(this, "bucketCounts", new Int32Array(Dt.length * ut + 1));
        d(this, "dotStyles", []);
        d(this, "koiS", new Float32Array(0));
        d(this, "koiV", new Float32Array(0));
        d(this, "koiId", new Uint8Array(0));
        d(this, "sharkFlag", new Uint8Array(0));
        d(this, "sharkShade", new Float32Array(0));
        d(this, "sharkKey", new Uint32Array(0));
        d(this, "sharkDepth", new Float32Array(0));
        d(this, "sharkKind", new Uint8Array(0));
        d(this, "sharkShadow", new Uint8Array(0));
        d(this, "spine", new Float32Array(it * 2));
        d(this, "arc", new Float32Array(it));
        d(this, "arcTotal", 1);
        d(this, "shape", ht.classic);
        d(this, "sharkId", 0);
        d(this, "finTipLeft", 0);
        d(this, "finTipRight", 0);
        d(this, "hitFlag", 0);
        d(this, "hitShade", 0);
        d(this, "hitS", 0);
        d(this, "hitV", 0);
        d(this, "hitDist", 0);
        d(this, "fishStamp", new Uint32Array(0));
        d(this, "frameId", 0);
        d(this, "fishBuckets", wt.map(() => []));
        d(this, "koiPond", false);
        d(this, "driftFishStyles", wt.map((t2) => `rgba(96,122,118,${t2 * 0.9})`));
        d(this, "fishStyles", wt.map((t2) => `rgba(230,238,255,${t2})`));
        this.canvas = t;
        const n = t.getContext("2d", { alpha: false });
        if (!n) throw new Error("2D canvas unavailable");
        this.ctx = n, this.bg = document.createElement("canvas");
        for (let e = 0; e < Dt.length; e++) {
          const [s, a, o] = Dt[e];
          for (let c = 0; c < ut; c++) {
            const u = le[e] * (c + 1) / ut;
            this.dotStyles.push(`rgba(${s},${a},${o},${u.toFixed(3)})`);
          }
        }
      }
      get cellWidth() {
        return this.cw;
      }
      get cellHeight() {
        return this.ch;
      }
      setFontFamily(t) {
        t && (this.fontFamily = t);
      }
      resize(t, n, e) {
        this.width = t, this.height = n, this.dpr = e, this.cw = T(Math.round(t / 210), 5, 8), this.ch = Math.round(this.cw * 1.45), this.cols = Math.ceil(t / this.cw), this.rows = Math.ceil(n / this.ch), this.canvas.width = Math.round(t * e), this.canvas.height = Math.round(n * e), this.bg.width = this.canvas.width, this.bg.height = this.canvas.height;
        const s = this.cols * this.rows;
        this.dotKind = new Uint8Array(s), this.dotPhase = new Float32Array(s), this.dotFreq = new Float32Array(s), this.energy = new Float32Array(s), this.energyTmp = new Float32Array(s), this.heat = new Float32Array(s), this.bucketOf = new Uint8Array(s), this.bucketOrder = new Int32Array(s), this.koiS = new Float32Array(s), this.koiV = new Float32Array(s), this.koiId = new Uint8Array(s), this.sharkFlag = new Uint8Array(s), this.sharkShade = new Float32Array(s), this.sharkKey = new Uint32Array(s), this.sharkDepth = new Float32Array(s), this.sharkKind = new Uint8Array(s), this.sharkShadow = new Uint8Array(s), this.fishStamp = new Uint32Array(s);
        for (let a = 0; a < s; a++) {
          const o = a % this.cols, c = a / this.cols | 0;
          this.dotKind[a] = 0, this.dotPhase[a] = pt(o, c, 23) * Math.PI * 2, this.dotFreq[a] = 0.3 + pt(o, c, 37) * 1.1;
        }
        this.paintBackground();
      }
      paintBackground() {
        const t = this.bg.getContext("2d");
        if (!t) return;
        const { width: n, height: e, dpr: s, cw: a, ch: o } = this;
        t.setTransform(s, 0, 0, s, 0, 0);
        const c = t.createRadialGradient(n * 0.45, e * 0.4, 20, n * 0.5, e * 0.5, n * 0.8);
        c.addColorStop(0, pondCSS([255,255,255],[255,245,228],[20,38,54])), c.addColorStop(0.55, pondCSS([253,254,253],[251,236,217],[12,25,39])), c.addColorStop(1, pondCSS([248,250,249],[235,214,196],[7,17,29])), t.fillStyle = c, t.fillRect(0, 0, n, e), ue(t, n, e, a, o, s);
      }
      render(t, n) {
        const { ctx: e, dpr: s, cols: a, ch: o } = this;
        if (a === 0) return;
        const c = t.time;
        const theme=globalThis.koiTheme || {dusk:0,night:0};
        const key=Math.round(theme.dusk*100)+":"+Math.round(theme.night*100);
        if(this.themeKey!==key) {
          this.themeKey=key;this.paintBackground();
          const rgb=pondRGB([96,122,118],[124,112,96],[119,156,167]);
          this.driftFishStyles=wt.map(alpha=>`rgba(${rgb.join(",")},${alpha*(0.9-theme.night*0.15)})`);
        }
        this.koiPond = t.sharks.every((u) => u.kind === "koi"), this.consumeEvents(t), this.rasterizeSharks(t.sharks, c), this.depositWake(t), this.diffuse(n), e.setTransform(1, 0, 0, 1, 0, 0), e.drawImage(this.bg, 0, 0), e.setTransform(s, 0, 0, s, 0, 0), this.drawWaterLight(c), this.markFish(t), this.drawDots(c), e.font = `600 ${Math.round(o * 0.74)}px ${this.fontFamily}`, e.textAlign = "center", e.textBaseline = "middle", this.drawHeat(), this.drawFish(), this.drawSharks(c);
      }
      drawWaterLight(t) {
        const { ctx: n, width: e, height: s } = this, a = Math.sin(t * 0.085) * e * 0.065, o = n.createLinearGradient(-e * 0.2 + a, 0, e * 1.1 + a, s * 0.35);
        o.addColorStop(0, "rgba(111,151,151,0)"), o.addColorStop(0.2, "rgba(111,151,151,0)"), o.addColorStop(0.3, "rgba(111,151,151,.024)"), o.addColorStop(0.39, "rgba(255,255,255,0)"), o.addColorStop(0.59, "rgba(255,255,255,0)"), o.addColorStop(0.71, "rgba(161,151,115,.019)"), o.addColorStop(0.83, "rgba(255,255,255,0)"), o.addColorStop(1, "rgba(255,255,255,0)"), n.fillStyle = o, n.fillRect(0, 0, e, s);
        const c = s * (0.57 + Math.sin(t * 0.061 + 1.3) * 0.055), u = n.createRadialGradient(e * 0.56, c, 0, e * 0.56, c, e * 0.48);
        u.addColorStop(0, "rgba(164,185,171,.014)"), u.addColorStop(0.65, "rgba(164,185,171,.005)"), u.addColorStop(1, "rgba(164,185,171,0)"), n.fillStyle = u, n.fillRect(0, 0, e, s);
      }
      cellIndex(t, n) {
        const e = Math.floor(t / this.cw), s = Math.floor(n / this.ch);
        return e < 0 || s < 0 || e >= this.cols || s >= this.rows ? -1 : s * this.cols + e;
      }
      stamp(t, n, e, s, a) {
        const o = Math.floor(n / this.cw), c = Math.floor(e / this.ch);
        for (let u = c - s; u <= c + s; u++) for (let f = o - s; f <= o + s; f++) {
          if (f < 0 || u < 0 || f >= this.cols || u >= this.rows) continue;
          const i = Math.hypot(f - o, (u - c) * 1.4);
          if (i > s + 0.5) continue;
          const p = u * this.cols + f;
          t[p] = Math.min(1.6, t[p] + a * (1 - i / (s + 1)));
        }
      }
      consumeEvents(t) {
        for (const n of t.events) n.kind === "eat" ? (this.stamp(this.heat, n.x, n.y, 2, 1), this.stamp(this.energy, n.x, n.y, 3, 0.9)) : this.stamp(this.energy, n.x, n.y, 6, 1.4);
        t.events.length = 0;
      }
      depositWake(t) {
        const { energy: n } = this;
        for (const e of t.fish) {
          if (!e.alive) continue;
          const s = this.cellIndex(e.x, e.y);
          s >= 0 && (n[s] = Math.min(1.6, n[s] + 0.012 + e.alarm * 0.03));
        }
        for (const e of t.sharks) for (let s = it - 6; s < it; s++) {
          const a = this.cellIndex(e.nodes[s * 2], e.nodes[s * 2 + 1]);
          a >= 0 && (n[a] = Math.min(1.6, n[a] + 0.05 + e.speed * 12e-4));
        }
        t.pointer.active && this.stamp(n, t.pointer.x, t.pointer.y, 1, 0.08);
      }
      diffuse(t) {
        const { cols: n, rows: e, energy: s, energyTmp: a, heat: o } = this, c = Math.exp(-t * 1.5);
        for (let f = 0; f < e; f++) for (let i = 0; i < n; i++) {
          const p = f * n + i, M = i > 0 ? s[p - 1] : s[p], l = i < n - 1 ? s[p + 1] : s[p], b = f > 0 ? s[p - n] : s[p], g = f < e - 1 ? s[p + n] : s[p];
          a[p] = (s[p] * 4 + M + l + b + g) * 0.125 * c;
        }
        this.energy = a, this.energyTmp = s;
        const u = Math.exp(-t * 2.2);
        for (let f = 0; f < o.length; f++) o[f] *= u;
      }
      sampleShark(t, n, e) {
        const { spine: s, arc: a } = this, o = it;
        let c = 1 / 0, u = 0, f = 1, i = 0, p = 0;
        for (let m = 0; m < o - 1; m++) {
          const x = s[m * 2], w = s[m * 2 + 1], D = s[(m + 1) * 2] - x, z = s[(m + 1) * 2 + 1] - w, $ = D * D + z * z || 1, Z = T(((t - x) * D + (n - w) * z) / $, 0, 1), G = x + D * Z, tt = w + z * Z, et = (t - G) ** 2 + (n - tt) ** 2;
          if (et < c) {
            c = et;
            const A = Math.sqrt($);
            u = (a[m] + Z * A) / this.arcTotal, f = D * (n - w) - z * (t - x) >= 0 ? 1 : -1, i = -z / A * f, p = D / A * f;
          }
        }
        if (this.shape === ht.koi && u > 0.999) {
          const m = s[(o - 1) * 2] - s[(o - 2) * 2], x = s[(o - 1) * 2 + 1] - s[(o - 2) * 2 + 1];
          if ((t - s[(o - 1) * 2]) * m + (n - s[(o - 1) * 2 + 1]) * x > 0) return false;
        }
        const M = Math.sqrt(c), l = u, b = l * e, g = this.shape, k = g.halfWidth(l) * e;
        this.hitDist = M, this.hitS = l, this.hitV = M * f;
        const v = this.shape.head;
        if (v && b < e * (v.sweep + v.depth + v.notch)) {
          const m = e * v.span, x = M / m, w = e * v.sweep * x * x + e * v.notch * Math.max(0, 1 - x / 0.14), D = e * v.depth * (1 - 0.2 * x * x * x * x);
          if (x <= 1 && b >= w && b <= w + D) return this.hitFlag = x > 0.84 ? kt : Xt, this.hitShade = x > 0.84 ? 0 : 0.62 - 0.2 * x + (b < w + e * 0.012 ? 0.1 : 0), true;
        }
        if (M <= k) {
          const m = M / (k || 1), x = (i * -0.6 + p * -0.8) * m;
          let w = 0.58 - m * m * 0.42 + x * 0.26, D = Xt;
          return l > g.dorsal[0] && l < g.dorsal[1] && m < 0.3 ? (D = Bt, w = 1) : l > g.secondDorsal[0] && l < g.secondDorsal[1] && m < 0.4 ? w = Math.max(w, 0.82) : g.eye && l > g.eye[0] && l < g.eye[1] && m > (g === ht.koi ? 0.82 : 0.6) ? (D = kt, w = 0) : l > g.gills[0] && l < g.gills[1] && m > 0.58 ? Math.floor((l - g.gills[0]) / (g.gills[1] - g.gills[0]) * 5) % 2 === 0 && (w *= 0.45) : l < 0.05 ? w = Math.max(w, 0.7) : g === ht.zebra && l > 0.08 && l < 0.55 && (m < 0.1 || Math.abs(m - 0.6) < 0.08) ? w = Math.max(w, 0.8) : this.marked(l, M * f, e, m) && (D = Ft), this.hitFlag = D, this.hitShade = w, true;
        }
        const E = f > 0 ? this.finTipRight : this.finTipLeft, [I, h, P] = g.pectoral;
        if ((g === ht.koi ? ((l - 0.34) / 0.135) ** 2 + ((M / e - 0.1) / (E / e - 0.07)) ** 2 < 1 : Pt(b, M, e * I, 0, e * h, 0, e * P, E)) && !(g.falcate && Pt(b, M, e * h, 0, e * (h + (P - h) * 0.33), E * 0.55, e * P, E))) return this.hitFlag = this.marked(l, M * f, e, 0) ? Ft : It, this.hitShade = 0.38 + 0.22 * (1 - T(M / E, 0, 1)), true;
        const [W, U, y, O] = g.pelvic;
        return Pt(b, M, e * W, 0, e * U, 0, e * y, e * O) || (g === ht.koi ? l > 0.8 && M / e < 0.018 + (l - 0.8) / 0.2 * 0.15 && l < 0.91 + 0.09 * Math.min(1, M / e / 0.12) : g.caudal > 0 && Pt(b, M, e * 0.86, 0, e * 0.95, 0, e, e * g.caudal)) ? (this.hitFlag = It, this.hitShade = 0.36, true) : false;
      }
      marked(t, n, e, s) {
        if (this.shape === ht.tiger) {
          if (t < 0.2 || t > 0.9 || s > 0.85) return false;
          const a = 0.35 * Math.sin(n / e * 25 + t * 5);
          return Math.sin(t * Math.PI * 2 * 9 + a) > 0.65 - 0.5 * ft(0.2, 0.42, t) + 0.4 * ft(0.8, 0.9, t);
        }
        if (this.shape === ht.zebra) {
          if (t < 0.07) return false;
          const a = t * e / (e * 0.06), o = n / (e * 0.045), c = Math.floor(a), u = Math.floor(o), f = pt(c, u, this.sharkId) * 0.5 + 0.25, i = pt(c, u, this.sharkId + 11) * 0.5 + 0.25;
          return (a - c - f) ** 2 + (o - u - i) ** 2 < 0.08;
        }
        return false;
      }
      rasterizeSharks(t, n) {
        const { sharkFlag: e, sharkShade: s, sharkKey: a, sharkDepth: o, sharkKind: c, sharkShadow: u, spine: f, arc: i, cw: p, ch: M, cols: l, rows: b } = this;
        e.fill(0), u.fill(0);
        for (const g of t) {
          const k = g.length, v = it, E = g.nodes, I = T(g.speed / 60, 0.4, 1.4);
          this.shape = ht[g.kind], this.sharkId = g.id;
          const h = Ot.indexOf(g.kind);
          for (let A = 0; A < v; A++) {
            const V = A / (v - 1), at = Math.max(0, A - 1), rt = Math.min(v - 1, A + 1);
            let S = E[at * 2] - E[rt * 2], F = E[at * 2 + 1] - E[rt * 2 + 1];
            const C = Math.hypot(S, F) || 1;
            S /= C, F /= C;
            const K = k * (g.kind === "koi" ? 0.03 : 0.05) * (0.1 + 0.9 * Math.pow(V, 1.8)) * I * Math.sin(g.phase - V * 5.2);
            f[A * 2] = E[A * 2] - F * K, f[A * 2 + 1] = E[A * 2 + 1] + S * K;
          }
          i[0] = 0;
          for (let A = 1; A < v; A++) i[A] = i[A - 1] + Math.hypot(f[A * 2] - f[(A - 1) * 2], f[A * 2 + 1] - f[(A - 1) * 2 + 1]);
          this.arcTotal = i[v - 1] || 1;
          const P = T(g.turn * 0.45, -0.35, 0.35), W = 1 + 0.06 * Math.sin(g.phase * 0.5), U = this.shape.pectoral[3];
          this.finTipRight = k * U * W * (1 - P), this.finTipLeft = k * U * W * (1 + P);
          let y = 1 / 0, O = 1 / 0, m = -1 / 0, x = -1 / 0;
          for (let A = 0; A < v; A++) y = Math.min(y, f[A * 2]), m = Math.max(m, f[A * 2]), O = Math.min(O, f[A * 2 + 1]), x = Math.max(x, f[A * 2 + 1]);
          const w = k * 0.36, D = Math.max(0, Math.floor((y - w) / p)), z = Math.min(l - 1, Math.floor((m + w) / p)), $ = Math.max(0, Math.floor((O - w) / M)), Z = Math.min(b - 1, Math.floor((x + w) / M));
          if (D > z || $ > Z) continue;
          const G = w + Math.hypot(p, M), tt = Math.round(k * 0.035 / p) + 1, et = Math.round(k * 0.02 / M) + 1;
          for (let A = $; A <= Z; A++) for (let V = D; V <= z; V++) {
            const at = V * p, rt = A * M, S = this.sampleShark(at + p / 2, rt + M / 2, k);
            if (!S && this.hitDist > G) continue;
            const F = this.hitFlag, C = this.hitShade, R = this.hitS, K = this.hitV;
            let X = S ? 1 : 0;
            for (let H = 0; H < Tt.length; H += 2) this.sampleShark(at + Tt[H] * p, rt + Tt[H + 1] * M, k) && X++;
            if (X === 0) continue;
            const st = X / 5, _ = A * l + V, L = pt(Math.round(R * 52), Math.round(K / (p * 0.9)), g.id) * 4294967295 >>> 0;
            if (a[_] = L, this.koiS[_] = R, this.koiV[_] = K / k, this.koiId[_] = g.id, o[_] = g.depth, c[_] = h, S && st >= 0.6) {
              e[_] = F;
              const H = (pt(V, A, Math.floor(n * 6)) - 0.5) * 0.06;
              s[_] = T(C + H, 0, 1);
              const q = V + tt, N = A + et;
              q < l && N < b && (u[N * l + q] = 1);
            } else e[_] = Rt, s[_] = st;
          }
        }
      }
      drawSharks(t) {
        const { ctx: n, cols: e, rows: s, cw: a, ch: o, sharkFlag: c, sharkShade: u, sharkKey: f, sharkDepth: i, sharkKind: p } = this, M = e * s;
        for (let l = 0; l < M; l++) {
          const b = c[l];
          if (!b) continue;
          const g = l % e, k = l / e | 0, v = g * a, E = k * o, I = f[l], h = u[l], P = 0.7 + 0.3 * i[l], [W, U, y] = ht[Ot[p[l]]].tint, O = Math.floor(t * 2.4 + I % 997 / 97), m = pt(I, O, 7);
          if (Ot[p[l]] === "koi") {
            this.drawKoiCell(l, v, E, b, h, I, P, t);
            continue;
          }
          if (b === Rt) {
            const z = h >= 0.5 ? de : fe, $ = (70 + h * 80) * P;
            n.fillStyle = m < 0.07 ? At[I % At.length] : `rgb(${Math.round($ * W)},${Math.round($ * U)},${Math.min(255, Math.round($ * y + 6))})`, n.fillText(z[(I >>> 8) % z.length], v + a / 2, E + o / 2 + 1);
            continue;
          }
          let x, w;
          if (b === Bt) x = 226, w = Yt[(I >>> 8) % Yt.length];
          else if (b === kt) x = 12, w = "o";
          else if (b === Ft) x = 24 + h * 22, w = jt[(I >>> 8) % jt.length];
          else if (b === It) x = 40 + h * 120, w = $t[(I >>> 8) % $t.length];
          else {
            x = 46 + h * 160;
            const z = (I >>> 4) % 3 - 1;
            w = Ut[T(Math.floor((1 - h) * 8.99) + z, 0, Ut.length - 1)];
          }
          x *= P, n.fillStyle = `rgb(${Math.min(255, Math.round(x * W))},${Math.min(255, Math.round(x * U))},${Math.min(255, Math.round(x * y + 4))})`, n.fillRect(v + 1, E + 1, a - 1, o - 1);
          let D;
          b === kt ? D = "#9aa0ad" : b === Ft ? D = `rgb(${Math.round(70 * W)},${Math.round(70 * U)},${Math.round(70 * y)})` : m < 0.09 ? D = At[I % At.length] : m < 0.13 ? D = "#ffffff" : D = h > 0.55 ? "#0e0f13" : "#1b1d24", n.fillStyle = D, n.fillText(w, v + a / 2, E + o / 2 + 1);
        }
      }
      drawKoiCell(t, n, e, s, a, o, c, u) {
        const { ctx: f, cw: i, ch: p } = this, M = this.koiS[t], l = this.koiV[t], b = this.koiId[t], g = 0.5 + 0.5 * Math.sin(M * 36 + l * 44 + u * 0.65);
        let k = 0;
        const v = 0.013 * Math.sin(M * 68 + b) + 8e-3 * Math.sin(l * 91), E = (G, tt, et, A) => ((M - G) / et) ** 2 + ((l - tt + v) / A) ** 2 < 1;
        b === 1 ? (E(0.16, 0, 0.12, 0.085) || E(0.44, -0.03, 0.12, 0.11) || E(0.69, 0.015, 0.1, 0.07)) && (k = 1) : b === 2 ? ((E(0.12, 0, 0.095, 0.077) || E(0.39, 0.04, 0.13, 0.095) || E(0.67, -0.02, 0.1, 0.067)) && (k = 1), (E(0.28, -0.06, 0.06, 0.045) || E(0.53, -0.02, 0.065, 0.07) || E(0.76, 0.025, 0.045, 0.035)) && (k = 2)) : ((E(0.13, 0, 0.09, 0.075) || E(0.45, -0.01, 0.17, 0.1)) && (k = 1), (E(0.29, 0.075, 0.08, 0.05) || E(0.65, -0.025, 0.1, 0.06)) && (k = 2));
        const I = ht.koi.halfWidth(M) || 0.02, h = T(Math.abs(l) / I, 0, 1), P = o % 1009 / 1009, W = Math.pow(1 - h, 0.5), U = (0.17 + W * 0.83) * (0.9 + P * 0.1) * c, y = (G, tt) => { const bg=pondRGB([253,253,253],[251,236,217],[12,25,39]), pigment=pondPigment(G); return `rgb(${pigment.map((et,j)=>Math.round(bg[j]+(et-bg[j])*tt)).join(",")})`; };
        if (s === It) {
          const G = Math.atan2(l, M - (M > 0.8 ? 0.8 : 0.22)), tt = Math.pow(0.5 + 0.5 * Math.cos(G * 24), 5), et = M > 0.8 ? 0.16 : 0.23, V = 0.055 + T(1 - Math.abs(l) / et, 0, 1) * 0.15 + tt * 0.15;
          P > 0.18 && (f.fillStyle = y([133, 150, 146], V), f.fillRect(n + 1, e + 1, i - 1.5, p - 1.5)), f.fillStyle = y([100, 124, 120], V + 0.09);
          const at = tt > 0.5 ? Math.abs(G) < 0.45 ? "-" : Math.abs(G) > 1.15 ? "|" : G > 0 ? "/" : "\\" : P > 0.6 ? ":" : ".";
          f.fillText(at, n + i / 2, e + p / 2 + 1);
          return;
        }
        if (s === Rt) {
          const G = (0.1 + a * 0.17) * (0.6 + P * 0.4);
          f.fillStyle = y(k === 1 ? [154, 106, 94] : [120, 138, 137], G), f.fillText(a > 0.6 && P > 0.5 ? ":" : ".", n + i / 2, e + p / 2 + 1);
          return;
        }
        if (s === kt) {
          f.fillStyle = pondCSS([98,112,108],[109,96,80],[173,197,196]), f.fillText("o", n + i / 2, e + p / 2 + 1);
          return;
        }
        let O = k === 1 ? [135, 61, 45] : k === 2 ? [32, 47, 49] : [115, 129, 119];
        const m = Math.exp(-(((l + I * 0.25) / (I * 0.22)) ** 2));
        let x = U * (1 - m * 0.09) * (0.94 + g * 0.04);
        h < 0.42 && P > 0.55 && (k === 1 && (O = [183, 59, 37], x = Math.max(x, 0.86)), k === 2 && (O = [24, 43, 50], x = Math.max(x, 0.88)));
        const w = h < 0.58 || P > 0.28 + h * 0.18;
        w && (f.fillStyle = y(O, x), f.fillRect(n + 1, e + 1, i - 1.4, p - 1.4));
        const D = Math.floor(u * 1.2 + o % 311 / 131), z = pt(o, D, 41), $ = x > 0.5 && w && P > 0.18;
        if (z < 0.025 && h < 0.72) {
          const G = [[109, 142, 137], [162, 135, 148], [177, 150, 105]][o % 3];
          f.fillStyle = y(G, 0.62);
        } else h < 0.24 && P > 0.64 && k !== 1 ? f.fillStyle = k === 2 ? pondCSS([35,59,67],[49,55,55],[122,155,174]) : pondCSS([88,107,104],[111,103,87],[190,204,194]) : $ ? f.fillStyle = y([249, 247, 239], 0.88) : f.fillStyle = y(k === 1 ? [129, 87, 74] : [86, 104, 101], (0.15 + W * 0.42) * c);
        const Z = h > 0.8 ? ".:," : k === 2 ? "%8#S" : ":;t%SX";
        f.fillText(Z[(o >>> 8) % Z.length], n + i / 2, e + p / 2 + 1);
      }
      markFish(t) {
        const { fishStamp: n, fishBuckets: e, sharkFlag: s } = this, a = ++this.frameId;
        for (const o of e) o.length = 0;
        for (let o = 0; o < 2; o++) for (const c of t.fish) {
          if (!c.alive || (c.depth > 0.78 ? 0 : 1) !== o) continue;
          const u = this.cellIndex(c.x, c.y);
          if (u < 0 || n[u] === a || s[u]) continue;
          n[u] = a;
          const f = T(Math.abs(c.turn) / 3.5, 0, 1), i = 0.3 + 0.4 * (c.depth - 0.55) / 0.45 + 0.3 * Math.max(f, c.alarm);
          e[T(Math.floor(i * wt.length), 0, wt.length - 1)].push(u);
        }
      }
      drawFish() {
        const { ctx: t, cw: n, ch: e, cols: s, fishBuckets: a } = this;
        for (let o = 0; o < a.length; o++) {
          const c = a[o];
          if (c.length) {
            t.fillStyle = this.koiPond ? this.driftFishStyles[o] : this.fishStyles[o];
            for (const u of c) t.fillText("-", u % s * n + n / 2, (u / s | 0) * e + e / 2 + 1);
          }
        }
      }
      drawHeat() {
        const { ctx: t, heat: n, cols: e, cw: s, ch: a } = this;
        for (let o = 0; o < n.length; o++) {
          const c = n[o];
          if (c < 0.08) continue;
          const u = o % e, f = o / e | 0;
          t.fillStyle = c > 0.5 ? `rgba(255,120,60,${c.toFixed(2)})` : `rgba(220,40,40,${(c * 1.6).toFixed(2)})`, t.fillText(c > 0.6 ? "*" : "\xB7", u * s + s / 2, f * a + a / 2 + 1);
        }
      }
      drawDots(t) {
        const { ctx: n, cols: e, rows: s, cw: a, ch: o, dotKind: c, dotPhase: u, dotFreq: f, energy: i, sharkFlag: p, sharkShadow: M, fishStamp: l, frameId: b } = this, { bucketOf: g, bucketOrder: k, bucketCounts: v } = this, E = e * s, I = v.length - 1;
        v.fill(0);
        for (let y = 0; y < E; y++) {
          const O = i[y], m = c[y];
          if (p[y] || l[y] === b || m === 0 && O < 0.45) {
            g[y] = I;
            continue;
          }
          let x;
          if (O > 0.45) {
            const w = T(Math.floor((O - 0.45) * 5), 0, ut - 1);
            x = Gt * ut + w;
          } else {
            const w = y % e, D = y / e | 0, z = 0.5 + 0.5 * Math.sin(t * f[y] + u[y]), $ = 0.85 + 0.15 * Math.sin(w * 0.11 + t * 0.35) * Math.sin(D * 0.17 - t * 0.27);
            let Z = T((0.55 + 0.45 * z) * $ + O * 2, 0, 1);
            M[y] && (Z *= 0.2), x = (m - 1) * ut + T(Math.floor(Z * ut), 0, ut - 1);
          }
          g[y] = x, v[x]++;
        }
        const h = new Int32Array(v.length);
        for (let y = 1; y < v.length; y++) h[y] = h[y - 1] + v[y - 1];
        const P = h.slice();
        for (let y = 0; y < E; y++) {
          const O = g[y];
          O !== I && (k[P[O]++] = y);
        }
        const W = Math.max(2, Math.round(a * 0.19)), U = W + 1;
        for (let y = 0; y < I; y++) {
          const O = v[y];
          if (!O) continue;
          n.fillStyle = this.dotStyles[y];
          const m = y >= Gt * ut ? U : W, x = h[y];
          for (let w = x; w < x + O; w++) {
            const D = k[w], z = D % e, $ = D / e | 0;
            n.fillRect(Math.round(z * a + a * 0.66 - m / 2), Math.round($ * o + o * 0.64 - m / 2), m, m);
          }
        }
      }
    };
    var xt = 1 / 60;
    var Vt = 4;
    var Me = class {
      constructor(t, n) {
        d(this, "world");
        d(this, "renderer");
        d(this, "raf", 0);
        d(this, "last", 0);
        d(this, "acc", 0);
        d(this, "visible", true);
        d(this, "reducedMotion");
        d(this, "resizeObserver");
        d(this, "intersectionObserver");
        d(this, "disposed", false);
        d(this, "frame", (t2) => {
          const realDt = Math.min(0.1, (t2 - this.last) / 1e3);
          globalThis.koiTheme?.update(realDt);
          const n2 = realDt * (globalThis.koiTheme?.pace || 1);
          this.last = t2, this.acc += n2;
          let e2 = 0;
          for (; this.acc >= xt && e2 < Vt; ) this.world.step(xt), this.acc -= xt, e2++;
          e2 === Vt && (this.acc = 0), this.renderer.render(this.world, n2), this.raf = requestAnimationFrame(this.frame);
        });
        d(this, "onMotionPreference", () => {
          this.reducedMotion.matches ? (cancelAnimationFrame(this.raf), this.drawStill()) : this.schedule();
        });
        d(this, "onPointerMove", (t2) => {
          const { x: n2, y: e2, inside: s } = this.toLocal(t2), a = this.world.pointer;
          a.x = n2, a.y = e2, a.active = s && t2.pointerType !== "touch";
        });
        d(this, "onPointerDown", (t2) => {
          const { x: n2, y: e2, inside: s } = this.toLocal(t2);
          s && !this.reducedMotion.matches && this.world.splash(n2, e2);
        });
        d(this, "onPointerLeave", () => {
          this.world.pointer.active = false;
        });
        var e;
        this.canvas = t, this.world = new ce(n), this.renderer = new pe(t), this.renderer.setFontFamily(getComputedStyle(t).fontFamily), this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)"), this.resizeObserver = new ResizeObserver(() => this.resize()), this.resizeObserver.observe(t), this.intersectionObserver = new IntersectionObserver(([s]) => {
          this.visible = s.isIntersecting, this.schedule();
        }), this.intersectionObserver.observe(t), this.reducedMotion.addEventListener("change", this.onMotionPreference), window.addEventListener("pointermove", this.onPointerMove, { passive: true }), window.addEventListener("pointerdown", this.onPointerDown, { passive: true }), document.documentElement.addEventListener("pointerleave", this.onPointerLeave), window.addEventListener("blur", this.onPointerLeave), this.resize(), window.addEventListener("koi-theme-change", () => { if(this.reducedMotion.matches) {globalThis.koiTheme?.settle(); this.renderer.render(this.world,0);} }), (e = document.fonts) == null || e.load(`600 16px ${getComputedStyle(t).fontFamily}`).then(() => {
          !this.disposed && this.reducedMotion.matches && this.drawStill();
        }), this.schedule();
      }
      destroy() {
        this.disposed = true, cancelAnimationFrame(this.raf), this.resizeObserver.disconnect(), this.intersectionObserver.disconnect(), this.reducedMotion.removeEventListener("change", this.onMotionPreference), window.removeEventListener("pointermove", this.onPointerMove), window.removeEventListener("pointerdown", this.onPointerDown), document.documentElement.removeEventListener("pointerleave", this.onPointerLeave), window.removeEventListener("blur", this.onPointerLeave);
      }
      resize() {
        const t = this.canvas.getBoundingClientRect();
        if (t.width < 1 || t.height < 1) return;
        const n = Math.min(window.devicePixelRatio || 1, 2);
        this.renderer.resize(t.width, t.height, n), this.world.resize(t.width, t.height, this.renderer.cellWidth, this.renderer.cellHeight), this.reducedMotion.matches && this.drawStill();
      }
      schedule() {
        cancelAnimationFrame(this.raf), !(this.disposed || !this.visible || this.reducedMotion.matches) && (this.last = performance.now(), this.raf = requestAnimationFrame(this.frame));
      }
      drawStill() {
        if (this.world.time < 4) for (let t = 0; t < 240; t++) this.world.step(xt);
        this.renderer.render(this.world, xt);
      }
      toLocal(t) {
        const n = this.canvas.getBoundingClientRect(), e = t.clientX - n.left, s = t.clientY - n.top, a = e >= 0 && s >= 0 && e <= n.width && s <= n.height;
        return { x: e, y: s, inside: a };
      }
    };
    new Me(document.querySelector("canvas"));
  }
});
export default require_browser_entry();
