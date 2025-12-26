/* Logan – Spelling Practice (no backend, HTML + JS only)
   Progress is stored in localStorage.
*/

(function () {
  "use strict";

  const APP_VERSION = "1.1";
  const STORAGE_PROGRESS = "logan_vocab_progress_v1";
  const STORAGE_SEQ_INDEX = "logan_vocab_seq_index_v1";
  const STORAGE_UI = "logan_vocab_ui_v1";

  const app = document.getElementById("app");
  const topPills = document.getElementById("topPills");

  // ---------- Utilities ----------
  function $(sel, root = document) { return root.querySelector(sel); }
  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function nowIso() { return new Date().toISOString(); }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function slugify(word) {
    return String(word).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  }

  // ---------- Data ----------
  // WORDS is defined in data.js
  const WORD_BY_ID = new Map(WORDS.map(w => [w.id, w]));
  const ALL_IDS = WORDS.map(w => w.id);

  // ---------- Progress ----------
  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_PROGRESS);
      if (!raw) return {};
      const obj = JSON.parse(raw);
      if (!obj || typeof obj !== "object") return {};
      return obj;
    } catch {
      return {};
    }
  }
  function saveProgress(p) {
    localStorage.setItem(STORAGE_PROGRESS, JSON.stringify(p));
  }
  function getP(wordId) {
    if (!progress[wordId]) {
      // Keep this object forward-compatible; older saves may miss new fields.
      progress[wordId] = {
        level: 0,
        correct: 0,
        wrong: 0,
        skipped: 0,
        hints: 0,
        seen: 0,
        streak: 0,
        lastSeen: null
      };
    }
    return progress[wordId];
  }
  function markSeen(wordId) {
    const p = getP(wordId);
    p.seen += 1;
    p.lastSeen = nowIso();
    saveProgress(progress);
  }
  function markCorrect(wordId) {
    const p = getP(wordId);
    p.correct += 1;
    p.streak += 1;
    p.level = clamp(p.level + 1, 0, 5);
    p.lastSeen = nowIso();
    saveProgress(progress);
  }
  function markWrong(wordId) {
    const p = getP(wordId);
    p.wrong += 1;
    p.streak = 0;
    p.level = clamp(p.level - 1, 0, 5);
    p.lastSeen = nowIso();
    saveProgress(progress);
  }

  function markSkipped(wordId) {
    const p = getP(wordId);
    p.skipped = (p.skipped || 0) + 1;
    p.streak = 0;
    p.lastSeen = nowIso();
    saveProgress(progress);
  }

  function markHintUsed(wordId) {
    const p = getP(wordId);
    p.hints = (p.hints || 0) + 1;
    p.lastSeen = nowIso();
    saveProgress(progress);
  }
  function masteredCount() {
    let n = 0;
    for (const id of ALL_IDS) {
      if (getP(id).level >= 5) n++;
    }
    return n;
  }

  function levelDots(level) {
    const dots = [];
    for (let i = 0; i < 5; i++) {
      dots.push(`<span class="dot ${i < level ? "on" : ""}"></span>`);
    }
    return `<span class="levelbar" title="Familiarity level">${dots.join("")}</span>`;
  }

  // ---------- UI State ----------
  const defaultUI = {
    mode: "A",
    count: 10,
    order: "random", // random | sequential
    focusWeak: true,
  };

  function loadUI() {
    try {
      const raw = localStorage.getItem(STORAGE_UI);
      if (!raw) return { ...defaultUI };
      const o = JSON.parse(raw);
      return { ...defaultUI, ...o };
    } catch {
      return { ...defaultUI };
    }
  }
  function saveUI() {
    localStorage.setItem(STORAGE_UI, JSON.stringify(ui));
  }

  let progress = loadProgress();
  let ui = loadUI();

  let session = null; // { mode, ids, index, startedAt, stats }

  // ---------- Session selection ----------
  function loadSeqIndex() {
    const raw = localStorage.getItem(STORAGE_SEQ_INDEX);
    const n = Number(raw);
    return Number.isFinite(n) ? clamp(Math.floor(n), 0, ALL_IDS.length - 1) : 0;
  }
  function saveSeqIndex(n) {
    localStorage.setItem(STORAGE_SEQ_INDEX, String(n));
  }

  function pickSequential(count) {
    const start = loadSeqIndex();
    const ids = [];
    for (let i = 0; i < count; i++) {
      ids.push(ALL_IDS[(start + i) % ALL_IDS.length]);
    }
    saveSeqIndex((start + count) % ALL_IDS.length);
    return ids;
  }

  function weightedRandomWithoutReplacement(ids, weights, count) {
    // ids: array of unique ids
    const pool = ids.slice();
    const w = weights.slice();
    const out = [];
    const k = Math.min(count, pool.length);

    for (let t = 0; t < k; t++) {
      let total = 0;
      for (const ww of w) total += ww;

      let r = Math.random() * total;
      let idx = 0;
      for (; idx < pool.length; idx++) {
        r -= w[idx];
        if (r <= 0) break;
      }
      if (idx >= pool.length) idx = pool.length - 1;

      out.push(pool[idx]);
      pool.splice(idx, 1);
      w.splice(idx, 1);
    }
    return out;
  }

  function pickRandom(count, focusWeak) {
    const ids = ALL_IDS.slice();
    if (!focusWeak) return shuffle(ids).slice(0, Math.min(count, ids.length));

    const weights = ids.map(id => {
      const lvl = getP(id).level || 0;
      return 1 + (5 - clamp(lvl, 0, 5)); // weaker words get higher weight
    });
    return weightedRandomWithoutReplacement(ids, weights, count);
  }

  function buildSession(mode, count, order, focusWeak) {
    const n = clamp(Math.floor(Number(count) || 10), 1, ALL_IDS.length);
    const ids = order === "sequential" ? pickSequential(n) : pickRandom(n, focusWeak);

    return {
      mode,
      ids,
      index: 0,
      startedAt: nowIso(),
      stats: { correct: 0, wrong: 0 }
    };
  }

  function currentWord() {
    if (!session) return null;
    const id = session.ids[session.index];
    return WORD_BY_ID.get(id) || null;
  }

  // ---------- Speech ----------
  async function speakText(text, opts = {}) {
    const t = String(text || "").trim();
    if (!t) return;

    const {
      lang = "en-GB",
      times = 1,
      rate = 0.95,
      pitch = 1.0,
      volume = 1.0,
      pauseMs = 650,
    } = opts;

    if (!("speechSynthesis" in window)) {
      alert("Speech is not supported in this browser.");
      return;
    }

    try { window.speechSynthesis.cancel(); } catch {}

    // Use separate utterances; some browsers ignore repeated speak calls without delay.
    for (let i = 0; i < times; i++) {
      const u = new SpeechSynthesisUtterance(t);
      u.lang = lang;
      u.rate = rate;
      u.pitch = pitch;
      u.volume = volume;
      window.speechSynthesis.speak(u);
      await sleep(pauseMs);
    }
  }

  function speakEnglish(word, times = 3) {
    return speakText(word, { lang: "en-GB", times, rate: 0.95, pauseMs: 650 });
  }

  function speakChinese(text) {
    // Chinese voices vary across devices; keep it simple and let the browser choose.
    return speakText(text, { lang: "zh-CN", times: 1, rate: 1.0, pauseMs: 400 });
  }

  // ---------- Tokenization (Mode B) ----------
  const PHONICS_CHUNKS = [
    "eigh", "ough", "tion", "sion", "ture", "sure", "igh",
    "ear", "air", "ure",
    "ch", "sh", "th", "ph", "wh", "ck", "ng", "qu",
    "ee", "ea", "ai", "ay", "oa", "ow", "oo",
    "ar", "or", "er", "ir", "ur", "ou", "oi", "aw", "au"
  ].sort((a, b) => b.length - a.length);

  function tokenize(word) {
    const w = String(word).toLowerCase();
    const tokens = [];
    let i = 0;
    while (i < w.length) {
      // double letters (e.g., pp, ll)
      if (i + 1 < w.length && w[i] === w[i + 1]) {
        tokens.push(w.slice(i, i + 2));
        i += 2;
        continue;
      }

      let matched = null;
      for (const chunk of PHONICS_CHUNKS) {
        if (w.startsWith(chunk, i)) {
          matched = chunk;
          break;
        }
      }
      if (matched) {
        tokens.push(matched);
        i += matched.length;
      } else {
        tokens.push(w[i]);
        i++;
      }
    }
    return tokens;
  }

  function randomDistractorToken() {
    // Try tokens from other words
    const w = WORDS[Math.floor(Math.random() * WORDS.length)].word;
    const toks = tokenize(w);
    if (toks.length > 0) return toks[Math.floor(Math.random() * toks.length)];
    // fallback
    const letters = "abcdefghijklmnopqrstuvwxyz";
    return letters[Math.floor(Math.random() * letters.length)];
  }

  function buildTokenPool(correctTokens) {
    // Keep duplicates of correct tokens; then add extra distractors.
    const pool = correctTokens.map((t, i) => ({ key: `c_${i}_${t}`, token: t, used: false, isCorrect: true }));
    const targetSize = clamp(correctTokens.length + 8, 12, 18);

    let safety = 0;
    while (pool.length < targetSize && safety < 200) {
      safety++;
      const t = randomDistractorToken();
      // avoid adding too many exact duplicates beyond what already exists
      const already = pool.filter(x => x.token === t).length;
      if (already >= 2) continue;
      pool.push({ key: `d_${pool.length}_${t}`, token: t, used: false, isCorrect: false });
    }

    return shuffle(pool);
  }

  // ---------- Mode A options ----------
  function buildChoices(correctId) {
    const correctWord = WORD_BY_ID.get(correctId).word;
    const others = ALL_IDS.filter(id => id !== correctId);
    const distractors = shuffle(others).slice(0, 3).map(id => WORD_BY_ID.get(id).word);
    const options = shuffle([correctWord, ...distractors]);
    return { correctWord, options };
  }

  // ---------- Rendering ----------
  function setTopPills(html) { topPills.innerHTML = html; }

  function renderHome() {
    session = null;
    const mastered = masteredCount();

    setTopPills(`
      <span class="pill">Words: ${WORDS.length}</span>
      <span class="pill">Mastered: ${mastered}</span>
      <span class="pill">v${APP_VERSION}</span>
    `);

    app.innerHTML = `
      <div class="grid two">
        <div class="card">
          <div class="pad">
            <h2 style="margin:0 0 8px;">Today’s Practice</h2>
            <div class="muted" style="margin-bottom:12px;">
              Choose a mode and start. The UI is English. Chinese meaning is optional support.
            </div>

            <div class="grid">
              <div>
                <label>Mode</label>
                <select id="modeSel">
                  <option value="A">A — Pick the correct word (4 choices)</option>
                  <option value="B">B — Build the word with phonics tiles (+ audio)</option>
                  <option value="C">C — Type the word</option>
                </select>
              </div>

              <div class="grid two">
                <div>
                  <label>How many words today?</label>
                  <input id="countSel" type="number" min="1" max="${WORDS.length}" step="1" />
                </div>
                <div>
                  <label>Order</label>
                  <select id="orderSel">
                    <option value="random">Random</option>
                    <option value="sequential">In order</option>
                  </select>
                </div>
              </div>

              <div class="grid two">
                <div>
                  <label>Random pick</label>
                  <select id="weakSel">
                    <option value="weak">Focus on weak/new words</option>
                    <option value="any">Any words</option>
                  </select>
                </div>
                <div style="display:flex; align-items:end; gap:10px;">
                  <button id="startBtn" class="btn primary" style="width:100%;">Start</button>
                </div>
              </div>

              <div class="divider"></div>

              <div class="stack" style="justify-content:space-between;">
                <button id="wordListBtn" class="btn">Word list</button>
                <button id="resetBtn" class="btn bad">Reset progress</button>
              </div>

              <div class="muted" style="font-size:12px;">
                Audio uses the browser’s built-in speech voice (English + Chinese). It may vary by device.
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="pad">
            <h2 style="margin:0 0 10px;">Progress</h2>
            <div class="toast" style="margin-top:0;">
              Mastered words: <b>${mastered}</b> / ${WORDS.length}
            </div>
            <div class="divider"></div>

            <div class="muted" style="margin-bottom:8px;">Tips</div>
            <ul class="muted" style="margin-top:0; line-height:1.55;">
              <li>Try A → B → C as a 3-step learning path.</li>
              <li>In Mode B/C, click the picture to hear the English word (3 times).</li>
              <li>In Mode A/C, click the Chinese meaning to hear Chinese.</li>
              <li>Levels go up when correct, down when wrong (0–5).</li>
            </ul>
          </div>
        </div>
      </div>
    `;

    $("#modeSel").value = ui.mode;
    $("#countSel").value = ui.count;
    $("#orderSel").value = ui.order;
    $("#weakSel").value = ui.focusWeak ? "weak" : "any";

    $("#modeSel").addEventListener("change", (e) => { ui.mode = e.target.value; saveUI(); });
    $("#countSel").addEventListener("change", (e) => { ui.count = clamp(Number(e.target.value), 1, WORDS.length); saveUI(); });
    $("#orderSel").addEventListener("change", (e) => { ui.order = e.target.value; saveUI(); });
    $("#weakSel").addEventListener("change", (e) => { ui.focusWeak = (e.target.value === "weak"); saveUI(); });

    $("#startBtn").addEventListener("click", () => {
      session = buildSession(ui.mode, ui.count, ui.order, ui.focusWeak);
      renderQuestion();
    });

    $("#wordListBtn").addEventListener("click", () => renderWordList());

    $("#resetBtn").addEventListener("click", () => {
      const ok = confirm("Reset all progress on this device? This cannot be undone.");
      if (!ok) return;
      progress = {};
      saveProgress(progress);
      renderHome();
    });
  }

  function renderWordList() {
    setTopPills(`
      <span class="pill">Word list</span>
      <span class="pill">Mastered: ${masteredCount()}</span>
      <span class="pill">Words: ${WORDS.length}</span>
    `);

    const rows = WORDS.map(w => {
      const p = getP(w.id);
      return `
        <tr>
          <td><img class="thumb" src="${escapeHtml(w.image)}" alt="${escapeHtml(w.word)}"></td>
          <td>
            <b>${escapeHtml(w.word)}</b>
            ${w.zh ? `<div class="muted" style="font-size:12px;">${escapeHtml(w.zh)}</div>` : ""}
            <div class="muted" style="font-size:12px;">${escapeHtml(w.id)}</div>
          </td>
          <td>${levelDots(p.level || 0)} <span class="muted">(${p.level || 0}/5)</span></td>
          <td class="right">
            <span class="muted">✓</span> ${p.correct || 0}
            &nbsp; <span class="muted">✗</span> ${p.wrong || 0}
            &nbsp; <span class="muted">Skip</span> ${p.skipped || 0}
            &nbsp; <span class="muted">Hint</span> ${p.hints || 0}
          </td>
        </tr>
      `;
    }).join("");

    app.innerHTML = `
      <div class="card">
        <div class="pad">
          <div class="row" style="gap:10px;">
            <div>
              <h2 style="margin:0;">Word List</h2>
              <div class="muted" style="font-size:13px;">Search or review progress.</div>
            </div>
            <div class="stack">
              <button id="homeBtn" class="btn">Home</button>
            </div>
          </div>

          <div class="divider"></div>

          <div class="grid two">
            <div>
              <label>Search</label>
              <input id="searchInput" type="text" placeholder="Type a word..." />
            </div>
            <div class="muted" style="display:flex; align-items:end;">
              Tip: Levels are stored on this device only.
            </div>
          </div>

          <div class="divider"></div>

          <div style="overflow:auto; border-radius:14px; border:1px solid var(--border);">
            <table id="wordTable">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Word</th>
                  <th>Level</th>
                  <th class="right">Stats</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    $("#homeBtn").addEventListener("click", renderHome);

    $("#searchInput").addEventListener("input", (e) => {
      const q = String(e.target.value || "").trim().toLowerCase();
      const tbody = $("#wordTable tbody");
      const filtered = WORDS.filter(w => w.word.toLowerCase().includes(q) || w.id.includes(q));
      tbody.innerHTML = filtered.map(w => {
        const p = getP(w.id);
        return `
          <tr>
            <td><img class="thumb" src="${escapeHtml(w.image)}" alt="${escapeHtml(w.word)}"></td>
            <td>
              <b>${escapeHtml(w.word)}</b>
              ${w.zh ? `<div class="muted" style="font-size:12px;">${escapeHtml(w.zh)}</div>` : ""}
              <div class="muted" style="font-size:12px;">${escapeHtml(w.id)}</div>
            </td>
            <td>${levelDots(p.level || 0)} <span class="muted">(${p.level || 0}/5)</span></td>
            <td class="right">
              <span class="muted">✓</span> ${p.correct || 0}
              &nbsp; <span class="muted">✗</span> ${p.wrong || 0}
              &nbsp; <span class="muted">Skip</span> ${p.skipped || 0}
              &nbsp; <span class="muted">Hint</span> ${p.hints || 0}
            </td>
          </tr>
        `;
      }).join("");
    });
  }

  function renderQuestion() {
    const w = currentWord();
    if (!w) return renderHome();

    const p = getP(w.id);
    markSeen(w.id);

    setTopPills(`
      <span class="pill">Mode ${escapeHtml(session.mode)}</span>
      <span class="pill">${session.index + 1} / ${session.ids.length}</span>
      <span class="pill">Level: ${p.level || 0}/5</span>
      <span class="pill">Mastered: ${masteredCount()}</span>
    `);

    if (session.mode === "A") return renderModeA(w);
    if (session.mode === "B") return renderModeB(w);
    if (session.mode === "C") return renderModeC(w);

    return renderHome();
  }

  function renderNavButtons(extraHtml = "") {
    return `
      <div class="stack" style="justify-content:space-between; margin-top:14px;">
        <button id="homeBtn" class="btn">Home</button>
        <div class="stack">
          ${extraHtml}
        </div>
      </div>
    `;
  }

  function finishSession() {
    setTopPills(`
      <span class="pill">Finished</span>
      <span class="pill">Correct: ${session.stats.correct}</span>
      <span class="pill">Wrong: ${session.stats.wrong}</span>
      <span class="pill">Mastered: ${masteredCount()}</span>
    `);

    app.innerHTML = `
      <div class="card">
        <div class="pad">
          <h2 style="margin:0 0 8px;">Session Complete</h2>
          <div class="toast good" style="margin-top:0;">
            Correct: <b>${session.stats.correct}</b> &nbsp; Wrong: <b>${session.stats.wrong}</b>
          </div>
          <div class="divider"></div>
          <div class="muted">What next?</div>
          <ul class="muted" style="line-height:1.6;">
            <li>Try Mode B for words that were hard.</li>
            <li>Use “Focus on weak/new words” for random practice.</li>
          </ul>
          ${renderNavButtons(`<button id="againBtn" class="btn primary">Practice again</button>`)}
        </div>
      </div>
    `;

    $("#homeBtn").addEventListener("click", renderHome);
    $("#againBtn").addEventListener("click", () => {
      session = buildSession(ui.mode, ui.count, ui.order, ui.focusWeak);
      renderQuestion();
    });
  }

  function nextQuestion() {
    session.index += 1;
    if (session.index >= session.ids.length) return finishSession();
    renderQuestion();
  }

  // ---------- Mode A ----------
  function renderModeA(wordObj) {
    const { correctWord, options } = buildChoices(wordObj.id);

    app.innerHTML = `
      <div class="card">
        <div class="pad">
          <div class="imgbox">
            <img src="${escapeHtml(wordObj.image)}" alt="Picture">
          </div>

          ${wordObj.zh ? `
          <div class="stack" style="justify-content:center; margin-top:10px;">
            <button id="zhBtn" class="btn small" type="button" title="Hear Chinese meaning">
              ${escapeHtml(wordObj.zh)}
            </button>
          </div>
          ` : ""}

          <div class="question-title">Pick the correct word</div>
          <div class="hint">Choose 1 of 4.</div>

          <div class="choices">
            ${options.map(o => `<button class="btn" data-choice="${escapeHtml(o)}">${escapeHtml(o)}</button>`).join("")}
          </div>

          <div id="toast" class="toast" style="display:none;"></div>

          ${renderNavButtons(`<button id="nextBtn" class="btn primary" disabled>Next</button>`)}
        </div>
      </div>
    `;

    const toast = $("#toast");
    const nextBtn = $("#nextBtn");

    function showToast(msg, type) {
      toast.style.display = "block";
      toast.className = "toast " + (type || "");
      toast.innerHTML = msg;

      const toastZh = $("#toastZhBtn", toast);
      if (toastZh && wordObj.zh) {
        toastZh.addEventListener("click", () => speakChinese(wordObj.zh));
      }
    }

    const zhBtn = $("#zhBtn");
    if (zhBtn && wordObj.zh) {
      zhBtn.addEventListener("click", () => speakChinese(wordObj.zh));
    }

    app.querySelectorAll("[data-choice]").forEach(btn => {
      btn.addEventListener("click", () => {
        const choice = btn.getAttribute("data-choice");
        if (String(choice).toLowerCase() === String(correctWord).toLowerCase()) {
          showToast(
            `<b>Correct!</b>`
            + `<div class="muted" style="margin-top:6px;">${escapeHtml(correctWord)}</div>`
            + (wordObj.zh ? `<div style="margin-top:10px;"><button id="toastZhBtn" class="btn small" type="button" title="Hear Chinese meaning">${escapeHtml(wordObj.zh)}</button></div>` : ""),
            "good"
          );
          session.stats.correct += 1;
          markCorrect(wordObj.id);
          nextBtn.disabled = false;

          // disable buttons after correct
          app.querySelectorAll("[data-choice]").forEach(b => b.disabled = true);
        } else {
          showToast(`<b>Try again.</b>`, "bad");
          session.stats.wrong += 1;
          markWrong(wordObj.id);
          btn.disabled = true; // remove this wrong option
        }
      });
    });

    $("#homeBtn").addEventListener("click", renderHome);
    nextBtn.addEventListener("click", nextQuestion);
  }

  // ---------- Mode B ----------
  function renderModeB(wordObj) {
    const correct = String(wordObj.word).toLowerCase();
    const correctTokens = tokenize(correct);
    const pool = buildTokenPool(correctTokens);

    let selected = []; // array of pool indexes

    app.innerHTML = `
      <div class="card">
        <div class="pad">
          <div class="imgbox" style="cursor:pointer;" title="Click to hear the word 3 times">
            <img id="pic" src="${escapeHtml(wordObj.image)}" alt="Picture">
          </div>

          <div class="question-title">Build the word</div>
          <div class="hint">Click the picture for audio (3 times). Then choose tiles.</div>

          <div id="hintArea" class="toast" style="display:none; margin-top:12px;"></div>

          <div class="phonics-area">
            <div class="token-answer" id="answerBox"></div>
            <div class="answer-preview" id="answerPreview"></div>

            <div class="stack" style="justify-content:center;">
              <button id="backBtn" class="btn small">Back</button>
              <button id="clearBtn" class="btn small">Clear</button>
              <button id="hintBtn" class="btn small">Hint</button>
              <button id="submitBtn" class="btn primary small">Submit</button>
              <button id="skipBtn" class="btn small">Skip</button>
            </div>

            <div class="token-pool" id="poolBox"></div>
          </div>

          <div id="toast" class="toast" style="display:none;"></div>

          ${renderNavButtons(`<button id="nextBtn" class="btn primary" disabled>Next</button>`)}
        </div>
      </div>
    `;

    const toast = $("#toast");
    const nextBtn = $("#nextBtn");
    const poolBox = $("#poolBox");
    const answerBox = $("#answerBox");
    const answerPreview = $("#answerPreview");
    const hintArea = $("#hintArea");

    let tried = false;
    let solved = false;

    function renderPool() {
      poolBox.innerHTML = pool.map((item, idx) => {
        const cls = item.used ? "token used" : "token";
        return `<span class="${cls}" data-idx="${idx}">${escapeHtml(item.token)}</span>`;
      }).join("");
      poolBox.querySelectorAll("[data-idx]").forEach(el => {
        el.addEventListener("click", () => {
          const idx = Number(el.getAttribute("data-idx"));
          if (!Number.isFinite(idx)) return;
          if (pool[idx].used) return;
          pool[idx].used = true;
          selected.push(idx);
          renderAnswer();
          renderPool();
        });
      });
    }

    function assembled() {
      return selected.map(i => pool[i].token).join("");
    }

    function renderAnswer() {
      const toks = selected.map(i => pool[i].token);
      answerBox.innerHTML = toks.length
        ? toks.map(t => `<span class="token" style="cursor:default;">${escapeHtml(t)}</span>`).join("")
        : `<span class="muted">Your tiles will appear here</span>`;
      answerPreview.textContent = toks.length ? assembled() : "";
    }

    function showToast(msg, type) {
      toast.style.display = "block";
      toast.className = "toast " + (type || "");
      toast.innerHTML = msg;
    }

    $("#pic").addEventListener("click", () => speakEnglish(wordObj.word, 3));

    $("#hintBtn").addEventListener("click", () => {
      if (solved) return;
      markHintUsed(wordObj.id);
      if (hintArea) {
        hintArea.style.display = "block";
        hintArea.innerHTML = `Answer: <b>${escapeHtml(wordObj.word)}</b>`;
      }
    });

    $("#skipBtn").addEventListener("click", () => {
      if (solved) {
        // If the word is already solved, treat this as Next.
        return nextQuestion();
      }
      markSkipped(wordObj.id);
      // If the student skips immediately (no submit yet), count it as one wrong attempt.
      if (!tried) {
        session.stats.wrong += 1;
        markWrong(wordObj.id);
      }
      nextQuestion();
    });

    $("#backBtn").addEventListener("click", () => {
      if (selected.length === 0) return;
      const idx = selected.pop();
      pool[idx].used = false;
      renderAnswer();
      renderPool();
    });

    $("#clearBtn").addEventListener("click", () => {
      for (const idx of selected) pool[idx].used = false;
      selected = [];
      renderAnswer();
      renderPool();
    });

    $("#submitBtn").addEventListener("click", () => {
      tried = true;
      const a = assembled().toLowerCase();
      if (a === correct) {
        solved = true;
        showToast(`<b>Correct!</b>`, "good");
        session.stats.correct += 1;
        markCorrect(wordObj.id);
        nextBtn.disabled = false;

        // Disable actions after correct
        $("#hintBtn").disabled = true;
        $("#submitBtn").disabled = true;
        $("#skipBtn").disabled = true;

        // lock pool after correct
        pool.forEach(it => it.used = true);
        renderPool();
      } else {
        showToast(`<b>Not yet.</b> Try again.`, "bad");
        session.stats.wrong += 1;
        markWrong(wordObj.id);
      }
    });

    $("#homeBtn").addEventListener("click", renderHome);
    nextBtn.addEventListener("click", nextQuestion);

    renderAnswer();
    renderPool();
  }

  // ---------- Mode C ----------
  function renderModeC(wordObj) {
    const target = String(wordObj.word).toLowerCase();
    const blanks = Array.from({ length: target.length }, () => "_").join(" ");

    app.innerHTML = `
      <div class="card">
        <div class="pad">
          <div class="imgbox" style="cursor:pointer;" title="Click the picture to hear the English word">
            <img id="pic" src="${escapeHtml(wordObj.image)}" alt="Picture">
          </div>

          ${wordObj.zh ? `
          <div class="stack" style="justify-content:center; margin-top:10px;">
            <button id="zhBtn" class="btn small" type="button" title="Hear Chinese meaning">
              ${escapeHtml(wordObj.zh)}
            </button>
          </div>
          ` : ""}

          <div class="question-title">Type the word</div>
          <div class="blanks">${escapeHtml(blanks)}</div>
          <div class="hint">Word length: ${target.length}</div>

          <div id="hintArea" class="toast" style="display:none; margin-top:12px;"></div>

          <div class="divider"></div>

          <div class="grid">
            <div>
              <label>Your answer</label>
              <input id="answerInput" type="text" autocomplete="off" spellcheck="false" placeholder="Type here..." />
            </div>
            <div class="stack" style="justify-content:center;">
              <button id="submitBtn" class="btn primary">Submit</button>
              <button id="hintBtn" class="btn">Hint</button>
              <button id="skipBtn" class="btn">Skip</button>
            </div>
          </div>

          <div id="toast" class="toast" style="display:none;"></div>

          ${renderNavButtons(`<button id="nextBtn" class="btn primary" disabled>Next</button>`)}
        </div>
      </div>
    `;

    const toast = $("#toast");
    const nextBtn = $("#nextBtn");
    const input = $("#answerInput");
    const hintArea = $("#hintArea");

    let tried = false;
    let solved = false;

    function showToast(msg, type) {
      toast.style.display = "block";
      toast.className = "toast " + (type || "");
      toast.innerHTML = msg;
    }

    async function submit() {
      tried = true;
      const ans = String(input.value || "").trim().toLowerCase();
      if (!ans) return;

      if (ans === target) {
        solved = true;
        showToast(`<b>Correct!</b>`, "good");
        session.stats.correct += 1;
        markCorrect(wordObj.id);
        nextBtn.disabled = false;
        input.disabled = true;
        $("#hintBtn").disabled = true;
        $("#skipBtn").disabled = true;
      } else {
        showToast(`<b>Try again.</b>`, "bad");
        session.stats.wrong += 1;
        markWrong(wordObj.id);
        input.select();
      }
    }

    $("#submitBtn").addEventListener("click", submit);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });

    $("#pic").addEventListener("click", () => speakEnglish(wordObj.word, 3));

    const zhBtn = $("#zhBtn");
    if (zhBtn && wordObj.zh) {
      zhBtn.addEventListener("click", () => speakChinese(wordObj.zh));
    }

    $("#hintBtn").addEventListener("click", () => {
      if (solved) return;
      markHintUsed(wordObj.id);
      if (hintArea) {
        hintArea.style.display = "block";
        hintArea.innerHTML = `Answer: <b>${escapeHtml(wordObj.word)}</b>`;
      }
    });

    $("#skipBtn").addEventListener("click", () => {
      if (solved) {
        return nextQuestion();
      }
      markSkipped(wordObj.id);
      if (!tried) {
        session.stats.wrong += 1;
        markWrong(wordObj.id);
      }
      nextQuestion();
    });

    $("#homeBtn").addEventListener("click", renderHome);
    nextBtn.addEventListener("click", nextQuestion);

    input.focus();
  }

  // ---------- Boot ----------
  renderHome();

})();
