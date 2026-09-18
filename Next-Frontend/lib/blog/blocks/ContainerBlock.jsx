/**
 * ContainerBlock — the public render of a styled box.
 *
 * Class names come from the same layoutTokens the editor uses, so the editor and
 * the published page cannot drift. Children are the nested blocks, rendered by
 * renderAst — exactly the pattern CalloutBlock already uses.
 *
 * The optional head (marker · icon · label) is what lets one box be both a
 * numbered step card and an info-strip cell, which between them account for most
 * of the "designed" look in the reference layouts.
 */
import { containerClasses, containerStyle } from '@/app/admin/(dashboard)/blogs/_components/layoutTokens.js';
import { BlockIcon } from '@/lib/blog/blockIcons.jsx';

export default function ContainerBlock({ node, children }) {
    const { marker = '', icon = '', label = '' } = node.attrs || {};
    const hasHead = Boolean(marker || icon || label);

    return (
        <div
            className={`blog-container ${containerClasses(node.attrs || {})}`}
            style={containerStyle(node.attrs || {})}
        >
            {hasHead && (
                <span className="blog-container-head">
                    {marker ? <span className="blog-container-marker">{marker}</span> : null}
                    <BlockIcon name={icon} size={16} weight="bold" className="blog-container-icon" />
                    {label ? <span className="blog-container-label">{label}</span> : null}
                </span>
            )}
            {children}
        </div>
    );
}
