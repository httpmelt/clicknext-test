'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, Layout, Search } from 'lucide-react';
import { notificationApi } from '@/lib/api';
import { Notification } from '@/types';

export default function Navbar({ onSearch }: { onSearch?: (query: string) => void }) {
    const [user, setUser] = useState<any>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
        fetchNotifications();
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (onSearch) {
            onSearch(query);
        }
    };

    const fetchNotifications = async () => {
        try {
            const res = await notificationApi.getNotifications();
            setNotifications(res.data);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const handleMarkAsRead = async (notification: Notification) => {
        try {
            if (!notification.is_read) {
                await notificationApi.markAsRead(notification.notification_id);
            }
            if (notification.link) {
                router.push(notification.link);
                setShowNotifications(false);
            }
            fetchNotifications();
        } catch (err) {
            console.error('Failed to mark notification as read', err);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <nav className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                {/* Logo + Search */}
                <div className="flex items-center gap-8">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2.5 group"
                    >
                        <div className="bg-indigo-600 p-1.5 rounded-lg group-hover:bg-indigo-700 transition-colors">
                            <Layout className="text-white" size={18} />
                        </div>
                        <span className="text-base font-bold text-gray-900 tracking-tight">Kanban</span>
                    </button>

                    {onSearch && (
                        <div className="hidden md:flex relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search boards..."
                                className="bg-gray-50 border border-gray-200 pl-9 pr-4 py-2 rounded-lg w-64 text-sm text-gray-700 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                        </div>
                    )}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors relative"
                        >
                            <Bell size={18} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
                                <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                                            {unreadCount} new
                                        </span>
                                    )}
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="py-8 text-center">
                                            <p className="text-sm text-gray-400">All caught up!</p>
                                        </div>
                                    ) : (
                                        notifications.map((n) => {
                                            const date = new Date(n.created_at);
                                            const isToday = new Date().toDateString() === date.toDateString();
                                            const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
                                            const dateStr = date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

                                            return (
                                                <div
                                                    key={n.notification_id}
                                                    onClick={() => handleMarkAsRead(n)}
                                                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0 ${!n.is_read ? 'bg-indigo-50/40' : ''}`}
                                                >
                                                    <p className="text-[13px] text-gray-700 leading-relaxed mb-1">{n.message}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                                                            {isToday ? 'Today' : dateStr}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-medium">{timeStr} </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="w-px h-5 bg-gray-200" />

                    {/* User */}
                    <div className="flex items-center gap-2.5">
                        <div className="hidden sm:block text-right">
                            <span className="text-sm font-medium text-gray-800">{user?.username}</span>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-bold">
                            {user?.username?.[0]?.toUpperCase()}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 hover:bg-gray-100 text-gray-400 hover:text-rose-500 rounded-lg transition-colors"
                            title="Sign out"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
