export const formatDuration = (minutes: number) => {
    const totalMinutes = Math.round(Number(minutes));

    if (!Number.isFinite(totalMinutes) || totalMinutes < 60) {
        return `${minutes} min`;
    }

    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    const hourLabel = hours === 1 ? "hour" : "hours";

    return `${hours} ${hourLabel}${remainingMinutes ? ` ${remainingMinutes} min` : ""}`;
};
