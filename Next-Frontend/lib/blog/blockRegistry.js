/**
 * Block Registry — maps Tiptap AST node types to React render components.
 *
 * Adding a new block:
 *   1. Create a Tiptap node extension (editor side)
 *   2. Create a React component in lib/blog/blocks/
 *   3. Add one line to this registry
 *
 * The renderer iterates the JSON AST and maps each node through this registry.
 */

import ParagraphBlock from './blocks/ParagraphBlock';
import HeadingBlock from './blocks/HeadingBlock';
import BulletListBlock from './blocks/BulletListBlock';
import { TaskListBlock, TaskItemBlock } from './blocks/TaskListBlock';
import HardBreakBlock from './blocks/HardBreakBlock';
import ContainerBlock from './blocks/ContainerBlock';
import { LayoutGridBlock, LayoutRowBlock, LayoutCellBlock } from './blocks/LayoutGridBlock';
import OrderedListBlock from './blocks/OrderedListBlock';
import BlockquoteBlock from './blocks/BlockquoteBlock';
import DividerBlock from './blocks/DividerBlock';
import InlineFigureBlock from './blocks/InlineFigureBlock';
import PhotoGalleryBlock from './blocks/PhotoGalleryBlock';
import VideoBlock from './blocks/VideoBlock';
import EmbedBlock from './blocks/EmbedBlock';
import CalloutBlock from './blocks/CalloutBlock';
import PullQuoteBlock from './blocks/PullQuoteBlock';
import AtAGlanceBlock from './blocks/AtAGlanceBlock';
import VendorCreditsBlock from './blocks/VendorCreditsBlock';
import FAQBlock from './blocks/FAQBlock';
import EnquiryCtaBlock from './blocks/EnquiryCtaBlock';
import ListItemBlock from './blocks/ListItemBlock';
import CodeBlockBlock from './blocks/CodeBlockBlock';
import TableBlock from './blocks/TableBlock';

/**
 * Registry: { [tiptapNodeType]: ReactComponent }
 * Each component receives { node, children, template, post } props.
 */
const blockRegistry = {
  // ── Core text blocks ──
  paragraph:        ParagraphBlock,
  heading:          HeadingBlock,
  bulletList:       BulletListBlock,
  orderedList:      OrderedListBlock,
  listItem:         ListItemBlock,
  taskList:         TaskListBlock,
  taskItem:         TaskItemBlock,
  hardBreak:        HardBreakBlock,
  container:        ContainerBlock,
  layoutGrid:       LayoutGridBlock,
  layoutRow:        LayoutRowBlock,
  layoutCell:       LayoutCellBlock,
  blockquote:       BlockquoteBlock,
  horizontalRule:   DividerBlock,
  codeBlock:        CodeBlockBlock,

  // ── Media blocks ──
  // The editor emits `inlineMedia` (extensions/InlineMedia.jsx). `image` is kept
  // for Tiptap's built-in node and any legacy content that used it.
  inlineMedia:      InlineFigureBlock,
  image:            InlineFigureBlock,
  photoGallery:     PhotoGalleryBlock,
  weddingVideoEmbed: VideoBlock,
  embed:            EmbedBlock,

  // ── Editorial blocks ──
  callout:          CalloutBlock,
  pullQuote:        PullQuoteBlock,

  // ── Wedding-specific blocks ──
  atAGlance:        AtAGlanceBlock,
  vendorCredits:    VendorCreditsBlock,
  faq:              FAQBlock,
  enquiryCta:       EnquiryCtaBlock,

  // ── Data blocks ──
  table:            TableBlock,
};

export default blockRegistry;

/**
 * Render a single AST node using the registry.
 * Returns null for unknown types (graceful degradation).
 */
export function getBlockComponent(nodeType) {
  return blockRegistry[nodeType] || null;
}
