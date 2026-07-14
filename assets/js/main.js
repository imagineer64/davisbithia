/* Davisbithia scrollytelling — GSAP ScrollTrigger drives every effect.
   All animation is scroll-scrubbed; with prefers-reduced-motion the page
   is fully readable with no JS effects at all. */

(function () {
    'use strict';

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || typeof gsap === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    /* ===== Chapter 1: hero — pinned camera descent =====
       The scene pins for an extra viewport of scrolling while the
       artwork zooms out from 1.35x to 1x and drifts upward, reading
       as a camera descending into the valley. The title sinks and
       fades as the scene releases. */

    gsap.timeline({
        scrollTrigger: {
            trigger: '.scene-hero',
            start: 'top top',
            end: '+=120%',
            scrub: 0.6,
            pin: true
        }
    })
    .fromTo('[data-hero-bg]',
        { scale: 1.35, yPercent: -6 },
        { scale: 1, yPercent: 0, ease: 'none' }, 0)
    .fromTo('.hero-copy',
        { yPercent: 0, opacity: 1 },
        { yPercent: 35, opacity: 0, ease: 'power1.in' }, 0.25)
    .to('.scroll-hint', { opacity: 0, duration: 0.15 }, 0)
    .fromTo('.mist-1',
        { xPercent: -8 }, { xPercent: 8, ease: 'none' }, 0)
    .fromTo('.mist-2',
        { xPercent: 6 }, { xPercent: -6, ease: 'none' }, 0);

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

    /* ===== Chapter 3: valley — pinned scene, captions swap =====
       The scene pins for two extra viewports. The artwork slowly pans
       while each caption fades in, holds, and hands off to the next —
       the classic Apple pinned-caption pattern. */

    var captions = gsap.utils.toArray('[data-caption]');
    var valleyTl = gsap.timeline({
        scrollTrigger: {
            trigger: '.scene-valley',
            start: 'top top',
            end: '+=200%',
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

    /* ===== Fireflies — ambient canvas particles over the hero ===== */

    var canvas = document.querySelector('.fireflies');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var flies = [];
    var FLY_COUNT = 28;

    function resize() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }

    function spawn() {
        return {
            x: Math.random() * canvas.width,
            y: canvas.height * (0.35 + Math.random() * 0.65),
            r: 1 + Math.random() * 2.2,
            vx: (Math.random() - 0.5) * 0.25,
            vy: -0.05 - Math.random() * 0.2,
            phase: Math.random() * Math.PI * 2,
            speed: 0.008 + Math.random() * 0.02
        };
    }

    resize();
    window.addEventListener('resize', resize);
    for (var i = 0; i < FLY_COUNT; i++) flies.push(spawn());

    function tick() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (var i = 0; i < flies.length; i++) {
            var f = flies[i];
            f.x += f.vx;
            f.y += f.vy;
            f.phase += f.speed;
            if (f.y < -10 || f.x < -10 || f.x > canvas.width + 10) {
                flies[i] = spawn();
                flies[i].y = canvas.height + 5;
                continue;
            }
            var glow = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(f.phase));
            var grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 4);
            grad.addColorStop(0, 'rgba(240, 205, 126, ' + (0.9 * glow) + ')');
            grad.addColorStop(1, 'rgba(240, 205, 126, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.r * 4, 0, Math.PI * 2);
            ctx.fill();
        }
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
})();
