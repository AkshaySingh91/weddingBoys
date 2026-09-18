/**
 * BulletListBlock — unordered list with studio styling.
 */
export default function BulletListBlock({ children }) {
  return (
    <ul className="ml-5 list-disc space-y-2 text-base leading-[1.8] text-studio-ink/90 marker:text-studio-terracotta sm:text-[17px]">
      {children}
    </ul>
  );
}
