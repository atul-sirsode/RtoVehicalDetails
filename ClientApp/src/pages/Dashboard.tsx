import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Truck, FileSpreadsheet, RefreshCw, Info, AlertTriangle, LogOut, Search } from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { DataTable } from '@/components/DataTable';
import { StatsCards } from '@/components/StatsCards';
import { ProcessingStatus } from '@/components/ProcessingStatus';
import { SessionTimer } from '@/components/SessionTimer';
import { ParseResult } from '@/lib/file-parser';
import { RCTableRow } from '@/types/rc-verification';
import { getMockRCData, transformRCDataToTableRow, createPendingRow, verifyRC } from '@/lib/rc-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard = () =>
{
    const { logout, username } = useAuth();
    const [data, setData] = useState<RCTableRow[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processedCount, setProcessedCount] = useState(0);
    const [failedCount, setFailedCount] = useState(0);
    const [showApiWarning, setShowApiWarning] = useState(false);
    const [rcSearchInput, setRcSearchInput] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const handleFileProcessed = useCallback(async (result: ParseResult) =>
    {
        if (!result.success || result.rcNumbers.length === 0) return;

        // Create pending rows for all RC numbers
        const pendingRows = result.rcNumbers.map((rc, index) =>
            createPendingRow(rc, `${Date.now()}-${index}`)
        );

        setData(pendingRows);
        setIsProcessing(true);
        setProcessedCount(0);
        setFailedCount(0);

        // Process each RC number
        // NOTE: Using mock data since the actual API requires backend proxy due to CORS
        // Replace this with actual API calls through your backend
        for (let i = 0; i < pendingRows.length; i++)
        {
            const row = pendingRows[i];

            // Update status to processing
            setData(prev => prev.map(r =>
                r.id === row.id ? { ...r, status: 'processing' as const } : r
            ));

            try
            {
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));

                const response = await verifyRC(row.rc_number);

                if (response.status && response?.data?.data)
                {
                    const transformedRow = transformRCDataToTableRow(response?.data?.data, row.id);
                    setData(prev => prev.map(r =>
                        r.id === row.id ? transformedRow : r
                    ));
                } else
                {
                    setData(prev => prev.map(r =>
                        r.id === row.id ? { ...r, status: 'error' as const, errorMessage: response?.data?.message } : r
                    ));
                    setFailedCount(prev => prev + 1);
                }
            } catch (error)
            {
                setData(prev => prev.map(r =>
                    r.id === row.id ? {
                        ...r,
                        status: 'error' as const,
                        errorMessage: error instanceof Error ? error.message : 'Unknown error'
                    } : r
                ));
                setFailedCount(prev => prev + 1);
            }

            setProcessedCount(i + 1);
        }

        setIsProcessing(false);
    }, []);

    const handleReset = () =>
    {
        setData([]);
        setProcessedCount(0);
        setFailedCount(0);
        setIsProcessing(false);
        setRcSearchInput('');
    };

    const handleSingleRCSearch = useCallback(async () =>
    {
        const trimmedRC = rcSearchInput.trim().toUpperCase();
        if (!trimmedRC) return;

        setIsSearching(true);
        const rowId = `search-${Date.now()}`;
        const pendingRow = createPendingRow(trimmedRC, rowId);

        // Add to existing data or create new
        setData(prev =>
        {
            const existingIndex = prev.findIndex(r => r.rc_number.toUpperCase() === trimmedRC);
            if (existingIndex >= 0)
            {
                // Update existing row to processing
                return prev.map((r, i) => i === existingIndex ? { ...r, status: 'processing' as const } : r);
            }
            return [{ ...pendingRow, status: 'processing' as const }, ...prev];
        });

        try
        {
            await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
            
            const response = await verifyRC(trimmedRC);

            if (response.status && response.data)
            {
                const transformedRow = transformRCDataToTableRow(response?.data?.data, rowId);
                setData(prev =>
                {
                    const existingIndex = prev.findIndex(r => r.rc_number.toUpperCase() === trimmedRC);
                    if (existingIndex >= 0)
                    {
                        return prev.map((r, i) => i === existingIndex ? transformedRow : r);
                    }
                    return prev.map(r => r.id === rowId ? transformedRow : r);
                });
            } else
            {
                setData(prev => prev.map(r =>
                    r.rc_number.toUpperCase() === trimmedRC ? { ...r, status: 'error' as const, errorMessage: response.message } : r
                ));
            }
        } catch (error)
        {
            setData(prev => prev.map(r =>
                r.rc_number.toUpperCase() === trimmedRC ? {
                    ...r,
                    status: 'error' as const,
                    errorMessage: error instanceof Error ? error.message : 'Unknown error'
                } : r
            ));
        }

        setIsSearching(false);
        setRcSearchInput('');
    }, [rcSearchInput]);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="gradient-header border-b border-border/10">
                <div className="container mx-auto px-4 py-6">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                                <Truck className="w-6 h-6 text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-primary-foreground">
                                    RC Verification Dashboard
                                </h1>
                                <p className="text-sm text-primary-foreground/70">
                                    Vehicle Registration Certificate Lookup
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {username && (
                                <span className="text-sm text-primary-foreground/80">
                                    Welcome, {username}
                                </span>
                            )}

                            <SessionTimer />

                            {data.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleReset}
                                    className="gap-2 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    New Upload
                                </Button>
                            )}

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={logout}
                                className="gap-2 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="space-y-6">
                    {/* API Warning */}
                    {showApiWarning && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Alert className="border-warning/50 bg-warning/10">
                                <AlertTriangle className="h-4 w-4 text-warning" />
                                <AlertTitle className="text-warning">Backend Required for Production</AlertTitle>
                                <AlertDescription className="text-muted-foreground">
                                    This dashboard currently uses mock data. For production use, you'll need to set up a backend proxy (Node.js, Next.js, or C#) to call the RC verification API due to CORS restrictions.
                                    <button
                                        onClick={() => setShowApiWarning(false)}
                                        className="ml-2 underline hover:no-underline text-primary"
                                    >
                                        Dismiss
                                    </button>
                                </AlertDescription>
                            </Alert>
                        </motion.div>
                    )}

                    {/* Stats Cards */}
                    <StatsCards data={data} />

                    {/* RC Number Search */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="max-w-2xl mx-auto"
                    >
                        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <Search className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold text-foreground">Search Single RC Number</h3>
                            </div>
                            <div className="flex gap-3">
                                <Input
                                    type="text"
                                    placeholder="Enter RC Number (e.g., MH12AB1234)"
                                    value={rcSearchInput}
                                    onChange={(e) => setRcSearchInput(e.target.value.toUpperCase())}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSingleRCSearch()}
                                    className="flex-1"
                                    disabled={isSearching || isProcessing}
                                />
                                <Button
                                    onClick={handleSingleRCSearch}
                                    disabled={!rcSearchInput.trim() || isSearching || isProcessing}
                                    className="gap-2"
                                >
                                    {isSearching ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Search className="w-4 h-4" />
                                    )}
                                    Search
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                    {/* File Upload */}
                    {data.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="max-w-2xl mx-auto"
                        >
                            <div className="text-center mb-6">
                                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
                                    <div className="h-px w-16 bg-border" />
                                    <span className="text-sm">OR</span>
                                    <div className="h-px w-16 bg-border" />
                                </div>
                                <h2 className="text-2xl font-bold text-foreground mb-2">
                                    Upload Your Vehicle Data
                                </h2>
                                <p className="text-muted-foreground">
                                    Import a CSV or Excel file containing RC numbers to verify vehicle registration details
                                </p>
                            </div>
                            <FileUpload onFileProcessed={handleFileProcessed} isProcessing={isProcessing} />

                            <div className="mt-6 p-4 bg-muted/50 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                    <div className="text-sm text-muted-foreground">
                                        <p className="font-medium text-foreground mb-1">File Requirements</p>
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>File must contain a column named "RC_Number", "RC Number", or similar</li>
                                            <li>Supported formats: CSV, XLSX, XLS</li>
                                            <li>Each row should contain one RC number</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Processing Status */}
                    {data.length > 0 && (
                        <ProcessingStatus
                            total={data.length}
                            processed={processedCount}
                            failed={failedCount}
                            isProcessing={isProcessing}
                        />
                    )}

                    {/* Data Table */}
                    {data.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <FileSpreadsheet className="w-5 h-5 text-primary" />
                                <h2 className="text-lg font-semibold text-foreground">
                                    Verification Results
                                </h2>
                            </div>
                            <DataTable data={data} />
                        </motion.div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-border py-6 mt-12">
                <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                    <p>RC Verification Dashboard • Vehicle Registration Certificate Lookup System</p>
                </div>
            </footer>
        </div>
    );
};

export default Dashboard;
