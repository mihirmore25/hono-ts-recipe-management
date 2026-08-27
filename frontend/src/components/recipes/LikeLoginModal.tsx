import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

interface LikeLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LikeLoginModal = ({ isOpen, onClose }: LikeLoginModalProps) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="like-login-title"
                className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-xl sm:p-8"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <Heart size={22} />
                </div>
                <h2
                    id="like-login-title"
                    className="mt-4 text-xl font-semibold text-slate-900"
                >
                    Sign in to like recipes
                </h2>
                <p className="mt-3 text-slate-600">
                    Log in to show your appreciation and keep track of recipes
                    you love.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Not now
                    </button>
                    <Link
                        to="/login"
                        className="rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600"
                    >
                        Log in
                    </Link>
                </div>
            </div>
        </div>
    );
};
