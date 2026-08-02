import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { fonts } from "../fonts";

export const OutroScene: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16, stiffness: 130 } });
  const line = spring({ frame: frame - 18, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          fontFamily: fonts.display,
          fontSize: 82,
          color: theme.text,
          opacity: s,
          transform: `scale(${interpolate(s, [0, 1], [0.9, 1])})`,
          textAlign: "center",
          maxWidth: 1200,
        }}
      >
        {title}
      </div>
      <div
        style={{
          height: 4,
          width: interpolate(line, [0, 1], [0, 520]),
          background: `linear-gradient(90deg, ${theme.accent}, ${theme.primary})`,
          margin: "36px 0 26px",
        }}
      />
      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: 22,
          letterSpacing: 8,
          textTransform: "uppercase",
          color: theme.muted,
          opacity: interpolate(frame, [26, 46], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        Generated with ConceptLens
      </div>
    </AbsoluteFill>
  );
};