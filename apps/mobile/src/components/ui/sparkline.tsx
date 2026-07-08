import { cn } from '@/shared/lib/utils';
import { useThemeColors } from '@/shared/lib/theme-colors';
import * as React from 'react';
import Svg, { Polyline } from 'react-native-svg';

type SparklineProps = {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  /** Fill the area under the line. */
  fill?: boolean;
  /** Override the line color (defaults to the primary hue). */
  color?: string;
  className?: string;
};

/**
 * A tiny inline trend line (for stat tiles, list rows). No axes — just the shape
 * of the series. Primary-hued by default.
 */
function Sparkline({ data, width = 88, height = 28, strokeWidth = 2, fill, color, className }: SparklineProps) {
  const colors = useThemeColors();
  const stroke = color ?? colors.primary;

  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = strokeWidth;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = pad + (1 - (v - min) / range) * (height - 2 * pad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = points.join(' ');
  const area = `0,${height} ${line} ${width},${height}`;

  return (
    <Svg width={width} height={height} className={className}>
      {fill ? <Polyline points={area} fill={stroke} fillOpacity={0.12} stroke="none" /> : null}
      <Polyline
        points={line}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export { Sparkline };
export type { SparklineProps };
