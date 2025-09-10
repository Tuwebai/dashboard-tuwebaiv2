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

// Función helper para manejar errores en imports dinámicos
const createLazyComponent = (importFn: () => Promise<any>) => {
  return lazy(() => 
    importFn().catch((error) => {
      console.error('Error loading component:', error);
      // Retornar un componente de error como fallback
      return {
        default: () => (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-red-800 mb-2">Error de Carga</h2>
              <p className="text-red-600 mb-4">No se pudo cargar el componente</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Recargar Página
              </button>
            </div>
          </div>
        )
      };
    })
  );
};

// Lazy loading de todas las páginas con manejo de errores
const Index = createLazyComponent(() => import('./pages/Index'));
const Login = createLazyComponent(() => import('./pages/Login'));
const Register = createLazyComponent(() => import('./pages/Register'));
const PoliticaPrivacidad = createLazyComponent(() => import('./pages/PoliticaPrivacidad'));
const TerminosCondiciones = createLazyComponent(() => import('./pages/TerminosCondiciones'));
const Dashboard = createLazyComponent(() => import('./pages/Dashboard'));
const Admin = createLazyComponent(() => import('./pages/Admin'));
const WebsyAI = createLazyComponent(() => import('./pages/WebsyAI'));
const ProjectsPage = createLazyComponent(() => import('./pages/ProjectsPage'));
const ProyectosNuevo = createLazyComponent(() => import('./pages/ProyectosNuevo'));

const CollaborationPage = createLazyComponent(() => import('./pages/CollaborationPage'));
const ClientCollaborationPage = createLazyComponent(() => import('./pages/ClientCollaborationPage'));
const AdminCollaborationPage = createLazyComponent(() => import('./pages/AdminCollaborationPage'));
const PhasesAndTasksPage = createLazyComponent(() => import('./pages/PhasesAndTasksPage'));
const AdminPhasesAndTasksPage = createLazyComponent(() => import('./pages/AdminPhasesAndTasksPage'));

const WorkspacePage = createLazyComponent(() => import('./pages/WorkspacePage'));
const Perfil = createLazyComponent(() => import('./pages/Perfil'));
const UserProfileView = createLazyComponent(() => import('./pages/UserProfileView'));
const Configuracion = createLazyComponent(() => import('./pages/Configuracion'));
const Facturacion = createLazyComponent(() => import('./pages/Facturacion'));
const Soporte = createLazyComponent(() => import('./pages/Soporte'));
const Team = createLazyComponent(() => import('./pages/Team'));
const NotFound = createLazyComponent(() => import('./pages/NotFound'));
const AdvancedAnalytics = createLazyComponent(() => import('./components/AdvancedAnalytics'));
const RealTimeCharts = createLazyComponent(() => import('./components/AdvancedCharts/RealTimeCharts'));
const CustomizableDashboard = createLazyComponent(() => import('./components/CustomizableDashboard'));
const AdvancedUserManagement = createLazyComponent(() => import('./components/AdvancedUserManagement'));
const InvitationPage = createLazyComponent(() => import('./pages/InvitationPage'));
const AuthCallback = createLazyComponent(() => import('./pages/AuthCallback'));
const GitHubCallback = createLazyComponent(() => import('./pages/GitHubCallback'));
const EnvironmentVariables = createLazyComponent(() => import('./pages/EnvironmentVariables'));

// Componente de carga optimizado con retry
const PageLoader = () => {
  const [retryCount, setRetryCount] = React.useState(0);
  const [showRetry, setShowRetry] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowRetry(true);
    }, 10000); // Mostrar retry después de 10 segundos

    return () => clearTimeout(timer);
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setShowRetry(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Cargando...</p>
        {showRetry && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">¿Tarda mucho en cargar?</p>
            <button 
              onClick={handleRetry}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
            >
              Reintentar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

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
          // Service Worker registrado para cache offline
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
      <Route path="/auth/github/callback" element={<GitHubCallback />} />
      
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
      
      <Route path="/admin/websy-ai" element={
        <ProtectedRoute>
          <WebsyAI />
        </ProtectedRoute>
      } />
      
      <Route path="/admin/fases-tareas" element={
        <ProtectedRoute>
          <DashboardLayout>
            <AdminPhasesAndTasksPage />
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
      
      <Route path="/fases-tareas" element={
        <ProtectedRoute>
          <DashboardLayout key="fases-tareas">
            <PhasesAndTasksPage key="fases-tareas-content" />
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
