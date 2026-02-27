"use client";

import { useRef, useEffect } from "react";

export default function CursorRevealSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const frontLayerRef = useRef<HTMLDivElement>(null);

  // ===== SETTINGS =====
  const MAX_RADIUS = 240;
  const FOLLOW_SPEED = 0.12; // cursor follow
  const RADIUS_SPEED = 0.18; // grow / shrink speed

  const mouse = useRef({ x: 0, y: 0 });
  const blob = useRef({ x: 0, y: 0 });
  const radius = useRef(0);
  const targetRadius = useRef(0);
  const active = useRef(false);

  useEffect(() => {
    let raf: number;

    const animate = () => {
      if (active.current || radius.current > 0.5) {
        // smooth follow
        blob.current.x += (mouse.current.x - blob.current.x) * FOLLOW_SPEED;
        blob.current.y += (mouse.current.y - blob.current.y) * FOLLOW_SPEED;

        // smooth radius (moon grow)
        radius.current +=
          (targetRadius.current - radius.current) * RADIUS_SPEED;

        if (frontLayerRef.current) {
          frontLayerRef.current.style.clipPath = `circle(${radius.current}px at ${blob.current.x}px ${blob.current.y}px)`;
        }
      }

      raf = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(raf);
  }, []);

  const updateMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = sectionRef.current!.getBoundingClientRect();
    mouse.current.x = e.clientX - rect.left;
    mouse.current.y = e.clientY - rect.top;
  };

  const handleEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    updateMouse(e);

    blob.current.x = mouse.current.x;
    blob.current.y = mouse.current.y;

    active.current = true;
    targetRadius.current = MAX_RADIUS; // grow
  };

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    updateMouse(e);
  };

  const handleLeave = () => {
    active.current = false;
    targetRadius.current = 0; // shrink
  };

  return (
    <>
      <section
        ref={sectionRef}
       className="cursor-section -mt-[1px] relative z-10 border-none outline-none"
        onMouseEnter={handleEnter}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        {/* Base */}
        <div className="layer layer--bg">
          <div className="text">
            <span className="eyebrow">// OUR MISSION</span>
            <p className="headline">
              We engineer next-generation solar infrastructure designed for
              long-term durability, high efficiency, and industrial-grade energy
              performance across global environments.
            </p>
          </div>
        </div>

        <div ref={frontLayerRef} className="layer layer--fg">
          <div className="text">
            <span className="eyebrow">// OUR VISION</span>
            <p className="headline">
              Accelerating the global transition to clean energy through
              advanced photovoltaic innovation, sustainable manufacturing, and
              scalable renewable deployment worldwide.
            </p>
          </div>
        </div>
      </section>

      <style jsx>{`
        .cursor-section {
          position: relative;
          height: 100vh;
          overflow: hidden;
          display: block; /* Removed flex centering from parent */
        }

        .layer {
          position: absolute;
          inset: 0;
          display: flex;
          justify-content: center;
          /* THE FIX: Align from the top, not the middle */
          align-items: flex-start; 
          /* THE FIX: Push the text down to the visual center of the screen */
          padding-top: 35vh; 
          text-align: center;
        }

        .text {
          width: min(1000px, 90vw);
          display: block;
        }

        .layer--bg {
          background: var(--background);
          z-index: 1;
        }

        .layer--bg .eyebrow { color: var(--muted-foreground); }
        .layer--bg .headline  { color: var(--foreground); }

        .layer--fg {
          background: var(--primary);
          z-index: 2;
          clip-path: circle(0px at 50% 50%);
          will-change: clip-path;
        }

        .layer--fg .eyebrow { color: #fff; }
        .layer--fg .headline  { color: #050505; }

        .eyebrow {
          display: block;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          margin-bottom: 28px;
        }

        .headline {
          margin: 0;
          font-family: var(--font-sans);
          font-size: clamp(28px, 4.5vw, 64px);
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.03em;
        }

        @media (max-width: 768px) {
          .cursor-section {
            height: auto;
            padding: 80px 24px;
            display: flex;
          }

          .layer {
            position: relative;
            padding-top: 0; /* Reset desktop padding */
            padding: 40px 0;
          }

          .layer--fg {
            display: none;
          }
        }
      `}</style>
    </>
  );
}