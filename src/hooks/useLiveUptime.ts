import { useState, useEffect } from 'react';

export function formatDuration(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (hrs > 0) { parts.push(`${hrs}h`); }
    if (mins > 0 || hrs > 0) { parts.push(`${mins}m`); }
    parts.push(`${secs}s`);

    return parts.join(' ');
}

export function uptimeColor(uptime: string): string {
    // Optional: parse into seconds if needed
    const regex = /(?:(\d+)h)? ?(?:(\d+)m)? ?(?:(\d+)s)?/;
    const match = uptime.match(regex);
    if (!match) { return 'black'; }

    const hours = parseInt(match[1] || '0', 10);
    return hours >= 1 ? 'red' : 'black'; // Red if uptime is 1h+
}


export function useLiveUptime(startTime: Date | null): string {
    const [uptime, setUptime] = useState('—');

    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;

        if (startTime) {
            timer = setInterval(() => {
                const seconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
                setUptime(formatDuration(seconds));
            }, 1000);
        }

        return () => {
            clearInterval(timer);
            setUptime('—');
        };
    }, [startTime]);

    return uptime;
}
