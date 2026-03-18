'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { boardApi, columnApi, taskApi } from '@/lib/api';
import { Column, Task, Board, User } from '@/types';
import Navbar from '@/components/Navbar';
import KanbanColumn from '@/components/KanbanColumn';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import {
    Plus, UserPlus, ArrowLeft, MoreVertical, Edit2, Trash2,
    Layout, Tag, AlignLeft, X, Check
} from 'lucide-react';
import Link from 'next/link';

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const board_id = parseInt(id);
    const [board, setBoard] = useState<Board | null>(null);
    const [columns, setColumns] = useState<Column[]>([]);
    const [boardMembers, setBoardMembers] = useState<User[]>([]);
    const [tasks, setTasks] = useState<Record<number, Task[]>>({});
    const [loading, setLoading] = useState(true);

    // Task Creation
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [newTaskTags, setNewTaskTags] = useState<string[]>([]);
    const [newTaskAssignees, setNewTaskAssignees] = useState<number[]>([]);
    const [tagInput, setTagInput] = useState('');

    // Task Edit
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [showEditTaskModal, setShowEditTaskModal] = useState(false);
    const [editTaskTitle, setEditTaskTitle] = useState('');
    const [editTaskDescription, setEditTaskDescription] = useState('');
    const [editTaskTags, setEditTaskTags] = useState<string[]>([]);
    const [editTagInput, setEditTagInput] = useState('');

    // Board Management
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteUsername, setInviteUsername] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [showEditBoardModal, setShowEditBoardModal] = useState(false);
    const [editBoardName, setEditBoardName] = useState('');

    // Add Column Modal
    const [showAddColumnModal, setShowAddColumnModal] = useState(false);
    const [newColumnName, setNewColumnName] = useState('');

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
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
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
                columnApi.getColumns(board_id),
            ]);
            const currentBoard = boardRes.data.find((b: Board) => b.board_id === board_id);
            if (!currentBoard) { router.push('/'); return; }
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
            setShowEditBoardModal(false);
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
            await taskApi.updateTask(task_id, { column_id: destColId, position: destination.index });
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
                position: tasks[selectedColumnId]?.length || 0,
            });
            const taskId = res.data.task_id;
            if (newTaskAssignees.length > 0) {
                await Promise.all(newTaskAssignees.map(uid => taskApi.assignTask(taskId, uid)));
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
                tags: editTaskTags,
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
            fetchBoardData();
            const res = await taskApi.getTasks(editingTask.column_id);
            const updatedTask = res.data.find((t: Task) => t.task_id === editingTask.task_id);
            if (updatedTask) setEditingTask(updatedTask);
        } catch (err) {
            console.error('Failed to toggle assignment', err);
        }
    };

    const toggleNewTaskAssignment = (user_id: number) => {
        setNewTaskAssignees(prev =>
            prev.includes(user_id) ? prev.filter(id => id !== user_id) : [...prev, user_id]
        );
    };

    const PRIORITIES = ['High Priority', 'Medium Priority', 'Low Priority'];

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
        if (type === 'new') setNewTaskTags(newTaskTags.filter(t => t !== tag));
        else setEditTaskTags(editTaskTags.filter(t => t !== tag));
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await boardApi.inviteMember(board_id, inviteUsername);
            setInviteUsername('');
            setShowInviteModal(false);
            alert('Member invited successfully');
            fetchBoardMembers();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to invite member');
        }
    };

    const handleDeleteColumn = async (col_id: number) => {
        if (!confirm('Delete this column and all its tasks?')) return;
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
        if (!confirm('Delete this task?')) return;
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

    const handleAddColumn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newColumnName.trim()) return;
        try {
            await columnApi.createColumn(board_id, newColumnName.trim(), columns.length);
            setNewColumnName('');
            setShowAddColumnModal(false);
            fetchBoardData();
        } catch (err) {
            console.error('Failed to add column', err);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
        </div>
    );

    if (!board) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <p className="text-gray-500">Board not found.</p>
        </div>
    );

    return (
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
            <Navbar />

            {/* Board Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center flex-shrink-0 z-30">
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-base font-semibold text-gray-900">{board.name}</h1>
                        <span className="text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Active
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Member Avatars */}
                    {boardMembers.length > 0 && (
                        <div className="flex -space-x-1.5">
                            {boardMembers.slice(0, 4).map(member => (
                                <div
                                    key={member.user_id}
                                    className="w-7 h-7 rounded-full border-2 border-white bg-indigo-400 flex items-center justify-center text-[9px] font-bold text-white"
                                    title={member.username}
                                >
                                    {member.username[0].toUpperCase()}
                                </div>
                            ))}
                            {boardMembers.length > 4 && (
                                <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-500">
                                    +{boardMembers.length - 4}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Share / Invite */}
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <UserPlus size={14} />
                        <span>Share</span>
                    </button>

                    {/* Settings Menu */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                        >
                            <MoreVertical size={18} />
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                                <button
                                    onClick={() => { setShowMenu(false); setShowEditBoardModal(true); }}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <Edit2 size={14} />
                                    Rename Board
                                </button>
                                <button
                                    onClick={() => { setShowMenu(false); handleDeleteBoard(); }}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                    <Trash2 size={14} />
                                    Delete Board
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Kanban Board */}
            <main className="flex-1 overflow-x-auto overflow-y-hidden">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex h-full p-6 gap-4 items-start">
                        {columns.map(column => (
                            <KanbanColumn
                                key={column.column_id}
                                column={column}
                                tasks={tasks[column.column_id] || []}
                                onAddTask={id => { setSelectedColumnId(id); setShowTaskModal(true); }}
                                onTaskClick={openEditTaskModal}
                                onDeleteColumn={handleDeleteColumn}
                                onUpdateColumn={handleUpdateColumn}
                                onDeleteTask={handleDeleteTask}
                            />
                        ))}

                        {/* Add Column Button */}
                        <button
                            onClick={() => setShowAddColumnModal(true)}
                            className="w-72 flex-shrink-0 h-12 flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-indigo-600 border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-white rounded-xl transition-all"
                        >
                            <Plus size={16} />
                            <span>Add New Column</span>
                        </button>
                    </div>
                </DragDropContext>
            </main>

            {/* ── Modals ────────────────────────────────── */}

            {/* Add Column Modal */}
            {showAddColumnModal && (
                <ModalOverlay onClose={() => { setShowAddColumnModal(false); setNewColumnName(''); }}>
                    <ModalHeader title="Add Column" onClose={() => { setShowAddColumnModal(false); setNewColumnName(''); }} />
                    <form onSubmit={handleAddColumn} className="space-y-4">
                        <FormField label="Column name">
                            <input
                                type="text"
                                className={inputCls}
                                placeholder="e.g. In Review"
                                value={newColumnName}
                                onChange={e => setNewColumnName(e.target.value)}
                                autoFocus
                                required
                            />
                        </FormField>
                        <ModalActions
                            onCancel={() => { setShowAddColumnModal(false); setNewColumnName(''); }}
                            submitLabel="Add Column"
                        />
                    </form>
                </ModalOverlay>
            )}

            {/* Create Task Modal */}
            {showTaskModal && (
                <ModalOverlay onClose={() => setShowTaskModal(false)}>
                    <ModalHeader title="Create Task" onClose={() => setShowTaskModal(false)} />
                    <form onSubmit={handleAddTask} className="space-y-4">
                        <FormField label="Title">
                            <div className="relative">
                                <Layout size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    className={`${inputCls} pl-9`}
                                    placeholder="What needs to be done?"
                                    value={newTaskTitle}
                                    onChange={e => setNewTaskTitle(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                        </FormField>
                        <FormField label="Description">
                            <div className="relative">
                                <AlignLeft size={14} className="absolute left-3 top-3 text-gray-400" />
                                <textarea
                                    className={`${inputCls} pl-9 min-h-[80px] resize-none`}
                                    placeholder="Add more details..."
                                    value={newTaskDescription}
                                    onChange={e => setNewTaskDescription(e.target.value)}
                                />
                            </div>
                        </FormField>
                        <FormField label="Assignees">
                            <AssigneeGrid
                                members={boardMembers}
                                selected={newTaskAssignees}
                                onToggle={toggleNewTaskAssignment}
                            />
                        </FormField>
                        <FormField label="Priority & Tags">
                            <PriorityTagPicker
                                selectedTags={newTaskTags}
                                onTagsChange={setNewTaskTags}
                                tagInput={tagInput}
                                onTagInputChange={setTagInput}
                                onAddTag={() => addTag('new')}
                                onRemoveTag={tag => removeTag(tag, 'new')}
                            />
                        </FormField>
                        <ModalActions onCancel={() => setShowTaskModal(false)} submitLabel="Create Task" />
                    </form>
                </ModalOverlay>
            )}

            {/* Edit Task Modal */}
            {showEditTaskModal && editingTask && (
                <ModalOverlay onClose={() => { setShowEditTaskModal(false); setEditingTask(null); }}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">Edit Task</h2>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => handleDeleteTask(editingTask.task_id)}
                                className="p-1.5 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                                title="Delete task"
                            >
                                <Trash2 size={14} />
                            </button>
                            <button
                                onClick={() => { setShowEditTaskModal(false); setEditingTask(null); }}
                                className="p-1.5 hover:bg-gray-100 text-gray-400 rounded-lg transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                    <form onSubmit={handleUpdateTask} className="space-y-4">
                        <FormField label="Title">
                            <div className="relative">
                                <Layout size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    className={`${inputCls} pl-9`}
                                    value={editTaskTitle}
                                    onChange={e => setEditTaskTitle(e.target.value)}
                                    required
                                />
                            </div>
                        </FormField>
                        <FormField label="Description">
                            <div className="relative">
                                <AlignLeft size={14} className="absolute left-3 top-3 text-gray-400" />
                                <textarea
                                    className={`${inputCls} pl-9 min-h-[80px] resize-none`}
                                    value={editTaskDescription}
                                    onChange={e => setEditTaskDescription(e.target.value)}
                                />
                            </div>
                        </FormField>
                        <FormField label="Assignees">
                            <AssigneeGrid
                                members={boardMembers}
                                selected={editingTask.assigned_users?.map(u => u.user_id) || []}
                                onToggle={handleToggleAssignment}
                            />
                        </FormField>
                        <FormField label="Priority & Tags">
                            <PriorityTagPicker
                                selectedTags={editTaskTags}
                                onTagsChange={setEditTaskTags}
                                tagInput={editTagInput}
                                onTagInputChange={setEditTagInput}
                                onAddTag={() => addTag('edit')}
                                onRemoveTag={tag => removeTag(tag, 'edit')}
                            />
                        </FormField>
                        <ModalActions onCancel={() => { setShowEditTaskModal(false); setEditingTask(null); }} submitLabel="Save Changes" />
                    </form>
                </ModalOverlay>
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <ModalOverlay onClose={() => setShowInviteModal(false)}>
                    <ModalHeader title="Invite Member" onClose={() => setShowInviteModal(false)} />
                    <p className="text-sm text-gray-500 -mt-2 mb-4">Add someone to collaborate on this board.</p>
                    <form onSubmit={handleInvite} className="space-y-4">
                        <FormField label="Username">
                            <div className="relative">
                                <UserPlus size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    className={`${inputCls} pl-9`}
                                    placeholder="Enter username"
                                    value={inviteUsername}
                                    onChange={e => setInviteUsername(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                        </FormField>
                        <ModalActions onCancel={() => setShowInviteModal(false)} submitLabel="Send Invite" />
                    </form>
                </ModalOverlay>
            )}

            {/* Rename Board Modal */}
            {showEditBoardModal && (
                <ModalOverlay onClose={() => setShowEditBoardModal(false)}>
                    <ModalHeader title="Rename Board" onClose={() => setShowEditBoardModal(false)} />
                    <form onSubmit={handleRenameBoard} className="space-y-4">
                        <FormField label="Board name">
                            <input
                                type="text"
                                className={inputCls}
                                value={editBoardName}
                                onChange={e => setEditBoardName(e.target.value)}
                                autoFocus
                                required
                            />
                        </FormField>
                        <ModalActions onCancel={() => setShowEditBoardModal(false)} submitLabel="Save Changes" />
                    </form>
                </ModalOverlay>
            )}
        </div>
    );
}

// ──── Shared UI Primitives ────────────────────────────────────────────────────

const inputCls =
    'w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all';

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl my-8 relative">
                {children}
            </div>
        </div>
    );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
    return (
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 text-gray-400 rounded-lg transition-colors">
                <X size={14} />
            </button>
        </div>
    );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
            {children}
        </div>
    );
}

function ModalActions({ onCancel, submitLabel }: { onCancel: () => void; submitLabel: string }) {
    return (
        <div className="flex gap-3 pt-1">
            <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
                Cancel
            </button>
            <button
                type="submit"
                className="flex-1 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
                {submitLabel}
            </button>
        </div>
    );
}

const PRIORITIES = [
    { label: 'High Priority', cls: 'bg-rose-50 text-rose-600 border-rose-200 hover:border-rose-400' },
    { label: 'Medium Priority', cls: 'bg-amber-50 text-amber-600 border-amber-200 hover:border-amber-400' },
    { label: 'Low Priority', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400' },
];

function PriorityTagPicker({ selectedTags, onTagsChange, tagInput, onTagInputChange, onAddTag, onRemoveTag }: {
    selectedTags: string[];
    onTagsChange: (tags: string[]) => void;
    tagInput: string;
    onTagInputChange: (v: string) => void;
    onAddTag: () => void;
    onRemoveTag: (tag: string) => void;
}) {
    const priorityLabels = PRIORITIES.map(p => p.label);
    const customTags = selectedTags.filter(t => !priorityLabels.includes(t));

    const togglePriority = (label: string) => {
        if (selectedTags.includes(label)) {
            onTagsChange(selectedTags.filter(t => t !== label));
        } else {
            onTagsChange([...selectedTags.filter(t => !priorityLabels.includes(t)), label]);
        }
    };

    return (
        <div className="space-y-3">
            {/* Priority Buttons */}
            <div className="flex flex-wrap gap-2">
                {PRIORITIES.map(p => (
                    <button
                        key={p.label}
                        type="button"
                        onClick={() => togglePriority(p.label)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                            selectedTags.includes(p.label)
                                ? `${p.cls} border-current`
                                : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Custom Tags */}
            {customTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {customTags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 bg-indigo-50 text-indigo-600 border border-indigo-100 px-2.5 py-1 rounded-full text-xs font-medium">
                            {tag}
                            <button type="button" onClick={() => onRemoveTag(tag)} className="hover:text-indigo-800">
                                <X size={11} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Tag Input */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        className={`${inputCls} pl-8`}
                        placeholder="Add custom tag..."
                        value={tagInput}
                        onChange={e => onTagInputChange(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAddTag(); } }}
                    />
                </div>
                <button
                    type="button"
                    onClick={onAddTag}
                    className="px-3 py-2 text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                    Add
                </button>
            </div>
        </div>
    );
}

function AssigneeGrid({ members, selected, onToggle }: {
    members: User[];
    selected: number[];
    onToggle: (id: number) => void;
}) {
    if (members.length === 0) {
        return <p className="text-xs text-gray-400">No members on this board yet.</p>;
    }
    return (
        <div className="grid grid-cols-2 gap-2">
            {members.map(member => {
                const isSelected = selected.includes(member.user_id);
                return (
                    <button
                        key={member.user_id}
                        type="button"
                        onClick={() => onToggle(member.user_id)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                            isSelected
                                ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                                : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                        }`}
                    >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                            {member.username[0].toUpperCase()}
                        </div>
                        <span className="text-xs font-medium truncate flex-1">{member.username}</span>
                        {isSelected && <Check size={13} className="flex-shrink-0 text-indigo-600" />}
                    </button>
                );
            })}
        </div>
    );
}
