import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from 'react-i18next';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';


import { 
  Users, 
  FolderOpen, 
  Ticket, 
  CreditCard, 
    BarChart3,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  UserCog,
  Cog,
  FileText,
  Activity,
  Download
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { notificationService } from '@/lib/notificationService';
import { ProjectsManagement } from '@/components/admin/ProjectsManagement';
import AdminNotifications from '@/pages/AdminNotifications';
import NotificationBell from '@/components/admin/NotificationBell';
import ExecutiveCharts from '@/components/admin/ExecutiveCharts';
import AutomationSystem from '@/components/admin/AutomationSystem';
import AdvancedTicketManager from '@/components/AdvancedTicketManager';
import AutoVersionCreator from '@/components/admin/AutoVersionCreator';
import AdvancedTools from '@/components/admin/AdvancedTools';
import { VersionManagement } from '@/components/admin/VersionManagement';
import ProjectApprovalManager from '@/components/ProjectApprovalManager';



import { ChartDashboard, RealTimeCharts } from '@/components/AdvancedCharts';




const Admin = React.memo(() => {
  const { t } = useTranslation();
  const { user } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [pagos, setPagos] = useState<any[]>([]);
  const [comentario, setComentario] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // Estados para funciones avanzadas del admin
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newUserData, setNewUserData] = useState({
    email: '',
    full_name: '',
    role: 'cliente'
  });

  const [initialDataLoaded, setInitialDataLoaded] = useState(false);


  // Cargar datos desde Supabase
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar usuarios con información adicional
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (usersError) {
        console.error('❌ Error cargando usuarios:', usersError);
        throw usersError;
      }
      
      setUsuarios(usersData || []);

      // Cargar proyectos con información detallada
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (projectsError) {
        console.error('❌ Error cargando proyectos:', projectsError);
        throw projectsError;
      }
      setProyectos(projectsData || []);

      // Cargar tickets con prioridades
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (ticketsError) {
        console.error('❌ Error cargando tickets:', ticketsError);
        throw ticketsError;
      }
      setTickets(ticketsData || []);

      // Cargar pagos con información financiera
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (paymentsError) {
        console.error('❌ Error cargando pagos:', paymentsError);
        throw paymentsError;
      }
      setPagos(paymentsData || []);

    } catch (error) {
        console.error('Error fatal cargando datos del admin:', error);
      toast({ title: 'Error', description: 'No se pudieron cargar los datos.', variant: 'destructive' });
    } finally {
      setLoading(false);
      setLastUpdate(new Date());
    }
  };

  // Función para actualizar datos en tiempo real
  const refreshData = async () => {
    await loadData();
    setLastUpdate(new Date());
    toast({ title: 'Actualizado', description: 'Datos actualizados correctamente.' });
  };







  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    // Evitar múltiples ejecuciones de loadData
    if (initialDataLoaded) {
      return;
    }

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      setActiveSection(hash || 'dashboard');
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);

    // Marcar como cargado antes de ejecutar loadData
    setInitialDataLoaded(true);
    loadData();
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [user, navigate, initialDataLoaded, location.pathname]);

  // useEffect adicional para manejar cambios de hash después del montaje
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      setActiveSection(hash || 'dashboard');
    };

    // Establecer la sección inicial
    handleHashChange();

    // Agregar listener para cambios de hash
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [user]);

  // MÉTRICAS AVANZADAS
  const usuariosActivos = usuarios.length;
  const usuariosNuevos = usuarios.filter(u => {
    const userDate = new Date(u.created_at);
    const currentDate = new Date();
    return userDate.getMonth() === currentDate.getMonth() && 
           userDate.getFullYear() === currentDate.getFullYear();
  }).length;
  
  const proyectosTotales = proyectos.length;
  const proyectosNuevos = proyectos.filter(p => {
    const projectDate = new Date(p.created_at);
    const currentDate = new Date();
    return projectDate.getMonth() === currentDate.getMonth() && 
           projectDate.getFullYear() === currentDate.getFullYear();
  }).length;
  const proyectosEnCurso = proyectos.filter(p => p.status !== 'completed').length;
  const proyectosCompletados = proyectos.filter(p => p.status === 'completed').length;
  const proyectosPendientes = proyectos.filter(p => p.status === 'pending').length;
  const proyectosEnDesarrollo = proyectos.filter(p => p.status === 'development').length;
  
  const ingresosTotales = pagos.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const ingresosEsteMes = pagos.filter(p => {
    const paymentDate = new Date(p.created_at);
    const currentMonth = new Date();
    return paymentDate.getMonth() === currentMonth.getMonth() && 
           paymentDate.getFullYear() === currentMonth.getFullYear();
  }).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  
  const ticketsAbiertos = tickets.filter(t => t.status !== 'closed').length;
  const ticketsCerrados = tickets.filter(t => t.status === 'closed').length;
  const ticketsUrgentes = tickets.filter(t => t.priority === 'high' && t.status !== 'closed').length;
  const ticketsEnProgreso = tickets.filter(t => t.status === 'in_progress').length;
  
  // Cálculo de tasas y porcentajes
  const tasaCompletacionProyectos = proyectos.length > 0 ? Math.round((proyectosCompletados / proyectos.length) * 100) : 0;
  const tasaResolucionTickets = tickets.length > 0 ? Math.round((ticketsCerrados / tickets.length) * 100) : 0;
  const crecimientoUsuarios = usuarios.length > 0 ? Math.round((usuariosNuevos / usuarios.length) * 100) : 0;

  // Funciones de gestión
  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Actualizar el estado local en lugar de recargar todo
      setUsuarios(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      // Crear notificación automática
      await notificationService.createNotification({
        title: 'Rol de Usuario Actualizado',
        message: `El rol del usuario ha sido cambiado a ${newRole}`,
        type: 'info',
        user_id: userId,
        category: 'user'
      });
      
      toast({ title: 'Éxito', description: 'Rol de usuario actualizado correctamente.' });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar el rol del usuario.', variant: 'destructive' });
    }
  };

  const updateProjectStatus = async (projectId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId);
      
      if (error) throw error;
      
      // Actualizar el estado local en lugar de recargar todo
      setProyectos(prev => prev.map(project => 
        project.id === projectId ? { ...project, status: newStatus } : project
      ));
      
      // Crear notificación automática
      await notificationService.createNotification({
        title: 'Estado de Proyecto Actualizado',
        message: `El proyecto ha sido marcado como ${newStatus}`,
        type: 'info',
        user_id: user.id,
        category: 'project'
      });
      
      toast({ title: 'Éxito', description: 'Estado del proyecto actualizado correctamente.' });
    } catch (error) {
      console.error('Error updating project status:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar el estado del proyecto.', variant: 'destructive' });
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);
      
      if (error) throw error;
      
      // Actualizar el estado local en lugar de recargar todo
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
      ));
      
      // Crear notificación automática
      await notificationService.createNotification({
        title: 'Estado de Ticket Actualizado',
        message: `El ticket ha sido marcado como ${newStatus}`,
        type: 'info',
        user_id: user.id,
        category: 'ticket'
      });
      
      toast({ title: 'Éxito', description: 'Estado del ticket actualizado correctamente.' });
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar el estado del ticket.', variant: 'destructive' });
    }
  };

  const updatePaymentStatus = async (paymentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: newStatus })
        .eq('id', paymentId);
      
      if (error) throw error;
      
      // Actualizar el estado local en lugar de recargar todo
      setPagos(prev => prev.map(payment => 
        payment.id === paymentId ? { ...payment, status: newStatus } : payment
      ));
      
      // Crear notificación automática
      await notificationService.createNotification({
        title: 'Estado de Pago Actualizado',
        message: `El pago ha sido marcado como ${newStatus}`,
        type: 'info',
        user_id: user.id,
        category: 'payment'
      });
      
      toast({ title: 'Éxito', description: 'Estado del pago actualizado correctamente.' });
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar el estado del pago.', variant: 'destructive' });
    }
  };

  // Función para editar un usuario
  const handleEditUser = (user: any) => {
    // Asegurar que el usuario tenga un rol válido
    const userWithRole = {
      ...user,
      role: user.role || 'cliente'
    };
    setEditingUser(userWithRole);
    setShowEditUserModal(true);
  };

  // Función para eliminar un usuario
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', userId);

        if (error) throw error;

        // Actualizar el estado local
        setUsuarios(prev => prev.filter(user => user.id !== userId));

        toast({ 
          title: 'Usuario eliminado', 
          description: 'El usuario ha sido eliminado correctamente.' 
        });
      } catch (error) {
        console.error('Error deleting user:', error);
        toast({ 
          title: 'Error', 
          description: 'No se pudo eliminar el usuario.', 
          variant: 'destructive' 
        });
      }
    }
  };

  // Función para crear un nuevo usuario
  const handleCreateUser = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          email: newUserData.email,
          full_name: newUserData.full_name,
          role: newUserData.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Agregar el nuevo usuario al estado local
      setUsuarios(prev => [data, ...prev]);

      // Limpiar el formulario
      setNewUserData({ email: '', full_name: '', role: 'cliente' });
      setShowAddUserModal(false);

      toast({ 
        title: 'Usuario creado', 
        description: 'El usuario ha sido creado correctamente.' 
      });
    } catch (error) {
      console.error('Error creating user:', error);
      toast({ 
        title: 'Error', 
        description: 'No se pudo crear el usuario.', 
        variant: 'destructive' 
      });
    }
  };

  // Función para actualizar un usuario existente
  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          email: editingUser.email,
          full_name: editingUser.full_name,
          role: editingUser.role || 'cliente',
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      // Actualizar el estado local
      setUsuarios(prev => prev.map(user => 
        user.id === editingUser.id ? editingUser : user
      ));

      setShowEditUserModal(false);
      setEditingUser(null);

      toast({ 
        title: 'Usuario actualizado', 
        description: 'El usuario ha sido actualizado correctamente.' 
      });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({ 
        title: 'Error', 
        description: 'No se pudo actualizar el usuario.', 
        variant: 'destructive' 
      });
    }
  };

  // Función para probar permisos y políticas RLS
  const testUserPermissions = async () => {
    try {
      toast({ title: 'Info', description: 'Verificando permisos del usuario...' });
      
      // 1. Verificar usuario autenticado
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      // 2. Verificar usuario en la tabla users
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser?.id)
        .single();
      
      if (userError) {
        toast({ title: 'Error', description: 'Error verificando permisos.', variant: 'destructive' });
        return;
      }
      
      toast({ 
        title: 'Permisos Verificados', 
        description: `Usuario: ${currentUser?.email} | Rol: ${currentUser?.role}`,
        variant: 'success'
      });
      
    } catch (error) {
      toast({ title: 'Error', description: 'Error verificando permisos.', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="flex-1 overflow-hidden">
           <div className="h-full">
             
 
 
                           {/* Contenido Principal */}
              <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 min-h-[calc(100vh-120px)]">

              {activeSection === 'dashboard' && (
                <>
                  {/* Cards de Estadísticas Principales - Solo en Dashboard */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            
            {/* Card Usuarios */}
            <div className="relative group cursor-pointer">
                      <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-border/50 backdrop-blur-sm overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-primary/15">
                        <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                          <Users size={24} className="sm:w-7 sm:h-7" />
                </div>
                        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-card-foreground mb-2 group-hover:scale-105 transition-transform duration-300">
                  {usuariosActivos}
                </div>
                        <div className="text-sm sm:text-lg font-semibold text-slate-600 mb-1">
                  Usuarios Activos
                </div>
                        <div className="text-xs sm:text-sm text-slate-500 flex items-center space-x-1">
                  <span className="text-green-600 font-semibold">+{usuariosNuevos}</span>
                  <span>este mes ({crecimientoUsuarios}%)</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
              </div>
            </div>

            {/* Card Proyectos */}
            <div className="relative group cursor-pointer">
                      <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-border/50 backdrop-blur-sm overflow-hidden bg-gradient-to-br from-emerald-500/5 via-emerald-500/10 to-teal-500/15">
                        <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                          <FolderOpen size={24} className="sm:w-7 sm:h-7" />
                </div>
                        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-card-foreground mb-2 group-hover:scale-105 transition-transform duration-300">
                  {proyectosTotales}
                </div>
                        <div className="text-sm sm:text-lg font-semibold text-slate-600 mb-1">
                  Proyectos Totales
                </div>
                        <div className="text-xs sm:text-sm text-slate-500 flex items-center space-x-1">
                  <span className="text-green-600 font-semibold">+{proyectosNuevos}</span>
                  <span>este mes</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
              </div>
            </div>

            {/* Card Tickets */}
            <div className="relative group cursor-pointer">
                      <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-border/50 backdrop-blur-sm overflow-hidden bg-gradient-to-br from-amber-500/5 via-amber-500/10 to-orange-500/15">
                        <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                          <Ticket size={24} className="sm:w-7 sm:h-7" />
                </div>
                        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-card-foreground mb-2 group-hover:scale-105 transition-transform duration-300">
                  {ticketsAbiertos}
                </div>
                        <div className="text-sm sm:text-lg font-semibold text-slate-600 mb-1">
                  Tickets Abiertos
                </div>
                        <div className="text-xs sm:text-sm text-slate-500 flex items-center space-x-1">
                  <span className="text-red-600 font-semibold">{ticketsUrgentes}</span>
                  <span>urgentes, </span>
                  <span className="text-blue-600 font-semibold">{ticketsEnProgreso}</span>
                  <span>en progreso</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
              </div>
            </div>

            {/* Card Ingresos */}
            <div className="relative group cursor-pointer">
                      <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-border/50 backdrop-blur-sm overflow-hidden bg-gradient-to-br from-violet-500/5 via-violet-500/10 to-purple-500/15">
                        <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br from-violet-500 to-violet-600 text-white">
                          <DollarSign size={24} className="sm:w-7 sm:h-7" />
                </div>
                        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-card-foreground mb-2 group-hover:scale-105 transition-transform duration-300">
                  ${ingresosTotales.toLocaleString()}
                </div>
                        <div className="text-sm sm:text-lg font-semibold text-slate-600 mb-1">
                  Ingresos Totales
                </div>
                        <div className="text-xs sm:text-sm text-slate-500 flex items-center space-x-1">
                  <span className="text-green-600 font-semibold">${ingresosEsteMes.toLocaleString()}</span>
                  <span>este mes</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
              </div>
            </div>
          </div>

                  {/* Contenido del Dashboard */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                
                {/* Card Estadísticas Rápidas */}
                <div className="bg-card rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50">
                  <div className="text-2xl font-bold text-card-foreground mb-2 flex items-center space-x-3">
                    <BarChart3 size={24} className="text-blue-600" />
                    <span>Estadísticas Rápidas</span>
                  </div>
                  <p className="text-slate-500 text-base mb-8">
                    Vista general de la actividad del sistema
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-4 border-b border-border last:border-b-0 group hover:bg-muted/50 rounded-lg transition-all duration-200 px-4">
                      <span className="text-slate-600 font-medium flex items-center space-x-3">
                        <Users size={16} className="text-blue-500" />
                        <span>Usuarios totales:</span>
                      </span>
                      <Badge className="px-5 py-3 rounded-2xl text-base font-bold transition-all duration-200 bg-blue-500 text-white shadow-lg group-hover:bg-blue-600 group-hover:scale-105">
                        {usuariosActivos}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between py-4 border-b border-border last:border-b-0 group hover:bg-muted/50 rounded-lg transition-all duration-200 px-4">
                      <span className="text-slate-600 font-medium flex items-center space-x-3">
                        <Users size={16} className="text-green-500" />
                        <span>Nuevos este mes:</span>
                      </span>
                      <Badge className="px-5 py-3 rounded-2xl text-base font-bold transition-all duration-200 bg-emerald-500 text-white shadow-lg group-hover:bg-emerald-600 group-hover:scale-105">
                        +{usuariosNuevos}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between py-4 border-b border-border last:border-b-0 group hover:bg-muted/50 rounded-lg transition-all duration-200 px-4">
                      <span className="text-slate-600 font-medium flex items-center space-x-3">
                        <FolderOpen size={16} className="text-emerald-500" />
                        <span>Proyectos activos:</span>
                      </span>
                      <Badge className="px-5 py-3 rounded-2xl text-base font-bold transition-all duration-200 bg-emerald-500 text-white shadow-lg group-hover:bg-emerald-600 group-hover:scale-105">
                        {proyectosEnCurso}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between py-4 border-b border-border last:border-b-0 group hover:bg-muted/50 rounded-lg transition-all duration-200 px-4">
                      <span className="text-slate-600 font-medium flex items-center space-x-3">
                        <CheckCircle size={16} className="text-green-500" />
                        <span>Tasa éxito:</span>
                      </span>
                      <Badge className="px-5 py-3 rounded-2xl text-base font-bold transition-all duration-200 bg-green-500 text-white shadow-lg group-hover:bg-green-600 group-hover:scale-105">
                        {tasaCompletacionProyectos}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between py-4 border-b border-border last:border-b-0 group hover:bg-muted/50 rounded-lg transition-all duration-200 px-4">
                      <span className="text-slate-600 font-medium flex items-center space-x-3">
                        <Ticket size={16} className="text-amber-500" />
                        <span>Tickets abiertos:</span>
                      </span>
                      <Badge className="px-5 py-3 rounded-2xl text-base font-bold transition-all duration-200 bg-amber-500 text-white shadow-lg group-hover:bg-amber-600 group-hover:scale-105">
                        {ticketsAbiertos}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between py-4 border-b border-border last:border-b-0 group hover:bg-muted/50 rounded-lg transition-all duration-200 px-4">
                      <span className="text-slate-600 font-medium flex items-center space-x-3">
                        <Eye size={16} className="text-red-500" />
                        <span>Urgentes:</span>
                      </span>
                      <Badge className="px-5 py-3 rounded-2xl text-base font-bold transition-all duration-200 bg-red-500 text-white shadow-lg group-hover:bg-red-600 group-hover:scale-105">
                        {ticketsUrgentes}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between py-4 border-b border-border last:border-b-0 group hover:bg-muted/50 rounded-lg transition-all duration-200 px-4">
                      <span className="text-slate-600 font-medium flex items-center space-x-3">
                        <DollarSign size={16} className="text-violet-500" />
                        <span>Ingresos totales:</span>
                      </span>
                      <Badge className="px-5 py-3 rounded-2xl text-base font-bold transition-all duration-200 bg-violet-500 text-white shadow-lg group-hover:bg-violet-600 group-hover:scale-105">
                        ${ingresosTotales.toLocaleString()}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between py-4 border-b border-border last:border-b-0 group hover:bg-muted/50 rounded-lg transition-all duration-200 px-4">
                      <span className="text-slate-600 font-medium flex items-center space-x-3">
                        <Calendar size={16} className="text-blue-500" />
                        <span>Este mes:</span>
                      </span>
                      <Badge className="px-5 py-3 rounded-2xl text-base font-bold transition-all duration-200 bg-blue-500 text-white shadow-lg group-hover:bg-blue-600 group-hover:scale-105">
                        ${ingresosEsteMes.toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Card Acciones Rápidas */}
                <div className="bg-card rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50">
                  <div className="text-2xl font-bold text-card-foreground mb-2 flex items-center space-x-3">
                    <BarChart3 size={24} className="text-amber-600" />
                    <span>Acciones Rápidas</span>
                  </div>
                  <p className="text-slate-500 text-base mb-8">
                    Acceso directo a las funciones principales
                  </p>
                  <div className="space-y-10">
                                         <Button 
                       variant="outline" 
                       className="w-full justify-start p-6 rounded-2xl hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 transition-all duration-300 cursor-pointer group border border-transparent hover:border-border/50 hover:shadow-lg"
                       onClick={() => {
                         setActiveSection('usuarios');
                         window.location.hash = 'usuarios';
                       }}
                     >
                       <div className="flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 group-hover:scale-110 bg-blue-100 text-blue-600 group-hover:bg-blue-500 group-hover:text-white mr-6">
                         <Users size={28} />
                       </div>
                       <span className="text-slate-700 font-bold text-lg group-hover:text-slate-900 transition-colors duration-300">
                         Gestionar Usuarios
                       </span>
                       <Badge className="ml-auto px-5 py-3 rounded-2xl text-base font-bold transition-all duration-300 bg-blue-500 text-white shadow-lg group-hover:bg-blue-600 group-hover:scale-105">
                         {usuariosActivos}
                       </Badge>
                     </Button>
                                           <Button 
                        variant="outline" 
                        className="w-full justify-start p-6 rounded-2xl hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 transition-all duration-300 cursor-pointer group border border-transparent hover:border-border/50 hover:shadow-lg"
                        onClick={() => {
                          setActiveSection('proyectos');
                          window.location.hash = 'proyectos';
                        }}
                      >
                       <div className="flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 group-hover:scale-110 bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white mr-6">
                         <FolderOpen size={28} />
                       </div>
                       <span className="text-slate-700 font-bold text-lg group-hover:text-slate-900 transition-colors duration-300">
                         Ver Proyectos
                       </span>
                       <Badge className="ml-auto px-5 py-3 rounded-2xl text-base font-bold transition-all duration-300 bg-emerald-500 text-white shadow-lg group-hover:bg-emerald-600 group-hover:scale-105">
                         {proyectosEnCurso}
                       </Badge>
                     </Button>
                     <Button 
                       variant="outline" 
                       className="w-full justify-start p-6 rounded-2xl hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 transition-all duration-300 cursor-pointer group border border-transparent hover:border-border/50 hover:shadow-lg"
                       onClick={() => {
                         setActiveSection('tickets');
                         window.location.hash = 'tickets';
                       }}
                     >
                       <div className="flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 group-hover:scale-110 bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white mr-6">
                         <Ticket size={28} />
                       </div>
                       <span className="text-slate-700 font-bold text-lg group-hover:text-slate-900 transition-colors duration-300">
                         Revisar Tickets
                       </span>
                       <Badge className="ml-auto px-5 py-3 rounded-2xl text-base font-bold transition-all duration-300 bg-amber-500 text-white shadow-lg group-hover:bg-amber-600 group-hover:scale-105">
                         {ticketsAbiertos}
                       </Badge>
                     </Button>
                     <Button 
                       variant="outline" 
                       className="w-full justify-start p-6 rounded-2xl hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 transition-all duration-300 cursor-pointer group border border-transparent hover:border-border/50 hover:shadow-lg"
                       onClick={() => {
                         setActiveSection('pagos');
                         window.location.hash = 'pagos';
                       }}
                     >
                       <div className="flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 group-hover:scale-110 bg-violet-100 text-violet-600 group-hover:bg-violet-500 group-hover:text-white mr-6">
                         <CreditCard size={28} />
                       </div>
                       <span className="text-slate-700 font-bold text-lg group-hover:text-slate-900 transition-colors duration-300">
                         Gestionar Pagos
                       </span>
                       <Badge className="ml-auto px-5 py-3 rounded-2xl text-base font-bold transition-all duration-300 bg-violet-500 text-white shadow-lg group-hover:bg-violet-600 group-hover:scale-105">
                         {pagos.length}
                       </Badge>
                     </Button>
                     <Button 
                       variant="outline" 
                       className="w-full justify-start p-6 rounded-2xl hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 transition-all duration-300 cursor-pointer group border border-transparent hover:border-border/50 hover:shadow-lg"
                       onClick={() => {
                         setActiveSection('advanced-analytics');
                         window.location.hash = 'advanced-analytics';
                       }}
                     >
                       <div className="flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 group-hover:scale-110 bg-indigo-100 text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white mr-6">
                         <BarChart3 size={28} />
                       </div>
                       <span className="text-slate-700 font-bold text-lg group-hover:text-slate-900 transition-colors duration-300">
                         Analytics Avanzado
                       </span>
                       <Badge className="ml-auto px-5 py-3 rounded-2xl text-base font-bold transition-all duration-300 bg-indigo-500 text-white shadow-lg group-hover:bg-indigo-600 group-hover:scale-105">
                         <BarChart3 size={16} />
                       </Badge>
                     </Button>







                     <Button 
                       variant="outline" 
                       className="w-full justify-start p-6 rounded-2xl hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 transition-all duration-300 cursor-pointer group border border-transparent hover:border-border/50 hover:shadow-lg"
                       onClick={() => {
                         setActiveSection('advanced-charts');
                         window.location.hash = 'advanced-charts';
                       }}
                     >
                       <div className="flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 group-hover:scale-110 bg-pink-100 text-pink-600 group-hover:bg-pink-500 group-hover:text-white mr-6">
                         <BarChart3 size={28} />
                       </div>
                       <span className="text-slate-700 font-bold text-lg group-hover:text-slate-900 transition-colors duration-300">
                         Gráficos Avanzados
                       </span>
                       <Badge className="ml-auto px-5 py-3 rounded-2xl text-base font-bold transition-all duration-300 bg-pink-500 text-white shadow-lg group-hover:bg-pink-600 group-hover:scale-105">
                         <BarChart3 size={16} />
                       </Badge>
                     </Button>

                  </div>
                </div>
              </div>
              </>
            )}

            {/* Resto de las secciones mantienen su funcionalidad pero con diseño moderno */}
            {activeSection === 'usuarios' && (
                <div className="h-full flex flex-col">
                  <Card className="bg-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50 flex-1">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-2xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <Users size={20} className="sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div>
                            <span className="text-xl sm:text-2xl font-bold text-card-foreground">Gestión de Usuarios</span>
                            <p className="text-slate-600 text-xs sm:text-sm mt-1">Administra usuarios del sistema y sus roles</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Button
                            onClick={refreshData}
                            variant="outline"
                            size="sm"
                            className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 hover:from-emerald-100 hover:to-teal-100 text-emerald-700 hover:text-emerald-800 font-medium transition-all duration-200 shadow-sm hover:shadow-md px-3 sm:px-4 py-2 text-xs sm:text-sm"
                          >
                            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            Actualizar Datos
                          </Button>
                        </div>
                      </div>
                </CardHeader>
                    <CardContent className="p-4 sm:p-6 flex-1">
                    {loading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-slate-600 text-lg font-medium">Cargando usuarios...</p>
                        <p className="text-slate-400 text-sm mt-2">Obteniendo información del sistema</p>
                      </div>
                    ) : usuarios.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">No hay usuarios registrados</h3>
                        <p className="text-slate-500 mb-6">Los usuarios aparecerán aquí una vez que se carguen desde la base de datos</p>
                        <Button 
                          onClick={refreshData}
                          variant="outline"
                          className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 text-blue-700 hover:text-blue-800 px-6 py-2"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Intentar cargar usuarios
                        </Button>
                      </div>
                    ) : (
                  <div className="space-y-4">
                        {/* Header de la lista */}
                        <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-4 rounded-xl border border-border/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                <Users size={16} className="text-white" />
                              </div>
                              <span className="font-semibold text-slate-700">Lista de Usuarios ({usuarios.length})</span>
                            </div>
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1">
                              {usuarios.filter(u => u.role === 'admin').length} Admin • {usuarios.filter(u => u.role !== 'admin').length} Usuarios
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Lista de usuarios */}
                        {usuarios.map((usuario, index) => (
                          <div key={usuario.id} className="bg-gradient-to-r from-slate-50 to-white p-6 rounded-2xl hover:from-slate-100 hover:to-slate-50 transition-all duration-300 border border-border/50 hover:border-border/50 hover:shadow-lg group">
                            <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                                <div className="relative">
                                  {usuario.avatar_url ? (
                                    <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg group-hover:scale-110 transition-transform duration-300">
                                      <img 
                                        src={usuario.avatar_url} 
                                        alt={`Avatar de ${usuario.full_name || usuario.email}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          // Fallback a iniciales si la imagen falla
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          const fallback = target.nextElementSibling as HTMLElement;
                                          if (fallback) fallback.style.display = 'flex';
                                        }}
                                      />
                                      {/* Fallback a iniciales (oculto por defecto) */}
                                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg" style={{ display: 'none' }}>
                            {usuario.full_name?.charAt(0) || usuario.email?.charAt(0) || 'U'}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                                      {usuario.full_name?.charAt(0) || usuario.email?.charAt(0) || 'U'}
                                    </div>
                                  )}
                                  {usuario.role === 'admin' && (
                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                                      <span className="text-white text-xs font-bold">A</span>
                                    </div>
                                  )}
                          </div>
                          <div>
                                  <div className="font-bold text-card-foreground text-lg group-hover:text-slate-900 transition-colors duration-300">
                                    {usuario.full_name || 'Sin nombre'}
                          </div>
                                  <div className="text-slate-500 text-sm group-hover:text-slate-600 transition-colors duration-300">
                                    {usuario.email}
                        </div>
                                  <div className="flex items-center space-x-2 mt-2">
                                    <Badge 
                                      variant={usuario.role === 'admin' ? 'default' : 'secondary'}
                                      className="px-3 py-1 text-xs font-medium"
                                    >
                                      {usuario.role === 'admin' ? '👑 Administrador' : '👤 Cliente'}
                          </Badge>
                                    <span className="text-xs text-slate-400">
                                      ID: {usuario.id.slice(0, 8)}...
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-4">
                                {/* Selector de rol */}
                                <div className="flex items-center space-x-3">
                                  <span className="text-sm font-medium text-slate-600">Rol:</span>
                                  <Select 
                                    value={usuario.role || 'cliente'} 
                                    onValueChange={(value) => updateUserRole(usuario.id, value)}
                                  >
                                    <SelectTrigger className="w-32 bg-white border-border hover:border-border transition-colors duration-200 text-card-foreground font-medium">
                                      <SelectValue>
                                        {usuario.role === 'admin' ? '👑 Admin' : '👤 Cliente'}
                                      </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                      <SelectItem value="admin" className="flex items-center space-x-2 text-card-foreground">
                                        <span>👑</span>
                                        <span>Admin</span>
                                      </SelectItem>
                                      <SelectItem value="cliente" className="flex items-center space-x-2 text-card-foreground">
                                        <span>👤</span>
                                        <span>Cliente</span>
                                      </SelectItem>
                            </SelectContent>
                          </Select>
                                </div>
                                
                                {/* Botones de acción */}
                                <div className="flex items-center space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleEditUser(usuario)}
                                    className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 text-blue-700 hover:text-blue-800 transition-all duration-200 px-3 py-2 h-9"
                                  >
                                    <Edit size={14} className="mr-1" />
                                    Editar
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleDeleteUser(usuario.id)}
                                    className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200 hover:from-red-100 hover:to-pink-100 text-red-700 hover:text-red-800 transition-all duration-200 px-3 py-2 h-9"
                                  >
                                    <Trash2 size={14} className="mr-1" />
                                    Eliminar
                                  </Button>
                                </div>
                              </div>
                        </div>
                      </div>
                    ))}
                      </div>
                    )}
                    
                    {/* Botón para agregar usuario */}
                    <div className="mt-8">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start p-8 rounded-2xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 cursor-pointer group border-2 border-dashed border-blue-200 hover:border-blue-300 hover:shadow-lg bg-gradient-to-r from-blue-50/30 to-indigo-50/30"
                        onClick={() => setShowAddUserModal(true)}
                      >
                        <div className="flex items-center justify-center w-20 h-20 rounded-2xl transition-all duration-300 group-hover:scale-110 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg group-hover:from-blue-600 group-hover:to-indigo-700 mr-8">
                          <Plus size={32} />
                        </div>
                        <div className="text-left">
                          <span className="text-slate-700 font-bold text-xl group-hover:text-slate-900 transition-colors duration-300 block mb-2">
                            Agregar Nuevo Usuario
                          </span>
                          <span className="text-slate-500 group-hover:text-slate-600 transition-colors duration-300">
                            Crear un nuevo usuario en el sistema con permisos específicos
                          </span>
                        </div>
                      </Button>
                  </div>
                </CardContent>
              </Card>
              </div>
            )}

            {activeSection === 'proyectos' && (
              <ProjectsManagement />
            )}

            {activeSection === 'aprobar-proyectos' && (
              <ProjectApprovalManager 
                user={user} 
                onRefresh={() => {
                  loadData();
                  setLastUpdate(new Date());
                }} 
              />
            )}

            {activeSection === 'tickets' && (
              <AdvancedTicketManager />
            )}

            {activeSection === 'pagos' && (
                <div className="h-full flex flex-col">
                  <Card className="bg-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50 h-full">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-2xl">
                      <CardTitle className="text-xl sm:text-2xl font-bold text-card-foreground flex items-center space-x-3">
                        <CreditCard size={20} className="sm:w-6 sm:h-6 text-violet-600" />
                    <span>Gestión de Pagos</span>
                  </CardTitle>
                      <CardDescription className="text-slate-600 text-sm sm:text-base">
                    Administra pagos y transacciones del sistema
                  </CardDescription>
                </CardHeader>
                    <CardContent className="p-4 sm:p-6 flex-1">
                      {pagos.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-violet-100 to-violet-200 rounded-full flex items-center justify-center mx-auto mb-4">
                              <CreditCard className="h-8 w-8 sm:h-10 sm:w-10 text-violet-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">No hay pagos registrados</h3>
                            <p className="text-slate-500 text-sm">Los pagos aparecerán aquí cuando se registren</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 sm:space-y-4 flex-1 overflow-y-auto">
                    {pagos.map((pago) => (
                            <div key={pago.id} className="flex items-center justify-between p-3 sm:p-4 bg-muted/50 rounded-xl hover:bg-muted transition-all duration-200">
                              <div className="flex items-center space-x-3 sm:space-x-4">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-violet-500 to-violet-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                            $
                          </div>
                          <div>
                                  <div className="font-semibold text-card-foreground text-sm sm:text-base">${pago.amount}</div>
                                  <div className="text-xs sm:text-sm text-slate-500">{pago.description || 'Sin descripción'}</div>
                          </div>
                        </div>
                              <div className="flex items-center space-x-2 sm:space-x-3">
                                <Badge variant={pago.status === 'completed' ? 'default' : pago.status === 'pending' ? 'secondary' : 'destructive'} className="text-xs">
                            {pago.status || 'pending'}
                          </Badge>
                          <Select 
                            value={pago.status || 'pending'} 
                            onValueChange={(value) => updatePaymentStatus(pago.id, value)}
                          >
                                  <SelectTrigger className="w-24 sm:w-32 text-xs sm:text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pendiente</SelectItem>
                              <SelectItem value="completed">Completado</SelectItem>
                              <SelectItem value="failed">Fallido</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                      )}
                </CardContent>
              </Card>
                </div>
            )}

            {activeSection === 'advanced-analytics' && (
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-y-auto">
              <RealTimeCharts />
                  </div>
                </div>
            )}

            {activeSection === 'automation' && (
              <AutomationSystem />
            )}

            {activeSection === 'auto-version' && (
              <AutoVersionCreator />
            )}

            {activeSection === 'advanced-tools' && (
              <AdvancedTools />
            )}

            {activeSection === 'version-management' && (
              <VersionManagement projectId={proyectos.length > 0 ? proyectos[0].id : undefined} />
            )}



            {activeSection === 'advanced-charts' && (
              <RealTimeCharts />
            )}



            

            {activeSection === 'notifications' && (
              <AdminNotifications />
            )}

            {activeSection === 'settings' && (
                <div className="h-full flex flex-col">
                  <Card className="bg-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50 h-full">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-2xl">
                      <CardTitle className="text-xl sm:text-2xl font-bold text-card-foreground flex items-center space-x-3">
                        <Cog size={20} className="sm:w-6 sm:h-6 text-slate-600" />
                    <span>Configuración del Sistema</span>
                  </CardTitle>
                      <CardDescription className="text-slate-600 text-sm sm:text-base">
                    Configura los parámetros generales del sistema
                  </CardDescription>
                </CardHeader>
                    <CardContent className="p-4 sm:p-6 flex-1 flex flex-col justify-between">
                      <div className="bg-muted/50 p-4 sm:p-6 rounded-xl flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-3 sm:mb-4">Configuración General</h3>
                        <div className="space-y-3 sm:space-y-4">
                        <div>
                            <label className="text-slate-700 font-medium text-sm sm:text-base">Nombre del Sistema</label>
                          <Input 
                            defaultValue="TuWebAI Dashboard" 
                              className="mt-2 bg-white border-border text-card-foreground text-sm sm:text-base"
                          />
                        </div>
                        <div>
                            <label className="text-slate-700 font-medium text-sm sm:text-base">Zona Horaria</label>
                          <Select defaultValue="utc">
                              <SelectTrigger className="mt-2 bg-white border-border text-card-foreground text-sm sm:text-base">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="utc">UTC</SelectItem>
                              <SelectItem value="est">EST</SelectItem>
                              <SelectItem value="pst">PST</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                            <label className="text-slate-700 font-medium text-sm sm:text-base">Idioma</label>
                          <Select defaultValue="es">
                              <SelectTrigger className="mt-2 bg-white border-border text-card-foreground text-sm sm:text-base">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="es">Español</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                      <div className="flex justify-end pt-4 mt-auto">
                                              <Button 
                          className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base"
                          onClick={() => toast({ title: 'Info', description: 'Función de configuración no implementada.' })}
                        >
                          Guardar Configuración
                        </Button>
                  </div>
                </CardContent>
              </Card>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* Modal para agregar usuario */}
      <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}>
        <DialogContent className="bg-white border-slate-200 relative" aria-describedby="add-user-description">
          {/* Botón X para cerrar */}
          <button
            onClick={() => setShowAddUserModal(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors duration-200 group"
          >
            <span className="text-slate-600 group-hover:text-card-foreground text-lg font-semibold">×</span>
          </button>
          
                     <DialogHeader>
             <DialogTitle className="text-xl text-card-foreground">Agregar Nuevo Usuario</DialogTitle>
             <DialogDescription id="add-user-description" className="text-slate-600">
               Completa la información del nuevo usuario
             </DialogDescription>
           </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-slate-700">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="usuario@ejemplo.com"
                className="bg-white border-border text-card-foreground"
              />
            </div>
            <div>
              <Label htmlFor="full_name" className="text-slate-700">Nombre Completo</Label>
              <Input
                id="full_name"
                type="text"
                value={newUserData.full_name}
                onChange={(e) => setNewUserData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Nombre Apellido"
                className="bg-white border-border text-card-foreground"
              />
            </div>
            <div>
              <Label htmlFor="role" className="text-slate-700">Rol</Label>
                             <Select value={newUserData.role} onValueChange={(value) => setNewUserData(prev => ({ ...prev, role: value }))}>
                 <SelectTrigger className="bg-white border-border text-card-foreground">
                   <SelectValue>
                     {newUserData.role === 'admin' ? '👑 Admin' : '👤 Cliente'}
                   </SelectValue>
                 </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cliente" className="flex items-center space-x-2 text-card-foreground">
                    <span>👤</span>
                    <span>Cliente</span>
                  </SelectItem>
                  <SelectItem value="admin" className="flex items-center space-x-2 text-card-foreground">
                    <span>👑</span>
                    <span>Administrador</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowAddUserModal(false)}
              className="px-6 py-2 bg-white border-border text-slate-700 hover:bg-muted/50 hover:border-border hover:text-card-foreground transition-all duration-200 font-medium"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateUser} 
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Crear Usuario
            </Button>
          </div>
        </DialogContent>
      </Dialog>

             {/* Modal para editar usuario */}
       <Dialog open={showEditUserModal} onOpenChange={setShowEditUserModal}>
         <DialogContent className="bg-white border-slate-200 relative" aria-describedby="edit-user-description">
           {/* Botón X para cerrar */}
           <button
             onClick={() => setShowEditUserModal(false)}
             className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors duration-200 group"
           >
             <span className="text-slate-600 group-hover:text-card-foreground text-lg font-semibold">×</span>
           </button>
           
           <DialogHeader>
             <DialogTitle className="text-xl text-card-foreground">Editar Usuario</DialogTitle>
             <DialogDescription id="edit-user-description" className="text-slate-600">
               Modifica la información del usuario
             </DialogDescription>
           </DialogHeader>
           {editingUser && (
             <div className="space-y-4">
               <div>
                 <Label htmlFor="edit_email" className="text-slate-700">Email</Label>
                 <Input
                   id="edit_email"
                   type="email"
                   value={editingUser.email}
                   onChange={(e) => setEditingUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                   className="bg-white border-border text-card-foreground"
                 />
               </div>
               <div>
                 <Label htmlFor="edit_full_name" className="text-slate-700">Nombre Completo</Label>
                 <Input
                   id="edit_full_name"
                   type="text"
                   value={editingUser.full_name}
                   onChange={(e) => setEditingUser(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                   className="bg-white border-border text-card-foreground"
                 />
               </div>
               <div>
                 <Label htmlFor="edit_role" className="text-slate-700">Rol</Label>
                 <Select value={editingUser.role || 'cliente'} onValueChange={(value) => setEditingUser(prev => prev ? { ...prev, role: value } : null)}>
                   <SelectTrigger className="bg-white border-border text-card-foreground">
                     <SelectValue>
                       {editingUser.role === 'admin' ? '👑 Admin' : '👤 Cliente'}
                     </SelectValue>
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="cliente" className="flex items-center space-x-2 text-card-foreground">
                       <span>👤</span>
                       <span>Cliente</span>
                     </SelectItem>
                     <SelectItem value="admin" className="flex items-center space-x-2 text-card-foreground">
                       <span>👑</span>
                       <span>Administrador</span>
                     </SelectItem>
                   </SelectContent>
                 </Select>
               </div>
             </div>
           )}
           <div className="flex justify-end space-x-3 pt-6">
             <Button 
               variant="outline" 
               onClick={() => setShowEditUserModal(false)}
               className="px-6 py-2 bg-white border-border text-slate-700 hover:bg-muted/50 hover:border-border hover:text-card-foreground transition-all duration-200 font-medium"
             >
               Cancelar
             </Button>
             <Button 
               onClick={handleUpdateUser} 
               className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
             >
               Actualizar Usuario
             </Button>
           </div>
         </DialogContent>
       </Dialog>
    </>
  );
});

Admin.displayName = 'Admin';

export default Admin;
