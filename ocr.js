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
  const RX_IMP = /(\d{1,3}(?:\.\d{3})+|\d+)\s?[,.]\s?(\d{2})(?!\d)/g;
  function importes(linea) {
    const l = linea.replace(/(\d)[Oo](?=\d)/g, '$10').replace(/(\d)[lI](?=\d)/g, '$11');
    const out = []; let m;
    RX_IMP.lastIndex = 0;
    while ((m = RX_IMP.exec(l))) out.push({ c: parseInt(m[1].replace(/\./g, ''), 10) * 100 + parseInt(m[2], 10), i: m.index, len: m[0].length });
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
    ds.flatMap(d => [d.nombre, d.rotulo].filter(Boolean).map(n => ({ unidad: d.unidad, nombre: n }))).forEach(d => {
      const nom = norm(d.nombre); if (nom.length < 4) return;
      if (n.includes(nom)) { if (!mejor || nom.length > mejor.l) mejor = { u: d.unidad, por: 'nombre', l: nom.length }; return; }
      const t = nom.split(' ').filter(x => x.length >= 4);
      const hits = t.filter(x => new RegExp('\\b' + x + '\\b').test(n)).length;
      if (t.length >= 2 && hits >= 2 && (!mejor || hits * 5 > mejor.l)) mejor = { u: d.unidad, por: 'nombre', l: hits * 5 };
    });
    return mejor;
  }


  /* ---------- Hoja de pagos de la comunidad ----------
     Cada vecino ocupa una fila. En la columna TOTAL hay cuentas a mano («120+28,61» y «148,61+50=198,61»):
     el importe a cobrar es la cifra que va después del último «=». La fila se reconoce por el nº de cuenta,
     el DNI, el piso o el nombre; la cifra se comprueba con la suma de su izquierda. */
  // Corrige letras que la escritura a mano suele confundir con cifras, solo en trozos numéricos
  function numTok(l) {
    // Cifras escritas a mano: O/о→0, S/V/r/T/г/√→5, l/I/|→1; «÷» es un «=»
    let s = String(l).split(/(\s+)/).map(t => /\d/.test(t) && /^[0-9OoОоSsVvrTг√lI|,.+=÷€:_-]+$/.test(t)
      ? t.replace(/[OoОо]/g, '0').replace(/[SsVvrTг√]/g, '5').replace(/[lI|]/g, '1').replace(/÷/g, '=') : t).join('');
    s = s.replace(/÷/g, '=');
    // «+50-», «+507191,68», «+50:» → el signo leído en lugar del «=»
    s = s.replace(/(\+\s*50)\s*(?:[-7:]\s*(?=\d{2,3}[.,]\d{2})|[-:]\s*$)/, '$1=');
    return s.replace(/=\s*=/g, '=');
  }
  function valor(str) {
    const m = String(str).match(/^\s*(\d{1,3}(?:\.\d{3})+|\d{1,5})(?:\s?[,.]\s?(\d{1,2}))?(?!\d)/);
    if (!m) return null;
    return parseInt(m[1].replace(/\./g, ''), 10) * 100 + (m[2] ? parseInt(m[2].padEnd(2, '0'), 10) : 0);
  }
  function sumaExpr(e) {
    const ps = e.split('+').map(x => valor(x.replace(/^[^0-9]+/, '')));
    return ps.length > 1 && ps.every(v => v != null) ? ps.reduce((a, b) => a + b, 0) : null;
  }
  function exprIgual(l) {
    const L = numTok(l), i = L.lastIndexOf('=');
    if (i < 0) return null;
    const dcha = L.slice(i + 1).replace(/^[\s:_\-—–|]+/, ''), fin = valor(dcha);
    const izq = L.slice(0, i).split('=').pop().match(/\d[\d.,\s]*(?:\+\s*\d[\d.,\s]*)+$/);
    const suma = izq ? sumaExpr(izq[0].trim()) : null;
    if (fin == null && suma == null) return null;
    return { fin, suma, ok: fin != null && suma != null && fin === suma, dec: /^\s*\d{1,5}\s?[.,]\s?\d/.test(dcha) };
  }
  function anclaHoja(l, n, ds) {
    const dig = l.replace(/[^0-9]/g, '');
    let best = null;
    ds.forEach(d => {
      const cta = String(d.iban || '').replace(/[^0-9]/g, '').slice(-10);
      if (cta.length === 10 && dig.includes(cta) && (!best || best.s < 3)) best = { u: d.unidad, s: 3, por: 'cuenta' };
      const dni = String(d.nif || '').replace(/[^0-9]/g, '');
      if (dni.length >= 7 && dig.includes(dni) && (!best || best.s < 3)) best = { u: d.unidad, s: 3, por: 'dni' };
    });
    if (best) return best;
    // «19 A», «29B», «3° A»: el «º» leído como 9 o 2
    const p = n.match(/^([1-9])[29O]?\s?([A-D])$/);
    if (p && ds.some(d => d.unidad === p[1] + p[2])) return { u: p[1] + p[2], s: 2, por: 'unidad' };
    const un = unidadDeLinea(n, ds);
    if (un) return { u: un.u, s: un.por === 'unidad' ? 2 : 1, por: un.por };
    // Rótulo de los locales (DEPORTES, LOCUTORIO, FRUTERIA), aunque falle la primera letra («#RUTERIA»)
    const toks = n.split(' ').filter(t => t.length >= 5);
    const r = ds.find(d => d.tipo === 'local' && [d.rotulo, d.nombre].filter(Boolean).some(x => norm(x).split(' ').some(t => t.length >= 6 &&
      toks.some(k => k === t || (k.length >= 6 && k.slice(1) === t.slice(1))))));
    return r ? { u: r.unidad, s: 1, por: 'nombre' } : null;
  }
  function analizarHoja(texto, ds) {
    // Une cuentas partidas («148,61+50 =» … «198,61»; «147,62+50-» … «= 197,62»), aunque haya una línea en medio
    const crudo = String(texto || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean), lineas = [];
    for (let k = 0; k < crudo.length; k++) {
      const l = crudo[k], L = numTok(l);
      if (/=\s*$/.test(L) && /\d\s*\+\s*\d/.test(L)) {
        let j = -1;
        for (let m = k + 1; m <= Math.min(crudo.length - 1, k + 2); m++) if (/^[\s=]*\d[\d.,\s]*$/.test(numTok(crudo[m]))) { j = m; break; }
        if (j > 0) { lineas.push(l + ' ' + crudo[j]); for (let m = k + 1; m < j; m++) lineas.push(crudo[m]); k = j; continue; }
      }
      const prev = lineas[lineas.length - 1];
      if (prev != null && /^=/.test(L) && /\d\s*\+\s*\d[\d.,]*\s*$/.test(numTok(prev)) && !/=/.test(numTok(prev))) lineas[lineas.length - 1] = prev + ' ' + l;
      else lineas.push(l);
    }
    const info = lineas.map(l => {
      const n = norm(l.replace(/\d+[.,]\d{2}/g, ' '));
      return { l, a: anclaHoja(l, n, ds), e: exprIgual(l) };
    });
    const nAnclas = info.filter(x => x.a && x.a.s >= 2).length, nExpr = info.filter(x => x.e).length;
    if (nAnclas < 3 || (nExpr < 3 && nAnclas < 6)) return null;
    const val = e => e.ok || e.fin == null ? (e.suma != null ? e.suma : e.fin) : e.fin;
    // Total de la hoja: la mayor cuenta bien formada (p. ej. «1543+550=2093,63»)
    let totalDoc = null;
    info.forEach(x => { if (x.e && (x.e.ok || x.e.dec)) { const v = val(x.e); if (v != null && v >= 50000 && (totalDoc == null || v > totalDoc)) totalDoc = v; } });
    // Bloques: líneas seguidas que hablan del mismo piso o local
    const bloques = []; let cur = null; const orden = [];
    info.forEach((x, i) => {
      if (x.a) {
        if (!orden.includes(x.a.u)) orden.push(x.a.u);
        if (!cur || cur.u !== x.a.u || cur.exprs.length) { cur = { u: x.a.u, s: x.a.s, por: x.a.por, exprs: [], ini: i, fin: i }; bloques.push(cur); }
        else if (x.a.s > cur.s) { cur.s = x.a.s; cur.por = x.a.por; }
      }
      if (cur) cur.fin = i;
      if (x.e && val(x.e) !== totalDoc) { if (cur) cur.exprs.push(Object.assign({ i }, x)); else bloques.push(cur = { u: null, s: 0, exprs: [Object.assign({ i }, x)], ini: i, fin: i }); }
    });
    // Lo que debería dar la fila según la hoja: «120+ 37,52» → 157,52 + 50 = 207,52
    const esperadoEn = (desde, hasta) => {
      for (let i = hasta; i >= Math.max(0, desde); i--) {
        const m = numTok(info[i].l).match(/(\d{2,3})\s*\+\s*(\d{1,3}\s?[.,]\s?\d{2})(?!\s*[\d=+])/);
        if (m) return valor(m[1]) + valor(m[2].replace(/\s/g, '')) + 5000;
      }
      return null;
    };
    const asig = {};
    const poner = (u, x, s, por, prio, esp) => {
      const e = x.e, prev = asig[u];
      if (prev && prev.prio >= prio) { prev.repetido = true; return; }
      let imp, verificado = false, corregido = false, calculado = false, alt = null;
      const fin = e.fin, suma = e.suma;
      if (fin != null && (fin === suma || fin === esp)) { imp = fin; verificado = true; }
      else if (suma != null && suma === esp) { imp = suma; corregido = fin != null; verificado = fin == null; }
      else if (fin == null && suma != null) imp = suma;
      else if (fin != null && suma != null && String(fin).endsWith(String(suma))) { imp = suma; corregido = true; }
      else if (esp != null && (fin == null || fin > esp * 2 || fin < esp / 2)) { imp = esp; calculado = true; }
      else { imp = fin; alt = suma; }
      asig[u] = { importe: imp, linea: x.l, por, s, prio, verificado, corregido, calculado, alt };
    };
    // 1) Una cuenta dentro del bloque de su piso (texto copiado por filas o casilla a casilla)
    const cola = [];
    bloques.forEach((b, k) => {
      const esp = b.u ? esperadoEn(b.ini, b.exprs.length ? b.exprs[0].i : b.fin) : null;
      if (b.u && b.exprs.length === 1) { poner(b.u, b.exprs[0], b.s, b.por, b.s >= 2 ? 3 : 1, esp); return; }
      if (b.u && !b.exprs.length) {
        // Sin «=»: «130+50» de un local, o la fila de un piso con la cuenta ilegible
        for (let i = b.ini; i <= b.fin; i++) {
          const m = numTok(info[i].l).match(/^\s*(\d{2,3})\s*\+\s*50\s*$/);
          if (m) { poner(b.u, { e: { fin: null, suma: valor(m[1]) + 5000 }, l: info[i].l }, b.s, b.por, 2, null); asig[b.u].calculado = true; return; }
        }
        if (esp != null && b.s >= 2) { poner(b.u, { e: { fin: null, suma: null }, l: info[b.ini].l }, b.s, b.por, 2, esp); }
        return;
      }
      // Varios nombres seguidos y luego sus cuentas (notas bajo la tabla: DEPORTES / LOCUTORIO / FRUTERIA)
      if (b.u && b.exprs.length > 1) {
        const nombres = []; let j = k;
        while (j >= 0 && (j === k || (bloques[j].fin < b.exprs[0].i && !bloques[j].exprs.length)) && nombres.length < b.exprs.length) { nombres.unshift(bloques[j]); j--; }
        const seguidas = b.exprs.every((x, q) => q === 0 || x.i - b.exprs[q - 1].i === 1);
        if (seguidas && nombres.length >= 2) {
          // los nombres sin ancla («#RUTERIA» ilegible) ocupan su hueco
          const huecos = info.slice(nombres[0].ini, b.exprs[0].i).filter(y => !y.e && y.l.length < 25);
          huecos.forEach((y, q) => { if (b.exprs[q] && y.a) poner(y.a.u, b.exprs[q], 1, y.a.por, 1, null); });
          b.exprs.slice(huecos.length).forEach(x => cola.push(x));
          return;
        }
      }
      b.exprs.forEach(x => cola.push(x));
    });
    // 2) Cifras seguidas de toda la tabla (texto copiado por columnas): por el orden de las filas
    cola.sort((a, b) => a.i - b.i);
    const primera = cola.length ? cola[0].i : Infinity;
    const ordenTabla = orden.filter(u => info.some((x, i) => i < primera && x.a && x.a.u === u));
    const sin = ordenTabla.filter(u => !asig[u] || asig[u].prio < 2);
    const usadas = [];
    if (sin.length >= 3 && sin.length >= ordenTabla.length / 2 && cola.length >= sin.length) sin.forEach((u, k) => { poner(u, cola[k], 1, 'orden', 2, null); usadas.push(cola[k]); });
    // 3) Si solo falta un domiciliado, sale de restar al total de la hoja los que sí se han leído
    const dom = ds.filter(d => d.pago !== 'efectivo' && orden.includes(d.unidad));
    const falta = dom.filter(d => !asig[d.unidad] || asig[d.unidad].importe == null);
    if (totalDoc != null && falta.length === 1) {
      const resto = totalDoc - dom.filter(d => d !== falta[0]).reduce((a, d) => a + asig[d.unidad].importe, 0);
      if (resto > 0 && resto < totalDoc / 2) asig[falta[0].unidad] = { importe: resto, linea: 'Total de la hoja menos el resto de domiciliados', por: 'total', prio: 1, calculado: true };
    }
    const filas = ds.map(d => Object.assign({ deudorId: d.id, unidad: d.unidad }, asig[d.unidad] || { importe: null }));
    const sueltas = cola.filter(x => !usadas.includes(x)).map((x, idx) => ({ importe: val(x.e), linea: x.l, idx }));
    return { filas, sueltas, totalDoc, lineas, hoja: true };
  }

  function analizar(texto, deudores) {
    const ds = deudores.filter(d => d.activo !== false);
    const h = analizarHoja(texto, ds);
    if (h) return h;
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

  g.OCR = { leer, analizar, analizarHoja, importes, norm, _unidad: unidadDeLinea };
})(typeof window !== 'undefined' ? window : globalThis);
