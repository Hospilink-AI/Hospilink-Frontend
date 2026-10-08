import Svg, { Circle, Path } from 'react-native-svg';
import { ceil } from '../tokens';

/**
 * The wordmark's live-link arc, repeated outward like a signal. Decoration for navy surfaces only.
 * `size` is the width; the drawing is a half-disc, so the height is half of it.
 */
export function SignalArcs({ size = 280, rings = 5, opacity = 1 }: { size?: number; rings?: number; opacity?: number }) {
  const cx = 100;
  const cy = 100;
  const arcs = Array.from({ length: rings }, (_, i) => 18 + i * 17);
  return (
    <Svg width={size} height={size / 2} viewBox="0 0 200 100" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {arcs.map((r, i) => (
        <Path
          key={r}
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={ceil[400]}
          strokeWidth={i === 0 ? 5 : 3}
          strokeLinecap="round"
          opacity={opacity * (i === 0 ? 1 : Math.max(0.12, 0.62 - i * 0.12))}
        />
      ))}
      <Circle cx={cx} cy={cy} r={6} fill={ceil[400]} opacity={opacity} />
    </Svg>
  );
}
