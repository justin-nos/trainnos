"use client";
import useWidth from "./useWidth";

const HEIGHT = 40;

// Tiny daily bars. Leads are small whole numbers, so bars rather than a line
// that would suggest values in between. Decorative: the caller says it in words.
export default function Sparkline({values, className = ""}) {
  const [ref, width] = useWidth();
  const n = values.length;
  const max = Math.max(...values, 1);
  const slot = n ? width / n : 0;
  const barW = Math.max(Math.min(slot - 2, 10), 1);
  return (
    <div ref={ref} className={className} aria-hidden="true">
      {width > 0 && (
        <svg width={width} height={HEIGHT}>
          {values.map((v, i) => {
            const h = v ? Math.max((v / max) * (HEIGHT - 2), 3) : 1;
            return (
              <rect
                key={i}
                x={i * slot + (slot - barW) / 2}
                y={HEIGHT - h}
                width={barW}
                height={h}
                rx={1}
                className={v ? "fill-red-500" : "fill-gray-200"}
              />
            );
          })}
        </svg>
      )}
    </div>
  );
}
