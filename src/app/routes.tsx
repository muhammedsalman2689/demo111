import { createBrowserRouter } from 'react-router';
import { MyProjectsPage } from './pages/MyProjectsPage';
import { ProjectDashboardPage } from './pages/ProjectDashboardPage';
import { RoomPage } from './pages/RoomPage';
import { ElementPage } from './pages/ElementPage';
import { CapturePage } from './pages/CapturePage';
import { NotFoundPage } from './pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: MyProjectsPage,
  },
  {
    path: '/project/:projectId',
    Component: ProjectDashboardPage,
  },
  {
    path: '/project/:projectId/room/:roomId',
    Component: RoomPage,
  },
  {
    path: '/project/:projectId/room/:roomId/element/:elementId',
    Component: ElementPage,
  },
  {
    path: '/project/:projectId/room/:roomId/element/:elementId/capture',
    Component: CapturePage,
  },
  {
    path: '*',
    Component: NotFoundPage,
  },
]);
