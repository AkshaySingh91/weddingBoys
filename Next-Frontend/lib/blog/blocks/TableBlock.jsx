/**
 * TableBlock — renders Tiptap table nodes with studio styling.
 */
import { renderContent } from '../renderAst';

export default function TableBlock({ node, template, post }) {
  if (!node.content) return null;

  return (
    <div className="my-8 overflow-x-auto rounded-xl border border-studio-border">
      <table className="w-full text-sm">
        <tbody>
          {node.content.map((row, rIdx) => {
            if (row.type !== 'tableRow') return null;
            return (
              <tr key={rIdx} className="border-b border-studio-border/50 last:border-0">
                {row.content?.map((cell, cIdx) => {
                  const isHeader = cell.type === 'tableHeader';
                  const Tag = isHeader ? 'th' : 'td';
                  return (
                    <Tag
                      key={cIdx}
                      className={`px-4 py-3 text-left ${
                        isHeader
                          ? 'bg-studio-canvas/80 font-semibold text-studio-ink'
                          : 'text-studio-inkSecondary'
                      }`}
                      colSpan={cell.attrs?.colspan || 1}
                      rowSpan={cell.attrs?.rowspan || 1}
                    >
                      {renderContent(cell.content, template, post)}
                    </Tag>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
