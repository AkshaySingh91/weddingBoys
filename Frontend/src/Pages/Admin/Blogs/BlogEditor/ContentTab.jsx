import { EditorContent } from '@tiptap/react';
import { Sparkles, X, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { useState } from 'react';

function Content({ formData, handleChange, weddingCategories, editor, darkMode, removeTip, setFormData }) {
    const [tipInput, setTipInput] = useState('');

    const addTip = (e) => {
        if (e.key === 'Enter' && tipInput.trim()) {
            e.preventDefault();
            setFormData(prev => ({
                ...prev,
                tips: [...prev.tips, tipInput.trim()]
            }));
            setTipInput('');
        }
    };
    // Function to handle image uploads within the editor
    const handleEditorImageUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                // In a real app, you'd upload to your server/AWS here
                // This is a mock implementation
                const reader = new FileReader();
                reader.onload = (e) => {
                    const base64 = e.target.result;
                    if (editor) {
                        editor.chain().focus().setImage({ src: base64 }).run();
                    }
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Image upload failed:', error);
                alert('Image upload failed. Please try again.');
            }
        };

        input.click();
    };
    return (
        <div className="space-y-6">
            {/* Title and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                        Title *
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className={`w-full px-4 py-3 rounded-lg border transition-colors ${darkMode
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-400'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                            } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                        placeholder="e.g., 10 Magical Romantic Wedding Ideas for 2024"
                    />
                    <p className={`text-xs mt-1 ${formData.title.length >= 30 && formData.title.length <= 60
                        ? 'text-green-600'
                        : 'text-red-500'
                        }`}>
                        {formData.title.length}/60 characters
                    </p>
                </div>

                <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                        Category *
                    </label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className={`w-full px-4 py-3 rounded-lg border transition-colors ${darkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                            } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                    >
                        {weddingCategories.map(cat => (
                            <option key={cat.value} value={cat.value}>
                                {cat.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Slug */}
            <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                    URL Slug *
                </label>
                <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                    placeholder="e.g., magical-romantic-wedding-ideas-2024"
                />
            </div>

            {/* Content Editor */}
            <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Content * ({formData.readingTime} min read)
                </label>

                {/* Enhanced Toolbar with more options */}
                {editor && (
                    <div className={`flex flex-wrap gap-2 mb-2 p-3 rounded-t-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        {/* Text Formatting */}
                        <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleBold().run()}
                                className={`p-2 rounded ${editor.isActive('bold') ? 'bg-indigo-600 text-white' : darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'}`}
                            >
                                <span className="font-bold">B</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleItalic().run()}
                                className={`p-2 rounded ${editor.isActive('italic') ? 'bg-indigo-600 text-white' : darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'}`}
                            >
                                <span className="italic">I</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleUnderline().run()}
                                className={`p-2 rounded ${editor.isActive('underline') ? 'bg-indigo-600 text-white' : darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'}`}
                            >
                                <span className="underline">U</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleStrike().run()}
                                className={`p-2 rounded ${editor.isActive('strike') ? 'bg-indigo-600 text-white' : darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'}`}
                            >
                                <span className="line-through">S</span>
                            </button>
                        </div>

                        {/* Headings and Blocks */}
                        <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                                className={`p-2 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-indigo-600 text-white' : darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'}`}
                            >
                                H1
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                                className={`p-2 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-indigo-600 text-white' : darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'}`}
                            >
                                H2
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                                className={`p-2 rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-indigo-600 text-white' : darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'}`}
                            >
                                H3
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                                className={`p-2 rounded ${editor.isActive('blockquote') ? 'bg-indigo-600 text-white' : darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'}`}>
                                ❝
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                                className={`p-2 rounded ${darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'}`}
                            >
                                ―
                            </button>
                        </div>

                        {/* Lists */}
                        <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleBulletList().run()}
                                className={`p-2 rounded ${editor.isActive('bulletList') ? 'bg-indigo-600 text-white' : darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'}`}
                            >
                                • List
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                className={`p-2 rounded ${editor.isActive('orderedList') ? 'bg-indigo-600 text-white' : darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'}`}
                            >
                                1. List
                            </button>
                        </div>

                        {/* Alignment */}
                        <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                                className={`p-2 rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-indigo-600 text-white' : darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'}`}
                            >
                                <AlignLeft size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                                className={`p-2 rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-indigo-600 text-white' : darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'}`}
                            >
                                <AlignCenter size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                                className={`p-2 rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-indigo-600 text-white' : darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'}`}
                            >
                                <AlignRight size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                                className={`p-2 rounded ${editor.isActive({ textAlign: 'justify' }) ? 'bg-indigo-600 text-white' : darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'}`}
                            >
                                <AlignJustify size={16} />
                            </button>
                        </div>

                        {/* Media and Code */}
                        <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={handleEditorImageUpload}
                                className={`p-2 rounded ${darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'}`}
                            >
                                Image
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const url = window.prompt('Enter link URL');
                                    if (url) editor.chain().focus().setLink({ href: url }).run();
                                }}
                                className={`p-2 rounded ${editor.isActive('link') ? 'bg-indigo-600 text-white' : darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'}`}
                            >
                                Link
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().unsetLink().run()}
                                className={`p-2 rounded ${darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'}`}
                            >
                                Unlink
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleCode().run()}
                                className={`p-2 rounded ${editor.isActive('code') ? 'bg-indigo-600 text-white' : darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'}`}
                            >
                                {'<>'}
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                                className={`p-2 rounded ${editor.isActive('codeBlock') ? 'bg-indigo-600 text-white' : darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'}`}
                            >
                                Code Block
                            </button>
                        </div>

                        {/* Tables */}
                        <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                                className={`p-2 rounded ${darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'}`}
                            >
                                Table
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().addColumnAfter().run()}
                                disabled={!editor.can().addColumnAfter()}
                                className={`p-2 rounded ${darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'}`}
                            >
                                +Col
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().addRowAfter().run()}
                                disabled={!editor.can().addRowAfter()}
                                className={`p-2 rounded ${darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'}`}
                            >
                                +Row
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().deleteTable().run()}
                                disabled={!editor.can().deleteTable()}
                                className={`p-2 rounded ${darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'}`}
                            >
                                Del Table
                            </button>
                        </div>

                        {/* History */}
                        <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().undo().run()}
                                disabled={!editor.can().undo()}
                                className={`p-2 rounded ${darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'}`}
                            >
                                ↺ Undo
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().redo().run()}
                                disabled={!editor.can().redo()}
                                className={`p-2 rounded ${darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'}`}
                            >
                                ↻ Redo
                            </button>
                        </div>
                    </div>
                )}

                <div className={`border rounded-b-lg overflow-hidden ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                    {editor ? (
                        <EditorContent editor={editor} />
                    ) : (
                        <div className="p-4 text-gray-400">Loading editor...</div>
                    )}
                </div>
            </div>

            {/* Quick Tips Section */}
            <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                    Quick Tips (Optional)
                </label>
                <div className="space-y-2">
                    {formData.tips.map((tip, index) => (
                        <div key={index} className={`flex items-center p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'
                            }`}>
                            <Sparkles size={16} className="text-yellow-500 mr-2" />
                            <span className={`flex-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                {tip}
                            </span>
                            <button
                                type="button"
                                onClick={() => removeTip(index)}
                                className="text-red-500 hover:text-red-700"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                    <input
                        type="text"
                        value={tipInput}
                        onChange={(e) => setTipInput(e.target.value)}
                        onKeyDown={addTip}
                        className={`w-full px-4 py-3 rounded-lg border transition-colors ${darkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                            } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                        placeholder="Add a quick tip (press Enter)"
                    />
                </div>
            </div>
        </div>
    )
}

export default Content
