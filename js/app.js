/* =========================================================
   Agente Nano · navegación y pantallas
   Rutas (en la URL después de #):
     #/inicio  #/elegir  #/artefacto/<modo>  #/datos  #/ver/<id>
   ========================================================= */

const GRAFICOS = [
  { id: 'bars',   n: 1, tipo: 'Barras',              titulo: 'Aromas que percibe Nano' },
  { id: 'pie',    n: 2, tipo: 'Torta',               titulo: 'Poderes de Nano' },
  { id: 'line',   n: 3, tipo: 'Líneas',              titulo: 'Evolución de la historia de Nano' },
  { id: 'radar',  n: 4, tipo: 'Radar',               titulo: 'Nivel de importancia de cada poder' },
  { id: 'donut',  n: 5, tipo: 'Dona',                titulo: 'Elementos del entorno de Nano' },
  { id: 'cmp',    n: 6, tipo: 'Barras comparativas', titulo: 'Antes y después de los poderes' }
];
const MAPAS = [
  { id: 'mapaolores',   n: 7, tipo: 'Ubicación',   titulo: 'Ubicaciones de los olores que detecta Nano' },
  { id: 'mapaenemigos', n: 8, tipo: 'Coroplético', titulo: 'Cantidad de enemigos por zona' }
];
const DATOS_URL = 'graficos-mapas/index.html';

const MODOS = {
  general: 'Vista general',
  transparencia: 'Transparencia',
  acercamiento: 'Acercamiento',
  corte: 'Corte',
  despiece: 'Despiece'
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- miniaturas de las tarjetas ---------- */
const MINI = {
  bars: '<path d="M20 88 L216 88 M20 88 L20 8" fill="none" stroke="#26252f" stroke-width="2"/><rect x="34" y="50" width="22" height="38" fill="#e2e1e8" stroke="#26252f" stroke-width="2"/><rect x="70" y="24" width="22" height="64" fill="#e2e1e8" stroke="#26252f" stroke-width="2"/><rect x="106" y="40" width="22" height="48" fill="#e2e1e8" stroke="#26252f" stroke-width="2"/><rect x="142" y="16" width="22" height="72" fill="#e2e1e8" stroke="#26252f" stroke-width="2"/><rect x="178" y="60" width="22" height="28" fill="#e2e1e8" stroke="#26252f" stroke-width="2"/>',
  pie: '<circle cx="116" cy="48" r="40" fill="#fff" stroke="#26252f" stroke-width="2"/><path d="M116 48 L116 8 A40 40 0 0 1 154 60 Z" fill="#e2e1e8" stroke="#26252f" stroke-width="2"/><path d="M116 48 L84 72" fill="none" stroke="#26252f" stroke-width="2"/>',
  line: '<path d="M20 88 L216 88 M20 88 L20 8" fill="none" stroke="#26252f" stroke-width="2"/><path d="M30 76 L70 64 L110 70 L150 34 L200 18" fill="none" stroke="#26252f" stroke-width="2.5"/><g fill="#fff" stroke="#26252f" stroke-width="2"><circle cx="30" cy="76" r="4"/><circle cx="70" cy="64" r="4"/><circle cx="110" cy="70" r="4"/><circle cx="150" cy="34" r="4"/><circle cx="200" cy="18" r="4"/></g>',
  radar: '<path d="M116 8 L156 72 L76 72 Z M116 28 L139 64 L93 64 Z" fill="none" stroke="#8d8b9a" stroke-width="1.5"/><path d="M116 14 L146 70 L92 68 Z" fill="#e2e1e8" stroke="#26252f" stroke-width="2"/>',
  donut: '<circle cx="116" cy="48" r="34" fill="none" stroke="#26252f" stroke-width="18"/><circle cx="116" cy="48" r="34" fill="none" stroke="#e2e1e8" stroke-width="14" stroke-dasharray="60 10 40 10 70 24"/>',
  cmp: '<path d="M20 88 L216 88 M20 88 L20 8" fill="none" stroke="#26252f" stroke-width="2"/><g stroke="#26252f" stroke-width="2"><rect x="40" y="62" width="18" height="26" fill="#fff"/><rect x="58" y="20" width="18" height="68" fill="#8d8b9a"/><rect x="104" y="58" width="18" height="30" fill="#fff"/><rect x="122" y="14" width="18" height="74" fill="#8d8b9a"/><rect x="168" y="66" width="18" height="22" fill="#fff"/><rect x="186" y="26" width="18" height="62" fill="#8d8b9a"/></g>',
  mapaolores: '<path d="M0 34 L312 24 M0 70 L312 76 M80 0 L70 96 M200 0 L214 96" fill="none" stroke="#d6d5de" stroke-width="7"/><path d="M120 14 C111 14 107 21 107 26 C107 36 120 48 120 48 C120 48 133 36 133 26 C133 21 129 14 120 14 Z M240 40 C231 40 227 47 227 52 C227 62 240 74 240 74 C240 74 253 62 253 52 C253 47 249 40 240 40 Z M44 46 C35 46 31 53 31 58 C31 68 44 80 44 80 C44 80 57 68 57 58 C57 53 53 46 44 46 Z" fill="#26252f"/>',
  mapaenemigos: '<g stroke="#26252f" stroke-width="2"><path d="M10 10 L120 6 L110 50 L14 56 Z" fill="#e2e1e8"/><path d="M120 6 L220 12 L230 48 L110 50 Z" fill="#8d8b9a"/><path d="M220 12 L302 8 L298 60 L230 48 Z" fill="#fff"/><path d="M14 56 L110 50 L118 90 L8 88 Z" fill="#fff"/><path d="M110 50 L230 48 L240 90 L118 90 Z" fill="#c9c8d2"/><path d="M230 48 L298 60 L304 88 L240 90 Z" fill="#4a4960"/></g>'
};

function tarjeta(item, ancho) {
  return `<a class="tarjeta-dato" href="#/ver/${item.id}">
    <span class="tipo">${item.n} · ${item.tipo}</span>
    <svg viewBox="0 0 ${ancho} 96" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${MINI[item.id]}</svg>
    <span class="nombre">${item.titulo}</span></a>`;
}
$('#grid-graficos').innerHTML = GRAFICOS.map(g => tarjeta(g, 232)).join('');
$('#grid-mapas').innerHTML = MAPAS.map(m => tarjeta(m, 312)).join('');

/* ---------- sonido (un clic suave al navegar) ---------- */
let sonido = true, audio = null;
function clic() {
  if (!sonido) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator(), g = audio.createGain();
    o.frequency.value = 660; g.gain.value = 0.05;
    o.connect(g).connect(audio.destination);
    o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.08); o.stop(audio.currentTime + 0.09);
  } catch (e) { /* sin audio */ }
}
$$('[data-sonido]').forEach(b => b.addEventListener('click', () => {
  sonido = !sonido;
  $$('[data-sonido]').forEach(x => {
    x.setAttribute('aria-pressed', String(sonido));
    x.textContent = x.classList.contains('sonido') ? (sonido ? 'Sonido: sí' : 'Sonido: no') : 'Sonido';
  });
}));
document.addEventListener('click', e => { if (e.target.closest('a.btn, a.tarjeta-grande, a.tarjeta-dato')) clic(); });

/* ---------- artefacto 3D (se carga la primera vez que se entra) ---------- */
let rueda = null, cargando = null;
function cargarRueda() {
  if (rueda) return Promise.resolve(rueda);
  if (cargando) return cargando;
  cargando = import('./rueda.js').then(mod => {
    rueda = mod.crearRueda($('#visor'), {
      etiquetas: $('#visor-etiquetas'),
      miniCanvas: $('#mini-canvas'),
      alPasar: mostrarTooltip,
      alElegir: tipo => {
        if (rueda.estado.modo === 'corte') return;
        $('#pieza').value = tipo;
        rueda.foco(tipo);
        actualizarDescPieza();
        location.hash = '#/artefacto/acercamiento';
      }
    });
    $('#pieza').innerHTML = mod.PIEZAS.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
    actualizarDescPieza();
    $('#visor-cargando').remove();
    return rueda;
  }).catch(err => {
    $('#visor-cargando').textContent = 'No se pudo cargar la rueda 3D. Revisa tu conexión a internet.';
    console.error(err);
    cargando = null;
    throw err;
  });
  return cargando;
}

function mostrarTooltip(info, x, y) {
  const t = $('#visor-tooltip');
  if (!info) { t.hidden = true; return; }
  t.innerHTML = `${info.nombre}<small>${info.desc}</small>`;
  t.hidden = false;
  const visor = $('#visor');
  const maxX = visor.clientWidth - t.offsetWidth - 8;
  t.style.left = Math.min(x + 16, maxX) + 'px';
  t.style.top = Math.max(8, y - t.offsetHeight - 12) + 'px';
}

function actualizarDescPieza() {
  const id = $('#pieza').value;
  const p = rueda && rueda.piezas.find(x => x.id === id);
  $('#pieza-desc').textContent = p ? p.desc : '';
}

function ponerModo(modo) {
  if (!MODOS[modo]) modo = 'general';
  $$('.opcion').forEach(a => a.toggleAttribute('aria-current', a.dataset.modo === modo));
  $$('.opcion[aria-current]').forEach(a => a.setAttribute('aria-current', 'page'));
  $$('.controles').forEach(c => c.classList.toggle('activa', c.dataset.controles === modo));
  $$('[data-modo-solo]').forEach(el => {
    el.style.display = el.dataset.modoSolo !== modo ? 'none' : (el.classList.contains('visor-zoom') ? 'flex' : 'block');
  });
  let etiqueta = MODOS[modo];
  if (modo === 'transparencia') etiqueta += Number($('#rango-transp').value) >= 90 ? ' · total' : ' · parcial';
  if (modo === 'corte') etiqueta += ' · ' + ($('[data-corte][aria-pressed="true"]').dataset.corte);
  if (modo === 'despiece') etiqueta = $('[data-despiece][aria-pressed="true"]').dataset.despiece === 'explotado' ? 'Explotado · piezas sobre el eje' : 'Despiece · todas las piezas a la vista';
  if (modo === 'acercamiento' && $('#pieza').selectedOptions[0]) etiqueta += ' · ' + $('#pieza').selectedOptions[0].textContent;
  $('#visor-etiqueta').textContent = etiqueta;
  $('#visor-pista').textContent = modo === 'despiece' ? 'Arrastra para girar · pasa el mouse por una pieza para ver su nombre'
    : modo === 'corte' ? 'Arrastra para girar · mueve el corte con el deslizador'
    : 'Arrastra para girar · rueda del mouse para acercar';
  cargarRueda().then(r => {
    r.modo(modo);
    dibujarIndicadorCorte();
    if (modo === 'acercamiento') $('#visor-etiqueta').textContent = 'Acercamiento · ' + $('#pieza').selectedOptions[0].textContent;
  });
}

/* controles: vista general */
$$('[data-vista]').forEach(b => b.addEventListener('click', () => rueda && rueda.vista(b.dataset.vista)));

/* controles: transparencia */
$('#rango-transp').addEventListener('input', e => { rueda && rueda.transparencia(Number(e.target.value)); ponerEtiquetaTransp(); });
$$('[data-transp]').forEach(b => b.addEventListener('click', () => {
  $('#rango-transp').value = b.dataset.transp;
  rueda && rueda.transparencia(Number(b.dataset.transp));
  ponerEtiquetaTransp();
}));
function ponerEtiquetaTransp() {
  const v = Number($('#rango-transp').value);
  $$('[data-transp]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.transp) === v)));
  $('#visor-etiqueta').textContent = 'Transparencia · ' + (v >= 90 ? 'total' : 'parcial');
}
ponerEtiquetaTransp();
$('#resaltar').addEventListener('change', e => rueda && rueda.resaltarInternas(e.target.checked));

/* controles: acercamiento */
$('#pieza').addEventListener('change', e => {
  rueda && rueda.foco(e.target.value);
  actualizarDescPieza();
  $('#visor-etiqueta').textContent = 'Acercamiento · ' + e.target.selectedOptions[0].textContent;
});
$('#rango-zoom').addEventListener('input', e => rueda && rueda.zoom(Number(e.target.value)));
function pasoZoom(d) {
  const r = $('#rango-zoom');
  r.value = Math.min(5, Math.max(1, Number(r.value) + d));
  rueda && rueda.zoom(Number(r.value));
}
$('#zoom-mas').addEventListener('click', () => pasoZoom(0.5));
$('#zoom-menos').addEventListener('click', () => pasoZoom(-0.5));

/* controles: corte */
function aplicarCorte() {
  const tipo = $('[data-corte][aria-pressed="true"]').dataset.corte;
  rueda && rueda.corte(tipo, Number($('#rango-corte').value) / 100);
  $('#visor-etiqueta').textContent = 'Corte · ' + tipo;
  dibujarIndicadorCorte();
}
$$('[data-corte]').forEach(b => b.addEventListener('click', () => {
  $$('[data-corte]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  aplicarCorte();
}));
$('#rango-corte').addEventListener('input', aplicarCorte);
$('#rayado').addEventListener('change', e => rueda && rueda.rayado(e.target.checked));
function dibujarIndicadorCorte() {
  const tipo = $('[data-corte][aria-pressed="true"]').dataset.corte;
  const p = Number($('#rango-corte').value) / 100;
  const svg = $('#corte-indicador');
  if (tipo === 'longitudinal') {
    // vista de frente: el plano corta de arriba abajo, de un costado al otro
    const x = 80 + (-1.3 + 2.6 * p) * 46;
    svg.innerHTML = `<path d="M8 112 L152 112" stroke="#26252f" stroke-width="3"/>
      <path d="M29 60 L14 112 L44 112 Z M131 60 L116 112 L146 112 Z" fill="#e2e1e8" stroke="#26252f" stroke-width="2"/>
      <circle cx="80" cy="60" r="46" fill="#fff" stroke="#26252f" stroke-width="2.5"/>
      <circle cx="80" cy="60" r="30" fill="none" stroke="#8d8b9a" stroke-width="1.5"/>
      <circle cx="80" cy="60" r="8" fill="#e2e1e8" stroke="#26252f" stroke-width="2"/>
      <path d="M${x} 2 L${x} 118" stroke="#5b3fd0" stroke-width="3" stroke-dasharray="10 4 2 4"/>`;
  } else {
    // vista de lado: el plano corta de frente, a la profundidad elegida
    const x = 80 + (-0.6 + 1.2 * p) * 63;
    svg.innerHTML = `<path d="M8 112 L152 112" stroke="#26252f" stroke-width="3"/>
      <rect x="58" y="14" width="44" height="92" fill="#fff" stroke="#26252f" stroke-width="2.5"/>
      <path d="M80 56 L36 112 L124 112 Z M80 72 L54 106 L106 106 Z" fill="#e2e1e8" fill-rule="evenodd" stroke="#26252f" stroke-width="2"/>
      <text x="108" y="22" font-size="11" fill="#4a4960">frente →</text>
      <path d="M${x} 2 L${x} 118" stroke="#5b3fd0" stroke-width="3" stroke-dasharray="10 4 2 4"/>`;
  }
}
dibujarIndicadorCorte();

/* controles: despiece */
function aplicarDespiece() {
  const tipo = $('[data-despiece][aria-pressed="true"]').dataset.despiece;
  rueda && rueda.despiece(tipo, Number($('#rango-sep').value) / 100);
  $('#visor-etiqueta').textContent = tipo === 'explotado' ? 'Explotado · piezas sobre el eje' : 'Despiece · todas las piezas a la vista';
}
$$('[data-despiece]').forEach(b => b.addEventListener('click', () => {
  $$('[data-despiece]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  $('#rango-sep').value = 100;
  aplicarDespiece();
}));
$('#rango-sep').addEventListener('input', aplicarDespiece);
$('#btn-armar').addEventListener('click', () => { $('#rango-sep').value = 0; aplicarDespiece(); });
$('#btn-explotar').addEventListener('click', () => { $('#rango-sep').value = 100; aplicarDespiece(); });

/* ---------- ver un gráfico o mapa ---------- */
function abrirDato(id) {
  const esMapa = MAPAS.some(m => m.id === id);
  const lista = esMapa ? MAPAS : GRAFICOS;
  const item = lista.find(x => x.id === id) || lista[0];
  $('#lista-titulo').textContent = esMapa ? 'Mapas' : 'Gráficos';
  $('#lista-items').innerHTML = lista.map(x =>
    `<a href="#/ver/${x.id}"${x.id === item.id ? ' aria-current="page"' : ''}>${x.n} · ${x.titulo}</a>`).join('');
  const otro = esMapa ? GRAFICOS[0] : MAPAS[0];
  $('#lista-cambiar').href = '#/ver/' + otro.id;
  $('#lista-cambiar').textContent = esMapa ? 'Ver gráficos →' : 'Ver mapas →';
  $('#ver-titulo').textContent = item.titulo;
  $('#ver-sub').textContent = esMapa
    ? 'Mapa ' + item.tipo.toLowerCase() + ' · toca los marcadores o zonas para ver más.'
    : 'Gráfico de ' + item.tipo.toLowerCase() + ' · usa el botón de animación y toca los elementos para ver más.';
  const frame = $('#ver-frame');
  const destino = DATOS_URL + '#' + item.id;
  if (!frame.src) frame.src = destino;
  else if (frame.contentWindow && frame.contentWindow.location.pathname.endsWith('index.html')) frame.contentWindow.location.hash = item.id;
  else frame.src = destino;
}

/* ---------- enrutador ---------- */
function mostrar(id) {
  $$('.screen').forEach(s => s.classList.toggle('activa', s.id === id));
}
function ruta() {
  const [pantalla, param] = location.hash.replace(/^#\/?/, '').split('/');
  switch (pantalla) {
    case 'elegir': mostrar('s-elegir'); break;
    case 'artefacto': mostrar('s-artefacto'); ponerModo(param || 'general'); break;
    case 'datos': mostrar('s-datos'); break;
    case 'ver': mostrar('s-ver'); abrirDato(param); break;
    default: mostrar('s-inicio');
  }
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', ruta);
ruta();
