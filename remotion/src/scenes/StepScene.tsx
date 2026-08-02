import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { fonts } from "../fonts";
import { GraphDiagram } from "../components/GraphDiagram";
import type { Step } from "../data";

export const StepScene: React.FC<{ step: Step; index: number; total: number }> = ({
  step,
  index,
  total,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const label = spring({ frame: frame - 6, fps, config: { damping: 18, stiffness: 150 } });
  const panel = spring({ frame: frame - 2, fps, config: { damping: 200 } });
  const float = Math.sin(frame / 42) * 8;
  const progress = interpolate(frame, [0, durationInFrames], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: "0 110px",
        gap: 70,
      }}
    >
      <div style={{ width: 620, flexShrink: 0 }}>
        <div
          style={{
            fontFamily: fonts.mono,
            color: theme.accent,
            letterSpacing: 6,
            fontSize: 18,
            opacity: interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </div>

        <h2
          style={{
            fontFamily: fonts.display,
            fontSize: 68,
            lineHeight: 1.05,
            color: theme.text,
            margin: "18px 0 0",
            opacity: label,
            transform: `translateY(${interpolate(label, [0, 1], [50, 0])}px)`,
          }}
        >
          {step.label}
        </h2>

        <p
          style={{
            fontFamily: fonts.body,
            fontSize: 28,
            lineHeight: 1.5,
            color: theme.muted,
            marginTop: 26,
            opacity: spring({ frame: frame - 20, fps, config: { damping: 200 } }),
          }}
        >
          {step.narration}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 34 }}>
          {step.entities.map((e, i) => {
            const s = spring({
              frame: frame - 34 - i * 7,
              fps,
              config: { damping: 14, stiffness: 170 },
            });
            return (
              <span
                key={e}
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 18,
                  color: theme.primary,
                  border: `1px solid rgba(34,211,238,0.4)`,
                  background: "rgba(34,211,238,0.07)",
                  borderRadius: 10,
                  padding: "8px 14px",
                  opacity: s,
                  transform: `translateY(${interpolate(s, [0, 1], [18, 0])}px)`,
                }}
              >
                {e}
              </span>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 46,
            height: 3,
            width: 420,
            background: theme.line,
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress * 100}%`,
              background: theme.primary,
            }}
          />
        </div>
      </div>

      <div
        style={{
          flex: 1,
          opacity: panel,
          transform: `translateY(${float + interpolate(panel, [0, 1], [40, 0])}px) scale(${interpolate(panel, [0, 1], [0.94, 1])})`,
        }}
      >
        <GraphDiagram chapter={index} />
        <p
          style={{
            fontFamily: fonts.body,
            fontSize: 20,
            color: theme.muted,
            textAlign: "center",
            marginTop: 26,
            opacity: 0.85,
          }}
        >
          {step.visual}
        </p>
      </div>
    </AbsoluteFill>
  );
};