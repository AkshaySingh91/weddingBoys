'use client';

import { useEffect, useRef, useState } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import {
    Plus, Minus, Trash, DotsSixVertical, GridFour,
    ArrowLeft, ArrowRight, ArrowUp, ArrowDown,
    ArrowsOutLineHorizontal, ArrowsInLineHorizontal,
} from '@phosphor-icons/react';
import {
    DEFAULT_COLS, MAX_COLUMNS, MAX_ROWS, GAPS, ALIGNS, BORDERS, MOBILE, ROW_HEIGHTS,
    normaliseCols, templateFromCols, ratioLabel, gapLength, rowHeightLength,
} from '../layoutTokens.js';
import {
    addColumn, deleteColumn, setColumnUnits, addRow, deleteRow,
    expandCell, contractCell, resizePair, buildGrid, rowsOf, cellsOf,
    computePlacement, templateFromRows,
} from './layout/gridOps.js';

/**
 * The layout grid: rows of cells holding any blocks, sized by ratio.
 *
 * Three nodes rather than one. The previous version was `layoutCell{1,4}` — a
 * single row with no rows dimension, so "add a row" could not exist — and its
 * cells had no border, no padding and no minimum height, which is why an empty
 * grid looked like nothing at all and could barely be clicked into.
 *
 *   layoutGrid ▸ layoutRow ▸ layoutCell ▸ any blocks
 *
 * **The grid is ONE CSS grid**; rows are `display: contents` and every cell is an
 * item of the grid itself, which is what lets a cell span rows as well as
 * columns. Rows were once grids of their own — that gave the row a real box for
 * its controls, but made a tall image beside two stacked ones impossible to
 * express. The row handle is now a grid item in a leading gutter column instead.
 *
 * Placement is explicit, from `computePlacement` in gridOps, which the public
 * renderer calls too — one function, so the two views of where a cell sits
 * cannot drift apart.
 *
 * Widths are integer ratio units — `[1, 2]`, not `"66.43fr 33.57fr"`. See
 * layoutTokens.js. All structural edits go through gridOps.js, one transaction
 * each, so undo unwinds a column add as a single step.
 */

const cx = (...parts) => parts.filter(Boolean).join(' ');

/** How many grids may sit inside one another. See insertLayoutGrid. */
const MAX_GRID_DEPTH = 2;

/* ------------------------------------------------------------------ helpers */

/** Apply a gridOps mutation as exactly one undoable transaction. */
function runOp(editor, gridPos, op) {
    if (typeof gridPos !== 'number' || !editor) return;
    const { tr } = editor.state;
    op(tr, gridPos);
    if (tr.docChanged) editor.view.dispatch(tr);
    editor.view.focus();
}

/**
 * The grid a cell or row belongs to, with everything already placed.
 *
 * A node view knows its own position and nothing else, but a cell's column
 * depends on every cell before it — spans reaching down from earlier rows
 * included — so the answer has to come from the grid.
 */
function gridContextAt(editor, pos, levelsUp) {
    if (typeof pos !== 'number' || !editor) return null;
    const $pos = editor.state.doc.resolve(pos);
    // `pos` sits BEFORE the node, so $pos.depth is already its parent's depth:
    // for a cell that is the row, and the grid is one level above that.
    const depth = $pos.depth - levelsUp;
    if (depth < 1) return null;
    const gridPos = $pos.before(depth);
    const grid = editor.state.doc.nodeAt(gridPos);
    if (!grid || grid.type.name !== 'layoutGrid') return null;
    return { gridPos, grid, placement: computePlacement(grid, gridPos) };
}

/** The position of a node's parent, for a NodeView that only knows its own. */
function parentPosOf(editor, pos) {
    if (typeof pos !== 'number') return null;
    const $pos = editor.state.doc.resolve(pos);
    return $pos.depth > 0 ? $pos.before($pos.depth) : null;
}

/* -------------------------------------------------------------- menu shell */

function RailMenu({ open, onClose, align = 'left', children }) {
    const ref = useRef(null);
    const closeRef = useRef(onClose);

    // Callers pass an inline arrow, so depending on the handler's identity would
    // tear down and re-attach the document listeners on every render. Holding it
    // in a ref keeps the subscription tied to `open` alone.
    useEffect(() => { closeRef.current = onClose; }, [onClose]);

    useEffect(() => {
        if (!open) return undefined;
        const close = () => closeRef.current?.();
        const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) close(); };
        const onKey = (e) => { if (e.key === 'Escape') close(); };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    if (!open) return null;
    return (
        <div
            ref={ref}
            className={cx(
                'absolute top-full z-[60] mt-1 w-44 overflow-hidden rounded-xl border border-[#E5DCD3] bg-white py-1 shadow-xl',
                align === 'right' ? 'right-0' : 'left-0',
            )}
        >
            {children}
        </div>
    );
}

function MenuItem({ icon: Icon, label, onClick, disabled, danger, title }) {
    return (
        <button
            type="button"
            disabled={disabled}
            title={title}
            onClick={onClick}
            className={cx(
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors',
                'disabled:cursor-not-allowed disabled:opacity-40',
                danger ? 'text-rose-600 hover:bg-rose-50' : 'text-stone-700 hover:bg-stone-100',
            )}
        >
            <Icon size={13} weight="bold" />
            {label}
        </button>
    );
}

/* -------------------------------------------------------------------- cell */

function CellView({ node, editor, getPos }) {
    const span = Math.max(1, Number(node.attrs.span) || 1);
    const rowSpan = Math.max(1, Number(node.attrs.rowSpan) || 1);

    const pos = typeof getPos === 'function' ? getPos() : null;
    const ctx = gridContextAt(editor, pos, 1);
    const me = ctx ? ctx.placement.cells.find((c) => c.pos === pos) : null;

    /**
     * Grow or shrink this cell in one direction.
     *
     * Four directions, not one. The old merge only ever went right, so a layout
     * needing a cell to reach upward or downward — a tall image beside two
     * stacked ones — could not be built at all.
     */
    const resize = (direction, grow) => (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!ctx || !me) return;
        runOp(editor, ctx.gridPos, (tr, gridPos) =>
            (grow ? expandCell : contractCell)(tr, gridPos, { row: me.row, col: me.col, direction }));
    };

    // An empty cell is one empty paragraph. Showing a hint inside it is what
    // makes a fresh grid legible as "areas waiting for content".
    const blank = node.childCount === 1
        && node.firstChild.type.name === 'paragraph'
        && node.firstChild.content.size === 0;

    /**
     * Clicking a cell's padding — the dead space under its last paragraph —
     * should put the caret in that cell. ProseMirror maps a click to the nearest
     * position, but a tall empty cell has none nearby, so the click did nothing
     * and the cell felt inert.
     */
    const focusCell = (event) => {
        if (event.target !== event.currentTarget) return;
        if (typeof pos !== 'number') return;
        event.preventDefault();
        const { state, view } = editor;
        const end = pos + node.nodeSize - 1;
        view.dispatch(state.tr.setSelection(TextSelection.near(state.doc.resolve(end), -1)));
        view.focus();
    };

    // +2 on the column: one for CSS's 1-based lines, one for the handle gutter
    // that only the editor's grid has.
    const style = me
        ? {
            '--wb-col': me.col + 2,
            '--wb-colspan': me.colSpan,
            '--wb-row': me.row + 1,
            '--wb-rowspan': me.rowSpan,
        }
        : { '--wb-colspan': span, '--wb-rowspan': rowSpan };

    const atRightEdge = me && ctx ? me.col + me.colSpan >= ctx.placement.colCount : false;
    const atBottomEdge = me && ctx ? me.row + me.rowSpan >= ctx.placement.rowCount : false;

    return (
        <NodeViewWrapper
            className="layout-cell"
            data-span={span}
            data-row-span={rowSpan}
            style={style}
            onMouseDown={focusCell}
        >
            {blank && (
                <span className="layout-cell-hint" contentEditable={false}>
                    Type / to add
                </span>
            )}

            {/* One handle per edge: push it out to take a neighbour, pull it
                back to give the space up again. */}
            <span className="layout-cell-grips" contentEditable={false}>
                <button type="button" className="cell-grip cell-grip--up"
                    title={me && me.row > 0 ? 'Expand upward' : 'Already at the top'}
                    disabled={!me || me.row === 0}
                    onMouseDown={resize('up', true)}>▲</button>
                <button type="button" className="cell-grip cell-grip--down"
                    title={atBottomEdge ? 'Already at the bottom' : 'Expand downward'}
                    disabled={atBottomEdge}
                    onMouseDown={resize('down', true)}>▼</button>
                <button type="button" className="cell-grip cell-grip--left"
                    title={me && me.col > 0 ? 'Expand left' : 'Already at the left edge'}
                    disabled={!me || me.col === 0}
                    onMouseDown={resize('left', true)}>◀</button>
                <button type="button" className="cell-grip cell-grip--right"
                    title={atRightEdge ? 'Already at the right edge' : 'Expand right'}
                    disabled={atRightEdge}
                    onMouseDown={resize('right', true)}>▶</button>
                {(span > 1 || rowSpan > 1) && (
                    <button type="button" className="cell-grip cell-grip--shrink"
                        title="Give a column or row back"
                        onMouseDown={resize(span > 1 ? 'right' : 'down', false)}>↙</button>
                )}
            </span>

            <NodeViewContent />
        </NodeViewWrapper>
    );
}

export const LayoutCell = Node.create({
    name: 'layoutCell',
    content: 'block+',
    // Without this, Backspace at the start of a cell lifts its content out and
    // quietly destroys the layout — the most common way nested editors die.
    isolating: true,
    selectable: false,

    addAttributes() {
        return {
            span: {
                default: 1,
                parseHTML: (el) => Number(el.getAttribute('data-span')) || 1,
                renderHTML: (a) => ({ 'data-span': a.span }),
            },
            // How many rows the cell reaches down. The layout used to be built
            // as separate rows, which made this impossible to express — and a
            // tall image beside two stacked ones is exactly that shape.
            rowSpan: {
                default: 1,
                parseHTML: (el) => Number(el.getAttribute('data-row-span')) || 1,
                renderHTML: (a) => ({ 'data-row-span': a.rowSpan }),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-layout-cell]' }];
    },

    renderHTML({ HTMLAttributes, node }) {
        const span = Math.max(1, Number(node.attrs.span) || 1);
        const attrs = { 'data-layout-cell': '', class: 'layout-cell' };
        // Spans travel as a custom property for the same reason columns do: the
        // sanitiser keeps `--span` but would strip a raw `grid-column`.
        if (span > 1) attrs.style = `--span:${span}`;
        return ['div', mergeAttributes(HTMLAttributes, attrs), 0];
    },

    addNodeView() {
        return ReactNodeViewRenderer(CellView);
    },
});

/* --------------------------------------------------------------------- row */

function RowView({ node, editor, getPos, updateAttributes }) {
    const [menu, setMenu] = useState(false);
    const rowHeight = rowHeightLength(node.attrs);

    const gridPos = () => parentPosOf(editor, typeof getPos === 'function' ? getPos() : null);
    const rowIndex = () => {
        const pos = typeof getPos === 'function' ? getPos() : null;
        if (typeof pos !== 'number') return 0;
        return editor.state.doc.resolve(pos).index();
    };
    const rowCount = () => {
        const g = gridPos();
        return typeof g === 'number' ? (editor.state.doc.nodeAt(g)?.childCount ?? 1) : 1;
    };

    const act = (op) => () => {
        const g = gridPos();
        const index = rowIndex();
        setMenu(false);
        runOp(editor, g, (tr, pos) => op(tr, pos, index));
    };

    const setHeight = (id) => () => {
        setMenu(false);
        updateAttributes(id === 'custom'
            ? { height: 'custom', customHeight: node.attrs.customHeight || 320 }
            : { height: id, customHeight: null });
    };

    // The row has no box any more (`display: contents`), so its handle is placed
    // as a grid item in the gutter column, on this row's line.
    const myIndex = rowIndex();

    return (
        <NodeViewWrapper
            className="layout-row"
            data-height={node.attrs.height}
        >
            {/*
              Absolutely positioned, so it is out of flow and never becomes a
              grid item of the row it decorates — and it tracks the row's height
              for free, which a separate rail beside the grid could not do.
            */}
            <span
                className="layout-row-rail"
                contentEditable={false}
                style={{ '--wb-row': myIndex + 1 }}
            >
                <button
                    type="button"
                    title="Row actions"
                    onClick={() => setMenu((v) => !v)}
                    className="flex h-6 w-5 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-stone-200/80 hover:text-stone-700"
                >
                    <DotsSixVertical size={13} weight="bold" />
                </button>
                <RailMenu open={menu} onClose={() => setMenu(false)}>
                    <MenuItem icon={ArrowUp} label="Insert row above"
                        onClick={act((tr, pos, i) => addRow(tr, pos, { index: i, side: 'above' }))} />
                    <MenuItem icon={ArrowDown} label="Insert row below"
                        onClick={act((tr, pos, i) => addRow(tr, pos, { index: i, side: 'below' }))} />

                    <div className="my-1 h-px bg-[#EFE7DE]" />
                    {/*
                      Height lives on the row, not the grid: a hero row and the
                      caption row beneath it want different heights, and this is
                      the lever that keeps what follows a tall image on screen.
                    */}
                    <div className="px-3 pb-1 pt-1.5 text-[10px] uppercase tracking-wide text-stone-400">
                        Row height
                    </div>
                    {ROW_HEIGHTS.map((h) => (
                        <button
                            key={h.id}
                            type="button"
                            onClick={setHeight(h.id)}
                            className={cx(
                                'flex w-full items-center justify-between px-3 py-1 text-left text-xs transition-colors hover:bg-stone-100',
                                node.attrs.height === h.id ? 'text-studio-terracotta' : 'text-stone-700',
                            )}
                        >
                            {h.label}
                            {h.len && <span className="text-[10px] tabular-nums text-stone-400">{h.len}</span>}
                            {node.attrs.height === h.id && !h.len && <span className="text-[10px]">✓</span>}
                        </button>
                    ))}
                    {node.attrs.height === 'custom' && (
                        <label className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs text-stone-700">
                            Height
                            <span className="flex items-center gap-1">
                                <input
                                    type="number"
                                    min="80"
                                    max="1200"
                                    value={node.attrs.customHeight || 320}
                                    onChange={(e) => updateAttributes({ customHeight: Number(e.target.value) || 320 })}
                                    className="w-16 rounded-md border border-[#E5DCD3] px-1 py-0.5 text-[11px] tabular-nums outline-none"
                                />
                                <span className="text-[10px] text-stone-400">px</span>
                            </span>
                        </label>
                    )}

                    <div className="my-1 h-px bg-[#EFE7DE]" />
                    <MenuItem
                        icon={Trash} label="Delete row" danger
                        disabled={rowCount() <= 1}
                        title={rowCount() <= 1 ? 'A grid needs at least one row' : undefined}
                        onClick={act((tr, pos, i) => deleteRow(tr, pos, { index: i }))}
                    />
                </RailMenu>
            </span>
            <NodeViewContent className="layout-row-cells" />
        </NodeViewWrapper>
    );
}

export const LayoutRow = Node.create({
    name: 'layoutRow',
    // `*`, not `+`: a row every one of whose columns is covered by a cell
    // spanning down from above genuinely has no cells of its own. Requiring one
    // forced a cell into a row with nowhere to put it, and it landed outside the
    // grid. This is the same rule a table follows for rowspan.
    content: 'layoutCell*',
    isolating: true,
    selectable: false,

    addAttributes() {
        return {
            height: {
                default: 'auto',
                parseHTML: (el) => el.getAttribute('data-height') || 'auto',
                renderHTML: (a) => ({ 'data-height': a.height }),
            },
            customHeight: {
                default: null,
                parseHTML: (el) => Number(el.getAttribute('data-custom-height')) || null,
                renderHTML: (a) => (a.customHeight ? { 'data-custom-height': a.customHeight } : {}),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-layout-row]' }];
    },

    renderHTML({ HTMLAttributes }) {
        // No height here: the grid publishes every row's height at once as
        // `grid-template-rows`, because a `display: contents` row has no box.
        return ['div', mergeAttributes(HTMLAttributes, { 'data-layout-row': '', class: 'layout-row' }), 0];
    },

    addNodeView() {
        return ReactNodeViewRenderer(RowView);
    },
});

/* -------------------------------------------------------------- column rail */

function ColumnChip({ index, units, count, editor, gridPos }) {
    const [menu, setMenu] = useState(false);

    const act = (op) => () => { setMenu(false); runOp(editor, gridPos(), op); };
    const step = (delta) => () =>
        runOp(editor, gridPos(), (tr, pos) =>
            setColumnUnits(tr, pos, { index, units: Math.max(1, units + delta) }));

    return (
        <div className="layout-col-chip">
            <button
                type="button"
                title={`Column ${index + 1} — ${units} of ${count} parts`}
                onClick={() => setMenu((v) => !v)}
                className="flex h-full w-full items-center justify-center gap-1 rounded-md text-[10px] font-medium tabular-nums text-stone-500 transition-colors hover:bg-stone-200/70 hover:text-stone-800"
            >
                <span className="h-1 w-1 rounded-full bg-current opacity-50" />
                {units}
            </button>
            <RailMenu open={menu} onClose={() => setMenu(false)} align={index === count - 1 ? 'right' : 'left'}>
                <div className="flex items-center justify-between px-3 py-1.5">
                    <span className="text-[10px] uppercase tracking-wide text-stone-400">Width</span>
                    <span className="flex items-center gap-1">
                        <button type="button" onClick={step(-1)} disabled={units <= 1}
                            className="rounded p-0.5 text-stone-600 hover:bg-stone-100 disabled:opacity-30">
                            <Minus size={11} weight="bold" />
                        </button>
                        <span className="w-5 text-center text-xs tabular-nums">{units}</span>
                        <button type="button" onClick={step(1)}
                            className="rounded p-0.5 text-stone-600 hover:bg-stone-100">
                            <Plus size={11} weight="bold" />
                        </button>
                    </span>
                </div>
                <div className="my-1 h-px bg-[#EFE7DE]" />
                <MenuItem icon={ArrowLeft} label="Insert column left"
                    disabled={count >= MAX_COLUMNS}
                    onClick={act((tr, pos) => addColumn(tr, pos, { index, side: 'left' }))} />
                <MenuItem icon={ArrowRight} label="Insert column right"
                    disabled={count >= MAX_COLUMNS}
                    onClick={act((tr, pos) => addColumn(tr, pos, { index, side: 'right' }))} />
                <div className="my-1 h-px bg-[#EFE7DE]" />
                <MenuItem
                    icon={Trash} label="Delete column" danger
                    disabled={count <= 1}
                    title={count <= 1 ? 'A grid needs at least one column' : undefined}
                    onClick={act((tr, pos) => deleteColumn(tr, pos, { index }))}
                />
            </RailMenu>
        </div>
    );
}

/* -------------------------------------------------------------------- grid */

function GridView({ node, editor, getPos, updateAttributes, deleteNode }) {
    const frameRef = useRef(null);
    const tracksRef = useRef(null);
    const [dragging, setDragging] = useState(null);   // { index, label }
    const [settings, setSettings] = useState(false);

    const cols = normaliseCols(node.attrs.cols);
    const template = templateFromCols(cols);
    const gridPos = () => (typeof getPos === 'function' ? getPos() : null);

    const rowCount = node.childCount;
    const lastRow = Math.max(0, rowCount - 1);

    /**
     * Drag a divider to re-cut the ratio.
     *
     * The pointer is measured against the two **track probes** either side of
     * the divider rather than against the grid's own box. The probes are laid
     * out by the same template and gap as the rows, so the reading is exact
     * whatever the gap and whatever the spans — and, unlike measuring cells, it
     * does not care that a spanning cell makes DOM order diverge from column
     * order.
     *
     * The result is quantised to whole ratio units, which is the point: the
     * author gets `1 : 2`, a number they can read and reason about, instead of
     * a pixel measurement of this particular editor window.
     */
    const startResize = (index) => (event) => {
        event.preventDefault();
        event.stopPropagation();

        const probes = tracksRef.current?.children;
        const frame = frameRef.current;
        if (!probes || !frame) return;

        const left = probes[index].getBoundingClientRect().left;
        const right = probes[index + 1].getBoundingClientRect().right;
        const width = right - left;
        if (width <= 0) return;

        let latest = cols;
        setDragging({ index, label: ratioLabel(cols) });

        const onMove = (e) => {
            latest = resizePair(cols, index, (e.clientX - left) / width);
            // Preview by writing the custom property straight to the DOM; React
            // re-applies it from attrs when the drag commits.
            frame.style.setProperty('--wb-cols', templateFromCols(latest));
            setDragging({ index, label: ratioLabel(latest) });
        };
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            setDragging(null);
            updateAttributes({ cols: latest });
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };

    const op = (fn) => () => runOp(editor, gridPos(), fn);

    return (
        <NodeViewWrapper className="blog-layout-grid" data-testid="layout-grid">
            <div
                ref={frameRef}
                className="layout-grid-frame"
                data-borders={node.attrs.borders}
                data-mobile={node.attrs.mobile}
                style={{
                    '--wb-cols': template,
                    // Heights live on the grid now: a `display: contents` row
                    // has no box of its own to be tall.
                    '--wb-rows': templateFromRows(node),
                    '--wb-gap': gapLength(node.attrs.gap),
                    '--wb-align': node.attrs.align || 'stretch',
                    '--wb-gutter': '1.25rem',
                }}
            >
                {/* Column rail — laid out by the same template, so each chip sits
                    exactly over its track without anything measuring pixels. */}
                <div className="layout-grid-rail" contentEditable={false}>
                    {cols.map((units, i) => (
                        <ColumnChip
                            key={i}
                            index={i}
                            units={units}
                            count={cols.length}
                            editor={editor}
                            gridPos={gridPos}
                        />
                    ))}
                </div>

                <div className="layout-grid-stage">
                    <NodeViewContent className="layout-grid-body" />

                    {/* Track probes: invisible, but they are what the divider
                        drag measures against, and what positions each handle. */}
                    <div className="layout-grid-tracks" ref={tracksRef} contentEditable={false} aria-hidden="true">
                        {cols.map((_, i) => (
                            <div className="layout-grid-track" key={i}>
                                {i < cols.length - 1 && (
                                    <button
                                        type="button"
                                        aria-label={`Resize columns ${i + 1} and ${i + 2}`}
                                        onMouseDown={startResize(i)}
                                        className={cx('layout-grid-divider', dragging?.index === i && 'is-dragging')}
                                    >
                                        <span className="layout-grid-divider-line" />
                                        {dragging?.index === i && (
                                            <span className="layout-grid-ratio">{dragging.label}</span>
                                        )}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        title="Add a column"
                        disabled={cols.length >= MAX_COLUMNS}
                        onClick={op((tr, pos) => addColumn(tr, pos, { index: cols.length - 1, side: 'right' }))}
                        className="layout-grid-add layout-grid-add--col"
                        contentEditable={false}
                    >
                        <Plus size={12} weight="bold" />
                    </button>
                </div>

                <button
                    type="button"
                    title="Add a row"
                    disabled={rowCount >= MAX_ROWS}
                    onClick={op((tr, pos) => addRow(tr, pos, { index: lastRow, side: 'below' }))}
                    className="layout-grid-add layout-grid-add--row"
                    contentEditable={false}
                >
                    <Plus size={12} weight="bold" />
                </button>

                {/* Grid-level settings: the things that apply to the whole block
                    rather than to one row or column. */}
                <div className="layout-grid-toolbar" contentEditable={false}>
                    <GridFour size={12} weight="bold" className="text-studio-terracotta" />
                    <span className="text-[10px] tabular-nums text-stone-500">
                        {cols.length} × {rowCount} · {ratioLabel(cols)}
                    </span>
                    <span className="h-3 w-px bg-[#E5DCD3]" />
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setSettings((v) => !v)}
                            className="rounded px-1.5 py-0.5 text-[10px] text-stone-600 transition-colors hover:bg-stone-100"
                        >
                            Options
                        </button>
                        <RailMenu open={settings} onClose={() => setSettings(false)}>
                            {[
                                { label: 'Gap', key: 'gap', options: GAPS },
                                { label: 'Align', key: 'align', options: ALIGNS },
                                { label: 'Borders', key: 'borders', options: BORDERS },
                                { label: 'On mobile', key: 'mobile', options: MOBILE },
                            ].map(({ label, key, options }) => (
                                <label key={key} className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs text-stone-700">
                                    {label}
                                    <select
                                        value={node.attrs[key]}
                                        onChange={(e) => updateAttributes({ [key]: e.target.value })}
                                        className="rounded-md border border-[#E5DCD3] bg-white px-1 py-0.5 text-[10px] outline-none"
                                    >
                                        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                                    </select>
                                </label>
                            ))}
                        </RailMenu>
                    </div>
                    <button
                        type="button"
                        onClick={() => deleteNode()}
                        title="Remove this grid"
                        className="rounded p-0.5 text-rose-600 transition-colors hover:bg-rose-50"
                    >
                        <Trash size={12} />
                    </button>
                </div>
            </div>
        </NodeViewWrapper>
    );
}

/* ------------------------------------------------------------ cell traversal */

/** Every cell position in the grid, in reading order. */
function flatCells(grid, gridPos) {
    const out = [];
    rowsOf(grid, gridPos).forEach(({ node: row, pos: rowPos }, rowIndex) => {
        cellsOf(row, rowPos).forEach((c) => out.push({ ...c, rowIndex }));
    });
    return out;
}

/** Resolve the grid, row and cell surrounding the caret, if any. */
function locate(state) {
    const { $from } = state.selection;
    for (let d = $from.depth; d > 0; d -= 1) {
        if ($from.node(d).type.name !== 'layoutCell') continue;
        return {
            cellPos: $from.before(d),
            rowIndex: $from.index(d - 2),
            cellIndex: $from.index(d - 1),
            gridPos: $from.before(d - 2),
            grid: $from.node(d - 2),
        };
    }
    return null;
}

const caretInto = (tr, cellPos) =>
    tr.setSelection(TextSelection.near(tr.doc.resolve(cellPos + 1), 1));

/**
 * Tab between cells; Tab in the last cell appends a row.
 *
 * Returns false outside a grid so the list keymap and the editor's other Tab
 * handlers still get their turn.
 */
function stepCell(editor, dir) {
    const { state } = editor;
    const here = locate(state);
    if (!here) return false;

    const cells = flatCells(here.grid, here.gridPos);
    const at = cells.findIndex((c) => c.pos === here.cellPos);
    if (at < 0) return false;

    const next = cells[at + dir];
    if (next) {
        editor.view.dispatch(caretInto(state.tr, next.pos));
        return true;
    }
    if (dir < 0) return false;

    // Past the last cell: grow the table, the way every table editor does.
    const tr = state.tr;
    addRow(tr, here.gridPos, { index: here.grid.childCount - 1, side: 'below' });
    const grown = tr.doc.nodeAt(here.gridPos);
    const added = flatCells(grown, here.gridPos)[cells.length];
    if (added) caretInto(tr, added.pos);
    editor.view.dispatch(tr);
    return true;
}

/** An always-available way out; getting stuck inside a cell is the classic trap. */
function escapeGrid(editor) {
    const { state } = editor;
    const here = locate(state);
    if (!here) return false;

    const after = here.gridPos + here.grid.nodeSize;
    const tr = state.tr.insert(after, state.schema.nodes.paragraph.create());
    tr.setSelection(TextSelection.near(tr.doc.resolve(after), 1));
    editor.view.dispatch(tr);
    editor.view.focus();
    return true;
}

/* -------------------------------------------------------------- the extension */

export const LayoutGrid = Node.create({
    name: 'layoutGrid',
    group: 'block',
    content: 'layoutRow+',
    isolating: true,
    draggable: true,

    addAttributes() {
        return {
            cols: {
                default: [...DEFAULT_COLS],
                parseHTML: (el) => {
                    const parsed = (el.getAttribute('data-cols') || '')
                        .split(/[\s,]+/)
                        .map(Number)
                        .filter((n) => Number.isFinite(n) && n > 0);
                    return parsed.length ? normaliseCols(parsed) : [...DEFAULT_COLS];
                },
                renderHTML: (a) => ({ 'data-cols': normaliseCols(a.cols).join(' ') }),
            },
            gap: {
                default: 'md',
                parseHTML: (el) => el.getAttribute('data-gap') || 'md',
                renderHTML: (a) => ({ 'data-gap': a.gap }),
            },
            align: {
                // `stretch`, not `start`.
                //
                // Measured: three step cards in a row came out 214/238/238 tall
                // because each cell was only as tall as its own text. Stretch
                // makes them equal. It is invisible for a plain text or image
                // cell — content still sits at the top, only the cell box grows
                // — and only becomes visible where a cell has a border or a
                // background, which is exactly where ragged bottoms look broken.
                default: 'stretch',
                parseHTML: (el) => el.getAttribute('data-align') || 'stretch',
                renderHTML: (a) => ({ 'data-align': a.align }),
            },
            borders: {
                default: 'none',
                parseHTML: (el) => el.getAttribute('data-borders') || 'none',
                renderHTML: (a) => ({ 'data-borders': a.borders }),
            },
            mobile: {
                default: 'stack',
                parseHTML: (el) => el.getAttribute('data-mobile') || 'stack',
                renderHTML: (a) => ({ 'data-mobile': a.mobile }),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-layout-grid]' }];
    },

    renderHTML({ HTMLAttributes, node }) {
        // The ratio and the gap travel as custom properties, which the stylesheet
        // turns into a template on every row. Verified to survive the sanitiser,
        // where a raw `grid-template-columns` on each row could not be set at all
        // — a row cannot see its parent's attrs from renderHTML.
        const style = [
            `--wb-cols:${templateFromCols(node.attrs.cols)}`,
            `--wb-rows:${templateFromRows(node)}`,
            `--wb-gap:${gapLength(node.attrs.gap)}`,
            `--wb-align:${node.attrs.align || 'stretch'}`,
        ].join(';');
        return [
            'div',
            mergeAttributes(HTMLAttributes, { 'data-layout-grid': '', class: 'layout-grid', style }),
            0,
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(GridView);
    },

    addKeyboardShortcuts() {
        return {
            Tab: () => stepCell(this.editor, 1),
            'Shift-Tab': () => stepCell(this.editor, -1),
            'Mod-Enter': () => escapeGrid(this.editor),
        };
    },

    /**
     * Mark the grid and cell holding the caret, so the rails can appear without
     * React having to subscribe to every selection change. CSS does the rest.
     */
    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('layoutGridActive'),
                props: {
                    decorations(state) {
                        const { $from } = state.selection;
                        const decos = [];
                        for (let d = $from.depth; d > 0; d -= 1) {
                            const name = $from.node(d).type.name;
                            if (name !== 'layoutGrid' && name !== 'layoutCell') continue;
                            decos.push(Decoration.node($from.before(d), $from.after(d), {
                                class: name === 'layoutGrid' ? 'is-active' : 'is-focused',
                            }));
                        }
                        return decos.length ? DecorationSet.create(state.doc, decos) : null;
                    },
                },
            }),
        ];
    },

    addCommands() {
        return {
            /**
             * Insert one grid: a single row of two equal cells.
             *
             * There used to be three insert commands — two-column, wide-left,
             * three-column — which produced the same node with a different
             * preset and left the author to guess which they wanted before
             * seeing anything. One command and a grid you can then reshape is
             * both simpler and more capable.
             */
            insertLayoutGrid: () => ({ state, tr, dispatch }) => {
                const { $from } = state.selection;
                /*
                  One grid may sit inside another — a three-column row of step
                  cards, each card a container holding its own small grid, is
                  exactly that shape and could not be built at all while any
                  nesting was refused.

                  Two is the limit. Past that the row and column rails start
                  stacking on top of each other, and content gets buried several
                  levels deep with no obvious way back out.
                */
                let depth = 0;
                for (let d = $from.depth; d > 0; d -= 1) {
                    if ($from.node(d).type.name === this.name) depth += 1;
                }
                if (depth >= MAX_GRID_DEPTH) return false;
                if (!dispatch) return true;

                const grid = buildGrid(state.schema, { rows: 1, cols: DEFAULT_COLS });
                const at = $from.before($from.depth);
                const empty = $from.parent.content.size === 0;

                // Replace an empty paragraph rather than leaving a blank line
                // above every grid the author inserts.
                if (empty) tr.replaceWith(at, at + $from.parent.nodeSize, grid);
                else tr.insert($from.after($from.depth), grid);

                const gridPos = empty ? at : $from.after($from.depth);
                const inserted = tr.doc.nodeAt(gridPos);
                if (inserted) {
                    const first = flatCells(inserted, gridPos)[0];
                    if (first) caretInto(tr, first.pos);
                }
                dispatch(tr);
                return true;
            },

            /**
             * Grow or shrink the focused cell in any direction.
             *
             * Replaces growLayoutCell/shrinkLayoutCell, which only ever merged
             * rightward. The cell's own row and column come from the placement,
             * not from its index among its siblings — once cells span rows the
             * two are no longer the same thing.
             */
            resizeLayoutCell: (direction = 'right', grow = true) => ({ state, dispatch }) => {
                const here = locate(state);
                if (!here) return false;
                const placement = computePlacement(here.grid, here.gridPos);
                const me = placement.cells.find((c) => c.pos === here.cellPos);
                if (!me) return false;
                if (dispatch) {
                    const { tr } = state;
                    (grow ? expandCell : contractCell)(tr, here.gridPos, { row: me.row, col: me.col, direction });
                    if (tr.docChanged) dispatch(tr);
                }
                return true;
            },
        };
    },
});

export default LayoutGrid;
