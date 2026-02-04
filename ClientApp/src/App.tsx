import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode })
{
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated)
    {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode })
{
    const { isAuthenticated } = useAuth();

    if (isAuthenticated)
    {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

function AppRoutes()
{
    return (
        <Routes>
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Index />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/login"
                element={
                    <PublicRoute>
                        <Login />
                    </PublicRoute>
                }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <BrowserRouter>
                <AuthProvider>
                    <Toaster />
                    <Sonner />
                    <AppRoutes />
                </AuthProvider>
            </BrowserRouter>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;
