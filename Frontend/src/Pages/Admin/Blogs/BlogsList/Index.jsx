import React, { useState, useEffect } from 'react';
import {
    FiPlus,
    FiSearch,
    FiEye,
    FiEdit,
    FiTrash2,
    FiFilter,
    FiGrid,
    FiList,
    FiCalendar,
    FiTag,
    FiMoreVertical,
    FiX,
    FiClock,
    FiHeart,
    FiStar,
    FiUser,
    FiEdit2,
    FiFileText
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import BlogEditor from '../BlogEditor/Index';
import { X } from 'lucide-react';
const mockBlogs = [
    {
        _id: '1',
        title: 'Ultimate Guide to Wedding Photography',
        category: 'photography',
        isPublished: true,
        updatedAt: '2024-06-20T10:00:00Z',
        tags: ['photography', 'tips', 'wedding'],
        excerpt: 'Capture the magic of your special day with these professional photography tips and techniques.',
        content: 'Wedding photography is an art that requires both technical skill and emotional sensitivity...',
        featuredImage: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800',
        readingTime: 8,
        mood: 'romantic'
    },
    {
        _id: '2',
        title: 'Elegant Wedding Decor on a Budget',
        category: 'decor',
        isPublished: false,
        updatedAt: '2024-06-18T15:30:00Z',
        tags: ['decor', 'budget', 'diy'],
        excerpt: 'Create stunning wedding decor without breaking the bank using these creative and affordable ideas.',
        content: 'Planning a wedding on a budget doesn\'t mean compromising on style...',
        featuredImage: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800',
        readingTime: 6,
        mood: 'elegant'
    },
    {
        _id: '3',
        title: 'Choosing Your Dream Wedding Venue',
        category: 'wedding-planning',
        isPublished: true,
        updatedAt: '2024-06-15T09:15:00Z',
        tags: ['venue', 'planning', 'tips'],
        excerpt: 'Everything you need to know about selecting the perfect venue for your special day.',
        content: 'Your wedding venue sets the tone for your entire celebration...',
        featuredImage: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800',
        readingTime: 10,
        mood: 'romantic'
    },
    {
        _id: '4',
        title: 'Real Wedding: Sarah & Michael\'s Garden Party',
        category: 'stories',
        isPublished: true,
        updatedAt: '2024-06-12T14:20:00Z',
        tags: ['real-wedding', 'garden', 'outdoor'],
        excerpt: 'A beautiful outdoor celebration filled with personal touches and romantic details.',
        content: 'Sarah and Michael wanted their wedding to reflect their love of nature...',
        featuredImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800',
        readingTime: 5,
        mood: 'rustic'
    }
];
const BlogList = () => {
    const [blogs, setBlogs] = useState(mockBlogs);
    const [filteredBlogs, setFilteredBlogs] = useState(mockBlogs);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const [currentBlog, setCurrentBlog] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [blogToDelete, setBlogToDelete] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [previewBlog, setPreviewBlog] = useState(null);


    // Fetch all blogs
    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const response = await fetch('/api/admin/blogs');
                if (!response.ok) throw new Error('Failed to fetch blogs');
                const data = await response.json();
                setBlogs(data);
                setFilteredBlogs(data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        // fetchBlogs();
    }, []);

    // Apply filters
    useEffect(() => {
        let result = blogs;

        if (searchTerm) {
            result = result.filter(blog =>
                blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                blog.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                blog.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (statusFilter !== 'all') {
            result = result.filter(blog =>
                statusFilter === 'published' ? blog.isPublished : !blog.isPublished
            );
        }

        if (categoryFilter !== 'all') {
            result = result.filter(blog => blog.category === categoryFilter);
        }

        setFilteredBlogs(result);
    }, [searchTerm, statusFilter, categoryFilter, blogs]);

    useEffect(() => {
        if (showEditor) {
            document.body.classList.add("overflow-hidden");
        } else {
            document.body.classList.remove("overflow-hidden");
        }
    }, [showEditor]);

    // const confirmDelete = async () => {
    //     try {
    //         const response = await fetch(`/api/admin/blogs/${blogToDelete._id}`, {
    //             method: 'DELETE'
    //         });

    //         if (!response.ok) throw new Error('Failed to delete blog');

    //         setBlogs(blogs.filter(blog => blog._id !== blogToDelete._id));
    //         setShowDeleteModal(false);
    //     } catch (err) {
    //         setError(err.message);
    //     }
    // };

    // const togglePublishStatus = async (blog) => {
    //     try {
    //         const response = await fetch(`/api/admin/blogs/${blog._id}/publish`, {
    //             method: 'PUT',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({ isPublished: !blog.isPublished })
    //         });

    //         if (!response.ok) throw new Error('Failed to update status');

    //         const updatedBlog = await response.json();
    //         setBlogs(blogs.map(b => b._id === updatedBlog._id ? updatedBlog : b));
    //     } catch (err) {
    //         setError(err.message);
    //     }
    // };

    const handleSubmitSuccess = (formData, featuredImage, galleryImages) => {
        console.log(formData, featuredImage, galleryImages)
        if (currentBlog) {
            // Update existing blog
            // setBlogs(blogs.map(blog => blog._id === formData._id ? formData : blog));
        } else {
            // Add new blog
            // setBlogs([formData, ...blogs]);
        } 
        // setShowEditor(false);
    };



    const handleCreateNew = () => {
        setCurrentBlog(null);
        setShowEditor(true);
    };

    const handleEdit = (blog) => {
        setCurrentBlog(blog);
        setShowEditor(true);
    };

    const handlePreview = (blog) => {
        setPreviewBlog(blog);
        setShowPreview(true);
    };

    const handleDeleteClick = (blog) => {
        setBlogToDelete(blog);
        setShowDeleteModal(true);
    };

    const togglePublishStatus = async (blog) => {
        setBlogs(blogs.map(b =>
            b._id === blog._id ? { ...b, isPublished: !b.isPublished } : b
        ));
    };
    const confirmDelete = async () => {
        setBlogs(blogs.filter(blog => blog._id !== blogToDelete._id));
        setShowDeleteModal(false);
    };



    const getMoodIcon = (mood) => {
        const icons = {
            'romantic': <FiHeart className="w-3 h-3" />,
            'elegant': <FiStar className="w-3 h-3" />,
            'rustic': <FiTag className="w-3 h-3" />,
            'modern': <FiGrid className="w-3 h-3" />,
            'vintage': <FiCalendar className="w-3 h-3" />
        };
        return icons[mood] || <FiTag className="w-3 h-3" />;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const BlogCard = ({ blog }) => (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden group">
            {/* Featured Image */}
            <div className="relative overflow-hidden h-48">
                <img
                    src={blog.featuredImage}
                    alt={blog.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getCategoryColor(blog.category)} bg-white/90 backdrop-blur-sm`}>
                        {getCategoryLabel(blog.category)}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu blog={blog} />
                    </div>
                </div>
                <div className="absolute bottom-4 right-4">
                    <button
                        onClick={() => togglePublishStatus(blog)}
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors backdrop-blur-sm ${blog.isPublished
                            ? 'bg-green-100/90 text-green-800 hover:bg-green-200/90'
                            : 'bg-yellow-100/90 text-yellow-800 hover:bg-yellow-200/90'
                            }`}
                    >
                        {blog.isPublished ? 'Published' : 'Draft'}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 leading-tight text-lg">
                    {blog.title}
                </h3>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                    {blog.excerpt}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {blog.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="inline-flex items-center px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded-lg border">
                            <FiTag className="w-3 h-3 mr-1" />
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                            <FiCalendar className="w-3 h-3 mr-1" />
                            {formatDate(blog.updatedAt)}
                        </div>
                        <div className="flex items-center">
                            <FiClock className="w-3 h-3 mr-1" />
                            {blog.readingTime} min
                        </div>
                        {blog.mood && (
                            <div className="flex items-center">
                                {getMoodIcon(blog.mood)}
                                <span className="ml-1 capitalize">{blog.mood}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const DropdownMenu = ({ blog }) => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors shadow-sm"
                >
                    <FiMoreVertical className="w-4 h-4 text-gray-600" />
                </button>

                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsOpen(false)}
                        />
                        <div className="absolute right-0 top-12 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20 min-w-[140px]">
                            <button
                                onClick={() => {
                                    handlePreview(blog);
                                    setIsOpen(false);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <FiEye className="w-4 h-4 mr-3" />
                                Preview
                            </button>
                            <button
                                onClick={() => {
                                    handleEdit(blog);
                                    setIsOpen(false);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <FiEdit className="w-4 h-4 mr-3" />
                                Edit
                            </button>
                            <button
                                onClick={() => {
                                    handleDeleteClick(blog);
                                    setIsOpen(false);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                                <FiTrash2 className="w-4 h-4 mr-3" />
                                Delete
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    };

    const MobileFilters = () => (
        <div className={`fixed inset-0 z-50 transition-opacity ${showFilters ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowFilters(false)} />
            <div className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl transform transition-transform ${showFilters ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900">Filters</h3>
                        <button
                            onClick={() => setShowFilters(false)}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Status</label>
                            <select
                                className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-[#D4A574] transition-colors"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Statuses</option>
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Category</label>
                            <select
                                className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-[#D4A574] transition-colors"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <option value="all">All Categories</option>
                                <option value="wedding-planning">Wedding Planning</option>
                                <option value="photography">Photography</option>
                                <option value="decor">Decor & Styling</option>
                                <option value="vendors">Vendor Selection</option>
                                <option value="stories">Real Weddings</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button
                            onClick={() => {
                                setStatusFilter('all');
                                setCategoryFilter('all');
                                setSearchTerm('');
                            }}
                            className="flex-1 px-6 py-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                        >
                            Clear All
                        </button>
                        <button
                            onClick={() => setShowFilters(false)}
                            className="flex-1 px-6 py-4 bg-[#D4A574] text-white rounded-xl hover:bg-[#C19B6B] font-medium transition-colors"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-[#FAF9F7] to-[#F5F3F0] flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-[#D4A574] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading your beautiful blogs...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-gradient-to-br from-[#FAF9F7] to-[#F5F3F0] flex items-center justify-center">
            <div className="text-center bg-white rounded-2xl p-8 shadow-lg border border-red-200">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiX className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-[#D4A574] text-white rounded-xl hover:bg-[#C19B6B] transition-colors font-medium"
                >
                    Try Again
                </button>
            </div>
        </div>
    );


    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FAF9F7] to-[#F5F3F0]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 sm:mb-12 gap-6">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Blog Management</h1>
                        <p className="text-gray-600 text-lg">
                            {filteredBlogs.length} beautiful {filteredBlogs.length === 1 ? 'story' : 'stories'} to share
                        </p>
                    </div>
                    <button
                        onClick={handleCreateNew}
                        className="w-full sm:w-auto flex items-center justify-center px-6 py-4 bg-[#D4A574] text-white rounded-xl hover:bg-[#C19B6B] transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-lg"
                    >
                        <FiPlus className="mr-2 w-5 h-5" /> Create New Story
                    </button>
                </div>

                {/* Search and Controls */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 sm:p-8 mb-8">
                    <div className="flex flex-col sm:flex-row gap-6">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search your stories, tags, memories..."
                                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-[#D4A574] transition-all duration-300 text-lg"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Desktop Filters */}
                        <div className="hidden sm:flex gap-4">
                            <select
                                className="px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-[#D4A574] min-w-[150px] font-medium transition-colors"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Statuses</option>
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                            </select>

                            <select
                                className="px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-[#D4A574] min-w-[160px] font-medium transition-colors"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <option value="all">All Categories</option>
                                <option value="wedding-planning">Wedding Planning</option>
                                <option value="photography">Photography</option>
                                <option value="decor">Decor & Styling</option>
                                <option value="vendors">Vendor Selection</option>
                                <option value="stories">Real Weddings</option>
                            </select>
                        </div>

                        {/* Mobile Controls */}
                        <div className="flex sm:hidden gap-4">
                            <button
                                onClick={() => setShowFilters(true)}
                                className="flex items-center px-4 py-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                            >
                                <FiFilter className="w-4 h-4 mr-2" />
                                Filters
                            </button>
                        </div>

                        {/* View Toggle */}
                        <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-4 py-4 transition-all duration-300 font-medium ${viewMode === 'grid'
                                    ? 'bg-[#D4A574] text-white shadow-sm'
                                    : 'bg-transparent text-gray-600 hover:bg-white'
                                    }`}
                            >
                                <FiGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-4 py-4 transition-all duration-300 font-medium ${viewMode === 'list'
                                    ? 'bg-[#D4A574] text-white shadow-sm'
                                    : 'bg-transparent text-gray-600 hover:bg-white'
                                    }`}
                            >
                                <FiList className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {filteredBlogs.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredBlogs.map((blog) => (
                                <BlogCard key={blog._id} blog={blog} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gradient-to-r from-[#D4A574]/10 to-[#C19B6B]/10">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Title</th>
                                            <th className="hidden sm:table-cell px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Category</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Status</th>
                                            <th className="hidden lg:table-cell px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Last Updated</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white/50 divide-y divide-gray-200">
                                        {filteredBlogs.map((blog) => (
                                            <tr key={blog._id} className="hover:bg-white/80 transition-colors">
                                                <td className="px-6 py-6">
                                                    <div className="font-bold text-gray-900 line-clamp-1 text-lg">{blog.title}</div>
                                                    <div className="text-sm text-gray-600 mt-2 sm:hidden">
                                                        <span className={`px-3 py-1 text-xs rounded-full border ${getCategoryColor(blog.category)}`}>
                                                            {getCategoryLabel(blog.category)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center mt-2 text-xs text-gray-500 space-x-3">
                                                        <span className="flex items-center">
                                                            <FiClock className="w-3 h-3 mr-1" />
                                                            {blog.readingTime} min
                                                        </span>
                                                        {blog.mood && (
                                                            <span className="flex items-center">
                                                                {getMoodIcon(blog.mood)}
                                                                <span className="ml-1 capitalize">{blog.mood}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="hidden sm:table-cell px-6 py-6 whitespace-nowrap">
                                                    <span className={`px-4 py-2 text-sm font-medium rounded-full border ${getCategoryColor(blog.category)}`}>
                                                        {getCategoryLabel(blog.category)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 whitespace-nowrap">
                                                    <button
                                                        onClick={() => togglePublishStatus(blog)}
                                                        className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${blog.isPublished
                                                            ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-200'
                                                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-200'
                                                            }`}
                                                    >
                                                        {blog.isPublished ? 'Published' : 'Draft'}
                                                    </button>
                                                </td>
                                                <td className="hidden lg:table-cell px-6 py-6 whitespace-nowrap text-sm text-gray-600 font-medium">
                                                    {formatDate(blog.updatedAt)}
                                                </td>
                                                <td className="px-6 py-6 whitespace-nowrap">
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => handlePreview(blog)}
                                                            className="p-3 text-[#D4A574] hover:bg-[#D4A574]/10 rounded-xl transition-colors"
                                                            title="Preview"
                                                        >
                                                            <FiEye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(blog)}
                                                            className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                            title="Edit"
                                                        >

                                                            <FiEdit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => confirmDelete(blog)}
                                                            className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                                            title="Delete"
                                                        >
                                                            <FiTrash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="text-center py-16">
                        <div className="max-w-md mx-auto">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#D4A574]/20 to-[#C19B6B]/20 rounded-full flex items-center justify-center">
                                <FiFileText className="w-12 h-12 text-[#D4A574]" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">No stories found</h3>
                            <p className="text-gray-600 mb-8 text-lg">
                                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                                    ? "No stories match your current filters. Try adjusting your search or filters."
                                    : "Start sharing your beautiful wedding stories with the world."
                                }
                            </p>
                            {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setStatusFilter('all');
                                        setCategoryFilter('all');
                                    }}
                                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium mr-4"
                                >
                                    Clear Filters
                                </button>
                            )}
                            <button
                                onClick={handleCreateNew}
                                className="px-6 py-3 bg-[#D4A574] text-white rounded-xl hover:bg-[#C19B6B] transition-colors font-medium"
                            >
                                Create Your First Story
                            </button>
                        </div>
                    </div>
                )}

                {/* Mobile Filter Modal */}
                {showFilters && (
                    <div className="sm:hidden fixed inset-0 bg-black/50 z-50 flex items-end">
                        <div className="bg-white w-full rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900">Filters</h3>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <select
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-[#D4A574]"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="published">Published</option>
                                        <option value="draft">Draft</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                    <select
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-[#D4A574]"
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                    >
                                        <option value="all">All Categories</option>
                                        <option value="wedding-planning">Wedding Planning</option>
                                        <option value="photography">Photography</option>
                                        <option value="decor">Decor & Styling</option>
                                        <option value="vendors">Vendor Selection</option>
                                        <option value="stories">Real Weddings</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setStatusFilter('all');
                                        setCategoryFilter('all');
                                        setShowFilters(false);
                                    }}
                                    className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Clear All
                                </button>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="flex-1 px-4 py-3 bg-[#D4A574] text-white rounded-xl hover:bg-[#C19B6B] transition-colors font-medium"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {showEditor && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
                    <div className="container mx-auto p-4 max-w-6xl">
                        <BlogEditor
                            initialData={currentBlog}
                            onSubmit={handleSubmitSuccess}
                            onCancel={() => setShowEditor(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

const ConfirmModal = ({ title, message, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};
// client/src/components/admin/BlogPreview.js  

const BlogPreview = ({ blog, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Blog Preview</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-md hover:bg-gray-100"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <article className="max-w-none">
                        {blog.featuredImage && (
                            <img
                                src={blog.featuredImage}
                                alt={blog.title}
                                className="w-full h-64 object-cover rounded-lg mb-6"
                            />
                        )}

                        <div className="mb-4">
                            <span className={`px-3 py-1 rounded-full text-sm ${getCategoryColor(blog.category)}`}>
                                {getCategoryLabel(blog.category)}
                            </span>
                        </div>

                        <h1 className="text-3xl font-bold mb-4 text-gray-900">
                            {blog.title || 'Blog Title'}
                        </h1>

                        <div className="flex items-center text-sm mb-6 text-gray-600">
                            {blog.readingTime} min read
                            {blog.mood && (
                                <>
                                    <span className="mx-2">•</span>
                                    {getMoodLabel(blog.mood)}
                                </>
                            )}
                        </div>

                        <div className="prose max-w-none">
                            <p className="text-lg text-gray-600">
                                {blog.excerpt}
                            </p>

                            <div className="mt-6 text-gray-800">
                                {blog.content.split('\n').map((paragraph, index) => (
                                    <p key={index} className="mb-4">{paragraph}</p>
                                ))}
                            </div>

                            {/* ... rest of your preview content */}
                        </div>
                    </article>
                </div>
            </div>
        </div>
    );
};
const getCategoryColor = (category) => {
    const colors = {
        'wedding-planning': 'bg-rose-100 text-rose-700 border-rose-200',
        'photography': 'bg-purple-100 text-purple-700 border-purple-200',
        'decor': 'bg-pink-100 text-pink-700 border-pink-200',
        'vendors': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'stories': 'bg-amber-100 text-amber-700 border-amber-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const getCategoryLabel = (category) => {
    const labels = {
        'wedding-planning': 'Wedding Planning',
        'photography': 'Photography',
        'decor': 'Decor & Styling',
        'vendors': 'Vendor Selection',
        'stories': 'Real Weddings'
    };
    return labels[category] || category;
};
const getMoodLabel = (value) => {
    const moods = {
        'romantic': 'Romantic',
        'elegant': 'Elegant',
        'rustic': 'Rustic',
        'modern': 'Modern',
        'vintage': 'Vintage'
    };
    return moods[value] || value;
};

export default BlogList;