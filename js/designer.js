/* ============================================================
   designer.js — Editor visual del escenario.
   Fase: DISEÑAR.
   ============================================================ */

(function() {
  const FILAS = 10;
  const COLUMNAS = 10;

  const infoTematica   = document.getElementById("infoTematica");
  const tituloNivel    = document.getElementById("tituloNivel");
  const objetivoNivel  = document.getElementById("objetivoNivel");
  const biblioteca     = document.getElementById("biblioteca");
  const grilla         = document.getElementById("grilla");
  const listaObjetos   = document.getElementById("listaObjetos");
  const contadorObj    = document.getElementById("contadorObjetos");
  const botonVolver    = document.getElementById("botonVolver");
  const botonLimpiar   = document.getElementById("botonLimpiar");
  const botonProgramar = document.getElementById("botonProgramar");
  const zonaMensaje    = document.getElementById("zonaMensaje");

  let tematica = null;
  let escenario = null;
  let tipoSeleccionado = null;
  let contadores = {};

  function mostrarMensaje(texto, tipo) {
    zonaMensaje.innerHTML = "";
    if (!texto) return;
    const div = document.createElement("div");
    div.className = "mensaje " + (tipo || "info");
    div.textContent = texto;
    zonaMensaje.appendChild(div);
  }

  function inicializar() {
    tematica = Estado.getTematica();
    if (!tematica) {
      window.location.href = "index.html";
      return;
    }

    const estado = Estado.cargar();
    const nivel = NIVELES.find(function(n) { return n.numero === estado.nivelActual; }) || NIVELES[0];
    tituloNivel.textContent = "Nivel " + nivel.numero + ": " + nivel.nombre;
    objetivoNivel.textContent = "Objetivo: " + nivel.objetivo + " " + nivel.criterioExito;

    infoTematica.textContent = "Temática: " + tematica.icono + " " + tematica.nombre + " · Nivel " + nivel.numero;

    escenario = estado.escenarioActual && estado.escenarioActual.objetos
      ? estado.escenarioActual
      : { filas: FILAS, columnas: COLUMNAS, grilla: [], objetos: [] };

    if (!Array.isArray(escenario.objetos)) escenario.objetos = [];

    recalcularContadores();
    pintarBiblioteca();
    pintarGrilla();
    pintarLista();
    actualizarBotonProgramar();
  }

  function recalcularContadores() {
    contadores = {};
    escenario.objetos.forEach(function(o) {
      contadores[o.tipo] = Math.max(contadores[o.tipo] || 0, o.indice || 0);
    });
  }

  function pintarBiblioteca() {
    biblioteca.innerHTML = "";
    tematica.objetos.forEach(function(obj) {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "objeto-biblioteca" + (tipoSeleccionado === obj.id ? " seleccionado" : "");
      boton.setAttribute("aria-pressed", tipoSeleccionado === obj.id ? "true" : "false");
      boton.innerHTML =
        '<span class="icono" aria-hidden="true">' + obj.icono + '</span>' +
        '<span>' + obj.nombre + '</span>';
      boton.addEventListener("click", function() {
        tipoSeleccionado = obj.id;
        pintarBiblioteca();
        mostrarMensaje("Elegiste: " + obj.nombre + ". Ahora tocá una casilla para colocarlo.", "info");
      });
      biblioteca.appendChild(boton);
    });
  }

  function pintarGrilla() {
    grilla.innerHTML = "";
    for (let f = 0; f < FILAS; f++) {
      for (let c = 0; c < COLUMNAS; c++) {
        const celda = document.createElement("div");
        celda.className = "celda";
        celda.setAttribute("role", "gridcell");
        celda.setAttribute("aria-label", "Fila " + (f + 1) + ", columna " + (c + 1));
        celda.dataset.fila = f;
        celda.dataset.col = c;

        const objetoEnCelda = escenario.objetos.find(function(o) { return o.fila === f && o.col === c; });
        if (objetoEnCelda) {
          celda.classList.add("con-objeto");
          const tipoInfo = tematica.objetos.find(function(t) { return t.id === objetoEnCelda.tipo; });
          celda.textContent = tipoInfo ? tipoInfo.icono : "?";
          const etiqueta = document.createElement("span");
          etiqueta.className = "nombre";
          etiqueta.textContent = objetoEnCelda.nombre;
          celda.appendChild(etiqueta);
        }

        celda.addEventListener("click", function() { colocarEnCelda(f, c); });
        celda.addEventListener("contextmenu", function(e) {
          e.preventDefault();
          borrarEnCelda(f, c);
        });

        grilla.appendChild(celda);
      }
    }
  }

  function colocarEnCelda(fila, col) {
    if (!tipoSeleccionado) {
      mostrarMensaje("Antes de colocar, elegí un objeto del panel de la izquierda.", "aviso");
      return;
    }
    const yaHay = escenario.objetos.find(function(o) { return o.fila === fila && o.col === col; });
    if (yaHay) {
      mostrarMensaje("Esa casilla ya tiene un objeto: " + yaHay.nombre + ". Hacé click derecho para borrarlo o elegí otra casilla.", "aviso");
      return;
    }
    const tipoInfo = tematica.objetos.find(function(t) { return t.id === tipoSeleccionado; });
    if (!tipoInfo) return;

    contadores[tipoSeleccionado] = (contadores[tipoSeleccionado] || 0) + 1;
    const indice = contadores[tipoSeleccionado];
    const nuevo = {
      id: "obj_" + tipoSeleccionado + "_" + indice + "_" + Date.now(),
      tipo: tipoSeleccionado,
      indice: indice,
      nombre: tipoInfo.nombre + "_" + indice,
      fila: fila,
      col: col
    };
    escenario.objetos.push(nuevo);
    persistir();
    pintarGrilla();
    pintarLista();
    actualizarBotonProgramar();
    mostrarMensaje("Colocaste \"" + nuevo.nombre + "\" en fila " + (fila + 1) + ", columna " + (col + 1) + ".", "exito");
  }

  function borrarEnCelda(fila, col) {
    const idx = escenario.objetos.findIndex(function(o) { return o.fila === fila && o.col === col; });
    if (idx === -1) {
      mostrarMensaje("Esa casilla está vacía. No hay nada para borrar.", "info");
      return;
    }
    const nombre = escenario.objetos[idx].nombre;
    escenario.objetos.splice(idx, 1);
    persistir();
    pintarGrilla();
    pintarLista();
    actualizarBotonProgramar();
    mostrarMensaje("Borraste \"" + nombre + "\".", "info");
  }

  function pintarLista() {
    listaObjetos.innerHTML = "";
    if (escenario.objetos.length === 0) {
      contadorObj.textContent = "Aún no colocaste ningún objeto. Necesitás al menos 2 para pasar a programar.";
      return;
    }
    contadorObj.textContent = "Tenés " + escenario.objetos.length + " objeto(s) colocado(s)."
      + (escenario.objetos.length < 2 ? " Te falta al menos 1 para pasar a programar." : "");

    escenario.objetos.forEach(function(obj) {
      const tipoInfo = tematica.objetos.find(function(t) { return t.id === obj.tipo; });
      const li = document.createElement("li");

      const icono = document.createElement("span");
      icono.textContent = tipoInfo ? tipoInfo.icono : "?";

      const input = document.createElement("input");
      input.type = "text";
      input.value = obj.nombre;
      input.setAttribute("aria-label", "Nombre del objeto");
      input.addEventListener("change", function() {
        const nuevoNombre = input.value.trim();
        if (!nuevoNombre) {
          mostrarMensaje("El nombre no puede quedar vacío. Restaurando el nombre anterior: " + obj.nombre, "error");
          input.value = obj.nombre;
          return;
        }
        const repetido = escenario.objetos.some(function(o) { return o.id !== obj.id && o.nombre === nuevoNombre; });
        if (repetido) {
          mostrarMensaje("Ya hay otro objeto con el nombre \"" + nuevoNombre + "\". Elegí un nombre distinto.", "error");
          input.value = obj.nombre;
          return;
        }
        obj.nombre = nuevoNombre;
        persistir();
        pintarGrilla();
        mostrarMensaje("Renombraste el objeto a \"" + nuevoNombre + "\".", "exito");
      });

      const posicion = document.createElement("span");
      posicion.style.fontSize = "0.8rem";
      posicion.style.color = "var(--color-texto-suave)";
      posicion.textContent = "(" + (obj.fila + 1) + "," + (obj.col + 1) + ")";

      const quitar = document.createElement("button");
      quitar.type = "button";
      quitar.className = "quitar";
      quitar.textContent = "Quitar";
      quitar.addEventListener("click", function() {
        borrarEnCelda(obj.fila, obj.col);
      });

      li.appendChild(icono);
      li.appendChild(input);
      li.appendChild(posicion);
      li.appendChild(quitar);
      listaObjetos.appendChild(li);
    });
  }

  function actualizarBotonProgramar() {
    const ok = escenario.objetos.length >= 2;
    botonProgramar.disabled = !ok;
    botonProgramar.title = ok
      ? "Pasar a la fase de programación."
      : "Necesitás al menos 2 objetos para programar.";
  }

  function persistir() {
    Estado.setEscenario(escenario);
  }

  botonVolver.addEventListener("click", function() {
    window.location.href = "index.html";
  });

  botonLimpiar.addEventListener("click", function() {
    if (escenario.objetos.length === 0) {
      mostrarMensaje("La grilla ya está vacía.", "info");
      return;
    }
    const ok = window.confirm("Vas a borrar todos los objetos del escenario. ¿Querés continuar?");
    if (!ok) return;
    escenario.objetos = [];
    contadores = {};
    persistir();
    pintarGrilla();
    pintarLista();
    actualizarBotonProgramar();
    mostrarMensaje("Limpiaste el escenario. Podés empezar de nuevo.", "info");
  });

  botonProgramar.addEventListener("click", function() {
    if (escenario.objetos.length < 2) {
      mostrarMensaje("Falta colocar al menos 2 objetos antes de pasar a programar.", "error");
      return;
    }
    persistir();
    mostrarMensaje("Pasamos a la fase de programación.", "info");
    window.location.href = "programmer.html";
  });

  inicializar();
})();
