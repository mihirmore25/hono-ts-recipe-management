import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const RecipePageNavigation = () => {
    const navigate = useNavigate();

    return (
        <nav className="flex gap-2" aria-label="Recipe page navigation">
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
                <ChevronLeft size={16} /> Back
            </button>
            <button
                type="button"
                onClick={() => navigate(1)}
                className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
                Forward <ChevronRight size={16} />
            </button>
        </nav>
    );
};
