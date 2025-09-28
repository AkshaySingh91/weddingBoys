import { Camera, Image, Upload, X } from 'lucide-react';
import React from 'react'

function MediaTab({
    imagePreview,
    darkMode,
    setFormData,
    setImagePreview,
    setFeatureImage,
    fileInputRef,
    handleImageUpload,
    formData,
    removeGalleryImage,
    galleryInputRef,
    handleGalleryUpload,
}) {
    return (
        <div className="space-y-6">
            {/* Featured Image */}
            <div>
                <label className={`block text-sm font-medium mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                    Featured Image
                </label>

                <div className="flex flex-col sm:flex-row gap-4">
                    {imagePreview ? (
                        <div className="relative">
                            <img
                                src={imagePreview}
                                alt="Featured preview"
                                className="w-full sm:w-48 h-32 object-cover rounded-lg border shadow-sm"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData(prev => ({ ...prev, featuredImage: '' }));
                                    setImagePreview(null);
                                    setFeatureImage(null);
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className={`border-2 border-dashed rounded-lg w-full sm:w-48 h-32 flex items-center justify-center ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
                            }`}>
                            <div className="text-center">
                                <Camera className={`mx-auto mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} size={24} />
                                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    No image
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex-1">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current.click()}
                            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition mb-2"
                        >
                            <Upload className="mr-2" size={16} />
                            Upload Featured Image
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            className="hidden"
                        />
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Recommended: 1200×630px for social sharing
                        </p>
                    </div>
                </div>
            </div>

            {/* Image Gallery */}
            <div>
                <label className={`block text-sm font-medium mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                    Image Gallery ({formData.gallery.length} images)
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                    {formData.gallery.map((image, index) => (
                        <div key={index} className="relative group">
                            <img
                                src={image.url}
                                alt={`Gallery ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                                type="button"
                                onClick={() => removeGalleryImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={() => galleryInputRef.current.click()}
                    className={`w-full p-4 border-2 border-dashed rounded-lg transition-colors ${darkMode
                        ? 'border-gray-600 hover:border-gray-500 bg-gray-700'
                        : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                        }`}
                >
                    <div className="text-center">
                        <Image className={`mx-auto mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} size={24} />
                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Add images to gallery
                        </span>
                    </div>
                </button>
                <input
                    type="file"
                    ref={galleryInputRef}
                    onChange={handleGalleryUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                />
            </div>
        </div>
    )
}

export default MediaTab
