/**
 * DividerBlock — horizontal rule with studio styling.
 */
export default function DividerBlock() {
  return (
    <div className="my-10 flex items-center justify-center gap-3">
      <span className="h-px flex-1 bg-studio-border" />
      <span className="h-1.5 w-1.5 rounded-full bg-studio-terracotta/40" />
      <span className="h-px flex-1 bg-studio-border" />
    </div>
  );
}
