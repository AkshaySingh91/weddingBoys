import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Upload, X, Eye, Save, Calendar, Tag, Image as Img,
    Smartphone, Monitor, Tablet, Heart, Star,
    Camera, MapPin, Clock, Users, Palette,
    Sparkles, Quote, Layout, TypeIcon as Type,
    Moon, Sun, Zap, Target, TrendingUp, Hash
} from 'lucide-react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight'
import Content from './ContentTab';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import SeoTab from './SeoTab';
import MediaTab from './MediaTab';
import WeddingTab from './WeddingTab';
import AdvanceTab from './AdvanceTab';
import BlogPreview from './BlogPreview';

const lowlight = createLowlight(common)

const BlogEditor = ({ initialData, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState(initialData || {
        title: 'A Dreamy Garden Wedding in Spring',
        slug: 'dreamy-garden-wedding-spring',
        content: `
            <p>Step into the romantic world of Lily and Jack's spring garden wedding. Set against a backdrop of blooming florals, soft pastel hues, and twinkling fairy lights, their celebration felt like a scene straight out of a fairytale.</p>
            <h2>The Venue</h2>
            <p>The couple chose Rosewood Gardens, known for its lush greenery and classic stone pathways, which made the perfect setting for their vows.</p>
            <h2>Wedding Highlights</h2>
            <ul>
            <li>Floral arch with blush and ivory roses</li>
            <li>Live acoustic ceremony music</li>
            <li>Organic farm-to-table dinner under the stars</li>
            </ul>
        `,
        excerpt: `Step into Lily & Jack's dreamy spring garden wedding filled with blush florals, fairy lights, and timeless romance.`,
        featuredImage: '',
        tags: ['spring', 'garden', 'romantic', 'outdoor'],
        metaTitle: 'Romantic Garden Wedding in Spring – Lily & Jack',
        metaDescription: `Experience the romance of a spring garden wedding with soft florals, elegant details, and dreamy moments from Lily & Jack's big day.`,
        isPublished: true,
        category: 'wedding-planning',
        publishDate: '2025-06-20T10:00:00Z',
        readingTime: 4,
        seoScore: 92,
        mood: 'romantic',
        season: 'spring',
        budget: '30-50L',
        venue: 'Rosewood Gardens, California',
        style: 'Classic, Garden',
        gallery: [
        ],
        testimonial: 'It was everything we dreamed of and more. The team brought our vision to life perfectly – Lily & Jack',
        tips: [
            'Choose a venue with built-in floral charm to save on décor.',
            'Consider acoustic live music for an intimate ceremony vibe.',
            'Always have a rain backup for outdoor events.'
        ],
        callToAction: 'Planning your spring wedding? Let us help you create your dream day.',
        socialTitle: `Inside Lily & Jack's Romantic Garden Wedding 🌸`,
        socialDescription: 'Blush florals, fairy lights, and timeless love — see how this couple created the perfect spring wedding day.'
    });

    const [tagInput, setTagInput] = useState('');
    const [currentView, setCurrentView] = useState('desktop');
    const [darkMode, setDarkMode] = useState(false);
    const [activeTab, setActiveTab] = useState('content');
    const [showPreview, setShowPreview] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState([]);
    const [seoAnalysis, setSeoAnalysis] = useState({});

    const fileInputRef = useRef(null);
    const galleryInputRef = useRef(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [featuredImage, setFeatureImage] = useState(null);
    const [galleryImages, setGalleryImages] = useState([]);

    const weddingCategories = [
        { value: 'wedding-planning', label: '💒 Wedding Planning', color: 'bg-pink-100 text-pink-800' },
        { value: 'bridal-fashion', label: '👗 Bridal Fashion', color: 'bg-purple-100 text-purple-800' },
        { value: 'photography', label: '📸 Photography', color: 'bg-blue-100 text-blue-800' },
        { value: 'decor', label: '🌸 Decor & Styling', color: 'bg-green-100 text-green-800' },
        { value: 'venues', label: '🏰 Venues', color: 'bg-yellow-100 text-yellow-800' },
        { value: 'real-weddings', label: '💕 Real Weddings', color: 'bg-red-100 text-red-800' },
        { value: 'tips', label: '💡 Tips & Advice', color: 'bg-indigo-100 text-indigo-800' },
        { value: 'trends', label: '✨ Trends', color: 'bg-teal-100 text-teal-800' }
    ];

    const weddingMoods = [
        { value: 'romantic', label: '💕 Romantic', emoji: '💕' },
        { value: 'rustic', label: '🌾 Rustic', emoji: '🌾' },
        { value: 'modern', label: '✨ Modern', emoji: '✨' },
        { value: 'vintage', label: '🌹 Vintage', emoji: '🌹' },
        { value: 'bohemian', label: '🌸 Bohemian', emoji: '🌸' },
        { value: 'elegant', label: '👑 Elegant', emoji: '👑' },
        { value: 'fun', label: '🎉 Fun & Playful', emoji: '🎉' },
        { value: 'intimate', label: '🕯️ Intimate', emoji: '🕯️' }
    ];

    const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
    const budgetRanges = ['Under $10K', '$10K-$25K', '$25K-$50K', '$50K-$100K', '$100K+'];

    // Calculate reading time
    useEffect(() => {
        if (formData.content) {
            const wordCount = formData.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
            const readingTime = Math.ceil(wordCount / 200);
            setFormData(prev => ({ ...prev, readingTime }));
        }
    }, [formData.content]);

    // SEO Analysis
    useEffect(() => {
        const analyzeContent = () => {
            let score = 0;
            const analysis = {};

            // Title length
            if (formData.title.length >= 30 && formData.title.length <= 60) {
                score += 20;
                analysis.title = { status: 'good', message: 'Title length is optimal' };
            } else {
                analysis.title = { status: 'warning', message: 'Title should be 30-60 characters' };
            }

            // Meta description
            if (formData.excerpt.length >= 140 && formData.excerpt.length <= 160) {
                score += 20;
                analysis.metaDesc = { status: 'good', message: 'Meta description length is perfect' };
            } else {
                analysis.metaDesc = { status: 'warning', message: 'Meta description should be 140-160 characters' };
            }

            // Content length
            const wordCount = formData.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
            if (wordCount >= 800) {
                score += 20;
                analysis.content = { status: 'good', message: 'Content length is good for SEO' };
            } else {
                analysis.content = { status: 'warning', message: 'Content should be at least 800 words' };
            }

            // Tags
            if (formData.tags.length >= 3 && formData.tags.length <= 8) {
                score += 20;
                analysis.tags = { status: 'good', message: 'Good number of tags' };
            } else {
                analysis.tags = { status: 'warning', message: 'Use 3-8 relevant tags' };
            }

            // Featured image
            if (formData.featuredImage) {
                score += 20;
                analysis.image = { status: 'good', message: 'Featured image added' };
            } else {
                analysis.image = { status: 'warning', message: 'Add a featured image' };
            }

            setFormData(prev => ({ ...prev, seoScore: score }));
            setSeoAnalysis(analysis);
        };

        analyzeContent();
    }, [formData.title, formData.excerpt, formData.content, formData.tags, formData.featuredImage]);

    // Generate AI suggestions based on content
    useEffect(() => {
        if (formData.title && formData.category) {
            const suggestions = generateAISuggestions(formData.title, formData.category);
            setAiSuggestions(suggestions);
        }
    }, [formData.title, formData.category]);

    const generateAISuggestions = (title, category) => {
        const suggestions = [];

        if (category === 'wedding-planning') {
            suggestions.push(
                "Add a timeline or checklist section",
                "Include budget breakdown tips",
                "Mention seasonal considerations"
            );
        } else if (category === 'photography') {
            suggestions.push(
                "Add photography timeline suggestions",
                "Include lighting tips",
                "Mention must-have shot list"
            );
        } else if (category === 'decor') {
            suggestions.push(
                "Include DIY decoration ideas",
                "Add color palette suggestions",
                "Mention seasonal flower options"
            );
        }

        return suggestions.slice(0, 3);
    };

    // Auto-generate slug
    useEffect(() => {
        if (formData.title && !initialData) {
            const slug = formData.title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
            setFormData(prev => ({ ...prev, slug }));
        }
    }, [formData.title, initialData]);

    // Handle image preview
    useEffect(() => {
        if (formData.featuredImage) {
            setImagePreview(formData.featuredImage);
        }
    }, [formData.featuredImage]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const addTag = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = tagInput.trim().replace(/,/g, '');
            if (newTag && !formData.tags.includes(newTag)) {
                setFormData(prev => ({
                    ...prev,
                    tags: [...prev.tags, newTag]
                }));
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };
    const removeTip = (index) => {
        setFormData(prev => ({
            ...prev,
            tips: prev.tips.filter((_, i) => i !== index)
        }));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setFormData(prev => ({ ...prev, featuredImage: imageUrl }));
            setFeatureImage(file);
        }
    };

    const handleGalleryUpload = (e) => {
        const files = Array.from(e.target.files);
        const newImages = files.map(file => ({
            url: URL.createObjectURL(file),
            caption: ''
        }));
        setFormData(prev => ({
            ...prev,
            gallery: [...prev.gallery, ...newImages]
        }));
        setGalleryImages(prev => ([...prev, ...files]));
    };

    const removeGalleryImage = (index) => {
        setFormData(prev => ({
            ...prev,
            gallery: prev.gallery.filter((_, i) => i !== index)
        }));
        setGalleryImages(prev => prev.filter((_, i) => i !== index))
    };


    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData, featuredImage, galleryImages);
    };

    const getSeoScoreColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const ViewportButton = ({ view, icon: Icon, label }) => (
        <button
            type="button"
            onClick={() => setCurrentView(view)}
            className={`p-2 rounded-md transition-colors ${currentView === view
                ? 'bg-indigo-100 text-indigo-600'
                : 'text-gray-400 hover:text-gray-600'
                }`}
            title={label}
        >
            <Icon size={18} />
        </button>
    );

    const TabButton = ({ tab, icon: Icon, label, count }) => (
        <button
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${activeTab === tab
                ? 'bg-indigo-100 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
        >
            <Icon size={16} className="mr-2" />
            {label}
            {count && (
                <span className="ml-2 bg-gray-200 text-xs px-2 py-1 rounded-full">
                    {count}
                </span>
            )}
        </button>
    );

    // TIPTAP: Editor instance
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false,
            }),
            Table.configure({
                resizable: true,
                HTMLAttributes: {
                    class: 'w-full border-collapse',
                },
            }),
            TableRow,
            TableCell,
            TableHeader,
            Link.configure({
                openOnClick: true,
                HTMLAttributes: {
                    class: 'text-indigo-600 hover:underline',
                    target: '_blank',
                },
            }),
            Image.configure({
                inline: true,
                allowBase64: true,
                HTMLAttributes: {
                    class: 'rounded-lg max-w-full my-4',
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph', 'image'],
            }),
            TextStyle,
            Color,
            CodeBlockLowlight.configure({
                lowlight,
                HTMLAttributes: {
                    class: 'bg-gray-800 text-gray-200 p-4 rounded-lg my-4',
                },
            }),
        ],
        content: formData.content || '<p></p>',
        onUpdate: ({ editor }) => {
            setFormData(prev => ({ ...prev, content: editor.getHTML() }));
        },
        editorProps: {
            attributes: {
                class: `min-h-[300px] w-full px-4 py-3 rounded-lg focus:outline-none ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} prose max-w-none`,
            },
        },
    });
    // Sync Tiptap content if initialData changes (for edit mode)
    useEffect(() => {
        if (editor && initialData && initialData.content) {
            editor.commands.setContent(initialData.content);
        }
    }, [editor, initialData]);

    return (
        <div className={`flex `}>
            {/* Header */}
            <button
                type="button"
                onClick={onCancel}
                className="self-start sticky top-0 z-50 p-2 rounded-sm order-last bg-white ml-2 text-gray-600 hover:text-black-900"
            >
                <X className='w-6 h-6' />
            </button>
            <div className={`min-h-screen transition-colors ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <div className={`sticky top-0 z-50 border-b transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center space-x-4">
                                <h1 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Wedding Blog Editor
                                </h1>
                                <div className="flex items-center space-x-2">
                                    <ViewportButton view="desktop" icon={Monitor} label="Desktop View" />
                                    <ViewportButton view="tablet" icon={Tablet} label="Tablet View" />
                                    <ViewportButton view="mobile" icon={Smartphone} label="Mobile View" />
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        SEO Score:
                                    </span>
                                    <span className={`font-semibold ${getSeoScoreColor(formData.seoScore)}`}>
                                        {formData.seoScore}/100
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setDarkMode(!darkMode)}
                                    className={`p-2 rounded-md transition-colors ${darkMode
                                        ? 'text-yellow-400 hover:bg-gray-700'
                                        : 'text-gray-500 hover:bg-gray-100'
                                        }`}
                                >
                                    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowPreview(!showPreview)}
                                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                                >
                                    <Eye className="mr-2" size={16} />
                                    Preview
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-3">
                            <form onSubmit={handleSubmit} className={`rounded-xl shadow-sm overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'
                                }`}>
                                {/* Tabs */}
                                <div className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <div className="flex flex-wrap gap-2 p-4">
                                        <TabButton tab="content" icon={Type} label="Content" />
                                        <TabButton tab="seo" icon={Target} label="SEO" />
                                        <TabButton tab="media" icon={Img} label="Media" count={formData.gallery.length} />
                                        <TabButton tab="wedding" icon={Heart} label="Wedding Details" />
                                        <TabButton tab="advanced" icon={Zap} label="Advanced" />
                                    </div>
                                </div>

                                <div className="p-6">
                                    {/* Content Tab */}
                                    {activeTab === 'content' && (
                                        <Content
                                            formData={formData}
                                            handleChange={handleChange}
                                            weddingCategories={weddingCategories}
                                            editor={editor}
                                            darkMode={darkMode}
                                            removeTip={removeTip}
                                            setFormData={setFormData}
                                        />
                                    )}

                                    {/* SEO Tab */}
                                    {activeTab === 'seo' && (<SeoTab
                                        formData={formData}
                                        handleChange={handleChange}
                                        getSeoScoreColor={getSeoScoreColor}
                                        seoAnalysis={seoAnalysis}
                                        tagInput={tagInput}
                                        addTag={addTag}
                                        darkMode={darkMode}
                                        removeTag={removeTag}
                                        setTagInput={setTagInput}
                                    />)}

                                    {/* Media Tab */}
                                    {activeTab === 'media' && (
                                        <MediaTab
                                            imagePreview={imagePreview}
                                            fileInputRef={fileInputRef}
                                            darkMode={darkMode}
                                            formData={formData}
                                            galleryInputRef={galleryInputRef}
                                            setFormData={setFormData}
                                            setImagePreview={setImagePreview}
                                            setFeatureImage={setFeatureImage}
                                            handleImageUpload={handleImageUpload}
                                            removeGalleryImage={removeGalleryImage}
                                            handleGalleryUpload={handleGalleryUpload}
                                        />
                                    )}

                                    {/* Wedding Details Tab */}
                                    {activeTab === 'wedding' && (
                                        <WeddingTab
                                            weddingMoods={weddingMoods}
                                            seasons={seasons}
                                            budgetRanges={budgetRanges}
                                            darkMode={darkMode}
                                            formData={formData}
                                            handleChange={handleChange}
                                            setFormData={setFormData}
                                        />
                                    )}

                                    {/* Advanced Tab */}
                                    {activeTab === 'advanced' && (
                                        <AdvanceTab
                                            darkMode={darkMode}
                                            formData={formData}
                                            handleChange={handleChange}
                                            setFormData={setFormData}
                                        />)}

                                    {/* Submit Button */}
                                    <div className={`flex justify-end pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'
                                        }`}>
                                        <button
                                            type="submit"
                                            className="flex items-center px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg"
                                        >
                                            <Save className="mr-2" size={16} />
                                            {initialData ? 'Update Wedding Blog' : 'Create Wedding Blog'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* AI Suggestions */}
                            <div className={`rounded-xl shadow-sm p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'
                                }`}>
                                <h3 className={`text-lg font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                    <Sparkles className="mr-2 text-yellow-500" size={20} />
                                    AI Suggestions
                                </h3>
                                <div className="space-y-2">
                                    {aiSuggestions.map((suggestion, index) => (
                                        <div key={index} className={`p-3 rounded-lg text-sm ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-700'
                                            }`}>
                                            💡 {suggestion}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className={`rounded-xl shadow-sm p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'
                                }`}>
                                <h3 className={`text-lg font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                    <TrendingUp className="mr-2 text-green-500" size={20} />
                                    Content Stats
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                            Reading Time
                                        </span>
                                        <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {formData.readingTime} min
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                            Word Count
                                        </span>
                                        <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {formData.content.replace(/<[^>]*>/g, '').split(/\s+/).length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                            Tags
                                        </span>
                                        <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {formData.tags.length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                            Images
                                        </span>
                                        <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {formData.gallery.length + (formData.featuredImage ? 1 : 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Wedding Category Info */}
                            <div className={`rounded-xl shadow-sm p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'
                                }`}>
                                <h3 className={`text-lg font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                    <Heart className="mr-2 text-pink-500" size={20} />
                                    Category
                                </h3>
                                {weddingCategories.find(cat => cat.value === formData.category) && (
                                    <div className={`p-3 rounded-lg ${weddingCategories.find(cat => cat.value === formData.category).color
                                        }`}>
                                        <div className="font-medium">
                                            {weddingCategories.find(cat => cat.value === formData.category).label}
                                        </div>
                                        {formData.mood && (
                                            <div className="text-sm mt-2">
                                                Mood: {weddingMoods.find(m => m.value === formData.mood)?.label}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview Modal */}
                {showPreview && (
                    <BlogPreview
                        darkMode={darkMode}
                        formData={formData}
                        weddingCategories={weddingCategories}
                        weddingMoods={weddingMoods}
                        setShowPreview={setShowPreview}
                    />
                )}
            </div>
        </div>
    );
};

export default BlogEditor;