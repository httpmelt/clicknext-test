'use client';

import { Task } from '@/types';
import { Draggable } from '@hello-pangea/dnd';
import { Trash2, Users } from 'lucide-react';

interface TaskCardProps {
    task: Task;
    index: number;
    onDelete: (task_id: number) => void;
}

const TAG_COLORS: Record<string, string> = {
    'high priority': 'bg-rose-50 text-rose-600 border-rose-200',
    'medium priority': 'bg-amber-50 text-amber-600 border-amber-200',
    'low priority': 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

function getTagStyle(tag: string): string {
    return TAG_COLORS[tag.toLowerCase()] ?? 'bg-indigo-50 text-indigo-600 border-indigo-100';
}

export default function TaskCard({ task, index, onDelete }: TaskCardProps) {
    return (
        <Draggable draggableId={task.task_id.toString()} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`group bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all duration-150 ${
                        snapshot.isDragging
                            ? 'shadow-xl border-indigo-300 ring-2 ring-indigo-500/10 rotate-1'
                            : ''
                    }`}
                >
                    {/* Tags Row */}
                    {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                            {task.tags.map((tag, i) => (
                                <span
                                    key={i}
                                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getTagStyle(tag)}`}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Title + Delete */}
                    <div className="flex justify-between items-start gap-2">
                        <h3 className="text-sm font-semibold text-gray-800 leading-snug flex-1">
                            {task.title}
                        </h3>
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                onDelete(task.task_id);
                            }}
                            className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 hover:bg-rose-50 text-gray-300 hover:text-rose-400 rounded-md transition-all"
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>

                    {/* Description */}
                    {task.description && (
                        <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
                            {task.description}
                        </p>
                    )}

                    {/* Footer */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        {/* Assignees */}
                        {task.assigned_users && task.assigned_users.length > 0 ? (
                            <div className="flex -space-x-1.5">
                                {task.assigned_users.slice(0, 3).map(user => (
                                    <div
                                        key={user.user_id}
                                        className="w-5 h-5 rounded-full border-2 border-white bg-indigo-500 flex items-center justify-center text-[8px] font-bold text-white"
                                        title={user.username}
                                    >
                                        {user.username[0].toUpperCase()}
                                    </div>
                                ))}
                                {task.assigned_users.length > 3 && (
                                    <div className="w-5 h-5 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-500">
                                        +{task.assigned_users.length - 3}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-[11px] text-gray-300">
                                <Users size={11} />
                                <span>Unassigned</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    );
}
