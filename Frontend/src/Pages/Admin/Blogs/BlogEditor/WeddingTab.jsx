import { QuoteIcon } from 'lucide-react'
import React from 'react'

function WeddingTab({ weddingMoods, seasons, budgetRanges, darkMode, formData, handleChange, setFormData}) {
    return (
        <div className="space-y-6">
            {/* Wedding Mood & Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className={`block text-sm font-medium mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                        Wedding Mood
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {weddingMoods.map((mood) => (
                            <button
                                key={mood.value}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, mood: mood.value }))}
                                className={`p-3 rounded-lg border text-left transition-colors ${formData.mood === mood.value
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                    : darkMode
                                        ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="text-lg mb-1">{mood.emoji}</div>
                                <div className="text-sm font-medium">{mood.label.replace(mood.emoji + ' ', '')}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className={`block text-sm font-medium mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                        Season
                    </label>
                    <select
                        name="season"
                        value={formData.season}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-lg border transition-colors ${darkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                            } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                    >
                        <option value="">Select Season</option>
                        {seasons.map(season => (
                            <option key={season} value={season.toLowerCase()}>
                                {season}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Budget & Venue */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                        Budget Range
                    </label>
                    <select
                        name="budget"
                        value={formData.budget}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-lg border transition-colors ${darkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                            } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                    >
                        <option value="">Select Budget Range</option>
                        {budgetRanges.map(range => (
                            <option key={range} value={range}>
                                {range}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                        Venue Type
                    </label>
                    <input
                        type="text"
                        name="venue"
                        value={formData.venue}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-lg border transition-colors ${darkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                            } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                        placeholder="e.g., Beach, Garden, Ballroom, Barn"
                    />
                </div>
            </div>

            {/* Wedding Style */}
            <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                    Wedding Style
                </label>
                <input
                    type="text"
                    name="style"
                    value={formData.style}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                    placeholder="e.g., Minimalist, Bohemian Chic, Classic Elegance"
                />
            </div>

            {/* Testimonial */}
            <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                    Client Testimonial (Optional)
                </label>
                <div className="relative">
                    <QuoteIcon className={`absolute top-3 left-3 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} size={16} />
                    <textarea
                        name="testimonial"
                        value={formData.testimonial}
                        onChange={handleChange}
                        rows={3}
                        className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${darkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                            } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                        placeholder="Share a beautiful testimonial from your clients..."
                    />
                </div>
            </div>
        </div>
    )
}

export default WeddingTab
