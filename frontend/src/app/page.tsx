'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { boardApi } from '@/lib/api';
import { Board } from '@/types';
import Navbar from '@/components/Navbar';
import { Plus, Layout, Trash2, Calendar, Users, Edit2, X } from 'lucide-react';
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar onSearch={setSearchTerm} />

            <main className="max-w-7xl mx-auto px-6 py-10">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Boards</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {searchTerm
                                ? `Showing results for "${searchTerm}"`
                                : 'Manage your projects and collaborate with your team'}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <Plus size={16} />
                        <span>Create New Board</span>
                    </button>
                </div>

                {/* Boards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredBoards.map((board) => (
                        <Link
                            key={board.board_id}
                            href={`/boards/${board.board_id}`}
                            className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-200 hover:shadow-md transition-all duration-150 relative"
                        >
                            {/* Action buttons (visible on hover) */}
                            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => openEditModal(board, e)}
                                    className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                                >
                                    <Edit2 size={13} />
                                </button>
                                <button
                                    onClick={(e) => handleDeleteBoard(board.board_id, e)}
                                    className="p-1.5 bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-500 rounded-lg transition-colors"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>

                            {/* Board Icon */}
                            <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-4">
                                <Layout size={18} />
                            </div>

                            {/* Board Name */}
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 pr-12 truncate">
                                {board.name}
                            </h3>

                            {/* Meta */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                    <Calendar size={12} />
                                    <span>{new Date(board.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                        <Users size={12} />
                                        <span>{board.member_count ?? 0} {Number(board.member_count) === 1 ? 'member' : 'members'}</span>
                                    </div>
                                    {board.members && board.members.length > 0 && (
                                        <div className="flex -space-x-1.5">
                                            {board.members.slice(0, 3).map((member) => (
                                                <div
                                                    key={member.user_id}
                                                    className="w-5 h-5 rounded-full border-2 border-white bg-indigo-400 flex items-center justify-center text-[7px] font-bold text-white"
                                                    title={member.username}
                                                >
                                                    {member.username[0].toUpperCase()}
                                                </div>
                                            ))}
                                            {Number(board.member_count) > 3 && (
                                                <div className="w-5 h-5 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[7px] font-bold text-gray-500">
                                                    +{Number(board.member_count) - 3}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}

                    {/* Add New Board Card */}
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex flex-col items-center justify-center min-h-[168px] rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all duration-150 group"
                    >
                        <div className="w-9 h-9 rounded-lg border-2 border-dashed border-current flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <Plus size={18} />
                        </div>
                        <span className="text-sm font-medium">New Board</span>
                    </button>
                </div>
            </main>

            {/* Create Board Modal */}
            {showCreateModal && (
                <Modal title="New Board" subtitle="Name your new workspace" onClose={() => setShowCreateModal(false)}>
                    <form onSubmit={handleCreateBoard} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Board name</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                placeholder="e.g. Marketing Project"
                                value={newBoardName}
                                onChange={(e) => setNewBoardName(e.target.value)}
                                autoFocus
                                required
                            />
                        </div>
                        <div className="flex gap-3 pt-1">
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Create Board
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Edit Board Modal */}
            {showEditModal && (
                <Modal title="Rename Board" subtitle="Update the name of your workspace" onClose={() => { setShowEditModal(false); setEditingBoard(null); }}>
                    <form onSubmit={handleEditBoard} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Board name</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                value={editBoardName}
                                onChange={(e) => setEditBoardName(e.target.value)}
                                autoFocus
                                required
                            />
                        </div>
                        <div className="flex gap-3 pt-1">
                            <button
                                type="button"
                                onClick={() => { setShowEditModal(false); setEditingBoard(null); }}
                                className="flex-1 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

function Modal({ title, subtitle, onClose, children }: {
    title: string;
    subtitle: string;
    onClose: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
                <div className="flex justify-between items-start mb-5">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                        <X size={16} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
