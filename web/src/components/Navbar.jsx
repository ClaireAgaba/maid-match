import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';
import {
    LogOut, User, Shield, ShieldCheck, ChevronDown,
    Bell, Settings, Menu, X
} from 'lucide-react';

const Navbar = ({
    userProfile, // Passed from parent if available (e.g. maidProfile, homeownerProfile)
    toggleSidebar // For mobile sidebar if needed later
}) => {
    const { user, logout, isHomeowner, isMaid, isAdmin, isHomeNurse } = useAuth();
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Determine display name and photo
    const getDisplayName = () => {
        if (userProfile?.full_name) return userProfile.full_name;
        if (userProfile?.company_name) return userProfile.company_name;
        return user?.username || 'User';
    };

    const getProfilePhoto = () => {
        if (userProfile?.profile_photo) return userProfile.profile_photo;
        if (userProfile?.profile_picture) return userProfile.profile_picture;
        if (userProfile?.display_photo_url) return userProfile.display_photo_url;
        if (userProfile?.display_photo) return userProfile.display_photo;
        return null;
    };

    const photoUrl = getProfilePhoto();
    const displayName = getDisplayName();

    // Verification status
    const isVerified = userProfile?.is_verified || userProfile?.verified;

    return (
        <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate('/')}>
                        <BrandLogo sizeClass="h-12" showText={true} />
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-4">
                        {/* Notifications (Mock) */}
                        <button className="p-2 text-gray-400 hover:text-primary-600 transition-colors relative">
                            <Bell className="h-6 w-6" />
                            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-secondary-500 rounded-full border-2 border-white"></span>
                        </button>

                        {/* User Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-3 p-1 rounded-full hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 focus:outline-none"
                            >
                                <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary-100 shadow-sm">
                                    {photoUrl ? (
                                        <img
                                            src={photoUrl}
                                            alt={displayName}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center text-primary-600">
                                            <User className="h-5 w-5" />
                                        </div>
                                    )}
                                </div>
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-semibold text-gray-800 leading-none">{displayName}</p>
                                    <p className="text-xs text-gray-500 mt-1 capitalize">{user?.user_type?.replace('_', ' ')}</p>
                                </div>
                                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 overflow-hidden transform origin-top-right transition-all animate-in fade-in zoom-in-95 duration-200">
                                    {/* Header Section */}
                                    <div className="px-6 py-4 bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-white shadow-md">
                                                {photoUrl ? (
                                                    <img src={photoUrl} alt={displayName} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full bg-primary-100 flex items-center justify-center text-primary-600">
                                                        <User className="h-6 w-6" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{displayName}</p>
                                                <p className="text-xs text-gray-500">{user?.email}</p>
                                            </div>
                                        </div>

                                        {/* Verification Badge */}
                                        <div className="mt-3 flex items-center gap-2">
                                            {isVerified ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                                                    <ShieldCheck className="h-3.5 w-3.5" /> Verified Account
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
                                                    <Shield className="h-3.5 w-3.5" /> Not Verified
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="py-2">
                                        <button
                                            onClick={() => navigate(isMaid ? '/profile-settings' : '/profile')}
                                            className="w-full px-6 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                        >
                                            <Settings className="h-4 w-4 text-gray-400" />
                                            Account Settings
                                        </button>
                                        {/* Add more menu items here if needed */}
                                    </div>

                                    <div className="border-t border-gray-100 my-1"></div>

                                    {/* Logout */}
                                    <button
                                        onClick={handleLogout}
                                        className="w-full px-6 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors font-medium"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
