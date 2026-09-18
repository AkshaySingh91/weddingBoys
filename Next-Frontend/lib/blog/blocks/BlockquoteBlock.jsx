/**
 * BlockquoteBlock — styled blockquote with terracotta left border.
 */
export default function BlockquoteBlock({ children, template }) {
  return (
    <blockquote className="border-l-4 border-studio-terracotta/60 bg-studio-canvas/50 py-4 pl-6 pr-4 font-lora italic text-studio-inkSecondary">
      {children}
    </blockquote>
  );
}
