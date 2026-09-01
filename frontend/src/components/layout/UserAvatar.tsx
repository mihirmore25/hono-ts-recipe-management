import { useState } from "react";
import { UserCircle2 } from "lucide-react";

interface UserAvatarProps {
    username: string;
    imageUrl?: string;
    sizeClassName: string;
    iconSize: number;
}

export const UserAvatar = ({
    username,
    imageUrl,
    sizeClassName,
    iconSize,
}: UserAvatarProps) => {
    const [hasImageError, setHasImageError] = useState(false);

    if (!imageUrl || hasImageError) {
        return (
            <span
                className={`${sizeClassName} inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-600`}
            >
                <UserCircle2 size={iconSize} aria-hidden="true" />
            </span>
        );
    }

    return (
        <img
            src={imageUrl}
            alt={`${username} profile`}
            className={`${sizeClassName} rounded-full object-cover`}
            onError={() => setHasImageError(true)}
        />
    );
};
