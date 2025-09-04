import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from './lib/i18n';
import { AppProvider } from './contexts/AppContext';
import { TutorialProvider } from './contexts/TutorialContext';

import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { serviceWorkerManager } from './utils/serviceWorker';
import TouchGestureProvider from './components/TouchGestureProvider';

// Lazy loading de todas las páginas
const Index = lazy(() => import('./pages/Index'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const PoliticaPrivacidad = lazy(() => import('./pages/PoliticaPrivacidad'));
const TerminosCondiciones = lazy(() => import('./pages/TerminosCondiciones'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Admin = lazy(() => import('./pages/Admin'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const ProyectosNuevo = lazy(() => import('./pages/ProyectosNuevo'));

const CollaborationPage = lazy(() => import('./pages/CollaborationPage'));
const ClientCollaborationPage = lazy(() => import('./pages/ClientCollaborationPage'));
const AdminCollaborationPage = lazy(() => import('./pages/AdminCollaborationPage'));

const WorkspacePage = lazy(() => import('./pages/WorkspacePage'));
const Perfil = lazy(() => import('./pages/Perfil'));
const UserProfileView = lazy(() => import('./pages/UserProfileView'));
const Configuracion = lazy(() => import('./pages/Configuracion'));
const Facturacion = lazy(() => import('./pages/Facturacion'));
const Soporte = lazy(() => import('./pages/Soporte'));
const Team = lazy(() => import('./pages/Team'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdvancedAnalytics = lazy(() => import('./components/AdvancedAnalytics'));
const RealTimeCharts = lazy(() => import('./components/AdvancedCharts/RealTimeCharts'));
const CustomizableDashboard = lazy(() => import('./components/CustomizableDashboard'));
const AdvancedUserManagement = lazy(() => import('./components/AdvancedUserManagement'));
const InvitationPage = lazy(() => import('./pages/InvitationPage'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const EnvironmentVariables = lazy(() => import('./pages/EnvironmentVariables'));

// Componente de carga optimizado
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600">Cargando...</p>
    </div>
  </div>
);

// QueryClient con configuración optimizada
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (reemplaza cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Componente para inicializar Service Worker
const ServiceWorkerInitializer = () => {
  useEffect(() => {
    // Registrar service worker en producción
    if (process.env.NODE_ENV === 'production') {
      serviceWorkerManager.register().then((registration) => {
        if (registration) {
          console.log('🚀 Service Worker registrado para cache offline');
        }
      });
    }
  }, []);

  return null;
};

function AppRoutes() {
  return (
      <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/politica-privacidad" element={<PoliticaPrivacidad />} />
        <Route path="/terminos-condiciones" element={<TerminosCondiciones />} />
      <Route path="/invite" element={<InvitationPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Rutas protegidas */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/admin" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Admin />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      {/* Rutas del dashboard del cliente */}
      <Route path="/proyectos" element={
        <ProtectedRoute>
          <DashboardLayout key="proyectos">
            <ProjectsPage key="proyectos-content" />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/proyectos/:userId" element={
        <ProtectedRoute>
          <DashboardLayout key="proyectos-user">
            <ProjectsPage key="proyectos-user-content" />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/perfil" element={
        <ProtectedRoute>
          <DashboardLayout key="perfil">
            <Perfil key="perfil-content" />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/perfil/:userId" element={
        <ProtectedRoute>
          <DashboardLayout key="user-profile">
            <UserProfileView key="user-profile-content" />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/configuracion" element={
        <ProtectedRoute>
          <DashboardLayout key="configuracion">
            <Configuracion key="configuracion-content" />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/facturacion" element={
        <ProtectedRoute>
          <DashboardLayout key="facturacion">
            <Facturacion key="facturacion-content" />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/soporte" element={
        <ProtectedRoute>
          <DashboardLayout key="soporte">
            <Soporte key="soporte-content" />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/proyectos/nuevo" element={
        <ProtectedRoute>
          <DashboardLayout>
            <ProyectosNuevo />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/proyectos/:projectId/colaboracion" element={
        <ProtectedRoute>
          <DashboardLayout>
            <CollaborationPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/proyectos/:projectId/colaboracion-cliente" element={
        <ProtectedRoute>
          <DashboardLayout>
            <ClientCollaborationPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/proyectos/:projectId/colaboracion-admin" element={
        <ProtectedRoute>
          <DashboardLayout>
            <AdminCollaborationPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/workspace" element={
        <ProtectedRoute>
          <DashboardLayout>
            <WorkspacePage />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      

      
      <Route path="/team" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Team />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/environment" element={
        <ProtectedRoute>
          <DashboardLayout>
            <EnvironmentVariables />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/analytics" element={
        <ProtectedRoute>
          <DashboardLayout>
            <AdvancedAnalytics />
          </DashboardLayout>
        </ProtectedRoute>
      } />
        
      <Route path="/dashboard-custom" element={
        <ProtectedRoute>
          <DashboardLayout>
            <CustomizableDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/user-management" element={
        <ProtectedRoute>
          <DashboardLayout>
            <AdvancedUserManagement />
          </DashboardLayout>
        </ProtectedRoute>
      } />
        
      {/* Ruta 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <TooltipProvider>
              <AppProvider>
                <TutorialProvider>
                                  <Router 
                 basename={import.meta.env.BASE_URL || '/'}
                 future={{
                   v7_startTransition: false,
                   v7_relativeSplatPath: false
                 }}
               >
                <TouchGestureProvider enableNavigationGestures={true} enableGlobalGestures={true}>
                  <ServiceWorkerInitializer />
                  <Suspense fallback={<PageLoader />}>
                    <AppRoutes />
                  </Suspense>
                  <Toaster />
                  <Sonner />
                </TouchGestureProvider>
              </Router>
                </TutorialProvider>
              </AppProvider>
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </I18nextProvider>
    </ErrorBoundary>
  );
}

export default App;
