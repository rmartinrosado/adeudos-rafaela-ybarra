/* Lector de fotos: reconoce el texto del documento de totales en el propio iPhone (Tesseract, sin servidores)
   y asigna a cada vivienda o local el importe de su línea. */
(function (g) {
  'use strict';
  const TESS = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
  const WORKER = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js';
  const CORE = 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1';

  function cargarMotor() {
    if (g.Tesseract) return Promise.resolve(g.Tesseract);
    return new Promise((ok, ko) => {
      const s = document.createElement('script');
      s.src = TESS; s.async = true;
      s.onload = () => g.Tesseract ? ok(g.Tesseract) : ko(new Error('motor no disponible'));
      s.onerror = () => ko(new Error('sin conexión'));
      document.head.appendChild(s);
    });
  }

  // Reduce, pasa a gris y estira el contraste: mejora mucho la lectura de fotos de papel
  async function preparar(file) {
    let img;
    try { img = await createImageBitmap(file); }
    catch (e) {
      img = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = URL.createObjectURL(file); });
    }
    const w0 = img.width, h0 = img.height, k = Math.min(1, 2200 / Math.max(w0, h0));
    const w = Math.round(w0 * k), h = Math.round(h0 * k);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h), p = d.data, hist = new Uint32Array(256);
    for (let i = 0; i < p.length; i += 4) { const v = (p[i] * 299 + p[i + 1] * 587 + p[i + 2] * 114) / 1000 | 0; p[i] = v; hist[v]++; }
    const n = w * h; let lo = 0, hi = 255, acc = 0;
    for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc > n * 0.02) { lo = v; break; } }
    acc = 0; for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc > n * 0.02) { hi = v; break; } }
    const r = Math.max(1, hi - lo);
    for (let i = 0; i < p.length; i += 4) { const v = Math.max(0, Math.min(255, (p[i] - lo) * 255 / r)); p[i] = p[i + 1] = p[i + 2] = v; }
    x.putImageData(d, 0, 0);
    return c;
  }

  async function leer(file, progreso) {
    progreso = progreso || (() => {});
    progreso(0.02, 'Preparando la foto');
    const canvas = await preparar(file);
    progreso(0.06, 'Cargando el lector de texto');
    const T = await cargarMotor();
    const worker = await T.createWorker('spa', 1, {
      workerPath: WORKER, corePath: CORE,
      logger: m => {
        if (m.status === 'recognizing text') progreso(0.25 + m.progress * 0.73, 'Leyendo el documento');
        else if (/loading|initializ/.test(m.status)) progreso(0.06 + (m.progress || 0) * 0.18, 'Cargando el lector de texto');
      }
    });
    try {
      await worker.setParameters({ preserve_interword_spaces: '1', tessedit_pageseg_mode: '6' });
      const { data } = await worker.recognize(canvas);
      progreso(1, 'Listo');
      return data.text || '';
    } finally { worker.terminate(); }
  }

  /* ---------- Análisis del texto ---------- */
  const ORD = { PRIMERO: 1, PRIMER: 1, SEGUNDO: 2, TERCERO: 3, TERCER: 3, BAJO: 0 };
  function norm(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
      .replace(/[º°ª]/g, ' ').replace(/[|_]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  // Importes con 2 decimales: 1.234,56 · 62,40 · 62.40 · 62, 40
  const RX_IMP = /(\d{1,3}(?:[.\s]\d{3})+|\d+)\s?[,.]\s?(\d{2})(?!\d)/g;
  function importes(linea) {
    const l = linea.replace(/(\d)[Oo](?=\d)/g, '$10').replace(/(\d)[lI](?=\d)/g, '$11');
    const out = []; let m;
    RX_IMP.lastIndex = 0;
    while ((m = RX_IMP.exec(l))) out.push({ c: parseInt(m[1].replace(/[.\s]/g, ''), 10) * 100 + parseInt(m[2], 10), i: m.index, len: m[0].length });
    if (!out.length) { const e = l.match(/(\d{1,5})\s?(?:€|EUR)/i); if (e) out.push({ c: parseInt(e[1], 10) * 100, i: e.index, len: e[0].length }); }
    return out;
  }
  function sinImportes(l, imps) { let s = l; imps.slice().reverse().forEach(x => { s = s.slice(0, x.i) + ' ' + s.slice(x.i + x.len); }); return s; }

  function unidadDeLinea(n, ds) {
    let m = n.match(/\bLOCAL(?:ES)?\s*(?:N\s*)?(?:NUM\.?\s*)?(\d{1,2})\b/) || n.match(/\bL\s?-?\s?(\d)\b/) || n.match(/\bBAJO\s*(\d)\b/);
    if (m) { const u = 'L' + parseInt(m[1], 10); if (ds.some(d => d.unidad === u)) return { u, por: 'unidad' }; }
    // Código al principio de la línea, con los errores típicos al leer «º»: 1ºA → 12A, 19A; 3ºA → 324; 3ºC → 39€
    const tok = n.split(' ')[0];
    m = tok.match(/^([1-9])[29O°]?([A-D4€(8])\.?$/);
    if (m) { const u = m[1] + ({ '4': 'A', '€': 'C', '(': 'C', '8': 'B' }[m[2]] || m[2]); if (ds.some(d => d.unidad === u)) return { u, por: 'unidad' }; }
    m = n.match(/\b(PRIMERO|PRIMER|SEGUNDO|TERCERO|TERCER)\s*-?\s*([A-D])\b/);
    if (m) { const u = ORD[m[1]] + m[2]; if (ds.some(d => d.unidad === u)) return { u, por: 'unidad' }; }
    const rx = /(?:^|[^0-9,.])([1-9])\s?(?:PISO\s?|PLANTA\s?)?[-.\/]?\s?([A-D])(?![A-Z0-9])/g;
    while ((m = rx.exec(n))) { const u = m[1] + m[2]; if (ds.some(d => d.unidad === u)) return { u, por: 'unidad' }; }
    m = n.match(/\bPISO\s*([1-9])\s*[-.]?\s*([A-D])\b/);
    if (m) { const u = m[1] + m[2]; if (ds.some(d => d.unidad === u)) return { u, por: 'unidad' }; }
    // Por nombre del local o del titular
    let mejor = null;
    ds.forEach(d => {
      const nom = norm(d.nombre); if (nom.length < 4) return;
      if (n.includes(nom)) { if (!mejor || nom.length > mejor.l) mejor = { u: d.unidad, por: 'nombre', l: nom.length }; return; }
      const t = nom.split(' ').filter(x => x.length >= 4);
      const hits = t.filter(x => new RegExp('\\b' + x + '\\b').test(n)).length;
      if (t.length >= 2 && hits >= 2 && (!mejor || hits * 5 > mejor.l)) mejor = { u: d.unidad, por: 'nombre', l: hits * 5 };
    });
    return mejor;
  }

  function analizar(texto, deudores) {
    const ds = deudores.filter(d => d.activo !== false);
    const lineas = String(texto || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const asig = {}, sueltas = []; let totalDoc = null;
    let pendiente = null; // unidad sin importe a la espera de la línea siguiente
    lineas.forEach((l, idx) => {
      const imps = importes(l), n = norm(sinImportes(l, imps));
      const un = unidadDeLinea(n, ds);
      if (/\b(TOTAL|SUMA|IMPORTE TOTAL)\b/.test(n) && !un) {
        if (imps.length) totalDoc = imps[imps.length - 1].c;
        pendiente = null; return;
      }
      if (un && imps.length) {
        const prev = asig[un.u];
        asig[un.u] = { importe: imps[imps.length - 1].c, linea: l, por: un.por, repetido: !!prev };
        pendiente = null;
      } else if (un && un.por === 'nombre' && /\b(\d{1,4})\s*$/.test(n)) {
        asig[un.u] = { importe: parseInt(n.match(/\b(\d{1,4})\s*$/)[1], 10) * 100, linea: l, por: un.por }; pendiente = null;
      } else if (un) { pendiente = { u: un.u, linea: l, por: un.por }; }
      else if (imps.length) {
        if (pendiente && !asig[pendiente.u]) { asig[pendiente.u] = { importe: imps[imps.length - 1].c, linea: pendiente.linea + ' / ' + l, por: pendiente.por }; pendiente = null; }
        else sueltas.push({ importe: imps[imps.length - 1].c, linea: l, idx });
      }
    });
    const filas = ds.map(d => Object.assign({ deudorId: d.id, unidad: d.unidad }, asig[d.unidad] || { importe: null }));
    return { filas, sueltas, totalDoc, lineas };
  }

  g.OCR = { leer, analizar, importes, norm, _unidad: unidadDeLinea };
})(typeof window !== 'undefined' ? window : globalThis);
