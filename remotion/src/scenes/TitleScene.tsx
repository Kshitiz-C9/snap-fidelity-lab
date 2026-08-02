import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { fonts } from "../fonts";

export const TitleScene: React.FC<{ title: string; summary: string }> = ({
  title,
  summary,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = title.split(" ");

  const rule = spring({ frame: frame - 4, fps, config: { damping: 200 } });
  const sub = spring({ frame: frame - 34, fps, config: { damping: 200 } });
  const kicker = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 140px" }}>
      <div
        style={{
          opacity: kicker,
          transform: `translateX(${interpolate(kicker, [0, 1], [-30, 0])}px)`,
          color: theme.primary,
          fontFamily: fonts.mono,
          letterSpacing: 8,
          fontSize: 20,
          textTransform: "uppercase",
        }}
      >
        ConceptLens · Visual Explainer
      </div>

      <h1
        style={{
          fontFamily: fonts.display,
          fontSize: 104,
          lineHeight: 1.02,
          color: theme.text,
          margin: "26px 0 0",
          maxWidth: 1300,
        }}
      >
        {words.map((w, i) => {
          const s = spring({
            frame: frame - 8 - i * 4,
            fps,
            config: { damping: 16, stiffness: 140 },
          });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: 22,
                opacity: s,
                transform: `translateY(${interpolate(s, [0, 1], [70, 0])}px)`,
                filter: `blur(${interpolate(s, [0, 1], [10, 0])}px)`,
              }}
            >
              {w}
            </span>
          );
        })}
      </h1>

      <div
        style={{
          height: 4,
          width: interpolate(rule, [0, 1], [0, 420]),
          background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})`,
          margin: "40px 0 28px",
        }}
      />

      <p
        style={{
          fontFamily: fonts.body,
          fontSize: 32,
          color: theme.muted,
          maxWidth: 900,
          margin: 0,
          opacity: sub,
          transform: `translateY(${interpolate(sub, [0, 1], [24, 0])}px)`,
        }}
      >
        {summary}
      </p>
    </AbsoluteFill>
  );
};