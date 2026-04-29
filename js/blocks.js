/* ============================================================
   blocks.js — Sistema de bloques de programación.
   Fase: PROGRAMAR.

   Modelo de datos de un bloque:
     { id, tipo, categoria, parametros: {...}, hijos: [bloques] }
   "hijos" se usa para bloques con cuerpo (repetir, si entonces).
   ============================================================ */

(function() {
  const TECLAS = [
    { id: "ArrowUp",    nombre: "flecha arriba" },
    { id: "ArrowDown",  nombre: "flecha abajo" },
    { id: "ArrowLeft",  nombre: "flecha izquierda" },
    { id: "ArrowRight", nombre: "flecha derecha" },
    { id: " ",          nombre: "barra espaciadora" },
    { id: "a",          nombre: "tecla A" },
    { id: "b",          nombre: "tecla B" }
  ];

  const DEFINICIONES = [
    // ===== MOVIMIENTO =====
    { tipo: "moverArriba",    categoria: "MOVIMIENTO", icono: "⬆", etiqueta: "Mover arriba",     params: [{ nombre: "pasos", tipo: "numero", valor: 1, min: 1 }], descripcion: "El objeto sube N casillas." },
    { tipo: "moverAbajo",     categoria: "MOVIMIENTO", icono: "⬇", etiqueta: "Mover abajo",      params: [{ nombre: "pasos", tipo: "numero", valor: 1, min: 1 }], descripcion: "El objeto baja N casillas." },
    { tipo: "moverIzquierda", categoria: "MOVIMIENTO", icono: "⬅", etiqueta: "Mover a la izquierda", params: [{ nombre: "pasos", tipo: "numero", valor: 1, min: 1 }], descripcion: "El objeto va a la izquierda N casillas." },
    { tipo: "moverDerecha",   categoria: "MOVIMIENTO", icono: "➡", etiqueta: "Mover a la derecha",  params: [{ nombre: "pasos", tipo: "numero", valor: 1, min: 1 }], descripcion: "El objeto va a la derecha N casillas." },

    // ===== EVENTOS =====
    { tipo: "alIniciar",  categoria: "EVENTOS", icono: "▶", etiqueta: "Al iniciar",    params: [], cuerpo: true, descripcion: "Los bloques de adentro se ejecutan apenas empieza la simulación." },
    { tipo: "alPresionar", categoria: "EVENTOS", icono: "⌨", etiqueta: "Al presionar", params: [{ nombre: "tecla", tipo: "tecla", valor: "ArrowRight" }], cuerpo: true, descripcion: "Los bloques de adentro se ejecutan cuando el jugador presiona la tecla elegida." },
    { tipo: "alTocar",    categoria: "EVENTOS", icono: "💥", etiqueta: "Al tocar",     params: [{ nombre: "objetivo", tipo: "objeto", valor: "" }], cuerpo: true, descripcion: "Los bloques de adentro se ejecutan cuando el objeto programado choca contra el objeto elegido." },

    // ===== CONTROL =====
    { tipo: "repetir", categoria: "CONTROL", icono: "🔁", etiqueta: "Repetir N veces", params: [{ nombre: "veces", tipo: "numero", valor: 3, min: 1 }], cuerpo: true, descripcion: "Los bloques de adentro se ejecutan N veces seguidas." },
    { tipo: "siEntonces", categoria: "CONTROL", icono: "❓", etiqueta: "Si... entonces", params: [
        { nombre: "variable", tipo: "texto", valor: "puntos" },
        { nombre: "comparador", tipo: "comparador", valor: ">=" },
        { nombre: "valor", tipo: "numero", valor: 1 }
      ], cuerpo: true, descripcion: "Los bloques de adentro se ejecutan solo si la condición se cumple." },
    { tipo: "esperar", categoria: "CONTROL", icono: "⏱", etiqueta: "Esperar N segundos", params: [{ nombre: "segundos", tipo: "numero", valor: 1, min: 0, paso: 0.1 }], descripcion: "El objeto espera N segundos antes del siguiente bloque." },

    // ===== VARIABLES =====
    { tipo: "guardarValor", categoria: "VARIABLES", icono: "📦", etiqueta: "Guardar valor", params: [
        { nombre: "variable", tipo: "texto", valor: "puntos" },
        { nombre: "valor", tipo: "numero", valor: 0 }
      ], descripcion: "Crea o actualiza la variable con el valor indicado." },
    { tipo: "sumarUno", categoria: "VARIABLES", icono: "➕", etiqueta: "Sumar 1 a variable", params: [{ nombre: "variable", tipo: "texto", valor: "puntos" }], descripcion: "Le suma 1 al valor actual de la variable." },
    { tipo: "mostrarVariable", categoria: "VARIABLES", icono: "👁", etiqueta: "Mostrar variable", params: [{ nombre: "variable", tipo: "texto", valor: "puntos" }], descripcion: "Muestra el valor de la variable arriba del objeto durante 1 segundo." }
  ];

  const ORDEN_CATEGORIAS = ["MOVIMIENTO", "EVENTOS", "CONTROL", "VARIABLES"];

  const infoTematica   = document.getElementById("infoTematica");
  const tituloNivel    = document.getElementById("tituloNivel");
  const objetivoNivel  = document.getElementById("objetivoNivel");
  const paleta         = document.getElementById("paleta");
  const selectorObjeto = document.getElementById("selectorObjeto");
  const programaEl     = document.getElementById("programa");
  const ayudaPrograma  = document.getElementById("ayudaPrograma");
  const vistaCodigo    = document.getElementById("vistaCodigo");
  const toggleCodigo   = document.getElementById("toggleCodigo");
  const botonProbar    = document.getElementById("botonProbar");
  const botonVolverDis = document.getElementById("botonVolverDis");
  const botonLimpiarP  = document.getElementById("botonLimpiarPrograma");
  const zonaMensaje    = document.getElementById("zonaMensaje");

  let tematica  = null;
  let escenario = null;
  let programas = {};
  let objetoActivoId = null;

  let arrastreActual = null;

  function uid() {
    return "b_" + Math.random().toString(36).slice(2, 9) + "_" + Date.now();
  }

  function definicionDe(tipo) {
    return DEFINICIONES.find(function(d) { return d.tipo === tipo; });
  }

  function mostrarMensaje(texto, tipo) {
    zonaMensaje.innerHTML = "";
    if (!texto) return;
    const div = document.createElement("div");
    div.className = "mensaje " + (tipo || "info");
    div.textContent = texto;
    zonaMensaje.appendChild(div);
  }

  function inicializar() {
    tematica  = Estado.getTematica();
    escenario = Estado.getEscenario();
    if (!tematica) { window.location.href = "index.html"; return; }
    if (!escenario || !escenario.objetos || escenario.objetos.length < 2) {
      window.location.href = "designer.html";
      return;
    }

    const estado = Estado.cargar();
    const nivel = NIVELES.find(function(n) { return n.numero === estado.nivelActual; }) || NIVELES[0];
    tituloNivel.textContent = "Nivel " + nivel.numero + ": " + nivel.nombre;
    objetivoNivel.textContent = "Objetivo: " + nivel.objetivo + " " + nivel.criterioExito;

    infoTematica.textContent = "Temática: " + tematica.icono + " " + tematica.nombre + " · Nivel " + nivel.numero;

    programas = Estado.getProgramas() || {};
    escenario.objetos.forEach(function(o) {
      if (!programas[o.id]) programas[o.id] = [];
    });
    objetoActivoId = escenario.objetos[0].id;

    pintarPaleta();
    pintarSelectorObjetos();
    pintarPrograma();
    actualizarBotonProbar();
  }

  function pintarPaleta() {
    paleta.innerHTML = "";
    ORDEN_CATEGORIAS.forEach(function(cat) {
      const titulo = document.createElement("div");
      titulo.className = "categoria-titulo";
      titulo.textContent = cat;
      paleta.appendChild(titulo);

      DEFINICIONES.filter(function(d) { return d.categoria === cat; }).forEach(function(def) {
        const el = document.createElement("div");
        el.className = "bloque";
        el.setAttribute("data-categoria", def.categoria);
        el.setAttribute("draggable", "true");
        el.setAttribute("role", "button");
        el.setAttribute("tabindex", "0");
        el.setAttribute("aria-label", def.etiqueta);
        el.innerHTML =
          '<strong>' + def.icono + ' ' + def.etiqueta + '</strong>' +
          '<span class="descripcion">' + def.descripcion + '</span>';
        el.addEventListener("dragstart", function(e) {
          arrastreActual = { origen: "paleta", tipo: def.tipo };
          e.dataTransfer.effectAllowed = "copy";
          try { e.dataTransfer.setData("text/plain", def.tipo); } catch (_) {}
        });
        el.addEventListener("dragend", function() { arrastreActual = null; limpiarHovers(); });
        paleta.appendChild(el);
      });
    });
  }

  function pintarSelectorObjetos() {
    selectorObjeto.innerHTML = "";
    escenario.objetos.forEach(function(obj) {
      const tipoInfo = tematica.objetos.find(function(t) { return t.id === obj.tipo; });
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.className = (objetoActivoId === obj.id) ? "activo" : "";
      b.textContent = (tipoInfo ? tipoInfo.icono + " " : "") + obj.nombre +
        " · " + (programas[obj.id] || []).length + " bloque(s)";
      b.addEventListener("click", function() {
        objetoActivoId = obj.id;
        pintarSelectorObjetos();
        pintarPrograma();
      });
      selectorObjeto.appendChild(b);
    });
  }

  function obtenerObjetoActivo() {
    return escenario.objetos.find(function(o) { return o.id === objetoActivoId; });
  }

  function pintarPrograma() {
    programaEl.innerHTML = "";
    const bloques = programas[objetoActivoId] || [];
    const obj = obtenerObjetoActivo();

    if (!obj) return;

    ayudaPrograma.textContent = "Programando a: " + obj.nombre +
      ". Soltá los bloques aquí abajo. Para borrar un bloque tocá el botón \"Quitar\".";

    if (bloques.length === 0) {
      const vacio = document.createElement("div");
      vacio.className = "ayuda";
      vacio.style.textAlign = "center";
      vacio.style.padding = "20px";
      vacio.textContent = "Aún no hay bloques. Arrastrá uno desde el panel de la izquierda.";
      programaEl.appendChild(vacio);
    } else {
      bloques.forEach(function(b) {
        programaEl.appendChild(crearElementoBloque(b, bloques));
      });
    }

    activarZonaSoltado(programaEl, programas[objetoActivoId]);
    actualizarVistaCodigo();
    pintarSelectorObjetos();
    actualizarBotonProbar();
  }

  function crearElementoBloque(bloque, listaPadre) {
    const def = definicionDe(bloque.tipo);
    if (!def) return document.createTextNode("");

    const tieneCuerpo = !!def.cuerpo;
    const cont = document.createElement("div");
    cont.className = "bloque-programa" + (tieneCuerpo ? " con-cuerpo" : "");
    cont.setAttribute("data-categoria", def.categoria);
    cont.setAttribute("data-id", bloque.id);

    const cabecera = tieneCuerpo ? document.createElement("div") : cont;
    if (tieneCuerpo) cabecera.className = "cabecera-bloque";

    const titulo = document.createElement("strong");
    titulo.textContent = def.icono + " " + def.etiqueta;
    cabecera.appendChild(titulo);

    def.params.forEach(function(p) {
      cabecera.appendChild(crearControlParam(bloque, p));
    });

    const quitar = document.createElement("button");
    quitar.type = "button";
    quitar.className = "quitar-bloque";
    quitar.textContent = "Quitar";
    quitar.addEventListener("click", function(e) {
      e.stopPropagation();
      const idx = listaPadre.findIndex(function(b) { return b.id === bloque.id; });
      if (idx !== -1) listaPadre.splice(idx, 1);
      persistir();
      pintarPrograma();
      mostrarMensaje("Quitaste el bloque \"" + def.etiqueta + "\".", "info");
    });
    cabecera.appendChild(quitar);

    if (tieneCuerpo) {
      cont.appendChild(cabecera);
      const cuerpo = document.createElement("div");
      cuerpo.className = "cuerpo-bloque";
      cuerpo.setAttribute("data-bloque-padre", bloque.id);
      if (!Array.isArray(bloque.hijos)) bloque.hijos = [];
      if (bloque.hijos.length === 0) {
        const vacio = document.createElement("div");
        vacio.className = "ayuda";
        vacio.style.fontSize = "0.8rem";
        vacio.textContent = "Soltá bloques acá adentro.";
        cuerpo.appendChild(vacio);
      } else {
        bloque.hijos.forEach(function(h) {
          cuerpo.appendChild(crearElementoBloque(h, bloque.hijos));
        });
      }
      cont.appendChild(cuerpo);
      activarZonaSoltado(cuerpo, bloque.hijos);
    }

    return cont;
  }

  function crearControlParam(bloque, paramDef) {
    if (!bloque.parametros) bloque.parametros = {};
    if (bloque.parametros[paramDef.nombre] === undefined) {
      bloque.parametros[paramDef.nombre] = paramDef.valor;
    }

    const wrap = document.createElement("label");
    wrap.style.display = "inline-flex";
    wrap.style.alignItems = "center";
    wrap.style.gap = "4px";
    wrap.style.fontSize = "0.85rem";

    const etiq = document.createElement("span");
    etiq.textContent = paramDef.nombre + ":";
    wrap.appendChild(etiq);

    let control;
    if (paramDef.tipo === "numero") {
      control = document.createElement("input");
      control.type = "number";
      if (paramDef.min !== undefined) control.min = String(paramDef.min);
      if (paramDef.paso !== undefined) control.step = String(paramDef.paso);
      control.value = String(bloque.parametros[paramDef.nombre]);
      control.addEventListener("change", function() {
        const v = parseFloat(control.value);
        if (isNaN(v)) {
          mostrarMensaje("El valor debe ser un número. Lo dejo en " + bloque.parametros[paramDef.nombre] + ".", "error");
          control.value = String(bloque.parametros[paramDef.nombre]);
          return;
        }
        bloque.parametros[paramDef.nombre] = v;
        persistir();
        actualizarVistaCodigo();
      });
    } else if (paramDef.tipo === "texto") {
      control = document.createElement("input");
      control.type = "text";
      control.value = String(bloque.parametros[paramDef.nombre]);
      control.addEventListener("change", function() {
        const v = control.value.trim();
        if (!v) {
          mostrarMensaje("El nombre de la variable no puede estar vacío.", "error");
          control.value = String(bloque.parametros[paramDef.nombre]);
          return;
        }
        bloque.parametros[paramDef.nombre] = v;
        persistir();
        actualizarVistaCodigo();
      });
    } else if (paramDef.tipo === "tecla") {
      control = document.createElement("select");
      TECLAS.forEach(function(t) {
        const op = document.createElement("option");
        op.value = t.id;
        op.textContent = t.nombre;
        if (t.id === bloque.parametros[paramDef.nombre]) op.selected = true;
        control.appendChild(op);
      });
      control.addEventListener("change", function() {
        bloque.parametros[paramDef.nombre] = control.value;
        persistir();
        actualizarVistaCodigo();
      });
    } else if (paramDef.tipo === "objeto") {
      control = document.createElement("select");
      const opVacia = document.createElement("option");
      opVacia.value = "";
      opVacia.textContent = "(elegir)";
      control.appendChild(opVacia);
      escenario.objetos.forEach(function(o) {
        if (o.id === objetoActivoId) return;
        const op = document.createElement("option");
        op.value = o.id;
        op.textContent = o.nombre;
        if (o.id === bloque.parametros[paramDef.nombre]) op.selected = true;
        control.appendChild(op);
      });
      control.addEventListener("change", function() {
        bloque.parametros[paramDef.nombre] = control.value;
        persistir();
        actualizarVistaCodigo();
      });
    } else if (paramDef.tipo === "comparador") {
      control = document.createElement("select");
      ["==", "!=", ">", ">=", "<", "<="].forEach(function(c) {
        const op = document.createElement("option");
        op.value = c;
        op.textContent = c;
        if (c === bloque.parametros[paramDef.nombre]) op.selected = true;
        control.appendChild(op);
      });
      control.addEventListener("change", function() {
        bloque.parametros[paramDef.nombre] = control.value;
        persistir();
        actualizarVistaCodigo();
      });
    }

    if (control) wrap.appendChild(control);
    return wrap;
  }

  function activarZonaSoltado(elemento, lista) {
    elemento.addEventListener("dragover", function(e) {
      if (!arrastreActual) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      elemento.classList.add("arrastre-activo");
    });
    elemento.addEventListener("dragleave", function() {
      elemento.classList.remove("arrastre-activo");
    });
    elemento.addEventListener("drop", function(e) {
      e.preventDefault();
      e.stopPropagation();
      elemento.classList.remove("arrastre-activo");
      if (!arrastreActual) return;
      const def = definicionDe(arrastreActual.tipo);
      if (!def) return;
      const nuevo = construirBloqueNuevo(def);
      lista.push(nuevo);
      arrastreActual = null;
      persistir();
      pintarPrograma();
      mostrarMensaje("Agregaste el bloque \"" + def.etiqueta + "\".", "exito");
    });
  }

  function limpiarHovers() {
    document.querySelectorAll(".arrastre-activo").forEach(function(el) {
      el.classList.remove("arrastre-activo");
    });
  }

  function construirBloqueNuevo(def) {
    const params = {};
    def.params.forEach(function(p) { params[p.nombre] = p.valor; });
    const b = { id: uid(), tipo: def.tipo, categoria: def.categoria, parametros: params };
    if (def.cuerpo) b.hijos = [];
    return b;
  }

  function actualizarVistaCodigo() {
    const lineas = [];
    Object.keys(programas).forEach(function(idObj) {
      const obj = escenario.objetos.find(function(o) { return o.id === idObj; });
      if (!obj) return;
      const bloques = programas[idObj] || [];
      if (bloques.length === 0) return;
      lineas.push("// === " + obj.nombre + " ===");
      lineas.push("function programa_" + sanitizar(obj.nombre) + "() {");
      bloques.forEach(function(b) { lineas.push.apply(lineas, generarCodigo(b, 1)); });
      lineas.push("}");
      lineas.push("");
    });
    if (lineas.length === 0) lineas.push("// Aún no programaste ningún objeto.");
    vistaCodigo.textContent = lineas.join("\n");
  }

  function sanitizar(s) {
    return String(s).replace(/[^A-Za-z0-9_]/g, "_");
  }

  function generarCodigo(b, indent) {
    const sangria = "  ".repeat(indent);
    const def = definicionDe(b.tipo);
    if (!def) return [];
    const p = b.parametros || {};
    let l = [];
    switch (b.tipo) {
      case "moverArriba":    l.push(sangria + "mover('arriba', "    + (p.pasos || 1) + ");"); break;
      case "moverAbajo":     l.push(sangria + "mover('abajo', "     + (p.pasos || 1) + ");"); break;
      case "moverIzquierda": l.push(sangria + "mover('izquierda', " + (p.pasos || 1) + ");"); break;
      case "moverDerecha":   l.push(sangria + "mover('derecha', "   + (p.pasos || 1) + ");"); break;
      case "alIniciar":
        l.push(sangria + "alIniciar(() => {");
        (b.hijos || []).forEach(function(h) { l.push.apply(l, generarCodigo(h, indent + 1)); });
        l.push(sangria + "});");
        break;
      case "alPresionar":
        l.push(sangria + "alPresionar('" + (p.tecla || "") + "', () => {");
        (b.hijos || []).forEach(function(h) { l.push.apply(l, generarCodigo(h, indent + 1)); });
        l.push(sangria + "});");
        break;
      case "alTocar":
        l.push(sangria + "alTocar('" + (p.objetivo || "") + "', () => {");
        (b.hijos || []).forEach(function(h) { l.push.apply(l, generarCodigo(h, indent + 1)); });
        l.push(sangria + "});");
        break;
      case "repetir":
        l.push(sangria + "for (let i = 0; i < " + (p.veces || 0) + "; i++) {");
        (b.hijos || []).forEach(function(h) { l.push.apply(l, generarCodigo(h, indent + 1)); });
        l.push(sangria + "}");
        break;
      case "siEntonces":
        l.push(sangria + "if (variables['" + p.variable + "'] " + p.comparador + " " + p.valor + ") {");
        (b.hijos || []).forEach(function(h) { l.push.apply(l, generarCodigo(h, indent + 1)); });
        l.push(sangria + "}");
        break;
      case "esperar":         l.push(sangria + "await esperar(" + (p.segundos || 0) + ");"); break;
      case "guardarValor":    l.push(sangria + "variables['" + p.variable + "'] = " + (p.valor || 0) + ";"); break;
      case "sumarUno":        l.push(sangria + "variables['" + p.variable + "'] = (variables['" + p.variable + "'] || 0) + 1;"); break;
      case "mostrarVariable": l.push(sangria + "mostrar(variables['" + p.variable + "']);"); break;
      default: l.push(sangria + "// bloque sin código");
    }
    return l;
  }

  function tieneAlgunPrograma() {
    return Object.keys(programas).some(function(id) {
      return Array.isArray(programas[id]) && programas[id].length > 0;
    });
  }

  function actualizarBotonProbar() {
    botonProbar.disabled = !tieneAlgunPrograma();
    botonProbar.title = tieneAlgunPrograma()
      ? "Pasar al simulador."
      : "Asigná al menos un bloque a algún objeto antes de probar.";
  }

  function persistir() {
    Estado.setProgramas(programas);
  }

  toggleCodigo.addEventListener("click", function() {
    const oculto = vistaCodigo.hasAttribute("hidden");
    if (oculto) {
      vistaCodigo.removeAttribute("hidden");
      toggleCodigo.textContent = "Ocultar código";
      toggleCodigo.setAttribute("aria-expanded", "true");
    } else {
      vistaCodigo.setAttribute("hidden", "");
      toggleCodigo.textContent = "Mostrar código";
      toggleCodigo.setAttribute("aria-expanded", "false");
    }
  });

  botonVolverDis.addEventListener("click", function() {
    persistir();
    window.location.href = "designer.html";
  });

  botonLimpiarP.addEventListener("click", function() {
    if (!objetoActivoId) return;
    const lista = programas[objetoActivoId] || [];
    if (lista.length === 0) {
      mostrarMensaje("Este objeto ya no tiene bloques.", "info");
      return;
    }
    const ok = window.confirm("Vas a borrar todos los bloques del objeto activo. ¿Querés continuar?");
    if (!ok) return;
    programas[objetoActivoId] = [];
    persistir();
    pintarPrograma();
    mostrarMensaje("Borraste todos los bloques de este objeto.", "info");
  });

  botonProbar.addEventListener("click", function() {
    if (!tieneAlgunPrograma()) {
      mostrarMensaje("Falta una instrucción: ningún objeto tiene bloques. Arrastrá al menos un bloque y volvé a probar.", "error");
      return;
    }
    persistir();
    window.location.href = "simulator.html";
  });

  inicializar();
})();
