import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { BreadcrumbProvider } from "@/contexts/BreadcrumbContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ClassroomDetail from "./pages/ClassroomDetail";
import AssignmentDetail from "./pages/AssignmentDetail";
import GroupDetail from "./pages/GroupDetail";
import ProgressDemo from "./pages/ProgressDemo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <BreadcrumbProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/classrooms/:classroomId"
            element={
              <ProtectedRoute>
                <ClassroomDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/assignments/:assignmentId"
            element={
              <ProtectedRoute>
                <AssignmentDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/assignments/:assignmentId/groups/:groupId"
            element={
              <ProtectedRoute>
                <GroupDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress-demo"
            element={
              <ProtectedRoute>
                <ProgressDemo />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BreadcrumbProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
