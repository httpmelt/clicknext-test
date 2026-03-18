'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { boardApi } from '@/lib/api';
import { Board } from '@/types';
import Navbar from '@/components/Navbar';
import { Plus, Layout, Trash2, Calendar, Users, ChevronRight, Edit2 } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
    const [boards, setBoards] = useState<Board[]>([]);
    const [loading, setLoading] = useState(true);
    const [newBoardName, setNewBoardName] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingBoard, setEditingBoard] = useState<Board | null>(null);
    const [editBoardName, setEditBoardName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        fetchBoards();
    }, []);

    const fetchBoards = async () => {
        try {
            const response = await boardApi.getBoards();
            setBoards(response.data);
        } catch (err) {
            console.error('Failed to fetch boards', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredBoards = boards.filter(board => 
        board.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreateBoard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBoardName.trim()) return;
        try {
            await boardApi.createBoard(newBoardName);
            setNewBoardName('');
            setShowCreateModal(false);
            fetchBoards();
        } catch (err) {
            console.error('Failed to create board', err);
        }
    };

    const handleEditBoard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingBoard || !editBoardName.trim()) return;
        try {
            await boardApi.updateBoard(editingBoard.board_id, editBoardName);
            setShowEditModal(false);
            setEditingBoard(null);
            setEditBoardName('');
            fetchBoards();
        } catch (err) {
            console.error('Failed to update board', err);
        }
    };

    const handleDeleteBoard = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (!confirm('Are you sure you want to delete this board?')) return;
        try {
            await boardApi.deleteBoard(id);
            fetchBoards();
        } catch (err) {
            console.error('Failed to delete board', err);
        }
    };

    const openEditModal = (board: Board, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setEditingBoard(board);
        setEditBoardName(board.name);
        setShowEditModal(true);
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <Navbar onSearch={setSearchTerm} />
            <main className="max-w-7xl mx-auto px-8 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Project Dashboard</h1>
                        {searchTerm ? (
                            <p className="text-slate-500 mt-1 font-medium">Searching for "{searchTerm}"</p>
                        ) : (
                            <p className="text-slate-500 mt-1 font-medium">Manage your projects and team collaboration</p>
                        )}
                    </div>
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="group flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        <span className="font-bold">Create New Board</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredBoards.map((board) => (
                        <Link 
                            key={board.board_id} 
                            href={`/boards/${board.board_id}`}
                            className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 hover:border-indigo-100 transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                                <button 
                                    onClick={(e) => openEditModal(board, e)}
                                    className="p-2 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-colors"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button 
                                    onClick={(e) => handleDeleteBoard(board.board_id, e)}
                                    className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="mb-6">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-300">
                                    <Layout size={24} />
                                </div>
                            </div>
                            
                            <h3 className="text-lg font-bold text-slate-800 mb-2 truncate pr-16">{board.name}</h3>
                            
                            <div className="flex flex-col space-y-4 mt-6">
                                <div className="flex items-center text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                    <Calendar size={14} className="mr-2" />
                                    <span>Added {new Date(board.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                        <Users size={14} className="mr-2" />
                                        <span>{board.member_count ?? 0} {Number(board.member_count) === 1 ? 'Member' : 'Members'}</span>
                                    </div>
                                    <div className="flex -space-x-2">
                                        {board.members?.slice(0, 3).map((member) => (
                                            <div 
                                                key={member.user_id}
                                                className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-600"
                                                title={member.username}
                                            >
                                                {member.username[0].toUpperCase()}
                                            </div>
                                        ))}
                                        {(Number(board.member_count) > 3) && (
                                            <div className="w-6 h-6 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center text-[8px] font-bold text-indigo-600">
                                                +{Number(board.member_count) - 3}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex items-center text-indigo-600 font-bold text-sm">
                                <span>Open Board</span>
                                <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    ))}

                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-300 hover:bg-indigo-50/30 hover:text-indigo-500 transition-all duration-300 group min-h-[220px]"
                    >
                        <div className="bg-slate-100 p-4 rounded-full mb-4 group-hover:bg-indigo-100 transition-colors">
                            <Plus size={32} />
                        </div>
                        <span className="font-bold">Add New Board</span>
                    </button>
                </div>
            </main>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-slate-900">New Board</h2>
                            <p className="text-slate-500 font-medium">What should we name your next workspace?</p>
                        </div>
                        <form onSubmit={handleCreateBoard}>
                            <div className="relative mb-8">
                                <Layout className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 transition-all font-semibold text-slate-700"
                                    placeholder="e.g. Marketing Project"
                                    value={newBoardName}
                                    onChange={(e) => setNewBoardName(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="flex space-x-4">
                                <button 
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                                >
                                    Create Board
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-slate-900">Rename Board</h2>
                            <p className="text-slate-500 font-medium">Change the name of your workspace</p>
                        </div>
                        <form onSubmit={handleEditBoard}>
                            <div className="relative mb-8">
                                <Layout className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 transition-all font-semibold text-slate-700"
                                    placeholder="Board name"
                                    value={editBoardName}
                                    onChange={(e) => setEditBoardName(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="flex space-x-4">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingBoard(null);
                                    }}
                                    className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                                >
                                    Rename Board
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
