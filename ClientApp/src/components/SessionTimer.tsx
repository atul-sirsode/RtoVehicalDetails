import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function SessionTimer()
{
    const { sessionExpiresAt, logout } = useAuth();
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() =>
    {
        if (!sessionExpiresAt) return;

        const updateTimer = () =>
        {
            const now = Date.now();
            const remaining = sessionExpiresAt - now;

            if (remaining <= 0)
            {
                setTimeLeft('Expired');
                logout();
                return;
            }

            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

            if (hours > 0)
            {
                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            } else if (minutes > 0)
            {
                setTimeLeft(`${minutes}m ${seconds}s`);
            } else
            {
                setTimeLeft(`${seconds}s`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [sessionExpiresAt, logout]);

    if (!sessionExpiresAt) return null;

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-foreground/10 rounded-lg border border-primary-foreground/20">
            <Clock className="w-4 h-4 text-primary-foreground/70" />
            <div className="text-xs text-primary-foreground/70">
                <span className="block leading-none">Session</span>
                <span className="font-mono font-semibold text-primary-foreground">{timeLeft}</span>
            </div>
        </div>
    );
}
