import axios from "axios";

export interface LikeRecipeResponse {
    status: boolean;
    message: string;
    alreadyLiked?: boolean;
    data?: {
        likes: number;
    };
}

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1",
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
    }

    return config;
});

export const authApi = {
    register: (payload: {
        username: string;
        email: string;
        password: string;
    }) => api.post("/auth/register", payload),
    login: (payload: { email: string; password: string }) =>
        api.post("/auth/login", payload),
    logout: () => api.post("/auth/logout"),
    forgotPassword: (payload: { email: string }) =>
        api.post("/auth/forgotPassword", payload),
    resetPassword: (token: string, payload: { password: string }) =>
        api.post(`/auth/resetPassword/${token}`, payload),
};

export const recipeApi = {
    generate: (idea: string) =>
        api.post("/recipes/ai/generate", { idea }),
    list: (page = 1, limit = 9, search = "") =>
        api.get("/recipes", { params: { page, limit, search } }),
    get: (id: string) => api.get(`/recipes/${id}`),
    create: (formData: FormData) =>
        api.post("/recipes", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }),
    update: (id: string, formData: FormData) =>
        api.put(`/recipes/${id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }),
    remove: (id: string) => api.delete(`/recipes/${id}`),
    userRecipes: (id: string, page = 1, limit = 9, search = "") =>
        api.get(`/recipes/user/${id}`, { params: { page, limit, search } }),
    like: (id: string) => api.post<LikeRecipeResponse>(`/recipes/${id}/like`),
};

export const adminApi = {
    listUsers: () => api.get("/admin/users/getUsers"),
    getUser: (id: string) => api.get(`/admin/users/getUser/${id}`),
    deleteUser: (id: string) => api.delete(`/admin/users/deleteUser/${id}`),
    createUser: (payload: {
        username: string;
        email: string;
        password: string;
        role: string;
    }) => api.post("/admin/users/createUser", payload),
};

export const userApi = {
    getProfile: () => api.get("/users/me"),
    updateProfile: (id: string, formData: FormData) =>
        api.put(`/users/${id}/profile`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }),
};

export default api;
