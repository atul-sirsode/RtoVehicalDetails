import { useState, useEffect, useCallback } from 'react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface OTPVerificationProps
{
    maskedPhone?: string;
    onVerify: (otp: string) => Promise<void>;
    onResend: () => Promise<void>;
    isVerifying: boolean;
}

const OTP_TIMER_SECONDS = 30;

export function OTPVerification({
    maskedPhone = 'XXXXXX1495',
    onVerify,
    onResend,
    isVerifying,
}: OTPVerificationProps)
{
    const [otp, setOtp] = useState('');
    const [timeLeft, setTimeLeft] = useState(OTP_TIMER_SECONDS);
    const [canResend, setCanResend] = useState(false);
    const [isResending, setIsResending] = useState(false);

    useEffect(() =>
    {
        if (timeLeft <= 0)
        {
            setCanResend(true);
            return;
        }

        const timer = setInterval(() =>
        {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    const handleResend = useCallback(async () =>
    {
        setIsResending(true);
        try
        {
            await onResend();
            setTimeLeft(OTP_TIMER_SECONDS);
            setCanResend(false);
            setOtp('');
        } finally
        {
            setIsResending(false);
        }
    }, [onResend]);

    const handleOTPComplete = useCallback(
        async (value: string) =>
        {
            if (value.length === 4)
            {
                await onVerify(value);
            }
        },
        [onVerify]
    );

    return (
        <Card className="w-full max-w-md border-0 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-bold text-primary">OTP</CardTitle>
                <p className="text-muted-foreground mt-2">
                    Please enter the code sent to mobile no. {maskedPhone}
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex justify-center">
                    <InputOTP
                        maxLength={4}
                        value={otp}
                        onChange={(value) =>
                        {
                            setOtp(value);
                            if (value.length === 4)
                            {
                                handleOTPComplete(value);
                            }
                        }}
                        disabled={isVerifying}
                    >
                        <InputOTPGroup className="gap-3">
                            <InputOTPSlot
                                index={0}
                                className="w-14 h-14 text-xl border-2 rounded-lg bg-background"
                            />
                            <InputOTPSlot
                                index={1}
                                className="w-14 h-14 text-xl border-2 rounded-lg bg-background"
                            />
                            <InputOTPSlot
                                index={2}
                                className="w-14 h-14 text-xl border-2 rounded-lg bg-background"
                            />
                            <InputOTPSlot
                                index={3}
                                className="w-14 h-14 text-xl border-2 rounded-lg bg-background"
                            />
                        </InputOTPGroup>
                    </InputOTP>
                </div>

                <div className="text-center">
                    {!canResend ? (
                        <p className="text-lg font-semibold text-primary">
                            Time left : {timeLeft} s
                        </p>
                    ) : (
                        <Button
                            variant="link"
                            onClick={handleResend}
                            disabled={isResending}
                            className="text-primary font-semibold"
                        >
                            {isResending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                'Resend OTP'
                            )}
                        </Button>
                    )}
                </div>

                <Button
                    className="w-full"
                    size="lg"
                    onClick={() => handleOTPComplete(otp)}
                    disabled={otp.length !== 4 || isVerifying}
                >
                    {isVerifying ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                        </>
                    ) : (
                        'Verify OTP'
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
