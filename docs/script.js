document.documentElement.classList.add('js');

(() => {
  'use strict';

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointerQuery = window.matchMedia('(any-pointer: fine)');
  const fogCanvas = document.querySelector('.fog-canvas');
  const iconStage = document.querySelector('.icon-stage');
  const cursorGlow = document.querySelector('.cursor-glow');
  const sections = [...document.querySelectorAll('main > section')];
  const cleanup = [];

  const listen = (target, event, handler, options) => {
    target.addEventListener(event, handler, options);
    cleanup.push(() => target.removeEventListener(event, handler, options));
  };

  const initFog = () => {
    if (!fogCanvas) return;

    const gl = fogCanvas.getContext('webgl', { alpha: true, premultipliedAlpha: true });
    if (!gl) {
      fogCanvas.hidden = true;
      return;
    }

    const vertexSource = `
      attribute vec2 position;
      varying vec2 uv;
      void main() {
        uv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;
    const fragmentSource = `
      precision highp float;
      varying vec2 uv;
      uniform vec2 resolution;
      uniform float time;

      float random(vec2 point) {
        return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 point) {
        vec2 cell = floor(point);
        vec2 local = fract(point);
        local = local * local * (3.0 - 2.0 * local);
        return mix(
          mix(random(cell), random(cell + vec2(1.0, 0.0)), local.x),
          mix(random(cell + vec2(0.0, 1.0)), random(cell + vec2(1.0, 1.0)), local.x),
          local.y
        );
      }

      float fbm(vec2 point) {
        float value = 0.0;
        float amplitude = 0.5;
        mat2 turn = mat2(0.8, 0.6, -0.6, 0.8);
        for (int octave = 0; octave < 5; octave++) {
          value += amplitude * noise(point);
          point = turn * point * 2.03 + 17.13;
          amplitude *= 0.5;
        }
        return value;
      }

      void main() {
        vec2 point = (uv - 0.5) * vec2(resolution.x / resolution.y, 1.0);
        float drift = time * 0.05;
        point.x += sin(point.y * 2.3 + drift * 2.0) * 0.13;
        vec2 current = vec2(
          fbm(point * 0.85 + vec2(drift, -drift * 0.45)),
          fbm(point * 0.85 + vec2(4.8 + drift * 0.55, 2.1 - drift * 0.3))
        );
        float body = fbm(point * vec2(1.25, 1.7) + current * 1.9 + vec2(-drift * 1.2, drift * 0.22));
        float tendril = fbm(vec2(point.x * 0.9 + body * 2.1 - drift * 1.6, point.y * 4.8 + current.y * 1.5 + drift * 0.35));
        float smoke = smoothstep(0.53, 0.84, body * 0.68 + tendril * 0.62);
        vec2 centreOffset = (point - vec2(-0.04, 0.02)) * vec2(0.94, 1.18);
        float centre = exp(-dot(centreOffset, centreOffset) * 2.15);
        float centreCore = exp(-dot(centreOffset, centreOffset) * 4.2);
        float centreTexture = fbm(point * vec2(2.4, 3.1) + current * 2.8 + vec2(drift * 0.7, -drift * 0.25));
        float centreFog = centre * (0.42 + smoothstep(0.23, 0.78, centreTexture) * 0.58);
        float opacity = smoke * 0.04 + centreFog * 0.62 + centreCore * 0.38;
        float alpha = opacity * opacity * opacity;
        vec3 paleGreen = vec3(0.72, 0.91, 0.47);
        vec3 mistGreen = vec3(0.88, 0.98, 0.72);
        vec3 colour = mix(paleGreen, mistGreen, centreFog * 0.56);
        gl_FragColor = vec4(colour * alpha, alpha);
      }
    `;

    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn('Fog shader could not compile:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertex = compile(gl.VERTEX_SHADER, vertexSource);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertex || !fragment) {
      fogCanvas.hidden = true;
      return;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('Fog program could not link:', gl.getProgramInfoLog(program));
      fogCanvas.hidden = true;
      return;
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.useProgram(program);

    const position = gl.getAttribLocation(program, 'position');
    const resolution = gl.getUniformLocation(program, 'resolution');
    const time = gl.getUniformLocation(program, 'time');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    let frameId = 0;
    let animationStart;
    let lastElapsed = 30;

    const resize = () => {
      const scale = Math.min(window.devicePixelRatio || 1, 1.5);
      fogCanvas.width = Math.max(1, Math.floor(window.innerWidth * scale));
      fogCanvas.height = Math.max(1, Math.floor(window.innerHeight * scale));
      gl.viewport(0, 0, fogCanvas.width, fogCanvas.height);
      draw(lastElapsed);
    };

    const draw = (elapsed) => {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(resolution, fogCanvas.width, fogCanvas.height);
      gl.uniform1f(time, elapsed);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const render = (now) => {
      if (document.hidden || reduceMotionQuery.matches) {
        frameId = 0;
        return;
      }
      if (animationStart === undefined) animationStart = now;
      lastElapsed = 30 + (now - animationStart) * 0.001;
      draw(lastElapsed);
      frameId = requestAnimationFrame(render);
    };

    const start = () => {
      if (!frameId && !document.hidden && !reduceMotionQuery.matches) {
        frameId = requestAnimationFrame(render);
      } else if (reduceMotionQuery.matches) {
        draw(lastElapsed);
      }
    };

    const stop = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
    };

    const handleVisibility = () => document.hidden ? stop() : start();
    const handleMotionChange = () => reduceMotionQuery.matches ? stop() : start();

    listen(window, 'resize', resize, { passive: true });
    listen(document, 'visibilitychange', handleVisibility);
    listen(reduceMotionQuery, 'change', handleMotionChange);
    cleanup.push(stop);
    resize();
    start();
  };

  const createIconFields = () => {
    if (!iconStage) return new Map();
    const svgNamespace = 'http://www.w3.org/2000/svg';
    const fields = new Map();
    const iconCount = window.innerWidth < 600 ? 26 : 42;
    const minimumGap = window.innerWidth < 600 ? 15 : 11;

    sections.forEach((section) => {
      const field = section.querySelector('.icon-field');
      const iconIds = (field?.dataset.icons || field?.dataset.icon || '').split(/\s+/).filter(Boolean);
      if (!field || !iconIds.length) return;
      const positions = [];
      let attempts = 0;

      while (positions.length < iconCount && attempts < iconCount * 120) {
        attempts += 1;
        const candidate = { x: 4 + Math.random() * 92, y: 4 + Math.random() * 92 };
        if (positions.some((item) => Math.hypot(candidate.x - item.x, candidate.y - item.y) < minimumGap)) continue;
        positions.push(candidate);

        const iconSvg = document.createElementNS(svgNamespace, 'svg');
        const iconUse = document.createElementNS(svgNamespace, 'use');
        const depthNear = 0.76 + Math.random() * 0.58;
        iconSvg.setAttribute('class', 'field-icon');
        iconSvg.setAttribute('viewBox', '0 0 100 80');
        iconSvg.setAttribute('aria-hidden', 'true');
        iconSvg.style.setProperty('--icon-x', `${candidate.x.toFixed(2)}%`);
        iconSvg.style.setProperty('--icon-y', `${candidate.y.toFixed(2)}%`);
        iconSvg.style.setProperty('--icon-depth-far', (depthNear * 0.72).toFixed(2));
        iconSvg.style.setProperty('--icon-depth-near', depthNear.toFixed(2));
        iconSvg.style.setProperty('--icon-opacity-low', (0.07 + Math.random() * 0.09).toFixed(2));
        iconSvg.style.setProperty('--icon-opacity-high', (0.2 + Math.random() * 0.18).toFixed(2));
        iconSvg.style.setProperty('--icon-duration', `${(10 + Math.random() * 9).toFixed(1)}s`);
        iconSvg.style.setProperty('--icon-delay', `-${(Math.random() * 12).toFixed(1)}s`);
        iconSvg.style.setProperty('--icon-start-x', `${(-1.2 + Math.random() * 2.4).toFixed(2)}vw`);
        iconSvg.style.setProperty('--icon-start-y', `${(-1 + Math.random() * 2).toFixed(2)}vh`);
        iconSvg.style.setProperty('--icon-end-x', `${(-1.2 + Math.random() * 2.4).toFixed(2)}vw`);
        iconSvg.style.setProperty('--icon-end-y', `${(-1 + Math.random() * 2).toFixed(2)}vh`);
        const iconId = iconIds[Math.floor(Math.random() * iconIds.length)];
        iconUse.setAttribute('href', `#${iconId}`);
        iconUse.setAttribute('width', '100');
        iconUse.setAttribute('height', '80');
        iconSvg.append(iconUse);
        field.append(iconSvg);
      }

      fields.set(section, field);
      iconStage.append(field);
    });

    return fields;
  };

  const initObservers = (fields) => {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal, .icon-field').forEach((item) => item.classList.add('visible'));
      return;
    }

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('visible', entry.isIntersecting));
    }, { threshold: 0.45 });

    document.querySelectorAll('.reveal').forEach((item) => revealObserver.observe(item));
    cleanup.push(() => revealObserver.disconnect());

    const fieldObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => fields.get(entry.target)?.classList.toggle('visible', entry.isIntersecting));
    }, { threshold: 0.45 });

    sections.forEach((section) => fieldObserver.observe(section));
    cleanup.push(() => fieldObserver.disconnect());
  };

  const initCursorGlow = () => {
    if (!cursorGlow || !finePointerQuery.matches || reduceMotionQuery.matches) return;
    let x = 0;
    let y = 0;
    let frameId = 0;

    const render = () => {
      frameId = 0;
      cursorGlow.style.transform = `translate3d(${x}px, ${y}px, 0) translate3d(-50%, -50%, 0)`;
    };
    const move = (event) => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      x = event.clientX;
      y = event.clientY;
      cursorGlow.style.opacity = '1';
      if (!frameId) frameId = requestAnimationFrame(render);
    };
    const hide = (event) => {
      if (!event || !event.relatedTarget) cursorGlow.style.opacity = '0';
    };

    listen(window, 'pointermove', move, { passive: true });
    listen(window, 'pointerover', move, { passive: true });
    listen(window, 'mouseout', hide, { passive: true });
    listen(window, 'blur', hide);
  };

  initFog();
  const fields = createIconFields();
  initObservers(fields);
  initCursorGlow();

  listen(window, 'pagehide', () => cleanup.splice(0).forEach((dispose) => dispose()), { once: true });
})();
