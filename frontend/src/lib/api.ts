import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;

export const authApi = {
    login: (data: any) => api.post('/auth/login', data),
    register: (data: any) => api.post('/auth/register', data),
};

export const boardApi = {
    getBoards: () => api.get('/boards'),
    getBoardMembers: (id: number) => api.get(`/boards/${id}/members`),
    createBoard: (name: string) => api.post('/boards', { name }),
    updateBoard: (id: number, name: string) => api.patch(`/boards/${id}`, { name }),
    deleteBoard: (id: number) => api.delete(`/boards/${id}`),
    inviteMember: (id: number, username: string) => api.post(`/boards/${id}/invite`, { username }),
};

export const columnApi = {
    getColumns: (board_id: number) => api.get(`/columns/board/${board_id}`),
    createColumn: (board_id: number, name: string, position: number) => 
        api.post(`/columns/board/${board_id}`, { name, position }),
    updateColumn: (id: number, name?: string, position?: number) => 
        api.patch(`/columns/${id}`, { name, position }),
    deleteColumn: (id: number) => api.delete(`/columns/${id}`),
};

export const taskApi = {
    getTasks: (column_id: number) => api.get(`/tasks/column/${column_id}`),
    createTask: (column_id: number, data: any) => api.post(`/tasks/column/${column_id}`, data),
    updateTask: (id: number, data: any) => api.patch(`/tasks/${id}`, data),
    deleteTask: (id: number) => api.delete(`/tasks/${id}`),
    assignTask: (id: number, user_id: number) => api.post(`/tasks/${id}/assign`, { user_id }),
    unassignTask: (id: number, user_id: number) => api.delete(`/tasks/${id}/assign`, { data: { user_id } }),
};

export const notificationApi = {
    getNotifications: () => api.get('/notifications'),
    markAsRead: (id: number) => api.patch(`/notifications/${id}/read`),
};
