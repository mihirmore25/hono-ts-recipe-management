import { useEffect, useState } from "react";
import { Trash2, UserCog2 } from "lucide-react";
import { Link } from "react-router-dom";
import { adminApi } from "../../utils/api";
import type { User } from "../../types";

export const AdminUsersPage = () => {
    const [users, setUsers] = useState<User[]>([]);

    const loadUsers = async () => {
        const response = await adminApi.listUsers();
        setUsers(response.data?.data ?? []);
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleDelete = async (userId: string) => {
        await adminApi.deleteUser(userId);
        await loadUsers();
    };

    return (
        <div className="min-h-screen bg-slate-50 px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
            <div className="mx-auto max-w-6xl rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[2rem] sm:p-8 lg:p-10">
                <div className="mb-6 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
                            Admin panel
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                            Manage users
                        </h1>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-[1.25rem] border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                    User
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                    Email
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                    Role
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {users.map((user) => (
                                <tr key={user._id}>
                                    <td className="px-4 py-3 text-sm text-slate-700">
                                        <div className="flex items-center gap-2">
                                            <UserCog2 size={16} />{" "}
                                            <Link
                                                to={`/profile/${user._id ?? user.id ?? ""}`}
                                                className="font-medium text-slate-700 hover:text-amber-600"
                                            >
                                                {user.username}
                                            </Link>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700">
                                        {user.email}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700">
                                        {user.role ?? "user"}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <button
                                            onClick={() =>
                                                handleDelete(user._id!)
                                            }
                                            className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-3 py-2 font-medium text-white hover:bg-rose-600"
                                        >
                                            <Trash2 size={15} /> Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
