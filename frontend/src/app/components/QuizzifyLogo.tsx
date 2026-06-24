
"use client";

import React from "react";

interface QuizzifyLogoProps {
  className?: string;
  size?: number;
  color?: string;
}

export function QuizzifyLogo({ 
  className = "", 
  size = 24, 
  color = "currentColor" 
}: QuizzifyLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Book base */}
      <path
        d="M8 10C8 8.34315 9.34315 7 11 7H23C23.5523 7 24 7.44772 24 8V40C24 40.5523 23.5523 41 23 41H11C9.34315 41 8 39.6569 8 38V10Z"
        fill={color}
        opacity={0.9}
      />
      {/* Book pages */}
      <path
        d="M24 8C24 7.44772 24.4477 7 25 7H37C38.6569 7 40 8.34315 40 10V38C40 39.6569 38.6569 41 37 41H25C24.4477 41 24 40.5523 24 40V8Z"
        fill={color}
        opacity={0.7}
      />
      {/* Book spine */}
      <rect
        x="21"
        y="7"
        width="6"
        height="34"
        rx="1"
        fill={color}
        opacity={1}
      />
      {/* Quiz check mark / highlight */}
      <path
        d="M14 20L19 25L34 14"
        stroke={color === "currentColor" ? "white" : "white"}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
