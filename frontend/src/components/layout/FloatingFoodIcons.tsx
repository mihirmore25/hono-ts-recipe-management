import {
    ChefHat,
    Coffee,
    Croissant,
    Pizza,
    Salad,
    Soup,
    type LucideIcon,
} from "lucide-react";

interface FloatingFood {
    Icon: LucideIcon;
    left: string;
    top: string;
    size: number;
    color: string;
    delay: string;
    duration: string;
}

interface FloatingFoodIconsProps {
    className?: string;
    mobileCount?: number;
    desktopOpacity?: number;
    mobileOpacity?: number;
    desktopSizeOffset?: number;
    mobileSizeOffset?: number;
    desktopFilter?: string;
    mobileFilter?: string;
}

const floatingFoods: FloatingFood[] = [
    { Icon: Soup, left: "6%", top: "16%", size: 20, color: "#f59e0b", delay: "0s", duration: "8s" },
    { Icon: Coffee, left: "18%", top: "65%", size: 17, color: "#fb7185", delay: "1.1s", duration: "9.5s" },
    { Icon: Pizza, left: "28%", top: "28%", size: 19, color: "#f97316", delay: "0.8s", duration: "9s" },
    { Icon: Salad, left: "42%", top: "18%", size: 18, color: "#22c55e", delay: "2s", duration: "9.8s" },
    { Icon: Croissant, left: "52%", top: "72%", size: 20, color: "#fbbf24", delay: "1.8s", duration: "10.5s" },
    { Icon: ChefHat, left: "64%", top: "36%", size: 18, color: "#a78bfa", delay: "2.7s", duration: "9.2s" },
    { Icon: Soup, left: "76%", top: "14%", size: 17, color: "#fbbf24", delay: "1.4s", duration: "8.4s" },
    { Icon: Coffee, left: "84%", top: "62%", size: 16, color: "#f472b6", delay: "2.5s", duration: "10s" },
    { Icon: Pizza, left: "90%", top: "32%", size: 19, color: "#fb923c", delay: "3s", duration: "9.6s" },
    { Icon: Salad, left: "12%", top: "80%", size: 16, color: "#4ade80", delay: "3.4s", duration: "10.8s" },
    { Icon: Croissant, left: "34%", top: "82%", size: 18, color: "#facc15", delay: "2.3s", duration: "11s" },
    { Icon: ChefHat, left: "72%", top: "78%", size: 17, color: "#c084fc", delay: "4s", duration: "10.2s" },
    { Icon: Pizza, left: "8%", top: "40%", size: 18, color: "#fb923c", delay: "3.8s", duration: "9.6s" },
    { Icon: Croissant, left: "22%", top: "6%", size: 16, color: "#facc15", delay: "1.2s", duration: "8.8s" },
    { Icon: Coffee, left: "44%", top: "60%", size: 18, color: "#f472b6", delay: "2.1s", duration: "10.6s" },
    { Icon: Salad, left: "58%", top: "8%", size: 17, color: "#22c55e", delay: "0.6s", duration: "9.2s" },
    { Icon: Soup, left: "88%", top: "72%", size: 18, color: "#fbbf24", delay: "3.2s", duration: "11s" },
];

export const FloatingFoodIcons = ({
    className = "",
    mobileCount = 5,
    desktopOpacity = 0.45,
    mobileOpacity = 0.34,
    desktopSizeOffset = 0,
    mobileSizeOffset = -2,
    desktopFilter = "drop-shadow(0 10px 16px rgba(15, 23, 42, 0.12))",
    mobileFilter = "drop-shadow(0 8px 12px rgba(15, 23, 42, 0.1))",
}: FloatingFoodIconsProps) => {
    const renderIcon = (
        food: FloatingFood,
        index: number,
        sizeOffset: number,
        opacity: number,
        filter: string,
        suffix: string,
    ) => {
        const { Icon, left, top, size, color, delay, duration } = food;

        return (
            <div
                key={`${index}-${suffix}`}
                className="floating-food absolute"
                style={{
                    left,
                    top,
                    color,
                    opacity,
                    animationDelay: delay,
                    animationDuration: duration,
                    transform: "translate3d(0,0,0)",
                    filter,
                }}
            >
                <Icon size={size + sizeOffset} strokeWidth={1.8} />
            </div>
        );
    };

    return (
        <>
            <style>{`
                @keyframes foodFloat {
                    0% { transform: translate3d(0, 0, 0) rotate(0deg); opacity: 0.1; }
                    15% { opacity: 0.32; }
                    35% { transform: translate3d(18px, -14px, 0) rotate(8deg); opacity: 0.48; }
                    55% { transform: translate3d(-22px, -28px, 0) rotate(-8deg); opacity: 0.4; }
                    75% { transform: translate3d(28px, -10px, 0) rotate(10deg); opacity: 0.34; }
                    100% { transform: translate3d(-14px, 16px, 0) rotate(-6deg); opacity: 0.1; }
                }
                .floating-food {
                    animation: foodFloat ease-in-out infinite;
                    will-change: transform, opacity;
                }
            `}</style>
            <div className={`pointer-events-none absolute inset-0 hidden overflow-hidden sm:block ${className}`}>
                {floatingFoods.map((food, index) =>
                    renderIcon(food, index, desktopSizeOffset, desktopOpacity, desktopFilter, "desktop"),
                )}
            </div>
            <div className={`pointer-events-none absolute inset-0 block overflow-hidden sm:hidden ${className}`}>
                {floatingFoods.slice(0, mobileCount).map((food, index) =>
                    renderIcon(food, index, mobileSizeOffset, mobileOpacity, mobileFilter, "mobile"),
                )}
            </div>
        </>
    );
};
