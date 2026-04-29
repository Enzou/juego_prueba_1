# Constructor de Mundos

Aplicación web educativa para adolescentes con TEA (14 años) que enseña diseño y
programación por bloques siguiendo el ciclo:
**DISEÑAR → PROGRAMAR → PROBAR → AJUSTAR**.

Hecha en HTML + CSS + JavaScript vanilla, sin frameworks ni build step. Lista
para publicar en GitHub Pages.

## Estructura

```
/
├── index.html         Pantalla de bienvenida y selección de temática y nivel.
├── designer.html      Editor visual del escenario (10x10).
├── programmer.html    Editor de bloques de programación.
├── simulator.html     Simulador del mundo creado.
├── README.md
├── css/
│   └── style.css      Estilos globales (paleta suave, sin animaciones).
└── js/
    ├── state.js       Estado global persistido en localStorage.
    ├── designer.js    Lógica del editor visual.
    ├── blocks.js      Sistema de bloques de programación + drag and drop.
    └── simulator.js   Motor de simulación (Canvas API).
```

## Cómo correrlo localmente

No necesita instalación. Abrir `index.html` en un navegador moderno.

Si tu navegador bloquea `localStorage` con archivos `file://`, podés servirlo con
cualquier servidor estático, por ejemplo:

```
python3 -m http.server 8000
# luego: http://localhost:8000/
```

## Cómo publicar en GitHub Pages

1. Crear un repositorio nuevo en GitHub (por ejemplo `constructor-de-mundos`).
2. Subir todos los archivos al repositorio:
   ```
   git init
   git add .
   git commit -m "Versión inicial de Constructor de Mundos"
   git branch -M main
   git remote add origin https://github.com/USUARIO/constructor-de-mundos.git
   git push -u origin main
   ```
3. En GitHub, ir a **Settings → Pages**.
4. En **Source** elegir **Deploy from a branch**.
5. En **Branch** elegir `main` y la carpeta `/ (root)`. Guardar.
6. Esperar 1–2 minutos. La aplicación va a quedar publicada en
   `https://USUARIO.github.io/constructor-de-mundos/`.

No hay paso de build: GitHub Pages sirve los archivos tal como están.

## Decisiones de diseño orientadas a TEA

- **Paleta suave** (beige, azul gris, verde oliva), sin contrastes agresivos.
- **Tipografía Nunito** sin serifas, tamaño base 18px.
- **Sin animaciones** ni transiciones distractoras.
- **Instrucciones literales y explícitas** en cada pantalla.
- **Mapa de progreso visible** en todas las pantallas posteriores al inicio
  (Inicio · Diseñar · Programar · Probar).
- **Mensajes de feedback específicos**: indican exactamente qué pasó y qué
  hacer a continuación, en vez de mensajes genéricos.
- **Sin temporizadores ni presión de tiempo**.
- **Transiciones de pantalla anunciadas**: cada vez que se cambia de pantalla
  se muestra un mensaje y el cambio se inicia desde un botón explícito.
- **Confirmaciones explícitas** antes de borrar o reiniciar.
- **Persistencia automática** entre pantallas — el estudiante no pierde su
  trabajo si vuelve atrás.

## Niveles

1. **Secuencia básica** — un objeto sigue un camino fijo.
2. **Eventos** — un objeto reacciona a una tecla.
3. **Condicionales** — `si... entonces`.
4. **Bucles** — `repetir N veces` con N ≥ 3.
5. **Variables** — crear y modificar valores.
6. **Rutinas** — secuencias compuestas y reutilizables.

Cada nivel define un criterio de éxito explícito que el simulador verifica
automáticamente. Al cumplirlo se desbloquea el siguiente.

## Temáticas

- 🚂 Trenes
- 🌌 Espacio
- 🐾 Animales
- 🏙️ Ciudad
- 🎮 Videojuego retro

Cada temática trae 8 objetos representados con emojis. La elección se guarda
en `localStorage` y condiciona la biblioteca del editor.

## Licencia

Uso educativo. Sin dependencias externas salvo la fuente Nunito de Google Fonts.
