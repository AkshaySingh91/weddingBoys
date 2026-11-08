'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { NodeSelection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import { fireMessage } from '@/Utils/fireMessage.js';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { Highlight } from '@tiptap/extension-highlight';
import { Placeholder } from '@tiptap/extensions';
import { TaskList, TaskItem, ListKeymap } from '@tiptap/extension-list';
import { FontSize, LetterSpacing, LineHeight } from './extensions/Typography.js';
import { Container } from './extensions/Container.jsx';
import { LayoutGrid, LayoutRow, LayoutCell } from './extensions/LayoutGrid.jsx';
import {
    TextB,
    TextItalic,
    TextUnderline,
    TextStrikethrough,
    TextH,
    ListBullets,
    ListNumbers,
    Columns,
    Square,
    TextT,
    CheckSquare,
    Quotes,
    Minus,
    LinkSimple,
    TextAlignLeft,
    TextAlignCenter,
    TextAlignRight,
    ImageSquare,
    Images,
    VideoCamera,
    MonitorPlay,
    ChatTeardropText,
    Clock,
    Article,
    Sparkle,
    Trophy,
    Question,
    Heart,
    CaretDown,
    Plus,
    MagnifyingGlass,
    InstagramLogo,
    SpotifyLogo,
    MapPin,
    PinterestLogo,
    FilmSlate,
    Check,
    X,
    Trash,
    ArrowCounterClockwise,
    ArrowClockwise,
    Code,
} from '@phosphor-icons/react';
import MediaPickerModal from '@/app/admin/components/MediaPickerModal.jsx';
import EmbedModal from './EmbedModal.jsx';
import ClientShowcasePickerModal from './ClientShowcasePickerModal.jsx';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/app/admin/components/ui/Dialog.jsx';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import TypographyControls from './TypographyControls.jsx';
import BlockGutter from './BlockGutter.jsx';
import { BlockHandle } from './extensions/BlockHandle.js';
import { InlineMedia } from './extensions/InlineMedia.jsx';
import { PhotoGallery } from './extensions/PhotoGallery.jsx';
import { WeddingVideoEmbed } from './extensions/WeddingVideoEmbed.jsx';
import { Embed } from './extensions/Embed.jsx';
import { Callout } from './extensions/Callout.jsx';
import { PullQuote } from './extensions/PullQuote.jsx';
import { AtAGlance } from './extensions/AtAGlance.jsx';
import { VendorCredits } from './extensions/VendorCredits.jsx';
import { FAQ } from './extensions/FAQ.jsx';
import { EnquiryCTA } from './extensions/EnquiryCTA.jsx';

function buildOutline(editor) {
    if (!editor) return [];
    const out = [];
    editor.state.doc.descendants((node) => {
        if (node.type.name === 'heading' && [2, 3, 4].includes(node.attrs.level)) {
            out.push({ level: node.attrs.level, text: node.textContent });
        }
    });
    return out;
}

function ToolbarButton({ onClick, active, disabled, title, children }) {
    return (
        <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`flex items-center justify-center h-8 w-8 rounded-lg text-xs transition-all cursor-pointer ${active
                    ? 'bg-ink text-white shadow-sm font-semibold'
                    : 'text-ink-secondary hover:bg-ground-sunk/80 hover:text-ink'
                } disabled:opacity-30 disabled:pointer-events-none`}
        >
            {children}
        </button>
    );
}

export default function Editor({
    initialContent,
    onUpdate,
    onTocChange,
    postMetadata = {},
}) {
    const [picker, setPicker] = useState(null); // 'inline' | 'gallery' | 'video' | null

    // Modals for Links and Universal Rich Media Embeds
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [embedModalOpen, setEmbedModalOpen] = useState(false);
    const [embedDefaultTab, setEmbedDefaultTab] = useState('link');
    const [clientPickerOpen, setClientPickerOpen] = useState(false);

    const openEmbedModal = (defaultTab = 'link') => {
        setEmbedDefaultTab(defaultTab);
        setEmbedModalOpen(true);
    };

    // Bubble menu link state
    const [bubbleLinkOpen, setBubbleLinkOpen] = useState(false);
    const [bubbleLinkUrl, setBubbleLinkUrl] = useState('');

    // Slash command state
    // The block holding the caret, measured by the BlockHandle plugin.
    const [activeBlock, setActiveBlock] = useState(null);

    const [slashOpen, setSlashOpen] = useState(false);
    const [slashQuery, setSlashQuery] = useState('');
    // Where the caret was when the menu opened, so it appears there instead of
    // at the top of the editor.
    const [slashAt, setSlashAt] = useState(null);
    // Typography is five dropdowns; kept in the main row they took more width
    // than everything else combined and pushed the bar into a scroll.
    const [typeOpen, setTypeOpen] = useState(false);
    const [slashIndex, setSlashIndex] = useState(0);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                link: false,
            }),
            Underline,
            Link.configure({
                openOnClick: false,
                autolink: true,
                HTMLAttributes: {
                    class: 'text-accent-ink underline decoration-accent/50 hover:decoration-accent font-medium transition-colors',
                    rel: 'noopener noreferrer',
                    target: '_blank',
                },
            }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TextStyle,
            Color,
            // Curated typography. FontSize/LetterSpacing hang off textStyle;
            // LineHeight is a block attribute (see extensions/Typography.js).
            FontFamily.configure({ types: ['textStyle'] }),
            FontSize,
            LetterSpacing,
            LineHeight,
            Highlight.configure({ multicolor: true }),
            // Checklists, plus the keymap that makes Tab/Shift-Tab nest and
            // Backspace lift a list item — the behaviour people expect from
            // Notion and which StarterKit does not provide on its own.
            TaskList,
            TaskItem.configure({ nested: true }),
            ListKeymap,
            // The handle follows the caret and stays visible — see BlockHandle.
            BlockHandle.configure({ onActiveBlock: setActiveBlock }),
            Placeholder.configure({
                placeholder: ({ node }) =>
                    (node.type.name === 'heading'
                        ? 'Heading'
                        : "Write, or press '/' for blocks…"),
                showOnlyWhenEditable: true,
                showOnlyCurrent: true,
            }),
            // Layout primitives. Row and cell must be registered alongside the
            // grid or its content expression cannot resolve.
            Container,
            LayoutGrid,
            LayoutRow,
            LayoutCell,
            InlineMedia,
            PhotoGallery,
            WeddingVideoEmbed,
            Embed,
            Callout,
            PullQuote,
            AtAGlance,
            VendorCredits,
            FAQ,
            EnquiryCTA,
        ],
        content: initialContent || '<p></p>',
        editorProps: {
            attributes: {
                class: 'prose prose-stone max-w-none min-h-[460px] px-6 py-6 font-sans text-ink focus:outline-none leading-relaxed text-sm lg:text-base',
            },
            handleKeyDown: (view, event) => {
                if (event.key === '/' && !slashOpen) {
                    const { from } = view.state.selection;
                    const textBefore = view.state.doc.textBetween(Math.max(0, from - 1), from);
                    // Open slash palette if at start of line or after space
                    if (from === 1 || textBefore === '' || textBefore === ' ' || textBefore === '\n') {
                        /*
                          Anchor the palette to the caret.

                          It used to be pinned to the top-left of the editor, so
                          pressing "/" halfway down a long post threw the reader
                          back to the top to find it. `coordsAtPos` is viewport
                          relative, which pairs with `position: fixed` below.
                        */
                        const caret = view.coordsAtPos(from);
                        setSlashAt({ left: caret.left, top: caret.bottom });
                        setSlashOpen(true);
                        setSlashQuery('');
                        setSlashIndex(0);
                    }
                } else if (slashOpen) {
                    if (event.key === 'Escape') {
                        setSlashOpen(false);
                        return true;
                    }
                    if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        setSlashIndex((prev) => prev + 1);
                        return true;
                    }
                    if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        setSlashIndex((prev) => Math.max(0, prev - 1));
                        return true;
                    }
                }
                return false;
            },
        },
        onCreate: ({ editor: ed }) => {
            onUpdate?.({ html: ed.getHTML(), json: ed.getJSON() });
            onTocChange?.(buildOutline(ed));
        },
        onUpdate: ({ editor: ed }) => {
            onUpdate?.({ html: ed.getHTML(), json: ed.getJSON() });
            onTocChange?.(buildOutline(ed));
        },
    });

    useEffect(() => {
        if (editor) onTocChange?.(buildOutline(editor));
    }, [editor, onTocChange]);

    // Word and character counts
    const stats = useMemo(() => {
        if (!editor) return { words: 0, characters: 0, readingTime: 1 };
        const text = editor.state.doc.textContent || '';
        const words = text.split(/\s+/).filter(Boolean).length;
        const characters = text.length;
        const readingTime = Math.max(1, Math.ceil(words / 200));
        return { words, characters, readingTime };
    }, [editor]);

    const handlePicked = (result) => {
        if (!editor) return;
        if (picker === 'inline') {
            const m = result;
            editor.chain().focus().setInlineMedia({
                mediaId: m._id,
                src: m.cdnUrl || m.publicUrl || m.url,
                alt: m.altText || '',
                caption: m.caption || '',
                width: m.width || null,
                height: m.height || null,
                aspectRatio: m.aspectRatio || null,
                dominantColor: m.dominantColor || null,
                blurDataURL: m.blurDataURL || null,
            }).run();
        } else if (picker === 'gallery') {
            const items = (Array.isArray(result) ? result : [result]).map((m) => ({
                src: m.cdnUrl || m.publicUrl || m.url,
                alt: m.altText || '',
                caption: m.caption || '',
                blurDataURL: m.blurDataURL || null,
                dominantColor: m.dominantColor || null,
            }));
            editor.chain().focus().setPhotoGallery({ items }).run();
        } else if (picker === 'video') {
            const m = result;
            const uid = m.video?.streamUid;
            editor.chain().focus().setWeddingVideo({
                src: m.video?.hlsUrl || m.cdnUrl || m.publicUrl || m.url || '',
                streamUid: uid || null,
                provider: uid ? 'stream' : null,
                poster: m.video?.posterUrl || '',
                caption: m.caption || '',
            }).run();
        }
        setPicker(null);
    };

    const openLinkModal = () => {
        const prev = editor?.getAttributes('link').href || '';
        setLinkUrl(prev);
        setLinkModalOpen(true);
    };

    const saveLink = () => {
        if (!editor) return;
        if (!linkUrl.trim()) {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl.trim() }).run();
        }
        setLinkModalOpen(false);
    };

    const removeLink = () => {
        if (editor) {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        }
        setLinkModalOpen(false);
    };


    const handleSelectClient = (client) => {
        if (!editor || !client) return;
        const title = client.title || `${client.groomName || ''} & ${client.brideName || ''}`.trim() || 'Wedding Film';
        editor.chain().focus().setEmbed({
            provider: 'client-showcase',
            url: `/portfolio/${client.slug || client._id}`,
            embedUrl: client.hlsUrl || client.videoUrl || '',
            title: title,
            author: client.venue || 'The Wedding Vachan Studio',
            thumbnail: client.poster || client.videoPoster?.url || client.thumbnail?.url || '',
            clientRef: client._id,
            aspectRatio: '16/9',
            caption: `Client Film: ${title} — ${client.venue || 'Wedding Cinema'}`,
        }).run();
        setClientPickerOpen(false);
    };

    // Slash command definitions
    const slashCommands = useMemo(() => [
        {
            id: 'pullquote', group: 'Blocks',
            title: 'Pull Quote',
            desc: 'Large editorial quote with Playfair Display serif font',
            icon: Quotes,
            action: () => editor.chain().focus().setPullQuote().run(),
        },
        {
            id: 'ataglance', group: 'Blocks',
            title: 'At a Glance',
            desc: 'Venue, season, budget, and mood stats strip',
            icon: Heart,
            action: () => editor.chain().focus().setAtAGlance({
                venue: postMetadata.venue || '',
                season: postMetadata.season || '',
                budget: postMetadata.budget || '',
                style: postMetadata.style || '',
                mood: postMetadata.mood || '',
            }).run(),
        },
        {
            id: 'vendor', group: 'Blocks',
            title: 'Vendor Credits',
            desc: 'Curated list of creative partners and social links',
            icon: Trophy,
            action: () => editor.chain().focus().setVendorCredits().run(),
        },
        {
            id: 'faq', group: 'Blocks',
            title: 'FAQ Section',
            desc: 'Expandable Q&A accordion block with schema markup',
            icon: Question,
            action: () => editor.chain().focus().setFAQ().run(),
        },
        {
            id: 'cta', group: 'Blocks',
            title: 'Enquiry CTA',
            desc: 'High-converting enquiry call to action with custom button',
            icon: Sparkle,
            action: () => editor.chain().focus().setEnquiryCta().run(),
        },
        {
            id: 'client', group: 'Media',
            title: 'Studio Client Film Showcase',
            desc: 'Search and cross-link real client wedding film with poster & venue',
            icon: FilmSlate,
            action: () => setClientPickerOpen(true),
        },
        {
            // One command, not five. `instagram`, `spotify`, `map` and
            // `pinterest` all called this exact same modal — four entries that
            // padded the menu without offering a single different outcome.
            id: 'embed', group: 'Embeds',
            title: 'Embed a link',
            desc: 'YouTube, Vimeo, Instagram, Spotify, Maps, Pinterest — paste any link',
            icon: MonitorPlay,
            action: () => openEmbedModal('link'),
        },
        {
            id: 'showcase', group: 'Media',
            title: 'Studio Film Showcase',
            desc: 'Embed real wedding cinema films directly from Studio Clients',
            icon: VideoCamera,
            action: () => setClientPickerOpen(true),
        },
        {
            id: 'callout', group: 'Blocks',
            title: 'Callout Box',
            desc: 'Note, Pro Tip, Watch Out, vendor credit or couple quote',
            icon: ChatTeardropText,
            action: () => editor.chain().focus().setCallout('note').run(),
        },
        {
            id: 'image', group: 'Media',
            title: 'Studio Image',
            desc: 'Select or upload a high-resolution photo from library',
            icon: ImageSquare,
            action: () => setPicker('inline'),
        },
        {
            id: 'gallery', group: 'Media',
            title: 'Photo Gallery',
            desc: 'Multi-image masonry grid with responsive layout',
            icon: Images,
            action: () => setPicker('gallery'),
        },
        {
            id: 'video', group: 'Media',
            title: 'Video Stream',
            desc: 'Select HLS stream video from media library',
            icon: VideoCamera,
            action: () => setPicker('video'),
        },
        {
            // One command, not three presets. The old two-column / wide-left /
            // three-column entries all produced the same node with a different
            // fixed ratio, and made the author choose a shape before seeing
            // anything. Insert a grid, then reshape it in place.
            id: 'grid', group: 'Layout',
            title: 'Grid',
            desc: 'Rows and columns — add, resize by ratio, put anything in a cell',
            icon: Columns,
            action: () => {
                // insertLayoutGrid refuses inside an existing grid. Without this
                // the refusal was silent — the author clicked Grid and nothing
                // whatsoever happened, which reads as a broken button rather
                // than a deliberate limit.
                if (!editor.chain().focus().insertLayoutGrid().run()) {
                    fireMessage('Grids nest one level deep. Use a Container box inside this cell instead.', 'warning');
                }
            },
        },
        {
            id: 'container', group: 'Layout',
            title: 'Container box',
            desc: 'A styled box — border, fill, shadow — holding any blocks',
            icon: Square,
            action: () => editor.chain().focus().setContainer('card').run(),
        },
        {
            id: 'text', group: 'Basics',
            title: 'Paragraph',
            desc: 'Plain body copy',
            icon: TextT,
            action: () => editor.chain().focus().setParagraph().run(),
        },
        {
            id: 'h2', group: 'Basics',
            title: 'Heading 2',
            desc: 'Major story section title',
            icon: TextH,
            action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        },
        {
            id: 'h3', group: 'Basics',
            title: 'Heading 3',
            desc: 'Sub-section header',
            icon: TextH,
            action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        },
        {
            id: 'h4', group: 'Basics',
            title: 'Heading 4',
            desc: 'Minor sub-heading',
            icon: TextH,
            action: () => editor.chain().focus().toggleHeading({ level: 4 }).run(),
        },
        {
            id: 'bullet', group: 'Lists',
            title: 'Bullet List',
            desc: 'Unordered list of bullet points',
            icon: ListBullets,
            action: () => editor.chain().focus().toggleBulletList().run(),
        },
        {
            id: 'ordered', group: 'Lists',
            title: 'Numbered List',
            desc: 'Ordered steps or ranked points',
            icon: ListNumbers,
            action: () => editor.chain().focus().toggleOrderedList().run(),
        },
        {
            id: 'task', group: 'Lists',
            title: 'Checklist',
            desc: 'Tickable list — planning guides and prep lists',
            icon: CheckSquare,
            action: () => editor.chain().focus().toggleTaskList().run(),
        },
        {
            id: 'quote', group: 'Basics',
            title: 'Quote',
            desc: 'Indented blockquote',
            icon: Quotes,
            action: () => editor.chain().focus().toggleBlockquote().run(),
        },
        {
            id: 'divider', group: 'Basics',
            title: 'Divider Line',
            desc: 'Horizontal rule separating story sections',
            icon: Minus,
            action: () => editor.chain().focus().setHorizontalRule().run(),
        },
    ], [editor, postMetadata]);

    const filteredSlashCommands = useMemo(() => {
        if (!slashQuery.trim()) return slashCommands;
        const q = slashQuery.toLowerCase().trim();
        return slashCommands.filter(
            (c) => c.title.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
        );
    }, [slashCommands, slashQuery]);

    const executeSlashCommand = (cmd) => {
        // Clean up trigger slash text if present
        if (editor) {
            const { from } = editor.state.selection;
            const textBefore = editor.state.doc.textBetween(Math.max(0, from - slashQuery.length - 1), from);
            if (textBefore.startsWith('/')) {
                editor.commands.deleteRange({
                    from: Math.max(1, from - slashQuery.length - 1),
                    to: from,
                });
            }
        }
        cmd.action();
        setSlashOpen(false);
        setSlashQuery('');
    };

    if (!editor) {
        return <div className="min-h-[460px] animate-pulse rounded-xl bg-ground-sunk border border-edge-subtle" />;
    }

    return (
        <div className="relative font-sans">
            {/* Sticky Editorial Toolbar */}
            {/* z-[70]: `sticky` creates a stacking context, so a dropdown inside this
                bar can never paint above a sibling with a higher z-index no matter
                what z-index the dropdown itself has. At z-10 the selection bubble
                menu (z-50) covered the font/size menus and swallowed their clicks.
                Persistent chrome should sit above a transient floating menu. */}
            {/*
              One row that scrolls, never two rows that wrap.

              Wrapping made the bar's height change as the window resized, which
              moved the canvas under the author's cursor mid-edit. A single row
              with overflow keeps the writing surface still, and the heavier
              border and shadow give the chrome enough weight to read as a tool
              rather than a strip of links.
            */}
            <div className="editor-toolbar sticky top-0 z-[70] mb-3 flex flex-nowrap items-center gap-1 overflow-x-auto rounded-xl border border-studio-border bg-studio-card/95 px-2.5 py-2 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_-12px_rgba(28,25,23,0.18)] backdrop-blur-md">
                {/* History */}
                <div className="flex items-center gap-0.5">
                    <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Cmd+Z)">
                        <ArrowCounterClockwise size={15} />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Cmd+Shift+Z)">
                        <ArrowClockwise size={15} />
                    </ToolbarButton>
                </div>

                <span className="mx-1 h-5 w-px shrink-0 bg-studio-border" />

                {/*
                  Typography behind one control.

                  Font, Size, Leading, Tracking and Colour are five labelled
                  dropdowns — measured, they used more of the bar than every
                  other control put together and forced it to scroll. They are
                  worth having and not worth having open: this reveals them in a
                  strip under the bar, only when asked for.
                */}
                <ToolbarButton
                    onClick={() => setTypeOpen((v) => !v)}
                    active={typeOpen}
                    title="Typography — font, size, leading, tracking, colour"
                >
                    <span className="px-0.5 text-[13px] font-semibold leading-none">Aa</span>
                </ToolbarButton>

                <span className="mx-1 h-5 w-px shrink-0 bg-studio-border" />

                {/* Text Styles */}
                <div className="flex items-center gap-0.5">
                    <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
                        <TextB size={15} weight="bold" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
                        <TextItalic size={15} />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
                        <TextUnderline size={15} />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
                        <TextStrikethrough size={15} />
                    </ToolbarButton>
                </div>

                <span className="mx-1 h-5 w-px shrink-0 bg-studio-border" />

                {/*
                  One select instead of four toggles.

                  Heading 2/3/4 and Quote were separate buttons that showed what
                  they DO but never what the current block IS — you had to read
                  which one was highlighted. A select names the block you are in.
                */}
                <select
                    value={
                        editor.isActive('heading', { level: 2 }) ? 'h2'
                            : editor.isActive('heading', { level: 3 }) ? 'h3'
                                : editor.isActive('heading', { level: 4 }) ? 'h4'
                                    : editor.isActive('blockquote') ? 'quote'
                                        : 'p'
                    }
                    onChange={(e) => {
                        const v = e.target.value;
                        const chain = editor.chain().focus();
                        if (editor.isActive('blockquote') && v !== 'quote') chain.toggleBlockquote();
                        if (v === 'p') chain.setParagraph().run();
                        else if (v === 'quote') chain.setParagraph().toggleBlockquote().run();
                        else chain.setHeading({ level: Number(v.slice(1)) }).run();
                    }}
                    title="Block style"
                    className="h-7 shrink-0 cursor-pointer rounded-lg border border-studio-border bg-white px-2 text-xs font-medium text-studio-ink outline-none transition-colors hover:border-studio-borderStrong"
                >
                    <option value="p">Text</option>
                    <option value="h2">Heading 2</option>
                    <option value="h3">Heading 3</option>
                    <option value="h4">Heading 4</option>
                    <option value="quote">Quote</option>
                </select>

                <span className="mx-1 h-5 w-px shrink-0 bg-studio-border" />

                {/* Lists & Quotes */}
                <div className="flex items-center gap-0.5">
                    <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
                        <ListBullets size={16} />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">
                        <ListNumbers size={16} />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider Line">
                        <Minus size={15} />
                    </ToolbarButton>
                    <ToolbarButton onClick={openLinkModal} active={editor.isActive('link')} title="Insert / Edit Link">
                        <LinkSimple size={16} />
                    </ToolbarButton>
                </div>

                <span className="mx-1 h-5 w-px shrink-0 bg-studio-border" />

                {/* Alignments */}
                <div className="flex items-center gap-0.5">
                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">
                        <TextAlignLeft size={15} />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center">
                        <TextAlignCenter size={15} />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">
                        <TextAlignRight size={15} />
                    </ToolbarButton>
                </div>

                <span className="mx-1 h-5 w-px shrink-0 bg-studio-border" />

                {/*
                  ONE insert control.

                  This used to be five media buttons plus an "Insert Block"
                  dropdown that hardcoded eight more entries — all of which
                  already existed in `slashCommands`. Two lists of the same
                  thing drift, which is exactly how the Layout section ended up
                  offering blocks the palette had already dropped.

                  The button now opens the slash palette itself, at the caret.
                  One list, one surface, and the content lands where the cursor
                  is rather than wherever the toolbar happened to be.
                */}
                <div className="ml-auto flex items-center gap-1 pl-1">
                    <button
                        type="button"
                        onClick={() => {
                            const { from } = editor.state.selection;
                            const caret = editor.view.coordsAtPos(from);
                            setSlashAt({ left: caret.left, top: caret.bottom });
                            setSlashOpen(true);
                            setSlashQuery('');
                            setSlashIndex(0);
                            editor.chain().focus().run();
                        }}
                        title="Insert a block (or press / in the text)"
                        className="flex shrink-0 items-center gap-1.5 rounded-lg bg-studio-terracotta px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-studio-terracottaDark"
                    >
                        <Plus size={13} weight="bold" />
                        <span>Insert</span>
                        <kbd className="ml-0.5 hidden rounded-lg border border-white/30 px-1 text-[9px] font-medium text-white/80 sm:inline">/</kbd>
                    </button>
                </div>
            </div>

            {typeOpen && (
                <div className="mb-3 flex flex-wrap items-center gap-1 rounded-xl border border-studio-border bg-white px-2.5 py-2 shadow-sm animate-in fade-in slide-in-from-top-1 duration-150">
                    <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-studio-inkMuted">
                        Type
                    </span>
                    <TypographyControls editor={editor} />
                </div>
            )}

            {/* Editor Canvas */}
            <div className="bg-transparent relative min-h-[460px]">
                {/* Floating Selection Bubble Menu (Cursor Formatting Pill) */}
                {editor && (
                    <BubbleMenu
                        editor={editor}
                        tippyOptions={{ duration: 150, placement: 'top', animation: 'shift-away' }}
                        shouldShow={({ editor: ed, state }) => {
                            if (!ed || !ed.isEditable) return false;
                            const { selection } = state;
                            // An atom node (image, gallery, embed) is a non-empty
                            // selection, so `from !== to` alone showed the TEXT
                            // menu over a selected image — offering headings and
                            // bold for something that has no text, and covering
                            // the node's own alignment controls.
                            if (selection instanceof NodeSelection) return false;
                            return selection.from !== selection.to;
                        }}
                        className="flex items-center gap-1 rounded-xl border border-ink bg-ink/95 px-2 py-1.5 text-white shadow-2xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-100"
                    >
                        {!bubbleLinkOpen ? (
                            <>
                                {/* Heading level pills */}
                                <div className="flex items-center gap-0.5 pr-1 border-r border-ink">
                                    <button
                                        type="button"
                                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                                        className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                            editor.isActive('heading', { level: 2 }) ? 'bg-accent text-white' : 'text-stone-300 hover:bg-ink'
                                        }`}
                                        title="Heading 2"
                                    >
                                        H2
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                                        className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                            editor.isActive('heading', { level: 3 }) ? 'bg-accent text-white' : 'text-stone-300 hover:bg-ink'
                                        }`}
                                        title="Heading 3"
                                    >
                                        H3
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => editor.chain().focus().setParagraph().run()}
                                        className={`px-1.5 py-0.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                            editor.isActive('paragraph') && !editor.isActive('heading') ? 'bg-accent text-white' : 'text-stone-300 hover:bg-ink'
                                        }`}
                                        title="Paragraph Text"
                                    >
                                        P
                                    </button>
                                </div>

                                {/* Core inline format styles */}
                                <div className="flex items-center gap-0.5 px-1 border-r border-ink">
                                    <button
                                        type="button"
                                        onClick={() => editor.chain().focus().toggleBold().run()}
                                        className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                            editor.isActive('bold') ? 'bg-accent text-white' : 'text-stone-300 hover:bg-ink'
                                        }`}
                                        title="Bold (Cmd+B)"
                                    >
                                        <TextB size={14} weight="bold" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => editor.chain().focus().toggleItalic().run()}
                                        className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                            editor.isActive('italic') ? 'bg-accent text-white' : 'text-stone-300 hover:bg-ink'
                                        }`}
                                        title="Italic (Cmd+I)"
                                    >
                                        <TextItalic size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                                        className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                            editor.isActive('underline') ? 'bg-accent text-white' : 'text-stone-300 hover:bg-ink'
                                        }`}
                                        title="Underline (Cmd+U)"
                                    >
                                        <TextUnderline size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => editor.chain().focus().toggleStrike().run()}
                                        className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                            editor.isActive('strike') ? 'bg-accent text-white' : 'text-stone-300 hover:bg-ink'
                                        }`}
                                        title="Strikethrough"
                                    >
                                        <TextStrikethrough size={14} />
                                    </button>
                                </div>

                                {/* Lists & Quotes */}
                                <div className="flex items-center gap-0.5 px-1 border-r border-ink">
                                    <button
                                        type="button"
                                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                                        className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                            editor.isActive('bulletList') ? 'bg-accent text-white' : 'text-stone-300 hover:bg-ink'
                                        }`}
                                        title="Bullet List"
                                    >
                                        <ListBullets size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                        className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                            editor.isActive('orderedList') ? 'bg-accent text-white' : 'text-stone-300 hover:bg-ink'
                                        }`}
                                        title="Numbered List"
                                    >
                                        <ListNumbers size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                                        className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                            editor.isActive('blockquote') ? 'bg-accent text-white' : 'text-stone-300 hover:bg-ink'
                                        }`}
                                        title="Quote"
                                    >
                                        <Quotes size={14} />
                                    </button>
                                </div>

                                {/* Link & Alignment */}
                                <div className="flex items-center gap-0.5 pl-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const prev = editor.getAttributes('link').href || '';
                                            setBubbleLinkUrl(prev);
                                            setBubbleLinkOpen(true);
                                        }}
                                        className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                            editor.isActive('link') ? 'bg-accent text-white' : 'text-stone-300 hover:bg-ink'
                                        }`}
                                        title="Link (Cmd+K)"
                                    >
                                        <LinkSimple size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                                        className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                            editor.isActive({ textAlign: 'left' }) ? 'bg-accent text-white' : 'text-stone-300 hover:bg-ink'
                                        }`}
                                        title="Align Left"
                                    >
                                        <TextAlignLeft size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                                        className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                            editor.isActive({ textAlign: 'center' }) ? 'bg-accent text-white' : 'text-stone-300 hover:bg-ink'
                                        }`}
                                        title="Align Center"
                                    >
                                        <TextAlignCenter size={14} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-1.5 p-0.5">
                                <input
                                    type="url"
                                    value={bubbleLinkUrl}
                                    onChange={(e) => setBubbleLinkUrl(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (bubbleLinkUrl.trim()) {
                                                editor.chain().focus().extendMarkRange('link').setLink({ href: bubbleLinkUrl.trim() }).run();
                                            } else {
                                                editor.chain().focus().unsetLink().run();
                                            }
                                            setBubbleLinkOpen(false);
                                        } else if (e.key === 'Escape') {
                                            setBubbleLinkOpen(false);
                                        }
                                    }}
                                    placeholder="Paste link (https://...)"
                                    className="w-52 bg-ink text-white text-xs px-2.5 py-1 rounded-lg border border-ink focus:outline-none focus:border-accent"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (bubbleLinkUrl.trim()) {
                                            editor.chain().focus().extendMarkRange('link').setLink({ href: bubbleLinkUrl.trim() }).run();
                                        } else {
                                            editor.chain().focus().unsetLink().run();
                                        }
                                        setBubbleLinkOpen(false);
                                    }}
                                    className="p-1 rounded-lg bg-accent text-white hover:bg-accent-hover text-xs font-semibold cursor-pointer"
                                    title="Apply link"
                                >
                                    <Check size={13} weight="bold" />
                                </button>
                                {editor.isActive('link') && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            editor.chain().focus().unsetLink().run();
                                            setBubbleLinkOpen(false);
                                        }}
                                        className="p-1 rounded-lg bg-ink text-rose-400 hover:bg-rose-950/60 text-xs cursor-pointer"
                                        title="Remove link"
                                    >
                                        <Trash size={13} />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setBubbleLinkOpen(false)}
                                    className="p-1 rounded-lg bg-ink text-ink-muted hover:text-white text-xs cursor-pointer"
                                    title="Cancel"
                                >
                                    <X size={13} />
                                </button>
                            </div>
                        )}
                    </BubbleMenu>
                )}
                {/* ref is the measuring frame for the hover gutter; pl-12 reserves
                    the gutter lane so the handle never overlaps the text */}
                <div className="relative pl-12">
                    <EditorContent editor={editor} />
                    <BlockGutter editor={editor} active={activeBlock} />
                </div>

                {/* Floating Slash Command Palette Modal/Popover */}
                {slashOpen && (
                    <div
                        className="fixed z-[90] w-80 rounded-xl border border-edge-subtle bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
                        style={slashAt
                            ? {
                                // Kept inside the window: near the right edge or
                                // the bottom of the screen the palette would
                                // otherwise open half out of view.
                                left: Math.min(slashAt.left, (typeof window !== 'undefined' ? window.innerWidth : 1440) - 340),
                                top: Math.min(slashAt.top + 8, (typeof window !== 'undefined' ? window.innerHeight : 900) - 380),
                            }
                            : { left: 24, top: 64 }}
                    >
                        <div className="flex items-center gap-2 px-2.5 py-2 border-b border-edge-subtle mb-1.5">
                            <MagnifyingGlass size={15} className="text-ink-muted" />
                            <input
                                type="text"
                                value={slashQuery}
                                onChange={(e) => {
                                    // The keypress that opens this menu also lands
                                    // in the box, so the query started life as "/"
                                    // and every command was filtered out — nothing
                                    // matches a literal slash. Stripping it here
                                    // also makes executeSlashCommand's
                                    // `slashQuery.length + 1` cleanup correct, which
                                    // was otherwise deleting one character too many
                                    // before the trigger.
                                    setSlashQuery(e.target.value.replace(/^\/+/, ''));
                                    setSlashIndex(0);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const cmd = filteredSlashCommands[slashIndex % (filteredSlashCommands.length || 1)];
                                        if (cmd) executeSlashCommand(cmd);
                                    }
                                }}
                                placeholder="Type to filter blocks..."
                                className="w-full text-xs text-ink placeholder:text-ink-muted focus:outline-none bg-transparent font-medium"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setSlashOpen(false)}
                                className="text-[10px] text-ink-muted hover:text-ink-secondary px-1 py-0.5 rounded-lg bg-ground-sunk"
                            >
                                Esc
                            </button>
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-0.5 pr-1">
                            {filteredSlashCommands.length === 0 ? (
                                <div className="py-4 text-center text-xs text-ink-muted">
                                    No blocks matching {slashQuery}
                                </div>
                            ) : (
                                /* Grouped, but the keyboard index still runs across
                                   the flat filtered list so arrow keys move through
                                   headings without getting stuck on them. */
                                Object.entries(
                                    filteredSlashCommands.reduce((acc, cmd) => {
                                        const g = cmd.group || 'Blocks';
                                        (acc[g] ||= []).push(cmd);
                                        return acc;
                                    }, {}),
                                ).map(([group, cmds]) => (
                                    <div key={group}>
                                        <p className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                                            {group}
                                        </p>
                                        {cmds.map((cmd) => {
                                            const Icon = cmd.icon;
                                            const idx = filteredSlashCommands.indexOf(cmd);
                                            const isSelected = (slashIndex % filteredSlashCommands.length) === idx;
                                            return (
                                                <button
                                                    key={cmd.id}
                                                    type="button"
                                                    onClick={() => executeSlashCommand(cmd)}
                                                    onMouseEnter={() => setSlashIndex(idx)}
                                                    className={`w-full flex items-center gap-3 rounded-xl px-2.5 py-2 text-left text-xs transition-colors cursor-pointer ${isSelected ? 'bg-accent/10 text-accent-ink' : 'hover:bg-ground text-ink'
                                                        }`}
                                                >
                                                    <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-white shadow-sm text-accent-ink' : 'bg-ground-sunk text-ink-secondary'}`}>
                                                        <Icon size={16} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-semibold truncate">{cmd.title}</div>
                                                        <div className="text-[10px] text-ink-muted truncate">{cmd.desc}</div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Editorial Footer Bar (Word Count & Metrics) */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-edge-subtle bg-ground/70 px-5 py-2.5 text-xs text-ink-muted font-sans">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                        <Article size={14} className="text-ink-muted" />
                        <span className="font-semibold text-ink-secondary tabular-nums">{stats.words}</span> words
                    </span>
                    <span className="text-ink-muted">·</span>
                    <span>
                        <span className="font-semibold text-ink-secondary tabular-nums">{stats.characters}</span> characters
                    </span>
                    <span className="text-ink-muted">·</span>
                    <span className="flex items-center gap-1 tabular-nums">
                        <Clock size={13} className="text-ink-muted" />
                        {stats.readingTime} min read
                    </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-ink-muted font-medium">
                    <span>
                        Type <kbd className="px-1.5 py-0.5 rounded-lg bg-ground-sunk text-ink-secondary text-[10px] font-mono">/</kbd> for block commands
                    </span>
                </div>
            </div>

            {/* Studio Media Picker */}
            <MediaPickerModal
                open={picker !== null}
                onClose={() => setPicker(null)}
                onSelect={handlePicked}
                multiple={picker === 'gallery'}
                ownerType="Blog"
                typeFilter={picker === 'video' ? 'Video' : 'Image'}
            />

            {/* Link Dialog */}
            <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
                <DialogContent className="sm:max-w-md font-sans">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold text-ink">Insert Hyperlink</DialogTitle>
                        <DialogDescription className="text-xs text-ink-muted">
                            Enter the destination URL for the highlighted text.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <input
                            type="url"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full px-3 py-2 rounded-xl border border-edge-subtle bg-ground text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    saveLink();
                                }
                            }}
                        />
                    </div>
                    <DialogFooter className="gap-2">
                        {editor.isActive('link') && (
                            <Button variant="danger" size="sm" onClick={removeLink}>
                                Unlink
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => setLinkModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" size="sm" onClick={saveLink}>
                            Save Link
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Universal Multi-Provider & Studio Showcase Embed Modal */}
            <EmbedModal
                open={embedModalOpen}
                onOpenChange={setEmbedModalOpen}
                defaultTab={embedDefaultTab}
                onInsert={(attrs) => {
                    editor.chain().focus().setEmbed(attrs).run();
                }}
            />

            {/* Dedicated Studio Client Showcase Picker Modal */}
            <ClientShowcasePickerModal
                isOpen={clientPickerOpen}
                onClose={() => setClientPickerOpen(false)}
                onSelectClient={handleSelectClient}
            />
        </div>
    );
}
