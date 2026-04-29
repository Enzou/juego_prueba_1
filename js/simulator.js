/* ============================================================
   simulator.js — Motor de simulación.
   Fase: PROBAR / AJUSTAR.

   Modelo:
   - Cada objeto del escenario tiene posición (fila, col), variables y
     una lista de "rutinas" extraídas de los bloques.
   - Las rutinas con evento (alIniciar, alPresionar, alTocar) corren
     cuando se dispara su evento. El loop principal avanza un "tick"
     cada cierto intervalo y procesa una instrucción por rutina activa.
   ============================================================ */

(function() {
  const FILAS = 10, COLUMNAS = 10;
  const TAM_CANVAS = 500;
  const TAM_CELDA = TAM_CANVAS / FILAS;
  const INTERVALO_TICK_MS = 200;

  const infoTematica  = document.getElementById("infoTematica");
  const tituloNivel   = document.getElementById("tituloNivel");
  const objetivoNivel = document.getElementById("objetivoNivel");
  const canvas        = document.getElementById("canvasMundo");
  const ctx           = canvas.getContext("2d");
  const estadoObjetos = document.getElementById("estadoObjetos");
  const estadoVars    = document.getElementById("estadoVariables");
  const estadoSim     = document.getElementById("estadoSim");
  const consolaErr    = document.getElementById("consolaErrores");
  const textoError    = document.getElementById("textoError");
  const zonaMensaje   = document.getElementById("zonaMensaje");

  const botonIniciar    = document.getElementById("botonIniciar");
  const botonPausar     = document.getElementById("botonPausar");
  const botonDetener    = document.getElementById("botonDetener");
  const botonPaso       = document.getElementById("botonPaso");
  const botonVolverProg = document.getElementById("botonVolverProg");

  let tematica = null;
  let escenario = null;
  let programas = {};
  let nivel = null;

  let mundo = null;
  let timer = null;
  let estadoEjecucion = "detenido"; // "detenido" | "corriendo" | "pausado"

  function mostrarMensaje(texto, tipo) {
    zonaMensaje.innerHTML = "";
    if (!texto) return;
    const div = document.createElement("div");
    div.className = "mensaje " + (tipo || "info");
    div.textContent = texto;
    zonaMensaje.appendChild(div);
  }

  function mostrarError(texto) {
    consolaErr.hidden = false;
    textoError.textContent = texto;
  }

  function ocultarError() {
    consolaErr.hidden = true;
    textoError.textContent = "";
  }

  function inicializar() {
    tematica = Estado.getTematica();
    escenario = Estado.getEscenario();
    programas = Estado.getProgramas() || {};

    if (!tematica) { window.location.href = "index.html"; return; }
    if (!escenario || !escenario.objetos || escenario.objetos.length < 2) {
      window.location.href = "designer.html";
      return;
    }

    const estado = Estado.cargar();
    nivel = NIVELES.find(function(n) { return n.numero === estado.nivelActual; }) || NIVELES[0];
    tituloNivel.textContent = "Nivel " + nivel.numero + ": " + nivel.nombre;
    objetivoNivel.textContent = "Objetivo: " + nivel.objetivo + " " + nivel.criterioExito;
    infoTematica.textContent = "Temática: " + tematica.icono + " " + tematica.nombre + " · Nivel " + nivel.numero;

    construirMundo();
    dibujar();
    actualizarPaneles();
  }

  function construirMundo() {
    mundo = {
      objetos: escenario.objetos.map(function(o) {
        return {
          id: o.id,
          tipo: o.tipo,
          nombre: o.nombre,
          fila: o.fila,
          col: o.col,
          filaInicial: o.fila,
          colInicial: o.col,
          variables: {},
          rutinas: [],
          mensajeFlotante: null,
          mensajeFlotanteTicks: 0
        };
      }),
      teclasPresionadas: new Set(),
      criteriosCumplidos: {
        movioAlMenosUnPaso: 0,
        respondioATecla: false,
        usoSiEntonces: false,
        repetirGrande: 0,
        variableCambio: false,
        rutinasEjecutadas: 0
      }
    };

    mundo.objetos.forEach(function(obj) {
      const bloques = programas[obj.id] || [];
      bloques.forEach(function(b) {
        const r = construirRutinaDesdeBloqueRaiz(obj, b);
        if (r) obj.rutinas.push(r);
      });
    });
  }

  function construirRutinaDesdeBloqueRaiz(obj, bloqueRaiz) {
    if (bloqueRaiz.tipo === "alIniciar") {
      return { evento: "iniciar", instrucciones: aplanar(bloqueRaiz.hijos || []), pc: 0, activa: false, terminada: false, esperaHasta: 0, bloqueRaizId: bloqueRaiz.id };
    }
    if (bloqueRaiz.tipo === "alPresionar") {
      return { evento: "tecla", tecla: (bloqueRaiz.parametros || {}).tecla, instrucciones: aplanar(bloqueRaiz.hijos || []), pc: 0, activa: false, terminada: true, esperaHasta: 0, bloqueRaizId: bloqueRaiz.id };
    }
    if (bloqueRaiz.tipo === "alTocar") {
      return { evento: "tocar", objetivo: (bloqueRaiz.parametros || {}).objetivo, instrucciones: aplanar(bloqueRaiz.hijos || []), pc: 0, activa: false, terminada: true, esperaHasta: 0, bloqueRaizId: bloqueRaiz.id };
    }
    // Bloque suelto sin evento → equivalente a "alIniciar"
    return { evento: "iniciar", instrucciones: aplanar([bloqueRaiz]), pc: 0, activa: false, terminada: false, esperaHasta: 0, bloqueRaizId: bloqueRaiz.id };
  }

  function aplanar(bloques) {
    const out = [];
    bloques.forEach(function(b) {
      if (b.tipo === "repetir") {
        const veces = Math.max(0, parseInt((b.parametros || {}).veces || 0, 10));
        if (veces >= 3) mundo.criteriosCumplidos.repetirGrande = Math.max(mundo.criteriosCumplidos.repetirGrande, veces);
        for (let i = 0; i < veces; i++) {
          aplanar(b.hijos || []).forEach(function(x) { out.push(x); });
        }
      } else if (b.tipo === "siEntonces") {
        mundo.criteriosCumplidos.usoSiEntonces = true;
        out.push({ tipo: "siEntonces", parametros: b.parametros || {}, cuerpo: aplanar(b.hijos || []), id: b.id });
      } else {
        out.push({ tipo: b.tipo, parametros: b.parametros || {}, id: b.id });
      }
    });
    return out;
  }

  function dibujar() {
    ctx.clearRect(0, 0, TAM_CANVAS, TAM_CANVAS);

    // Fondo
    ctx.fillStyle = "#fbfaf7";
    ctx.fillRect(0, 0, TAM_CANVAS, TAM_CANVAS);

    // Cuadrícula
    ctx.strokeStyle = "#d8d3cb";
    ctx.lineWidth = 1;
    for (let i = 0; i <= FILAS; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * TAM_CELDA);
      ctx.lineTo(TAM_CANVAS, i * TAM_CELDA);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i * TAM_CELDA, 0);
      ctx.lineTo(i * TAM_CELDA, TAM_CANVAS);
      ctx.stroke();
    }

    if (!mundo) return;

    // Objetos
    mundo.objetos.forEach(function(obj) {
      const tipoInfo = tematica.objetos.find(function(t) { return t.id === obj.tipo; });
      const x = obj.col * TAM_CELDA + TAM_CELDA / 2;
      const y = obj.fila * TAM_CELDA + TAM_CELDA / 2;
      ctx.font = (TAM_CELDA * 0.8) + "px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tipoInfo ? tipoInfo.icono : "?", x, y);

      // Nombre
      ctx.font = "10px Nunito, sans-serif";
      ctx.fillStyle = "#5a5a5a";
      ctx.fillText(obj.nombre, x, y + TAM_CELDA / 2 - 6);
      ctx.fillStyle = "#000";

      // Mensaje flotante
      if (obj.mensajeFlotante !== null && obj.mensajeFlotanteTicks > 0) {
        ctx.font = "bold 12px Nunito, sans-serif";
        ctx.fillStyle = "#4a7a96";
        ctx.fillText(String(obj.mensajeFlotante), x, y - TAM_CELDA / 2 + 10);
        ctx.fillStyle = "#000";
      }
    });
  }

  function actualizarPaneles() {
    if (!mundo) {
      estadoObjetos.textContent = "(sin datos)";
      estadoVars.textContent = "(sin variables)";
      return;
    }
    const lineasObj = mundo.objetos.map(function(o) {
      return o.nombre + " → fila " + (o.fila + 1) + ", columna " + (o.col + 1);
    });
    estadoObjetos.textContent = lineasObj.join("\n") || "(sin objetos)";

    const lineasVar = [];
    mundo.objetos.forEach(function(o) {
      Object.keys(o.variables).forEach(function(k) {
        lineasVar.push(o.nombre + "." + k + " = " + o.variables[k]);
      });
    });
    estadoVars.textContent = lineasVar.length ? lineasVar.join("\n") : "(sin variables creadas)";
  }

  // ===== EJECUCIÓN =====

  function iniciar() {
    ocultarError();
    if (estadoEjecucion === "corriendo") return;
    if (estadoEjecucion === "detenido") {
      construirMundo();
      activarRutinasIniciar();
    }
    estadoEjecucion = "corriendo";
    actualizarBotones();
    estadoSim.textContent = "Simulación corriendo. Tocá ⏸ para pausar.";
    if (timer) clearInterval(timer);
    timer = setInterval(tick, INTERVALO_TICK_MS);
  }

  function pausar() {
    if (estadoEjecucion !== "corriendo") return;
    estadoEjecucion = "pausado";
    if (timer) { clearInterval(timer); timer = null; }
    actualizarBotones();
    estadoSim.textContent = "Simulación en pausa. Tocá ▶ para seguir o ⏮ para avanzar paso a paso.";
  }

  function detener() {
    if (timer) { clearInterval(timer); timer = null; }
    estadoEjecucion = "detenido";
    construirMundo();
    dibujar();
    actualizarPaneles();
    actualizarBotones();
    estadoSim.textContent = "Simulación detenida. Las posiciones volvieron al inicio.";
    ocultarError();
  }

  function paso() {
    ocultarError();
    if (estadoEjecucion === "detenido") {
      construirMundo();
      activarRutinasIniciar();
      estadoEjecucion = "pausado";
    }
    if (estadoEjecucion === "corriendo") {
      pausar();
    }
    tick();
    estadoSim.textContent = "Avanzaste un paso. Tocá ⏮ para otro paso o ▶ para correr todo.";
    actualizarBotones();
  }

  function activarRutinasIniciar() {
    mundo.objetos.forEach(function(o) {
      o.rutinas.forEach(function(r) {
        if (r.evento === "iniciar") {
          r.activa = true;
          r.terminada = false;
          r.pc = 0;
          r.esperaHasta = 0;
        }
      });
    });
  }

  function actualizarBotones() {
    botonIniciar.disabled = (estadoEjecucion === "corriendo");
    botonPausar.disabled  = (estadoEjecucion !== "corriendo");
    botonDetener.disabled = (estadoEjecucion === "detenido");
  }

  function tick() {
    try {
      const ahora = Date.now();
      mundo.objetos.forEach(function(obj) {
        obj.rutinas.forEach(function(rutina) {
          if (!rutina.activa) return;
          if (rutina.esperaHasta && ahora < rutina.esperaHasta) return;
          ejecutarSiguienteInstruccion(obj, rutina);
        });

        if (obj.mensajeFlotanteTicks > 0) obj.mensajeFlotanteTicks--;
        if (obj.mensajeFlotanteTicks === 0) obj.mensajeFlotante = null;
      });

      detectarColisiones();
      dibujar();
      actualizarPaneles();
      verificarObjetivoNivel();
    } catch (e) {
      pausar();
      mostrarError(e && e.message ? e.message : "Ocurrió un problema durante la simulación.");
      resaltarBloqueError(e && e.bloqueId);
    }
  }

  function ejecutarSiguienteInstruccion(obj, rutina) {
    if (rutina.pc >= rutina.instrucciones.length) {
      rutina.activa = false;
      rutina.terminada = true;
      return;
    }
    const inst = rutina.instrucciones[rutina.pc];
    rutina.pc++;
    mundo.criteriosCumplidos.rutinasEjecutadas++;
    aplicarInstruccion(obj, rutina, inst);
  }

  function aplicarInstruccion(obj, rutina, inst) {
    const p = inst.parametros || {};
    switch (inst.tipo) {
      case "moverArriba":    desplazar(obj, -1, 0,  Math.max(1, p.pasos || 1)); break;
      case "moverAbajo":     desplazar(obj,  1, 0,  Math.max(1, p.pasos || 1)); break;
      case "moverIzquierda": desplazar(obj,  0, -1, Math.max(1, p.pasos || 1)); break;
      case "moverDerecha":   desplazar(obj,  0,  1, Math.max(1, p.pasos || 1)); break;
      case "esperar": {
        const seg = Math.max(0, parseFloat(p.segundos || 0));
        rutina.esperaHasta = Date.now() + seg * 1000;
        break;
      }
      case "guardarValor": {
        const nombre = (p.variable || "").trim();
        if (!nombre) {
          const err = new Error("Falta indicar el nombre de la variable en un bloque \"Guardar valor\" de \"" + obj.nombre + "\".");
          err.bloqueId = inst.id; throw err;
        }
        const previo = obj.variables[nombre];
        obj.variables[nombre] = parseFloat(p.valor || 0);
        if (previo !== obj.variables[nombre]) mundo.criteriosCumplidos.variableCambio = true;
        break;
      }
      case "sumarUno": {
        const nombre = (p.variable || "").trim();
        if (!nombre) {
          const err = new Error("Falta indicar el nombre de la variable en un bloque \"Sumar 1\" de \"" + obj.nombre + "\".");
          err.bloqueId = inst.id; throw err;
        }
        obj.variables[nombre] = (obj.variables[nombre] || 0) + 1;
        mundo.criteriosCumplidos.variableCambio = true;
        break;
      }
      case "mostrarVariable": {
        const nombre = (p.variable || "").trim();
        if (!nombre || obj.variables[nombre] === undefined) {
          const err = new Error("La variable \"" + nombre + "\" no existe todavía. Primero usá \"Guardar valor\" en \"" + obj.nombre + "\".");
          err.bloqueId = inst.id; throw err;
        }
        obj.mensajeFlotante = obj.variables[nombre];
        obj.mensajeFlotanteTicks = 5;
        break;
      }
      case "siEntonces": {
        const nombre = (p.variable || "").trim();
        if (!nombre) {
          const err = new Error("Falta el nombre de la variable en un bloque \"Si... entonces\" de \"" + obj.nombre + "\".");
          err.bloqueId = inst.id; throw err;
        }
        const v = obj.variables[nombre];
        const cmp = p.comparador;
        const valor = parseFloat(p.valor || 0);
        let cumple = false;
        if (v === undefined) {
          cumple = false;
        } else {
          switch (cmp) {
            case "==": cumple = v == valor; break;
            case "!=": cumple = v != valor; break;
            case ">":  cumple = v >  valor; break;
            case ">=": cumple = v >= valor; break;
            case "<":  cumple = v <  valor; break;
            case "<=": cumple = v <= valor; break;
          }
        }
        if (cumple) {
          // Inserta el cuerpo después del PC actual.
          const cuerpo = inst.cuerpo || [];
          rutina.instrucciones = rutina.instrucciones.slice(0, rutina.pc)
            .concat(cuerpo)
            .concat(rutina.instrucciones.slice(rutina.pc));
        }
        break;
      }
      default: {
        // Tipos no esperados a este nivel (alIniciar/alPresionar/alTocar/repetir ya fueron tratados).
        break;
      }
    }
  }

  function desplazar(obj, df, dc, pasos) {
    const nuevaFila = clamp(obj.fila + df * pasos, 0, FILAS - 1);
    const nuevaCol  = clamp(obj.col  + dc * pasos, 0, COLUMNAS - 1);
    if (nuevaFila !== obj.fila || nuevaCol !== obj.col) {
      mundo.criteriosCumplidos.movioAlMenosUnPaso += Math.abs(nuevaFila - obj.fila) + Math.abs(nuevaCol - obj.col);
    }
    obj.fila = nuevaFila;
    obj.col  = nuevaCol;
  }

  function clamp(v, min, max) {
    return v < min ? min : (v > max ? max : v);
  }

  function detectarColisiones() {
    mundo.objetos.forEach(function(a) {
      mundo.objetos.forEach(function(b) {
        if (a === b) return;
        if (a.fila !== b.fila || a.col !== b.col) return;
        a.rutinas.forEach(function(r) {
          if (r.evento === "tocar" && r.objetivo === b.id && r.terminada) {
            r.activa = true;
            r.terminada = false;
            r.pc = 0;
            r.esperaHasta = 0;
          }
        });
      });
    });
  }

  function resaltarBloqueError(idBloque) {
    if (!idBloque) return;
    // El simulador no muestra los bloques en pantalla, pero guardamos el id por si vuelven al programador.
    sessionStorage.setItem("bloqueErrorId", idBloque);
  }

  function verificarObjetivoNivel() {
    if (!nivel) return;
    let cumplido = false;
    switch (nivel.numero) {
      case 1: cumplido = mundo.criteriosCumplidos.movioAlMenosUnPaso >= 4; break;
      case 2: cumplido = mundo.criteriosCumplidos.respondioATecla; break;
      case 3: cumplido = mundo.criteriosCumplidos.usoSiEntonces; break;
      case 4: cumplido = mundo.criteriosCumplidos.repetirGrande >= 3; break;
      case 5: cumplido = mundo.criteriosCumplidos.variableCambio; break;
      case 6: cumplido = mundo.criteriosCumplidos.rutinasEjecutadas >= 8; break;
    }
    if (cumplido) {
      const estado = Estado.cargar();
      if (!estado.nivelesCompletados.includes(nivel.numero)) {
        Estado.marcarNivelCompletado(nivel.numero);
        mostrarMensaje("¡Nivel " + nivel.numero + " completado! " + nivel.criterioExito + " Se desbloqueó el siguiente nivel.", "exito");
      }
    }
  }

  // ===== INPUT =====

  document.addEventListener("keydown", function(e) {
    if (estadoEjecucion !== "corriendo") return;
    if (!mundo) return;
    mundo.teclasPresionadas.add(e.key);
    mundo.criteriosCumplidos.respondioATecla = true;
    mundo.objetos.forEach(function(obj) {
      obj.rutinas.forEach(function(r) {
        if (r.evento === "tecla" && r.tecla === e.key && r.terminada) {
          r.activa = true;
          r.terminada = false;
          r.pc = 0;
          r.esperaHasta = 0;
        }
      });
    });
  });

  document.addEventListener("keyup", function(e) {
    if (mundo) mundo.teclasPresionadas.delete(e.key);
  });

  // ===== Botones =====

  botonIniciar.addEventListener("click", iniciar);
  botonPausar.addEventListener("click", pausar);
  botonDetener.addEventListener("click", detener);
  botonPaso.addEventListener("click", paso);
  botonVolverProg.addEventListener("click", function() {
    if (timer) clearInterval(timer);
    window.location.href = "programmer.html";
  });

  inicializar();
})();
