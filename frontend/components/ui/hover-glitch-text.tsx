"use client";

import { useState } from 'react';
import LetterGlitch from './letter-glitch';

export default function HoverGlitchText({ text = "POWERING" }: { text?: string }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <span
      className="relative inline-block overflow-hidden text-balance cursor-default"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span 
        className={`transition-opacity duration-200 ease-in-out ${
          isHovered ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {text}
      </span>

      {isHovered && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LetterGlitch
            glitchSpeed={50}
            centerVignette={false}
            outerVignette={false} 
            smooth={true}
          />
        </div>
      )}
    </span>
  );
}