/* Adeudos Comunidad · Av. de Rafaela Ybarra, 5 — PWA local (los datos no salen del iPhone) */
(function () {
  'use strict';
  const S = window.SEPA;
  const KEY = 'adeudosRY5_v1';
  const VERSION = 'v3.8';
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);


  /* ---------- Iconos (línea fina, se trazan al activarse) ---------- */
  const I = {
    panel: '<path pathLength="1" d="M3 20.5h18"/><path pathLength="1" d="M4 9.5 12 4l8 5.5"/><path pathLength="1" d="M6 11v6.5M10 11v6.5M14 11v6.5M18 11v6.5"/>',
    remesa: '<path pathLength="1" d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path pathLength="1" d="M14 3v5h5"/><path pathLength="1" d="M14.6 11.7a3 3 0 1 0 0 4.6"/><path pathLength="1" d="M9 13.3h4.2M9 14.8h4.2"/>',
    vecinos: '<circle pathLength="1" cx="8" cy="15.5" r="4"/><path pathLength="1" d="m10.9 12.6 8.6-8.6"/><path pathLength="1" d="m16.6 6.9 2.6 2.6M14.4 9.1l2 2"/>',
    historial: '<rect pathLength="1" x="3" y="4" width="18" height="5" rx="1.2"/><path pathLength="1" d="M5 9v9.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V9"/><path pathLength="1" d="M10 13h4"/>',
    ajustes: '<path pathLength="1" d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle pathLength="1" cx="15" cy="6" r="2"/><circle pathLength="1" cx="9" cy="12" r="2"/><circle pathLength="1" cx="17" cy="18" r="2"/>',
    calendario: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8 14h2M12 14h2M8 17h2"/>',
    efectivo: '<rect x="2.5" y="6.5" width="19" height="11" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/>',
    fichero: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
    compartir: '<path d="M12 15V3.5M8 7.5l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
    bajar: '<path d="M12 3.5v11M8 10.5l4 4 4-4"/><path d="M5 19.5h14"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    aviso: '<path d="M12 3.8 2.8 19.8h18.4z"/><path d="M12 10v4.3M12 17v.2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.2"/>',
    mas: '<path d="M12 5v14M5 12h14"/>',
    grafico: '<path d="M3 20.5h18"/><path d="M6 17V11M10.5 17V6M15 17v-4M19.5 17V8.5"/>',
    sello: '<path d="m12 2.8 2.3 1.9 3-.3.8 2.9 2.5 1.7-1.2 2.8 1.2 2.8-2.5 1.7-.8 2.9-3-.3L12 21.2l-2.3-1.9-3 .3-.8-2.9-2.5-1.7 1.2-2.8-1.2-2.8 2.5-1.7.8-2.9 3 .3z"/><path d="m8.8 12 2.2 2.2 4.2-4.4"/>',
    escudo: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8 7.5 9.5 4.3-1.5 7.5-4.9 7.5-9.5V6z"/><path d="m9 12 2.2 2.2L15.2 10"/>',
    flecha: '<path d="m9 5 7 7-7 7"/>',
    camara: '<path d="M4 8h3l1.8-2.5h6.4L17 8h3a1 1 0 0 1 1 1v9.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.3" r="3.6"/>',
    escanear: '<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"/><path d="M7.5 9h9M7.5 12h9M7.5 15h5"/>'
  };
  function ico(n, cls) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' +
      (cls ? ' class="' + cls + '"' : '') + '>' + I[n] + '</svg>';
  }
  const TABS = [['panel', 'Panel'], ['remesa', 'Remesa'], ['deudores', 'Vecinos'], ['historial', 'Historial'], ['ajustes', 'Ajustes']];
  const ICO_TAB = { panel: 'panel', remesa: 'remesa', deudores: 'vecinos', historial: 'historial', ajustes: 'ajustes' };
  $('#nav').innerHTML = TABS.map(t => '<button data-tab="' + t[0] + '">' + ico(ICO_TAB[t[0]]) + t[1] + '</button>').join('');
  const eurC = c => Math.round(c / 100).toLocaleString('es-ES') + ' €';

  /* ---------- Datos ---------- */
  function deudorBase(unidad, tipo, nombre, orden) {
    return { id: uid(), unidad, tipo, nombre: nombre || '', rotulo: tipo === 'local' ? (nombre || '') : '', nif: '', iban: '', bic: '',
      mandato: 'RY5-' + unidad, fechaMandato: '2009-10-31', previos: false, activo: true, orden,
      pago: tipo === 'local' ? 'efectivo' : 'domiciliado' };
  }
  function defaults() {
    const pisos = ['1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C'];
    const d = pisos.map((p, i) => deudorBase(p, 'piso', '', i));
    d.push(deudorBase('L1', 'local', 'DEPORTES GÁLVEZ', 9));
    d.push(deudorBase('L2', 'local', 'LOCUTORIO', 10));
    d.push(deudorBase('L3', 'local', 'FRUTERÍA', 11));
    return {
      config: {
        nombre: 'Comunidad de Propietarios Av. de Rafaela Ybarra 5', nif: '', sufijo: '000',
        iban: '', bic: 'BSCHESMMXXX', idAcreedor: '', contrato: '', presidente: 'Marcelo', presidenteId: '', vicepresidente: '', vicepresidenteId: '',
        direccion: 'Av. de Rafaela Ybarra, 5', cp: '28026', localidad: 'Madrid', provincia: 'Madrid',
        concepto: 'CUOTA COMUNIDAD {PERIODO} {UNIDAD}', modoSeq: 'auto'
      },
      deudores: d, remesas: [], borrador: null
    };
  }
  let st;
  try { st = JSON.parse(localStorage.getItem(KEY)) || defaults(); } catch (e) { st = defaults(); }
  const dflt = defaults();
  st.config = Object.assign({}, dflt.config, st.config);
  const BASE = ['1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C'].map(u => [u, 'piso', ''])
    .concat([['L1', 'local', 'DEPORTES GÁLVEZ'], ['L2', 'local', 'LOCUTORIO'], ['L3', 'local', 'FRUTERÍA']]);
  const esBase = d => BASE.some(b => b[0] === d.unidad);
  migrar(); guardar();
  // Código de unidad normalizado: «Local 1», «L-1», «1» → L1 · «1º A», «1-A», «piso 1a» → 1A
  function normUnidad(tipo, raw) {
    const t = S.limpiar(raw).toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!t) return '';
    if (tipo === 'local') { const m = t.match(/(\d+)/); return m ? 'L' + parseInt(m[1], 10) : ''; }
    const m = t.replace(/^PISO/, '').match(/^(\d+)O?([A-Z])$/);
    return m ? parseInt(m[1], 10) + m[2] : '';
  }
  function migrar() {
    // v2.6: repara códigos de unidad mal guardados (p. ej. «LOCAL1» en vez de «L1»)
    st.deudores.forEach(d => { if (d.tipo !== 'local' && /^L(OCAL)?\d+$/.test(S.limpiar(d.unidad).toUpperCase().replace(/[^A-Z0-9]/g, ''))) { d.tipo = 'local'; d.pago = 'efectivo'; } });
    st.deudores.forEach(d => {
      const u = normUnidad(d.tipo, d.unidad);
      if (u && u !== d.unidad && !st.deudores.some(x => x !== d && x.unidad === u)) d.unidad = u;
    });
    // v2.9: unidades sin número (p. ej. «LALIMENTACION», al escribir el nombre en el nº de local) → vuelven a su local
    const clave = x => S.limpiar(x || '').toUpperCase().replace(/[^A-Z]/g, '');
    const usado = x => st.remesas.some(r => r.items.some(i => i.deudorId === x.id) || (r.efectivo || []).some(e => e.deudorId === x.id && e.importe > 0));
    const vacio = (x, nom) => !x.nif && !x.iban && (!x.nombre || clave(x.nombre) === clave(nom)) && !usado(x);
    const valida = x => x.tipo === 'local' ? /^L\d+$/.test(x.unidad) : /^\d+[A-Z]$/.test(x.unidad);
    st.deudores.filter(d => !valida(d)).forEach(d => {
      const cand = BASE.filter(b => b[1] === d.tipo);
      let t = cand.find(b => b[2] && (clave(d.unidad).includes(clave(b[2])) || clave(d.nombre) === clave(b[2])));
      if (!t) {
        const libres = cand.filter(b => { const o = st.deudores.find(x => x !== d && x.unidad === b[0]); return !o || vacio(o, b[2]); });
        if (libres.length === 1) t = libres[0];
      }
      if (!t) return;
      const o = st.deudores.find(x => x !== d && x.unidad === t[0]);
      if (o && vacio(o, t[2])) st.deudores = st.deudores.filter(x => x !== o);
      if (!st.deudores.some(x => x !== d && x.unidad === t[0])) d.unidad = t[0];
    });
    // v1.1: forma de pago por deudor (los locales pagan en efectivo)
    st.deudores.forEach(d => { if (!d.pago) d.pago = d.tipo === 'local' ? 'efectivo' : 'domiciliado'; });
    st.remesas.forEach(r => { if (!r.efectivo) r.efectivo = []; });
    // v2.7: el edificio siempre tiene sus 9 pisos y 3 locales (se recrean si faltan)
    BASE.forEach(([u, tipo, nom], i) => {
      let d = st.deudores.find(x => x.unidad === u);
      if (!d) { d = deudorBase(u, tipo, nom, i); st.deudores.push(d); }
      // v3.0: rótulo (nombre comercial) del local, editable y separado del titular
      if (tipo === 'local' && !d.rotulo) d.rotulo = d.nombre || nom;
      // v3.1: rótulos indicados por el administrador (una sola vez; luego se pueden editar)
      if (tipo === 'local' && !st.config.migRot31) {
        if (!d.nombre || clave(d.nombre) === clave(d.rotulo)) d.nombre = nom;
        d.rotulo = nom;
      }
      if (d.tipo !== tipo) d.tipo = tipo;
    });
    st.config.migRot31 = true;
  }
  function guardar() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { toast('No se pudo guardar en el dispositivo'); } }

  function etiqueta(d) { return d.tipo === 'local' ? 'LOCAL ' + d.unidad.replace(/^L/, '') : 'PISO ' + d.unidad; }
  function corto(d) { return d.tipo === 'local' ? 'L' + d.unidad.replace(/^L/, '') : d.unidad; }
  function ordenados() { return st.deudores.slice().sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99)); }
  const esEf = d => d.pago === 'efectivo';
  const nomVis = d => d.tipo === 'local' ? (d.rotulo || d.nombre || '') : (d.nombre || '');
  const centAStr = c => (c / 100).toFixed(2).replace('.', ',');
  function idAcrCalc() { return S.idAcreedor(st.config.nif, st.config.sufijo); }
  function idAcr() { const m = String(st.config.idAcreedor || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); return m || idAcrCalc(); }

  /* ---------- Borrador de remesa ---------- */
  function mesIso(y, m) { return y + '-' + String(m + 1).padStart(2, '0'); }
  function borrador() {
    if (!st.borrador) {
      const hoy = S.hoyIso(), p = S.periodoDeFecha(hoy);
      st.borrador = { fechaGen: hoy, idx: p.idx, anio: p.anio, mesCobro: mesIso(p.anio, p.idx * 2),
        importes: {}, excluir: {}, formatos: { core: true, c1914: true, b2b: true, c1944: true } };
      const ult = ultimaRemesa();
      if (ult) cargarImportes(ult);
    }
    return st.borrador;
  }
  function cargarImportes(r) {
    const imp = st.borrador.importes;
    r.items.concat(r.efectivo || []).forEach(i => { if (i.importe > 0) imp[i.deudorId] = centAStr(i.importe); });
  }
  function ultimaRemesa() { return st.remesas.slice().sort((a, b) => b.fechaCobro.localeCompare(a.fechaCobro))[0]; }
  function nombreActual() { const b = borrador(); return S.nombreRemesa(b.idx, b.anio); }
  function fechaCobro() { return borrador().mesCobro + '-10'; }
  function secuencia(d, nombre) {
    if (st.config.modoSeq === 'rcur' || d.previos) return 'RCUR';
    const antes = st.remesas.some(r => r.nombre !== nombre && r.items.some(i => i.deudorId === d.id));
    return antes ? 'RCUR' : 'FRST';
  }
  function opcionesMesCobro() {
    const b = borrador(), base = new Date(b.anio, b.idx * 2, 1), out = [];
    for (let k = -1; k <= 5; k++) {
      const d = new Date(base.getFullYear(), base.getMonth() + k, 1);
      out.push({ v: mesIso(d.getFullYear(), d.getMonth()), t: S.MESES[d.getMonth()] + ' ' + d.getFullYear() });
    }
    return out;
  }

  /* ---------- Validación y construcción ---------- */
  function construir() {
    const b = borrador(), c = st.config, nombre = nombreActual(), fc = fechaCobro();
    const errores = [], avisos = [];
    const id = idAcr();
    if (!c.nif) errores.push('Falta el NIF de la comunidad (Ajustes).');
    else if (!S.validarNif(c.nif).ok) avisos.push('El NIF de la comunidad no supera la comprobación de su dígito de control. Revísalo.');
    if (!S.ibanValido(c.iban)) errores.push('El IBAN de la cuenta de la comunidad no es válido (Ajustes).');
    if (!c.nombre) errores.push('Falta el nombre de la comunidad (Ajustes).');
    if (!b.fechaGen) errores.push('Indica la fecha de generación.');
    if (b.fechaGen && fc <= b.fechaGen) errores.push('La fecha de cobro (' + fmtFecha(fc) + ') debe ser posterior a la de generación.');
    else if (b.fechaGen) {
      const hab = S.diasHabilesEntre(b.fechaGen, fc);
      if (hab < 2) avisos.push('Solo hay ' + hab + ' día(s) hábil(es) hasta el cobro. Si el banco no llega a tiempo, puede retrasar el cargo o rechazar la remesa.');
    }
    const w = S.aDate(fc).getDay();
    if (w === 0 || w === 6) avisos.push('El día 10 cae en ' + (w === 6 ? 'sábado' : 'domingo') + '. El cargo se hará normalmente el siguiente día hábil.');
    if (!Object.values(b.formatos).some(Boolean)) errores.push('Marca al menos un formato de fichero.');

    const items = [];
    ordenados().filter(d => d.activo && !esEf(d) && !b.excluir[d.id]).forEach(d => {
      const imp = S.parseImporte(b.importes[d.id]);
      const lab = etiqueta(d);
      if (!d.nombre) errores.push(lab + ': falta el nombre del titular.');
      if (!S.ibanValido(d.iban)) errores.push(lab + ': IBAN no válido o vacío.');
      if (!(imp > 0)) errores.push(lab + ': indica el importe.');
      if (!d.mandato) errores.push(lab + ': falta la referencia del mandato.');
      if (!d.fechaMandato) errores.push(lab + ': falta la fecha de firma del mandato.');
      if (d.nif && !S.validarNif(d.nif).ok) avisos.push(lab + ': el DNI/NIF no supera la comprobación del dígito de control.');
      items.push({
        deudorId: d.id, unidad: d.unidad, ref: nombre + '-' + corto(d), mandato: d.mandato, fechaMandato: d.fechaMandato,
        seq: secuencia(d, nombre), importe: imp, nombre: d.nombre, nif: d.nif, org: d.tipo === 'local' && /^[A-HJ-NP-SUVW]/i.test(d.nif || ''),
        iban: S.normIban(d.iban), bic: (d.bic || S.bicDeIban(d.iban) || '').toUpperCase(),
        concepto: (c.concepto || '').replace('{PERIODO}', nombre).replace('{UNIDAD}', lab),
        d1: c.direccion + ' ' + lab, d2: c.cp + ' ' + c.localidad, d3: c.provincia
      });
    });
    if (!items.length) errores.push('No hay ningún deudor domiciliado incluido en la remesa.');
    const previa = st.remesas.find(x => x.nombre === nombre);
    const efectivo = ordenados().filter(d => d.activo && esEf(d)).map(d => {
      const imp = S.parseImporte(b.importes[d.id]);
      const ant = previa && (previa.efectivo || []).find(e => e.deudorId === d.id);
      return { deudorId: d.id, unidad: d.unidad, nombre: nomVis(d) || etiqueta(d), etiqueta: etiqueta(d), importe: imp > 0 ? imp : 0,
        cobrado: ant ? ant.cobrado : false, fechaPago: ant ? ant.fechaPago : '' };
    });
    const sinImp = efectivo.filter(e => !e.importe).map(e => e.etiqueta);
    if (sinImp.length) avisos.push('Sin importe en efectivo: ' + sinImp.join(', ') + '.');
    if (b.formatos.b2b || b.formatos.c1944) avisos.push('B2B solo lo aceptan cuentas de empresas o autónomos con contrato B2B en su banco. Para particulares usa CORE.');
    const remesa = {
      nombre, fechaGen: b.fechaGen, fechaCobro: fc,
      acreedor: { nombre: c.nombre, id, iban: S.normIban(c.iban), bic: (c.bic || '').toUpperCase(), d1: c.direccion, d2: c.cp + ' ' + c.localidad, d3: c.provincia, pais: 'ES' },
      items
    };
    return { errores, avisos, remesa, efectivo };
  }

  function ficheros(rem, f) {
    const out = [], n = rem.nombre;
    if (f.core) out.push({ name: n + '.xml', etiqueta: 'XML SEPA CORE (pain.008)', type: 'application/xml', content: S.genXml(rem, 'CORE') });
    if (f.c1914) out.push({ name: n + '.txt', etiqueta: 'Cuaderno 19.14 CORE', type: 'text/plain', content: S.genCuaderno(rem, 'CORE') });
    if (f.b2b) out.push({ name: n + '_B2B.xml', etiqueta: 'XML SEPA B2B (pain.008)', type: 'application/xml', content: S.genXml(rem, 'B2B') });
    if (f.c1944) out.push({ name: n + '_B2B.txt', etiqueta: 'Cuaderno 19.44 B2B', type: 'text/plain', content: S.genCuaderno(rem, 'B2B') });
    return out;
  }

  /* ---------- Utilidades UI ---------- */
  function fmtFecha(iso) { if (!iso) return ''; const [y, m, d] = iso.split('-'); return d + '/' + m + '/' + y; }
  function diaSemana(iso) { return ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][S.aDate(iso).getDay()]; }
  let tt;
  function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => e.classList.remove('on'), 2200); }
  function abrir(html) { const d = $('#dlg'); d.innerHTML = html; if (!d.open) d.showModal(); }
  function cerrar() { const d = $('#dlg'); if (d.open) d.close(); }
  function aFile(f) { return new File([f.content], f.name, { type: f.type }); }
  function descargar(f) {
    const url = URL.createObjectURL(new Blob([f.content], { type: f.type }));
    const a = document.createElement('a'); a.href = url; a.download = f.name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
  }
  function compartirBlob(blob, name) {
    const file = new File([blob], name, { type: blob.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: name }).catch(() => {});
    else { const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500); }
  }
  function compartir(lista) {
    const files = lista.map(aFile);
    if (navigator.canShare && navigator.canShare({ files })) {
      navigator.share({ files, title: lista[0].name }).catch(e => { if (e.name !== 'AbortError') toast('No se pudo compartir'); });
    } else { lista.forEach(descargar); }
  }


  /* ---------- Pestaña Panel ---------- */
  function estadoBimestre() {
    const b = borrador(), nombre = nombreActual(), rem = st.remesas.find(r => r.nombre === nombre) || null;
    const ds = ordenados().filter(d => d.activo);
    let banco = 0, ef = 0, efCob = 0;
    if (rem) {
      banco = rem.items.reduce((s, i) => s + i.importe, 0);
      (rem.efectivo || []).forEach(e => { ef += e.importe; if (e.cobrado) efCob += e.importe; });
    } else {
      ds.forEach(d => { const c = S.parseImporte(b.importes[d.id]); if (!(c > 0)) return; if (esEf(d)) ef += c; else if (!b.excluir[d.id]) banco += c; });
    }
    const est = {};
    ds.forEach(d => {
      let e;
      if (esEf(d)) {
        const x = rem && (rem.efectivo || []).find(y => y.deudorId === d.id && y.importe > 0);
        e = x ? (x.cobrado ? 'hecho' : 'pendiente') : (nomVis(d) ? 'listo' : 'falta');
      } else if (!d.nombre || !S.ibanValido(d.iban)) e = 'falta';
      else e = rem && rem.items.some(i => i.deudorId === d.id) ? 'hecho' : 'listo';
      est[d.unidad] = { estado: e, id: d.id, nombre: nomVis(d) };
    });
    // Los dados de baja siguen en el dibujo (atenuados) para poder tocarlos y reactivarlos
    st.deudores.filter(d => !d.activo && !est[d.unidad]).forEach(d => { est[d.unidad] = { estado: 'falta', id: d.id, nombre: nomVis(d) }; });
    return { b, nombre, rem, banco, ef, efCob, est, ds };
  }

  function fachada(est) {
    const C = { hecho: ['#e2c995', '#f3e3bf'], listo: ['rgba(212,181,126,.14)', '#d4b57e'], pendiente: ['#b4505c', '#e7a0a8'], falta: ['rgba(255,255,255,.035)', 'rgba(255,255,255,.3)'] };
    const txt = e => e === 'hecho' ? '#13223a' : e === 'pendiente' ? '#fff' : 'rgba(255,255,255,.78)';
    const g = 'rgba(212,181,126,';
    let s = '<svg class="fachada" viewBox="0 0 320 262" role="img" aria-label="Fachada del edificio con el estado de cada vivienda y local">' +
      '<defs><filter id="brillo" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
      '<rect x="14" y="10" width="292" height="9" rx="1.5" fill="' + g + '.10)" stroke="' + g + '.6)"/>' +
      '<rect x="24" y="19" width="272" height="178" fill="rgba(255,255,255,.025)" stroke="' + g + '.35)"/>' +
      '<path d="M24 78h272M24 137h272" stroke="' + g + '.16)"/>' +
      '<rect x="18" y="197" width="284" height="54" fill="rgba(255,255,255,.05)" stroke="' + g + '.45)"/>' +
      '<path d="M8 251.5h304" stroke="' + g + '.6)" stroke-width="1.5"/>';
    const cols = { C: 69, B: 160, A: 251 };
    let k = 0;
    const win = (u, inner) => {
      const e = est[u]; if (!e) return '';
      const d = (k++) * 65;
      return '<g class="win" data-act="editar" data-id="' + e.id + '" style="animation-delay:' + d + 'ms"><title>' + esc(u + (e.nombre ? ' — ' + e.nombre : '')) + '</title>' + inner(e) + '</g>';
    };
    // Insignia de cargo (P / V) en la ventana o local del presidente y del vicepresidente
    const insignia = (id, x, y) => {
      const l = id && id === st.config.presidenteId ? 'P' : id && id === st.config.vicepresidenteId ? 'V' : '';
      return l ? '<circle cx="' + x + '" cy="' + y + '" r="8" fill="#13223a" stroke="#e2c995" stroke-width="1.4"/><text x="' + x + '" y="' + (y + 4) + '" text-anchor="middle" font-family="-apple-system, Helvetica, Arial, sans-serif" font-size="10" font-weight="700" fill="#e2c995">' + l + '</text>' : '';
    };
    // Nombre del local en el escaparate: una o dos líneas que caben en 56 px
    const escaparate = (t, cx, col) => {
      const ancho = (str, fs) => str.length * fs * 0.66;
      let lineas = [t];
      if (ancho(t, 10.5) > 56 && t.includes(' ')) {
        const p = t.split(' '); let mejor = null;
        for (let i = 1; i < p.length; i++) { const a = p.slice(0, i).join(' '), b = p.slice(i).join(' '), m = Math.max(a.length, b.length); if (!mejor || m < mejor.m) mejor = { m, l: [a, b] }; }
        lineas = mejor.l;
      }
      const larga = Math.max(...lineas.map(l => l.length));
      const fs = Math.max(6, Math.min(lineas.length > 1 ? 10 : 11.5, 56 / (larga * 0.66)));
      const y0 = lineas.length > 1 ? 226 : 232;
      return lineas.map((l, i) => '<text x="' + cx + '" y="' + (y0 + i * (fs + 2)) + '" text-anchor="middle" font-family="-apple-system, Helvetica, Arial, sans-serif" font-size="' + fs.toFixed(2) + '" font-weight="700" fill="' + col + '">' + esc(l) + '</text>').join('');
    };
    // Bajos: Local 1, Local 2, portal, Local 3
    const huecos = { L1: 53, L2: 124, L3: 267 };
    ['L1', 'L2', 'L3'].forEach(u => {
      const cx = huecos[u];
      s += win(u, e => {
        const c = C[e.estado];
        const rot = String(e.nombre || '').trim().toLocaleUpperCase('es-ES');
        return '<rect x="' + (cx - 33) + '" y="200" width="66" height="9" rx="1.5" fill="#d4b57e"/>' +
          '<text x="' + cx + '" y="207" text-anchor="middle" font-family="-apple-system, Helvetica, Arial, sans-serif" font-size="6.6" font-weight="700" letter-spacing=".6" fill="#13223a">LOCAL ' + u.slice(1) + '</text>' +
          '<rect class="v" x="' + (cx - 31) + '" y="211" width="62" height="34" rx="2" fill="' + c[0] + '" stroke="' + c[1] + '"' + (e.estado === 'falta' ? ' stroke-dasharray="3 3"' : '') + (e.estado === 'hecho' ? ' filter="url(#brillo)"' : '') + '/>' +
          escaparate(rot || 'LOCAL ' + u.slice(1), cx, txt(e.estado)) +
          insignia(e.id, cx + 29, 212);
      });
    });
    // Portal del edificio: al tocarlo se elige la junta
    const px = 196, falta = !st.config.presidente || !st.config.vicepresidente;
    s += '<g class="portal' + (falta ? ' llama' : '') + '" data-act="cargos"><title>Portal: elegir presidente y vicepresidente</title>' +
      '<rect x="' + (px - 30) + '" y="199" width="60" height="52" fill="transparent"/>' +
      '<rect x="' + (px - 7) + '" y="201" width="14" height="9" rx="1.5" fill="#e2c995"/><text x="' + px + '" y="208.6" text-anchor="middle" font-family="-apple-system, Helvetica, Arial, sans-serif" font-size="8" font-weight="700" fill="#13223a">5</text>' +
      '<path d="M' + (px - 19) + ' 251V224a19 11 0 0 1 38 0V251" fill="#0b1526" stroke="#d4b57e" stroke-width="1.4"/>' +
      '<path d="M' + px + ' 214v37M' + (px - 13) + ' 226h9M' + (px + 4) + ' 226h9M' + (px - 13) + ' 238h9M' + (px + 4) + ' 238h9" stroke="' + g + '.35)"/>' +
      '<circle class="pomo" cx="' + (px - 3.5) + '" cy="233" r="1.8" fill="#e2c995"/><circle class="pomo" cx="' + (px + 3.5) + '" cy="233" r="1.8" fill="#e2c995"/>' +
      '</g>';
    // Plantas 1 a 3, de abajo arriba
    [1, 2, 3].forEach(f => {
      const top = 19 + (3 - f) * 59 + 9;
      ['C', 'B', 'A'].forEach(L => {
        const cx = cols[L];
        s += win(f + L, e => {
          const c = C[e.estado];
          let bal = '<rect x="' + (cx - 31) + '" y="' + (top + 37) + '" width="62" height="9" fill="none" stroke="' + g + '.45)"/>';
          for (let j = 1; j < 6; j++) bal += '<path d="M' + (cx - 31 + j * 10.3) + ' ' + (top + 37) + 'v9" stroke="' + g + '.3)"/>';
          return '<rect class="v" x="' + (cx - 24) + '" y="' + top + '" width="48" height="35" rx="2" fill="' + c[0] + '" stroke="' + c[1] + '"' +
            (e.estado === 'falta' ? ' stroke-dasharray="3 3"' : '') + (e.estado === 'hecho' ? ' filter="url(#brillo)"' : '') + '/>' +
            '<path d="M' + cx + ' ' + top + 'v35" stroke="' + (e.estado === 'hecho' ? 'rgba(19,34,58,.22)' : g + '.22)') + '"/>' +
            '<text x="' + cx + '" y="' + (top + 22) + '" text-anchor="middle" font-family="-apple-system, Helvetica, Arial, sans-serif" font-size="14" font-weight="600" fill="' + txt(e.estado) + '">' + f + L + '</text>' + bal + insignia(e.id, cx + 22, top + 2);
        });
      });
    });
    return s + '</svg>';
  }

  function graficoHistorial() {
    const rs = st.remesas.slice().sort((a, b) => a.fechaCobro.localeCompare(b.fechaCobro)).slice(-6);
    if (!rs.length) return '<div class="empty">' + ico('grafico') + 'Cuando generes la primera remesa verás aquí la recaudación de cada bimestre.</div>';
    const W = 320, H = 178, top = 24, base = 140, n = rs.length;
    const tot = rs.map(r => { const bco = r.items.reduce((s, i) => s + i.importe, 0), ef = (r.efectivo || []).reduce((s, e) => s + e.importe, 0); return { r, bco, ef, t: bco + ef }; });
    const max = Math.max(...tot.map(x => x.t), 1), slot = (W - 16) / n, bw = Math.min(34, slot * 0.5);
    let s = '<svg class="grafico" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Recaudación por bimestre">' +
      '<path d="M8 ' + (base + .5) + 'H' + (W - 8) + '" stroke="var(--line)"/>';
    tot.forEach((x, i) => {
      const cx = 8 + slot * i + slot / 2, hb = (base - top) * x.bco / max, he = (base - top) * x.ef / max, partes = x.r.nombre.split('-');
      const d = 'style="animation-delay:' + (i * 90) + 'ms"';
      s += '<g class="col" ' + d + '>' +
        (hb ? '<rect x="' + (cx - bw / 2) + '" y="' + (base - hb) + '" width="' + bw + '" height="' + hb + '" rx="3" fill="var(--banco)"/>' : '') +
        (he ? '<rect x="' + (cx - bw / 2) + '" y="' + (base - hb - he) + '" width="' + bw + '" height="' + he + '" rx="3" fill="var(--gold)"/>' : '') + '</g>' +
        '<text x="' + cx + '" y="' + (base - hb - he - 7) + '" text-anchor="middle" font-size="11.5" font-weight="600" fill="var(--ink)" font-family="-apple-system, Helvetica, Arial, sans-serif">' + eurC(x.t) + '</text>' +
        '<text x="' + cx + '" y="' + (base + 17) + '" text-anchor="middle" font-size="11" fill="var(--muted)">' + partes[0].charAt(0) + partes[0].slice(1).toLowerCase() + '–' + partes[1].charAt(0) + partes[1].slice(1).toLowerCase() + '</text>' +
        '<text x="' + cx + '" y="' + (base + 31) + '" text-anchor="middle" font-size="10" fill="var(--muted)">' + partes[2] + '</text>';
    });
    return s + '</svg><div class="leyenda" style="color:var(--muted)"><span><i style="background:var(--banco)"></i>Banco</span><span><i style="background:var(--gold)"></i>Efectivo</span></div>';
  }

  function vistaPanel() {
    const E = estadoBimestre(), b = E.b, fc = fechaCobro(), m1 = S.MESES[b.idx * 2], m2 = S.MESES[b.idx * 2 + 1];
    const hoy = S.aDate(S.hoyIso()), dias = Math.round((S.aDate(fc) - hoy) / 86400000);
    const fcD = S.aDate(fc), cuando = 'Cobro el ' + diaSemana(fc) + ' 10 de ' + S.MESES[fcD.getMonth()].toLowerCase() + ' de ' + fcD.getFullYear();
    const cuenta = dias > 0 ? '<b>' + dias + '</b><span>' + (dias === 1 ? 'día' : 'días') + '<br>al cobro</span>' : dias === 0 ? '<b>Hoy</b><span>día de cobro</span>' : '<b>' + (-dias) + '</b><span>días desde el cobro</span>';
    const total = E.banco + E.ef, efPend = E.ef - E.efCob;
    const pct = v => total ? (v / total * 100).toFixed(2) + '%' : '0';
    const nOk = E.ds.filter(d => esEf(d) ? !!d.nombre : d.nombre && S.ibanValido(d.iban)).length;
    return '' +
      '<section class="hero"><div class="htop"><div><div class="per">Remesa ' + esc(E.nombre) + '</div>' +
      '<h2>' + m1 + ' y ' + m2.toLowerCase() + '</h2></div>' +
      '<div class="cuenta">' + cuenta + '</div></div><div class="cuando">' + cuando + '</div>' +
      fachada(E.est) +
      '<div class="leyenda"><span><i style="background:#e2c995"></i>' + (E.rem ? 'En remesa o pagado' : 'Remesado o pagado') + '</span><span><i style="border:1px solid #d4b57e;background:rgba(212,181,126,.14)"></i>Listo</span>' +
      '<span><i style="background:#b4505c"></i>Efectivo pendiente</span><span><i style="border:1px dashed rgba(255,255,255,.4)"></i>Faltan datos</span></div>' +
      '<div class="pista">' + ico('vecinos') + 'Toca el portal para elegir presidente y vicepresidente</div>' +
      '<div class="sum"><div><span>Banco</span><b>' + S.eur(E.banco) + '</b></div><div><span>Efectivo</span><b>' + S.eur(E.ef) + '</b></div><div><span>Total</span><b>' + S.eur(total) + '</b></div></div>' +
      '</section>' +

      '<div class="acciones">' +
      '<button class="accion ancha" data-act="foto">' + ico('camara') + '<div><b>Leer importes de una foto</b><span>Haz una foto al documento de totales y la app rellena la remesa</span></div></button>' +
      '<button class="accion" data-act="ir" data-tab="remesa">' + ico('remesa') + '<b>' + (E.rem ? 'Revisar la remesa' : 'Preparar la remesa') + '</b><span>' + (E.rem ? 'Generada el ' + fmtFecha(E.rem.fechaGen) : 'Importes y ficheros') + '</span></button>' +
      '<button class="accion" data-act="efectivoActual">' + ico('efectivo') + '<b>Cobros en efectivo</b><span>' + (E.rem ? (efPend ? S.eur(efPend) + ' pendientes' : 'Todo cobrado') : 'Tras generar la remesa') + '</span></button>' +
      '<button class="accion" data-act="ir" data-tab="deudores">' + ico('vecinos') + '<b>Vecinos y locales</b><span>' + nOk + ' de ' + E.ds.length + ' con datos completos</span></button>' +
      '<button class="accion" data-act="exportar">' + ico('escudo') + '<b>Copia de seguridad</b><span>Guardar en Archivos</span></button>' +
      '</div>' +

      '<div class="card"><h2>' + ico('panel') + 'Reparto del bimestre<span class="h2r">' + (E.rem ? 'Remesa generada' : 'Previsión') + '</span></h2>' +
      (total ? '<div class="barra"><i style="width:' + pct(E.banco) + ';background:var(--banco)"></i><i style="width:' + pct(E.efCob) + ';background:var(--gold);animation-delay:.15s"></i><i style="width:' + pct(efPend) + ';background:var(--err);animation-delay:.3s"></i></div>' +
        '<div class="reparto"><div><i style="background:var(--banco)"></i><div><span>Domiciliado en banco</span><b>' + S.eur(E.banco) + '</b></div></div>' +
        '<div><i style="background:var(--gold)"></i><div><span>Efectivo cobrado</span><b>' + S.eur(E.efCob) + '</b></div></div>' +
        '<div><i style="background:var(--err)"></i><div><span>Efectivo pendiente</span><b>' + S.eur(efPend) + '</b></div></div>' +
        '<div><i style="background:var(--ink)"></i><div><span>Total del bimestre</span><b>' + S.eur(total) + '</b></div></div></div>'
        : '<div class="empty" style="padding:10px">Aún no hay importes para este bimestre.<div class="btns"><button class="btn oro" data-act="ir" data-tab="remesa">' + ico('remesa') + 'Poner importes</button></div></div>') +
      '</div>' +

      '<div class="card"><h2>' + ico('grafico') + 'Recaudación por bimestre</h2>' + graficoHistorial() + '</div>';
  }


  /* ---------- Lector de fotos ---------- */
  let lectura = null;
  function dlgProgreso(p, t) {
    const bar = $('#ocrBar'), tx = $('#ocrTxt');
    if (bar) bar.style.width = Math.round(p * 100) + '%';
    if (tx) tx.textContent = t + (p > 0.25 && p < 1 ? ' ' + Math.round(p * 100) + ' %' : '');
  }
  let fotoActual = null;
  async function procesarFoto(file) {
    if (fotoActual && fotoActual.url) URL.revokeObjectURL(fotoActual.url);
    const url = URL.createObjectURL(file);
    const docId = await guardarDoc(nombreActual(), file, 'Foto ' + new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }), 'foto');
    fotoActual = { file, url, docId };
    elegirLectura();
  }
  function elegirLectura() {
    abrir('<div class="card"><h2>' + ico('escanear') + 'Leer la hoja<span class="h2r">' + esc(nombreActual()) + '</span></h2>' +
      '<img class="foto" src="' + fotoActual.url + '" alt="Foto de la hoja">' +
      '<div class="muted" style="margin-bottom:6px">Foto guardada en Documentos. Elige cómo leerla:</div>' +
      '<button class="accion" style="width:100%;flex-direction:row;align-items:center;gap:12px;margin-bottom:10px" data-act="leerVivo">' + ico('escanear') +
      '<div><b>Texto en vivo del iPhone</b><span>Recomendado para la hoja escrita a mano. Lee mucho mejor las cifras.</span></div></button>' +
      '<button class="accion" style="width:100%;flex-direction:row;align-items:center;gap:12px" data-act="leerAuto">' + ico('camara') +
      '<div><b>Lector automático</b><span>Para documentos impresos. Con letra a mano suele fallar.</span></div></button>' +
      '<div class="btns"><button class="btn sec" data-act="cerrar">Cerrar</button></div></div>');
  }
  function dlgPegar() {
    abrir('<div class="card"><h2>' + ico('escanear') + 'Texto en vivo</h2>' +
      '<ol style="margin:0 0 10px;padding-left:20px;line-height:1.55;font-size:14.5px">' +
      '<li>Mantén el dedo sobre el texto de la foto de abajo (o ábrela en la app Fotos).</li>' +
      '<li>Toca <b>Seleccionar todo</b> y después <b>Copiar</b>.</li>' +
      '<li>Vuelve aquí y pulsa <b>Pegar</b>, o mantén el dedo en el cuadro y elige Pegar.</li></ol>' +
      '<img class="foto" src="' + fotoActual.url + '" alt="Foto de la hoja" style="max-height:none;object-fit:contain">' +
      '<textarea id="txtPegado" rows="7" placeholder="Aquí aparecerá el texto de la hoja" style="width:100%;font:14px/1.4 ui-monospace,Menlo,monospace;color:var(--ink);background:var(--input);border:1px solid var(--line);border-radius:12px;padding:10px"></textarea>' +
      '<div class="btns"><button class="btn sec" data-act="pegarClip">' + ico('fichero') + 'Pegar</button><button class="btn oro" data-act="analizarPegado">' + ico('check') + 'Analizar</button></div>' +
      '<div class="btns" style="margin-top:8px"><button class="btn sec" data-act="elegirLectura">Volver</button></div></div>');
  }
  function analizarTexto(texto) {
    const res = window.OCR.analizar(texto, st.deudores.filter(d => d.activo));
    const valores = {};
    res.filas.forEach(f => { valores[f.deudorId] = f.importe; });
    lectura = { res, foto: fotoActual.url, valores, texto, docId: fotoActual.docId };
    revisionFoto();
  }
  async function leerAuto() {
    abrir('<div class="card"><h2>' + ico('escanear') + 'Leyendo la foto</h2><img class="foto escaneando" src="' + fotoActual.url + '" alt="">' +
      '<div class="prog"><i id="ocrBar"></i></div><div class="muted" id="ocrTxt">Preparando la foto</div>' +
      '<p class="muted">La lectura se hace en este iPhone. La primera vez descarga el lector de texto (unos 10 MB).</p></div>');
    try {
      analizarTexto(await window.OCR.leer(fotoActual.file, dlgProgreso));
    } catch (e) {
      const sinRed = /conexi|network|fetch|load/i.test(e.message || '');
      abrir('<div class="card"><h2>' + ico('aviso') + 'No se pudo leer la foto</h2><div class="alert err">' + ico('aviso') + '<span>' +
        (sinRed ? 'Hace falta conexión a internet para descargar el lector de texto la primera vez. Conéctate y vuelve a intentarlo, o usa Texto en vivo.' : 'Error al leer: ' + esc(e.message || e)) +
        '</span></div><div class="btns"><button class="btn oro" data-act="leerVivo">' + ico('escanear') + 'Usar Texto en vivo</button><button class="btn sec" data-act="cerrar">Cerrar</button></div></div>');
    }
  }
  function sumaLectura() { return Object.values(lectura.valores).reduce((s, v) => s + (v > 0 ? v : 0), 0); }
  // Importes del listado del banco (remesa del Historial con el mismo nombre), para contrastar la lectura
  function refBanco() {
    const r = st.remesas.find(x => x.nombre === nombreActual()); if (!r) return null;
    const m = {}; r.items.concat(r.efectivo || []).forEach(i => { if (i.importe > 0) m[i.deudorId] = i.importe; });
    return { nombre: r.nombre, m, importado: !!r.importado };
  }
  function marcaRef(id) {
    const ref = refBanco(); if (!ref || ref.m[id] == null) return '';
    const v = lectura.valores[id], ok = v === ref.m[id];
    return '<span style="color:' + (ok ? 'var(--ok)' : 'var(--err)') + '">' + (ok ? '✓ ' : '≠ ') + (ref.importado ? 'Banco ' : 'Remesa ') + S.eur(ref.m[id]) + '</span>';
  }
  function cuadreRef() {
    const ref = refBanco(); if (!ref) return '';
    const ids = Object.keys(ref.m), ok = ids.filter(id => lectura.valores[id] === ref.m[id]).length;
    return '<div class="alert ' + (ok === ids.length ? 'ok' : 'warn') + '">' + ico(ok === ids.length ? 'check' : 'info') + '<span>Comparado con ' +
      (ref.importado ? 'el listado del banco' : 'la remesa generada') + ' de ' + esc(ref.nombre) + ': <b>' + ok + ' de ' + ids.length + '</b> importes coinciden.</span></div>';
  }
  function cuadre() {
    return cuadreDoc() + cuadreRef();
  }
  function cuadreDoc() {
    const t = lectura.res.totalDoc, suma = sumaLectura();
    const ef = st.deudores.filter(d => esEf(d)).reduce((a, d) => a + (lectura.valores[d.id] > 0 ? lectura.valores[d.id] : 0), 0);
    if (t != null && t !== suma && ef && t === suma - ef)
      return '<div class="alert ok">' + ico('check') + '<span>Los domiciliados suman <b>' + S.eur(t) + '</b>, igual que el total de la hoja. El efectivo (' + S.eur(ef) + ') va aparte.</span></div>';
    if (t == null) return '<div class="alert warn">' + ico('info') + '<span>No se ha encontrado una línea de total en el documento. Suma leída: <b>' + S.eur(suma) + '</b>.</span></div>';
    return t === suma
      ? '<div class="alert ok">' + ico('check') + '<span>La suma leída cuadra con el total del documento: <b>' + S.eur(t) + '</b>.</span></div>'
      : '<div class="alert warn">' + ico('aviso') + '<span>La suma leída (<b>' + S.eur(suma) + '</b>) no coincide con el total del documento (<b>' + S.eur(t) + '</b>). Diferencia: ' + S.eur(Math.abs(t - suma)) + '. Revisa los importes.</span></div>';
  }
  function revisionFoto() {
    const L = lectura, ds = ordenados().filter(d => d.activo);
    const porId = {}; L.res.filas.forEach(f => { porId[f.deudorId] = f; });
    const encontrados = ds.filter(d => porId[d.id] && porId[d.id].importe != null).length;
    const filas = ds.map(d => {
      const f = porId[d.id] || {}, v = L.valores[d.id];
      const chip = f.importe == null ? '<span class="chip errc">No encontrado</span>' :
        (f.verificado ? '<span class="chip okc">Cuadra la suma</span>' : f.corregido ? '<span class="chip frst">Corregido con la suma</span>' :
         f.por === 'total' ? '<span class="chip frst">Calculado con el total</span>' : f.calculado ? '<span class="chip frst">Calculado, revísalo</span>' : f.alt != null ? '<span class="chip errc">Suma: ' + S.eur(f.alt) + '</span>' : '<span class="chip okc">Leído</span>') +
        (f.por === 'orden' ? ' <span class="chip ef">Por orden</span>' : f.por === 'nombre' ? ' <span class="chip ef">Por nombre</span>' : '') + (f.repetido ? ' <span class="chip frst">Repetido</span>' : '');
      return '<div class="item"><div class="unit' + (d.tipo === 'local' ? ' local' : '') + '">' + esc(corto(d)) + '</div>' +
        '<div class="grow"><div class="name">' + esc(nomVis(d) || etiqueta(d)) + '</div><div>' + chip + (esEf(d) ? ' <span class="chip ef">Efectivo</span>' : '') + '</div>' +
        (f.linea ? '<div class="muted linea">' + esc(f.linea) + '</div>' : '') + '<div class="muted" id="ref_' + d.id + '">' + marcaRef(d.id) + '</div></div>' +
        '<input class="amount" inputmode="decimal" placeholder="0,00 €" data-ocr="' + d.id + '" value="' + (v > 0 ? centAStr(v) : '') + '"></div>';
    }).join('');
    const opts = '<option value="">Asignar a…</option>' + ds.map(d => '<option value="' + d.id + '">' + esc(etiqueta(d) + (d.nombre ? ', ' + d.nombre : '')) + '</option>').join('');
    const sueltas = L.res.sueltas.length ? '<h2 style="margin-top:18px">' + ico('info') + 'Importes sin asignar</h2>' +
      L.res.sueltas.map((x, i) => '<div class="item"><div class="grow"><b>' + S.eur(x.importe) + '</b><div class="muted linea">' + esc(x.linea) + '</div></div>' +
        '<select data-asig="' + i + '" style="width:150px;flex:none">' + opts + '</select></div>').join('') : '';
    abrir('<div class="card"><h2>' + ico('escanear') + 'Importes leídos<span class="h2r">' + encontrados + ' de ' + ds.length + '</span></h2>' +
      '<img class="foto" src="' + L.foto + '" alt="Foto del documento">' +
      '<div id="ocrCuadre">' + cuadre() + '</div>' + filas +
      '<div class="tot"><span class="muted">Suma leída</span><span class="big" id="ocrSuma">' + S.eur(sumaLectura()) + '</span></div>' +
      sueltas +
      '<details class="texto"><summary>Ver el texto leído</summary><pre>' + esc(L.texto) + '</pre></details>' +
      '<div class="btns"><button class="btn oro" data-act="ocrAplicar">' + ico('check') + 'Aplicar a la remesa</button></div>' +
      '<div class="btns" style="margin-top:8px"><button class="btn sec" data-act="leerVivo">' + ico('escanear') + 'Texto en vivo</button><button class="btn sec" data-act="foto">' + ico('camara') + 'Otra foto</button></div>' +
      '<div class="btns" style="margin-top:8px"><button class="btn sec" data-act="cerrar">Cancelar</button></div></div>');
  }
  function aplicarLectura() {
    const b = borrador(); let n = 0;
    Object.entries(lectura.valores).forEach(([id, v]) => { if (v > 0) { b.importes[id] = centAStr(v); b.excluir[id] = false; n++; } });
    b.lectura = { fecha: new Date().toISOString(), valores: Object.assign({}, lectura.valores), totalDoc: lectura.res.totalDoc, docId: lectura.docId };
    guardar(); cerrar(); tab = 'remesa'; render(); window.scrollTo(0, 0);
    toast('Importes aplicados a ' + n + (n === 1 ? ' vecino' : ' vecinos'));
  }


  /* ---------- Junta: presidente y vicepresidente ---------- */
  function dlgCargos() {
    const c = st.config, ds = ordenados();
    const campo = (k, t) => {
      const opts = '<option value="">Sin vivienda asignada</option>' + ds.map(d => '<option value="' + d.id + '"' + (c[k + 'Id'] === d.id ? ' selected' : '') + '>' +
        esc(etiqueta(d) + (d.nombre ? ', ' + d.nombre : '')) + '</option>').join('');
      return '<label>' + t + '</label><select data-cargo="' + k + '">' + opts + '</select>' +
        '<input id="nom_' + k + '" style="margin-top:8px" value="' + esc(c[k] || '') + '" placeholder="Nombre que se muestra" autocomplete="off">';
    };
    abrir('<div class="card"><h2>' + ico('vecinos') + 'Junta de la comunidad</h2>' +
      '<p class="muted" style="margin-top:0">Elige la vivienda o el local de cada cargo y escribe el nombre como quieras que aparezca en la cabecera.</p>' +
      campo('presidente', 'Presidente') + campo('vicepresidente', 'Vicepresidente') +
      '<div class="btns"><button class="btn oro" data-act="guardarCargos">' + ico('check') + 'Guardar junta</button><button class="btn sec" data-act="cerrar">Cancelar</button></div></div>');
  }
  function guardarCargos() {
    ['presidente', 'vicepresidente'].forEach(k => {
      st.config[k + 'Id'] = document.querySelector('[data-cargo="' + k + '"]').value;
      st.config[k] = $('#nom_' + k).value.trim();
    });
    guardar(); cerrar(); render(); toast('Junta guardada');
  }
  function cabeceraJunta() {
    const c = st.config, uni = id => { const d = st.deudores.find(x => x.id === id); return d ? ' <i>' + esc(corto(d)) + '</i>' : ''; };
    const item = (t, k) => '<span>' + t + ' <b>' + (c[k] ? esc(c[k]) : 'sin elegir') + '</b>' + (c[k] ? uni(c[k + 'Id']) : '') + '</span>';
    return item('Presidente', 'presidente') + item('Vicepresidente', 'vicepresidente');
  }


  /* ---------- Documentos (PDF y fotos) guardados en el iPhone ---------- */
  const DB = (() => {
    let p = null;
    const abrirDB = () => p || (p = new Promise((ok, ko) => {
      const r = indexedDB.open('adeudosRY5_docs', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('docs', { keyPath: 'id' });
      r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error);
    }));
    const tx = (modo, fn) => abrirDB().then(db => new Promise((ok, ko) => {
      const t = db.transaction('docs', modo), st = t.objectStore('docs'), q = fn(st);
      t.oncomplete = () => ok(q && q.result); t.onerror = () => ko(t.error);
    }));
    return { put: d => tx('readwrite', s => s.put(d)), all: () => tx('readonly', s => s.getAll()), del: id => tx('readwrite', s => s.delete(id)) };
  })();
  let docIdx = {};
  async function refrescarDocs() {
    try { const all = await DB.all(); docIdx = {}; all.forEach(d => { docIdx[d.remesa] = (docIdx[d.remesa] || 0) + 1; }); } catch (e) {}
  }
  async function guardarDoc(remesa, blob, nombre, tipo, preview) {
    const d = { id: uid(), remesa, tipo, nombre, mime: blob.type || (tipo === 'pdf' ? 'application/pdf' : 'image/jpeg'), fecha: new Date().toISOString(), blob, preview: preview || null };
    try { await DB.put(d); await refrescarDocs(); return d.id; } catch (e) { toast('No se pudo guardar el documento'); return null; }
  }
  let docDestino = null, docsAbiertos = [];
  async function dlgDocs(remesa) {
    const all = (await DB.all().catch(() => [])).filter(d => d.remesa === remesa).sort((a, b) => b.fecha.localeCompare(a.fecha));
    docsAbiertos.forEach(d => d.url && URL.revokeObjectURL(d.url));
    docsAbiertos = all.map(d => Object.assign({}, d, { url: URL.createObjectURL(d.blob), purl: d.preview ? URL.createObjectURL(d.preview) : null }));
    abrir('<div class="card"><h2>' + ico('fichero') + 'Documentos<span class="h2r">' + esc(remesa) + '</span></h2>' +
      (docsAbiertos.length ? docsAbiertos.map((d, i) =>
        '<div class="file">' + (d.tipo === 'foto' ? '<img class="mini" src="' + d.url + '" alt="">' :
          '<div class="fico">' + ico('fichero') + '<b>' + (d.tipo === 'pdf' ? 'PDF' : 'DOC') + '</b></div>') +
        '<div class="grow"><div class="name" style="font-size:15px">' + esc(d.nombre) + '</div><div class="muted">' + (d.tipo === 'foto' ? 'Foto' : 'Listado') + ', ' + fmtFecha(d.fecha.slice(0, 10)) + '</div></div>' +
        '<button class="btn sec sm" data-act="docVer" data-i="' + i + '" aria-label="Ver">' + ico('escanear') + '</button>' +
        '<button class="btn sec sm" data-act="docBajar" data-i="' + i + '" aria-label="Descargar">' + ico('bajar') + '</button>' +
        '<button class="btn danger sm" data-act="docBorrar" data-i="' + i + '" aria-label="Borrar">×</button></div>').join('')
        : '<div class="empty">' + ico('fichero') + 'Aún no hay documentos de esta remesa.</div>') +
      '<div class="btns"><button class="btn oro" data-act="docAnadir" data-rem="' + esc(remesa) + '">' + ico('mas') + 'Añadir PDF o foto</button><button class="btn sec" data-act="cerrar">Cerrar</button></div>' +
      '<p class="muted">Se guardan solo en este iPhone. No van incluidos en la copia de seguridad.</p></div>');
  }
  function verDoc(d) {
    const img = u => '<img src="' + u + '" alt="" style="width:100%;border-radius:12px;border:1px solid var(--line);background:#fff">';
    const cuerpo = d.tipo === 'foto' || /^image\//.test(d.mime) ? img(d.url) : d.purl ? img(d.purl)
      : '<iframe src="' + d.url + '#view=FitH" title="' + esc(d.nombre) + '" style="width:100%;height:62vh;border:1px solid var(--line);border-radius:12px;background:#fff"></iframe>';
    abrir('<div class="card"><h2>' + ico('fichero') + esc(d.nombre) + '</h2>' + cuerpo +
      '<div class="btns"><button class="btn oro" data-act="docBajar" data-i="' + docsAbiertos.indexOf(d) + '">' + ico('compartir') + 'Abrir</button><button class="btn sec" data-act="docVolver" data-rem="' + esc(d.remesa) + '">Volver</button></div></div>');
  }

  /* ---------- Importar listado del banco (remesa ya cobrada) ---------- */
  let paquete = null;
  const claveN = x => S.limpiar(x || '').toUpperCase().replace(/[^A-Z ]/g, ' ').replace(/\s+/g, ' ').trim();
  function sugerir(o) {
    const n = claveN(o.nombre), toks = n.split(' ').filter(t => t.length >= 3);
    let best = null;
    st.deudores.forEach(d => {
      let sc = 0;
      if (d.iban && S.normIban(d.iban) === S.normIban(o.iban)) sc = 100;
      [d.nombre, d.rotulo].concat(d.id === st.config.presidenteId ? [st.config.presidente] : []).concat(d.id === st.config.vicepresidenteId ? [st.config.vicepresidente] : [])
        .filter(Boolean).forEach(x => {
          const k = claveN(x); if (!k) return;
          if (k === n) sc = Math.max(sc, 90);
          const kt = k.split(' '), hits = toks.filter(t => kt.includes(t)).length;
          if (hits >= 2) sc = Math.max(sc, 60 + hits);
          else if (hits === 1 && kt.length === 1) sc = Math.max(sc, 30);
        });
      if (sc && (!best || sc > best.sc)) best = { sc, id: d.id };
    });
    return best ? best.id : '';
  }
  function dlgPaquete() {
    const P = paquete, ords = P.remesa.ordenes, ds = ordenados();
    const opts = sel => '<option value="">Elegir piso o local…</option>' + ds.map(d => '<option value="' + d.id + '"' + (sel === d.id ? ' selected' : '') + '>' +
      esc(etiqueta(d) + (nomVis(d) ? ', ' + nomVis(d) : '')) + '</option>').join('');
    const usados = {}; P.asig.forEach(id => { if (id) usados[id] = (usados[id] || 0) + 1; });
    const total = ords.reduce((s, o) => s + o.importe, 0), sinAsig = P.asig.filter(x => !x).length, dup = Object.values(usados).some(v => v > 1);
    abrir('<div class="card"><h2>' + ico('banco' in I ? 'banco' : 'panel') + 'Listado del banco<span class="h2r">' + esc(P.remesa.nombre) + '</span></h2>' +
      '<div class="muted">' + ords.length + ' órdenes, ' + S.eur(total) + ', cobro el ' + fmtFecha(P.remesa.fechaCobro) + '</div>' +
      '<div class="alert ok">' + ico('info') + '<span>Indica a qué piso o local corresponde cada deudor. Se guardará su titular y su cuenta, la remesa quedará en el Historial con el PDF, y sus importes se copiarán a la remesa en preparación.</span></div>' +
      ords.map((o, i) => '<div class="item" style="flex-wrap:wrap"><div class="grow" style="min-width:60%"><div class="name">' + esc(o.nombre) + '</div><div class="muted">Cuenta ···' + esc(o.iban.slice(-4)) + '</div></div>' +
        '<b style="font-size:16px">' + S.eur(o.importe) + '</b>' +
        '<select data-paq="' + i + '" style="width:100%;margin-top:6px' + (P.asig[i] && usados[P.asig[i]] > 1 ? ';border-color:var(--err)' : '') + '">' + opts(P.asig[i]) + '</select></div>').join('') +
      (P.config ? '<label class="check" style="border-top:1px solid var(--line);margin-top:6px"><input type="checkbox" id="paqCfg" checked><span>Guardar los datos de la comunidad del listado<br><span class="muted">Emisor ' + esc(P.config.nombre || '') + ', NIF ' + esc(P.config.nif || '') + ', Id Acreedor ' + esc(P.config.idAcreedor || '') + '</span></span></label>' : '') +
      (dup ? '<div class="alert err">' + ico('aviso') + '<span>Hay pisos o locales asignados a más de un deudor.</span></div>' : '') +
      (sinAsig ? '<div class="alert warn">' + ico('aviso') + '<span>Faltan ' + sinAsig + ' por asignar.</span></div>' : '') +
      '<div class="btns"><button class="btn oro" data-act="paqAplicar"' + (sinAsig || dup ? ' disabled style="opacity:.5"' : '') + '>' + ico('check') + 'Importar</button><button class="btn sec" data-act="cerrar">Cancelar</button></div></div>');
  }
  function itemDe(d, nombreRem, importe) {
    const c = st.config, lab = etiqueta(d);
    return { deudorId: d.id, unidad: d.unidad, ref: nombreRem + '-' + corto(d), mandato: d.mandato, fechaMandato: d.fechaMandato,
      seq: 'RCUR', importe, nombre: d.nombre, nif: d.nif, org: d.tipo === 'local' && /^[A-HJ-NP-SUVW]/i.test(d.nif || ''),
      iban: S.normIban(d.iban), bic: (d.bic || S.bicDeIban(d.iban) || '').toUpperCase(),
      concepto: (c.concepto || '').replace('{PERIODO}', nombreRem).replace('{UNIDAD}', lab),
      d1: c.direccion + ' ' + lab, d2: c.cp + ' ' + c.localidad, d3: c.provincia };
  }
  async function aplicarPaquete() {
    const P = paquete, R = P.remesa, c = st.config;
    if (st.remesas.some(x => x.nombre === R.nombre) && !confirm('Ya hay una remesa ' + R.nombre + ' en el Historial. ¿Sustituirla por la del listado?')) return;
    if (P.config && $('#paqCfg') && $('#paqCfg').checked) ['nombre', 'nif', 'idAcreedor', 'contrato'].forEach(k => { if (P.config[k]) c[k] = P.config[k]; });
    const items = [], b = borrador();
    R.ordenes.forEach((o, i) => {
      const d = st.deudores.find(x => x.id === P.asig[i]);
      d.nombre = o.nombre; d.iban = S.normIban(o.iban); d.bic = S.bicDeIban(o.iban) || d.bic || '';
      if (o.nif) d.nif = o.nif;
      d.pago = 'domiciliado'; d.previos = true; d.activo = true;
      items.push(itemDe(d, R.nombre, o.importe));
      if (!S.parseImporte(b.importes[d.id])) { b.importes[d.id] = centAStr(o.importe); b.excluir[d.id] = false; }
    });
    st.remesas = st.remesas.filter(x => x.nombre !== R.nombre);
    st.remesas.push({ id: uid(), generado: new Date().toISOString(), importado: true, formatos: { core: true, c1914: true, b2b: false, c1944: false },
      nombre: R.nombre, fechaGen: R.fechaGen, fechaCobro: R.fechaCobro,
      efectivo: (R.efectivo || []).map(e => { const d = st.deudores.find(x => x.unidad === e.unidad); if (!d) return null;
        if (!b.importes[d.id]) b.importes[d.id] = centAStr(e.importe);
        return { deudorId: d.id, unidad: d.unidad, nombre: nomVis(d) || etiqueta(d), etiqueta: etiqueta(d), importe: e.importe, cobrado: !!e.cobrado, fechaPago: e.cobrado ? R.fechaCobro : '' }; }).filter(Boolean),
      acreedor: { nombre: c.nombre, id: idAcr(), iban: S.normIban(c.iban), bic: (c.bic || '').toUpperCase(), d1: c.direccion, d2: c.cp + ' ' + c.localidad, d3: c.provincia, pais: 'ES' }, items });
    guardar();
    if (P.documento && P.documento.base64) {
      const bin = atob(P.documento.base64), u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const b64 = x => { const t = atob(x), a = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) a[i] = t.charCodeAt(i); return a; };
      const prev = P.documento.preview ? new Blob([b64(P.documento.preview)], { type: 'image/png' }) : null;
      await guardarDoc(R.nombre, new Blob([u8], { type: P.documento.mime || 'application/pdf' }), P.documento.nombre || (R.nombre + '.pdf'), 'pdf', prev);
    }
    cerrar(); tab = 'historial'; render(); window.scrollTo(0, 0);
    toast(R.nombre + ' importada: ' + items.length + ' deudores');
  }
  function leerPaquete(file) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const P = JSON.parse(r.result);
        if (P.tipo !== 'remesa-banco' || !P.remesa || !Array.isArray(P.remesa.ordenes)) throw new Error('formato');
        paquete = P; P.asig = [];
        P.remesa.ordenes.forEach((o, i) => {
          const fijo = o.unidad && st.deudores.find(d => d.unidad === o.unidad);
          const id = fijo ? fijo.id : sugerir(o); P.asig[i] = P.asig.includes(id) ? '' : id;
        });
        dlgPaquete();
      } catch (e) { alert('Este fichero no es un listado del banco preparado para la app.'); }
    };
    r.readAsText(file);
  }

  /* ---------- Pestaña Remesa ---------- */
  function vistaRemesa() {
    const b = borrador(), nombre = nombreActual(), fc = fechaCobro();
    const ds = ordenados().filter(d => d.activo && !esEf(d));
    const efs = ordenados().filter(d => d.activo && esEf(d));
    let total = 0, n = 0, totEf = 0;
    const filas = ds.map(d => {
      const ex = !!b.excluir[d.id], imp = S.parseImporte(b.importes[d.id]);
      if (!ex && imp > 0) { total += imp; n++; }
      const seq = secuencia(d, nombre), falta = !d.nombre || !S.ibanValido(d.iban);
      return '<div class="item" style="' + (ex ? 'opacity:.45' : '') + '">' +
        '<input type="checkbox" data-incl="' + d.id + '"' + (ex ? '' : ' checked') + ' aria-label="Incluir">' +
        '<div class="unit' + (d.tipo === 'local' ? ' local' : '') + '">' + esc(corto(d)) + '</div>' +
        '<div class="grow"><div class="name">' + (d.nombre ? esc(d.nombre) : '<span class="muted">Sin titular</span>') + '</div>' +
        '<div class="muted"><span class="chip ' + seq.toLowerCase() + '">' + seq + '</span> ' +
        (falta ? '<span style="color:var(--err)">Faltan datos</span>' : '···' + esc(S.normIban(d.iban).slice(-4))) + '</div></div>' +
        '<input class="amount" inputmode="decimal" placeholder="0,00 €" data-imp="' + d.id + '" value="' + esc(b.importes[d.id] || '') + '"' + (ex ? ' disabled' : '') + '>' +
        '</div>';
    }).join('');
    const filasEf = efs.map(d => {
      const imp = S.parseImporte(b.importes[d.id]); if (imp > 0) totEf += imp;
      return '<div class="item"><div class="unit' + (d.tipo === 'local' ? ' local' : '') + '">' + esc(corto(d)) + '</div>' +
        '<div class="grow"><div class="name">' + esc(nomVis(d) || etiqueta(d)) + '</div><div class="muted"><span class="chip ef">EFECTIVO</span></div></div>' +
        '<input class="amount" inputmode="decimal" placeholder="0,00 €" data-imp="' + d.id + '" value="' + esc(b.importes[d.id] || '') + '"></div>';
    }).join('');
    const per = S.BIMESTRES.map((t, i) => '<option value="' + i + '"' + (i === b.idx ? ' selected' : '') + '>' + t + '</option>').join('');
    const meses = opcionesMesCobro().map(o => '<option value="' + o.v + '"' + (o.v === b.mesCobro ? ' selected' : '') + '>10 de ' + o.t + '</option>').join('');
    const fm = b.formatos;
    const chk = (k, t, s) => '<label class="check"><input type="checkbox" data-fmt="' + k + '"' + (fm[k] ? ' checked' : '') + '><span>' + t + '<br><span class="muted">' + s + '</span></span></label>';
    return '' +
      '<div class="card"><h2>' + ico('calendario') + 'Remesa del bimestre</h2><div class="big">' + esc(nombre) + '</div>' +
      '<div class="muted">Cobro el ' + diaSemana(fc) + ' ' + fmtFecha(fc) + '</div>' +
      '<label>Fecha de generación</label><input type="date" data-b="fechaGen" value="' + esc(b.fechaGen) + '">' +
      '<div class="row"><div><label>Bimestre</label><select data-b="idx">' + per + '</select></div>' +
      '<div><label>Año</label><input type="number" inputmode="numeric" data-b="anio" value="' + b.anio + '"></div></div>' +
      '<label>Fecha de cobro (siempre día 10)</label><select data-b="mesCobro">' + meses + '</select>' +
      '<div class="btns"><button class="btn danger sm" style="width:100%" data-act="borrarBorrador">' + ico('aviso') + 'Borrar los datos introducidos</button></div></div>' +

      '<div class="card foto-card"><div class="grow"><h2 style="margin-bottom:4px">' + ico('fichero') + 'Documentos</h2><div class="muted">' +
      (docIdx[nombre] ? docIdx[nombre] + ' guardados de ' + esc(nombre) : 'Fotos y listados de ' + esc(nombre)) + (b.lectura ? ', foto leída el ' + fmtFecha(b.lectura.fecha.slice(0, 10)) : '') + '</div></div>' +
      '<button class="btn sec sm" data-act="docs" data-rem="' + esc(nombre) + '">Ver</button></div>' +
      '<div class="card foto-card"><div class="grow"><h2 style="margin-bottom:4px">' + ico('escanear') + 'Leer importes de una foto</h2>' +
      '<div class="muted">Fotografía el documento con los totales de cada vecino y revisa lo leído antes de aplicarlo.</div></div>' +
      '<button class="btn oro sm" data-act="foto">' + ico('camara') + 'Foto</button></div>' +
      '<div class="card"><h2>' + ico('panel') + 'Domiciliados en banco</h2>' + (filas || '<div class="empty">No hay deudores domiciliados activos.</div>') +
      '<div class="tot"><span class="muted" id="nRem">' + n + ' adeudos</span><span class="big" style="font-size:22px" id="totRem">' + S.eur(total) + '</span></div>' +
      '<div class="btns"><button class="btn sec sm" data-act="copiarUltima">Copiar importes de la última remesa</button>' +
      '<button class="btn sec sm" data-act="mismoImporte">Mismo importe a todos</button></div></div>' +
      (efs.length ? '<div class="card"><h2>' + ico('efectivo') + 'Cobros en efectivo</h2>' + filasEf +
        '<div class="tot"><span class="muted">No van en el fichero del banco</span><span class="big" style="font-size:22px" id="totEf">' + S.eur(totEf) + '</span></div>' +
        '<p class="muted">Se guardan con la remesa; en Historial puedes marcar cuándo los ha pagado cada local.</p></div>' : '') +

      '<div class="card"><h2>' + ico('fichero') + 'Ficheros a generar</h2>' +
      chk('core', 'XML SEPA · esquema CORE', 'pain.008.001.02 — el recomendado') +
      chk('c1914', 'Cuaderno 19.14 · CORE', 'Fichero plano AEB, 600 posiciones') +
      chk('b2b', 'XML SEPA · esquema B2B', 'Solo empresas/autónomos con contrato B2B') +
      chk('c1944', 'Cuaderno 19.44 · B2B', 'Fichero plano AEB, 600 posiciones') +
      '<div class="btns"><button class="btn oro" data-act="generar">' + ico('sello') + 'Generar ' + esc(nombre) + '</button></div></div>';
  }

  let forzar = false;
  function generar() {
    const r = construir();
    const L = borrador().lectura;
    if (!r.errores.length && L && !forzar) {
      const dif = [];
      r.remesa.items.concat(r.efectivo.filter(e => e.importe)).forEach(i => {
        const v = L.valores[i.deudorId];
        if (v != null && v !== i.importe) dif.push(etiqueta(st.deudores.find(d => d.id === i.deudorId)) + ': foto ' + S.eur(v) + ', remesa ' + S.eur(i.importe));
        if (v == null) dif.push(etiqueta(st.deudores.find(d => d.id === i.deudorId)) + ': no aparece en la foto');
      });
      L.dif = dif.length;
      if (dif.length) {
        abrir('<div class="card"><h2>' + ico('aviso') + 'No cuadra con la foto</h2><div class="muted">Foto leída el ' + fmtFecha(L.fecha.slice(0, 10)) + '</div>' +
          '<div class="alert warn">' + ico('aviso') + '<ul>' + dif.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></div>' +
          '<div class="btns"><button class="btn sec" data-act="cerrar">Revisar importes</button><button class="btn oro" data-act="generarForzar">Generar igualmente</button></div></div>');
        return;
      }
    }
    forzar = false;
    if (!r.errores.length) r.avisos.unshift(!L ? 'No hay foto del documento de este bimestre: los importes no se han comprobado con él.' :
      L.dif ? 'Generada con ' + L.dif + (L.dif === 1 ? ' diferencia' : ' diferencias') + ' respecto a la foto del documento del ' + fmtFecha(L.fecha.slice(0, 10)) + '.' :
      'Importes comprobados con la foto del documento del ' + fmtFecha(L.fecha.slice(0, 10)) + '.');
    if (r.errores.length) {
      abrir('<div class="card"><h2>' + ico('aviso') + 'Revisa antes de generar</h2><div class="alert err">' + ico('aviso') + '<ul>' + r.errores.map(e => '<li>' + esc(e) + '</li>').join('') + '</ul></div>' +
        (r.avisos.length ? '<div class="alert warn">' + ico('info') + '<ul>' + r.avisos.map(e => '<li>' + esc(e) + '</li>').join('') + '</ul></div>' : '') +
        '<div class="btns"><button class="btn" data-act="cerrar">Entendido</button></div></div>');
      return;
    }
    const existe = st.remesas.find(x => x.nombre === r.remesa.nombre);
    if (existe && !confirm('Ya existe la remesa ' + r.remesa.nombre + '. ¿Sustituirla por esta?')) return;
    const b = borrador();
    let files;
    try { files = ficheros(r.remesa, b.formatos); } catch (e) { alert('Error al generar: ' + e.message); return; }
    st.remesas = st.remesas.filter(x => x.nombre !== r.remesa.nombre);
    st.remesas.push(Object.assign({ id: uid(), generado: new Date().toISOString(), formatos: Object.assign({}, b.formatos), efectivo: r.efectivo }, r.remesa));
    guardar();
    mostrarFicheros(st.remesas[st.remesas.length - 1], files, r.avisos);
    render();
  }

  let ultimosFicheros = [];
  function mostrarFicheros(rem, files, avisos) {
    ultimosFicheros = files;
    const total = rem.items.reduce((s, i) => s + i.importe, 0);
    abrir('<div class="card"><h2>' + ico('sello') + 'Ficheros listos</h2><div class="big">' + esc(rem.nombre) + '</div>' +
      '<div class="muted">' + rem.items.length + ' adeudos · ' + S.eur(total) + ' · cobro ' + fmtFecha(rem.fechaCobro) + '</div>' +
      ((rem.efectivo || []).some(e => e.importe) ? '<div class="muted">Efectivo aparte (locales): ' + S.eur(rem.efectivo.reduce((s, e) => s + e.importe, 0)) + '</div>' : '') +
      (avisos && avisos.length ? '<div class="alert warn">' + ico('info') + '<ul>' + avisos.map(e => '<li>' + esc(e) + '</li>').join('') + '</ul></div>' : '') +
      '<div style="margin-top:10px">' + files.map((f, i) =>
        '<div class="file"><div class="fico' + (/\.txt$/.test(f.name) ? ' txt' : '') + '">' + ico('fichero') + '<b>' + (/\.txt$/.test(f.name) ? 'TXT' : 'XML') + '</b></div>' +
        '<div class="grow"><div class="name" style="font-size:15px">' + esc(f.name) + '</div><div class="muted">' + esc(f.etiqueta) + '</div></div>' +
        '<button class="btn sec sm" data-act="compartir1" data-i="' + i + '" aria-label="Compartir ' + esc(f.name) + '">' + ico('compartir') + '</button>' +
        '<button class="btn sec sm" data-act="bajar1" data-i="' + i + '" aria-label="Descargar ' + esc(f.name) + '">' + ico('bajar') + '</button></div>').join('') + '</div>' +
      '<div class="alert ok">' + ico('info') + '<span>Súbelo en la banca online del Santander, en la opción de importar remesas de adeudos. Si te deja elegir, usa el .xml CORE.</span></div>' +
      '<div class="btns"><button class="btn oro" data-act="compartirTodos">' + ico('bajar') + 'Guardar en Archivos</button><button class="btn sec" data-act="cerrar">Cerrar</button></div></div>');
  }

  /* ---------- Pestaña Deudores ---------- */
  function vistaDeudores() {
    const fila = d => {
      const ok = esEf(d) ? !!nomVis(d) : d.nombre && S.ibanValido(d.iban);
      const estado = !d.activo ? '<span class="chip">Baja</span>' : !ok ? '<span class="chip errc">Faltan datos</span>' :
        esEf(d) ? '<span class="chip ef">Efectivo</span>' : '<span class="chip okc">Domiciliado</span>';
      return '<div class="item" data-act="editar" data-id="' + d.id + '" style="cursor:pointer;' + (d.activo ? '' : 'opacity:.5') + '">' +
        '<div class="unit' + (d.tipo === 'local' ? ' local' : '') + '">' + esc(corto(d)) + '</div>' +
        '<div class="grow"><div class="name">' + (nomVis(d) ? esc(nomVis(d)) : '<span class="muted" style="font-size:15px">Sin titular</span>') + '</div>' +
        (d.tipo === 'local' && d.nombre && d.nombre !== d.rotulo ? '<div class="muted">Titular: ' + esc(d.nombre) + '</div>' : '') +
        '<div class="muted">' + (esEf(d) ? 'Paga en efectivo' : d.iban ? 'Cuenta ···' + esc(S.normIban(d.iban).slice(-4)) : 'Sin cuenta') + (d.nif ? ', ' + esc(d.nif) : '') + '</div></div>' +
        estado + '<span style="color:var(--muted);width:16px;flex:none">' + ico('flecha') + '</span></div>';
    };
    const ds = ordenados(), pisos = ds.filter(d => d.tipo !== 'local'), locs = ds.filter(d => d.tipo === 'local');
    const cnt = l => l.filter(d => esEf(d) ? !!nomVis(d) : d.nombre && S.ibanValido(d.iban)).length + ' de ' + l.length + ' completos';
    return '<div class="card"><h2>' + ico('vecinos') + 'Viviendas<span class="h2r">' + cnt(pisos) + '</span></h2>' + (pisos.map(fila).join('') || '<div class="empty">No hay viviendas.</div>') + '</div>' +
      '<div class="card"><h2>' + ico('efectivo') + 'Locales comerciales<span class="h2r">' + cnt(locs) + '</span></h2>' + (locs.map(fila).join('') || '<div class="empty">No hay locales.</div>') + '</div>' +
      '<div class="btns" style="margin-top:0"><button class="btn" data-act="nuevo">' + ico('mas') + 'Añadir vecino o local</button></div>' +
      '<p class="muted" style="text-align:center;margin-top:14px">Los DNI y las cuentas se guardan solo en este iPhone.</p>';
  }

  function formDeudor(d) {
    const nuevo = !d;
    d = d || deudorBase('', 'piso', '', st.deudores.length);
    abrir('<div class="card"><h2>' + ico('vecinos') + (nuevo ? 'Nuevo vecino o local' : esc(etiqueta(d))) + '</h2><form id="fd" data-id="' + (nuevo ? '' : d.id) + '">' +
      (!nuevo && esBase(d) ?
        '<input type="hidden" name="tipo" value="' + d.tipo + '"><input type="hidden" name="unidad" value="' + esc(d.unidad) + '">' +
        '<div class="item" style="border:0;padding:4px 0 0"><div class="unit' + (d.tipo === 'local' ? ' local' : '') + '">' + esc(corto(d)) + '</div><div class="grow"><b>' + esc(etiqueta(d)) + '</b><div class="muted">' + (d.tipo === 'local' ? 'Local' : 'Vivienda') + ' del edificio: su número no se cambia</div></div></div>' :
      '<div class="row"><div><label>Tipo</label><select name="tipo"><option value="piso"' + (d.tipo === 'piso' ? ' selected' : '') + '>Piso</option><option value="local"' + (d.tipo === 'local' ? ' selected' : '') + '>Local</option></select></div>' +
      '<div><label>Piso / nº local</label><input name="unidad" value="' + esc(d.tipo === 'local' ? d.unidad.replace(/^L/, '') : d.unidad) + '" placeholder="1A ó 1" autocapitalize="characters"></div></div>') +
      '<label>Forma de pago</label><select name="pago"><option value="domiciliado"' + (!esEf(d) ? ' selected' : '') + '>Domiciliado en banco (va en la remesa)</option>' +
      '<option value="efectivo"' + (esEf(d) ? ' selected' : '') + '>Efectivo (no va en el fichero)</option></select>' +
      (d.tipo === 'local' || nuevo ? '<div id="campoRotulo"' + (d.tipo === 'local' ? '' : ' hidden') + '><label>Nombre del local (rótulo)</label><input name="rotulo" value="' + esc(d.rotulo || '') + '" placeholder="Ej.: DEPORTES GÁLVEZ" autocomplete="off"></div>' : '') +
      '<label>' + (d.tipo === 'local' ? 'Titular (persona o empresa que paga)' : 'Nombre del titular') + '</label><input name="nombre" value="' + esc(d.nombre) + '" autocomplete="off">' +
      '<label>DNI / NIE / NIF</label><input name="nif" value="' + esc(d.nif) + '" autocapitalize="characters" autocomplete="off">' +
      '<div id="bancoCampos"' + (esEf(d) ? ' hidden' : '') + '>' +
      '<label>IBAN de cargo</label><input name="iban" class="mono" value="' + esc(S.fmtIban(d.iban)) + '" placeholder="ES00 0000 0000 0000 0000 0000" autocapitalize="characters" autocomplete="off">' +
      '<div id="ibanMsg" class="muted"></div>' +
      '<label>BIC del banco (opcional, se rellena solo)</label><input name="bic" value="' + esc(d.bic) + '" autocapitalize="characters">' +
      '<div class="row"><div><label>Ref. mandato</label><input name="mandato" value="' + esc(d.mandato) + '" autocapitalize="characters"></div>' +
      '<div><label>Firma mandato</label><input type="date" name="fechaMandato" value="' + esc(d.fechaMandato) + '"></div></div>' +
      '<p class="muted">Si ya se le cobraba por domiciliación antes, deja la referencia y fecha que use el banco. 31/10/2009 es la fecha estándar de las domiciliaciones migradas a SEPA.</p>' +
      '<label class="check"><input type="checkbox" name="previos"' + (d.previos ? ' checked' : '') + '><span>Ya tuvo cobros domiciliados antes (usar RCUR)</span></label></div>' +
      '<label class="check"><input type="checkbox" name="activo"' + (d.activo ? ' checked' : '') + '><span>Activo en las remesas</span></label>' +
      '<div class="btns"><button type="submit" class="btn">Guardar</button><button type="button" class="btn sec" data-act="cerrar">Cancelar</button></div>' +
      (nuevo ? '' : esBase(d) ? '<p class="muted">Para que no entre en las remesas, desmarca «Activo en las remesas»: seguirá en el dibujo, atenuado.</p>' :
        '<div class="btns"><button type="button" class="btn danger" data-act="borrarDeudor" data-id="' + d.id + '">Eliminar</button></div>') +
      '</form></div>');
    revisarIban();
  }
  function revisarIban() {
    const f = $('#fd'); if (!f) return;
    const v = S.normIban(f.iban.value), m = $('#ibanMsg');
    if (!v) { m.textContent = ''; return; }
    const ok = S.ibanValido(v);
    m.innerHTML = ok ? '<span style="color:var(--ok)">IBAN correcto</span>' + (S.bicDeIban(v) ? ' · ' + S.bicDeIban(v) : '') : '<span style="color:var(--err)">IBAN no válido</span>';
  }
  function guardarDeudor(f) {
    const id = f.dataset.id, tipo = f.tipo.value;
    const unidad = normUnidad(tipo, f.unidad.value);
    if (!unidad) { alert(tipo === 'local' ? 'Indica el número del local (por ejemplo 1).' : 'Indica el piso (por ejemplo 1A).'); return; }
    if (st.deudores.some(x => x.unidad === unidad && x.id !== id)) { alert('Ya existe un deudor para ' + unidad + '.'); return; }
    const iban = S.normIban(f.iban.value);
    if (f.pago.value !== 'efectivo' && iban && !S.ibanValido(iban) && !confirm('El IBAN no es válido. ¿Guardar de todos modos?')) return;
    const nif = f.nif.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (nif && !S.validarNif(nif).ok && !confirm('El DNI/NIF no parece correcto. ¿Guardar de todos modos?')) return;
    const datos = { pago: f.pago.value, tipo, unidad, nombre: f.nombre.value.trim(), rotulo: tipo === 'local' && f.rotulo ? f.rotulo.value.trim() : '', nif, iban, bic: f.bic.value.toUpperCase().replace(/[^A-Z0-9]/g, '') || S.bicDeIban(iban),
      mandato: S.limpiar(f.mandato.value).toUpperCase() || ('RY5-' + unidad), fechaMandato: f.fechaMandato.value, previos: f.previos.checked, activo: f.activo.checked };
    if (id) Object.assign(st.deudores.find(x => x.id === id), datos);
    else st.deudores.push(Object.assign(deudorBase(unidad, tipo, '', st.deudores.length), datos));
    guardar(); cerrar(); render(); toast('Deudor guardado');
  }

  /* ---------- Pestaña Historial ---------- */
  function vistaHistorial() {
    const rs = st.remesas.slice().sort((a, b) => b.fechaCobro.localeCompare(a.fechaCobro));
    if (!rs.length) return '<div class="card"><h2>' + ico('historial') + 'Historial</h2><div class="empty">' + ico('historial') + 'Aún no has generado ninguna remesa. Prepárala en la pestaña Remesa o importa el listado de una remesa ya cobrada.<div class="btns"><button class="btn oro" data-act="paqImp">' + ico('bajar') + 'Importar listado del banco</button></div></div></div>';
    return '<div class="card"><h2>' + ico('historial') + 'Historial<button class="btn sec sm" style="margin-left:auto" data-act="paqImp">' + ico('bajar') + 'Importar listado</button></h2>' + rs.map(r => {
      const t = r.items.reduce((s, i) => s + i.importe, 0);
      const ef = (r.efectivo || []).filter(e => e.importe > 0), pend = ef.filter(e => !e.cobrado);
      return '<div class="item"><div class="grow"><div class="name">' + esc(r.nombre) + '</div>' +
        '<div class="muted">Cobro ' + fmtFecha(r.fechaCobro) + ' · generada ' + fmtFecha(r.fechaGen) + ' · ' + r.items.length + ' adeudos</div>' +
        '<div style="font-weight:700">Banco ' + S.eur(t) + (ef.length ? ' · Efectivo ' + S.eur(ef.reduce((s, e) => s + e.importe, 0)) : '') + '</div>' +
        (ef.length ? '<div class="muted" style="color:' + (pend.length ? 'var(--warn)' : 'var(--ok)') + '">' +
          (pend.length ? 'Efectivo pendiente: ' + pend.map(e => esc(e.etiqueta)).join(', ') + ' (' + S.eur(pend.reduce((s, e) => s + e.importe, 0)) + ')' : 'Efectivo cobrado completo') + '</div>' : '') +
        (r.importado ? '<div class="muted">Importada del listado del banco</div>' : '') +
        '<div class="btns" style="margin-top:6px"><button class="btn sec sm" data-act="histFich" data-id="' + r.id + '">Ficheros</button>' +
        '<button class="btn sec sm" data-act="docs" data-rem="' + esc(r.nombre) + '">Documentos' + (docIdx[r.nombre] ? ' (' + docIdx[r.nombre] + ')' : '') + '</button>' +
        '<button class="btn sec sm" data-act="histDetalle" data-id="' + r.id + '">' + (ef.length ? 'Detalle y efectivo' : 'Detalle') + '</button>' +
        '<button class="btn sec sm" data-act="histUsar" data-id="' + r.id + '">Usar importes</button>' +
        '<button class="btn danger sm" data-act="histBorrar" data-id="' + r.id + '">Borrar</button></div></div></div>';
    }).join('') + '</div>';
  }
  function detalle(r) {
    abrir('<div class="card"><h2>' + esc(r.nombre) + '</h2><div class="muted">Cobro ' + fmtFecha(r.fechaCobro) + '</div>' +
      r.items.map(i => '<div class="item"><div class="unit">' + esc(i.unidad) + '</div><div class="grow"><div class="name">' + esc(i.nombre) +
        '</div><div class="muted"><span class="chip ' + i.seq.toLowerCase() + '">' + i.seq + '</span> ···' + esc(i.iban.slice(-4)) + '</div></div><b>' + S.eur(i.importe) + '</b></div>').join('') +
      '<div class="tot"><span class="muted">Total banco</span><span class="big" style="font-size:22px">' + S.eur(r.items.reduce((s, i) => s + i.importe, 0)) + '</span></div>' +
      ((r.efectivo || []).some(e => e.importe) ? '<h2 style="margin-top:18px">Efectivo</h2>' + r.efectivo.filter(e => e.importe).map(e =>
        '<div class="item"><input type="checkbox" data-efc="' + r.id + '|' + e.deudorId + '"' + (e.cobrado ? ' checked' : '') + ' aria-label="Cobrado">' +
        '<div class="unit local">' + esc(e.unidad) + '</div><div class="grow"><div class="name">' + esc(e.nombre) + '</div><div class="muted">' +
        (e.cobrado ? '<span style="color:var(--ok)">Cobrado ' + fmtFecha(e.fechaPago) + '</span>' : '<span style="color:var(--warn)">Pendiente</span>') + '</div></div><b>' + S.eur(e.importe) + '</b></div>').join('') +
        '<p class="muted">Marca la casilla cuando el local entregue el efectivo.</p>' : '') +
      '<div class="btns"><button class="btn sec" data-act="cerrar">Cerrar</button></div></div>');
  }

  /* ---------- Pestaña Ajustes ---------- */
  function vistaAjustes() {
    const c = st.config, id = idAcr(), ibanOk = S.ibanValido(c.iban), nifR = c.nif ? S.validarNif(c.nif) : null;
    const f = (k, t, extra) => '<label>' + t + '</label><input data-cfg="' + k + '" value="' + esc(c[k]) + '"' + (extra || '') + '>';
    const iban = S.normIban(c.iban);
    return '<div class="card"><h2>' + ico('panel') + 'Comunidad</h2>' +
      f('nombre', 'Nombre de la comunidad') +
      f('nif', 'NIF de la comunidad', ' autocapitalize="characters" placeholder="H12345678"') +
      (nifR ? '<div class="muted" style="color:' + (nifR.ok ? 'var(--ok)' : 'var(--err)') + '">' + (nifR.ok ? 'NIF correcto' : 'NIF no válido') + '</div>' : '') +
      f('presidente', 'Presidente') + f('vicepresidente', 'Vicepresidente') +
      f('direccion', 'Dirección') +
      '<div class="row"><div>' + f('cp', 'C. postal', ' inputmode="numeric"') + '</div><div>' + f('localidad', 'Localidad') + '</div></div>' +
      f('provincia', 'Provincia') + '</div>' +

      '<div class="card"><h2>' + ico('escudo') + 'Cuenta en el Santander</h2>' +
      f('iban', 'IBAN de la comunidad', ' class="mono" autocapitalize="characters"') +
      (iban ? '<div class="muted" style="color:' + (ibanOk ? 'var(--ok)' : 'var(--err)') + '">' + (ibanOk ? 'IBAN correcto · entidad ' + iban.slice(4, 8) + ' · oficina ' + iban.slice(8, 12) : 'IBAN no válido') + '</div>' : '') +
      f('bic', 'BIC', ' autocapitalize="characters"') +
      (iban && iban.startsWith('ES') && iban.length !== 24 ? '<div class="alert warn">' + ico('aviso') + '<span>Un IBAN español tiene 24 caracteres y este tiene ' + iban.length + '.' +
        (S.normIban(c.contrato) === iban ? ' Coincide con el nº de contrato de remesas, que no es la cuenta.' : '') + ' Cópialo del extracto o de la app del banco.</span></div>' : '') +
      f('idAcreedor', 'Id Acreedor (asignado por el Santander)', ' class="mono" autocapitalize="characters" placeholder="ES00000H00000000"') +
      (c.idAcreedor && c.nif && idAcrCalc() !== id ? '<div class="muted" style="color:var(--warn)">No coincide con el calculado a partir del NIF (' + esc(idAcrCalc()) + '). Se usará el del banco.</div>' :
        c.idAcreedor ? '<div class="muted" style="color:var(--ok)">Se usa en todos los ficheros de remesa.</div>' : '<div class="muted">Si lo dejas vacío se calcula del NIF: ' + esc(idAcrCalc() || '—') + '</div>') +
      f('contrato', 'Contrato de remesas', ' class="mono" autocapitalize="characters"') +
      (c.idAcreedor ? '' : f('sufijo', 'Sufijo del acreedor (normalmente 000)', ' inputmode="numeric" maxlength="3"')) + '</div>' +

      '<div class="card"><h2>' + ico('remesa') + 'Remesas</h2>' +
      f('concepto', 'Concepto del recibo') +
      '<p class="muted">{PERIODO} se sustituye por p. ej. NOV-DIC-2026 y {UNIDAD} por PISO 1A / LOCAL 2.</p>' +
      '<label>Tipo de adeudo</label><select data-cfg="modoSeq"><option value="auto"' + (c.modoSeq === 'auto' ? ' selected' : '') + '>Automático: FRST el primero, luego RCUR</option>' +
      '<option value="rcur"' + (c.modoSeq === 'rcur' ? ' selected' : '') + '>Siempre RCUR (recurrente)</option></select></div>' +

      '<div class="card"><h2>' + ico('historial') + 'Copia de seguridad</h2><p class="muted">Guarda una copia en Archivos/iCloud de vez en cuando: si se borra la app, se pierden los datos.</p>' +
      '<div class="btns"><button class="btn sec" data-act="exportar">Exportar copia</button><button class="btn sec" data-act="importar">Importar copia</button></div>' +
      '<div class="btns"><button class="btn sec" data-act="paqImp">' + ico('bajar') + 'Importar listado del banco</button></div>' +
      '<input type="file" id="fileImp" accept=".json,application/json" hidden>' +
      '<div class="btns"><button class="btn danger" data-act="reset">Borrar todos los datos</button></div></div>' +
      '<p class="muted" style="text-align:center">Adeudos Comunidad ' + VERSION + '</p>';
  }

  function actualizarTotal() {
    const b = borrador(); let total = 0, n = 0;
    let ef = 0;
    st.deudores.filter(d => d.activo && !esEf(d) && !b.excluir[d.id]).forEach(d => { const c = S.parseImporte(b.importes[d.id]); if (c > 0) { total += c; n++; } });
    st.deudores.filter(d => d.activo && esEf(d)).forEach(d => { const c = S.parseImporte(b.importes[d.id]); if (c > 0) ef += c; });
    const tEl = $('#totRem'), nEl = $('#nRem'), eEl = $('#totEf'); if (tEl) tEl.textContent = S.eur(total); if (nEl) nEl.textContent = n + ' adeudos'; if (eEl) eEl.textContent = S.eur(ef);
  }

  /* ---------- Render y eventos ---------- */
  let tab = 'panel';
  function render() {
    const m = $('#main');
    m.innerHTML = tab === 'panel' ? vistaPanel() : tab === 'remesa' ? vistaRemesa() : tab === 'deudores' ? vistaDeudores() : tab === 'historial' ? vistaHistorial() : vistaAjustes();
    document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    $('#ver').textContent = VERSION;
    $('#sub').textContent = st.config.direccion + ', ' + st.config.cp + ' ' + st.config.localidad;
    $('#junta').innerHTML = cabeceraJunta();
  }

  $('#nav').addEventListener('click', e => { const b = e.target.closest('button[data-tab]'); if (!b) return; tab = b.dataset.tab; render(); window.scrollTo(0, 0); });

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const a = el.dataset.act, id = el.dataset.id;
    if (a === 'cerrar') cerrar();
    else if (a === 'foto') { const i = $('#fotoImp'); i.value = ''; i.click(); }
    else if (a === 'ocrAplicar') aplicarLectura();
    else if (a === 'leerVivo') dlgPegar();
    else if (a === 'leerAuto') leerAuto();
    else if (a === 'elegirLectura') elegirLectura();
    else if (a === 'pegarClip') {
      if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(t => { $('#txtPegado').value = t; }).catch(() => toast('Mantén el dedo en el cuadro y elige Pegar'));
      else toast('Mantén el dedo en el cuadro y elige Pegar');
    } else if (a === 'analizarPegado') {
      const t = $('#txtPegado').value.trim();
      if (!t) { toast('Primero pega el texto de la hoja'); return; }
      analizarTexto(t);
    }
    else if (a === 'cargos') dlgCargos();
    else if (a === 'docs' || a === 'docVolver') dlgDocs(el.dataset.rem);
    else if (a === 'docAnadir') { docDestino = el.dataset.rem; const i = $('#docImp'); i.value = ''; i.click(); }
    else if (a === 'docVer') verDoc(docsAbiertos[+el.dataset.i]);
    else if (a === 'docBajar') { const d = docsAbiertos[+el.dataset.i]; compartirBlob(d.blob, d.nombre.replace(/[\/:]/g, '-') + (/\.\w{2,4}$/.test(d.nombre) ? '' : d.tipo === 'pdf' ? '.pdf' : '.jpg')); }
    else if (a === 'docBorrar') { const d = docsAbiertos[+el.dataset.i]; if (!confirm('¿Borrar «' + d.nombre + '»?')) return; DB.del(d.id).then(refrescarDocs).then(() => { dlgDocs(d.remesa); render(); }); }
    else if (a === 'paqImp') { const i = $('#paqImp'); i.value = ''; i.click(); }
    else if (a === 'paqAplicar') aplicarPaquete();
    else if (a === 'generarForzar') { forzar = true; cerrar(); generar(); }
    else if (a === 'borrarBorrador') {
      const n = Object.values(borrador().importes).filter(v => S.parseImporte(v) > 0).length;
      abrir('<div class="card"><h2>' + ico('aviso') + 'Borrar datos de la remesa<span class="h2r">' + esc(nombreActual()) + '</span></h2>' +
        '<p class="muted" style="margin-top:0"><b>Borrar solo los importes</b> deja a cero lo que paga cada vecino y mantiene lo demás. <b>Borrar todo</b> quita además:</p><ul style="margin:0 0 6px;padding-left:20px;line-height:1.7">' +
        '<li>Los importes de ' + n + (n === 1 ? ' vecino' : ' vecinos') + ', domiciliados y en efectivo</li><li>La fecha de generación (vuelve a hoy)</li>' +
        '<li>Los vecinos excluidos de la remesa</li><li>La lectura de la foto del documento</li></ul>' +
        '<p class="muted">Se mantienen el bimestre, la fecha de cobro, los vecinos, el Historial y las fotos guardadas en Documentos.</p>' +
        '<div class="btns"><button class="btn danger" data-act="borrarImportes">Borrar solo los importes</button></div>' +
        '<div class="btns" style="margin-top:8px"><button class="btn danger" data-act="borrarBorradorSi">Borrar todo</button><button class="btn sec" data-act="cerrar">Cancelar</button></div></div>');
    } else if (a === 'borrarImportes') {
      borrador().importes = {}; guardar(); cerrar(); render(); toast('Importes de ' + nombreActual() + ' borrados');
    } else if (a === 'borrarBorradorSi') {
      const b = borrador();
      b.fechaGen = S.hoyIso(); b.importes = {}; b.excluir = {}; delete b.lectura;
      b.formatos = { core: true, c1914: true, b2b: true, c1944: true };
      lectura = null; guardar(); cerrar(); render(); window.scrollTo(0, 0); toast('Datos de ' + nombreActual() + ' borrados');
    }
    else if (a === 'guardarCargos') guardarCargos();
    else if (a === 'ir') { cerrar(); tab = el.dataset.tab; render(); window.scrollTo(0, 0); }
    else if (a === 'efectivoActual') {
      const r = st.remesas.find(x => x.nombre === nombreActual());
      if (r && (r.efectivo || []).some(e => e.importe)) detalle(r); else toast('Genera primero la remesa del bimestre');
    }
    else if (a === 'generar') generar();
    else if (a === 'compartir1') compartir([ultimosFicheros[+el.dataset.i]]);
    else if (a === 'bajar1') descargar(ultimosFicheros[+el.dataset.i]);
    else if (a === 'compartirTodos') compartir(ultimosFicheros);
    else if (a === 'copiarUltima') {
      const u = ultimaRemesa(); if (!u) { toast('No hay remesas anteriores'); return; }
      borrador(); cargarImportes(u);
      guardar(); render(); toast('Importes de ' + u.nombre + ' copiados');
    } else if (a === 'mismoImporte') {
      const v = prompt('Importe bimensual para todos los domiciliados incluidos (€):'); if (v == null) return;
      const c = S.parseImporte(v); if (!(c > 0)) { alert('Importe no válido'); return; }
      st.deudores.filter(d => d.activo && !esEf(d) && !borrador().excluir[d.id]).forEach(d => { borrador().importes[d.id] = (c / 100).toFixed(2).replace('.', ','); });
      guardar(); render();
    } else if (a === 'editar') formDeudor(st.deudores.find(d => d.id === id));
    else if (a === 'nuevo') formDeudor(null);
    else if (a === 'borrarDeudor') {
      if (!confirm('¿Eliminar este deudor? Las remesas ya generadas no cambian.')) return;
      st.deudores = st.deudores.filter(d => d.id !== id); guardar(); cerrar(); render();
    } else if (a === 'histFich') {
      const r = st.remesas.find(x => x.id === id);
      try { mostrarFicheros(r, ficheros(r, r.formatos || { core: true, c1914: true, b2b: true, c1944: true }), []); } catch (err) { alert(err.message); }
    } else if (a === 'histDetalle') detalle(st.remesas.find(x => x.id === id));
    else if (a === 'histUsar') {
      const r = st.remesas.find(x => x.id === id);
      borrador(); cargarImportes(r);
      guardar(); tab = 'remesa'; render(); toast('Importes cargados en la remesa');
    } else if (a === 'histBorrar') {
      const r = st.remesas.find(x => x.id === id);
      if (!confirm('¿Borrar ' + r.nombre + ' del historial?')) return;
      st.remesas = st.remesas.filter(x => x.id !== id); guardar(); render();
    } else if (a === 'exportar') {
      const n = 'adeudos-ry5-copia-' + S.hoyIso() + '.json';
      compartir([{ name: n, type: 'application/json', content: JSON.stringify(st, null, 1) }]);
    } else if (a === 'importar') $('#fileImp').click();
    else if (a === 'reset') {
      if (!confirm('Se borrarán deudores, remesas y ajustes de este iPhone. ¿Continuar?')) return;
      if (!confirm('¿Seguro? Esta acción no se puede deshacer.')) return;
      st = defaults(); guardar(); render(); toast('Datos borrados');
    }
  });

  document.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'fotoImp' && t.files[0]) { procesarFoto(t.files[0]); return; }
    if (t.id === 'paqImp' && t.files[0]) { leerPaquete(t.files[0]); return; }
    if (t.id === 'docImp' && t.files[0]) {
      const f = t.files[0], tipo = /pdf/.test(f.type) || /\.pdf$/i.test(f.name) ? 'pdf' : /^image\//.test(f.type) ? 'foto' : 'otro';
      guardarDoc(docDestino, f, f.name || (tipo === 'foto' ? 'Foto' : 'Documento'), tipo).then(() => { dlgDocs(docDestino); render(); });
      return;
    }
    if (t.dataset.paq !== undefined) { paquete.asig[+t.dataset.paq] = t.value; dlgPaquete(); return; }
    if (t.dataset.cargo) {
      const d = st.deudores.find(x => x.id === t.value), inp = $('#nom_' + t.dataset.cargo);
      if (d && d.nombre && inp) inp.value = d.nombre;
      return;
    }
    if (t.dataset.asig !== undefined && t.value) {
      const x = lectura.res.sueltas[+t.dataset.asig]; lectura.valores[t.value] = x.importe;
      const inp = document.querySelector('[data-ocr="' + t.value + '"]'); if (inp) inp.value = centAStr(x.importe);
      const rm = $('#ref_' + t.value); if (rm) rm.innerHTML = marcaRef(t.value);
      $('#ocrSuma').textContent = S.eur(sumaLectura()); $('#ocrCuadre').innerHTML = cuadre(); return;
    }
    if (t.dataset.ocr) {
      const c = S.parseImporte(t.value); lectura.valores[t.dataset.ocr] = c > 0 ? c : null; t.value = c > 0 ? centAStr(c) : '';
      $('#ocrSuma').textContent = S.eur(sumaLectura()); $('#ocrCuadre').innerHTML = cuadre();
      const rm = $('#ref_' + t.dataset.ocr); if (rm) rm.innerHTML = marcaRef(t.dataset.ocr); return;
    }
    if (t.id === 'fileImp' && t.files[0]) {
      const r = new FileReader();
      r.onload = () => {
        try {
          const d = JSON.parse(r.result);
          if (!d.config || !Array.isArray(d.deudores)) throw new Error('formato');
          if (!confirm('Se sustituirán los datos actuales por los de la copia. ¿Continuar?')) return;
          st = d; st.config = Object.assign({}, defaults().config, st.config); migrar(); guardar(); render(); toast('Copia importada');
        } catch (err) { alert('El fichero no es una copia válida.'); }
      };
      r.readAsText(t.files[0]);
      return;
    }
    if (t.dataset.b) {
      const b = borrador(), k = t.dataset.b;
      if (k === 'fechaGen') {
        b.fechaGen = t.value;
        if (t.value) { const p = S.periodoDeFecha(t.value); if (p.idx !== b.idx || p.anio !== b.anio) { b.idx = p.idx; b.anio = p.anio; b.mesCobro = mesIso(p.anio, p.idx * 2); } }
      } else if (k === 'idx' || k === 'anio') {
        b[k] = parseInt(t.value, 10) || (k === 'anio' ? new Date().getFullYear() : 0);
        b.mesCobro = mesIso(b.anio, b.idx * 2);
      } else b[k] = t.value;
      guardar(); render();
    } else if (t.dataset.fmt) { borrador().formatos[t.dataset.fmt] = t.checked; guardar(); }
    else if (t.dataset.efc) {
      const [rid, did] = t.dataset.efc.split('|'), r = st.remesas.find(x => x.id === rid);
      const e = r.efectivo.find(x => x.deudorId === did);
      e.cobrado = t.checked; e.fechaPago = t.checked ? S.hoyIso() : '';
      const dl = $('#dlg'), y = dl.scrollTop; guardar(); detalle(r); dl.scrollTop = y; render();
    } else if (t.form && t.form.id === 'fd' && t.name === 'tipo') { const c = $('#campoRotulo'); if (c) c.hidden = t.value !== 'local'; }
    else if (t.form && t.form.id === 'fd' && t.name === 'pago') { $('#bancoCampos').hidden = t.value === 'efectivo'; }
    else if (t.dataset.incl) { borrador().excluir[t.dataset.incl] = !t.checked; guardar(); render(); }
    else if (t.dataset.imp) {
      const c = S.parseImporte(t.value);
      if (t.value && !(c >= 0)) { toast('Importe no válido'); return; }
      borrador().importes[t.dataset.imp] = t.value ? (c / 100).toFixed(2).replace('.', ',') : '';
      t.value = borrador().importes[t.dataset.imp];
      guardar(); actualizarTotal();
    } else if (t.dataset.cfg) {
      let v = t.value;
      if (t.dataset.cfg === 'iban') v = S.normIban(v);
      if (t.dataset.cfg === 'nif' || t.dataset.cfg === 'bic' || t.dataset.cfg === 'idAcreedor' || t.dataset.cfg === 'contrato') v = v.toUpperCase().replace(/[^A-Z0-9]/g, '');
      st.config[t.dataset.cfg] = v; guardar(); render();
    }
  });

  document.addEventListener('input', e => { if (e.target.form && e.target.form.id === 'fd' && e.target.name === 'iban') revisarIban(); });
  document.addEventListener('submit', e => { if (e.target.id === 'fd') { e.preventDefault(); guardarDeudor(e.target); } });
  document.addEventListener('focusout', e => {
    const t = e.target;
    if (t.form && t.form.id === 'fd' && t.name === 'iban') {
      t.value = S.fmtIban(t.value);
      const bic = t.form.bic; if (!bic.value) bic.value = S.bicDeIban(t.value);
    }
  });

  /* ---------- Actualizar la app (código), sin tocar los datos ---------- */
  const FICHEROS_APP = ['./', 'index.html', 'app.js?v=' + VERSION.slice(1), 'sepa.js?v=' + VERSION.slice(1), 'ocr.js?v=' + VERSION.slice(1), 'app.js', 'sepa.js', 'ocr.js', 'sw.js', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
  async function actualizarApp() {
    const btn = $('#upd');
    if (!navigator.onLine) { alert('Sin conexión a internet. Conéctate y vuelve a pulsar Actualizar.'); return; }
    btn.classList.add('girando');
    try {
      const txt = await (await fetch('app.js?nc=' + Date.now(), { cache: 'no-store' })).text();
      const m = txt.match(/const VERSION = '([^']+)'/), nueva = m ? m[1] : '';
      if (nueva && nueva === VERSION && !confirm('Ya tienes la última versión (' + VERSION + ').\n¿Recargar la app de todos modos?')) { btn.classList.remove('girando'); return; }
      // Guardar los datos antes de nada (deudores, remesas y ajustes se conservan)
      guardar();
      // Descargar de nuevo todos los ficheros de la app saltándose la caché
      await Promise.all(FICHEROS_APP.map(f => fetch(f, { cache: 'reload' }).catch(() => null)));
      if ('caches' in window) { const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k))); }
      if ('serviceWorker' in navigator) { const rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map(r => r.unregister())); }
      sessionStorage.setItem('actualizadoDesde', VERSION);
      location.replace(location.pathname + '?v=' + Date.now());
    } catch (e) {
      btn.classList.remove('girando');
      alert('No se pudo actualizar: ' + e.message);
    }
  }
  $('#upd').addEventListener('click', actualizarApp);
  // Aviso automático si GitHub ya tiene una versión más nueva
  async function comprobarNueva() {
    if (!navigator.onLine) return;
    try {
      const txt = await (await fetch('app.js?nc=' + Date.now(), { cache: 'no-store' })).text();
      const m = txt.match(/const VERSION = '([^']+)'/);
      if (m && m[1] !== VERSION) { $('#upd').classList.add('nueva'); toast('Hay una versión nueva (' + m[1] + '): toca ↻'); }
    } catch (e) {}
  }
  setTimeout(comprobarNueva, 1500);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) comprobarNueva(); });
  try {
    const desde = sessionStorage.getItem('actualizadoDesde');
    if (desde) { sessionStorage.removeItem('actualizadoDesde'); history.replaceState(null, '', location.pathname); setTimeout(() => toast(desde === VERSION ? 'App recargada · ' + VERSION : 'Actualizada de ' + desde + ' a ' + VERSION), 300); }
  } catch (e) {}

  render();
  refrescarDocs().then(render);
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
