'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { boardApi, columnApi, taskApi } from '@/lib/api';
import { Column, Task, Board, User } from '@/types';
import Navbar from '@/components/Navbar';
import KanbanColumn from '@/components/KanbanColumn';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Plus, UserPlus, Settings, ArrowLeft, MoreVertical, Share2, Edit2, Trash2, Layout, Tag, AlignLeft, X, Users, Check } from 'lucide-react';
import Link from 'next/link';

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const board_id = parseInt(id);
    const [board, setBoard] = useState<Board | null>(null);
    const [columns, setColumns] = useState<Column[]>([]);
    const [boardMembers, setBoardMembers] = useState<User[]>([]);
    const [tasks, setTasks] = useState<Record<number, Task[]>>({});
    const [loading, setLoading] = useState(true);
    
    // Task Creation State
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [newTaskTags, setNewTaskTags] = useState<string[]>([]);
    const [newTaskAssignees, setNewTaskAssignees] = useState<number[]>([]);
    const [tagInput, setTagInput] = useState('');

    // Task Edit State
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [showEditTaskModal, setShowEditTaskModal] = useState(false);
    const [editTaskTitle, setEditTaskTitle] = useState('');
    const [editTaskDescription, setEditTaskDescription] = useState('');
    const [editTaskTags, setEditTaskTags] = useState<string[]>([]);
    const [editTagInput, setEditTagInput] = useState('');

    // Board Management State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteUsername, setInviteUsername] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editBoardName, setEditBoardName] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);

    const router = useRouter();

    useEffect(() => {
        fetchBoardData();
        fetchBoardMembers();
    }, [board_id]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchBoardMembers = async () => {
        try {
            const res = await boardApi.getBoardMembers(board_id);
            setBoardMembers(res.data);
        } catch (err) {
            console.error('Failed to fetch board members', err);
        }
    };

    const fetchBoardData = async () => {
        try {
            const [boardRes, columnsRes] = await Promise.all([
                boardApi.getBoards(),
                columnApi.getColumns(board_id)
            ]);
            
            const currentBoard = boardRes.data.find((b: Board) => b.board_id === board_id);
            if (!currentBoard) {
                router.push('/');
                return;
            }
            setBoard(currentBoard);
            setEditBoardName(currentBoard.name);
            setColumns(columnsRes.data);

            const tasksMap: Record<number, Task[]> = {};
            await Promise.all(columnsRes.data.map(async (col: Column) => {
                const res = await taskApi.getTasks(col.column_id);
                tasksMap[col.column_id] = res.data;
            }));
            setTasks(tasksMap);
        } catch (err) {
            console.error('Failed to fetch board data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRenameBoard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editBoardName.trim()) return;
        try {
            await boardApi.updateBoard(board_id, editBoardName);
            setShowEditModal(false);
            fetchBoardData();
        } catch (err) {
            console.error('Failed to rename board', err);
        }
    };

    const handleDeleteBoard = async () => {
        if (!confirm('Are you sure you want to delete this board? This action cannot be undone.')) return;
        try {
            await boardApi.deleteBoard(board_id);
            router.push('/');
        } catch (err) {
            console.error('Failed to delete board', err);
        }
    };

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const sourceColId = parseInt(source.droppableId);
        const destColId = parseInt(destination.droppableId);
        const task_id = parseInt(draggableId);

        const newTasks = { ...tasks };
        const sourceTasks = [...newTasks[sourceColId]];
        const [movedTask] = sourceTasks.splice(source.index, 1);
        
        if (sourceColId === destColId) {
            sourceTasks.splice(destination.index, 0, movedTask);
            newTasks[sourceColId] = sourceTasks;
        } else {
            const destTasks = [...newTasks[destColId]];
            destTasks.splice(destination.index, 0, movedTask);
            newTasks[sourceColId] = sourceTasks;
            newTasks[destColId] = destTasks;
        }
        setTasks(newTasks);

        try {
            await taskApi.updateTask(task_id, {
                column_id: destColId,
                position: destination.index
            });
        } catch (err) {
            console.error('Failed to update task position', err);
            fetchBoardData();
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedColumnId || !newTaskTitle.trim()) return;
        try {
            const res = await taskApi.createTask(selectedColumnId, {
                title: newTaskTitle,
                description: newTaskDescription,
                tags: newTaskTags,
                position: tasks[selectedColumnId]?.length || 0
            });
            
            const taskId = res.data.task_id;
            
            // Assign users if any selected
            if (newTaskAssignees.length > 0) {
                await Promise.all(newTaskAssignees.map(userId => 
                    taskApi.assignTask(taskId, userId)
                ));
            }

            setNewTaskTitle('');
            setNewTaskDescription('');
            setNewTaskTags([]);
            setNewTaskAssignees([]);
            setShowTaskModal(false);
            fetchBoardData();
        } catch (err) {
            console.error('Failed to add task', err);
        }
    };

    const handleUpdateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTask || !editTaskTitle.trim()) return;
        try {
            await taskApi.updateTask(editingTask.task_id, {
                title: editTaskTitle,
                description: editTaskDescription,
                tags: editTaskTags
            });
            setShowEditTaskModal(false);
            setEditingTask(null);
            fetchBoardData();
        } catch (err) {
            console.error('Failed to update task', err);
        }
    };

    const handleToggleAssignment = async (user_id: number) => {
        if (!editingTask) return;
        const isAssigned = editingTask.assigned_users?.some(u => u.user_id === user_id);
        
        try {
            if (isAssigned) {
                await taskApi.unassignTask(editingTask.task_id, user_id);
            } else {
                await taskApi.assignTask(editingTask.task_id, user_id);
            }
            
            // Refresh tasks to get updated assignments
            fetchBoardData();
            
            // Also update the current editing task state to show immediate feedback
            const res = await taskApi.getTasks(editingTask.column_id);
            const updatedTask = res.data.find((t: Task) => t.task_id === editingTask.task_id);
            if (updatedTask) setEditingTask(updatedTask);
            
        } catch (err) {
            console.error('Failed to toggle assignment', err);
        }
    };

    const toggleNewTaskAssignment = (user_id: number) => {
        setNewTaskAssignees(prev => 
            prev.includes(user_id) 
            ? prev.filter(id => id !== user_id) 
            : [...prev, user_id]
        );
    };

    const addTag = (type: 'new' | 'edit') => {
        if (type === 'new') {
            if (tagInput.trim() && !newTaskTags.includes(tagInput.trim())) {
                setNewTaskTags([...newTaskTags, tagInput.trim()]);
                setTagInput('');
            }
        } else {
            if (editTagInput.trim() && !editTaskTags.includes(editTagInput.trim())) {
                setEditTaskTags([...editTaskTags, editTagInput.trim()]);
                setEditTagInput('');
            }
        }
    };

    const removeTag = (tag: string, type: 'new' | 'edit') => {
        if (type === 'new') {
            setNewTaskTags(newTaskTags.filter(t => t !== tag));
        } else {
            setEditTaskTags(editTaskTags.filter(t => t !== tag));
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await boardApi.inviteMember(board_id, inviteUsername);
            setInviteUsername('');
            setShowInviteModal(false);
            alert('User invited successfully');
            fetchBoardMembers();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to invite user');
        }
    };

    const handleDeleteColumn = async (col_id: number) => {
        if (!confirm('Are you sure you want to delete this column and all its tasks?')) return;
        try {
            await columnApi.deleteColumn(col_id);
            fetchBoardData();
        } catch (err) {
            console.error('Failed to delete column', err);
        }
    };

    const handleUpdateColumn = async (col_id: number, name: string) => {
        try {
            await columnApi.updateColumn(col_id, name);
            fetchBoardData();
        } catch (err) {
            console.error('Failed to update column', err);
        }
    };

    const handleDeleteTask = async (task_id: number) => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        try {
            await taskApi.deleteTask(task_id);
            fetchBoardData();
            setShowEditTaskModal(false);
            setEditingTask(null);
        } catch (err) {
            console.error('Failed to delete task', err);
        }
    };

    const openEditTaskModal = (task: Task) => {
        setEditingTask(task);
        setEditTaskTitle(task.title);
        setEditTaskDescription(task.description || '');
        setEditTaskTags(task.tags || []);
        setShowEditTaskModal(true);
    };

    const handleAddColumn = async () => {
        const name = prompt('Enter column name:');
        if (!name) return;
        try {
            await columnApi.createColumn(board_id, name, columns.length);
            fetchBoardData();
        } catch (err) {
            console.error('Failed to add column', err);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
        </div>
    );
    if (!board) return <div className="p-8">Board not found</div>;

    return (
        <div className="h-screen bg-[#f8fafc] flex flex-col overflow-hidden">
            <Navbar />
            
            {/* Enhanced Board Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex justify-between items-center z-30">
                <div className="flex items-center space-x-6">
                    <Link href="/" className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 transition-all active:scale-90">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center space-x-3">
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">{board.name}</h1>
                            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-100">Active</span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Project Workspace</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <div className="flex -space-x-2 mr-4 group cursor-pointer">
                        {boardMembers.slice(0, 5).map((member) => (
                            <div 
                                key={member.user_id} 
                                className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 group-hover:translate-x-1 transition-transform"
                                title={member.username}
                            >
                                {member.username[0].toUpperCase()}
                            </div>
                        ))}
                        {boardMembers.length > 5 && (
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                                +{boardMembers.length - 5}
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center space-x-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-95"
                    >
                        <UserPlus size={16} />
                        <span>Share</span>
                    </button>
                    
                    <div className="relative" ref={menuRef}>
                        <button 
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-all active:scale-90"
                        >
                            <MoreVertical size={20} />
                        </button>
                        
                        {showMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                <button 
                                    onClick={() => {
                                        setShowMenu(false);
                                        setShowEditModal(true);
                                    }}
                                    className="w-full flex items-center px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    <Edit2 size={16} className="mr-3" />
                                    Rename Board
                                </button>
                                <button 
                                    onClick={() => {
                                        setShowMenu(false);
                                        handleDeleteBoard();
                                    }}
                                    className="w-full flex items-center px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                    <Trash2 size={16} className="mr-3" />
                                    Delete Board
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Kanban Area */}
            <main className="flex-1 overflow-x-auto overflow-y-hidden bg-slate-50/50">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex h-full p-8 space-x-6 items-start">
                        {columns.map((column) => (
                            <KanbanColumn 
                                key={column.column_id} 
                                column={column}
                                tasks={tasks[column.column_id] || []}
                                onAddTask={(id) => {
                                    setSelectedColumnId(id);
                                    setShowTaskModal(true);
                                }}
                                onTaskClick={openEditTaskModal}
                                onDeleteColumn={handleDeleteColumn}
                                onUpdateColumn={handleUpdateColumn}
                                onDeleteTask={handleDeleteTask}
                            />
                        ))}
                        <button 
                            onClick={handleAddColumn}
                            className="w-80 flex-shrink-0 bg-slate-200/40 border-2 border-dashed border-slate-300 rounded-2xl h-14 flex items-center justify-center text-slate-400 hover:bg-white hover:border-indigo-400 hover:text-indigo-500 hover:shadow-xl hover:shadow-indigo-100/50 transition-all group font-bold"
                        >
                            <Plus size={20} className="mr-2 group-hover:scale-125 transition-transform" />
                            <span>Add New Column</span>
                        </button>
                    </div>
                </DragDropContext>
            </main>

            {/* Create Task Modal */}
            {showTaskModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95 duration-200 my-8">
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Create New Task</h2>
                        <p className="text-slate-500 font-medium mb-8">Add details to your new task</p>
                        
                        <form onSubmit={handleAddTask} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Title</label>
                                <div className="relative">
                                    <Layout className="absolute left-4 top-4 text-slate-300" size={18} />
                                    <input
                                        type="text"
                                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 transition-all font-semibold text-slate-700"
                                        placeholder="What needs to be done?"
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        autoFocus
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description</label>
                                <div className="relative">
                                    <AlignLeft className="absolute left-4 top-4 text-slate-300" size={18} />
                                    <textarea
                                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 transition-all font-semibold text-slate-700 min-h-[100px]"
                                        placeholder="Add more details..."
                                        value={newTaskDescription}
                                        onChange={(e) => setNewTaskDescription(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Assignees</label>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {boardMembers.map(member => {
                                        const isAssigned = newTaskAssignees.includes(member.user_id);
                                        return (
                                            <button
                                                key={member.user_id}
                                                type="button"
                                                onClick={() => toggleNewTaskAssignment(member.user_id)}
                                                className={`flex items-center p-3 rounded-2xl border-2 transition-all ${
                                                    isAssigned 
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md shadow-indigo-100' 
                                                    : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                                                }`}
                                            >
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold mr-3 ${isAssigned ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                                    {member.username[0].toUpperCase()}
                                                </div>
                                                <span className="text-sm font-bold truncate flex-1 text-left">{member.username}</span>
                                                {isAssigned && <Check size={16} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Priority & Tags</label>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {[
                                        { label: 'High Priority', color: 'bg-rose-100 text-rose-700 border-rose-200' },
                                        { label: 'Medium Priority', color: 'bg-amber-100 text-amber-700 border-amber-200' },
                                        { label: 'Low Priority', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
                                    ].map(p => (
                                        <button
                                            key={p.label}
                                            type="button"
                                            onClick={() => {
                                                if (newTaskTags.includes(p.label)) {
                                                    setNewTaskTags(newTaskTags.filter(t => t !== p.label));
                                                } else {
                                                    // Remove other priorities if one is selected
                                                    const priorities = ['High Priority', 'Medium Priority', 'Low Priority'];
                                                    setNewTaskTags([...newTaskTags.filter(t => !priorities.includes(t)), p.label]);
                                                }
                                            }}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                                                newTaskTags.includes(p.label) 
                                                ? p.color + ' border-current' 
                                                : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200'
                                            }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex flex-wrap gap-2 mb-3">
                                    {newTaskTags.map(tag => {
                                        const isPriority = ['High Priority', 'Medium Priority', 'Low Priority'].includes(tag);
                                        if (isPriority) return null;
                                        return (
                                            <span key={tag} className="flex items-center bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl text-xs font-bold border border-indigo-100">
                                                {tag}
                                                <button type="button" onClick={() => removeTag(tag, 'new')} className="ml-2 hover:text-indigo-800">
                                                    <X size={14} />
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                                <div className="relative">
                                    <Tag className="absolute left-4 top-4 text-slate-300" size={18} />
                                    <input
                                        type="text"
                                        className="w-full pl-12 pr-32 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 transition-all font-semibold text-slate-700"
                                        placeholder="Add tags..."
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addTag('new');
                                            }
                                        }}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => addTag('new')}
                                        className="absolute right-4 top-3 bg-white border border-slate-200 px-4 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                    >
                                        Add Tag
                                    </button>
                                </div>
                            </div>

                            <div className="flex space-x-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setShowTaskModal(false)}
                                    className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                >
                                    Create Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Task Modal */}
            {showEditTaskModal && editingTask && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95 duration-200 my-8">
                        <div className="flex justify-between items-start mb-2">
                            <h2 className="text-2xl font-black text-slate-900">Edit Task</h2>
                            <button onClick={handleDeleteTask.bind(null, editingTask.task_id)} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors">
                                <Trash2 size={20} />
                            </button>
                        </div>
                        <p className="text-slate-500 font-medium mb-8">Update your task information</p>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Title</label>
                                <div className="relative">
                                    <Layout className="absolute left-4 top-4 text-slate-300" size={18} />
                                    <input
                                        type="text"
                                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 transition-all font-semibold text-slate-700"
                                        value={editTaskTitle}
                                        onChange={(e) => setEditTaskTitle(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description</label>
                                <div className="relative">
                                    <AlignLeft className="absolute left-4 top-4 text-slate-300" size={18} />
                                    <textarea
                                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 transition-all font-semibold text-slate-700 min-h-[100px]"
                                        value={editTaskDescription}
                                        onChange={(e) => setEditTaskDescription(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Assignees</label>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {boardMembers.map(member => {
                                        const isAssigned = editingTask.assigned_users?.some(u => u.user_id === member.user_id);
                                        return (
                                            <button
                                                key={member.user_id}
                                                onClick={() => handleToggleAssignment(member.user_id)}
                                                className={`flex items-center p-3 rounded-2xl border-2 transition-all ${
                                                    isAssigned 
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md shadow-indigo-100' 
                                                    : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                                                }`}
                                            >
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold mr-3 ${isAssigned ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                                    {member.username[0].toUpperCase()}
                                                </div>
                                                <span className="text-sm font-bold truncate flex-1 text-left">{member.username}</span>
                                                {isAssigned && <Check size={16} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Priority & Tags</label>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {[
                                        { label: 'High Priority', color: 'bg-rose-100 text-rose-700 border-rose-200' },
                                        { label: 'Medium Priority', color: 'bg-amber-100 text-amber-700 border-amber-200' },
                                        { label: 'Low Priority', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
                                    ].map(p => (
                                        <button
                                            key={p.label}
                                            type="button"
                                            onClick={() => {
                                                if (editTaskTags.includes(p.label)) {
                                                    setEditTaskTags(editTaskTags.filter(t => t !== p.label));
                                                } else {
                                                    // Remove other priorities if one is selected
                                                    const priorities = ['High Priority', 'Medium Priority', 'Low Priority'];
                                                    setEditTaskTags([...editTaskTags.filter(t => !priorities.includes(t)), p.label]);
                                                }
                                            }}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                                                editTaskTags.includes(p.label) 
                                                ? p.color + ' border-current' 
                                                : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200'
                                            }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex flex-wrap gap-2 mb-3">
                                    {editTaskTags.map(tag => {
                                        const isPriority = ['High Priority', 'Medium Priority', 'Low Priority'].includes(tag);
                                        if (isPriority) return null;
                                        return (
                                            <span key={tag} className="flex items-center bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl text-xs font-bold border border-indigo-100">
                                                {tag}
                                                <button type="button" onClick={() => removeTag(tag, 'edit')} className="ml-2 hover:text-indigo-800">
                                                    <X size={14} />
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                                <div className="relative">
                                    <Tag className="absolute left-4 top-4 text-slate-300" size={18} />
                                    <input
                                        type="text"
                                        className="w-full pl-12 pr-32 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 transition-all font-semibold text-slate-700"
                                        placeholder="Add tags..."
                                        value={editTagInput}
                                        onChange={(e) => setEditTagInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addTag('edit');
                                            }
                                        }}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => addTag('edit')}
                                        className="absolute right-4 top-3 bg-white border border-slate-200 px-4 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                    >
                                        Add Tag
                                    </button>
                                </div>
                            </div>

                            <div className="flex space-x-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setShowEditTaskModal(false);
                                        setEditingTask(null);
                                    }}
                                    className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors"
                                >
                                    Close
                                </button>
                                <button 
                                    onClick={handleUpdateTask}
                                    className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showInviteModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Invite Member</h2>
                        <p className="text-slate-500 font-medium mb-8">Add someone to work with you on this board</p>
                        <form onSubmit={handleInvite}>
                            <div className="relative mb-6">
                                <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 transition-all font-semibold text-slate-700"
                                    placeholder="Enter username..."
                                    value={inviteUsername}
                                    onChange={(e) => setInviteUsername(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="flex space-x-4">
                                <button 
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                >
                                    Send Invite
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Rename Board Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-slate-900">Rename Board</h2>
                            <p className="text-slate-500 font-medium">Change the name of your workspace</p>
                        </div>
                        <form onSubmit={handleRenameBoard}>
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
                                    onClick={() => setShowEditModal(false)}
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
