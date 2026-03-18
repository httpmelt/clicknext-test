'use client';

import { useState, useRef, useEffect } from 'react';
import { Column, Task } from '@/types';
import TaskCard from './TaskCard';
import { Droppable } from '@hello-pangea/dnd';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';

interface KanbanColumnProps {
    column: Column;
    tasks: Task[];
    onAddTask: (column_id: number) => void;
    onTaskClick: (task: Task) => void;
    onDeleteColumn: (column_id: number) => void;
    onUpdateColumn: (column_id: number, name: string) => void;
    onDeleteTask: (task_id: number) => void;
}

export default function KanbanColumn({
    column,
    tasks,
    onAddTask,
    onTaskClick,
    onDeleteColumn,
    onUpdateColumn,
    onDeleteTask,
}: KanbanColumnProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(column.name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleRenameSubmit = () => {
        const trimmed = editName.trim();
        if (trimmed && trimmed !== column.name) {
            onUpdateColumn(column.column_id, trimmed);
        } else {
            setEditName(column.name);
        }
        setIsEditing(false);
    };

    const handleRenameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleRenameSubmit();
        if (e.key === 'Escape') {
            setEditName(column.name);
            setIsEditing(false);
        }
    };

    return (
        <div className="w-72 flex-shrink-0 bg-gray-50 rounded-xl flex flex-col max-h-full border border-gray-200">
            {/* Column Header */}
            <div className="px-4 py-3 flex justify-between items-center border-b border-gray-200">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isEditing ? (
                        <div className="flex items-center gap-1 flex-1">
                            <input
                                ref={inputRef}
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                onKeyDown={handleRenameKeyDown}
                                onBlur={handleRenameSubmit}
                                className="flex-1 text-sm font-semibold text-gray-800 bg-white border border-indigo-400 rounded-md px-2 py-0.5 focus:outline-none focus:border-indigo-500 min-w-0"
                            />
                            <button
                                onMouseDown={e => { e.preventDefault(); handleRenameSubmit(); }}
                                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            >
                                <Check size={14} />
                            </button>
                            <button
                                onMouseDown={e => {
                                    e.preventDefault();
                                    setEditName(column.name);
                                    setIsEditing(false);
                                }}
                                className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <>
                            <h2
                                className="text-sm font-semibold text-gray-800 truncate"
                                title={column.name}
                            >
                                {column.name}
                            </h2>
                            <span className="bg-white text-gray-500 text-xs font-medium px-1.5 py-0.5 rounded-full border border-gray-200 flex-shrink-0">
                                {tasks.length}
                            </span>
                        </>
                    )}
                </div>

                {!isEditing && (
                    <div className="flex items-center gap-0.5 flex-shrink-0 ml-1">
                        <button
                            onClick={() => onAddTask(column.column_id)}
                            className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors"
                            title="Add task"
                        >
                            <Plus size={15} />
                        </button>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors"
                            title="Rename column"
                        >
                            <Pencil size={13} />
                        </button>
                        <button
                            onClick={() => onDeleteColumn(column.column_id)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-gray-400 hover:text-rose-500 transition-colors"
                            title="Delete column"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* Task List */}
            <Droppable droppableId={column.column_id.toString()}>
                {(provided, snapshot) => (
                    <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 overflow-y-auto p-3 min-h-[120px] space-y-2.5 transition-colors ${
                            snapshot.isDraggingOver ? 'bg-indigo-50/40' : ''
                        }`}
                    >
                        {tasks.map((task, index) => (
                            <div key={task.task_id} onClick={() => onTaskClick(task)}>
                                <TaskCard
                                    task={task}
                                    index={index}
                                    onDelete={onDeleteTask}
                                />
                            </div>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>

            {/* Add Task Footer */}
            <div className="px-3 pb-3">
                <button
                    onClick={() => onAddTask(column.column_id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg border border-dashed border-gray-200 hover:border-indigo-300 transition-all"
                >
                    <Plus size={14} />
                    <span>Add task</span>
                </button>
            </div>
        </div>
    );
}
