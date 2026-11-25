(() => {
  const S = window.SETTINGS, DAYS = window.DAYS;
  const app = document.getElementById("app");
  const params = new URLSearchParams(location.search);
  const preview = params.has("day"); // ?day=3 plays Day 3 without saving
  const TIER_EMOJI = ["⬛", "🟫", "🟦", "🟨", "✨"];
  let day, qs, i, log, timer;

  const esc = s => s.replace(/[&<>"']/g, c => "&#" + c.charCodeAt(0) + ";");
  const norm = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim().replace(/^(the|a|an) /, "");
  const tierOf = (list, v) => list.reduce((best, x) => (v >= x.min ? x : best), list[0]);
  const first = key => key.split(" / ")[0];
  const render = html => { app.innerHTML = html; };

  const KEY = n => "goldillion:day" + n;
  const load = n => { try { return JSON.parse(localStorage.getItem(KEY(n))); } catch (e) { return null; } };
  const save = (n, v) => { if (!preview) { try { localStorage.setItem(KEY(n), JSON.stringify(v)); } catch (e) {} } };

  function dayNumber() {
    if (preview) return parseInt(params.get("day"), 10) || 1;
    const [y, m, d] = S.releaseDate.split("-").map(Number);
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((midnight - new Date(y, m - 1, d)) / 864e5) + 1;
  }

  function grade(q, text) {
    const t = norm(text);
    for (const [key, pts] of Object.entries(q.answers)) {
      for (const alt of key.split(" / ")) {
        const n = norm(alt);
        if (t && (n === t || n + "s" === t || n === t + "s")) return { pts, hit: first(key) };
      }
    }
    return { pts: S.unlistedPoints, hit: null };
  }

  const pips = () => `<ol class="pips" aria-label="Progress">` + qs.map((_, k) =>
    log[k] ? `<li class="done" style="--p:${log[k].pts / 100}"></li>` : `<li class="${k === i ? "now" : ""}"></li>`
  ).join("") + `</ol>`;

  const shell = (body, withPips = true) =>
    `<header><h1>Goldillion</h1><p class="day">Day ${day}${preview ? " (preview, not saved)" : ""}</p></header>${withPips ? pips() : ""}${body}`;

  function soon() {
    const [y, m, d] = S.releaseDate.split("-").map(Number);
    const date = new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    render(`<header><h1>Goldillion</h1></header><h2>Day 1 opens ${date}.</h2><p class="lede">Seven prompts a day, the same for everyone.</p>`);
  }

  function begin() {
    day = dayNumber();
    if (day < 1) return soon();
    qs = DAYS[day];
    if (!qs) return render(shell(`<p class="lede">That's every day so far. New prompts are on the way.</p>`, false));
    if (qs.length !== 7) console.warn(`Goldillion: Day ${day} has ${qs.length} questions, expected 7.`);
    const saved = preview ? null : load(day);
    if (saved) { log = saved; return results(); }
    log = []; i = 0;
    render(shell(`<h2>${qs.length} prompts. Rare answers are worth more gold.</h2><p class="lede">Obvious answers barely count. You get ${S.secondsPerQuestion} seconds each.</p><button id="go">Start day ${day}</button>`, false));
    document.getElementById("go").onclick = ask;
  }

  function ask() {
    const q = qs[i];
    render(shell(`<div class="clock"><span id="bar"></span></div><h2>${esc(q.q)}</h2><form id="f"><input id="a" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Type an answer" aria-label="Your answer"><button>Answer</button></form>`));
    const a = document.getElementById("a"), bar = document.getElementById("bar");
    const t0 = Date.now(), ms = S.secondsPerQuestion * 1000;
    const submit = () => { clearInterval(timer); reveal(a.value); };
    a.focus();
    timer = setInterval(() => {
      const left = 1 - (Date.now() - t0) / ms;
      bar.style.width = Math.max(left, 0) * 100 + "%";
      if (left <= 0) submit();
    }, 100);
    document.getElementById("f").onsubmit = e => { e.preventDefault(); submit(); };
  }

  function reveal(text) {
    text = text.trim();
    const r = grade(qs[i], text), last = i === qs.length - 1;
    log.push({ a: text, pts: r.pts, hit: r.hit });
    if (last) save(day, log);
    render(shell(`<h2>${esc(qs[i].q)}</h2><p class="said">${text ? esc(text) : "No answer"}</p><p class="pts">+${r.pts}</p><p class="tier">${tierOf(S.rarity, r.pts).label}</p><button id="n">${last ? "See results" : "Next prompt"}</button>`));
    const n = document.getElementById("n");
    n.focus();
    n.onclick = () => { if (last) results(); else { i++; ask(); } };
  }

  function results() {
    const total = log.reduce((s, x) => s + x.pts, 0), max = qs.length * 100;
    const rank = tierOf(S.ranks, total);
    const rows = qs.map((q, k) => {
      const rarest = first(Object.entries(q.answers).sort((a, b) => b[1] - a[1])[0][0]);
      return `<li><b>${log[k].pts}</b>${esc(q.q)}<small>You: ${log[k].a ? esc(log[k].a) : "no answer"}</small><small>Rarest: ${esc(rarest)}</small></li>`;
    }).join("");
    const text = `Goldillion day ${day}: ${total}/${max} (${rank.name})\n` +
      log.map(x => TIER_EMOJI[S.rarity.indexOf(tierOf(S.rarity, x.pts))]).join("");
    render(shell(`<h2>${rank.name}</h2><p class="pts">${total}</p><p class="tier">of ${max} gold</p><ul class="rows">${rows}</ul><button id="share">Copy result</button><p class="lede">New prompts arrive tomorrow.</p>`, false));
    const b = document.getElementById("share");
    b.onclick = () => (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
      .then(() => { b.textContent = "Copied"; }, () => { b.textContent = "Copy failed"; });
  }

  begin();
})();
