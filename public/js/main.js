    gsap.registerPlugin(ScrollTrigger);

    // ── Splash screen — lives at top level so it always dismisses ────────────
    ;(function() {
      const splashEl  = document.getElementById('splash');
      const splashBar = document.getElementById('splash-bar');
      let   splashDone = false;

      window._dismissSplash = function() {
        if (splashDone || !splashEl) return;
        splashDone = true;
        clearInterval(window._splashBarTick);
        if (splashBar) splashBar.style.width = '100%';
        setTimeout(() => {
          gsap.to(splashEl, {
            opacity: 0, duration: 0.7, ease: 'power2.inOut',
            onComplete: () => { splashEl.style.display = 'none'; }
          });
          // GSAP's ticker pauses in a hidden tab, so onComplete may never fire;
          // never leave an invisible splash blocking scroll.
          setTimeout(() => { splashEl.style.display = 'none'; }, 1500);
        }, 300);
      };

      // Two readiness flags — hero WebGL + expertise Three.js
      window._readyFlags = { hero: false, expertise: false };
      window._checkAllReady = function() {
        if (window._readyFlags.hero && window._readyFlags.expertise) {
          window._dismissSplash();
        }
      };

      // Animate bar: eases toward 90% while waiting, completes on dismiss
      let barPct = 0;
      window._splashBarTick = setInterval(() => {
        barPct = Math.min(barPct + (90 - barPct) * 0.04, 89);
        if (splashBar) splashBar.style.width = barPct + '%';
      }, 50);

      // Hard cap: always dismisses within 6 s regardless of asset status
      setTimeout(window._dismissSplash, 6000);
    })();

    // ── SplitText intro statement — 3D line flip (CodePen xxmaNYj) ──
    (function () {
      const el = document.getElementById('intro-statement');
      if (!el) return;

      // Animate the .ist-inner elements (manual lines) with the
      // same rotationX + depth trick from the CodePen
      const lines = el.querySelectorAll('.ist-inner');

      gsap.fromTo(lines,
        {
          rotationX: -90,
          transformOrigin: '50% 100% -60px',
          opacity: 0,
          yPercent: 60,
        },
        {
          rotationX: 0,
          opacity: 1,
          yPercent: 0,
          duration: 1.1,
          ease: 'power3.out',
          stagger: 0.16,
          scrollTrigger: {
            trigger: el,
            start: 'top 78%',
            once: true
          }
        }
      );

    })();

    // Scroll reveal
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.07, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));

    // ── Modern nav: section anchoring + sliding indicator ───────────────────
    (function () {
      const nav        = document.getElementById('nav');
      const links      = nav ? nav.querySelectorAll('.nav-pill a[data-target]') : [];
      const indicator  = nav ? nav.querySelector('.nav-indicator') : null;
      if (!nav || !links.length || !indicator) return;

      // Sections to track, in scroll order
      const targets = Array.from(links).map(a => ({
        link: a,
        section: document.getElementById(a.dataset.target),
      })).filter(t => t.section);

      function moveIndicator(link) {
        // Position indicator under the active link
        const pillRect = nav.querySelector('.nav-pill').getBoundingClientRect();
        const linkRect = link.getBoundingClientRect();
        indicator.style.left  = (linkRect.left - pillRect.left) + 'px';
        indicator.style.width = linkRect.width + 'px';
        indicator.classList.add('is-ready');
      }

      function setActive(link) {
        links.forEach(l => l.classList.toggle('is-active', l === link));
        moveIndicator(link);
      }

      // Track active section by which one's centre is closest to the viewport's middle
      function updateActive() {
        const mid = window.scrollY + window.innerHeight * 0.35;
        let best = null;
        let bestDist = Infinity;
        targets.forEach(t => {
          const top = t.section.offsetTop;
          const bottom = top + t.section.offsetHeight;
          // Prefer sections currently overlapping the threshold line
          if (mid >= top && mid <= bottom) {
            const d = Math.abs((top + bottom) / 2 - mid);
            if (d < bestDist) { bestDist = d; best = t; }
          }
        });
        if (best) setActive(best.link);
        else {
          // Above the first tracked section — clear active state, hide indicator
          links.forEach(l => l.classList.remove('is-active'));
          indicator.classList.remove('is-ready');
        }
      }

      // Click → smooth-scroll (with offset so the section isn't tucked under the nav)
      links.forEach(link => {
        link.addEventListener('click', e => {
          const id = link.dataset.target;
          const sec = document.getElementById(id);
          if (!sec) return;
          e.preventDefault();
          const navH = nav.offsetHeight + 28;
          window.scrollTo({ top: sec.offsetTop - navH, behavior: 'smooth' });
        });
      });

      // Hide nav after scrolling down inside the hero, show again once past it
      const hero = document.getElementById('hero');
      function updateNavVisibility() {
        if (!hero) return;
        const r = hero.getBoundingClientRect();
        // Hide while scrolling THROUGH hero (after a small initial offset)
        const inHero = r.bottom > 80 && window.scrollY > 60;
        nav.classList.toggle('is-hidden', false); // always show — minimal nav
      }

      function onScroll() {
        updateActive();
        updateNavVisibility();
      }

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', () => {
        const active = nav.querySelector('.nav-pill a.is-active');
        if (active) moveIndicator(active);
      });

      // First pass after layout
      onScroll();
    })();

    // GSAP counters
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = parseInt(el.dataset.count);
      const sfx = el.dataset.sfx || '';
      gsap.fromTo(el, { textContent: 0 }, {
        textContent: target, duration: 1.8, ease: 'power2.out',
        snap: { textContent: 1 },
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        onUpdate() { el.textContent = Math.round(+el.textContent) + sfx; }
      });
    });

    // Hero photo parallax (fallback layer — WebGL canvas handles display when active)
    gsap.to('#hero-photo', {
      yPercent: 12,
      ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
    });

    // ── WebGL Fluid Reveal  (adapted from three-skull by cullenwebber) ──────────
    (function () {
      'use strict';

      function initFluid() {
      const canvas  = document.getElementById('hero-gl');
      const heroEl  = document.getElementById('hero');
      if (!canvas || !heroEl) return;

      // Size canvas BEFORE creating any GL objects — setting canvas.width/height
      // after GL context creation resets all GL state (programs, FBOs, textures).
      canvas.width  = heroEl.clientWidth  || window.innerWidth;
      canvas.height = heroEl.clientHeight || window.innerHeight;

      // ── WebGL context ───────────────────────────────────────────────────────────
      const gl = canvas.getContext('webgl',              { alpha: true, antialias: false, depth: false }) ||
                 canvas.getContext('experimental-webgl', { alpha: true, antialias: false, depth: false });
      if (!gl) return;

      // Enable pointer events on hero so mouse events fire (canvas has pointer-events:none in CSS)

      // ── Constants ───────────────────────────────────────────────────────────────
      const SIM_W = 512;
      const SIM_H = 512;
      const LWIDTH = SIM_W * 0.20; // trail line width in sim-px (~100px)

      // ── Off-screen trail canvas (2D, sim resolution) ────────────────────────────
      const trailCanvas = document.createElement('canvas');
      trailCanvas.width  = SIM_W;
      trailCanvas.height = SIM_H;
      const tc = trailCanvas.getContext('2d');

      // Trail state
      let trailX = -1, trailY = -1;  // lerped position in normalised [0-1]
      let rawX   = -1, rawY   = -1;  // latest mouse position in normalised [0-1]
      let hasPos = false;

      // ── Shader sources ──────────────────────────────────────────────────────────
      const VS = `
        attribute vec2 a_pos;
        varying vec2 v_uv;
        void main(){
          v_uv = a_pos * 0.5 + 0.5;
          gl_Position = vec4(a_pos, 0.0, 1.0);
        }
      `;

      // Fluid simulation step
      // White = no ink (base visible), Black = full ink (reveal visible)
      // FBM-displaced neighbour sampling → darken blend → trail input → fade to white
      const SIM_FS = `
        precision highp float;
        varying vec2 v_uv;
        uniform sampler2D u_prev;
        uniform sampler2D u_trail;
        uniform vec2 u_res;
        uniform float u_time;

        float hash(vec2 p){
          p = fract(p * vec2(234.34,435.345));
          p += dot(p, p + 34.23);
          return fract(p.x * p.y);
        }
        float noise(vec2 p){
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f*f*(3.0-2.0*f);
          return mix(
            mix(hash(i),           hash(i+vec2(1.0,0.0)), f.x),
            mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), f.x),
            f.y
          );
        }
        float fbm(vec2 p){
          float v=0.0; float a=0.5;
          for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.0; a*=0.5; }
          return v;
        }

        void main(){
          vec2 px = 1.0 / u_res;
          float disp = fbm(v_uv * 3.5 + u_time * 0.12) * 2.0 - 1.0;
          vec2 off = vec2(disp) * px * 4.5;

          float c  = texture2D(u_prev, v_uv + off).r;
          float cN = texture2D(u_prev, v_uv + vec2(0.0, px.y) + off).r;
          float cS = texture2D(u_prev, v_uv - vec2(0.0, px.y) + off).r;
          float cE = texture2D(u_prev, v_uv + vec2(px.x, 0.0) + off).r;
          float cW = texture2D(u_prev, v_uv - vec2(px.x, 0.0) + off).r;

          // Darken spread — ink bleeds outward
          float blended = min(c, min(min(cN,cS), min(cE,cW)));

          // Trail: canvas is white bg (r=1) + black stroke (r=0) → ink = 1-r
          float ink = 1.0 - texture2D(u_trail, v_uv).r;
          blended = min(blended, 1.0 - ink * 0.96);

          // Fade toward white each frame
          blended += 0.0085;
          gl_FragColor = vec4(vec3(clamp(blended,0.0,1.0)), 1.0);
        }
      `;

      // Final composite: orange base × B&W reveal, mixed by fluid mask
      // Includes bottom vignette to keep name text legible
      const COMP_FS = `
        precision highp float;
        varying vec2 v_uv;
        uniform sampler2D u_base;
        uniform sampler2D u_reveal;
        uniform sampler2D u_fluid;
        uniform vec2 u_baseSize;
        uniform vec2 u_revealSize;
        uniform vec2 u_canvas;

        // CSS object-fit:cover UV mapping
        // Multiply by s (<1) to crop the excess, keeping the centre visible
        vec2 coverUV(vec2 uv, vec2 img, vec2 cvs){
          float ia = img.x / img.y;
          float ca = cvs.x / cvs.y;
          // s = fraction of image shown in each axis (< 1 means that axis is cropped)
          vec2 s = (ia > ca) ? vec2(ca/ia, 1.0) : vec2(1.0, ia/ca);
          // flip Y: v_uv.y=0 is quad bottom; image y=0 is top of image
          vec2 fuv = vec2(uv.x, 1.0 - uv.y);
          return (fuv - 0.5) * s + 0.5;
        }

        void main(){
          vec2 baseUV   = coverUV(v_uv, u_baseSize, u_canvas);
          vec2 revealUV = coverUV(v_uv, u_revealSize, u_canvas);

          vec3 base = texture2D(u_base, baseUV).rgb;

          // B&W + slight contrast boost for reveal layer
          vec3 rev  = texture2D(u_reveal, revealUV).rgb;
          float lum = dot(rev, vec3(0.299, 0.587, 0.114));
          lum = clamp((lum - 0.5) * 1.1 + 0.5, 0.0, 1.0);
          rev = vec3(lum);

          // fluid mask: 1=full base (orange), 0=full reveal (B&W)
          float mask = texture2D(u_fluid, v_uv).r;
          vec3 color = mix(rev, base, mask);

          // Bottom vignette  (v_uv.y=0 is bottom of quad)
          float vf = max(0.0, 1.0 - v_uv.y / 0.65);
          float va = vf * vf * 0.76;
          color = mix(color, vec3(17.0/255.0), va);

          gl_FragColor = vec4(color, 1.0);
        }
      `;

      // ── Compile / link helpers ───────────────────────────────────────────────────
      function compile(type, src){
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)){
          console.error('Shader error:', gl.getShaderInfoLog(s));
          gl.deleteShader(s); return null;
        }
        return s;
      }
      function linkProg(vsSrc, fsSrc){
        const vs = compile(gl.VERTEX_SHADER, vsSrc);
        const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
        if(!vs || !fs) return null;
        const p = gl.createProgram();
        gl.attachShader(p, vs);
        gl.attachShader(p, fs);
        gl.linkProgram(p);
        if(!gl.getProgramParameter(p, gl.LINK_STATUS)){
          console.error('Program error:', gl.getProgramInfoLog(p));
          return null;
        }
        return p;
      }

      const simProg  = linkProg(VS, SIM_FS);
      const compProg = linkProg(VS, COMP_FS);
      if(!simProg || !compProg) return;

      // ── Fullscreen quad ─────────────────────────────────────────────────────────
      const quadBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array([-1,-1, 1,-1, -1,1, 1,1]),
        gl.STATIC_DRAW);

      function bindQuad(prog){
        const loc = gl.getAttribLocation(prog, 'a_pos');
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      }

      // ── FBO helpers ─────────────────────────────────────────────────────────────
      function makeFBO(w, h){
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return { tex, fbo };
      }

      // Ping-pong FBOs (initialise white = 1.0 = full orange base visible)
      let fboA = makeFBO(SIM_W, SIM_H);
      let fboB = makeFBO(SIM_W, SIM_H);
      function clearFBO(fbo){
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.fbo);
        gl.clearColor(1, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
      clearFBO(fboA);
      clearFBO(fboB);

      // ── Trail texture (updated from trailCanvas every frame) ─────────────────────
      const trailTex = gl.createTexture();
      function initTrailTex(){
        gl.bindTexture(gl.TEXTURE_2D, trailTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, SIM_W, SIM_H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }
      initTrailTex();

      // ── Image texture loader ─────────────────────────────────────────────────────
      function uploadTex(tex, img) {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); // y-flip handled in coverUV shader
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }

      function loadTex(src) {
        return new Promise(resolve => {
          const tex = gl.createTexture();
          // Try as a DOM img element already in the page first (avoids CORS issues on file://)
          const domImg = document.querySelector('img[src*="' + src.split('/').pop() + '"]');
          if (domImg && domImg.complete && domImg.naturalWidth) {
            try { uploadTex(tex, domImg); return resolve({ tex, w: domImg.naturalWidth, h: domImg.naturalHeight }); }
            catch(e) { /* fall through to fresh load */ }
          }
          // Fresh image load
          const img = new Image();
          img.onload = () => {
            try {
              uploadTex(tex, img);
              resolve({ tex, w: img.naturalWidth, h: img.naturalHeight });
            } catch(e) {
              console.warn('[fluid-reveal] texImage2D failed:', e);
              resolve(null);
            }
          };
          img.onerror = () => resolve(null);
          img.src = src;
        });
      }

      // canvas was already sized above — no resize handler needed
      // (canvas.width = N resets GL state, so we set it once before GL init)

      // ── Mouse tracking ──────────────────────────────────────────────────────────
      heroEl.addEventListener('mousemove', e => {
        const r = heroEl.getBoundingClientRect();
        rawX = (e.clientX - r.left) / r.width;
        rawY = (e.clientY - r.top)  / r.height;
        hasPos = true;
      });
      heroEl.addEventListener('mouseleave', () => {
        hasPos = false;
        trailX = -1; trailY = -1;
      });

      // ── Cached uniform locations ─────────────────────────────────────────────────
      const simU = {
        prev:  gl.getUniformLocation(simProg,  'u_prev'),
        trail: gl.getUniformLocation(simProg,  'u_trail'),
        res:   gl.getUniformLocation(simProg,  'u_res'),
        time:  gl.getUniformLocation(simProg,  'u_time'),
      };
      const compU = {
        base:       gl.getUniformLocation(compProg, 'u_base'),
        reveal:     gl.getUniformLocation(compProg, 'u_reveal'),
        fluid:      gl.getUniformLocation(compProg, 'u_fluid'),
        baseSize:   gl.getUniformLocation(compProg, 'u_baseSize'),
        revealSize: gl.getUniformLocation(compProg, 'u_revealSize'),
        canvas:     gl.getUniformLocation(compProg, 'u_canvas'),
      };

      // ── Main render loop ──────────────────────────────────────────────────────
      let t0 = null;
      const splashStart = performance.now();
      const SPLASH_MIN  = 800;

      // Load base image first — unblocks splash as soon as hero is ready.
      // Seq frames load in parallel but do NOT gate the splash.
      const seqPaths = [
        './assets/seq/1.jpeg','./assets/seq/2.jpeg','./assets/seq/3.jpeg',
        './assets/seq/4.jpeg','./assets/seq/5.jpeg',
      ];
      let seqFrames = [];
      seqPaths.forEach(p => loadTex(p).then(t => { if (t) seqFrames.push(t); }));

      loadTex('./assets/hero-orange.jpg').then(base => {
        // Base image ready — hero can render, dismiss splash
        const elapsed = performance.now() - splashStart;
        const wait    = Math.max(0, SPLASH_MIN - elapsed);
        setTimeout(() => {
          window._readyFlags.hero = true;
          window._checkAllReady();
        }, wait);

        // Base must load — without it, no effect possible
        if (!base) {
          console.warn('[fluid-reveal] Base image failed — CSS fallback active.');
          return;
        }

        // seqFrames populated async in background; fall back to base until ready
        if (seqFrames.length === 0) seqFrames.push(base);

        // ── Sequence animation state ──────────────────────────────────────────
        let seqIdx      = 0;
        let lastSeqTime = 0;
        const SEQ_INTERVAL = 300; // ms per frame ≈ ~3 fps loop

        function frame(ts){
          requestAnimationFrame(frame);
          if(t0 === null) t0 = ts;
          const t = (ts - t0) * 0.001;

          // Advance sequence frame on timer
          if (ts - lastSeqTime >= SEQ_INTERVAL) {
            seqIdx = (seqIdx + 1) % seqFrames.length;
            lastSeqTime = ts;
          }
          const revealFrame = seqFrames[seqIdx];

          // ── 1. Update trail canvas ───────────────────────────────
          tc.fillStyle = '#ffffff';
          tc.fillRect(0, 0, SIM_W, SIM_H);

          if(hasPos){
            const LERP = 0.14;
            if(trailX < 0){ trailX = rawX; trailY = rawY; }
            else {
              trailX += (rawX - trailX) * LERP;
              trailY += (rawY - trailY) * LERP;
            }
            // 2D canvas has y=0 at TOP; WebGL texture y=0 maps to canvas TOP,
            // but v_uv.y=0 is the BOTTOM of the screen.
            // Flip Y so trail appears at the correct screen position.
            const sx = trailX * SIM_W,  sy = (1.0 - trailY) * SIM_H;
            const rx = rawX   * SIM_W,  ry = (1.0 - rawY)   * SIM_H;

            // Thick line from lerped → raw
            tc.strokeStyle = '#000000';
            tc.lineWidth   = LWIDTH;
            tc.lineCap     = 'round';
            tc.lineJoin    = 'round';
            tc.beginPath();
            tc.moveTo(sx, sy);
            tc.lineTo(rx, ry);
            tc.stroke();

            // Solid circle at raw cursor tip
            tc.fillStyle = '#000000';
            tc.beginPath();
            tc.arc(rx, ry, LWIDTH * 0.55, 0, Math.PI * 2);
            tc.fill();
          }

          // Upload trail canvas → GPU texture
          gl.bindTexture(gl.TEXTURE_2D, trailTex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, trailCanvas);

          // ── 2. Fluid sim step (render into fboB, read from fboA) ─
          gl.useProgram(simProg);
          bindQuad(simProg);
          gl.viewport(0, 0, SIM_W, SIM_H);
          gl.bindFramebuffer(gl.FRAMEBUFFER, fboB.fbo);

          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, fboA.tex);
          gl.uniform1i(simU.prev, 0);

          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, trailTex);
          gl.uniform1i(simU.trail, 1);

          gl.uniform2f(simU.res,  SIM_W, SIM_H);
          gl.uniform1f(simU.time, t);

          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

          // Swap ping-pong buffers
          const tmp = fboA; fboA = fboB; fboB = tmp;

          // ── 3. Composite to display canvas ───────────────────────
          gl.useProgram(compProg);
          bindQuad(compProg);
          gl.viewport(0, 0, canvas.width, canvas.height);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);

          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, base.tex);
          gl.uniform1i(compU.base, 0);

          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, revealFrame.tex);
          gl.uniform1i(compU.reveal, 1);

          gl.activeTexture(gl.TEXTURE2);
          gl.bindTexture(gl.TEXTURE_2D, fboA.tex);
          gl.uniform1i(compU.fluid, 2);

          gl.uniform2f(compU.baseSize,   base.w, base.h);
          gl.uniform2f(compU.revealSize, revealFrame.w, revealFrame.h);
          gl.uniform2f(compU.canvas, canvas.width, canvas.height);

          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }

        requestAnimationFrame(frame);
      }).catch(err => {
        console.warn('[fluid-reveal] Unexpected error:', err);
        window._readyFlags.hero = true;
        window._checkAllReady();
      });  // end loadTex(base).then

      } // end initFluid

      if (document.readyState === 'complete') {
        initFluid();
      } else {
        window.addEventListener('load', initFluid);
      }
    })();


    // Hero name removed — no auto-fit needed.

    // ── Custom circle cursor (skipped on touch / coarse pointers) ──────────
    (function () {
      const isCoarse = window.matchMedia('(pointer: coarse)').matches
        || !window.matchMedia('(hover: hover)').matches;
      if (isCoarse) return;

      const cursor = document.querySelector('.custom-cursor');
      if (!cursor) return;

      let mx = window.innerWidth / 2, my = window.innerHeight / 2;
      let cx = mx, cy = my;
      let active = false;

      window.addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
        if (!active) { cursor.classList.add('is-ready'); active = true; }
      }, { passive: true });

      window.addEventListener('mouseleave', () => cursor.classList.remove('is-ready'));
      window.addEventListener('mouseenter', () => { if (active) cursor.classList.add('is-ready'); });

      // Hover-state delegation for any link/button/[data-cursor-hover]
      document.addEventListener('mouseover', e => {
        if (e.target.closest('a, button, [data-cursor-hover]')) {
          cursor.classList.add('custom-cursor--active');
        }
      });
      document.addEventListener('mouseout', e => {
        if (e.target.closest('a, button, [data-cursor-hover]')) {
          cursor.classList.remove('custom-cursor--active');
        }
      });

      function tick() {
        cx += (mx - cx) * 0.22;
        cy += (my - cy) * 0.22;
        cursor.style.setProperty('--cx', cx.toFixed(2) + 'px');
        cursor.style.setProperty('--cy', cy.toFixed(2) + 'px');
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    })();

    // ── Vibe Coding: SVG Mask Scroll Transition (Tympanus / Hiro-kiii) ──────
    (function () {
      'use strict';
      if (!window.gsap || !window.ScrollTrigger) return;

      const BLIND_COUNT = 30;
      const svgNS = 'http://www.w3.org/2000/svg';
      let blindsSets = [];
      let master = null;
      let progressTrigger = null;

      function createBlinds(groupId) {
        const g = document.getElementById(groupId);
        if (!g) return null;
        g.innerHTML = '';

        const width  = window.innerWidth;
        const height = window.innerHeight;
        if (!width || !height) return null;   // hidden/unsized viewport: skip, resize pass will redo
        const vbHeight = (height / width) * 100;
        const h = vbHeight / BLIND_COUNT;
        const blinds = [];
        let currentY = 0;

        for (let i = 0; i < BLIND_COUNT; i++) {
          const centerY = vbHeight - (currentY + h / 2);
          const rectTop    = document.createElementNS(svgNS, 'rect');
          const rectBottom = document.createElementNS(svgNS, 'rect');

          [rectTop, rectBottom].forEach(r => {
            r.setAttribute('x', 0);
            r.setAttribute('width', 100);
            r.setAttribute('height', 0);
            r.setAttribute('fill', 'white');
            r.setAttribute('shape-rendering', 'crispEdges');
          });
          rectTop.setAttribute('y', centerY);
          rectBottom.setAttribute('y', centerY);

          g.appendChild(rectTop);
          g.appendChild(rectBottom);

          blinds.push({ top: rectTop, bottom: rectBottom, y: centerY, h: h / 2 });
          currentY += h;
        }
        return blinds;
      }

      function updateLayout() {
        const width    = window.innerWidth;
        const height   = window.innerHeight;
        if (!width || !height) return;   // zero-size layout pass: skip, resize redoes it
        const vbWidth  = 100;
        const vbHeight = (height / width) * 100;

        const layers = document.querySelectorAll('#vibe-coding .vc-layer');
        if (!layers.length) return;
        blindsSets = [];

        layers.forEach(svg => {
          svg.setAttribute('viewBox', `0 0 ${vbWidth} ${vbHeight}`);
          const maskRect = svg.querySelector('mask rect');
          if (maskRect) {
            maskRect.setAttribute('width', vbWidth);
            maskRect.setAttribute('height', vbHeight);
          }
          const img = svg.querySelector('image');
          if (img) {
            img.setAttribute('width', vbWidth);
            img.setAttribute('height', vbHeight);
          }
          const groupEl = svg.querySelector('g[id^="vc-blinds-"]');
          if (!groupEl) return;
          const blinds = createBlinds(groupEl.id);
          if (blinds) blindsSets.push(blinds);
        });

        buildTimeline();
      }

      function openBlinds(blinds) {
        return gsap.timeline().to(
          blinds.flatMap(b => [b.top, b.bottom]),
          {
            attr: {
              y: i => {
                const b = blinds[Math.floor(i / 2)];
                return i % 2 === 0 ? b.y - b.h : b.y;
              },
              height: i => {
                const b = blinds[Math.floor(i / 2)];
                return b.h + 0.01;
              },
            },
            ease: 'power3.out',
            stagger: { each: 0.02, from: 'start' },
          }
        );
      }

      function textIn(el) {
        return gsap.to(el, {
          clipPath: 'inset(0% 0% 0% 0%)',
          y: 0,
          duration: 1.5,
          ease: 'expo.out',
        });
      }

      function textOut(el) {
        return gsap.to(el, {
          clipPath: 'inset(0% 0% 100% 0%)',
          y: -30,
          duration: 1.2,
          ease: 'power2.inOut',
        });
      }

      function buildTimeline() {
        if (master) master.kill();
        const texts = gsap.utils.toArray('#vibe-coding .vc-txt');
        const intro = document.querySelector('#vibe-coding .vc-intro');

        master = gsap.timeline({
          scrollTrigger: {
            trigger: '#vibe-coding',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 2.5,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // Hold the intro for a beat, then fade it out as the first reveal begins
        if (intro) {
          master.to({}, { duration: 0.6 }); // dwell on the intro
          master.to(intro, { opacity: 0, duration: 0.6, ease: 'power2.out' });
        }

        blindsSets.forEach((blinds, i) => {
          master.add(openBlinds(blinds));
          if (texts[i]) {
            master.add(textIn(texts[i]), '-=0.3');
            // Don't fade the LAST panel out — keep it visible at end
            if (i < blindsSets.length - 1) {
              master.add(textOut(texts[i]), '+=0.8');
            } else {
              master.to({}, { duration: 0.8 });
            }
          }
        });
      }

      function initProgress() {
        const fills   = gsap.utils.toArray('#vibe-coding .vc-fill');
        const counter = document.getElementById('vc-counter-current');
        if (progressTrigger) progressTrigger.kill();

        progressTrigger = ScrollTrigger.create({
          trigger: '#vibe-coding',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.3,
          onUpdate: self => {
            const progress = self.progress;
            const total = fills.length;
            let activeIdx = 0;
            fills.forEach((fill, i) => {
              let p = (progress - i / total) * total;
              p = Math.max(0, Math.min(1, p));
              fill.style.width = (p * 100) + '%';
              if (p > 0) activeIdx = i;
            });
            if (counter) {
              counter.textContent = String(activeIdx + 1).padStart(2, '0');
            }
          },
        });
      }

      function init() {
        if (!document.querySelector('#vibe-coding .vc-layer')) return;
        updateLayout();
        initProgress();

        let resizeTimer;
        window.addEventListener('resize', () => {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(updateLayout, 250);
        });
      }

      if (document.readyState === 'complete') init();
      else window.addEventListener('load', init);
    })();

    // Expertise section uses an ES-module backdrop — release splash gate now.
    if (window._readyFlags) {
      window._readyFlags.expertise = true;
      if (window._checkAllReady) window._checkAllReady();
    }

    // Back-to-top button (over the contact photo)
    (function () {
      const btn = document.getElementById('back-to-top');
      if (!btn) return;
      btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    })();
