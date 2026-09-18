/**
 * ParagraphBlock — renders <p> with studio typography.
 */
import { cleanLineHeight } from '@/app/admin/(dashboard)/blogs/_components/typographyTokens.js';

export default function ParagraphBlock({ node, children, template }) {
  const align = node.attrs?.textAlign || 'left';

  /*
    Size and leading are kept apart on purpose. They used to be one class, so
    setting a custom line height dropped the size with it — a photo-essay
    paragraph silently fell from text-lg back to text-base the moment an author
    touched leading.
  */
  const sizeClass = template === 'photo-essay' ? 'text-lg' : 'text-base sm:text-[17px]';
  const defaultLeading = template === 'photo-essay' ? 'leading-relaxed' : 'leading-[1.8]';

  /*
    Line height is a block attribute (see the editor's Typography extension), so
    it is applied here rather than as an inline mark — as a mark it would only
    affect the selected characters and give one paragraph uneven leading.

    It is clamped on the way out. A caption pair saved with `0.5` rendered 17px
    text into 8.5px lines and the two captions printed over each other on the
    live page. Clamping at render means those posts read correctly now, without
    a migration and without waiting for anyone to re-edit them.
  */
  const lineHeight = cleanLineHeight(node.attrs?.lineHeight);

  return (
    <p
      style={lineHeight ? { lineHeight } : undefined}
      className={`${sizeClass} ${lineHeight ? '' : defaultLeading} text-studio-ink/90 font-sans ${
        align === 'center' ? 'text-center' :
        align === 'right' ? 'text-right' :
        align === 'justify' ? 'text-justify' : ''
      }`}
    >
      {children}
    </p>
  );
}
