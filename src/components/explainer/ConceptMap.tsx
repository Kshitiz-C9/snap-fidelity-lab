import { useState } from "react";
import type { ExplainerConcept, ExplainerRelation } from "@/lib/explainer-schema";

export function ConceptMap({
  concepts,
  relations,
}: {
  concepts: ExplainerConcept[];
  relations: ExplainerRelation[];
}) {
  const [active, setActive] = useState<string | null>(null);
  if (!concepts.length) return null;

  const width = 720;
  const height = 420;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 70;

  const positions = new Map<string, { x: number; y: number }>();
  concepts.forEach((c, i) => {
    const angle = (i / concepts.length) * Math.PI * 2 - Math.PI / 2;
    positions.set(c.id, {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    });
  });

  const selected = concepts.find((c) => c.id === active);

  return (
    <div className="panel p-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label="Concept map of the explainer"
      >
        {relations.map((r, i) => {
          const a = positions.get(r.from);
          const b = positions.get(r.to);
          if (!a || !b) return null;
          const dim = active && active !== r.from && active !== r.to;
          return (
            <g key={i} opacity={dim ? 0.15 : 0.85}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="var(--color-border)"
                strokeWidth={1.5}
              />
              <text
                x={(a.x + b.x) / 2}
                y={(a.y + b.y) / 2 - 4}
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{ fontSize: 9 }}
              >
                {r.label}
              </text>
            </g>
          );
        })}
        {concepts.map((c) => {
          const p = positions.get(c.id)!;
          const isActive = active === c.id;
          return (
            <g
              key={c.id}
              transform={`translate(${p.x}, ${p.y})`}
              onMouseEnter={() => setActive(c.id)}
              onMouseLeave={() => setActive(null)}
              style={{ cursor: "pointer" }}
            >
              <circle
                r={isActive ? 11 : 8}
                className={isActive ? "fill-accent" : "fill-primary"}
              />
              <text
                y={-16}
                textAnchor="middle"
                className="fill-foreground"
                style={{ fontSize: 11 }}
              >
                {c.label}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="min-h-10 border-t border-border pt-3 text-sm text-muted-foreground">
        {selected
          ? `${selected.label} — ${selected.description}`
          : "Hover a node to inspect the concept."}
      </p>
    </div>
  );
}