/**
 * TaskListBlock / TaskItemBlock — checklists.
 *
 * Rendered read-only on the public page: a reader cannot tick an author's
 * checklist, so the boxes are presentational and marked aria-hidden, with the
 * state conveyed by the text itself rather than by an input a screen reader
 * would announce as actionable.
 */
import { Check } from '@phosphor-icons/react/dist/ssr';

export function TaskListBlock({ children }) {
    return (
        <ul className="mb-5 ml-1 list-none space-y-2 text-base leading-[1.8] text-studio-ink/90 sm:text-[17px]">
            {children}
        </ul>
    );
}

export function TaskItemBlock({ node, children }) {
    const checked = Boolean(node?.attrs?.checked);
    return (
        <li className="flex items-start gap-2.5">
            <span
                aria-hidden="true"
                className={`mt-[0.35em] flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    checked
                        ? 'border-studio-terracotta bg-studio-terracotta text-white'
                        : 'border-studio-borderStrong bg-white'
                }`}
            >
                {checked && <Check size={10} weight="bold" />}
            </span>
            <span className={checked ? 'text-studio-inkMuted line-through decoration-studio-inkMuted/40' : ''}>
                {children}
            </span>
        </li>
    );
}

export default TaskListBlock;
