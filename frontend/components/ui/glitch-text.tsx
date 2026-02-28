"use client";

import { useState, useRef, useEffect } from "react";

const characters = 'ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロヮワヰヱヲンヴヵヶ0123456789';
interface GlitchTextProps {
  text: string;
  className?: string;
  glitchSpeed?: number; // ms between character updates
}

export default function GlitchText({
  text,
  className = "",
  glitchSpeed = 80,
}: GlitchTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const originalText = text;

  const getRandomChar = () => {
    return characters[Math.floor(Math.random() * characters.length)];
  };

  const scrambleText = () => {
    let newText = "";
    for (let i = 0; i < originalText.length; i++) {
      // Keep spaces as spaces, scramble everything else
      if (originalText[i] === ' ') {
        newText += ' ';
      } else {
        newText += getRandomChar();
      }
    }
    setDisplayText(newText);
  };

  const handleMouseEnter = () => {
    // Start scrambling immediately
    scrambleText();
    // Set up an interval to keep scrambling
    intervalRef.current = setInterval(scrambleText, glitchSpeed);
  };

  const handleMouseLeave = () => {
    // Stop the interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Reset text back to original
    setDisplayText(originalText);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Inside glitch-text.tsx, change the return statement to this:
  return (
    <span
      className={`cursor-pointer inline-block whitespace-pre-wrap ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ fontVariantNumeric: "tabular-nums" }} 
    >
      {displayText}
    </span>
  );
}