'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { Trash, FilmSlate } from '@phosphor-icons/react';

// Cloudflare Stream's universal ABR player (auto HLS/DASH, no client JS needed).
const streamIframe = (uid, poster) =>
    `https://iframe.videodelivery.net/${uid}${poster ? `?poster=${encodeURIComponent(poster)}` : ''}`;

// Turn attrs into { provider, embedSrc }. Prefers a Cloudflare Stream uid; else
// resolves a raw URL to direct S3/mp4, YouTube or Vimeo.
export function resolveVideo(url = '', streamUid = null, poster = '') {
    if (streamUid) return { provider: 'stream', embedSrc: streamIframe(streamUid, poster) };
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
    if (yt) return { provider: 'youtube', embedSrc: `https://www.youtube.com/embed/${yt[1]}` };
    const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeo) return { provider: 'vimeo', embedSrc: `https://player.vimeo.com/video/${vimeo[1]}` };
    return { provider: 's3', embedSrc: url };
}

function VideoView({ node, deleteNode, selected }) {
    const { src, provider, poster, caption, streamUid } = node.attrs;
    const { embedSrc, provider: resolvedProvider } = resolveVideo(src, streamUid, poster);
    const kind = streamUid ? 'stream' : (provider || resolvedProvider);

    return (
        <NodeViewWrapper className={`wedding-video my-5 transition-all ${selected ? 'rounded-2xl ring-2 ring-[#8C532B]' : ''}`}>
            <div className="relative w-full overflow-hidden rounded-2xl bg-black shadow-md" style={{ aspectRatio: '16 / 9' }}>
                {kind === 's3' ? (
                    <video controls poster={poster || undefined} className="h-full w-full" src={embedSrc}>
                        <track kind="captions" />
                    </video>
                ) : (
                    <iframe
                        src={embedSrc}
                        title={caption || 'Wedding video'}
                        className="absolute inset-0 h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                )}
            </div>
            {caption ? <p className="mt-2 text-center text-xs text-stone-500 font-sans italic">{caption}</p> : null}
            {selected && (
                <div contentEditable={false} className="mt-2 flex items-center gap-2 rounded-xl border border-[#E5DCD3] bg-white px-3 py-1.5 shadow-sm font-sans">
                    <FilmSlate size={15} className="text-[#8C532B]" />
                    <span className="text-xs text-stone-600 font-medium uppercase">{kind} video</span>
                    <button
                        type="button"
                        onClick={() => deleteNode()}
                        className="ml-auto rounded-lg p-1 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove video"
                    >
                        <Trash size={14} />
                    </button>
                </div>
            )}
        </NodeViewWrapper>
    );
}

export const WeddingVideoEmbed = Node.create({
    name: 'weddingVideoEmbed',
    group: 'block',
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            src: { default: '' },
            provider: { default: null }, // 's3' | 'youtube' | 'vimeo' | 'stream'
            streamUid: { default: null }, // Cloudflare Stream asset id (preferred)
            poster: { default: '' },
            caption: { default: '' },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-wedding-video]' }];
    },

    renderHTML({ node }) {
        const { src, poster, caption, streamUid } = node.attrs;
        const { provider, embedSrc } = resolveVideo(src, streamUid, poster);
        const media = provider === 's3'
            ? ['video', { controls: 'true', poster: poster || '', src: embedSrc, class: 'wedding-video-media' }]
            : ['iframe', {
                src: embedSrc,
                class: 'wedding-video-media',
                loading: 'lazy',
                allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
                allowfullscreen: 'true',
                title: caption || 'Wedding video',
            }];
        const children = [['div', { class: 'wedding-video-frame' }, media]];
        if (caption) children.push(['p', { class: 'wedding-video-caption' }, caption]);
        return [
            'div',
            mergeAttributes({
                'data-wedding-video': '',
                'data-provider': provider,
                ...(streamUid ? { 'data-stream-uid': streamUid } : { 'data-src': src }),
                class: 'wedding-video',
            }),
            ...children,
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(VideoView);
    },

    addCommands() {
        return {
            setWeddingVideo: (attrs) => ({ commands }) => commands.insertContent({ type: this.name, attrs }),
        };
    },
});

export default WeddingVideoEmbed;
