/* Motor SEPA: validaciones y generación de ficheros de adeudos
   - XML ISO 20022 pain.008.001.02 (CORE y B2B)
   - Cuaderno 19.14 (CORE, versión 19143) y 19.44 (B2B, versión 19445), registros de 600 posiciones */
(function (g) {
  'use strict';

  const BIMESTRES = ['ENE-FEB', 'MAR-ABR', 'MAY-JUN', 'JUL-AGO', 'SEP-OCT', 'NOV-DIC'];
  const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  // BIC de las entidades españolas más habituales (código de entidad del IBAN → BIC)
  const BIC_ENTIDAD = {
    '0049': 'BSCHESMMXXX', '0075': 'POPUESMMXXX', '0030': 'ESPCESMMXXX', '2100': 'CAIXESBBXXX',
    '0182': 'BBVAESMMXXX', '0081': 'BSABESBBXXX', '0128': 'BKBKESMMXXX', '1465': 'INGDESMMXXX',
    '0073': 'OPENESMMXXX', '2085': 'CAZRES2ZXXX', '3058': 'CCRIES2AXXX', '2095': 'BASKES2BXXX',
    '2080': 'CAGLESMMXXX', '0019': 'DEUTESBBXXX', '0239': 'EVOBESMMXXX', '0061': 'BMARES2MXXX',
    '0186': 'BFIVESBBXXX', '1491': 'TRIOESMMXXX'
  };

  /* ---------- Texto ---------- */
  // Caracteres admitidos SEPA: A-Z a-z 0-9 / - ? : ( ) . , ' + espacio. Ñ→N, Ç→C, tildes fuera.
  function limpiar(s) {
    s = String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    s = s.replace(/[ºª]/g, ' ').replace(/[^A-Za-z0-9\/\-?:().,'+ ]/g, ' ');
    return s.replace(/\s+/g, ' ').trim();
  }
  function padR(s, n) { s = limpiar(s); return (s + ' '.repeat(n)).slice(0, n); }
  function padN(v, n) {
    const s = String(v);
    if (!/^\d+$/.test(s) || s.length > n) throw new Error('Valor numérico fuera de rango: ' + s);
    return '0'.repeat(n - s.length) + s;
  }
  function xmlEsc(s) {
    return limpiar(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&apos;');
  }
  function corta(s, n) { return limpiar(s).slice(0, n); }

  /* ---------- Números de control ---------- */
  function letrasADigitos(s) { return s.toUpperCase().replace(/[A-Z]/g, c => String(c.charCodeAt(0) - 55)); }
  function mod97(str) { let r = 0; for (const ch of str) r = (r * 10 + (ch.charCodeAt(0) - 48)) % 97; return r; }

  function normIban(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function fmtIban(s) { return normIban(s).replace(/(.{4})/g, '$1 ').trim(); }
  function ibanValido(iban) {
    iban = normIban(iban);
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
    if (iban.startsWith('ES') && iban.length !== 24) return false;
    return mod97(letrasADigitos(iban.slice(4) + iban.slice(0, 4))) === 1;
  }
  function bicDeIban(iban) {
    iban = normIban(iban);
    return iban.startsWith('ES') ? (BIC_ENTIDAD[iban.slice(4, 8)] || '') : '';
  }

  // Identificador de acreedor AT-02: ES + DC + sufijo(3) + NIF
  function idAcreedor(nif, sufijo, pais) {
    pais = pais || 'ES';
    const n = String(nif || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!n) return '';
    const dc = 98 - mod97(letrasADigitos(n + pais + '00'));
    const suf = String(sufijo == null || sufijo === '' ? '000' : sufijo).replace(/\D/g, '').padStart(3, '0').slice(-3);
    return pais + String(dc).padStart(2, '0') + suf + n;
  }

  function validarNif(v) {
    v = String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const L = 'TRWAGMYFPDXBNJZSQVHLCKE';
    if (/^\d{8}[A-Z]$/.test(v)) return { ok: L[+v.slice(0, 8) % 23] === v[8], tipo: 'DNI', valor: v };
    if (/^[XYZ]\d{7}[A-Z]$/.test(v)) {
      const num = 'XYZ'.indexOf(v[0]) + v.slice(1, 8);
      return { ok: L[+num % 23] === v[8], tipo: 'NIE', valor: v };
    }
    if (/^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/.test(v)) {
      const d = v.slice(1, 8).split('').map(Number);
      let a = d[1] + d[3] + d[5], b = 0;
      [d[0], d[2], d[4], d[6]].forEach(x => { const y = x * 2; b += Math.floor(y / 10) + (y % 10); });
      const c = (10 - ((a + b) % 10)) % 10;
      const letra = 'JABCDEFGHI'[c];
      const ok = 'PQRSNW'.includes(v[0]) ? v[8] === letra : 'ABEH'.includes(v[0]) ? v[8] === String(c) : (v[8] === letra || v[8] === String(c));
      return { ok, tipo: 'CIF', valor: v };
    }
    return { ok: false, tipo: '', valor: v };
  }

  /* ---------- Importes y fechas ---------- */
  function parseImporte(s) {
    s = String(s == null ? '' : s).trim().replace(/[\s€]/g, '');
    if (!s) return 0;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    const n = Number(s);
    return isFinite(n) ? Math.round(n * 100) : NaN;
  }
  function eur(c) { return (c / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'; }
  function decXml(c) { return (Math.floor(c / 100)) + '.' + String(c % 100).padStart(2, '0'); }
  function ymd(iso) { return iso.replace(/-/g, ''); }
  function aDate(iso) { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); }
  function aIso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function hoyIso() { return aIso(new Date()); }

  function periodoDeFecha(iso) { const d = aDate(iso); return { idx: Math.floor(d.getMonth() / 2), anio: d.getFullYear() }; }
  function nombreRemesa(idx, anio) { return BIMESTRES[idx] + '-' + anio; }
  function diasHabilesEntre(desdeIso, hastaIso) {
    let d = aDate(desdeIso), h = aDate(hastaIso), n = 0;
    while (d < h) { d.setDate(d.getDate() + 1); const w = d.getDay(); if (w !== 0 && w !== 6) n++; }
    return n;
  }

  /* ---------- Generadores ----------
     remesa = {
       nombre, fechaGen 'YYYY-MM-DD', fechaCobro 'YYYY-MM-DD',
       acreedor: { nombre, id, iban, bic, d1, d2, d3, pais },
       items: [{ ref, mandato, fechaMandato 'YYYY-MM-DD', seq, importe (céntimos), nombre, nif,
                 org (bool), iban, bic, concepto, d1, d2, d3 }]
     } */
  function marcaTiempo(now) {
    const p = (n, l) => String(n).padStart(l || 2, '0');
    return {
      fecha: now.getFullYear() + p(now.getMonth() + 1) + p(now.getDate()),
      hora: p(now.getHours()) + p(now.getMinutes()) + p(now.getSeconds()),
      ms5: p(now.getMilliseconds(), 3) + '00',
      iso: now.getFullYear() + '-' + p(now.getMonth() + 1) + '-' + p(now.getDate()) + 'T' + p(now.getHours()) + ':' + p(now.getMinutes()) + ':' + p(now.getSeconds())
    };
  }

  function genCuaderno(remesa, esquema, now) {
    now = now || new Date();
    const ver = esquema === 'B2B' ? '19445' : '19143';
    const a = remesa.acreedor, t = marcaTiempo(now);
    const items = remesa.items.slice().sort((x, y) => limpiar(x.ref) < limpiar(y.ref) ? -1 : 1);
    const fCobro = ymd(remesa.fechaCobro), fGen = ymd(remesa.fechaGen);
    const iban = normIban(a.iban);
    const entidad = iban.startsWith('ES') ? iban.slice(4, 8) : '0000';
    const oficina = iban.startsWith('ES') ? iban.slice(8, 12) : '0000';
    const refFich = 'PRE' + fGen + t.hora + t.ms5 + padR(remesa.nombre.replace(/-/g, ''), 13);
    const L = [];

    L.push('01' + ver + '001' + padR(a.id, 35) + padR(a.nombre, 70) + fGen + padR(refFich, 35) +
      padN(entidad, 4) + padN(oficina, 4) + ' '.repeat(434));
    L.push('02' + ver + '002' + padR(a.id, 35) + fCobro + padR(a.nombre, 70) + padR(a.d1, 50) + padR(a.d2, 50) +
      padR(a.d3, 40) + padR(a.pais || 'ES', 2) + padR(iban, 34) + ' '.repeat(301));

    let total = 0;
    items.forEach(it => {
      total += it.importe;
      const nif = String(it.nif || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const tipoId = nif ? (it.org ? '1' : '2') : ' ';
      const codId = nif ? (it.org ? 'I' : 'J') + padR(nif, 35) : ' '.repeat(36);
      L.push('03' + ver + '003' + padR(it.ref, 35) + padR(it.mandato, 35) + padR(it.seq, 4) + ' '.repeat(4) +
        padN(it.importe, 11) + ymd(it.fechaMandato) + padR(it.bic || '', 11) + padR(it.nombre, 70) +
        padR(it.d1, 50) + padR(it.d2, 50) + padR(it.d3, 40) + padR(it.d1 ? 'ES' : '', 2) +
        tipoId + codId + ' '.repeat(35) + 'A' + padR(normIban(it.iban), 34) + ' '.repeat(4) +
        padR(it.concepto, 140) + ' '.repeat(19));
    });
    const n = items.length;
    L.push('04' + padR(a.id, 35) + fCobro + padN(total, 17) + padN(n, 8) + padN(n + 2, 10) + ' '.repeat(520));
    L.push('05' + padR(a.id, 35) + padN(total, 17) + padN(n, 8) + padN(n + 3, 10) + ' '.repeat(528));
    L.push('99' + padN(total, 17) + padN(n, 8) + padN(L.length + 1, 10) + ' '.repeat(563));

    L.forEach((l, i) => { if (l.length !== 600) throw new Error('Registro ' + (i + 1) + ' con longitud ' + l.length); });
    return L.join('\r\n') + '\r\n';
  }

  function genXml(remesa, esquema, now) {
    now = now || new Date();
    const a = remesa.acreedor, t = marcaTiempo(now);
    const iban = normIban(a.iban);
    const total = remesa.items.reduce((s, i) => s + i.importe, 0);
    const msgId = corta(remesa.nombre + '-' + esquema + '-' + t.fecha + t.hora, 35);
    const grupos = {};
    remesa.items.forEach(i => { (grupos[i.seq] = grupos[i.seq] || []).push(i); });
    const creDt = remesa.fechaGen + t.iso.slice(10);
    const x = [];
    x.push('<?xml version="1.0" encoding="UTF-8"?>');
    x.push('<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.001.02" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">');
    x.push('<CstmrDrctDbtInitn>');
    x.push('<GrpHdr><MsgId>' + xmlEsc(msgId) + '</MsgId><CreDtTm>' + creDt + '</CreDtTm><NbOfTxs>' + remesa.items.length +
      '</NbOfTxs><CtrlSum>' + decXml(total) + '</CtrlSum><InitgPty><Nm>' + xmlEsc(corta(a.nombre, 70)) +
      '</Nm><Id><OrgId><Othr><Id>' + xmlEsc(a.id) + '</Id></Othr></OrgId></Id></InitgPty></GrpHdr>');

    ['FRST', 'RCUR', 'OOFF', 'FNAL'].forEach(seq => {
      const its = grupos[seq]; if (!its) return;
      const sub = its.reduce((s, i) => s + i.importe, 0);
      x.push('<PmtInf>');
      x.push('<PmtInfId>' + xmlEsc(corta(remesa.nombre + '-' + esquema + '-' + seq, 35)) + '</PmtInfId><PmtMtd>DD</PmtMtd><BtchBookg>true</BtchBookg>');
      x.push('<NbOfTxs>' + its.length + '</NbOfTxs><CtrlSum>' + decXml(sub) + '</CtrlSum>');
      x.push('<PmtTpInf><SvcLvl><Cd>SEPA</Cd></SvcLvl><LclInstrm><Cd>' + esquema + '</Cd></LclInstrm><SeqTp>' + seq + '</SeqTp></PmtTpInf>');
      x.push('<ReqdColltnDt>' + remesa.fechaCobro + '</ReqdColltnDt>');
      let adr = '<Ctry>' + (a.pais || 'ES') + '</Ctry>';
      if (a.d1) adr += '<AdrLine>' + xmlEsc(corta(a.d1, 70)) + '</AdrLine>';
      if (a.d2) adr += '<AdrLine>' + xmlEsc(corta(a.d2 + (a.d3 ? ' ' + a.d3 : ''), 70)) + '</AdrLine>';
      x.push('<Cdtr><Nm>' + xmlEsc(corta(a.nombre, 70)) + '</Nm><PstlAdr>' + adr + '</PstlAdr></Cdtr>');
      x.push('<CdtrAcct><Id><IBAN>' + iban + '</IBAN></Id></CdtrAcct>');
      x.push('<CdtrAgt><FinInstnId>' + (a.bic ? '<BIC>' + a.bic + '</BIC>' : '<Othr><Id>NOTPROVIDED</Id></Othr>') + '</FinInstnId></CdtrAgt>');
      x.push('<ChrgBr>SLEV</ChrgBr>');
      x.push('<CdtrSchmeId><Id><PrvtId><Othr><Id>' + xmlEsc(a.id) + '</Id><SchmeNm><Prtry>SEPA</Prtry></SchmeNm></Othr></PrvtId></Id></CdtrSchmeId>');
      its.forEach(i => {
        const nif = String(i.nif || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        let dbtr = '<Nm>' + xmlEsc(corta(i.nombre, 70)) + '</Nm>';
        if (i.d1) dbtr += '<PstlAdr><Ctry>ES</Ctry><AdrLine>' + xmlEsc(corta(i.d1, 70)) + '</AdrLine>' +
          (i.d2 ? '<AdrLine>' + xmlEsc(corta(i.d2 + (i.d3 ? ' ' + i.d3 : ''), 70)) + '</AdrLine>' : '') + '</PstlAdr>';
        if (nif) dbtr += '<Id>' + (i.org ? '<OrgId><Othr><Id>' + nif + '</Id></Othr></OrgId>' : '<PrvtId><Othr><Id>' + nif + '</Id></Othr></PrvtId>') + '</Id>';
        x.push('<DrctDbtTxInf>' +
          '<PmtId><EndToEndId>' + xmlEsc(corta(i.ref, 35)) + '</EndToEndId></PmtId>' +
          '<InstdAmt Ccy="EUR">' + decXml(i.importe) + '</InstdAmt>' +
          '<DrctDbtTx><MndtRltdInf><MndtId>' + xmlEsc(corta(i.mandato, 35)) + '</MndtId><DtOfSgntr>' + i.fechaMandato + '</DtOfSgntr></MndtRltdInf></DrctDbtTx>' +
          '<DbtrAgt><FinInstnId>' + (i.bic ? '<BIC>' + i.bic + '</BIC>' : '<Othr><Id>NOTPROVIDED</Id></Othr>') + '</FinInstnId></DbtrAgt>' +
          '<Dbtr>' + dbtr + '</Dbtr>' +
          '<DbtrAcct><Id><IBAN>' + normIban(i.iban) + '</IBAN></Id></DbtrAcct>' +
          '<RmtInf><Ustrd>' + xmlEsc(corta(i.concepto, 140)) + '</Ustrd></RmtInf>' +
          '</DrctDbtTxInf>');
      });
      x.push('</PmtInf>');
    });
    x.push('</CstmrDrctDbtInitn>');
    x.push('</Document>');
    return x.join('\n') + '\n';
  }

  g.SEPA = {
    BIMESTRES, MESES, limpiar, normIban, fmtIban, ibanValido, bicDeIban, idAcreedor, validarNif,
    parseImporte, eur, aDate, aIso, hoyIso, periodoDeFecha, nombreRemesa, diasHabilesEntre,
    genCuaderno, genXml, mod97, letrasADigitos
  };
})(typeof window !== 'undefined' ? window : globalThis);
