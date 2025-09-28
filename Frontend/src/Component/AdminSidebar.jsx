import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpenText,
    Settings,
    SlidersHorizontal,
    Phone,
    User,
    ChevronDown,
    Menu,
    X
} from 'lucide-react';
import { useStudioDetails } from '../Context/StudioDetailsContext.jsx';

export default function AdminSidebar() {
    const [collapsed, setCollapsed] = React.useState({
        dashboard: false,
        profile: false,
        settings: false,
    });

    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const { studioLogo } = useStudioDetails();
    const location = useLocation();

    const toggleCollapse = (section) => {
        setCollapsed(prev => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const isActiveRoute = (path) => {
        return location.pathname === path || location.pathname.startsWith(path);
    };

    const menuItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            path: '/admin/dashboard',
            icon: <LayoutDashboard className="w-5 h-5" />,
            hasSubmenu: false
        },
        {
            id: 'blog',
            label: 'Blogs',
            path: '/admin/blogs',
            icon: <BookOpenText className="w-5 h-5" />,
            hasSubmenu: false
        },
        {
            id: 'website-setting',
            label: 'Website Settings',
            icon: <Settings className="w-5 h-5" />,
            hasSubmenu: true,
            submenu: [
                { label: 'Home', path: '/admin/website-setting/home' },
                { label: 'Films', path: '/admin/website-setting/films' },
                { label: 'Teams', path: '/admin/website-setting/teams' },
                { label: 'Add Client', path: '/admin/website-setting/add-client' },
                { label: 'All Clients', path: '/admin/website-setting/clients' },
                { label: 'New Tags', path: '/admin/website-setting/add-tags' },
                { label: 'BTS Schema Manager', path: '/admin/website-setting/bts-schema-manager' }
            ]
        },
        {
            id: 'studio-setting',
            label: 'Studio Settings',
            path: '/admin/studio-setting',
            icon: <SlidersHorizontal className="w-5 h-5" />,
            hasSubmenu: false
        },
        {
            id: 'enquiries',
            label: 'Total Enquiries',
            path: '/admin/total-Enquires',
            icon: <Phone className="w-5 h-5" />,
            hasSubmenu: false
        },
        {
            id: 'profile',
            label: 'Profile',
            path: '/admin/profile',
            icon: <User className="w-5 h-5" />,
            hasSubmenu: false
        }
    ];

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-gradient-to-br from-[#FFDCCC] to-[#FFF0E6] shadow-lg border border-white/20 backdrop-blur-md"
                aria-label="Toggle menu"
            >
                {mobileMenuOpen ? (
                    <X className="w-6 h-6 text-[#8B4513]" />
                ) : (
                    <Menu className="w-6 h-6 text-[#8B4513]" />
                )}
            </button>

            {/* Sidebar */}
            <div className={`
        fixed z-40 transition-all duration-300 ease-in-out
        lg:left-0 lg:top-0 lg:w-64 lg:h-full lg:translate-x-0
        ${mobileMenuOpen
                    ? 'translate-x-0 shadow-2xl'
                    : '-translate-x-full'}
        w-72 h-full left-0 top-0
      `}>
                <div className="h-full flex flex-col bg-gradient-to-b from-[#FFDCCC] via-[#FAF1E6] to-[#FFF0E6] border-r border-white/30 backdrop-blur-lg">

                    {/* Logo Section */}
                    <div className="flex items-center justify-center p-6 border-b border-white/20">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg ring-4 ring-white/30">
                                <img
                                    className='w-full h-full object-cover'
                                    src={studioLogo || "https://placehold.jp/250x250.png"}
                                    alt="Studio Logo"
                                />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#D4A574]/50 scrollbar-track-transparent hover:scrollbar-thumb-[#D4A574]">
                        {menuItems.map((item) => (
                            <div key={item.id} className="space-y-1">
                                {item.hasSubmenu ? (
                                    <>
                                        <button
                                            onClick={() => toggleCollapse(item.id)}
                                            className={`
                        w-full flex items-center justify-between px-4 py-3 rounded-xl text-left
                        font-medium text-sm transition-all duration-200
                        hover:bg-white/20 hover:shadow-sm
                        ${collapsed[item.id]
                                                    ? 'bg-white/15 shadow-sm text-[#8B4513]'
                                                    : 'text-[#8B4513]/90'}
                      `}
                                            aria-expanded={collapsed[item.id]}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="text-[#D4A574]">
                                                    {item.icon}
                                                </div>
                                                <span>{item.label}</span>
                                            </div>
                                            <ChevronDown
                                                className={`w-4 h-4 transition-transform duration-200 text-[#D4A574] ${collapsed[item.id] ? 'rotate-180' : ''
                                                    }`}
                                            />
                                        </button>

                                        <div className={`
                      ml-8 space-y-1 transition-all duration-300 overflow-hidden
                      ${collapsed[item.id]
                                                ? 'max-h-96 opacity-100 mt-1'
                                                : 'max-h-0 opacity-0'}
                    `}>
                                            {item.submenu?.map((subItem) => (
                                                <Link
                                                    key={subItem.path}
                                                    to={subItem.path}
                                                    onClick={() => setMobileMenuOpen(false)}
                                                    className={`
                            block px-4 py-2.5 rounded-lg text-sm transition-all duration-200
                            hover:bg-white/15 hover:shadow-sm
                            ${isActiveRoute(subItem.path)
                                                            ? 'bg-white/20 shadow-sm text-[#8B4513] font-medium border-l-2 border-[#D4A574]'
                                                            : 'text-[#8B4513]/80 hover:text-[#8B4513]'
                                                        }
                          `}
                                                >
                                                    {subItem.label}
                                                </Link>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <Link
                                        to={item.path}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                      transition-all duration-200
                      ${isActiveRoute(item.path)
                                                ? 'bg-white/25 shadow-md text-[#8B4513] border border-white/30'
                                                : 'text-[#8B4513]/90 hover:bg-white/15 hover:text-[#8B4513] hover:shadow-sm'
                                            }
                    `}
                                    >
                                        <div className={`${isActiveRoute(item.path)
                                            ? 'text-[#8B4513]'
                                            : 'text-[#D4A574]'}`}
                                        >
                                            {item.icon}
                                        </div>
                                        <span>{item.label}</span>
                                        {isActiveRoute(item.path) && (
                                            <div className="ml-auto w-2 h-2 bg-[#D4A574] rounded-full"></div>
                                        )}
                                    </Link>
                                )}
                            </div>
                        ))}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/20 mt-auto">
                        <div className="text-center">
                            <p className="text-xs text-[#8B4513]/60 font-medium">
                                Wedding Studio Admin
                            </p>
                            <div className="flex justify-center items-center gap-1 mt-1">
                                <div className="w-1 h-1 bg-[#D4A574] rounded-full"></div>
                                <div className="w-1 h-1 bg-[#D4A574] rounded-full"></div>
                                <div className="w-1 h-1 bg-[#D4A574] rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-30"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Content Spacer for Desktop */}
            <div className="hidden lg:block lg:w-64"></div>
        </>
    );
}