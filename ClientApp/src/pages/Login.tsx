import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { requestLoginOTP, verifyLoginOTP } from '@/lib/auth-api';
import { OTPVerification } from '@/components/OTPVerification';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Car, Shield } from 'lucide-react';

type LoginStep = 'credentials' | 'otp';

export default function Login()
{
    const [step, setStep] = useState<LoginStep>('credentials');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [maskedMobile, setMaskedMobile] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleRequestOTP = async (e?: React.FormEvent) =>
    {
        e?.preventDefault();

        if (!username.trim() || !password.trim())
        {
            toast({
                title: 'Error',
                description: 'Please enter both username and password',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);
        try
        {
            const response = await requestLoginOTP(username, password);
            console.log("response", response);
            console.log("response.data", response.data);
            if (response.status)
            {
                const mobile = response.data?.data?.mobile || 'XXXXXX****';
                setMaskedMobile(mobile);
                toast({
                    title: 'OTP Sent',
                    description: `Please check your mobile ${mobile} for the OTP`,
                });
                setStep('otp');
            } else
            {
                toast({
                    title: 'Error',
                    description: response?.data?.message || 'Failed to send OTP',
                    variant: 'destructive',
                });
            }
        } catch (error)
        {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to send OTP',
                variant: 'destructive',
            });
        } finally
        {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (otp: string) =>
    {
        setIsVerifying(true);
        try
        {
            const response = await verifyLoginOTP(username, password, otp);

            if (response.status && response.data.access_token)
            {
                toast({
                    title: 'Success',
                    description: 'Login successful!',
                });
                login(username, response?.data?.access_token, response?.data?.expires_in || 86400);
                navigate('/');
            } else
            {
                toast({
                    title: 'Error',
                    description: response?.data?.message || 'Invalid OTP',
                    variant: 'destructive',
                });
            }
        } catch (error)
        {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Verification failed',
                variant: 'destructive',
            });
        } finally
        {
            setIsVerifying(false);
        }
    };

    const handleResendOTP = async () =>
    {
        try
        {
            const response = await requestLoginOTP(username, password);
            if (response.status)
            {
                const mobile = response.data?.mobile || maskedMobile;
                setMaskedMobile(mobile);
                toast({
                    title: 'OTP Resent',
                    description: `A new OTP has been sent to ${mobile}`,
                });
            } else
            {
                toast({
                    title: 'Error',
                    description: response.message || 'Failed to resend OTP',
                    variant: 'destructive',
                });
            }
        } catch (error)
        {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to resend OTP',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <Car className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">RC Verification System</h1>
                    <p className="text-muted-foreground mt-1">Vehicle Registration Data Dashboard</p>
                </div>

                {step === 'credentials' ? (
                    <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
                        <CardHeader className="text-center">
                            <CardTitle className="flex items-center justify-center gap-2">
                                <Shield className="w-5 h-5 text-primary" />
                                Login
                            </CardTitle>
                            <CardDescription>
                                Enter your credentials to access the dashboard
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleRequestOTP} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username">Username</Label>
                                    <Input
                                        id="username"
                                        type="text"
                                        placeholder="Enter your username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        disabled={isLoading}
                                        autoComplete="username"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoading}
                                        autoComplete="current-password"
                                    />
                                </div>
                                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending OTP...
                                        </>
                                    ) : (
                                        'Send OTP'
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                ) : (
                    <OTPVerification
                        maskedPhone={maskedMobile}
                        onVerify={handleVerifyOTP}
                        onResend={handleResendOTP}
                        isVerifying={isVerifying}
                    />
                )}

                {step === 'otp' && (
                    <Button
                        variant="ghost"
                        className="w-full mt-4 text-muted-foreground"
                        onClick={() => setStep('credentials')}
                    >
                        ← Back to Login
                    </Button>
                )}
            </div>
        </div>
    );
}
