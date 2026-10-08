import Svg, { Circle, G, Path } from 'react-native-svg';
import { ceil, palette } from '../tokens';
import { LOGO } from './logoPaths';

type Tone = 'navy' | 'white';

const INK: Record<Tone, string> = { navy: palette.navy, white: palette.white };
// The link always carries the blue: Ceil on light grounds, Ceil 400 on navy.
const LINK: Record<Tone, string> = { navy: palette.ceil, white: ceil[400] };

function ratio(viewBox: string) {
  const [, , w, h] = viewBox.split(' ').map(Number);
  return w / h;
}

/** The Hospilink wordmark. `height` is the rendered height in px; at 32 and below the small master is used. */
export function Wordmark({ height = 28, tone = 'navy' }: { height?: number; tone?: Tone }) {
  const g = height <= 32 ? LOGO.smallMaster : LOGO.wordmark;
  const width = height * ratio(g.viewBox);
  return (
    <Svg width={width} height={height} viewBox={g.viewBox} accessibilityRole="image" accessibilityLabel="Hospilink">
      <Path d={g.letters} fill={INK[tone]} />
      <Path d={g.arc} fill="none" stroke={LINK[tone]} strokeWidth={g.arcWidth} strokeLinecap="round" />
      {g.dots.map((d, i) => (
        <Circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={d.role === 'ink' ? INK[tone] : LINK[tone]} />
      ))}
    </Svg>
  );
}

/** Stacked lockup with the tagline, for splash and welcome. */
export function StackedLockup({ width = 240, tone = 'navy' }: { width?: number; tone?: Tone }) {
  const g = LOGO.stacked;
  const height = width / ratio(g.viewBox);
  return (
    <Svg width={width} height={height} viewBox={g.viewBox} accessibilityRole="image" accessibilityLabel="Hospilink. Live Staffing, Trusted Healthcare.">
      <Path d={g.letters} fill={INK[tone]} />
      <Path d={g.arc} fill="none" stroke={LINK[tone]} strokeWidth={g.arcWidth} strokeLinecap="round" />
      {g.dots.map((d, i) => (
        <Circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={d.role === 'ink' ? INK[tone] : LINK[tone]} />
      ))}
      {g.tagline ? <Path d={g.tagline} fill={tone === 'navy' ? '#414D64' : ceil[200]} /> : null}
    </Svg>
  );
}

/** The h with the live dot (app icon glyph). */
export function Mark({ size = 28, tone = 'navy' }: { size?: number; tone?: Tone }) {
  const m = LOGO.mark;
  return (
    <Svg width={size} height={size} viewBox={m.viewBox} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <G transform={`translate(${m.translateX} 0)`}>
        <Path d={m.letter} fill={INK[tone]} />
        <Path d={m.dot} fill={LINK[tone]} />
      </G>
    </Svg>
  );
}
