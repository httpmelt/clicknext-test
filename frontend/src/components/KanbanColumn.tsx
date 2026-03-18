'use client';

import { Column, Task } from '@/types';
import TaskCard from './TaskCard';
import { Droppable } from '@hello-pangea/dnd';
import { Plus, MoreHorizontal, Trash2, Edit2 } from 'lucide-react';

interface KanbanColumnProps {
    column: Column;
    tasks: Task[];
    onAddTask: (column_id: number) => void;
    onTaskClick: (task: Task) => void;
    onDeleteColumn: (column_id: number) => void;
    onUpdateColumn: (column_id: number, name: string) => void;
    onDeleteTask: (task_id: number) => void;
}

export default function KanbanColumn({ column, tasks, onAddTask, onTaskClick, onDeleteColumn, onUpdateColumn, onDeleteTask }: KanbanColumnProps) {
    const handleRename = () => {
        const newName = prompt('Enter new column name:', column.name);
        if (newName && newName !== column.name) {
            onUpdateColumn(column.column_id, newName);
        }
    };

    return (
        <div className="w-80 flex-shrink-0 bg-slate-100/50 rounded-[2rem] flex flex-col max-h-full border border-slate-200/60 shadow-sm">
            <div className="p-6 flex justify-between items-center">
                <div className="flex items-center space-x-3 overflow-hidden">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider truncate" title={column.name}>{column.name}</h2>
                    <span className="bg-white text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 shadow-sm flex-shrink-0">
                        {tasks.length}
                    </span>
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                    <button 
                        onClick={() => onAddTask(column.column_id)}
                        className="p-2 hover:bg-white hover:text-indigo-600 rounded-xl text-slate-400 transition-all active:scale-90"
                        title="Add Task"
                    >
                        <Plus size={18} />
                    </button>
                    <button 
                        onClick={handleRename}
                        className="p-2 hover:bg-white hover:text-indigo-600 rounded-xl text-slate-400 transition-all active:scale-90"
                        title="Rename Column"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button 
                        onClick={() => onDeleteColumn(column.column_id)}
                        className="p-2 hover:bg-rose-50 hover:text-rose-500 rounded-xl text-slate-400 transition-all active:scale-90"
                        title="Delete Column"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            <Droppable droppableId={column.column_id.toString()}>
                {(provided) => (
                    <div 
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="flex-1 overflow-y-auto px-4 pb-6 min-h-[150px]"
                    >
                        <div className="space-y-4">
                            {tasks.map((task, index) => (
                                <div key={task.task_id} onClick={() => onTaskClick(task)}>
                                    <TaskCard 
                                        task={task} 
                                        index={index} 
                                        onDelete={onDeleteTask}
                                    />
                                </div>
                            ))}
                        </div>
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}
