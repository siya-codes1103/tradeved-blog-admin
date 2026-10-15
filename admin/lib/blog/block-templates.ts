export const BLOCK_TEMPLATES = {
  table: ":::table\nColumn A | Column B | Column C\nRow 1 | value | value\nRow 2 | value | value\n:::",
  compare: ":::compare\nFeature | Option A | Option B\nCost | Low | High\nRisk | Medium | Low\n:::",
  facts: ":::facts\nLabel: Value\nLabel: Value\nLabel: Value\n:::",
  proscons: ":::proscons\n+ A pro point\n+ Another pro\n- A con point\n- Another con\n:::",
  bar: ":::chart bar | Chart title | %\nItem A: 40\nItem B: 25\nItem C: 35\nsource: where this data comes from\n:::",
  line: ":::chart line | Chart title\n2023: 100\n2024: 120\n2025: 150\nsource: where this data comes from\n:::",
  steps: ":::steps\nFirst step\nSecond step\nThird step\n:::",
  note: ":::note\nAn important point for the reader.\n:::",
} as const;

export type BlockKind = keyof typeof BLOCK_TEMPLATES;

export const BLOCK_BUTTONS: { kind: BlockKind; label: string }[] = [
  { kind: "table", label: "Table" },
  { kind: "compare", label: "Comparison" },
  { kind: "facts", label: "Key facts" },
  { kind: "bar", label: "Bar chart" },
  { kind: "line", label: "Line chart" },
  { kind: "proscons", label: "Pros & cons" },
  { kind: "steps", label: "Steps" },
  { kind: "note", label: "Callout" },
];
