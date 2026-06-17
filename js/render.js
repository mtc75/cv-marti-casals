/* =========================================================================
   render.js — monta el CV a partir de los ficheros de content/*.json
   El diseño (cvstyle.css) no cambia: este script reproduce exactamente el
   markup que el CSS espera, interpolando el contenido editable.
   ========================================================================= */
(function () {
  "use strict";

  const LANGS = ["en", "ca", "es"];

  // -------- helpers ---------------------------------------------------------
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"
    }[c]));
  }

  // ¿Es un objeto multilingüe {en,ca,es}?
  function isTri(v) {
    return v && typeof v === "object" && !Array.isArray(v) &&
      ("en" in v || "ca" in v || "es" in v);
  }

  // Texto multilingüe -> spans data-lang. Texto plano -> se muestra siempre.
  function tri(v) {
    if (isTri(v)) {
      return LANGS.map((l) =>
        `<span data-lang="${l}">${esc(v[l] != null ? v[l] : (v.en || ""))}</span>`
      ).join("");
    }
    return esc(v);
  }

  // Etiquetas fijas de interfaz (no son contenido editable)
  const UI = {
    examDate:      { en: "Date:",  ca: "Data:",  es: "Fecha:" },
    examPlace:     { en: "Place:", ca: "Lloc:",  es: "Lugar:" },
    examCentre:    { en: "Centre:", ca: "Centre:", es: "Centro:" },
    verification:  { en: "Verification Number:", ca: "Número de verificació:", es: "Número de verificación:" },
    accreditation: { en: "Accreditation Number:", ca: "Número d’acreditació:", es: "Número de acreditación:" }
  };

  function setHTML(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  async function loadJSON(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo cargar " + path + " (" + res.status + ")");
    return res.json();
  }

  // -------- secciones -------------------------------------------------------
  function renderPerfil(p) {
    setHTML("identity", `
      <div class="name">${esc(p.name)}</div>
      <div class="contact">
        <span><i class="fas fa-phone-alt" aria-hidden="true"></i> ${esc(p.phone)}</span>
        <span><i class="fas fa-envelope" aria-hidden="true"></i> <a href="mailto:${esc(p.email)}" class="email-link">${esc(p.email)}</a></span>
        <span><i class="fas fa-map-pin" aria-hidden="true"></i> ${esc(p.location)}</span>
        <span><i class="fab fa-linkedin" aria-hidden="true"></i> <a href="${esc(p.linkedinUrl)}" target="_blank" rel="noopener noreferrer" class="email-link">${esc(p.linkedinLabel)}</a></span>
      </div>
      <div class="headline">${tri(p.headline)}</div>
    `);
    setHTML("strategic-edge", tri(p.strategicEdge));
    setHTML("footer-text", `<i class="fas fa-sync-alt" aria-hidden="true"></i> ${tri(p.footer)}`);
  }

  function renderCompetencias(data) {
    setHTML("competency-list",
      (data.items || []).map((c) => `<span class="competency-chip">${tri(c)}</span>`).join("")
    );
  }

  function renderExperiencia(data) {
    const jobs = (data.items || []).map((job, i) => `
      <div class="exp-header"${i > 0 ? ' style="margin-top: 1.5rem;"' : ""}>
        <div>
          <span class="exp-title">${tri(job.title)}</span>
          <span class="exp-company">${tri(job.company)}</span>
        </div>
        <div class="exp-date">${tri(job.date)}</div>
      </div>
      <ul class="exp-desc">
        ${(job.bullets || []).map((b) =>
          `<li><i class="fas fa-chevron-right star-bullet" aria-hidden="true"></i> ${tri(b)}</li>`
        ).join("")}
      </ul>
    `).join("");
    setHTML("experience-cards", `<div class="card"><div class="exp-item">${jobs}</div></div>`);
  }

  function renderEducacion(data) {
    const TAG_CLASS = {
      university: "university-tag",
      master: "masteriphd-tag",
      phd: "masteriphd-tag",
      compulsory: "compulsory-tag",
      postcompulsory: "postcompulsory-tag"
    };
    const HIGHER = ["university", "master", "phd"];

    function eduItem(item) {
      const tagClass = TAG_CLASS[item.category] || "compulsory-tag";
      const schools = (item.schools || []).map((s) =>
        `<div class="edu-school">${tri(s)}</div>`).join("");
      return `
        <div class="edu-item">
          <div class="edu-tag-row"><span class="${tagClass}">${tri(item.tag)}</span></div>
          <div class="edu-header">
            <span class="edu-degree">${tri(item.degree)}</span>
            <span class="exp-date">${tri(item.date)}</span>
          </div>
          ${schools}
        </div>`;
    }

    const items = data.items || [];
    const higher = items.filter((i) => HIGHER.includes(i.category));
    const school = items.filter((i) => !HIGHER.includes(i.category));

    let html = "";
    if (higher.length) html += `<div class="card">${higher.map(eduItem).join("")}</div>`;
    if (school.length) html += `<div class="card">${school.map(eduItem).join("")}</div>`;
    setHTML("education-cards", html);
  }

  function renderCertificados(data) {
    const html = (data.items || []).map((c) => {
      let block = `<div class="cert-name"><i class="fas fa-check-circle" style="color:#1f7ab0;" aria-hidden="true"></i> ${tri(c.name)}</div>`;
      block += `<div class="cert-org">${tri(c.org)}</div>`;
      if (c.dates && c.dates.length) {
        block += `<div class="bls-dates">${c.dates.map((d) =>
          `<span><strong>${tri(d.label)}</strong> ${esc(d.value)}</span>`).join("")}</div>`;
      }
      if (c.badge && c.badge.status) {
        block += `<div class="badge-row"><span class="health-badge-${esc(c.badge.status)}">${tri(c.badge.text)}</span></div>`;
      }
      if (c.note && (c.note.linkUrl || c.note.linkLabel)) {
        block += `<div class="cert-note"><a href="${esc(c.note.linkUrl)}" target="_blank" rel="noopener noreferrer" class="cert-link">${esc(c.note.linkLabel)}</a></div>`;
      }
      return `<div>${block}</div>`;
    }).join("");
    setHTML("certifications-list", html);
  }

  function logosHTML(kind) {
    if (kind === "cambridge") {
      return `
        <div class="icon-item"><svg viewBox="0 0 385.3 233"><use href="#ccea-label"></use></svg></div>
        <div class="icon-item"><svg viewBox="0 0 369 233"><use href="#ofqual-label"></use></svg></div>
        <div class="icon-item"><svg viewBox="0 0 212 223"><use href="#qualwhales-label"></use></svg></div>`;
    }
    if (kind === "placeholder") {
      return `
        <div class="icon-item"><svg viewBox="0 0 20 20"><rect x="2" y="2" width="16" height="16" fill="#3b82f6" rx="2" /></svg></div>
        <div class="icon-item"><svg viewBox="0 0 20 20"><rect x="2" y="2" width="16" height="16" fill="#22c55e" rx="2" /></svg></div>
        <div class="icon-item"><svg viewBox="0 0 20 20"><rect x="2" y="2" width="16" height="16" fill="#f97316" rx="2" /></svg></div>`;
    }
    return "";
  }

  function renderIdiomas(data) {
    const certs = (data.items || []).map((c) => {
      const grade = c.grade ? `<strong>${tri(c.grade)}</strong>` : "";

      const scores = (c.scores || []).map((s) => {
        if (s.total) {
          return `<div class="score-row total"><span class="score-label">${esc(s.label)}</span><span class="score-value">${esc(s.value)}</span></div>`;
        }
        return `<div class="score-row"><span class="score-label">${esc(s.label)}</span><span class="score-value">${esc(s.value)}</span></div>`;
      }).join("");

      const ex = c.exam || {};
      let examInline = `<span>${tri(UI.examDate)} ${esc(ex.date)}</span>`;
      if (ex.place) examInline += `<span>${tri(UI.examPlace)} ${esc(ex.place)}</span>`;
      if (ex.centre) examInline += `<span>${tri(UI.examCentre)} ${esc(ex.centre)}</span>`;

      let copyLine = "";
      const parts = [];
      if (c.verification) {
        parts.push(`<span class="copy-item"><strong>${tri(UI.verification)}</strong> ${esc(c.verification)} <button type="button" class="copy-icon" data-copy="${esc(c.verification)}" aria-label="Copy ${esc(c.verification)}"><i class="far fa-copy" aria-hidden="true"></i></button></span>`);
      }
      if (c.accreditation) {
        parts.push(`<span class="copy-item"><strong>${tri(UI.accreditation)}</strong> ${esc(c.accreditation)} <button type="button" class="copy-icon" data-copy="${esc(c.accreditation)}" aria-label="Copy ${esc(c.accreditation)}"><i class="far fa-copy" aria-hidden="true"></i></button></span>`);
      }
      if (parts.length) {
        copyLine = `<div class="copy-line">${parts.join('<span class="separator-dot">·</span>')}</div>`;
      }

      return `
        <div>
          <div class="cert-header-row">
            <div class="cert-text">
              <div class="cert-name"><i class="fas fa-check-circle" style="color:#1f7ab0;" aria-hidden="true"></i> ${tri(c.name)}</div>
              <div class="cert-org">${tri(c.org)}</div>
              <div class="grade-line">${grade}</div>
            </div>
            <div class="cert-icon-box" aria-hidden="true"><div class="cert-icons">${logosHTML(c.logos)}</div></div>
          </div>
          <div class="score-list">${scores}</div>
          <div class="exam-details">
            <div class="details-inline">${examInline}</div>
            ${copyLine}
          </div>
        </div>`;
    }).join("");

    let native = "";
    const nn = data.nativeNote;
    if (nn) {
      native = `<div class="lang-native"><i class="fas fa-globe" style="color:#1d6f9c; width:1.2rem;" aria-hidden="true"></i> ` +
        LANGS.map((l) =>
          `<span data-lang="${l}"><strong>${esc(nn.label[l])}</strong> ${esc(nn.value[l])}</span>`
        ).join("") + `</div>`;
    }

    setHTML("languages-list", certs + native);
  }

  // -------- carrusel de licencias (wallet 3D) -------------------------------
  function initWallet(licences) {
    const stage = document.getElementById("walletStackStage");
    const dotsContainer = document.getElementById("walletDots");
    const prevBtn = document.getElementById("walletPrev");
    const nextBtn = document.getElementById("walletNext");
    if (!stage) return;

    let currentIdx = 0;
    let cards = [];
    let dots = [];
    let hasDragged = false;

    function buildCards() {
      stage.innerHTML = "";
      dotsContainer.innerHTML = "";
      cards = [];
      dots = [];

      licences.forEach((lc, i) => {
        const adv = lc.advanced || {};
        const card = document.createElement("div");
        card.className = "wallet-stack-card";
        card.style.background = lc.color;
        if (lc.textColor) card.style.color = lc.textColor;
        if (adv.textAlign) card.style.textAlign = adv.textAlign;
        if (adv.padding) card.style.padding = adv.padding;
        card.setAttribute("data-index", i);

        const titleHTML = adv.customTitleHTML
          ? `<div class="wallet-card-title">${adv.customTitleHTML}</div>`
          : `<div class="wallet-card-title">${tri(lc.title)}</div>`;

        card.innerHTML = `
          ${lc.showIcon !== false && lc.icon ? `<div class="wallet-card-icon"><i class="fas ${esc(lc.icon)}" aria-hidden="true"></i></div>` : ""}
          ${titleHTML}
          <div class="wallet-card-detail">${tri(lc.detail)}</div>
          ${adv.decorativeHTML || ""}
        `;
        stage.appendChild(card);
        cards.push(card);

        const dot = document.createElement("button");
        dot.className = "wallet-dot";
        dot.setAttribute("data-index", i);
        dot.setAttribute("aria-label", "Licence " + (i + 1));
        dot.addEventListener("click", (e) => { e.stopPropagation(); goTo(i); });
        dotsContainer.appendChild(dot);
        dots.push(dot);
      });
    }

    function updateStack() {
      const total = cards.length;
      cards.forEach((card, idx) => {
        const offset = idx - currentIdx;
        let translateX, rotateY, zIndex, opacity;
        if (offset === 0) {
          translateX = "0%"; rotateY = "0deg"; zIndex = total + 1; opacity = 1;
        } else if (offset < 0) {
          const a = Math.abs(offset);
          translateX = `calc(-${a * 18}% - ${a * 10}px)`;
          rotateY = `${a * 4}deg`; zIndex = total - a; opacity = 1 - a * 0.15;
        } else {
          translateX = `calc(${offset * 18}% + ${offset * 10}px)`;
          rotateY = `-${offset * 4}deg`; zIndex = total - offset; opacity = 1;
        }
        card.style.transform = `translateX(${translateX}) scale(1) rotateY(${rotateY})`;
        card.style.zIndex = zIndex;
        card.style.opacity = Math.max(opacity, 0);
        card.style.pointerEvents = offset === 0 ? "auto" : "none";
      });
      dots.forEach((dot, i) => dot.classList.toggle("active", i === currentIdx));
    }

    function goTo(idx) {
      if (cards.length === 0) return;
      if (idx < 0) idx = cards.length - 1;
      if (idx >= cards.length) idx = 0;
      currentIdx = idx;
      updateStack();
    }

    // swipe / drag
    let startX = 0, startY = 0;
    function onDragStart(e) {
      hasDragged = false;
      if (e.type === "mousedown") { startX = e.clientX; startY = e.clientY; }
      else { startX = e.touches[0].clientX; startY = e.touches[0].clientY; }
    }
    function onDragEnd(e) {
      let endX, endY;
      if (e.type === "mouseup") { endX = e.clientX; endY = e.clientY; }
      else if (e.changedTouches && e.changedTouches[0]) { endX = e.changedTouches[0].clientX; endY = e.changedTouches[0].clientY; }
      else { return; }
      const diffX = startX - endX, diffY = startY - endY, threshold = 5;
      if (Math.abs(diffX) > threshold || Math.abs(diffY) > threshold) {
        hasDragged = true;
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
          goTo(currentIdx + (diffX > 0 ? 1 : -1));
        }
      }
      startX = startY = 0;
    }
    stage.addEventListener("touchstart", onDragStart);
    stage.addEventListener("mousedown", onDragStart);
    stage.addEventListener("touchend", onDragEnd);
    stage.addEventListener("mouseup", onDragEnd);
    stage.addEventListener("mouseleave", onDragEnd);
    stage.addEventListener("touchcancel", onDragEnd);

    stage.addEventListener("click", (e) => {
      if (hasDragged) return;
      const card = e.target.closest(".wallet-stack-card");
      if (!card) return;
      const idx = parseInt(card.getAttribute("data-index"), 10);
      if (idx === currentIdx) openDetail(idx);
    });

    // detail pop-up
    const overlay = document.getElementById("licence-detail-overlay");
    function openDetail(idx) {
      const lc = licences[idx];
      const adv = lc.advanced || {};
      const content = document.getElementById("detailContent");

      const iconHTML = lc.icon
        ? `<div class="wallet-card-icon"><i class="fas ${esc(lc.icon)}" aria-hidden="true"></i></div>`
        : "";
      const titleHTML = lc.title
        ? `<h2>${tri(lc.title)}</h2>`
        : (adv.customTitleHTML ? `<h2>${adv.customTitleHTML}</h2>` : "");
      const detailHTML = lc.detail ? `<p>${tri(lc.detail)}</p>` : "";
      const extraHTML = lc.extra ? `<p class="detail-extra">${tri(lc.extra)}</p>` : "";

      content.innerHTML = iconHTML + titleHTML + detailHTML + extraHTML;
      overlay.style.display = "flex";
      document.body.style.overflow = "hidden";
    }
    window.closeDetail = function () {
      overlay.style.display = "none";
      document.body.style.overflow = "";
    };
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.style.display === "flex") window.closeDetail();
    });

    prevBtn.addEventListener("click", () => goTo(currentIdx - 1));
    nextBtn.addEventListener("click", () => goTo(currentIdx + 1));
    document.addEventListener("keydown", (e) => {
      if (overlay.style.display === "flex") return;
      if (e.key === "ArrowLeft") goTo(currentIdx - 1);
      if (e.key === "ArrowRight") goTo(currentIdx + 1);
    });

    buildCards();
    updateStack();
  }

  // -------- idioma ----------------------------------------------------------
  function initLanguage() {
    const radios = Array.from(document.querySelectorAll('input[name="lang"]'));
    function apply(lang) {
      if (!LANGS.includes(lang)) lang = "en";
      document.documentElement.classList.remove("lang-en", "lang-ca", "lang-es");
      document.documentElement.classList.add("lang-" + lang);
      document.documentElement.lang = lang;
      const radio = document.getElementById("lang-" + lang);
      if (radio) radio.checked = true;
      try { localStorage.setItem("cvLang", lang); } catch (_) {}
    }
    radios.forEach((r) => r.addEventListener("change", (e) => {
      if (e.target.checked) apply(e.target.dataset.lang);
    }));
    let initial = "en";
    try {
      const stored = localStorage.getItem("cvLang");
      if (stored && LANGS.includes(stored)) initial = stored;
    } catch (_) {}
    apply(initial);
  }

  // -------- copiar al portapapeles -----------------------------------------
  let toastTimer = null;
  function showToast(message) {
    let toast = document.getElementById("cv-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "cv-toast";
      toast.className = "cv-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("visible");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 1800);
  }
  function legacyCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", "");
    ta.style.position = "absolute"; ta.style.left = "-9999px";
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (_) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
  function copyToClipboard(text) {
    const L = {
      en: { ok: "Copied: ", fail: "Could not copy" },
      ca: { ok: "Copiat: ", fail: "No s’ha pogut copiar" },
      es: { ok: "Copiado: ", fail: "No se pudo copiar" }
    };
    const lang = (document.documentElement.lang in L) ? document.documentElement.lang : "en";
    const done = () => showToast(L[lang].ok + text);
    const failed = () => showToast(L[lang].fail);
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(() => { legacyCopy(text) ? done() : failed(); });
    } else {
      legacyCopy(text) ? done() : failed();
    }
  }
  function wireCopyButtons() {
    document.querySelectorAll(".copy-icon[data-copy]").forEach((btn) => {
      btn.addEventListener("click", () => copyToClipboard(btn.dataset.copy));
    });
  }

  // -------- arranque --------------------------------------------------------
  async function boot() {
    initLanguage();
    try {
      const [perfil, comp, exp, edu, cert, idi, lic] = await Promise.all([
        loadJSON("content/perfil.json"),
        loadJSON("content/competencias.json"),
        loadJSON("content/experiencia.json"),
        loadJSON("content/educacion.json"),
        loadJSON("content/certificados.json"),
        loadJSON("content/idiomas.json"),
        loadJSON("content/licencias.json")
      ]);
      renderPerfil(perfil);
      renderCompetencias(comp);
      renderExperiencia(exp);
      renderEducacion(edu);
      renderCertificados(cert);
      renderIdiomas(idi);
      initWallet(lic.items || []);
      wireCopyButtons();
    } catch (err) {
      console.error(err);
      const main = document.querySelector(".cv-container");
      if (main) {
        main.insertAdjacentHTML("afterbegin",
          `<div class="card" style="color:#b33;">No se pudo cargar el contenido. ` +
          `Si has abierto el archivo con doble clic, ábrelo a través de un servidor local ` +
          `(p. ej. <code>python3 -m http.server</code>) o publícalo en GitHub Pages.<br><small>${esc(err.message)}</small></div>`);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
