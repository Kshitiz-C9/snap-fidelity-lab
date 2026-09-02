import type { ExplainerStep } from "@/lib/explainer-schema";

/**
 * The "show, don't tell" layer: renders the moving parts of the current step —
 * actor nodes for each entity, a flow arrow between them, and a slot strip
 * that fills as the sequence advances.
 */
export function StepStage({
  steps,
  index,
}: {
  steps: ExplainerStep[];
  index: number;
}) {
  const step = steps[index];
  if (!step) return null;

  const entities = step.entities.slice(0, 4);
  const W = 720;
  const H = entities.length ? 176 : 96;
  const laneY = 62;
  const cardW = entities.length ? Math.min(160, (W - 40) / entities.length - 18) : 0;
  const span = entities.length ? (W - 40 - cardW) / Math.max(entities.length - 1, 1) : 0;

  const slots = steps.length;
  const slotW = Math.min(46, (W - 40) / slots - 8);
  const slotGap = slots > 1 ? (W - 40 - slotW) / (slots - 1) : 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={step.visual}>
      {entities.map((entity, i) => {
        const x = 20 + span * i;
        const isLead = i === 0;
        return (
          <g key={`${index}-${entity}-${i}`}>
            {i < entities.length - 1 && (
              <g>
                <line
                  x1={x + cardW + 6}
                  y1={laneY + 22}
                  x2={x + span - 8}
                  y2={laneY + 22}
                  stroke="var(--color-primary)"
                  strokeWidth={1.5}
                  strokeDasharray="4 5"
                  opacity={0.7}
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="18"
                    to="0"
                    dur="1.4s"
                    repeatCount="indefinite"
                  />
                </line>
                <polygon
                  points={`${x + span - 8},${laneY + 22} ${x + span - 15},${laneY + 18} ${x + span - 15},${laneY + 26}`}
                  fill="var(--color-primary)"
                  opacity={0.8}
                />
              </g>
            )}

            <rect
              x={x}
              y={laneY}
              width={cardW}
              height={44}
              rx={6}
              fill={isLead ? "oklch(0.762 0.128 72 / 0.16)" : "oklch(0.539 0.069 152 / 0.12)"}
              stroke={isLead ? "var(--color-primary)" : "oklch(0.44 0.062 152)"}
              strokeWidth={1}
            />
            <text
              x={x + cardW / 2}
              y={laneY + 27}
              textAnchor="middle"
              className="fill-foreground"
              style={{ fontSize: 12, fontFamily: "var(--font-sans)" }}
            >
              {entity.length > 18 ? `${entity.slice(0, 17)}…` : entity}
            </text>
          </g>
        );
      })}

      {/* slot strip: how far the sequence has advanced */}
      <text
        x={20}
        y={H - 34}
        className="fill-muted-foreground"
        style={{ fontSize: 10, fontFamily: "var(--font-sans)" }}
      >
        Sequence
      </text>
      {steps.map((s, i) => {
        const x = 20 + slotGap * i;
        const filled = i <= index;
        return (
          <g key={`slot-${i}`}>
            <rect
              x={x}
              y={H - 26}
              width={slotW}
              height={12}
              rx={2}
              fill={filled ? "var(--color-primary)" : "transparent"}
              opacity={i === index ? 1 : filled ? 0.55 : 1}
              stroke={filled ? "none" : "var(--color-muted-foreground)"}
              strokeWidth={1}
            >
              <title>{s.label}</title>
            </rect>
          </g>
        );
      })}
    </svg>
  );
}
