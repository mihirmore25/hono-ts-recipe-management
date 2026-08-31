interface RecipePaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const RecipePagination = ({
    page,
    totalPages,
    onPageChange,
}: RecipePaginationProps) => {
    if (totalPages <= 1) return null;

    return (
        <div className="mt-8 flex items-center justify-center gap-3">
            <button
                type="button"
                disabled={page === 1}
                onClick={() => onPageChange(page - 1)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
                Previous
            </button>
            <span className="text-sm font-medium text-slate-600">
                Page {page} of {totalPages}
            </span>
            <button
                type="button"
                disabled={page === totalPages}
                onClick={() => onPageChange(page + 1)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
                Next
            </button>
        </div>
    );
};
