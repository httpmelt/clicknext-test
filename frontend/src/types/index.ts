export interface User {
    user_id: number;
    username: string;
    email: string;
}

export interface Board {
    board_id: number;
    name: string;
    owner_id: number;
    created_at: string;
    member_count?: number;
    members?: User[];
}

export interface Column {
    column_id: number;
    board_id: number;
    name: string;
    position: number;
}

export interface Task {
    task_id: number;
    column_id: number;
    title: string;
    description: string;
    position: number;
    tags: string[];
    assigned_users: User[];
}

export interface Notification {
    notification_id: number;
    user_id: number;
    message: string;
    link?: string;
    is_read: boolean;
    created_at: string;
}
