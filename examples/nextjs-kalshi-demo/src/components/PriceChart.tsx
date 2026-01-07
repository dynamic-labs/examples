"use client";

interface PriceChartProps {
  yesPercentage: number;
  noPercentage: number;
}

export default function PriceChart({ yesPercentage, noPercentage }: PriceChartProps) {
  // Generate chart path data
  const generateChartPath = (percentage: number, isYes: boolean) => {
    const height = 48;
    const width = 180;
    const points: string[] = [];
    
    // Generate 6 points for the chart
    const numPoints = 6;
    for (let i = 0; i < numPoints; i++) {
      const x = (i / (numPoints - 1)) * width;
      // Add some variation based on position
      const variation = Math.sin(i * 0.8) * 8;
      const y = height - (percentage / 100) * height + variation;
      points.push(`${x},${Math.max(4, Math.min(height - 4, y))}`);
    }
    
    return `M ${points.join(" L ")}`;
  };

  return (
    <div className="absolute right-0 top-0 bottom-0 left-[100px] flex items-center justify-center">
      <svg
        width="100%"
        height="48"
        viewBox="0 0 180 48"
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        {/* Yes line */}
        <path
          d={generateChartPath(yesPercentage, true)}
          fill="none"
          stroke="#14b8a6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-80"
        />
        {/* No line */}
        <path
          d={generateChartPath(noPercentage, false)}
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-80"
        />
        {/* Yes endpoint dot */}
        <circle
          cx="180"
          cy={48 - (yesPercentage / 100) * 48}
          r="3"
          fill="#14b8a6"
        />
        {/* No endpoint dot */}
        <circle
          cx="180"
          cy={48 - (noPercentage / 100) * 48}
          r="3"
          fill="#ef4444"
        />
      </svg>
    </div>
  );
}

