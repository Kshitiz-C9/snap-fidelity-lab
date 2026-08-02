import type { ExplainerStep } from "@/lib/explainer-schema";

type Props = {
  templateType: string;
  steps: ExplainerStep[];
  index: number;
};

const W = 720;
const H = 260;

export function TopicVisual({ templateType, steps, index }: Props) {
  if (!steps.length) return null;
  const type = (templateType || "process_flow").toLowerCase();

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label={`Diagram of step ${index + 1}: ${steps[index]?.label ?? ""}`}
    >
      {type === "grid" ? (
        <Grid steps={steps} index={index} />
      ) : type === "graph_tree" ? (
        <Tree steps={steps} index={index} />
      ) : type === "state_transition" ? (
        <States steps={steps} index={index} />
      ) : (
        <Flow steps={steps} index={index} />
      )}
    </svg>
  );
}

function clip(text: string, max = 16) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function nodeClasses(state: "done" | "active" | "todo") {
  if (state === "active") return { fill: "fill-accent", op: 1 };
  if (state === "done") return { fill: "fill-primary", op: 0.85 };
  return { fill: "fill-secondary", op: 0.6 };
}

function stateOf(i: number, index: number) {
  return i === index ? "active" : i < index ? "done" : "todo";
}

function Flow({ steps, index }: { steps: ExplainerStep[]; index: number }) {
  const gap = W / steps.length;
  const y = H / 2;
  return (
    <g>
      {steps.map((s, i) => {
        const x = gap * i + gap / 2;
        const st = stateOf(i, index) as "done" | "active" | "todo";
        const c = nodeClasses(st);
        return (
          <g key={i} opacity={c.op}>
            {i < steps.length - 1 && (
              <line
                x1={x + 26}
                y1={y}
                x2={x + gap - 26}
                y2={y}
                stroke="var(--color-border)"
                strokeWidth={2}
              />
            )}
            <rect
              x={x - 26}
              y={y - 20}
              width={52}
              height={40}
              rx={10}
              className={c.fill}
            />
            <text
              x={x}
              y={y + 4}
              textAnchor="middle"
              className="fill-background font-semibold"
              style={{ fontSize: 13 }}
            >
              {i + 1}
            </text>
            <text
              x={x}
              y={y + 44}
              textAnchor="middle"
              className="fill-muted-foreground"
              style={{ fontSize: 10 }}
            >
              {clip(s.label, 14)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function States({ steps, index }: { steps: ExplainerStep[]; index: number }) {
  const cx = W / 2;
  const cy = H / 2;
  const r = Math.min(W, H) / 2 - 40;
  const pts = steps.map((_, i) => {
    const a = (i / steps.length) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(a) * r * 1.4, y: cy + Math.sin(a) * r };
  });
  return (
    <g>
      {pts.map((p, i) => {
        const next = pts[(i + 1) % pts.length]!;
        return (
          <line
            key={`l${i}`}
            x1={p.x}
            y1={p.y}
            x2={next.x}
            y2={next.y}
            stroke="var(--color-border)"
            strokeWidth={1.5}
            opacity={0.6}
          />
        );
      })}
      {pts.map((p, i) => {
        const st = stateOf(i, index) as "done" | "active" | "todo";
        const c = nodeClasses(st);
        return (
          <g key={i} opacity={c.op}>
            <circle cx={p.x} cy={p.y} r={st === "active" ? 18 : 13} className={c.fill} />
            <text
              x={p.x}
              y={p.y - 24}
              textAnchor="middle"
              className="fill-foreground"
              style={{ fontSize: 10 }}
            >
              {clip(steps[i]!.label, 14)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Grid({ steps, index }: { steps: ExplainerStep[]; index: number }) {
  const cols = Math.ceil(Math.sqrt(steps.length));
  const rows = Math.ceil(steps.length / cols);
  const cw = W / cols;
  const ch = H / rows;
  return (
    <g>
      {steps.map((s, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const st = stateOf(i, index) as "done" | "active" | "todo";
        const c = nodeClasses(st);
        return (
          <g key={i} opacity={c.op}>
            <rect
              x={col * cw + 8}
              y={row * ch + 8}
              width={cw - 16}
              height={ch - 16}
              rx={12}
              className={c.fill}
            />
            <text
              x={col * cw + cw / 2}
              y={row * ch + ch / 2 + 4}
              textAnchor="middle"
              className="fill-background font-medium"
              style={{ fontSize: 11 }}
            >
              {clip(s.label, 18)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Tree({ steps, index }: { steps: ExplainerStep[]; index: number }) {
  const root = { x: W / 2, y: 40 };
  const children = steps.slice(1);
  const gap = W / Math.max(children.length, 1);
  const rootState = stateOf(0, index) as "done" | "active" | "todo";
  const rc = nodeClasses(rootState);
  return (
    <g>
      {children.map((s, i) => {
        const x = gap * i + gap / 2;
        const y = H - 70;
        const st = stateOf(i + 1, index) as "done" | "active" | "todo";
        const c = nodeClasses(st);
        return (
          <g key={i} opacity={c.op}>
            <path
              d={`M ${root.x} ${root.y + 16} C ${root.x} ${(root.y + y) / 2}, ${x} ${(root.y + y) / 2}, ${x} ${y - 14}`}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth={1.5}
            />
            <circle cx={x} cy={y} r={st === "active" ? 16 : 12} className={c.fill} />
            <text
              x={x}
              y={y + 30}
              textAnchor="middle"
              className="fill-muted-foreground"
              style={{ fontSize: 10 }}
            >
              {clip(s.label, 14)}
            </text>
          </g>
        );
      })}
      <g opacity={rc.op}>
        <circle cx={root.x} cy={root.y} r={rootState === "active" ? 18 : 14} className={rc.fill} />
        <text
          x={root.x}
          y={root.y - 22}
          textAnchor="middle"
          className="fill-foreground"
          style={{ fontSize: 11 }}
        >
          {clip(steps[0]!.label, 18)}
        </text>
      </g>
    </g>
  );
}