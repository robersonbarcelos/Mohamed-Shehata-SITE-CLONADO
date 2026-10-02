    // Three.js grid (and its ~600 KB module) only downloads once the
    // Expertise section is within a viewport of scrolling into view.
    const canvas = document.getElementById('exp-cyl-canvas');
    if (canvas) {
      const initGrid = async () => {
        const { default: Grid2Background } =
          await import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.17/build/backgrounds/grid2.cdn.min.js');
        const bg = Grid2Background(canvas);

        // Orange palette — three shades for the cylinder colour rotation
        // 0xff7a2e bright orange / 0xe84020 brand accent / 0x8a2410 deep burnt
        bg.grid.setColors([0xff7a2e, 0xe84020, 0x8a2410]);

        // Warm orange lights
        bg.grid.light1.color.set(0xff8a3d);
        bg.grid.light1.intensity = 900;
        bg.grid.light2.color.set(0xe84020);
        bg.grid.light2.intensity = 350;

        // Re-roll cylinder colours on click (subtle interaction)
        canvas.addEventListener('click', () => {
          const oranges = [0xff9a4a, 0xff7a2e, 0xe84020, 0xa8330f, 0x6b1a08];
          const pick = () => oranges[Math.floor(Math.random() * oranges.length)];
          bg.grid.setColors([pick(), pick(), pick()]);
        });
      };
      const gridObs = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) { gridObs.disconnect(); initGrid(); }
      }, { rootMargin: '40% 0px' });
      // Observe only after load: before GSAP adds its pin spacers the page is
      // compact and the canvas sits within a viewport of the top.
      if (document.readyState === 'complete') gridObs.observe(canvas);
      else window.addEventListener('load', () => gridObs.observe(canvas), { once: true });
    }

    // Experiment covers: the SVG <image> hrefs are held in data-href so the
    // nine backgrounds don't compete with the hero at load. Inject them once
    // the Experiments section is within two viewports.
    const vc = document.getElementById('vibe-coding');
    if (vc) {
      const injectCovers = () => {
        vc.querySelectorAll('image[data-href]').forEach(img => {
          img.setAttribute('href', img.getAttribute('data-href'));
          img.removeAttribute('data-href');
        });
      };
      const vcObs = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) { vcObs.disconnect(); injectCovers(); }
      }, { rootMargin: '100% 0px' });
      // Same as the grid: register after load so GSAP's pin spacers exist.
      if (document.readyState === 'complete') vcObs.observe(vc);
      else window.addEventListener('load', () => vcObs.observe(vc), { once: true });
    }

    // Explainer video: autoplay makes browsers fetch the whole file at load,
    // so the src is attached only when the block is within a viewport.
    document.querySelectorAll('video[data-src]').forEach(v => {
      const vObs = new IntersectionObserver((entries) => {
        if (!entries.some(e => e.isIntersecting)) return;
        vObs.disconnect();
        v.src = v.dataset.src;
        v.removeAttribute('data-src');
        v.play().catch(() => {});
      }, { rootMargin: '100% 0px' });
      vObs.observe(v);
    });