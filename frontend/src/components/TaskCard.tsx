'use client';

import { Task, User } from '@/types';
import { Draggable } from '@hello-pangea/dnd';
import { MoreHorizontal, Trash2, Tag, Clock, Users } from 'lucide-react';

interface TaskCardProps {
    task: Task;
    index: number;
    onDelete: (task_id: number) => void;
}

export default function TaskCard({ task, index, onDelete }: TaskCardProps) {
    const getTagColor = (tag: string) => {
        const lowerTag = tag.toLowerCase();
        if (lowerTag.includes('high priority')) return 'bg-rose-100 text-rose-700 border-rose-200';
        if (lowerTag.includes('medium priority')) return 'bg-amber-100 text-amber-700 border-amber-200';
        if (lowerTag.includes('low priority')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    };

    return (
        <Draggable draggableId={task.task_id.toString()} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 hover:border-indigo-100 transition-all duration-300 ${
                        snapshot.isDragging ? 'shadow-2xl ring-2 ring-indigo-500/20 rotate-2' : ''
                    }`}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-wrap gap-1.5">
                            {task.tags && task.tags.map((tag, i) => (
                                <span key={i} className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider border ${getTagColor(tag)}`}>
                                    {tag}
                                </span>
                            ))}
                            {(!task.tags || task.tags.length === 0) && (
                                <span className="text-[10px] font-bold bg-slate-50 text-slate-400 px-2 py-0.5 rounded-lg uppercase tracking-wider border border-slate-100">
                                    General
                                </span>
                            )}
                        </div>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(task.task_id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-all"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                    
                    <h3 className="text-sm font-bold text-slate-800 leading-relaxed mb-4 group-hover:text-indigo-600 transition-colors">
                        {task.title}
                    </h3>

                    {task.description && (
                        <p className="text-xs text-slate-500 font-medium mb-4 line-clamp-2">
                            {task.description}
                        </p>
                    )}

                    <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            {task.assigned_users && task.assigned_users.length > 0 ? (
                                <div className="flex -space-x-1.5">
                                    {task.assigned_users.slice(0, 3).map((user) => (
                                        <div 
                                            key={user.user_id} 
                                            className="w-6 h-6 rounded-full border-2 border-white bg-indigo-600 flex items-center justify-center text-[8px] font-bold text-white"
                                            title={user.username}
                                        >
                                            {user.username[0].toUpperCase()}
                                        </div>
                                    ))}
                                    {task.assigned_users.length > 3 && (
                                        <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600">
                                            +{task.assigned_users.length - 3}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-[10px] text-slate-300 font-bold flex items-center">
                                    <Users size={12} className="mr-1" />
                                    Unassigned
                                </div>
                            )}
                        </div>
                        <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            <Clock size={12} className="mr-1.5" />
                            <span>{new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
}
