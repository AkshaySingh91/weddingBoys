/**
 * HardBreakBlock — Shift+Enter.
 *
 * Without this the node fell through renderAst's unknown-type branch and became
 * an empty <div>, turning a soft line break into a block-level gap.
 */
export default function HardBreakBlock() {
    return <br />;
}
