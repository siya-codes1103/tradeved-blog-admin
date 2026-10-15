import type { Block } from "@/lib/blog/markdown";

type ChartBlock = Extract<Block, { t: "chart" }>;

const fmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

/** Bar or line chart drawn as inline SVG (no chart library, no client JavaScript). */
export default function Chart({ block }: { block: ChartBlock }) {
  const { kind, title, unit, points, source } = block;
  const W = 640;
  const H = 280;
  const L = 52;
  const R = 16;
  const T = 24;
  const B = 46;
  const iw = W - L - R;
  const ih = H - T - B;
  const values = points.map((p) => p.value);

  let hi = Math.max(...values);
  let lo = kind === "bar" ? Math.min(0, ...values) : Math.min(...values);
  if (kind === "line") {
    const pad = (hi - lo) * 0.12 || 1;
    hi += pad;
    lo -= pad;
  }
  if (hi === lo) hi = lo + 1;
  const y = (v: number) => T + ih - ((v - lo) / (hi - lo)) * ih;
  const n = points.length;
  const label = (s: string) => (s.length > 13 ? `${s.slice(0, 12)}…` : s);

  return (
    <figure className="tv-dark my-6 rounded-2xl border border-[var(--tv-line)] bg-[var(--tv-card)] p-4">
      {title && <figcaption className="mb-2 font-heading text-[14px] font-bold text-[var(--tv-ink)]">{title}</figcaption>}
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title || "Chart"} className="block h-auto w-full">
        {[0, 1, 2, 3, 4].map((i) => {
          const v = lo + ((hi - lo) * i) / 4;
          return (
            <g key={i}>
              <path d={`M${L} ${y(v)}H${W - R}`} stroke="#242620" />
              <text x={L - 6} y={y(v) + 3} textAnchor="end" fill="#A2AB9A" fontSize="10">
                {fmt.format(v)}
              </text>
            </g>
          );
        })}

        {kind === "bar" &&
          points.map((p, i) => {
            const slot = iw / n;
            const bw = Math.min(54, slot * 0.58);
            const cx = L + slot * i + slot / 2;
            const top = y(Math.max(p.value, 0));
            const base = y(0);
            return (
              <g key={i}>
                <rect x={cx - bw / 2} y={top} width={bw} height={Math.max(2, Math.abs(base - y(p.value)))} rx="3" fill={p.value < 0 ? "#CC0066" : "#9BEC00"} />
                <text x={cx} y={top - 6} textAnchor="middle" fill="#F7FAF5" fontSize="11" fontWeight="700">
                  {fmt.format(p.value)}
                  {unit}
                </text>
                <text x={cx} y={H - B + 16} textAnchor="middle" fill="#D3DEC8" fontSize="10">
                  {label(p.label)}
                </text>
              </g>
            );
          })}

        {kind === "line" && (
          <>
            <path
              d={points.map((p, i) => `${i ? "L" : "M"}${L + (iw * i) / (n - 1)} ${y(p.value)}`).join(" ")}
              fill="none"
              stroke="#9BEC00"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {points.map((p, i) => {
              const cx = L + (iw * i) / (n - 1);
              return (
                <g key={i}>
                  <circle cx={cx} cy={y(p.value)} r="4" fill="#9BEC00" />
                  <text x={cx} y={y(p.value) - 10} textAnchor="middle" fill="#F7FAF5" fontSize="11" fontWeight="700">
                    {fmt.format(p.value)}
                    {unit}
                  </text>
                  <text x={cx} y={H - B + 16} textAnchor="middle" fill="#D3DEC8" fontSize="10">
                    {label(p.label)}
                  </text>
                </g>
              );
            })}
          </>
        )}
      </svg>

      {/* The same numbers as a table, for screen readers and search engines. */}
      <table className="sr-only">
        <caption>{title || "Chart data"}</caption>
        <tbody>
          {points.map((p, i) => (
            <tr key={i}>
              <th scope="row">{p.label}</th>
              <td>
                {fmt.format(p.value)}
                {unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {source && <p className="mt-2 font-body text-[12px] text-[var(--tv-mut)]">Source: {source}</p>}
    </figure>
  );
}
