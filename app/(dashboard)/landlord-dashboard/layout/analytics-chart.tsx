"use client";

import { useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";

interface AnalyticsChartProps {
  bars: number[];
}

export function AnalyticsChart({ bars }: AnalyticsChartProps) {
  const [ref, inView] = useInView({ 
    threshold: 0.1,
    triggerOnce: true 
  });
  
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (inView) {
      barsRef.current.forEach((bar, index) => {
        if (bar) {
          setTimeout(() => {
            bar.style.height = `${bars[index]}%`;
          }, 500 + index * 50);
        }
      });
    }
  }, [inView, bars]);

  return (
    <div ref={ref} className="flex items-end h-32 gap-1">
      {bars.map((height, index) => (
        <div
          key={index}
          ref={el => { barsRef.current[index] = el; }}
          className="bg-green-700 rounded-sm flex-1 transition-all duration-1000 ease-out"
          style={{ height: "0%" }}
        ></div>
      ))}
    </div>
  );
}
