
"use client";

import React from "react";
import { BookOpen } from "lucide-react";

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
  return <BookOpen className={className} size={size} color={color} />;
}
