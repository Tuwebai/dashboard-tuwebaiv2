import React from 'react';
import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAvatarSync } from '@/hooks/useAvatarSync';
import SkipLink from './SkipLink';
import LiveRegion from './LiveRegion';
import { useAccessibility } from '@/hooks/useAccessibility';
import { userPreferencesService } from '@/lib/userPreferencesService';
import TutorialOverlay from './tutorial/TutorialOverlay';
import HelpButton from './tutorial/HelpButton';
import { FloatingHelpButton } from './tutorial/ContextualHelp';

interface DashboardLayoutProps {
  children: React.ReactNode;
  dashboardProps?: {
    searchTerm?: string;
    onSearch?: (term: string) => void;
    stats?: {
      totalProjects: number;
      totalComments: number;
      inProgressProjects: number;
      completedProjects: number;
    };
    onRefresh?: () => void;
  };
}

const WIDGETS = [
  { key: 'projects', label: 'Proyectos' },
  { key: 'stats', label: 'Estadísticas' },
  { key: 'team', label: 'Equipo' },
  { key: 'help', label: 'Ayuda' },
];

export default function DashboardLayout({ children, dashboardProps }: DashboardLayoutProps) {
  const { isAuthenticated, loading, user } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [visibleWidgets, setVisibleWidgets] = useState<string[]>(() => {
    const saved = localStorage.getItem('dashboard_widgets');
    return saved ? JSON.parse(saved) : WIDGETS.map(w => w.key);
  });
  const [widgetsLoaded, setWidgetsLoaded] = useState(false);
  const location = useLocation();
  
  // Configurar accesibilidad
  const { announceToScreenReader } = useAccessibility({
    enableKeyboardNavigation: true,
    enableScreenReader: true,
    enableFocusManagement: true
  });
  
  // SOLUCIÓN FINAL: Key dinámico basado en la ruta actual
  const routeKey = location.pathname.replace(/\//g, '-').substring(1) || 'root';

  // Sincronizar avatar automáticamente
  useAvatarSync();

  // Cargar widgets del usuario desde la base de datos
  useEffect(() => {
    const loadUserWidgets = async () => {
      if (isAuthenticated && user && !widgetsLoaded) {
        try {
          const userWidgets = await userPreferencesService.getDashboardWidgets(user.id);
          if (userWidgets.length > 0) {
            setVisibleWidgets(userWidgets);
          }
          setWidgetsLoaded(true);
        } catch (error) {
          console.error('Error loading user widgets:', error);
          setWidgetsLoaded(true);
        }
      } else if (!isAuthenticated) {
        setWidgetsLoaded(true);
      }
    };

    loadUserWidgets();
  }, [isAuthenticated, user, widgetsLoaded]);

  useEffect(() => {
    // Guardar en localStorage como fallback
    localStorage.setItem('dashboard_widgets', JSON.stringify(visibleWidgets));
    
    // Guardar en base de datos si el usuario está autenticado
    if (isAuthenticated && user && widgetsLoaded) {
      userPreferencesService.saveDashboardWidgets(user.id, visibleWidgets).catch(error => {
        console.error('Error saving user widgets:', error);
      });
    }
  }, [visibleWidgets, isAuthenticated, user, widgetsLoaded]);

  // Anunciar cambios de página a lectores de pantalla
  useEffect(() => {
    const pageTitle = document.title || 'Dashboard TuWebAI';
    announceToScreenReader(`Navegando a ${pageTitle}`, 'polite');
  }, [location.pathname, announceToScreenReader]);

  // Cerrar sidebar móvil al cambiar de página
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
            role="status"
            aria-label="Cargando..."
          ></div>
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Redirigir solo si no está autenticado y no está cargando
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Detectar si estamos en la página de admin o dashboard del cliente
  const isAdminPage = location.pathname === '/admin';
  const isClientDashboardPage = location.pathname === '/dashboard';

  // Función para refrescar datos (solo para admin)
  const handleRefreshData = () => {
    if (isAdminPage) {
      window.location.reload();
    }
  };

  return (
    <>
      {/* Skip Link para accesibilidad */}
      <SkipLink targetId="main-content" />
      
      {/* Live Region para anuncios a lectores de pantalla */}
      <LiveRegion 
        message=""
        priority="polite"
        autoClear={true}
        clearDelay={3000}
      />
      
      <div key={routeKey} className="h-screen w-full bg-background flex">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Mobile sidebar overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div 
              className="fixed inset-0 bg-black/50" 
              onClick={() => setIsMobileMenuOpen(false)}
              role="button"
              tabIndex={0}
              aria-label="Cerrar menú móvil"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setIsMobileMenuOpen(false);
                }
              }}
            />
            <div className="relative">
              <Sidebar />
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden w-full">
          <Topbar 
            onMenuClick={() => setIsMobileMenuOpen(true)}
            showMobileMenu={true}
            onRefreshData={isAdminPage ? handleRefreshData : undefined}
            lastUpdate={isAdminPage || isClientDashboardPage ? new Date() : undefined}
            isAdmin={isAdminPage}
            isClientDashboard={isClientDashboardPage}
            clientDashboardStats={isClientDashboardPage && dashboardProps?.stats ? dashboardProps.stats : undefined}
            onClientRefresh={isClientDashboardPage && dashboardProps?.onRefresh ? dashboardProps.onRefresh : undefined}
            onClientSearch={isClientDashboardPage && dashboardProps?.onSearch ? dashboardProps.onSearch : undefined}
            clientSearchTerm={isClientDashboardPage && dashboardProps?.searchTerm ? dashboardProps.searchTerm : ''}
          />
          <main id="main-content" className="flex-1 overflow-y-auto w-full">
            {children}
          </main>
        </div>
        
        {/* Sistema de Tutorial y Ayuda */}
        <TutorialOverlay />
        <FloatingHelpButton />
      </div>
    </>
  );
}
