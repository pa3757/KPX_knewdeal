(function () {
  const data = JSON.parse(document.getElementById('deck-data').textContent);
  const slides = data.slides;
  const N = slides.length;
  const $ = (id) => document.getElementById(id);
  const img = $('slide'), cur = $('cur'), sel = $('section');
  const linksBox = $('links');
  const grid = $('grid'), stage = $('stage');
  const pad = (n) => String(n).padStart(2, '0');
  const src = (i, thumb) => `slides/${pad(i + 1)}${thumb ? '_t' : ''}.webp`;
  let idx = 0;

  // 파트 선택 목록
  const secStart = [];
  slides.forEach((s, i) => { if (!secStart.find((x) => x.name === s.section)) secStart.push({ name: s.section, i }); });
  secStart.forEach(({ name, i }) => {
    const o = document.createElement('option');
    o.value = i; o.textContent = name || `슬라이드 ${i + 1}`;
    sel.appendChild(o);
  });
  sel.addEventListener('change', () => go(+sel.value));

  // 전체 보기
  let lastSec = null;
  slides.forEach((s, i) => {
    if (s.section !== lastSec) {
      const h = document.createElement('div');
      h.className = 'sec'; h.textContent = s.section; grid.appendChild(h); lastSec = s.section;
    }
    const b = document.createElement('button');
    b.innerHTML = `<img loading="lazy" src="${src(i, true)}" alt=""><span>${i + 1}. ${escapeHtml(s.title)}</span>`;
    b.addEventListener('click', () => { go(i); toggleGrid(false); });
    grid.appendChild(b);
  });

  function escapeHtml(t) { return t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function render() {
    const s = slides[idx];
    img.src = src(idx);
    img.alt = `${idx + 1}번 슬라이드: ${s.title}`;
    cur.textContent = idx + 1;
    $('prev').disabled = idx === 0;
    $('next').disabled = idx === N - 1;
    const secIdx = [...secStart].reverse().find((x) => x.i <= idx);
    if (secIdx) sel.value = secIdx.i;
    if (s.links.length) {
      linksBox.hidden = false;
      linksBox.innerHTML = '<h2>이 슬라이드의 링크</h2><ul>' + s.links.map((l) =>
        `<li><a href="${l.url}" target="_blank" rel="noopener">${escapeHtml(l.text || l.url)}</a></li>`).join('') + '</ul>';
    } else { linksBox.hidden = true; linksBox.innerHTML = ''; }
    grid.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-current', i === idx ? 'true' : 'false'));
    [idx - 1, idx + 1].forEach((j) => { if (j >= 0 && j < N) { const p = new Image(); p.src = src(j); } });
    if (location.hash !== `#${idx + 1}`) history.replaceState(null, '', `#${idx + 1}`);
  }
  function go(i) { idx = Math.max(0, Math.min(N - 1, i)); render(); }

  function toggleGrid(force) {
    const show = force ?? grid.hidden;
    grid.hidden = !show;
    $('toggle-grid').setAttribute('aria-pressed', show);
    if (show) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function fullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (stage.requestFullscreen) stage.requestFullscreen();
  }

  $('prev').addEventListener('click', () => go(idx - 1));
  $('next').addEventListener('click', () => go(idx + 1));
  $('toggle-grid').addEventListener('click', () => toggleGrid());
  $('fullscreen').addEventListener('click', fullscreen);

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'SELECT' || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') { e.preventDefault(); go(idx + 1); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); go(idx - 1); }
    else if (k === 'Home') go(0);
    else if (k === 'End') go(N - 1);
    else if (k === 'g' || k === 'G') toggleGrid();
    else if (k === 'f' || k === 'F') fullscreen();
  });

  let x0 = null;
  stage.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
    x0 = null;
  });
  window.addEventListener('hashchange', () => { const h = parseInt(location.hash.slice(1), 10); if (h && h - 1 !== idx) go(h - 1); });

  const h = parseInt(location.hash.slice(1), 10);
  go(h ? h - 1 : 0);
})();
