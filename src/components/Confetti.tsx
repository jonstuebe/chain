import { useEffect, useRef } from 'react';

const DURATION = 6000;
const COUNT = 140;

interface Piece {
  x: number;
  y: number;
  /** Fall speed, px per 60fps frame. */
  vy: number;
  /** Side-to-side sway: how far, how fast, and where in the swing it starts. */
  sway: number;
  swaySpeed: number;
  phase: number;
  size: number;
  spin: number;
  angle: number;
  color: string;
}

/** A one-off shower of confetti raining down the whole screen. Skipped under reduced motion. */
export function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const css = getComputedStyle(document.documentElement);
    const colors = ['--accent', '--match', '--ink'].map((name) => css.getPropertyValue(name).trim() || '#e4572e');
    colors.push('#f4c542');

    const w = window.innerWidth;
    const h = window.innerHeight;
    // Pieces start above the top edge, staggered, and drift down at a gentle pace.
    const pieces: Piece[] = Array.from({ length: COUNT }, (_, i) => ({
      x: Math.random() * w,
      y: -20 - Math.random() * h * 0.7,
      vy: 1.6 + Math.random() * 1.4,
      sway: 0.4 + Math.random() * 0.8,
      swaySpeed: 0.02 + Math.random() * 0.03,
      phase: Math.random() * Math.PI * 2,
      size: 6 + Math.random() * 6,
      spin: (Math.random() - 0.5) * 0.2,
      angle: Math.random() * Math.PI,
      color: colors[i % colors.length],
    }));

    let frame = 0;
    const start = performance.now();
    let last = start;
    const tick = (now: number) => {
      const t = now - start;
      // Move by elapsed time, not frames, so 120Hz screens don't rain twice as fast.
      const k = Math.min(30, (now - last) / (1000 / 60));
      last = now;
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = Math.min(1, (DURATION - t) / 800);
      for (const p of pieces) {
        p.phase += p.swaySpeed * k;
        p.x += Math.sin(p.phase) * p.sway * k;
        p.y += p.vy * k;
        p.angle += p.spin * k;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        // Flutter: squash the width as the piece turns over.
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size * Math.cos(p.angle * 2), p.size / 2);
        ctx.restore();
      }
      if (t < DURATION) frame = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, w, h);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={ref} className="confetti" aria-hidden="true" />;
}
