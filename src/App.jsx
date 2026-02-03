import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./features/auth/AuthContext";
import { ToastProvider } from "./components/ui/Toast";
import ProtectedRoute from "./features/auth/ProtectedRoute";
import Login from "./pages/Login";
import Home from "./pages/Home";
import History from "./pages/History";
import SharedShelf from "./pages/SharedShelf";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import AppUrlListener from "./components/AppUrlListener";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
        <BrowserRouter>
          <AppUrlListener />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/u/:userId" element={<SharedShelf />} />
            <Route path="/u/:userId/stats" element={<Stats />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
             <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
             <Route
              path="/stats"
              element={
                <ProtectedRoute>
                  <Stats />
                </ProtectedRoute>
              }
            />
             <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
