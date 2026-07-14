/* Davisbithia scrollytelling — GSAP ScrollTrigger drives every effect.
   Chapter 1 is a pre-rendered flight: scroll scrubs through a WebP frame
   sequence drawn to a canvas (the same technique Apple product pages use).
   With prefers-reduced-motion the page is fully readable with no effects. */

(function () {
    'use strict';

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || typeof gsap === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    var RIDE_FRAME_COUNT = 181;   /* updated after scene-2 frame extraction */

    /* ===== Frame-scrub engine =====
       Pins a scene while scroll position picks which frame of a
       pre-rendered sequence to draw on its canvas. Frames load
       coarse-first (every 12th) so scrubbing works during download,
       and the renderer falls back to the nearest loaded frame. */

    function frameScrub(opts) {
        var canvas = document.querySelector(opts.canvas);
        var ctx = canvas.getContext('2d');
        var frames = new Array(opts.count);
        var loaded = new Array(opts.count).fill(false);
        var current = { i: 0 };
        var drawnIndex = -1;

        function drawCover(img) {
            var cw = canvas.width, ch = canvas.height;
            var s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
            var w = img.naturalWidth * s, h = img.naturalHeight * s;
            ctx.clearRect(0, 0, cw, ch);
            ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
        }

        function render() {
            var use = Math.round(current.i);
            while (use > 0 && !loaded[use]) use--;
            if (!loaded[use] || use === drawnIndex) return;
            drawnIndex = use;
            drawCover(frames[use]);
        }

        function resize() {
            canvas.width = canvas.offsetWidth * Math.min(devicePixelRatio, 2);
            canvas.height = canvas.offsetHeight * Math.min(devicePixelRatio, 2);
            drawnIndex = -1;
            render();
        }
        window.addEventListener('resize', resize);

        function loadFrame(i, cb) {
            var img = new Image();
            img.onload = function () { loaded[i] = true; frames[i] = img; if (cb) cb(); render(); };
            img.src = opts.path(i);
            frames[i] = img;
        }
        loadFrame(0, resize);
        var order = [];
        for (var i = 1; i < opts.count; i += 12) order.push(i);
        for (var j = 1; j < opts.count; j++) if ((j - 1) % 12 !== 0) order.push(j);
        var cursor = 0;
        function pump() {
            if (cursor >= order.length) return;
            loadFrame(order[cursor++], pump);
        }
        for (var k = 0; k < 6; k++) pump();

        var tl = gsap.timeline({
            scrollTrigger: {
                trigger: opts.scene,
                start: 'top top',
                end: '+=' + opts.pin,
                scrub: 0.4,
                pin: true
            }
        });
        tl.to(current, { i: opts.count - 1, ease: 'none', duration: 10, onUpdate: render }, 0);
        return tl;
    }

    /* ===== Chapter 1: The Flight — approach over the bridge ===== */

    frameScrub({
        scene: '.scene-flight',
        canvas: '.flight-canvas',
        count: 181,
        path: function (i) { return 'assets/frames/f-' + String(i + 1).padStart(3, '0') + '.webp'; },
        pin: '500%'
    })
    .to('.hero-copy', { yPercent: 30, opacity: 0, ease: 'power1.in', duration: 1.6 }, 0.4)
    .to('.scroll-hint', { opacity: 0, duration: 0.4 }, 0)
    .fromTo('.scene-flight .flight-caption',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, ease: 'power1.out', duration: 1.5 }, 7.6)
    .to('.scene-flight .flight-caption', { opacity: 0, y: -20, ease: 'power1.in', duration: 1 }, 9.2);

    /* ===== Chapter 1b: The Ride — POV from the dragon's back ===== */

    frameScrub({
        scene: '.scene-ride',
        canvas: '.ride-canvas',
        count: RIDE_FRAME_COUNT,
        path: function (i) { return 'assets/frames2/f-' + String(i + 1).padStart(3, '0') + '.webp'; },
        pin: '500%'
    })
    .fromTo('.ride-caption',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, ease: 'power1.out', duration: 1.2 }, 0.5)
    .to('.ride-caption', { opacity: 0, y: -20, ease: 'power1.in', duration: 1 }, 2.6);

    /* ===== Chapter 2: interlude lines rise in one by one ===== */

    gsap.utils.toArray('[data-reveal]').forEach(function (el) {
        gsap.fromTo(el,
            { y: 40, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    end: 'top 55%',
                    scrub: 0.4
                }
            });
    });

    /* ===== Chapter 3: valley — pinned scene, captions swap ===== */

    var captions = gsap.utils.toArray('[data-caption]');
    var valleyTl = gsap.timeline({
        scrollTrigger: {
            trigger: '.scene-valley',
            start: 'top top',
            end: '+=250%',
            scrub: 0.6,
            pin: true
        }
    });

    valleyTl.fromTo('[data-valley-bg]',
        { scale: 1.15, yPercent: 5 },
        { scale: 1, yPercent: -3, ease: 'none' }, 0);

    var slot = 1 / captions.length;
    captions.forEach(function (cap, i) {
        var at = i * slot;
        valleyTl.fromTo(cap,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: slot * 0.35, ease: 'power1.out' }, at);
        if (i < captions.length - 1) {
            valleyTl.to(cap,
                { opacity: 0, y: -30, duration: slot * 0.3, ease: 'power1.in' },
                at + slot * 0.7);
        }
    });

    /* ===== Chapter 4: cards rise as they enter ===== */

    gsap.utils.toArray('[data-card]').forEach(function (card, i) {
        gsap.fromTo(card,
            { y: 60, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.7,
                delay: i * 0.12,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: card,
                    start: 'top 88%',
                    toggleActions: 'play none none reverse'
                }
            });
    });
})();
