'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import {
    Trash,
    FilmSlate,
    InstagramLogo,
    SpotifyLogo,
    MapPin,
    PinterestLogo,
    Sparkle,
    ArrowSquareOut,
    LinkSimple,
} from '@phosphor-icons/react';

const PROVIDER_ICONS = {
    youtube: FilmSlate,
    vimeo: FilmSlate,
    stream: FilmSlate,
    instagram: InstagramLogo,
    spotify: SpotifyLogo,
    'google-maps': MapPin,
    pinterest: PinterestLogo,
    'client-showcase': Sparkle,
};

const PROVIDER_NAMES = {
    youtube: 'YouTube Video',
    vimeo: 'Vimeo Cinema',
    stream: 'Studio 4K Stream',
    instagram: 'Instagram Reel/Post',
    spotify: 'Spotify Audio',
    'google-maps': 'Google Maps Venue',
    pinterest: 'Pinterest Pin',
    'client-showcase': 'Studio Film Showcase',
};

function EmbedView({ node, updateAttributes, deleteNode, selected }) {
    const {
        provider = 'youtube',
        embedUrl = '',
        url = '',
        thumbnail = '',
        title = '',
        author = '',
        aspectRatio = '16/9',
        caption = '',
        clientRef = null,
    } = node.attrs;

    const Icon = PROVIDER_ICONS[provider] || FilmSlate;
    const providerName = PROVIDER_NAMES[provider] || provider;

    const isCompact = provider === 'spotify' && aspectRatio === 'compact';
    const isPortrait = aspectRatio === '9/16' || aspectRatio === '4/5';

    return (
        <NodeViewWrapper className={`my-8 overflow-hidden rounded-xl border border-edge-subtle bg-white shadow-sm font-sans transition-all ${selected ? 'ring-2 ring-accent' : ''}`}>
            {/* Header / Provider Badge */}
            <div className="flex items-center justify-between border-b border-edge-subtle bg-ground/70 px-4 py-2.5" contentEditable={false}>
                <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white shadow-sm text-accent-ink">
                        <Icon size={14} weight="bold" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-ink">
                        {providerName}
                    </span>
                    {author && (
                        <span className="text-[11px] text-ink-muted truncate max-w-[180px]">
                            · {author}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {url && (
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-ink-muted hover:text-ink-secondary p-1 transition-colors"
                            title="Open original link"
                        >
                            <ArrowSquareOut size={14} />
                        </a>
                    )}
                    {selected && (
                        <button
                            type="button"
                            onClick={() => deleteNode()}
                            className="rounded-lg p-1 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove embed"
                        >
                            <Trash size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Media Canvas Preview */}
            <div className="p-3 bg-ground/40" contentEditable={false}>
                <div
                    className={`relative overflow-hidden rounded-xl border border-edge-subtle bg-black mx-auto ${
                        isCompact ? 'h-24 w-full' : isPortrait ? 'aspect-[9/16] max-w-xs' : 'aspect-video w-full'
                    }`}
                >
                    {embedUrl ? (
                        <iframe
                            src={embedUrl}
                            title={title || 'Embed preview'}
                            className="absolute inset-0 h-full w-full border-0"
                            loading="lazy"
                            allowFullScreen
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-ink text-ink-muted text-xs">
                            No embed source
                        </div>
                    )}
                </div>
            </div>

            {/* Title & Caption */}
            <div className="px-4 py-3 border-t border-edge-subtle bg-white space-y-2" contentEditable={false}>
                {title && (
                    <h4 className="text-xs font-semibold text-ink truncate">
                        {title}
                    </h4>
                )}
                {selected ? (
                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                        <div className="flex-1 w-full">
                            <input
                                type="text"
                                value={caption || ''}
                                onChange={(e) => updateAttributes({ caption: e.target.value })}
                                placeholder="Add editorial caption (optional)..."
                                className="w-full rounded-lg border border-edge-subtle bg-ground px-2.5 py-1 text-xs text-ink focus:outline-none focus:border-accent"
                            />
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                            <label className="text-[10px] font-semibold text-ink-muted uppercase">Ratio:</label>
                            <select
                                value={aspectRatio}
                                onChange={(e) => updateAttributes({ aspectRatio: e.target.value })}
                                className="rounded-lg border border-edge-subtle bg-white px-2 py-1 text-xs text-ink font-medium focus:outline-none focus:border-accent"
                            >
                                <option value="16/9">16:9 (Landscape)</option>
                                <option value="9/16">9:16 (Vertical / Reel)</option>
                                <option value="4/5">4:5 (Portrait)</option>
                                <option value="1/1">1:1 (Square)</option>
                                <option value="compact">Compact Audio</option>
                            </select>
                        </div>
                    </div>
                ) : (
                    caption && (
                        <p className="text-center text-xs text-ink-muted italic">
                            {caption}
                        </p>
                    )
                )}
            </div>
        </NodeViewWrapper>
    );
}

export const Embed = Node.create({
    name: 'embed',
    group: 'block',
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            provider: { default: 'youtube' },
            url: { default: '' },
            embedId: { default: '' },
            embedUrl: { default: '' },
            thumbnail: { default: '' },
            title: { default: '' },
            author: { default: '' },
            aspectRatio: { default: '16/9' },
            caption: { default: '' },
            clientRef: { default: null },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-embed]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-embed': '' })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(EmbedView);
    },

    addCommands() {
        return {
            setEmbed: (attrs) => ({ commands }) => commands.insertContent({ type: this.name, attrs }),
        };
    },
});

export default Embed;
