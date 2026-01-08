import { createBrowserRouter } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import HomePage from '@/pages/HomePage';
import TrainingPage from '@/pages/TrainingPage';
import TrainingSettingsPage from '@/pages/TrainingSettingsPage';
import CyclesPage from '@/pages/CyclesPage';
import GymPage from '@/pages/GymPage';
import CompetitionPage from '@/pages/CompetitionPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import AthletesPage from '@/pages/AthletesPage';
import AthletesSettingsPage from '@/pages/AthletesSettingsPage';
import UsersPage from '@/pages/UsersPage';

import LoginPage from '@/pages/LoginPage';

export const router = createBrowserRouter([
    {
        path: '/login',
        element: <LoginPage />,
    },
    {
        path: '/',
        element: <DashboardLayout />,
        children: [
            {
                index: true,
                element: <HomePage />,
            },
            {
                path: 'training',
                element: <TrainingPage />,
            },
            {
                path: 'training/:id',
                element: <TrainingPage />,
            },
            {
                path: 'training/:id/session',
                element: <TrainingPage />,
            },
            {
                path: 'training/settings',
                element: <TrainingSettingsPage />,
            },
            {
                path: 'cycles',
                element: <CyclesPage />,
            },
            {
                path: 'gym',
                element: <GymPage />,
            },
            {
                path: 'gym/:id',
                element: <GymPage />,
            },
            {
                path: 'gym/:id/session',
                element: <GymPage />,
            },
            {
                path: 'competitions',
                element: <CompetitionPage />,
            },
            {
                path: 'analytics',
                element: <AnalyticsPage />,
            },
            {
                path: 'athletes',
                element: <AthletesPage />,
            },
            {
                path: 'athletes/settings',
                element: <AthletesSettingsPage />,
            },
            {
                path: 'users',
                element: <UsersPage />,
            },
        ],
    },
]);

