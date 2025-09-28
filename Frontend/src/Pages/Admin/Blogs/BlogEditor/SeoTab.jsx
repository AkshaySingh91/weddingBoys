import { Hash, X } from 'lucide-react'
import React from 'react'

function SeoTab({ formData, handleChange, getSeoScoreColor, seoAnalysis, tagInput, addTag, darkMode, removeTag, setTagInput }) {
    return (

        <div className="space-y-6">
            {/* SEO Score */}
            <div className={`p-4 rounded-lg ${formData.seoScore >= 80
                ? 'bg-green-50 border border-green-200'
                : formData.seoScore >= 60
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">SEO Analysis</h3>
                    <span className={`text-2xl font-bold ${getSeoScoreColor(formData.seoScore)}`}>
                        {formData.seoScore}/100
                    </span>
                </div>
                <div className="mt-3 space-y-2">
                    {Object.entries(seoAnalysis).map(([key, analysis]) => (
                        <div key={key} className="flex items-center text-sm">
                            <div className={`w-2 h-2 rounded-full mr-2 ${analysis.status === 'good' ? 'bg-green-500' : 'bg-yellow-500'
                                }`} />
                            <span className="text-gray-700">{analysis.message}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Meta Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                        Meta Title
                    </label>
                    <input
                        type="text"
                        name="metaTitle"
                        value={formData.metaTitle}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-lg border transition-colors ${darkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                            } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                        placeholder="Custom SEO title (optional)"
                    />
                </div>

                <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                        Social Media Title
                    </label>
                    <input
                        type="text"
                        name="socialTitle"
                        value={formData.socialTitle}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-lg border transition-colors ${darkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                            } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                        placeholder="Title for social sharing"
                    />
                </div>
            </div>

            {/* Excerpt */}
            <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                    Excerpt (Meta Description) *
                </label>
                <textarea
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleChange}
                    maxLength={160}
                    rows={3}
                    required
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                    placeholder="Brief description that appears in search results and social media..."
                />
                <p className={`text-xs mt-1 ${formData.excerpt.length >= 140 && formData.excerpt.length <= 160
                    ? 'text-green-600'
                    : 'text-red-500'
                    }`}>
                    {formData.excerpt.length}/160 characters
                </p>
            </div>

            {/* Tags */}
            <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                    Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                    {formData.tags.map((tag) => (
                        <span
                            key={tag}
                            className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm flex items-center"
                        >
                            <Hash size={12} className="mr-1" />
                            {tag}
                            <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-2 text-indigo-600 hover:text-indigo-900"
                            >
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                </div>
                <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={addTag}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                    placeholder="Add tags (press Enter or comma)"
                />
            </div>
        </div>
    )
}

export default SeoTab
