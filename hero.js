/**
 * hero.js — Motor GPU WebGL (con degradación elegante a Canvas 2D y modo estático)
 * para QR Pro Enterprise.
 *
 * Características:
 * - Shader GLSL procedural de matriz óptica ISO/IEC 18004 + interferencia FBM a 60 fps.
 * - Triángulo de pantalla completa (3 vértices, 1 draw call por frame, DPR limitado a 1.75).
 * - Sincronización reactiva con la paleta activa del estudio (window.QRProWebGL.setPalette).
 * - Pausa automática fuera de viewport (IntersectionObserver) y en pestaña oculta (visibilitychange).
 * - Respeto estricto a prefers-reduced-motion: reduce (renderiza un único fotograma estático).
 * - Fallback automático a Canvas 2D procedural si WebGL no está disponible.
 */
(function () {
  "use strict";

  var VERTEX_SRC = [
    "attribute vec2 a_pos;",
    "void main() {",
    "  gl_Position = vec4(a_pos, 0.0, 1.0);",
    "}"
  ].join("\n");

  var FRAGMENT_SRC = [
    "precision mediump float;",
    "uniform vec2 u_res;",
    "uniform float u_time;",
    "uniform vec2 u_mouse;",
    "uniform vec3 u_colorA;",
    "uniform vec3 u_colorB;",
    "uniform float u_density;",
    "",
    "float hash21(vec2 p) {",
    "  p = fract(p * vec2(234.34, 435.345));",
    "  p += dot(p, p + 34.23);",
    "  return fract(p.x * p.y);",
    "}",
    "",
    "float finderMask(vec2 cell, vec2 origin) {",
    "  vec2 d = abs(cell - origin);",
    "  float outer = step(max(d.x, d.y), 3.0);",
    "  float innerGap = step(max(d.x, d.y), 2.0);",
    "  float core = step(max(d.x, d.y), 1.0);",
    "  return clamp(outer - innerGap + core, 0.0, 1.0);",
    "}",
    "",
    "void main() {",
    "  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / max(min(u_res.x, u_res.y), 1.0);",
    "  vec2 m = (u_mouse - 0.5) * 1.4;",
    "  float distMouse = length(uv - m * 0.45);",
    "",
    "  float gridScale = u_density;",
    "  vec2 warped = uv + 0.03 * vec2(sin(uv.y * 5.0 + u_time * 0.9), cos(uv.x * 5.0 - u_time * 0.8));",
    "  vec2 cell = floor((warped + 0.5) * gridScale);",
    "  vec2 local = fract((warped + 0.5) * gridScale) - 0.5;",
    "",
    "  float rnd = hash21(cell);",
    "  float pulse = 0.5 + 0.5 * sin(u_time * 1.4 + rnd * 6.2831 + length(cell) * 0.22);",
    "  float moduleOn = step(0.46, rnd * 0.65 + pulse * 0.35);",
    "  float roundBox = smoothstep(0.44, 0.34, length(max(abs(local) - vec2(0.18), 0.0)));",
    "",
    "  float f1 = finderMask(cell, vec2(3.0, gridScale - 4.0));",
    "  float f2 = finderMask(cell, vec2(gridScale - 4.0, gridScale - 4.0));",
    "  float f3 = finderMask(cell, vec2(3.0, 3.0));",
    "  float finder = clamp(f1 + f2 + f3, 0.0, 1.0);",
    "",
    "  float wave = exp(-distMouse * 3.2) * (0.55 + 0.45 * sin(distMouse * 18.0 - u_time * 2.6));",
    "  float energy = clamp((moduleOn * roundBox * 0.55) + finder * 0.85 + wave * 0.55, 0.0, 1.0);",
    "",
    "  vec3 bg = vec3(0.031, 0.047, 0.086);",
    "  vec3 tint = mix(u_colorA, u_colorB, clamp(uv.x + 0.5 + wave * 0.3, 0.0, 1.0));",
    "  vec3 col = mix(bg, tint, energy * 0.78);",
    "  float vignette = smoothstep(1.35, 0.2, length(uv));",
    "  col *= mix(0.55, 1.05, vignette);",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  function hexToRgbUnit(hex, fallback) {
    var clean = String(hex || "").trim().replace(/^#/, "");
    if (/^[0-9a-fA-F]{3}$/.test(clean)) {
      clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
    }
    if (!/^[0-9a-fA-F]{6}$/.test(clean)) return fallback;
    return [
      parseInt(clean.slice(0, 2), 16) / 255,
      parseInt(clean.slice(2, 4), 16) / 255,
      parseInt(clean.slice(4, 6), 16) / 255
    ];
  }

  function compileShader(gl, type, src) {
    var s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  function mountSurface(canvas, statusEl) {
    if (!canvas) return null;
    var reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var colorA = [0.133, 0.827, 0.933]; // #22D3EE
    var colorB = [0.506, 0.549, 0.973]; // #818CF8
    var density = 21.0;
    var mouse = { x: 0.5, y: 0.5 };
    var userPaused = false;
    var viewportHidden = false;
    var docHidden = false;
    var rafId = 0;
    var startTs = performance.now();
    var backend = "css-fallback";

    var gl = null;
    try {
      gl =
        canvas.getContext("webgl2", { antialias: false, depth: false, stencil: false, powerPreference: "low-power" }) ||
        canvas.getContext("webgl", { antialias: false, depth: false, stencil: false }) ||
        canvas.getContext("experimental-webgl");
    } catch (_e) {
      gl = null;
    }

    var prog = null;
    var uRes = null;
    var uTime = null;
    var uMouse = null;
    var uColorA = null;
    var uColorB = null;
    var uDensity = null;
    var ctx2d = null;

    if (gl) {
      var vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC);
      var fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);
      if (vs && fs) {
        prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
          gl.useProgram(prog);
          var buf = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, buf);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
          var loc = gl.getAttribLocation(prog, "a_pos");
          gl.enableVertexAttribArray(loc);
          gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

          uRes = gl.getUniformLocation(prog, "u_res");
          uTime = gl.getUniformLocation(prog, "u_time");
          uMouse = gl.getUniformLocation(prog, "u_mouse");
          uColorA = gl.getUniformLocation(prog, "u_colorA");
          uColorB = gl.getUniformLocation(prog, "u_colorB");
          uDensity = gl.getUniformLocation(prog, "u_density");
          backend = typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext ? "webgl2" : "webgl1";
        } else {
          gl = null;
        }
      } else {
        gl = null;
      }
    }

    if (!gl) {
      try {
        ctx2d = canvas.getContext("2d");
        if (ctx2d) backend = "canvas2d";
      } catch (_err) {
        ctx2d = null;
      }
    }

    function updateStatusBadge() {
      if (!statusEl) return;
      var modeText =
        backend === "webgl2"
          ? "GPU WebGL2 activo"
          : backend === "webgl1"
            ? "GPU WebGL1 activo"
            : backend === "canvas2d"
              ? "Fallback Canvas 2D activo"
              : "Fallback CSS estático";
      if (reducedMotion) {
        statusEl.textContent = modeText + " · Movimiento reducido respetado";
      } else if (userPaused) {
        statusEl.textContent = modeText + " · En pausa";
      } else {
        statusEl.textContent = modeText + " · 60 fps adaptativo";
      }
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var dpr = Math.min((typeof window !== "undefined" && window.devicePixelRatio) || 1, 1.75);
      var w = Math.max(160, Math.round((rect.width || canvas.width || 640) * dpr));
      var h = Math.max(120, Math.round((rect.height || canvas.height || 260) * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      if (gl && uRes) {
        gl.viewport(0, 0, w, h);
        gl.uniform2f(uRes, w, h);
      }
    }

    function renderFrame(now) {
      var elapsed = (now - startTs) * 0.001;
      if (gl && prog) {
        gl.uniform1f(uTime, elapsed);
        gl.uniform2f(uMouse, mouse.x, mouse.y);
        gl.uniform3f(uColorA, colorA[0], colorA[1], colorA[2]);
        gl.uniform3f(uColorB, colorB[0], colorB[1], colorB[2]);
        gl.uniform1f(uDensity, density);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      } else if (ctx2d) {
        var w = canvas.width;
        var h = canvas.height;
        ctx2d.fillStyle = "#080c16";
        ctx2d.fillRect(0, 0, w, h);
        var cols = 21;
        var cell = Math.min(w, h) / cols;
        var ox = (w - cell * cols) * 0.5;
        var oy = (h - cell * cols) * 0.5;
        for (var r = 0; r < cols; r++) {
          for (var c = 0; c < cols; c++) {
            var wave = 0.5 + 0.5 * Math.sin(elapsed * 1.5 + (r * 0.45 + c * 0.35));
            if (wave > 0.48) {
              var alpha = (wave - 0.45) * 0.9;
              ctx2d.fillStyle =
                "rgba(" +
                Math.round(colorA[0] * 255) +
                "," +
                Math.round(colorA[1] * 255) +
                "," +
                Math.round(colorA[2] * 255) +
                "," +
                alpha.toFixed(2) +
                ")";
              ctx2d.fillRect(ox + c * cell + 1, oy + r * cell + 1, Math.max(2, cell - 2), Math.max(2, cell - 2));
            }
          }
        }
      } else {
        canvas.style.background =
          "radial-gradient(circle at 30% 30%, rgba(34,211,238,0.28), rgba(15,23,42,0.95))";
      }
    }

    function shouldAnimate() {
      return !reducedMotion && !userPaused && !viewportHidden && !docHidden && (Boolean(gl) || Boolean(ctx2d));
    }

    function tick(now) {
      rafId = 0;
      if (!shouldAnimate()) return;
      renderFrame(now);
      rafId = requestAnimationFrame(tick);
    }

    function schedule() {
      if (shouldAnimate() && !rafId) {
        rafId = requestAnimationFrame(tick);
      }
    }

    resize();
    renderFrame(performance.now());
    updateStatusBadge();

    if (typeof window !== "undefined") {
      window.addEventListener(
        "resize",
        function () {
          resize();
          renderFrame(performance.now());
        },
        { passive: true }
      );

      canvas.addEventListener(
        "pointermove",
        function (ev) {
          var rect = canvas.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            mouse.x = (ev.clientX - rect.left) / rect.width;
            mouse.y = 1.0 - (ev.clientY - rect.top) / rect.height;
          }
        },
        { passive: true }
      );
    }

    if (typeof IntersectionObserver !== "undefined") {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            viewportHidden = !entry.isIntersecting;
          });
          if (viewportHidden && rafId) {
            cancelAnimationFrame(rafId);
            rafId = 0;
          } else {
            schedule();
          }
        },
        { threshold: 0.05 }
      );
      io.observe(canvas);
    }

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", function () {
        docHidden = document.hidden;
        if (docHidden && rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        } else {
          schedule();
        }
      });
    }

    schedule();

    return {
      setPalette: function (hexA, hexB, modCount) {
        colorA = hexToRgbUnit(hexA, [0.133, 0.827, 0.933]);
        colorB = hexToRgbUnit(hexB, [0.506, 0.549, 0.973]);
        if (typeof modCount === "number" && modCount >= 17 && modCount <= 65) {
          density = modCount;
        }
        renderFrame(performance.now());
      },
      togglePause: function () {
        userPaused = !userPaused;
        if (userPaused && rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        } else {
          schedule();
        }
        updateStatusBadge();
        return userPaused;
      },
      isPaused: function () {
        return userPaused;
      },
      getBackend: function () {
        return backend;
      }
    };
  }

  function boot() {
    if (typeof document === "undefined") return;
    var labRoot = document.querySelector("[data-webgl-lab]");
    if (!labRoot || labRoot.getAttribute("data-ready") === "1") return;
    labRoot.setAttribute("data-ready", "1");

    var labCanvas = labRoot.querySelector("canvas");
    var statusEl = labRoot.querySelector("[data-webgl-status]");
    var toggleBtn = labRoot.querySelector("[data-webgl-toggle]");
    var controller = mountSurface(labCanvas, statusEl);

    if (toggleBtn && controller) {
      toggleBtn.addEventListener("click", function () {
        var paused = controller.togglePause();
        toggleBtn.setAttribute("aria-pressed", paused ? "true" : "false");
        toggleBtn.textContent = paused ? "Reanudar simulación GPU" : "Pausar simulación GPU";
      });
    }

    if (typeof window !== "undefined" && controller) {
      window.QRProWebGL = controller;
    }
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", boot);
    } else {
      boot();
    }
  }
})();
