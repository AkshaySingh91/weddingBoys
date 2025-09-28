import React from 'react'

function AdvanceTab({ darkMode, formData, handleChange,setFormData }) {
    return (

        <div className="space-y-6">
            {/* Publishing Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                        Publish Date
                    </label>
                    <input
                        type="datetime-local"
                        name="publishDate"
                        value={formData.publishDate}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-lg border transition-colors ${darkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                            } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                    />
                </div>

                <div className="flex items-center">
                    <input
                        id="publish-checkbox"
                        type="checkbox"
                        checked={formData.isPublished}
                        onChange={() => setFormData(prev => ({ ...prev, isPublished: !prev.isPublished }))}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="publish-checkbox" className={`ml-3 text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                        Publish immediately
                    </label>
                </div>
            </div>

            {/* Call to Action */}
            <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                    Call to Action
                </label>
                <input
                    type="text"
                    name="callToAction"
                    value={formData.callToAction}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                    placeholder="e.g., Book your wedding consultation today!"
                />
            </div>

            {/* Social Media Description */}
            <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                    Social Media Description
                </label>
                <textarea
                    name="socialDescription"
                    value={formData.socialDescription}
                    onChange={handleChange}
                    rows={2}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                    placeholder="Custom description for social media sharing..."
                />
            </div>

            {/* Meta Description */}
            <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                    Advanced Meta Description
                </label>
                <textarea
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleChange}
                    rows={2}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                    placeholder="Override the excerpt for search engines..."
                />
            </div>
        </div>
    )
}

export default AdvanceTab
