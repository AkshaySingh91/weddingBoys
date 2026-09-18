/**
 * CodeBlockBlock — syntax-highlighted code block.
 */
export default function CodeBlockBlock({ node, children }) {
  const language = node.attrs?.language || '';

  // Extract text content from children
  const codeText = node.content?.map(n => n.text || '').join('') || '';

  return (
    <div className="my-8 overflow-hidden rounded-xl border border-studio-border">
      {language && (
        <div className="border-b border-studio-border bg-studio-canvas/80 px-4 py-1.5">
          <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-studio-inkMuted">
            {language}
          </span>
        </div>
      )}
      <pre className="overflow-x-auto bg-studio-obsidian p-5 text-sm leading-relaxed">
        <code className="font-mono text-stone-200">
          {codeText || children}
        </code>
      </pre>
    </div>
  );
}
