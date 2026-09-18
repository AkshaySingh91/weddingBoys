/**
 * LayoutGrid / LayoutRow / LayoutCell — the published side of the layout grid.
 *
 * The grid is ONE CSS grid: rows are `display: contents` and every cell is an
 * item of the grid itself, which is what lets a cell span rows as well as
 * columns. Rows used to be grids of their own — that gave the editor a row box
 * to hang controls on, but made a tall image beside two stacked ones impossible
 * to express.
 *
 * Column ratio, gutter and row heights travel as custom properties the
 * stylesheet turns into a template; each cell's position comes from
 * `placeCells` in gridOps, which the editor calls too, so the two views of where
 * a cell sits cannot drift apart.
 *
 * Nothing here reaches for a Tailwind arbitrary variant. An earlier version used
 * `md:[grid-template-columns:var(--cols)]`, which generated no CSS whatsoever
 * and silently rendered every grid as a single column.
 */
import {
    templateFromCols, gapLength, rowHeightLength,
} from '@/app/admin/(dashboard)/blogs/_components/layoutTokens.js';

/**
 * `grid-template-rows` from the rows' stored heights.
 *
 * `minmax(H, auto)`, never a bare `H`: a height is the floor an author wants
 * for a band of images, not permission to cut text off. As a fixed track a
 * 20px row clipped its content mid-sentence.
 */
function templateRows(node) {
    const rows = (node?.content || []).filter((n) => n.type === 'layoutRow');
    if (!rows.length) return 'auto';
    return rows
        .map((r) => {
            const len = rowHeightLength(r.attrs || {});
            return len ? `minmax(${len}, auto)` : 'auto';
        })
        .join(' ');
}

export function LayoutGridBlock({ node, children }) {
    const attrs = node?.attrs || {};
    return (
        <div
            className="layout-grid"
            data-borders={attrs.borders || 'none'}
            data-mobile={attrs.mobile || 'stack'}
            style={{
                '--wb-cols': templateFromCols(attrs.cols),
                '--wb-rows': templateRows(node),
                '--wb-gap': gapLength(attrs.gap),
                '--wb-align': attrs.align || 'stretch',
            }}
        >
            {children}
        </div>
    );
}

export function LayoutRowBlock({ node, children }) {
    // No box of its own — it exists so the document keeps a row structure that
    // "add row" and "delete row" can act on as one edit.
    const attrs = node?.attrs || {};
    return (
        <div className="layout-row" data-height={attrs.height || 'auto'}>
            {children}
        </div>
    );
}

export function LayoutCellBlock({ node, placement, children }) {
    const span = Math.max(1, Number(node?.attrs?.span) || 1);
    const rowSpan = Math.max(1, Number(node?.attrs?.rowSpan) || 1);

    // Placement is resolved for the whole document up front, because a cell
    // cannot know its own column: that depends on every cell before it, spans
    // from earlier rows included.
    const style = placement
        ? {
            '--wb-col': placement.col + 1,
            '--wb-colspan': placement.colSpan,
            '--wb-row': placement.row + 1,
            '--wb-rowspan': placement.rowSpan,
        }
        : { '--wb-colspan': span, '--wb-rowspan': rowSpan };

    return (
        <div className="layout-cell" data-span={span} data-row-span={rowSpan} style={style}>
            {children}
        </div>
    );
}

export default LayoutGridBlock;
