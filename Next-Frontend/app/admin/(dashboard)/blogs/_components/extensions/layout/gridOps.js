/**
 * Position arithmetic and placement for the layout grid.
 *
 * Every mutation takes a ProseMirror transaction and mutates it, so a whole
 * structural edit — "add a column", which touches the grid's attrs *and* every
 * row — lands as one step group. That matters for undo: a column added row by
 * row across four transactions unwinds row by row too, and the document sits in
 * a ragged intermediate state the schema was never meant to hold.
 *
 * It lives apart from the NodeView because this is where the bugs are. Position
 * maths is unforgiving and invisible; kept pure it can be exercised headlessly
 * against a real schema before a single pixel of UI exists.
 *
 * ## The occupancy model
 *
 * Cells span columns AND rows, so a row's cells no longer line up with the
 * columns one-to-one: a cell spanning down from an earlier row occupies slots in
 * this one without appearing among its children. This is exactly the problem an
 * HTML table solves with `rowspan`, and `computePlacement` uses the same
 * algorithm — walk the rows in order, put each cell in the first free slot, mark
 * every slot it covers.
 *
 * `computePlacement` is the single source of truth for where a cell sits, and
 * **both the editor and the public renderer call it**, so the two cannot drift.
 *
 * Positions are read from `tr.doc` (the *current* document, including any steps
 * the caller already applied) and used raw, never through `tr.mapping`. That is
 * only safe because every loop runs **back to front**: a mutation at a later
 * position cannot disturb an earlier one that has not been touched yet.
 */

import {
    normaliseCols, RATIO_TOTAL, MAX_COLUMNS, MAX_ROWS, DEFAULT_COLS, rowHeightLength,
} from '../../layoutTokens.js';

const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);

/* ----------------------------------------------------------------- reading */

/** Rows with their absolute positions. */
export function rowsOf(grid, gridPos) {
    const rows = [];
    grid.forEach((node, offset, index) => {
        rows.push({ node, index, pos: gridPos + 1 + offset });
    });
    return rows;
}

/** A row's cells with their absolute positions, in document order. */
export function cellsOf(row, rowPos) {
    const cells = [];
    row.forEach((node, offset, index) => {
        cells.push({
            node,
            index,
            pos: rowPos + 1 + offset,
            colSpan: Math.max(1, Number(node.attrs?.span) || 1),
            rowSpan: Math.max(1, Number(node.attrs?.rowSpan) || 1),
        });
    });
    return cells;
}

export const columnCount = (grid) => normaliseCols(grid.attrs?.cols).length;

/**
 * Where every cell actually sits.
 *
 * Returns one entry per cell with its row and column line (1-based, ready for
 * `grid-row` / `grid-column`), plus a slot map for asking "what covers row 2,
 * column 3" — which is what every structural edit needs and cannot get from
 * document order alone once a cell spans rows.
 */
export function computePlacement(grid, gridPos = 0) {
    const cols = normaliseCols(grid.attrs?.cols);
    const rows = rowsOf(grid, gridPos);
    const spans = rows.map(({ node: row, pos: rowPos }) => cellsOf(row, rowPos));

    const { placed } = placeCells(spans, cols.length);
    const cells = placed.map((p) => ({ ...spans[p.rowIndex][p.cellIndex], ...p, rowPos: rows[p.rowIndex].pos }));

    // Re-key the slot map onto the enriched entries.
    const bySlot = new Map();
    cells.forEach((c) => {
        for (let r = c.row; r < c.row + c.rowSpan; r += 1) {
            for (let k = c.col; k < c.col + c.colSpan; k += 1) bySlot.set(`${r},${k}`, c);
        }
    });

    return { cols, colCount: cols.length, rowCount: rows.length, rows, cells, slots: bySlot };
}

/**
 * The placement algorithm itself, over plain numbers.
 *
 * Shared deliberately: the editor calls it through `computePlacement` with
 * ProseMirror nodes, and the published page calls it directly with the JSON
 * straight out of the database. One implementation means the two cannot put a
 * cell in different places — the failure that would be hardest to notice and
 * worst to debug, because each side would look correct on its own.
 *
 * Same rule a table uses for rowspan: walk the rows in order, drop each cell in
 * the first free slot, mark every slot it covers.
 */
export function placeCells(rowsOfSpans, colCount) {
    const taken = new Set();
    const key = (r, c) => `${r},${c}`;
    const placed = [];
    const slots = new Map();

    rowsOfSpans.forEach((cells, rowIndex) => {
        let cursor = 0;
        cells.forEach((cell, cellIndex) => {
            while (cursor < colCount && taken.has(key(rowIndex, cursor))) cursor += 1;

            const colSpan = Math.min(Math.max(1, cell.colSpan || 1), Math.max(1, colCount - cursor));
            const rowSpan = Math.max(1, cell.rowSpan || 1);
            const entry = { rowIndex, cellIndex, row: rowIndex, col: cursor, colSpan, rowSpan };
            placed.push(entry);

            for (let r = rowIndex; r < rowIndex + rowSpan; r += 1) {
                for (let c = cursor; c < cursor + colSpan; c += 1) {
                    taken.add(key(r, c));
                    slots.set(key(r, c), entry);
                }
            }
            cursor += colSpan;
        });
    });

    return { placed, slots };
}

/**
 * Placement from the stored JSON, for the published page.
 *
 * Returns a Map keyed by each cell's JSON object, so a renderer holding only one
 * cell can still ask where it goes — the same shape `buildHeadingIds` uses.
 */
export function placeFromJson(gridJson) {
    const cols = normaliseCols(gridJson?.attrs?.cols);
    const rows = (gridJson?.content || []).filter((n) => n.type === 'layoutRow');
    const spans = rows.map((row) => (row.content || []).map((cell) => ({
        colSpan: Math.max(1, Number(cell.attrs?.span) || 1),
        rowSpan: Math.max(1, Number(cell.attrs?.rowSpan) || 1),
    })));

    const { placed } = placeCells(spans, cols.length);
    const byNode = new Map();
    placed.forEach((p) => {
        const cell = rows[p.rowIndex]?.content?.[p.cellIndex];
        if (cell) byNode.set(cell, p);
    });
    return byNode;
}

/**
 * `grid-template-rows` from each row's stored height.
 *
 * A height is a FLOOR, not a guillotine: `minmax(H, auto)`, never a bare `H`.
 * As a fixed track, a 20px row simply cut off whatever was in it — which is
 * what clipped the Pro Tip copy mid-sentence and left the comparison captions
 * running into each other. A floor still gives an author the band of images
 * they wanted, and lets a cell that needs more room take it instead of
 * destroying the content.
 */
export function templateFromRows(grid) {
    const rows = [];
    grid.forEach((row) => {
        const len = rowHeightLength(row.attrs);
        rows.push(len ? `minmax(${len}, auto)` : 'auto');
    });
    return rows.length ? rows.join(' ') : 'auto';
}

/** Per-row span totals, for tests. Every entry should equal the column count. */
export function coverageOf(grid) {
    const { colCount, rowCount, slots } = computePlacement(grid, 0);
    const totals = [];
    for (let r = 0; r < rowCount; r += 1) {
        let n = 0;
        for (let c = 0; c < colCount; c += 1) if (slots.has(`${r},${c}`)) n += 1;
        totals.push(n);
    }
    return totals;
}

/* ----------------------------------------------------------------- building */

export const emptyCell = (schema, span = 1, rowSpan = 1) =>
    schema.nodes.layoutCell.createAndFill({ span, rowSpan });

export const emptyRow = (schema, columns = 2) =>
    schema.nodes.layoutRow.create(
        null,
        Array.from({ length: Math.max(1, columns) }, () => emptyCell(schema)),
    );

/** A fresh grid: one row, two equal cells — the single insert shape. */
export function buildGrid(schema, { rows = 1, cols = DEFAULT_COLS, attrs = {} } = {}) {
    const columns = normaliseCols(cols);
    return schema.nodes.layoutGrid.create(
        { ...attrs, cols: columns },
        Array.from({ length: Math.max(1, rows) }, () => emptyRow(schema, columns.length)),
    );
}

/* ----------------------------------------------------------------- columns */

/**
 * Insert a column beside `index`.
 *
 * The new column inherits its neighbour's width, so adding a column to a 1:2
 * grid gives a predictable result instead of a hairline third track.
 *
 * Per row the boundary either falls *between* two cells — insert a new one — or
 * *inside* one, in which case that cell simply grows. A row where the boundary
 * is covered by a cell spanning down from above gets nothing at all: the cell
 * above grows once, on the row it belongs to.
 */
export function addColumn(tr, gridPos, { index = 0, side = 'right' } = {}) {
    const grid = tr.doc.nodeAt(gridPos);
    if (!grid) return tr;

    const cols = normaliseCols(grid.attrs.cols);
    if (cols.length >= MAX_COLUMNS) return tr;

    const col = clamp(index, 0, cols.length - 1);
    const at = clamp(side === 'left' ? col : col + 1, 0, cols.length);
    const { schema } = tr.doc.type;
    const { rows, slots } = computePlacement(grid, gridPos);

    const grown = new Set();
    const edits = [];   // collected, then applied back to front
    const placement = computePlacement(grid, gridPos);

    for (let r = 0; r < rows.length; r += 1) {
        const before = at > 0 ? slots.get(`${r},${at - 1}`) : null;
        const after = at < cols.length ? slots.get(`${r},${at}`) : null;

        // One cell covering both sides of the boundary simply gets wider — and
        // only once, however many rows it spans.
        if (before && after && before === after) {
            if (!grown.has(before)) {
                grown.add(before);
                edits.push({ kind: 'grow', at: before.pos, node: before.node, span: before.colSpan + 1 });
            }
            continue;
        }

        /*
          Otherwise this row needs a cell of its own — including a row that sits
          UNDER a cell spanning down from above. Skipping those left a hole:
          adding a column beside a 2-row-tall cell widened the grid to three
          columns while the row beneath still had cells for two, and the middle
          slot belonged to nobody.

          The insertion point is found among the row's OWN children, since a cell
          from another row is not among them.
        */
        const own = placement.cells.filter((c) => c.rowIndex === r);
        const next = own.find((c) => c.col >= at);
        const insertAt = next ? next.pos : rows[r].pos + rows[r].node.nodeSize - 1;
        edits.push({ kind: 'insert', at: insertAt });
    }

    edits.sort((a, b) => b.at - a.at);
    for (const e of edits) {
        if (e.kind === 'grow') tr.setNodeMarkup(e.at, null, { ...e.node.attrs, span: e.span });
        else tr.insert(e.at, emptyCell(schema));
    }

    const next = [...cols];
    next.splice(at, 0, cols[col]);
    // The grid's own position is unmoved by edits to its content.
    tr.setNodeMarkup(gridPos, null, { ...grid.attrs, cols: normaliseCols(next) });
    return tr;
}

/** Remove a column: shrink whichever cells cover it, or drop them. */
export function deleteColumn(tr, gridPos, { index = 0 } = {}) {
    const grid = tr.doc.nodeAt(gridPos);
    if (!grid) return tr;

    const cols = normaliseCols(grid.attrs.cols);
    if (cols.length <= 1) return tr;
    const col = clamp(index, 0, cols.length - 1);

    const { rowCount, slots } = computePlacement(grid, gridPos);
    const seen = new Set();
    const edits = [];

    for (let r = 0; r < rowCount; r += 1) {
        const owner = slots.get(`${r},${col}`);
        if (!owner || seen.has(owner)) continue;
        seen.add(owner);

        if (owner.colSpan > 1) {
            edits.push({ kind: 'shrink', at: owner.pos, node: owner.node, span: owner.colSpan - 1 });
        } else {
            edits.push({ kind: 'delete', at: owner.pos, size: owner.node.nodeSize });
        }
    }

    edits.sort((a, b) => b.at - a.at);
    for (const e of edits) {
        if (e.kind === 'shrink') tr.setNodeMarkup(e.at, null, { ...e.node.attrs, span: e.span });
        else tr.delete(e.at, e.at + e.size);
    }

    tr.setNodeMarkup(gridPos, null, {
        ...grid.attrs,
        cols: normaliseCols(cols.filter((_, i) => i !== col)),
    });
    return tr;
}

/** Set one column's ratio unit directly (the rail's − n + stepper). */
export function setColumnUnits(tr, gridPos, { index = 0, units = 1 } = {}) {
    const grid = tr.doc.nodeAt(gridPos);
    if (!grid) return tr;
    const cols = normaliseCols(grid.attrs.cols);
    const next = [...cols];
    next[clamp(index, 0, next.length - 1)] = Math.max(1, Math.round(units));
    tr.setNodeMarkup(gridPos, null, { ...grid.attrs, cols: normaliseCols(next) });
    return tr;
}

export function setCols(tr, gridPos, cols) {
    const grid = tr.doc.nodeAt(gridPos);
    if (!grid) return tr;
    tr.setNodeMarkup(gridPos, null, { ...grid.attrs, cols: normaliseCols(cols) });
    return tr;
}

/**
 * Where a divider drag lands: redistribute between two adjacent columns only,
 * holding their combined share of the grid constant.
 *
 * The whole array is scaled up first so the pair has at least RATIO_TOTAL units
 * to divide. Resizing a 1:1:1 grid's first pair to a third would otherwise have
 * to round to [1,1,1] or [0,2,1] — there is no resolution between them. Scaling
 * to [6,6,6] lets it land on [4,8,6], which normalises to 2:4:3, and the
 * untouched third column still holds exactly its original third.
 */
export function resizePair(cols, index, fraction) {
    const c = normaliseCols(cols);
    if (index < 0 || index >= c.length - 1) return c;

    const pairTotal = c[index] + c[index + 1];
    const k = Math.max(1, Math.ceil(RATIO_TOTAL / pairTotal));
    const scaled = c.map((n) => n * k);
    const total = pairTotal * k;

    const left = clamp(Math.round(fraction * total), 1, total - 1);
    scaled[index] = left;
    scaled[index + 1] = total - left;
    return normaliseCols(scaled);
}

/* -------------------------------------------------------------------- rows */

/**
 * Insert a row.
 *
 * The new row gets a cell only for the columns that are actually free: where a
 * cell spans down from above, the slot already has an owner, and adding a cell
 * there would push the row one column too wide.
 */
export function addRow(tr, gridPos, { index = 0, side = 'below' } = {}) {
    const grid = tr.doc.nodeAt(gridPos);
    if (!grid || grid.childCount >= MAX_ROWS) return tr;

    const { rows, colCount, slots } = computePlacement(grid, gridPos);
    const at = clamp(side === 'above' ? index : index + 1, 0, rows.length);

    // Any cell spanning across the seam grows by one row instead of being cut.
    const stretched = new Set();
    if (at > 0 && at < rows.length) {
        for (let c = 0; c < colCount; c += 1) {
            const above = slots.get(`${at - 1},${c}`);
            const below = slots.get(`${at},${c}`);
            if (above && below && above === below) stretched.add(above);
        }
    }

    let free = colCount;
    for (const cell of stretched) free -= cell.colSpan;

    const { schema } = tr.doc.type;
    const insertAt = at >= rows.length ? gridPos + grid.nodeSize - 1 : rows[at].pos;

    // Grow the straddling cells first — they sit before the insertion point only
    // sometimes, so apply the row insert last and use raw positions carefully.
    const edits = [...stretched].map((cell) => ({ at: cell.pos, node: cell.node, rowSpan: cell.rowSpan + 1 }));
    edits.sort((a, b) => b.at - a.at);

    // No free columns means every one is taken by a span from above, so the new
    // row correctly holds nothing of its own.
    tr.insert(insertAt, free > 0 ? emptyRow(schema, free) : schema.nodes.layoutRow.create(null, []));

    for (const e of edits) {
        const shifted = e.at >= insertAt ? e.at + (free > 0 ? emptyRow(schema, free).nodeSize : 0) : e.at;
        const current = tr.doc.nodeAt(shifted);
        if (current && current.type.name === 'layoutCell') {
            tr.setNodeMarkup(shifted, null, { ...current.attrs, rowSpan: e.rowSpan });
        }
    }
    return tr;
}

/**
 * Delete a row.
 *
 * Cells that merely pass through it shrink by one. A cell that *starts* there
 * and spans downward is moved into the next row rather than deleted, so its
 * content survives.
 */
export function deleteRow(tr, gridPos, { index = 0 } = {}) {
    const grid = tr.doc.nodeAt(gridPos);
    if (!grid || grid.childCount <= 1) return tr;

    const { rows, colCount, slots, cells } = computePlacement(grid, gridPos);
    const r = clamp(index, 0, rows.length - 1);

    // Cells crossing this row from above just get shorter.
    const passing = new Set();
    for (let c = 0; c < colCount; c += 1) {
        const owner = slots.get(`${r},${c}`);
        if (owner && owner.rowIndex < r && owner.rowIndex + owner.rowSpan > r) passing.add(owner);
    }

    // Cells starting here that reach further down are re-homed one row later.
    const survivors = cells.filter((c) => c.rowIndex === r && c.rowSpan > 1);
    const nextRow = rows[r + 1];

    const shrinkEdits = [...passing].map((cell) => ({ at: cell.pos, node: cell.node, rowSpan: cell.rowSpan - 1 }));
    shrinkEdits.sort((a, b) => b.at - a.at);
    for (const e of shrinkEdits) {
        tr.setNodeMarkup(e.at, null, { ...e.node.attrs, rowSpan: Math.max(1, e.rowSpan) });
    }

    // Re-home before deleting, so the source positions are still valid.
    if (survivors.length && nextRow) {
        const moved = survivors.map((c) =>
            c.node.type.create({ ...c.node.attrs, rowSpan: Math.max(1, c.rowSpan - 1) }, c.node.content));
        tr.insert(nextRow.pos + 1, moved);
    }

    const row = rows[r];
    const size = tr.doc.nodeAt(row.pos)?.nodeSize ?? row.node.nodeSize;
    tr.delete(row.pos, row.pos + size);
    return tr;
}

export function setRowHeight(tr, gridPos, { index = 0, height = 'auto', customHeight = null } = {}) {
    const grid = tr.doc.nodeAt(gridPos);
    if (!grid) return tr;
    const rows = rowsOf(grid, gridPos);
    const row = rows[clamp(index, 0, rows.length - 1)];
    if (!row) return tr;
    tr.setNodeMarkup(row.pos, null, { ...row.node.attrs, height, customHeight });
    return tr;
}

/* ------------------------------------------------------------------- cells */

/**
 * Rebuild the grid from a flat list of placed cells.
 *
 * Expanding and contracting a cell moves nodes between rows, and doing that with
 * raw positions means arithmetic that is correct only until the next edit shifts
 * something. Rebuilding the whole grid node from a model instead removes the
 * arithmetic altogether: work out what the grid should look like, then write it
 * once. It is still a single transaction, so undo is unaffected.
 */
function rebuildGrid(tr, gridPos, grid, cells, rowAttrs) {
    const { schema } = tr.doc.type;
    const rowCount = rowAttrs.length;

    const byRow = Array.from({ length: rowCount }, () => []);
    for (const c of cells) {
        if (c.row >= 0 && c.row < rowCount) byRow[c.row].push(c);
    }
    byRow.forEach((list) => list.sort((a, b) => a.col - b.col));

    const rowNodes = byRow.map((list, i) => schema.nodes.layoutRow.create(
        rowAttrs[i],
        list.map((c) => schema.nodes.layoutCell.create(
            { ...(c.attrs || {}), span: c.colSpan, rowSpan: c.rowSpan },
            c.content || schema.nodes.paragraph.create(),
        )),
    ));

    tr.replaceWith(gridPos, gridPos + grid.nodeSize, schema.nodes.layoutGrid.create(grid.attrs, rowNodes));
    return tr;
}

/** The cells and row attributes as a plain model, ready to be edited. */
function modelOf(grid, gridPos) {
    const placement = computePlacement(grid, gridPos);
    const cells = placement.cells.map((c) => ({
        row: c.row,
        col: c.col,
        colSpan: c.colSpan,
        rowSpan: c.rowSpan,
        attrs: c.node.attrs,
        content: c.node.content,
        node: c.node,
        ref: c,
    }));
    const rowAttrs = placement.rows.map((r) => r.node.attrs);
    return { placement, cells, rowAttrs };
}

/** Is this cell empty enough that merging it away loses nothing? */
const blankCell = (node) => node.childCount === 1 && node.firstChild.content.size === 0;

/** Append one cell's blocks onto another's, skipping empty ones. */
function mergedContent(schema, keep, absorbed) {
    const out = [];
    keep.content.forEach((n) => out.push(n));
    for (const v of absorbed) {
        if (blankCell(v.node)) continue;
        v.content.forEach((n) => out.push(n));
    }
    return out.length ? out : [schema.nodes.paragraph.create()];
}

/** The cell holding a given slot, or null. */
export const ownerAt = (placement, row, col) => placement.slots.get(`${row},${col}`) || null;

/**
 * Grow a cell into the neighbouring slot, in any of the four directions.
 *
 * The absorbed cell's blocks are carried into the survivor rather than dropped.
 * A merge that silently eats a paragraph is data loss the author finds out about
 * much later, which is far worse than a slightly untidy merged cell.
 *
 * Growing up or left moves where the cell starts; growing down or right only
 * changes how far it reaches. Rebuilding from the model makes both the same
 * amount of work.
 */
export function expandCell(tr, gridPos, { row = 0, col = 0, direction = 'right' } = {}) {
    const grid = tr.doc.nodeAt(gridPos);
    if (!grid) return tr;

    const { placement, cells, rowAttrs } = modelOf(grid, gridPos);
    const { colCount, rowCount } = placement;
    const meRef = ownerAt(placement, row, col);
    if (!meRef) return tr;
    const me = cells.find((c) => c.ref === meRef);
    if (!me) return tr;

    // Which slots would be taken, and who owns them now.
    const wanted = [];
    if (direction === 'right') {
        const c = me.col + me.colSpan;
        if (c >= colCount) return tr;
        for (let r = me.row; r < me.row + me.rowSpan; r += 1) wanted.push([r, c]);
    } else if (direction === 'left') {
        const c = me.col - 1;
        if (c < 0) return tr;
        for (let r = me.row; r < me.row + me.rowSpan; r += 1) wanted.push([r, c]);
    } else if (direction === 'down') {
        const r = me.row + me.rowSpan;
        if (r >= rowCount) return tr;
        for (let c = me.col; c < me.col + me.colSpan; c += 1) wanted.push([r, c]);
    } else if (direction === 'up') {
        const r = me.row - 1;
        if (r < 0) return tr;
        for (let c = me.col; c < me.col + me.colSpan; c += 1) wanted.push([r, c]);
    } else {
        return tr;
    }

    const victimRefs = [...new Set(wanted.map(([r, c]) => ownerAt(placement, r, c)).filter(Boolean))];
    if (!victimRefs.length) return tr;
    const victims = victimRefs.map((v) => cells.find((c) => c.ref === v)).filter(Boolean);

    // Only absorb neighbours that line up exactly. A ragged merge would leave a
    // hole no later edit could reason about, so refuse instead of guessing.
    const horizontal = direction === 'left' || direction === 'right';
    if (horizontal) {
        if (victims.length !== 1) return tr;
        if (victims[0].row !== me.row || victims[0].rowSpan !== me.rowSpan) return tr;
    } else {
        const span = victims.reduce((n, v) => n + v.colSpan, 0);
        if (span !== me.colSpan) return tr;
        if (victims.some((v) => v.col < me.col || v.col + v.colSpan > me.col + me.colSpan)) return tr;
    }

    const { schema } = tr.doc.type;
    const content = mergedContent(schema, me, victims);
    const next = cells.filter((c) => c !== me && !victims.includes(c));

    next.push({
        ...me,
        content: null,
        node: null,
        attrs: me.attrs,
        col: direction === 'left' ? me.col - 1 : me.col,
        row: direction === 'up' ? me.row - 1 : me.row,
        colSpan: horizontal ? me.colSpan + victims.reduce((n, v) => n + v.colSpan, 0) : me.colSpan,
        rowSpan: horizontal ? me.rowSpan : me.rowSpan + 1,
        contentNodes: content,
    });

    return rebuildGrid(tr, gridPos, grid,
        next.map((c) => ({ ...c, content: c.contentNodes || c.content })), rowAttrs);
}

/**
 * Give a slot back, refilling what is freed with an empty cell so the grid stays
 * fully covered.
 */
export function contractCell(tr, gridPos, { row = 0, col = 0, direction = 'right' } = {}) {
    const grid = tr.doc.nodeAt(gridPos);
    if (!grid) return tr;

    const { placement, cells, rowAttrs } = modelOf(grid, gridPos);
    const meRef = ownerAt(placement, row, col);
    if (!meRef) return tr;
    const me = cells.find((c) => c.ref === meRef);
    if (!me) return tr;

    const horizontal = direction === 'left' || direction === 'right';
    if (horizontal && me.colSpan <= 1) return tr;
    if (!horizontal && me.rowSpan <= 1) return tr;

    const next = cells.filter((c) => c !== me);
    const freed = [];

    if (horizontal) {
        const shrunk = { ...me, colSpan: me.colSpan - 1, col: direction === 'left' ? me.col + 1 : me.col };
        next.push(shrunk);
        freed.push({
            row: me.row,
            col: direction === 'left' ? me.col : me.col + me.colSpan - 1,
            colSpan: 1,
            rowSpan: me.rowSpan,
        });
    } else {
        const shrunk = { ...me, rowSpan: me.rowSpan - 1, row: direction === 'up' ? me.row + 1 : me.row };
        next.push(shrunk);
        freed.push({
            row: direction === 'up' ? me.row : me.row + me.rowSpan - 1,
            col: me.col,
            colSpan: me.colSpan,
            rowSpan: 1,
        });
    }

    const { schema } = tr.doc.type;
    for (const f of freed) next.push({ ...f, attrs: {}, content: schema.nodes.paragraph.create() });

    return rebuildGrid(tr, gridPos, grid, next, rowAttrs);
}
