import { Link } from "react-router-dom";

export const NotFoundPage = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <h1 className="text-5xl font-extrabold mb-4">
                404 — Page Not Found
            </h1>
            <p className="text-lg mb-6">
                The page you're looking for doesn't exist.
            </p>
            <Link to="/" className="text-blue-600 underline">
                Go back home
            </Link>
        </div>
    );
};

export default NotFoundPage;
