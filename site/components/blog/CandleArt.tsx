import { hashString } from "@/lib/blog/utils";

/**
 * Brand cover used when a post has no uploaded image: a candlestick chart in TradeVed green and red.
 * The same slug always draws the same chart, so there is nothing to design or upload per post.
 */
export default function CandleArt({ seed, candles = 18, className = "" }: { seed: string; candles?: number; className?: string }) {
  const W = 400;
  const H = 200;
  let s = hashString(seed) || 1;
  const rnd = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };

  let v = 100;
  const data: { o: number; c: number; hi: number; lo: number }[] = [];
  for (let i = 0; i < candles; i++) {
    const o = v;
    const c = o + (rnd() - 0.44) * 18;
    data.push({ o, c, hi: Math.max(o, c) + rnd() * 8, lo: Math.min(o, c) - rnd() * 8 });
    v = c;
  }
  const min = Math.min(...data.map((d) => d.lo));
  const max = Math.max(...data.map((d) => d.hi));
  const y = (p: number) => H * 0.84 - ((p - min) / (max - min || 1)) * H * 0.66;
  const step = W / candles;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" className={`block h-full w-full ${className}`}>
      <rect width={W} height={H} fill="#181916" />
      {[0.25, 0.5, 0.75].map((f) => (
        <path key={f} d={`M0 ${H * f}H${W}`} stroke="#242620" />
      ))}
      {data.map((d, i) => {
        const up = d.c >= d.o;
        const color = up ? "#9BEC00" : "#CC0066";
        const cx = step * i + step / 2;
        const bw = step * 0.52;
        return (
          <g key={i}>
            <path d={`M${cx} ${y(d.hi)}V${y(d.lo)}`} stroke={color} strokeWidth="1.5" />
            <rect x={cx - bw / 2} y={Math.min(y(d.o), y(d.c))} width={bw} height={Math.max(3, Math.abs(y(d.o) - y(d.c)))} rx="1" fill={color} />
          </g>
        );
      })}
    </svg>
  );
}
