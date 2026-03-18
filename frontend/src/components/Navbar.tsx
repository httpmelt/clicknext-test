'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, User, Layout, Search } from 'lucide-react';
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
        <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-3 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center space-x-10">
                    <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => router.push('/')}>
                        <div className="bg-indigo-600 p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-100">
                            <Layout className="text-white" size={20} />
                        </div>
                        <span className="text-xl font-black text-slate-900 tracking-tighter">KANBAN</span>
                    </div>

                    {onSearch && (
                        <div className="hidden md:flex relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search tasks, boards..." 
                                className="bg-slate-50 border-2 border-slate-100 pl-12 pr-6 py-2.5 rounded-2xl w-80 text-sm font-semibold text-slate-600 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                        </div>
                    )}
                </div>

                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <button 
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2.5 hover:bg-slate-100 rounded-2xl text-slate-500 transition-colors relative"
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2.5 w-4 h-4 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-bold text-white">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="p-5 border-b border-slate-50 flex justify-between items-center">
                                    <h3 className="font-black text-slate-900">Notifications</h3>
                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">{unreadCount} New</span>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-10 text-center">
                                            <p className="text-slate-400 text-sm font-bold">All caught up!</p>
                                        </div>
                                    ) : (
                                        notifications.map((n) => (
                                            <div 
                                                key={n.notification_id} 
                                                onClick={() => handleMarkAsRead(n)}
                                                className={`p-5 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0 ${!n.is_read ? 'bg-indigo-50/30' : ''}`}
                                            >
                                                <p className="text-sm font-semibold text-slate-700 leading-relaxed mb-1">{n.message}</p>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(n.created_at).toLocaleTimeString()}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="h-8 w-px bg-slate-200 mx-2" />

                    <div className="flex items-center space-x-3 pl-2">
                        <div className="text-right hidden sm:block">
                            <span className="text-sm font-semibold text-slate-900 leading-none">{user?.username}</span>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-indigo-600 font-black shadow-sm">
                            {user?.username?.[0]?.toUpperCase()}
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="p-2.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all active:scale-90"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
