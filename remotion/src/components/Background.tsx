import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const drift = interpolate(frame, [0, durationInFrames], [0, 120]);
  const pulse = 0.5 + 0.5 * Math.sin(frame / 55);

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 620px at ${18 + drift * 0.4}% ${28 + drift * 0.12}%, rgba(34,211,238,${0.1 + pulse * 0.06}), transparent 65%), radial-gradient(760px 540px at ${86 - drift * 0.25}% 78%, rgba(245,158,11,0.08), transparent 62%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${theme.line} 1px, transparent 1px), linear-gradient(90deg, ${theme.line} 1px, transparent 1px)`,
          backgroundSize: "96px 96px",
          backgroundPosition: `${-drift}px ${drift * 0.5}px`,
          opacity: 0.32,
          maskImage: "radial-gradient(circle at 50% 50%, black, transparent 78%)",
        }}
      />
    </AbsoluteFill>
  );
};