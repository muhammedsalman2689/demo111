import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { MyProjectsPage } from "./pages/MyProjectsPage";
import { ProjectDashboardPage } from "./pages/ProjectDashboardPage";
import { RoomPage } from "./pages/RoomPage";
import { ElementPage } from "./pages/ElementPage";
import { CapturePage } from "./pages/CapturePage";
import { MeasurementPage } from "./pages/MeasurementPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./context/AuthContext";

// Protected Route Wrapper
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        Loading...
      </div>
    ); // Or a nice spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

// Public Route Wrapper (redirects to /projects if already logged in)
const PublicRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        Loading...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/projects" replace />;
  }

  return <Outlet />;
};

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <Navigate to="/projects" replace />,
      },
      {
        path: "/projects", // Changed from / to /projects to align with user request to "redirect to projects page"
        Component: MyProjectsPage,
      },
      {
        path: "/project/:projectId",
        Component: ProjectDashboardPage,
      },
      {
        path: "/project/:projectId/room/:roomId",
        Component: RoomPage,
      },
      {
        path: "/project/:projectId/room/:roomId/element/:elementId",
        Component: ElementPage,
      },
      {
        path: "/project/:projectId/room/:roomId/element/:elementId/measure",
        Component: MeasurementPage,
      },
      {
        path: "/project/:projectId/room/:roomId/element/:elementId/capture",
        Component: CapturePage,
      },
    ],
  },
  {
    path: "*",
    Component: NotFoundPage,
  },
]);
