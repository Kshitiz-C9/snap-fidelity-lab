import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

const NODES = [
  { id: "S", x: 90, y: 200 },
  { id: "A", x: 300, y: 90 },
  { id: "B", x: 300, y: 320 },
  { id: "C", x: 530, y: 170 },
  { id: "D", x: 560, y: 360 },
  { id: "E", x: 760, y: 240 },
];

const EDGES: { from: number; to: number; w: number; tree: boolean }[] = [
  { from: 0, to: 1, w: 4, tree: true },
  { from: 0, to: 2, w: 2, tree: true },
  { from: 1, to: 3, w: 5, tree: true },
  { from: 2, to: 1, w: 1, tree: false },
  { from: 2, to: 4, w: 8, tree: true },
  { from: 3, to: 5, w: 3, tree: true },
  { from: 4, to: 5, w: 6, tree: false },
];

// How many nodes are "settled" at each chapter of the story.
const SETTLED = [1, 2, 3, 4, 6];

export const GraphDiagram: React.FC<{ chapter: number }> = ({ chapter }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const settled = SETTLED[Math.min(chapter, SETTLED.length - 1)] ?? 1;

  return (
    <svg viewBox="0 0 860 440" style={{ width: "100%", overflow: "visible" }}>
      {EDGES.map((e, i) => {
        const a = NODES[e.from]!;
        const b = NODES[e.to]!;
        const on = e.from < settled && e.to < settled;
        const grow = spring({ frame: frame - 6 - i * 3, fps, config: { damping: 200 } });
        const highlight = on && (chapter >= 2 ? e.tree : false);
        return (
          <g key={i}>
            <line
              x1={a.x}
              y1={a.y}
              x2={interpolate(grow, [0, 1], [a.x, b.x])}
              y2={interpolate(grow, [0, 1], [a.y, b.y])}
              stroke={highlight ? theme.primary : theme.line}
              strokeWidth={highlight ? 4 : 2}
              opacity={highlight ? 0.95 : 0.6}
            />
            <text
              x={(a.x + b.x) / 2 + 8}
              y={(a.y + b.y) / 2 - 8}
              fill={highlight ? theme.primary : theme.muted}
              fontSize={20}
              fontFamily="monospace"
              opacity={grow}
            >
              {e.w}
            </text>
          </g>
        );
      })}

      {NODES.map((n, i) => {
        const pop = spring({
          frame: frame - 4 - i * 4,
          fps,
          config: { damping: 12, stiffness: 180 },
        });
        const isSettled = i < settled;
        const isFrontier = i === settled - 1;
        const ring = isFrontier ? 1 + 0.06 * Math.sin(frame / 6) : 1;
        const fill = isSettled ? (isFrontier ? theme.accent : theme.primary) : theme.bgSoft;
        return (
          <g key={n.id} transform={`translate(${n.x} ${n.y}) scale(${pop * ring})`}>
            <circle
              r={32}
              fill={fill}
              stroke={isSettled ? "transparent" : theme.line}
              strokeWidth={3}
              opacity={isSettled ? 1 : 0.85}
            />
            <text
              textAnchor="middle"
              dy={9}
              fontSize={26}
              fontWeight={700}
              fill={isSettled ? theme.bg : theme.muted}
            >
              {n.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
};