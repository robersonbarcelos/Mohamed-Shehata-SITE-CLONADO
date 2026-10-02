    (function () {
      const canvas = document.getElementById('glow-cursor');
      if (!canvas || getComputedStyle(canvas).display === 'none') return;
      const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
      if (!gl) return;

      const cfg = {
        color: '#ff7a2e',            // trail head — bright brand orange
        secondaryColor: '#e84020',   // trail tail — --accent
        trailLength: 30,
        trailWidth: 7,
        trailTaper: 0.8,
        followSpeed: 0.18,
        glowIntensity: 1.7,
        glowSpread: 1.1,
        hotspot: 0.55,
        brightness: 1.2,
        opacity: 0.9,
        pulseSpeed: 1.1,
        noiseStrength: 0.03,
        idleTimeout: 3000,
        fadeDuration: 600,
        maxDpr: 1
      };
      const MAX_POINTS = 32;

      const VS = `attribute vec2 position;attribute vec2 uv;varying vec2 vUv;
        void main(){vUv=uv;gl_Position=vec4(position,0.,1.);}`;
      const FS = `precision highp float;
#define MAX_POINTS 32
uniform vec2 uResolution;uniform vec2 uPoints[MAX_POINTS];uniform float uPointCount;
uniform vec3 uColor;uniform vec3 uSecondaryColor;uniform float uTrailWidth;uniform float uTaper;
uniform float uGlowIntensity;uniform float uGlowSpread;uniform float uHotspot;uniform float uBrightness;
uniform float uOpacity;uniform float uPulseSpeed;uniform float uNoiseStrength;uniform float uTime;uniform float uFade;
varying vec2 vUv;
float sRGB(float x){if(x<=0.00031308)return 12.92*x;return 1.055*pow(x,1.0/2.4)-0.055;}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float filmGrain(vec2 p,float time){float frame=time*18.0;float fi=mod(floor(frame),256.0);float ni=mod(fi+1.0,256.0);
  float b=fract(frame);b=b*b*(3.0-2.0*b);vec2 px=floor(p);
  float c=hash(px+vec2(fi*17.0,fi*31.0));float n=hash(px+vec2(ni*17.0,ni*31.0));return mix(c,n,b)*2.0-1.0;}
void main(){
  vec2 pixel=vUv*uResolution;float denom=max(uPointCount-1.0,1.0);
  float strongest=0.0;float strongestCore=0.0;float cw=0.0;vec3 cs=vec3(0.0);
  for(int i=0;i<MAX_POINTS-1;i++){
    float index=float(i);float active=1.0-step(uPointCount-1.0,index);
    vec2 s=uPoints[i];vec2 e=uPoints[i+1];vec2 tp=pixel-s;vec2 seg=e-s;
    float along=clamp(dot(tp,seg)/max(dot(seg,seg),0.0001),0.0,1.0);
    float progress=clamp((index+along)/denom,0.0,1.0);
    float life=pow(max(1.0-progress,0.0),mix(0.55,1.25,uTaper));
    float width=uTrailWidth*mix(1.0,0.25,pow(progress,mix(0.55,1.6,uTaper)));
    float d=length(tp-seg*along);
    float falloff=max(width*(0.8+uGlowSpread*1.4),0.5);
    float beam=min(1.0,(falloff*falloff)/(d*d+falloff*falloff));
    float core=exp(-pow(d/max(width,0.5),2.0)*2.5);
    float pa=min(abs(uPulseSpeed),1.0);
    float pulse=1.0+sin(uTime*uPulseSpeed*3.0-progress*11.0)*0.16*pa;
    float intensity=(core+beam*uGlowIntensity*0.55)*life*pulse*active;
    vec3 sc=mix(uColor,uSecondaryColor,progress);
    strongest=max(strongest,intensity);strongestCore=max(strongestCore,core*life*active);
    cs+=sc*intensity;cw+=intensity;}
  float grain=filmGrain(pixel,uTime);float na=(1.0-exp(-uNoiseStrength*2.2))*0.4;
  vec3 color=cs/max(cw,0.0001);
  float a=clamp(strongest*uBrightness*uOpacity*uFade,0.0,1.0);
  a=clamp(a*(1.0+grain*na),0.0,1.0);
  if(a<0.0015)discard;
  color=mix(color,vec3(1.0),smoothstep(0.45,1.0,strongestCore)*uHotspot*0.35);
  gl_FragColor=vec4(color*a,a);}`;

      const compile = (type, src) => {
        const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.warn('glow-cursor shader:', gl.getShaderInfoLog(sh)); return null; }
        return sh;
      };
      const vs = compile(gl.VERTEX_SHADER, VS), fs = compile(gl.FRAGMENT_SHADER, FS);
      if (!vs || !fs) return;
      const prog = gl.createProgram();
      gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
      gl.useProgram(prog);

      // Fullscreen triangle
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 0,0,  3,-1, 2,0,  -1,3, 0,2]), gl.STATIC_DRAW);
      const aPos = gl.getAttribLocation(prog, 'position'), aUv = gl.getAttribLocation(prog, 'uv');
      gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(aUv);  gl.vertexAttribPointer(aUv,  2, gl.FLOAT, false, 16, 8);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      const U = {};
      ['uResolution','uPoints','uPointCount','uColor','uSecondaryColor','uTrailWidth','uTaper','uGlowIntensity',
       'uGlowSpread','uHotspot','uBrightness','uOpacity','uPulseSpeed','uNoiseStrength','uTime','uFade']
        .forEach(n => U[n] = gl.getUniformLocation(prog, n));

      const hexToRgb = hex => { const v = hex.replace('#',''); const p = parseInt(v,16);
        return [((p>>16)&255)/255, ((p>>8)&255)/255, (p&255)/255]; };
      const clamp = (v,a,b) => Math.min(Math.max(v,a),b);

      // Static uniforms
      gl.uniform3fv(U.uColor, hexToRgb(cfg.color));
      gl.uniform3fv(U.uSecondaryColor, hexToRgb(cfg.secondaryColor));
      gl.uniform1f(U.uPointCount, clamp(cfg.trailLength, 2, MAX_POINTS));
      gl.uniform1f(U.uTrailWidth, cfg.trailWidth);
      gl.uniform1f(U.uTaper, cfg.trailTaper);
      gl.uniform1f(U.uGlowIntensity, cfg.glowIntensity);
      gl.uniform1f(U.uGlowSpread, cfg.glowSpread);
      gl.uniform1f(U.uHotspot, cfg.hotspot);
      gl.uniform1f(U.uBrightness, cfg.brightness);
      gl.uniform1f(U.uOpacity, cfg.opacity);
      gl.uniform1f(U.uPulseSpeed, cfg.pulseSpeed);
      gl.uniform1f(U.uNoiseStrength, cfg.noiseStrength);

      const pointData = new Float32Array(MAX_POINTS * 2);
      const points = Array.from({ length: MAX_POINTS }, () => ({ x: 0, y: 0 }));
      const target = { x: 0, y: 0 }, head = { x: 0, y: 0 };
      let W = 1, H = 1, initialized = false, pointerInside = false, fade = 0;
      let lastInput = performance.now(), lastFrame = performance.now(), raf = 0, running = false;

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, cfg.maxDpr);
        W = Math.max(window.innerWidth, 1); H = Math.max(window.innerHeight, 1);
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(U.uResolution, W, H);
      };

      const onMove = e => {
        const x = clamp(e.clientX, 0, W), y = clamp(H - e.clientY, 0, H);
        if (!initialized) { target.x = head.x = x; target.y = head.y = y;
          for (const p of points) { p.x = x; p.y = y; } initialized = true; fade = 1; }
        target.x = x; target.y = y; pointerInside = true; lastInput = performance.now();
        if (!running) start();
      };
      const onLeave = () => { pointerInside = false; lastInput = performance.now(); };

      const render = now => {
        if (!running) return;
        const delta = Math.min((now - lastFrame) / 16.667, 3); lastFrame = now;
        if (initialized) {
          const headEase = 1 - Math.pow(1 - clamp(cfg.followSpeed, 0.01, 0.99), delta);
          const chainEase = 1 - Math.pow(1 - clamp(0.28 + cfg.followSpeed * 0.35, 0.08, 0.92), delta);
          head.x += (target.x - head.x) * headEase; head.y += (target.y - head.y) * headEase;
          points[0].x = head.x; points[0].y = head.y;
          for (let i = 1; i < MAX_POINTS; i++) {
            points[i].x += (points[i-1].x - points[i].x) * chainEase;
            points[i].y += (points[i-1].y - points[i].y) * chainEase;
          }
          for (let i = 0; i < MAX_POINTS; i++) { pointData[i*2] = points[i].x; pointData[i*2+1] = points[i].y; }
        }
        const idleFor = now - lastInput;
        const shouldFade = !pointerInside || idleFor > cfg.idleTimeout;
        const fadeStep = (16.667 * delta) / Math.max(cfg.fadeDuration, 16);
        fade += ((initialized && !shouldFade ? 1 : 0) - fade) * Math.min(1, fadeStep * 7);

        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        if (fade > 0.002) {
          gl.uniform2fv(U.uPoints, pointData);
          gl.uniform1f(U.uTime, now * 0.001);
          gl.uniform1f(U.uFade, fade);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          raf = requestAnimationFrame(render);
        } else {
          running = false;   // fully faded: stop the loop until the pointer moves again
        }
      };
      const start = () => { running = true; lastFrame = performance.now(); raf = requestAnimationFrame(render); };

      // Scrolling doesn't emit pointermove, so treat wheel/scroll as activity
      // — otherwise the trail idle-fades the moment you start scrolling.
      const onScroll = () => {
        if (!initialized) return;
        pointerInside = true; lastInput = performance.now();
        if (!running) start();
      };
      window.addEventListener('wheel', onScroll, { passive: true });
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', resize, { passive: true });
      window.addEventListener('pointermove', onMove, { passive: true });
      document.addEventListener('pointerleave', onLeave);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) { running = false; cancelAnimationFrame(raf); }
        else if (initialized) start();
      });
      resize();
    })();