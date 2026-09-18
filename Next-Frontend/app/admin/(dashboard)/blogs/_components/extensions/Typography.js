import { Extension } from '@tiptap/core';

/**
 * Font size and letter spacing, as textStyle attributes.
 *
 * Tiptap ships FontFamily, Color and Highlight but nothing for size or
 * tracking, so they are added here onto the existing `textStyle` mark rather
 * than as new marks — that way a run of text carries one mark with several
 * attributes instead of three nested spans, and clearing one does not disturb
 * the others.
 */
export const FontSize = Extension.create({
    name: 'fontSize',

    addOptions() {
        return { types: ['textStyle'] };
    },

    addGlobalAttributes() {
        return [{
            types: this.options.types,
            attributes: {
                fontSize: {
                    default: null,
                    parseHTML: (el) => el.style.fontSize || null,
                    renderHTML: (attrs) =>
                        (attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {}),
                },
            },
        }];
    },

    addCommands() {
        return {
            setFontSize: (size) => ({ chain }) =>
                chain().setMark('textStyle', { fontSize: size }).run(),
            unsetFontSize: () => ({ chain }) =>
                chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
        };
    },
});

export const LetterSpacing = Extension.create({
    name: 'letterSpacing',

    addOptions() {
        return { types: ['textStyle'] };
    },

    addGlobalAttributes() {
        return [{
            types: this.options.types,
            attributes: {
                letterSpacing: {
                    default: null,
                    parseHTML: (el) => el.style.letterSpacing || null,
                    renderHTML: (attrs) =>
                        (attrs.letterSpacing ? { style: `letter-spacing: ${attrs.letterSpacing}` } : {}),
                },
            },
        }];
    },

    addCommands() {
        return {
            setLetterSpacing: (value) => ({ chain }) =>
                chain().setMark('textStyle', { letterSpacing: value }).run(),
            unsetLetterSpacing: () => ({ chain }) =>
                chain().setMark('textStyle', { letterSpacing: null }).removeEmptyTextStyle().run(),
        };
    },
});

/**
 * Line height, as a BLOCK attribute.
 *
 * Deliberately not a mark: line-height applies to a whole paragraph or list
 * item, and as a mark it would only affect the selected characters, producing
 * uneven leading within one paragraph — a classic rich-text bug.
 */
export const LineHeight = Extension.create({
    name: 'lineHeight',

    addOptions() {
        return { types: ['paragraph', 'heading', 'listItem'] };
    },

    addGlobalAttributes() {
        return [{
            types: this.options.types,
            attributes: {
                lineHeight: {
                    default: null,
                    parseHTML: (el) => el.style.lineHeight || null,
                    renderHTML: (attrs) =>
                        (attrs.lineHeight ? { style: `line-height: ${attrs.lineHeight}` } : {}),
                },
            },
        }];
    },

    addCommands() {
        return {
            setLineHeight: (value) => ({ commands }) =>
                this.options.types
                    .map((type) => commands.updateAttributes(type, { lineHeight: value }))
                    .some(Boolean),
            unsetLineHeight: () => ({ commands }) =>
                this.options.types
                    .map((type) => commands.resetAttributes(type, 'lineHeight'))
                    .some(Boolean),
        };
    },
});
