/* Adeudos Comunidad · Av. de Rafaela Ybarra, 5 — PWA local (los datos no salen del iPhone) */
(function () {
  'use strict';
  const S = window.SEPA;
  const KEY = 'adeudosRY5_v1';
  const VERSION = 'v1.1';
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /* ---------- Datos ---------- */
  function deudorBase(unidad, tipo, nombre, orden) {
    return { id: uid(), unidad, tipo, nombre: nombre || '', nif: '', iban: '', bic: '',
      mandato: 'RY5-' + unidad, fechaMandato: '2009-10-31', previos: false, activo: true, orden,
      pago: tipo === 'local' ? 'efectivo' : 'domiciliado' };
  }
  function defaults() {
    const pisos = ['1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C'];
    const d = pisos.map((p, i) => deudorBase(p, 'piso', '', i));
    d.push(deudorBase('L1', 'local', 'Deportes Gálvez', 9));
    d.push(deudorBase('L2', 'local', 'Locutorio', 10));
    d.push(deudorBase('L3', 'local', 'Alimentación', 11));
    return {
      config: {
        nombre: 'Comunidad de Propietarios Av. de Rafaela Ybarra 5', nif: '', sufijo: '000',
        iban: '', bic: 'BSCHESMMXXX', presidente: 'Marcelo',
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
  migrar();
  function migrar() {
    // v1.1: forma de pago por deudor (los locales pagan en efectivo)
    st.deudores.forEach(d => { if (!d.pago) d.pago = d.tipo === 'local' ? 'efectivo' : 'domiciliado'; });
    st.remesas.forEach(r => { if (!r.efectivo) r.efectivo = []; });
  }
  function guardar() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { toast('No se pudo guardar en el dispositivo'); } }

  function etiqueta(d) { return d.tipo === 'local' ? 'LOCAL ' + d.unidad.replace(/^L/, '') : 'PISO ' + d.unidad; }
  function corto(d) { return d.tipo === 'local' ? 'L' + d.unidad.replace(/^L/, '') : d.unidad; }
  function ordenados() { return st.deudores.slice().sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99)); }
  const esEf = d => d.pago === 'efectivo';
  const centAStr = c => (c / 100).toFixed(2).replace('.', ',');
  function idAcr() { return S.idAcreedor(st.config.nif, st.config.sufijo); }

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
      return { deudorId: d.id, unidad: d.unidad, nombre: d.nombre || etiqueta(d), etiqueta: etiqueta(d), importe: imp > 0 ? imp : 0,
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
  function compartir(lista) {
    const files = lista.map(aFile);
    if (navigator.canShare && navigator.canShare({ files })) {
      navigator.share({ files, title: lista[0].name }).catch(e => { if (e.name !== 'AbortError') toast('No se pudo compartir'); });
    } else { lista.forEach(descargar); }
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
        '<div class="grow"><div class="name">' + esc(d.nombre || etiqueta(d)) + '</div><div class="muted"><span class="chip ef">EFECTIVO</span></div></div>' +
        '<input class="amount" inputmode="decimal" placeholder="0,00 €" data-imp="' + d.id + '" value="' + esc(b.importes[d.id] || '') + '"></div>';
    }).join('');
    const per = S.BIMESTRES.map((t, i) => '<option value="' + i + '"' + (i === b.idx ? ' selected' : '') + '>' + t + '</option>').join('');
    const meses = opcionesMesCobro().map(o => '<option value="' + o.v + '"' + (o.v === b.mesCobro ? ' selected' : '') + '>10 de ' + o.t + '</option>').join('');
    const fm = b.formatos;
    const chk = (k, t, s) => '<label class="check"><input type="checkbox" data-fmt="' + k + '"' + (fm[k] ? ' checked' : '') + '><span>' + t + '<br><span class="muted">' + s + '</span></span></label>';
    return '' +
      '<div class="card"><h2>Remesa</h2><div class="big">' + esc(nombre) + '</div>' +
      '<div class="muted">Cobro el ' + diaSemana(fc) + ' ' + fmtFecha(fc) + '</div>' +
      '<label>Fecha de generación</label><input type="date" data-b="fechaGen" value="' + esc(b.fechaGen) + '">' +
      '<div class="row"><div><label>Bimestre</label><select data-b="idx">' + per + '</select></div>' +
      '<div><label>Año</label><input type="number" inputmode="numeric" data-b="anio" value="' + b.anio + '"></div></div>' +
      '<label>Fecha de cobro (siempre día 10)</label><select data-b="mesCobro">' + meses + '</select></div>' +

      '<div class="card"><h2>Domiciliados · importe bimensual</h2>' + (filas || '<div class="empty">No hay deudores domiciliados activos.</div>') +
      '<div class="tot"><span class="muted" id="nRem">' + n + ' adeudos</span><span class="big" style="font-size:22px" id="totRem">' + S.eur(total) + '</span></div>' +
      '<div class="btns"><button class="btn sec sm" data-act="copiarUltima">Copiar importes de la última remesa</button>' +
      '<button class="btn sec sm" data-act="mismoImporte">Mismo importe a todos</button></div></div>' +
      (efs.length ? '<div class="card"><h2>Cobros en efectivo</h2>' + filasEf +
        '<div class="tot"><span class="muted">No van en el fichero del banco</span><span class="big" style="font-size:22px" id="totEf">' + S.eur(totEf) + '</span></div>' +
        '<p class="muted">Se guardan con la remesa; en Historial puedes marcar cuándo los ha pagado cada local.</p></div>' : '') +

      '<div class="card"><h2>Ficheros a generar</h2>' +
      chk('core', 'XML SEPA · esquema CORE', 'pain.008.001.02 — el recomendado') +
      chk('c1914', 'Cuaderno 19.14 · CORE', 'Fichero plano AEB, 600 posiciones') +
      chk('b2b', 'XML SEPA · esquema B2B', 'Solo empresas/autónomos con contrato B2B') +
      chk('c1944', 'Cuaderno 19.44 · B2B', 'Fichero plano AEB, 600 posiciones') +
      '<div class="btns"><button class="btn" data-act="generar">Generar ' + esc(nombre) + '</button></div></div>';
  }

  function generar() {
    const r = construir();
    if (r.errores.length) {
      abrir('<div class="card"><h2>Revisa antes de generar</h2><div class="alert err"><ul>' + r.errores.map(e => '<li>' + esc(e) + '</li>').join('') + '</ul></div>' +
        (r.avisos.length ? '<div class="alert warn"><ul>' + r.avisos.map(e => '<li>' + esc(e) + '</li>').join('') + '</ul></div>' : '') +
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
    abrir('<div class="card"><h2>Ficheros listos</h2><div class="big">' + esc(rem.nombre) + '</div>' +
      '<div class="muted">' + rem.items.length + ' adeudos · ' + S.eur(total) + ' · cobro ' + fmtFecha(rem.fechaCobro) + '</div>' +
      ((rem.efectivo || []).some(e => e.importe) ? '<div class="muted">Efectivo aparte (locales): ' + S.eur(rem.efectivo.reduce((s, e) => s + e.importe, 0)) + '</div>' : '') +
      (avisos && avisos.length ? '<div class="alert warn"><ul>' + avisos.map(e => '<li>' + esc(e) + '</li>').join('') + '</ul></div>' : '') +
      '<div style="margin-top:10px">' + files.map((f, i) =>
        '<div class="file"><div class="grow"><div class="mono">' + esc(f.name) + '</div><div class="muted">' + esc(f.etiqueta) + '</div></div>' +
        '<button class="btn sec sm" data-act="compartir1" data-i="' + i + '">Compartir</button>' +
        '<button class="btn sec sm" data-act="bajar1" data-i="' + i + '">Bajar</button></div>').join('') + '</div>' +
      '<div class="alert ok">Súbelo en la banca online del Santander, en la opción de importar remesas de adeudos. Si te deja elegir, usa el .xml CORE.</div>' +
      '<div class="btns"><button class="btn" data-act="compartirTodos">Guardar todos en Archivos</button><button class="btn sec" data-act="cerrar">Cerrar</button></div></div>');
  }

  /* ---------- Pestaña Deudores ---------- */
  function vistaDeudores() {
    const filas = ordenados().map(d => {
      const ok = esEf(d) ? !!d.nombre : d.nombre && S.ibanValido(d.iban);
      return '<div class="item" data-act="editar" data-id="' + d.id + '" style="cursor:pointer;' + (d.activo ? '' : 'opacity:.5') + '">' +
        '<div class="unit' + (d.tipo === 'local' ? ' local' : '') + '">' + esc(corto(d)) + '</div>' +
        '<div class="grow"><div class="name">' + (d.nombre ? esc(d.nombre) : '<span class="muted">Sin titular</span>') + '</div>' +
        '<div class="muted">' + esc(etiqueta(d)) + (d.nif ? ' · ' + esc(d.nif) : '') + '</div>' +
        (esEf(d) ? '' : '<div class="muted mono">' + (d.iban ? esc(S.fmtIban(d.iban)) : '') + '</div>') + '</div>' +
        (esEf(d) && ok && d.activo ? '<span class="chip ef">Efectivo</span>' :
        '<span class="chip" style="' + (ok ? 'color:var(--ok)' : 'color:var(--err)') + '">' + (ok ? (d.activo ? 'Domiciliado' : 'Baja') : 'Incompleto') + '</span>') + '</div>';
    }).join('');
    return '<div class="card"><h2>Deudores (' + st.deudores.length + ')</h2>' + filas +
      '<div class="btns"><button class="btn" data-act="nuevo">Añadir deudor</button></div></div>' +
      '<p class="muted">Toca un deudor para editarlo. Los datos (DNI e IBAN) se guardan solo en este iPhone.</p>';
  }

  function formDeudor(d) {
    const nuevo = !d;
    d = d || deudorBase('', 'piso', '', st.deudores.length);
    abrir('<div class="card"><h2>' + (nuevo ? 'Nuevo deudor' : esc(etiqueta(d))) + '</h2><form id="fd" data-id="' + (nuevo ? '' : d.id) + '">' +
      '<div class="row"><div><label>Tipo</label><select name="tipo"><option value="piso"' + (d.tipo === 'piso' ? ' selected' : '') + '>Piso</option><option value="local"' + (d.tipo === 'local' ? ' selected' : '') + '>Local</option></select></div>' +
      '<div><label>Piso / nº local</label><input name="unidad" value="' + esc(d.tipo === 'local' ? d.unidad.replace(/^L/, '') : d.unidad) + '" placeholder="1A ó 1" autocapitalize="characters"></div></div>' +
      '<label>Forma de pago</label><select name="pago"><option value="domiciliado"' + (!esEf(d) ? ' selected' : '') + '>Domiciliado en banco (va en la remesa)</option>' +
      '<option value="efectivo"' + (esEf(d) ? ' selected' : '') + '>Efectivo (no va en el fichero)</option></select>' +
      '<label>Nombre (titular de la cuenta si es domiciliado)</label><input name="nombre" value="' + esc(d.nombre) + '" autocomplete="off">' +
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
      (nuevo ? '' : '<div class="btns"><button type="button" class="btn danger" data-act="borrarDeudor" data-id="' + d.id + '">Eliminar deudor</button></div>') +
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
    let unidad = S.limpiar(f.unidad.value).toUpperCase().replace(/\s/g, '');
    if (!unidad) { alert('Indica el piso o el número de local.'); return; }
    if (tipo === 'local') unidad = 'L' + unidad.replace(/^L/, '');
    if (st.deudores.some(x => x.unidad === unidad && x.id !== id)) { alert('Ya existe un deudor para ' + unidad + '.'); return; }
    const iban = S.normIban(f.iban.value);
    if (f.pago.value !== 'efectivo' && iban && !S.ibanValido(iban) && !confirm('El IBAN no es válido. ¿Guardar de todos modos?')) return;
    const nif = f.nif.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (nif && !S.validarNif(nif).ok && !confirm('El DNI/NIF no parece correcto. ¿Guardar de todos modos?')) return;
    const datos = { pago: f.pago.value, tipo, unidad, nombre: f.nombre.value.trim(), nif, iban, bic: f.bic.value.toUpperCase().replace(/[^A-Z0-9]/g, '') || S.bicDeIban(iban),
      mandato: S.limpiar(f.mandato.value).toUpperCase() || ('RY5-' + unidad), fechaMandato: f.fechaMandato.value, previos: f.previos.checked, activo: f.activo.checked };
    if (id) Object.assign(st.deudores.find(x => x.id === id), datos);
    else st.deudores.push(Object.assign(deudorBase(unidad, tipo, '', st.deudores.length), datos));
    guardar(); cerrar(); render(); toast('Deudor guardado');
  }

  /* ---------- Pestaña Historial ---------- */
  function vistaHistorial() {
    const rs = st.remesas.slice().sort((a, b) => b.fechaCobro.localeCompare(a.fechaCobro));
    if (!rs.length) return '<div class="card"><h2>Historial</h2><div class="empty">Aún no has generado ninguna remesa.</div></div>';
    return '<div class="card"><h2>Historial</h2>' + rs.map(r => {
      const t = r.items.reduce((s, i) => s + i.importe, 0);
      const ef = (r.efectivo || []).filter(e => e.importe > 0), pend = ef.filter(e => !e.cobrado);
      return '<div class="item"><div class="grow"><div class="name">' + esc(r.nombre) + '</div>' +
        '<div class="muted">Cobro ' + fmtFecha(r.fechaCobro) + ' · generada ' + fmtFecha(r.fechaGen) + ' · ' + r.items.length + ' adeudos</div>' +
        '<div style="font-weight:700">Banco ' + S.eur(t) + (ef.length ? ' · Efectivo ' + S.eur(ef.reduce((s, e) => s + e.importe, 0)) : '') + '</div>' +
        (ef.length ? '<div class="muted" style="color:' + (pend.length ? 'var(--warn)' : 'var(--ok)') + '">' +
          (pend.length ? 'Efectivo pendiente: ' + pend.map(e => esc(e.etiqueta)).join(', ') + ' (' + S.eur(pend.reduce((s, e) => s + e.importe, 0)) + ')' : 'Efectivo cobrado completo') + '</div>' : '') +
        '<div class="btns" style="margin-top:6px"><button class="btn sec sm" data-act="histFich" data-id="' + r.id + '">Ficheros</button>' +
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
    return '<div class="card"><h2>Comunidad (acreedor)</h2>' +
      f('nombre', 'Nombre de la comunidad') +
      f('nif', 'NIF de la comunidad', ' autocapitalize="characters" placeholder="H12345678"') +
      (nifR ? '<div class="muted" style="color:' + (nifR.ok ? 'var(--ok)' : 'var(--err)') + '">' + (nifR.ok ? 'NIF correcto' : 'NIF no válido') + '</div>' : '') +
      f('presidente', 'Presidente') +
      f('direccion', 'Dirección') +
      '<div class="row"><div>' + f('cp', 'C. postal', ' inputmode="numeric"') + '</div><div>' + f('localidad', 'Localidad') + '</div></div>' +
      f('provincia', 'Provincia') + '</div>' +

      '<div class="card"><h2>Cuenta de abono · Santander</h2>' +
      f('iban', 'IBAN de la comunidad', ' class="mono" autocapitalize="characters"') +
      (iban ? '<div class="muted" style="color:' + (ibanOk ? 'var(--ok)' : 'var(--err)') + '">' + (ibanOk ? 'IBAN correcto · entidad ' + iban.slice(4, 8) + ' · oficina ' + iban.slice(8, 12) : 'IBAN no válido') + '</div>' : '') +
      f('bic', 'BIC', ' autocapitalize="characters"') +
      f('sufijo', 'Sufijo del acreedor (lo da el banco, normalmente 000)', ' inputmode="numeric" maxlength="3"') +
      '<label>Identificador de acreedor SEPA (calculado)</label><div class="mono" style="font-size:16px;font-weight:700">' + (id ? esc(id) : '—') + '</div>' +
      '<p class="muted">Compruébalo con el que figure en el contrato de remesas del Santander.</p></div>' +

      '<div class="card"><h2>Remesas</h2>' +
      f('concepto', 'Concepto del recibo') +
      '<p class="muted">{PERIODO} se sustituye por p. ej. NOV-DIC-2026 y {UNIDAD} por PISO 1A / LOCAL 2.</p>' +
      '<label>Tipo de adeudo</label><select data-cfg="modoSeq"><option value="auto"' + (c.modoSeq === 'auto' ? ' selected' : '') + '>Automático: FRST el primero, luego RCUR</option>' +
      '<option value="rcur"' + (c.modoSeq === 'rcur' ? ' selected' : '') + '>Siempre RCUR (recurrente)</option></select></div>' +

      '<div class="card"><h2>Copia de seguridad</h2><p class="muted">Guarda una copia en Archivos/iCloud de vez en cuando: si se borra la app, se pierden los datos.</p>' +
      '<div class="btns"><button class="btn sec" data-act="exportar">Exportar copia</button><button class="btn sec" data-act="importar">Importar copia</button></div>' +
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
  let tab = 'remesa';
  function render() {
    const m = $('#main');
    m.innerHTML = tab === 'remesa' ? vistaRemesa() : tab === 'deudores' ? vistaDeudores() : tab === 'historial' ? vistaHistorial() : vistaAjustes();
    document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    $('#sub').textContent = st.config.direccion + ' · ' + st.config.localidad + (st.config.presidente ? ' · Pte. ' + st.config.presidente : '');
  }

  $('#nav').addEventListener('click', e => { const b = e.target.closest('button[data-tab]'); if (!b) return; tab = b.dataset.tab; render(); window.scrollTo(0, 0); });

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const a = el.dataset.act, id = el.dataset.id;
    if (a === 'cerrar') cerrar();
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
        if (t.value) { const p = S.periodoDeFecha(t.value); b.idx = p.idx; b.anio = p.anio; b.mesCobro = mesIso(p.anio, p.idx * 2); }
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
    } else if (t.form && t.form.id === 'fd' && t.name === 'pago') { $('#bancoCampos').hidden = t.value === 'efectivo'; }
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
      if (t.dataset.cfg === 'nif' || t.dataset.cfg === 'bic') v = v.toUpperCase().replace(/[^A-Z0-9]/g, '');
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

  render();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
