/**
 * OrderedListBlock — numbered list with studio styling.
 */
export default function OrderedListBlock({ children }) {
  return (
    <ol className="ml-5 list-decimal space-y-2 text-base leading-[1.8] text-studio-ink/90 marker:text-studio-terracotta marker:font-semibold sm:text-[17px]">
      {children}
    </ol>
  );
}
