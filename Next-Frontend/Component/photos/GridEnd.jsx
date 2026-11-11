/**
 * The last tile of a justified grid: it grows into whatever the last row
 * leaves (flex-grow 1000), so a contact sheet never ends in a hole. The space
 * becomes a jelly — the ceremony's colour over a faint jaali — and, when there
 * is room for it (container query), something useful: keep going, the end, a
 * way onward. On a full last row it wraps to a slim band of its own.
 */
import { inkOn, GOLD } from '@/lib/grades.js';

export default function GridEnd({ grade = GOLD, children = null }) {
    return (
        <li className="pfill" style={{ '--grade': grade, '--jelly-ink': inkOn(grade) }} aria-hidden={children ? undefined : true}>
            <span aria-hidden="true" className="jelly-wash" />
            <span aria-hidden="true" className="jelly-lattice jaali-dense" />
            {children && <span className="pfill-body">{children}</span>}
        </li>
    );
}
