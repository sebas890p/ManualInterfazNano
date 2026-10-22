/* =========================================================
   Agente Nano · la rueda en 3D (Three.js)
   Construye la rueda con piezas simples y expone los modos:
   vista general, transparencia, acercamiento, corte y despiece.
   ========================================================= */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* Tipos de pieza: nombre y descripción corta (se usan en la lista y en las etiquetas) */
export const PIEZAS = [
  { id: 'nucleo',     nombre: 'Núcleo cósmico',          desc: 'Centro de energía: aquí quedó guardada la esfera de luz.' },
  { id: 'soporte',    nombre: 'Soporte con logo',        desc: 'Sostiene la rueda a cada lado y lleva el logo de electricidad.' },
  { id: 'panel',      nombre: 'Panel transparente',      desc: 'Tapa lateral con constelaciones.' },
  { id: 'aro',        nombre: 'Aro de sujeción',         desc: 'Fija cada panel a la rueda.' },
  { id: 'superficie', nombre: 'Superficie de carrera',   desc: 'Pista antideslizante donde corre Nano.' },
  { id: 'estructura', nombre: 'Estructura interna',      desc: 'Radios con conductos que reparten la energía.' },
  { id: 'eje',        nombre: 'Eje de rotación',         desc: 'Une el núcleo con los soportes.' },
  { id: 'rodamiento', nombre: 'Rodamiento de precisión', desc: 'Deja que el eje gire sin fricción.' },
  { id: 'base',       nombre: 'Base con amortiguación',  desc: 'Une los soportes y absorbe la vibración.' }
];
const NOMBRE = Object.fromEntries(PIEZAS.map(p => [p.id, p.nombre]));
const DESC = Object.fromEntries(PIEZAS.map(p => [p.id, p.desc]));

const TINTA = 0x26252f;
const C = { claro: 0xeceaf1, medio: 0xc9c8d2, interno: 0xb9b6c8, oscuro: 0x5c5a6b, logo: 0x3a3946, panel: 0xf6f6fa };
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

/* Direcciones de cámara (desde el centro de la rueda hacia la cámara) */
const DIR = {
  inicial: V(-0.8, 0.35, 1),
  frente: V(0.02, 0.06, 1),
  lado: V(1, 0.12, 0.02),
  arriba: V(0.08, 1, 0.12),
  explotado: V(0.9, 0.55, 1),
  despiece: V(0.02, 0.8, 1),
  longitudinal: V(1, 0.4, 0.55),
  transversal: V(0.45, 0.4, 1)
};

function texturaRayado() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#d6d5de';
  g.fillRect(0, 0, 64, 64);
  g.strokeStyle = '#26252f';
  g.lineWidth = 3;
  for (let i = -64; i < 128; i += 12) { g.beginPath(); g.moveTo(i, 64); g.lineTo(i + 64, 0); g.stroke(); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 5);
  return t;
}

export function crearRueda(contenedor, op = {}) {
  /* ---------- escena ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.localClippingEnabled = true;
  renderer.setClearColor(0xfafafb, 1);
  renderer.domElement.className = 'principal';
  contenedor.prepend(renderer.domElement);

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(38, 1, 0.05, 200);
  const controles = new OrbitControls(camara, renderer.domElement);
  controles.enableDamping = true;
  controles.dampingFactor = 0.08;
  controles.minDistance = 0.5;
  controles.maxDistance = 30;

  escena.add(new THREE.HemisphereLight(0xffffff, 0xcfcfd8, 1.15));
  const luz = new THREE.DirectionalLight(0xffffff, 0.9);
  luz.position.set(-3, 5, 4);
  escena.add(luz);
  const suelo = new THREE.GridHelper(18, 36, 0xcfcfd8, 0xe8e8ee);
  suelo.position.y = -1.32;
  escena.add(suelo);

  /* plano de corte compartido por todos los materiales */
  const plano = new THREE.Plane(V(0, 0, -1), 1e5);
  const planos = [plano];
  const rayado = texturaRayado();

  const mallas = [];   // todas las mallas seleccionables
  const lineasExtra = []; // constelaciones y estrías (siguen la opacidad de su pieza)
  const partes = [];   // instancias (soporte izquierdo, soporte derecho, ...)
  const porClave = {};

  function malla(geo, color, o = {}) {
    const mat = new THREE.MeshLambertMaterial({
      color, transparent: true, opacity: o.opacidad ?? 1, clippingPlanes: planos,
      polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1
    });
    mat.depthWrite = (o.opacidad ?? 1) > 0.95;
    const m = new THREE.Mesh(geo, mat);
    const bordes = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo, o.umbral ?? 28),
      new THREE.LineBasicMaterial({ color: TINTA, transparent: true, clippingPlanes: planos })
    );
    m.add(bordes);
    const corteRayado = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: rayado, side: THREE.BackSide, clippingPlanes: planos }));
    corteRayado.visible = false;
    m.add(corteRayado);
    m.userData = { colorBase: color, opBase: o.opacidad ?? 1, bordes, corteRayado };
    return m;
  }
  function lineas(puntos, opacidad = 0.5) {
    const g = new THREE.BufferGeometry().setFromPoints(puntos);
    const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: TINTA, transparent: true, opacity: opacidad, clippingPlanes: planos }));
    l.userData.opBase = opacidad;
    return l;
  }
  function parte(tipo, clave, grupo, casa, explotado, etiqueta = true) {
    grupo.position.copy(casa);
    escena.add(grupo);
    const p = {
      tipo, clave, grupo, etiqueta,
      casa: casa.clone(), exp: explotado.clone(), grilla: casa.clone(), objetivo: casa.clone(), giro: 0,
      interno: ['estructura', 'nucleo', 'eje'].includes(tipo), lineas: []
    };
    grupo.traverse(o => {
      if (o.isMesh && o.userData.bordes) { o.userData.parte = p; mallas.push(o); }
      if (o.isLineSegments && o.userData.opBase !== undefined) { o.userData.parte = p; p.lineas.push(o); lineasExtra.push(o); }
    });
    partes.push(p);
    porClave[clave] = p;
    return p;
  }

  /* ---------- piezas ----------
     Rueda de hámster de frente: el eje de giro apunta hacia quien mira (eje Z).
     Adelante queda abierta (aro + panel en forma de anillo) para que Nano entre;
     atrás está el panel con constelaciones, los radios y el núcleo.
     Los dos soportes en A van de perfil a cada costado, con el logo hacia afuera,
     y tocan la rueda con un rodamiento a la altura del centro. */
  const R = 1.0;          // radio de la rueda
  const PROF = 0.35;      // media profundidad del tambor
  const XS = 1.1;         // distancia de cada soporte al centro
  const XB = 1.1, ZB = 0.85; // medidas de la base

  function soporte(lado) {
    const g = new THREE.Group();
    const dentro = new THREE.Group();          // se gira para quedar de perfil con el logo hacia afuera
    dentro.rotation.y = lado * Math.PI / 2;
    g.add(dentro);
    const s = new THREE.Shape();
    s.moveTo(-0.85, -1.22); s.lineTo(0.85, -1.22); s.lineTo(0.14, 0.14);
    s.quadraticCurveTo(0, 0.27, -0.14, 0.14); s.closePath();
    const ventana = new THREE.Path(); ventana.moveTo(0, -0.25); ventana.lineTo(0.55, -1.08); ventana.lineTo(-0.55, -1.08); ventana.closePath(); s.holes.push(ventana);
    const hueco = new THREE.Path(); hueco.absarc(0, 0, 0.06, 0, Math.PI * 2, true); s.holes.push(hueco);
    dentro.add(malla(new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: false, curveSegments: 20 }).translate(0, 0, -0.05), C.claro));
    const tri = new THREE.Shape();
    tri.moveTo(0, -0.27); tri.lineTo(0.54, -1.07); tri.lineTo(-0.54, -1.07); tri.closePath();
    dentro.add(malla(new THREE.ExtrudeGeometry(tri, { depth: 0.04, bevelEnabled: false }).translate(0, 0, -0.02), C.logo));
    const r = new THREE.Shape();
    [[0.06, -0.52], [-0.12, -0.78], [-0.02, -0.78], [-0.08, -0.98], [0.13, -0.69], [0.02, -0.69]].forEach(([a, b], i) => i ? r.lineTo(a, b) : r.moveTo(a, b));
    r.closePath();
    [1, -1].forEach(cara => {
      const rayo = malla(new THREE.ShapeGeometry(r).rotateY(cara < 0 ? Math.PI : 0), C.panel);
      rayo.position.z = cara * 0.023;
      dentro.add(rayo);
    });
    return g;
  }
  function rodamiento() {
    // perno + rodamiento: une la punta del soporte con el costado de la rueda
    const g = new THREE.Group();
    g.add(malla(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 20).rotateZ(Math.PI / 2), C.oscuro));
    g.add(malla(new THREE.TorusGeometry(0.1, 0.035, 12, 32).rotateY(Math.PI / 2), C.medio));
    return g;
  }
  const ESTRELLAS = [[-0.6, 0.5], [-0.2, 0.72], [0.15, 0.45], [0.55, 0.6], [0.72, 0.15], [0.3, -0.05], [-0.1, 0.1], [-0.5, -0.1], [-0.7, -0.5], [-0.25, -0.55], [0.2, -0.6], [0.6, -0.45], [0, -0.86]];
  const UNIONES = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 2], [5, 6], [6, 7], [7, 0], [7, 8], [8, 9], [9, 6], [9, 10], [10, 11], [11, 4], [10, 5], [9, 12], [10, 12]];
  function panelTrasero() {
    const g = new THREE.Group();
    g.add(malla(new THREE.CylinderGeometry(R, R, 0.025, 72).rotateX(Math.PI / 2), C.panel, { opacidad: 0.78 }));
    const pts = [];
    UNIONES.forEach(([a, b]) => {
      pts.push(V(ESTRELLAS[a][0] * 0.85, ESTRELLAS[a][1] * 0.85, 0.014));
      pts.push(V(ESTRELLAS[b][0] * 0.85, ESTRELLAS[b][1] * 0.85, 0.014));
    });
    g.add(lineas(pts, 0.55));
    return g;
  }
  function panelDelantero() {
    // anillo transparente: deja el centro abierto para que Nano entre
    const g = new THREE.Group();
    const perfil = [new THREE.Vector2(0.64, -0.0125), new THREE.Vector2(R, -0.0125), new THREE.Vector2(R, 0.0125), new THREE.Vector2(0.64, 0.0125), new THREE.Vector2(0.64, -0.0125)];
    g.add(malla(new THREE.LatheGeometry(perfil, 72).rotateX(Math.PI / 2), C.panel, { opacidad: 0.78 }));
    const pts = [];
    let prev = null;
    for (let i = 0; i <= 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const rr = i % 2 ? 0.74 : 0.9;
      const p = V(Math.cos(a) * rr, Math.sin(a) * rr, 0.014);
      if (prev) pts.push(prev, p);
      prev = p;
    }
    g.add(lineas(pts, 0.55));
    return g;
  }
  function aro() {
    const g = new THREE.Group();
    g.add(malla(new THREE.TorusGeometry(R - 0.01, 0.03, 10, 96), C.medio));
    return g;
  }
  function superficie() {
    const g = new THREE.Group();
    const perfil = [new THREE.Vector2(0.93, -PROF), new THREE.Vector2(0.97, -PROF), new THREE.Vector2(0.97, PROF), new THREE.Vector2(0.93, PROF), new THREE.Vector2(0.93, -PROF)];
    g.add(malla(new THREE.LatheGeometry(perfil, 72).rotateX(Math.PI / 2), C.claro));
    const pts = [];
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      pts.push(V(c * 0.973, s * 0.973, -PROF + 0.02), V(c * 0.973, s * 0.973, PROF - 0.02));   // estrías por fuera
      pts.push(V(c * 0.927, s * 0.927, -PROF + 0.02), V(c * 0.927, s * 0.927, PROF - 0.02));   // pista antideslizante por dentro
    }
    g.add(lineas(pts, 0.35));
    return g;
  }
  function estructura() {
    const g = new THREE.Group();
    g.add(malla(new THREE.TorusGeometry(0.9, 0.025, 8, 72), C.interno));
    g.add(malla(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 24).rotateX(Math.PI / 2), C.interno));
    for (let i = 0; i < 8; i++) {
      const geo = new THREE.BoxGeometry(0.05, 0.78, 0.04).translate(0, 0.5, 0).rotateZ(i * Math.PI / 4);
      g.add(malla(geo, C.interno));
    }
    return g;
  }
  function nucleo() {
    const g = new THREE.Group();
    g.add(malla(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 40).rotateX(Math.PI / 2), C.interno));
    const lente = malla(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 40).rotateX(Math.PI / 2), 0xffffff);
    lente.position.z = 0.16;
    g.add(lente);
    const anillo = malla(new THREE.TorusGeometry(0.17, 0.02, 8, 40), C.medio);
    anillo.position.z = 0.155;
    g.add(anillo);
    for (let i = 0; i < 8; i++) {
      const geo = new THREE.BoxGeometry(0.07, 0.08, 0.06).translate(0, 0.225, 0).rotateZ(i * Math.PI / 4 + Math.PI / 8);
      g.add(malla(geo, C.medio));
    }
    return g;
  }
  function eje() {
    // eje corto: del núcleo al panel trasero
    const g = new THREE.Group();
    g.add(malla(new THREE.CylinderGeometry(0.045, 0.045, 0.42, 20).rotateX(Math.PI / 2), C.medio));
    return g;
  }
  function base() {
    const g = new THREE.Group();
    [-ZB, ZB].forEach(z => { const m = malla(new THREE.BoxGeometry(2 * XB + 0.08, 0.06, 0.08), C.medio); m.position.set(0, -1.25, z); g.add(m); });
    [-XB, XB].forEach(x => { const m = malla(new THREE.BoxGeometry(0.08, 0.06, 2 * ZB + 0.08), C.medio); m.position.set(x, -1.25, 0); g.add(m); });
    [-XB, XB].forEach(x => [-ZB, ZB].forEach(z => { const m = malla(new THREE.BoxGeometry(0.18, 0.05, 0.18), C.oscuro); m.position.set(x, -1.3, z); g.add(m); }));
    return g;
  }

  // la rueda, de adelante hacia atrás
  parte('panel', 'panelF', panelDelantero(), V(0, 0, PROF + 0.02), V(0, 0, 2.8));
  parte('aro', 'aroF', aro(), V(0, 0, PROF + 0.005), V(0, 0, 2.2));
  parte('superficie', 'superficie', superficie(), V(0), V(0, 0, 1.3));
  parte('nucleo', 'nucleo', nucleo(), V(0, 0, -0.15), V(0, 0, 0.4));
  parte('estructura', 'estructura', estructura(), V(0, 0, -0.3), V(0, 0, -0.3));
  parte('aro', 'aroT', aro(), V(0, 0, -PROF - 0.005), V(0, 0, -0.9), false);
  parte('panel', 'panelT', panelTrasero(), V(0, 0, -PROF - 0.02), V(0, 0, -1.4), false);
  parte('eje', 'eje', eje(), V(0, 0, -0.2), V(0, 0, -1.95));
  // a los costados
  parte('rodamiento', 'rodamientoI', rodamiento(), V(-1.03, 0, 0), V(-2.3, 0, 0)).lado = -1;
  parte('rodamiento', 'rodamientoD', rodamiento(), V(1.03, 0, 0), V(2.3, 0, 0), false).lado = 1;
  parte('soporte', 'soporteI', soporte(-1), V(-XS, 0, 0), V(-3.3, 0, 0)).lado = -1;
  parte('soporte', 'soporteD', soporte(1), V(XS, 0, 0), V(3.3, 0, 0), false).lado = 1;
  parte('base', 'base', base(), V(0), V(0, -1.0, 0));

  /* posiciones del despiece ordenado (todas las piezas a la vista en una cuadrícula) */
  const ordenGrilla = ['soporteI', 'panelF', 'aroF', 'superficie', 'estructura', 'nucleo', 'eje', 'rodamientoI', 'rodamientoD', 'aroT', 'panelT', 'soporteD', 'base'];
  ordenGrilla.forEach((k, i) => {
    const col = i % 5, fila = Math.floor(i / 5);
    const p = porClave[k];
    p.grilla.set((col - 2) * 2.9, p.tipo === 'base' ? 0.6 : 0, (fila - 1) * 3.0);
  });

  /* caja de cada pieza en su posición armada (para encuadres y etiquetas) */
  partes.forEach(p => {
    p.caja = new THREE.Box3().setFromObject(p.grupo);
  });
  const cajaArmada = new THREE.Box3();
  partes.forEach(p => cajaArmada.union(p.caja));

  /* plano visible del corte */
  const planoVista = new THREE.Mesh(
    new THREE.PlaneGeometry(3.0, 2.9),
    new THREE.MeshBasicMaterial({ color: 0x5b3fd0, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false })
  );
  planoVista.add(new THREE.LineSegments(new THREE.EdgesGeometry(planoVista.geometry), new THREE.LineBasicMaterial({ color: 0x5b3fd0 })));
  planoVista.visible = false;
  escena.add(planoVista);

  /* caja de resaltado para el acercamiento */
  const resalte = new THREE.BoxHelper(undefined, 0x5b3fd0);
  resalte.visible = false;
  escena.add(resalte);

  /* ---------- estado ---------- */
  const est = {
    modo: 'general', transp: 65, resaltar: true, foco: 'nucleo', zoom: 3,
    corte: 'longitudinal', posCorte: 0.5, rayado: true,
    despiece: 'explotado', sep: 1, camMeta: null
  };

  /* ---------- cámara ---------- */
  function encuadrar(caja, dir, margen = 1.15, inmediato = false) {
    const esfera = caja.getBoundingSphere(new THREE.Sphere());
    const fov = THREE.MathUtils.degToRad(camara.fov);
    let dist = esfera.radius / Math.sin(fov / 2) * margen;
    if (camara.aspect < 1) dist /= Math.max(camara.aspect, 0.45);
    const pos = esfera.center.clone().add(dir.clone().normalize().multiplyScalar(dist));
    if (inmediato) { camara.position.copy(pos); controles.target.copy(esfera.center); est.camMeta = null; }
    else est.camMeta = { pos, target: esfera.center.clone() };
  }
  function dirActual() { return camara.position.clone().sub(controles.target).normalize(); }
  controles.addEventListener('start', () => { est.camMeta = null; });

  function cajaObjetivo() {
    const b = new THREE.Box3();
    partes.forEach(p => {
      const d = p.objetivo.clone().sub(p.casa);
      b.union(p.caja.clone().translate(d));
    });
    return b;
  }

  /* ---------- apariencia según el modo ---------- */
  function aplicar() {
    const cortando = est.modo === 'corte';
    for (const m of mallas) {
      const p = m.userData.parte;
      let opac = m.userData.opBase;
      let color = m.userData.colorBase;
      if (est.modo === 'transparencia') {
        if (!p.interno) opac = Math.min(opac, Math.max(0.04, 1 - est.transp / 100));
        else if (est.resaltar) color = 0x8f8ba8;
      }
      if (est.modo === 'acercamiento' && p.tipo !== est.foco) opac = Math.min(opac, 0.1);
      if (cortando && m.userData.opBase < 1) opac = 0.55;
      m.material.opacity = opac;
      m.material.depthWrite = opac > 0.95;
      m.material.color.setHex(color);
      m.userData.bordes.material.opacity = Math.max(opac, 0.12);
      m.userData.corteRayado.visible = cortando && est.rayado;
    }
    for (const l of lineasExtra) {
      const p = l.userData.parte;
      let opac = l.userData.opBase;
      if (est.modo === 'transparencia' && !p.interno) opac *= Math.max(0.15, 1 - est.transp / 100);
      if (est.modo === 'acercamiento' && p.tipo !== est.foco) opac = 0.05;
      l.material.opacity = opac;
    }
  }

  function aplicarCorte() {
    if (est.modo !== 'corte') { plano.constant = 1e5; planoVista.visible = false; return; }
    if (est.corte === 'longitudinal') {
      const c = THREE.MathUtils.lerp(-1.3, 1.3, est.posCorte);
      plano.normal.set(-1, 0, 0); plano.constant = c;
      planoVista.rotation.set(0, Math.PI / 2, 0); planoVista.position.set(c, -0.1, 0);
    } else {
      const c = THREE.MathUtils.lerp(-0.6, 0.6, est.posCorte);
      plano.normal.set(0, 0, -1); plano.constant = c;
      planoVista.rotation.set(0, 0, 0); planoVista.position.set(0, -0.1, c);
    }
    planoVista.visible = true;
  }

  function objetivosDespiece() {
    partes.forEach(p => {
      if (est.modo !== 'despiece') { p.objetivo.copy(p.casa); p.giro = 0; return; }
      const meta = est.despiece === 'explotado' ? p.exp : p.grilla;
      p.objetivo.copy(p.casa).lerp(meta, est.sep);
      p.giro = est.despiece === 'despiece' && p.lado ? -p.lado * Math.PI / 2 * est.sep : 0;
    });
  }

  function enfocar(inmediato = false) {
    const p = partes.find(x => x.tipo === est.foco);
    if (!p) return;
    const caja = new THREE.Box3().setFromObject(p.grupo);
    resalte.setFromObject(p.grupo);
    const factor = THREE.MathUtils.mapLinear(est.zoom, 1, 5, 2.4, 0.95);
    let dir = dirActual();
    if (p.tipo === 'panel' || p.tipo === 'nucleo' || p.tipo === 'estructura' || p.tipo === 'soporte') dir = V(0.45, 0.32, 1);
    if (p.tipo === 'soporte' || p.tipo === 'rodamiento') dir = V(-1, 0.35, 0.45);
    if (p.tipo === 'eje') dir = V(0.9, 0.5, 0.6);
    encuadrar(caja, dir, factor, inmediato);
  }

  /* ---------- etiquetas ---------- */
  const capa = op.etiquetas;
  const spans = new Map();
  partes.filter(p => p.etiqueta).forEach(p => {
    const s = document.createElement('span');
    s.textContent = NOMBRE[p.tipo];
    s.style.display = 'none';
    capa && capa.appendChild(s);
    spans.set(p, s);
  });
  const tmp = V();
  function actualizarEtiquetas(w, h) {
    const mostrar = est.modo === 'despiece' && est.sep > 0.55;
    let i = 0;
    spans.forEach((s, p) => {
      if (!mostrar) { s.style.display = 'none'; return; }
      const d = p.grupo.position.clone().sub(p.casa);
      const c = p.caja.getCenter(V()).add(d);
      const abajo = est.despiece === 'explotado' && (i++ % 2 === 1) && p.tipo !== 'base';
      tmp.set(c.x, (abajo ? p.caja.min.y - 0.08 : p.caja.max.y + 0.08) + d.y, c.z).project(camara);
      s.style.transform = abajo ? 'translate(-50%, 0)' : 'translate(-50%, -100%)';
      if (tmp.z > 1) { s.style.display = 'none'; return; }
      s.style.display = 'block';
      s.style.left = ((tmp.x + 1) / 2 * w) + 'px';
      s.style.top = ((1 - tmp.y) / 2 * h) + 'px';
    });
  }

  /* ---------- selección con el mouse ---------- */
  const ray = new THREE.Raycaster();
  const puntero = new THREE.Vector2();
  function piezaEn(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    puntero.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(puntero, camara);
    const visibles = mallas.filter(m => m.material.opacity > 0.2);
    const hits = ray.intersectObjects(visibles, false).filter(h => !(plano.constant < 1e4 && plano.distanceToPoint(h.point) < 0));
    return hits.length ? hits[0].object.userData.parte : null;
  }
  let abajo = null;
  renderer.domElement.addEventListener('pointerdown', e => { abajo = { x: e.clientX, y: e.clientY }; });
  renderer.domElement.addEventListener('pointerup', e => {
    if (!abajo) return;
    const movido = Math.hypot(e.clientX - abajo.x, e.clientY - abajo.y);
    abajo = null;
    if (movido > 5) return;
    const p = piezaEn(e);
    if (p && op.alElegir) op.alElegir(p.tipo);
  });
  renderer.domElement.addEventListener('pointermove', e => {
    if (e.buttons) { op.alPasar && op.alPasar(null); return; }
    const p = piezaEn(e);
    const r = renderer.domElement.getBoundingClientRect();
    op.alPasar && op.alPasar(p ? { nombre: NOMBRE[p.tipo], desc: DESC[p.tipo] } : null, e.clientX - r.left, e.clientY - r.top);
    renderer.domElement.style.cursor = p ? 'pointer' : 'grab';
  });
  renderer.domElement.addEventListener('pointerleave', () => op.alPasar && op.alPasar(null));

  /* ---------- mini vista "Dónde estás" ---------- */
  let mini = null;
  if (op.miniCanvas) {
    const r2 = new THREE.WebGLRenderer({ canvas: op.miniCanvas, antialias: true });
    r2.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r2.setSize(190, 130, false);
    r2.setClearColor(0xffffff, 1);
    r2.autoClear = false;
    const cam2 = new THREE.PerspectiveCamera(38, 190 / 130, 0.05, 100);
    const esf = cajaArmada.getBoundingSphere(new THREE.Sphere());
    cam2.position.copy(esf.center).add(DIR.inicial.clone().normalize().multiplyScalar(esf.radius / Math.sin(THREE.MathUtils.degToRad(19)) * 1.05));
    cam2.lookAt(esf.center);
    const gris = new THREE.MeshBasicMaterial({ color: 0xdedde5 });
    const escenaCaja = new THREE.Scene();
    const cajaMini = new THREE.BoxHelper(undefined, 0x5b3fd0);
    escenaCaja.add(cajaMini);
    mini = { r2, cam2, gris, escenaCaja, cajaMini };
  }

  /* ---------- tamaño ---------- */
  function ajustar() {
    const w = contenedor.clientWidth, h = contenedor.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
  }
  new ResizeObserver(ajustar).observe(contenedor);
  ajustar();
  encuadrar(cajaArmada, DIR.inicial, 1.12, true);

  /* ---------- bucle ---------- */
  function cuadro() {
    requestAnimationFrame(cuadro);
    if (!contenedor.offsetParent) return; // pantalla oculta: no dibujar
    partes.forEach(p => { p.grupo.position.lerp(p.objetivo, 0.12); p.grupo.rotation.y += (p.giro - p.grupo.rotation.y) * 0.12; });
    if (est.camMeta) {
      camara.position.lerp(est.camMeta.pos, 0.12);
      controles.target.lerp(est.camMeta.target, 0.12);
      if (camara.position.distanceTo(est.camMeta.pos) < 0.002) est.camMeta = null;
    }
    controles.update();
    renderer.render(escena, camara);
    actualizarEtiquetas(contenedor.clientWidth, contenedor.clientHeight);
    if (mini && est.modo === 'acercamiento') {
      mini.r2.clear();
      escena.overrideMaterial = mini.gris;
      const vis = [resalte.visible, planoVista.visible];
      resalte.visible = false; planoVista.visible = false;
      mini.r2.render(escena, mini.cam2);
      escena.overrideMaterial = null;
      [resalte.visible, planoVista.visible] = vis;
      const p = partes.find(x => x.tipo === est.foco);
      if (p) mini.cajaMini.setFromObject(p.grupo);
      mini.r2.clearDepth();
      mini.r2.render(mini.escenaCaja, mini.cam2);
    }
  }
  cuadro();

  /* ---------- API ---------- */
  const api = {
    piezas: PIEZAS,
    modo(m) {
      const antes = est.modo;
      est.modo = m;
      resalte.visible = m === 'acercamiento';
      objetivosDespiece();
      aplicarCorte();
      aplicar();
      if (m === 'acercamiento') enfocar();
      else if (m === 'despiece') encuadrar(cajaObjetivo(), est.despiece === 'explotado' ? DIR.explotado : DIR.despiece, est.despiece === 'explotado' ? 0.82 : 0.95);
      else if (m === 'corte') encuadrar(cajaArmada, est.corte === 'transversal' ? DIR.transversal : DIR.longitudinal, 1.12);
      else if (antes === 'acercamiento' || antes === 'despiece' || antes === 'corte' || m === 'general') encuadrar(cajaArmada, antes === 'general' && m === 'general' ? dirActual() : DIR.inicial, 1.12);
    },
    vista(nombre) { encuadrar(cajaArmada, DIR[nombre] || DIR.inicial, 1.12); },
    transparencia(v) { est.transp = v; aplicar(); },
    resaltarInternas(b) { est.resaltar = b; aplicar(); },
    foco(tipo) { est.foco = tipo; aplicar(); if (est.modo === 'acercamiento') enfocar(); },
    zoom(z) { est.zoom = z; if (est.modo === 'acercamiento') enfocar(); },
    corte(tipo, pos) {
      const cambio = tipo !== est.corte;
      est.corte = tipo; est.posCorte = pos; aplicarCorte();
      if (cambio && est.modo === 'corte') encuadrar(cajaArmada, tipo === 'transversal' ? DIR.transversal : DIR.longitudinal, 1.12);
    },
    rayado(b) { est.rayado = b; aplicar(); },
    despiece(tipo, sep) {
      const cambio = tipo !== est.despiece;
      est.despiece = tipo; est.sep = sep; objetivosDespiece();
      if (est.modo === 'despiece' && (cambio || sep === 1 || sep === 0)) encuadrar(cajaObjetivo(), tipo === 'explotado' ? DIR.explotado : DIR.despiece, tipo === 'explotado' ? 0.82 : 0.95);
    },
    estado: est
  };
  return api;
}
