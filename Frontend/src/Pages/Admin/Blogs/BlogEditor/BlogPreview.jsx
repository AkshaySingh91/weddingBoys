import { Clock, Hash, Quote, Sparkles, Star, X } from 'lucide-react'
import React from 'react'

function BlogPreview({
    darkMode,
    formData,
    setShowPreview,
    weddingCategories,
    weddingMoods
}) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                    <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Blog Preview
                    </h2>
                    <button
                        onClick={() => setShowPreview(false)}
                        className={`p-2 rounded-md ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                            }`}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {/* Preview Content */}
                    <article className="max-w-none">
                        {formData.featuredImage && (
                            <img
                                src={formData.featuredImage}
                                alt={formData.title}
                                className="w-full h-64 object-cover rounded-lg mb-6"
                            />
                        )}

                        <div className="mb-4">
                            <span className={`px-3 py-1 rounded-full text-sm ${weddingCategories.find(cat => cat.value === formData.category)?.color || 'bg-gray-100 text-gray-800'
                                }`}>
                                {weddingCategories.find(cat => cat.value === formData.category)?.label}
                            </span>
                        </div>

                        <h1 className={`text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {formData.title || 'Blog Title'}
                        </h1>

                        <div className={`flex items-center text-sm mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            <Clock size={16} className="mr-1" />
                            {formData.readingTime} min read
                            {formData.mood && (
                                <>
                                    <span className="mx-2">•</span>
                                    {weddingMoods.find(m => m.value === formData.mood)?.emoji} {weddingMoods.find(m => m.value === formData.mood)?.label.replace(/^.* /, '')}
                                </>
                            )}
                        </div>

                        <div className={`prose max-w-none ${darkMode ? 'prose-invert' : ''}`}>
                            <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {formData.excerpt}
                            </p>

                            <div className={`mt-6 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                {formData.content.split('\n').map((paragraph, index) => (
                                    <p key={index} className="mb-4">{paragraph}</p>
                                ))}
                            </div>

                            {formData.tips.length > 0 && (
                                <div className={`mt-8 p-6 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-yellow-50'
                                    }`}>
                                    <h3 className={`text-lg font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'
                                        }`}>
                                        <Sparkles className="mr-2 text-yellow-500" size={20} />
                                        Quick Tips
                                    </h3>
                                    <ul className="space-y-2">
                                        {formData.tips.map((tip, index) => (
                                            <li key={index} className={`flex items-start ${darkMode ? 'text-gray-200' : 'text-gray-700'
                                                }`}>
                                                <Star className="mr-2 mt-1 text-yellow-500" size={16} />
                                                {tip}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {formData.gallery.length > 0 && (
                                <div className="mt-8">
                                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'
                                        }`}>
                                        Gallery
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {formData.gallery.map((image, index) => (
                                            <img
                                                key={index}
                                                src={image.url}
                                                alt={`Gallery ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-lg"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {formData.testimonial && (
                                <blockquote className={`mt-8 p-6 border-l-4 border-indigo-500 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'
                                    }`}>
                                    <Quote className="text-indigo-500 mb-2" size={24} />
                                    <p className={`text-lg italic ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                        "{formData.testimonial}"
                                    </p>
                                </blockquote>
                            )}

                            {formData.callToAction && (
                                <div className="mt-8 text-center">
                                    <div className="p-6 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                                        <p className="text-lg font-semibold">{formData.callToAction}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {formData.tags.length > 0 && (
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <div className="flex flex-wrap gap-2">
                                    {formData.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm flex items-center"
                                        >
                                            <Hash size={12} className="mr-1" />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </article>
                </div>
            </div>
        </div>
    )
}

export default BlogPreview
