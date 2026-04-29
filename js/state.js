/* ============================================================
   state.js
   Estado global compartido entre pantallas.
   Persistencia en localStorage bajo la clave "constructorDeMundos".
   ============================================================ */

const CLAVE_ALMACEN = "constructorDeMundos";

const ESTADO_INICIAL = {
  tematica: null,
  nivelActual: 1,
  escenarioActual: {
    filas: 10,
    columnas: 10,
    grilla: [],
    objetos: []
  },
  programas: {},
  nivelesCompletados: []
};

const TEMATICAS = {
  trenes: {
    id: "trenes",
    nombre: "Trenes",
    icono: "🚂",
    objetos: [
      { id: "tren",       icono: "🚂", nombre: "Tren" },
      { id: "vagon",      icono: "🚃", nombre: "Vagón" },
      { id: "rieles",     icono: "🛤️", nombre: "Rieles" },
      { id: "estacion",   icono: "🚉", nombre: "Estación" },
      { id: "semaforo",   icono: "🚦", nombre: "Semáforo" },
      { id: "arbol",      icono: "🌳", nombre: "Árbol" },
      { id: "montania",   icono: "⛰️", nombre: "Montaña" },
      { id: "puente",     icono: "🌉", nombre: "Puente" }
    ]
  },
  espacio: {
    id: "espacio",
    nombre: "Espacio",
    icono: "🌌",
    objetos: [
      { id: "cohete",     icono: "🚀", nombre: "Cohete" },
      { id: "astronauta", icono: "👨‍🚀", nombre: "Astronauta" },
      { id: "planeta",    icono: "🪐", nombre: "Planeta" },
      { id: "estrella",   icono: "⭐", nombre: "Estrella" },
      { id: "luna",       icono: "🌕", nombre: "Luna" },
      { id: "satelite",   icono: "🛰️", nombre: "Satélite" },
      { id: "ovni",       icono: "🛸", nombre: "OVNI" },
      { id: "meteorito",  icono: "☄️", nombre: "Meteorito" }
    ]
  },
  animales: {
    id: "animales",
    nombre: "Animales",
    icono: "🐾",
    objetos: [
      { id: "perro",      icono: "🐶", nombre: "Perro" },
      { id: "gato",       icono: "🐱", nombre: "Gato" },
      { id: "conejo",     icono: "🐰", nombre: "Conejo" },
      { id: "zorro",      icono: "🦊", nombre: "Zorro" },
      { id: "oso",        icono: "🐻", nombre: "Oso" },
      { id: "arbol",      icono: "🌳", nombre: "Árbol" },
      { id: "flor",       icono: "🌸", nombre: "Flor" },
      { id: "hueso",      icono: "🦴", nombre: "Hueso" }
    ]
  },
  ciudad: {
    id: "ciudad",
    nombre: "Ciudad",
    icono: "🏙️",
    objetos: [
      { id: "edificio",   icono: "🏢", nombre: "Edificio" },
      { id: "casa",       icono: "🏠", nombre: "Casa" },
      { id: "auto",       icono: "🚗", nombre: "Auto" },
      { id: "bicicleta",  icono: "🚲", nombre: "Bicicleta" },
      { id: "persona",    icono: "🚶", nombre: "Persona" },
      { id: "semaforo",   icono: "🚦", nombre: "Semáforo" },
      { id: "arbol",      icono: "🌳", nombre: "Árbol" },
      { id: "tienda",     icono: "🏪", nombre: "Tienda" }
    ]
  },
  videojuego: {
    id: "videojuego",
    nombre: "Videojuego retro",
    icono: "🎮",
    objetos: [
      { id: "heroe",      icono: "🦸", nombre: "Héroe" },
      { id: "enemigo",    icono: "👾", nombre: "Enemigo" },
      { id: "moneda",     icono: "🪙", nombre: "Moneda" },
      { id: "corazon",    icono: "❤️", nombre: "Vida" },
      { id: "llave",      icono: "🗝️", nombre: "Llave" },
      { id: "puerta",     icono: "🚪", nombre: "Puerta" },
      { id: "pared",      icono: "🧱", nombre: "Pared" },
      { id: "estrella",   icono: "⭐", nombre: "Estrella" }
    ]
  }
};

const NIVELES = [
  {
    numero: 1,
    nombre: "Secuencia básica",
    objetivo: "Hacer que un objeto siga un camino fijo de al menos 4 pasos.",
    criterioExito: "El nivel está completo cuando un objeto se mueve 4 o más pasos al iniciar la simulación.",
    conceptos: ["MOVIMIENTO", "EVENTOS"]
  },
  {
    numero: 2,
    nombre: "Eventos",
    objetivo: "Hacer que un objeto se mueva cuando presionás una tecla.",
    criterioExito: "El nivel está completo cuando un objeto reacciona a una tecla del teclado.",
    conceptos: ["EVENTOS", "MOVIMIENTO"]
  },
  {
    numero: 3,
    nombre: "Condicionales",
    objetivo: "Programar un comportamiento que ocurra solo si una condición se cumple.",
    criterioExito: "El nivel está completo cuando un objeto usa un bloque 'si entonces' al menos una vez.",
    conceptos: ["CONTROL", "EVENTOS"]
  },
  {
    numero: 4,
    nombre: "Bucles",
    objetivo: "Hacer que una acción se repita varias veces seguidas.",
    criterioExito: "El nivel está completo cuando se usa un bloque 'repetir N veces' con N mayor o igual a 3.",
    conceptos: ["CONTROL", "MOVIMIENTO"]
  },
  {
    numero: 5,
    nombre: "Variables",
    objetivo: "Crear una variable y modificar su valor durante la simulación.",
    criterioExito: "El nivel está completo cuando una variable cambia de valor al menos una vez.",
    conceptos: ["VARIABLES", "EVENTOS"]
  },
  {
    numero: 6,
    nombre: "Rutinas",
    objetivo: "Definir una secuencia de pasos y reutilizarla en distintos momentos.",
    criterioExito: "El nivel está completo cuando una rutina se ejecuta dos veces o más.",
    conceptos: ["CONTROL", "VARIABLES", "MOVIMIENTO"]
  }
];

const Estado = {
  cargar() {
    try {
      const datos = localStorage.getItem(CLAVE_ALMACEN);
      if (!datos) return JSON.parse(JSON.stringify(ESTADO_INICIAL));
      const parseado = JSON.parse(datos);
      return Object.assign(JSON.parse(JSON.stringify(ESTADO_INICIAL)), parseado);
    } catch (e) {
      return JSON.parse(JSON.stringify(ESTADO_INICIAL));
    }
  },

  guardar(estado) {
    localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(estado));
  },

  reiniciar() {
    localStorage.removeItem(CLAVE_ALMACEN);
  },

  setTematica(idTematica) {
    const estado = Estado.cargar();
    estado.tematica = idTematica;
    estado.escenarioActual = {
      filas: 10,
      columnas: 10,
      grilla: [],
      objetos: []
    };
    estado.programas = {};
    Estado.guardar(estado);
  },

  getTematica() {
    const estado = Estado.cargar();
    if (!estado.tematica) return null;
    return TEMATICAS[estado.tematica] || null;
  },

  setNivelActual(numero) {
    const estado = Estado.cargar();
    estado.nivelActual = numero;
    Estado.guardar(estado);
  },

  marcarNivelCompletado(numero) {
    const estado = Estado.cargar();
    if (!estado.nivelesCompletados.includes(numero)) {
      estado.nivelesCompletados.push(numero);
    }
    Estado.guardar(estado);
  },

  nivelEstaDesbloqueado(numero) {
    if (numero === 1) return true;
    const estado = Estado.cargar();
    return estado.nivelesCompletados.includes(numero - 1);
  },

  setEscenario(escenario) {
    const estado = Estado.cargar();
    estado.escenarioActual = escenario;
    Estado.guardar(estado);
  },

  getEscenario() {
    return Estado.cargar().escenarioActual;
  },

  setProgramas(programas) {
    const estado = Estado.cargar();
    estado.programas = programas;
    Estado.guardar(estado);
  },

  getProgramas() {
    return Estado.cargar().programas || {};
  }
};

if (typeof window !== "undefined") {
  window.Estado = Estado;
  window.TEMATICAS = TEMATICAS;
  window.NIVELES = NIVELES;
}
