import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { UserManagementService, UserInvitation } from '@/lib/userManagement';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from '@/components/OptimizedMotion';

import { 
  Users, 
  UserPlus, 
  Crown, 
  Trash2, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search,
  Plus,
  Shield,
  UserCheck,
  UserX
} from 'lucide-react';

interface Member {
  id: string;
  full_name: string | null;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
  avatar_url: string | null;
}

export default function Team() {
  const { user } = useApp();
  const [teamMembers, setTeamMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [invitationsLoading, setInvitationsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const userManagementService = new UserManagementService();

  // Filtrar miembros del equipo por búsqueda
  const filteredMembers = teamMembers.filter(member =>
    member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cargar miembros del equipo y invitaciones desde Supabase
  useEffect(() => {
    if (!user) return;

    const loadTeamMembers = async () => {
      try {
        setLoading(true);
        
        const { users } = await userManagementService.getUsers();
        setTeamMembers(users);
        setLoading(false);
      } catch (error) {

        setLoading(false);
      }
    };

    const loadInvitations = async () => {
      try {
        setInvitationsLoading(true);
        
        const invitationsData = await userManagementService.getInvitations();
        setInvitations(invitationsData);
        setInvitationsLoading(false);
      } catch (error) {

        setInvitationsLoading(false);
      }
    };

    // Load initial data
    loadTeamMembers();
    loadInvitations();

    // Set up real-time subscription for users
    const membersChannel = supabase
      .channel('users_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'users'
        }, 
        (payload) => {
          loadTeamMembers();
        }
      )
      .subscribe();

    // Set up real-time subscription for invitations
    const invitationsChannel = supabase
      .channel('user_invitations_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_invitations'
        }, 
        (payload) => {
          loadInvitations();
        }
      )
      .subscribe();

    return () => {
      membersChannel.unsubscribe();
      invitationsChannel.unsubscribe();
    };
  }, [user]);

  const handleInvite = async () => {
    if (!inviteEmail || !user) return;
    
    try {
      const newInvitation = await userManagementService.createInvitation({
        email: inviteEmail,
        message: `Invitación para unirse al equipo de ${user.full_name || user.email}`
      });
      
      // Actualizar el estado local inmediatamente
      setInvitations(prev => [newInvitation, ...prev]);
      
      toast({
        title: 'Invitación enviada',
        description: `Se ha enviado una invitación a ${inviteEmail}`
      });
      setInviteEmail('');
    } catch (error) {

      toast({
        title: 'Error',
        description: 'No se pudo enviar la invitación',
        variant: 'destructive'
      });
    }
  };

  const handleRoleChange = async (memberId: string, newRole: 'admin' | 'user') => {
    if (!user || user.role !== 'admin') return;
    
    try {
      await userManagementService.updateUser(memberId, { role: newRole });
      
      toast({
        title: 'Rol actualizado',
        description: 'El rol del miembro ha sido actualizado'
      });
    } catch (error) {

      toast({
        title: 'Error',
        description: 'No se pudo actualizar el rol',
        variant: 'destructive'
      });
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!user || user.role !== 'admin') return;
    
    try {
      await userManagementService.deleteUser(memberId);
      
      toast({
        title: 'Miembro removido',
        description: 'El miembro ha sido removido del equipo'
      });
    } catch (error) {

      toast({
        title: 'Error',
        description: 'No se pudo remover el miembro',
        variant: 'destructive'
      });
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!user || user.role !== 'admin') return;
    
    try {
      // Actualizar el estado de la invitación a 'cancelled'
      const { error } = await supabase
        .from('user_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);
      
      if (error) throw error;
      
      // Actualizar el estado local inmediatamente
      setInvitations(prev => 
        prev.map(inv => 
          inv.id === invitationId 
            ? { ...inv, status: 'cancelled' as const }
            : inv
        )
      );
      
      toast({
        title: 'Invitación cancelada',
        description: 'La invitación ha sido cancelada correctamente'
      });
    } catch (error) {

      toast({
        title: 'Error',
        description: 'No se pudo cancelar la invitación',
        variant: 'destructive'
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando equipo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Header con diseño moderno */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative group"
        >
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 border border-slate-200/50 backdrop-blur-sm overflow-hidden bg-gradient-to-br from-white via-blue-25 to-indigo-25">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <motion.h1 
                  className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  Gestión de Equipo
                </motion.h1>
                <motion.p 
                  className="text-slate-600 mt-2 text-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  Administra los miembros y roles de tu equipo
                </motion.p>
              </div>
              <motion.div 
                className="flex items-center gap-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-4 py-2 rounded-xl">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold">Miembros: {teamMembers.length}</span>
                </div>
              </motion.div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/20 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
          </div>
        </motion.div>

        {/* Barra de búsqueda */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar miembros del equipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
            />
          </div>
        </motion.div>

        {/* Miembros del equipo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-200/50 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-2xl">
              <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Users className="h-5 w-5 text-blue-600" />
                </motion.div>
                Miembros del Equipo
              </CardTitle>
              <CardDescription className="text-slate-600">
                Gestiona los roles y permisos de los miembros
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-slate-600">Cargando miembros...</p>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600">
                    {searchTerm ? 'No se encontraron miembros que coincidan con la búsqueda.' : 'No hay miembros en el equipo.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Nombre</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Rol</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <AnimatePresence>
                        {filteredMembers.map((member, index) => (
                          <motion.tr
                            key={member.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="hover:bg-slate-50 transition-colors duration-200"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                  {member.full_name ? member.full_name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <span className="font-medium text-slate-800">
                                  {member.full_name || 'Sin nombre'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">{member.email}</td>
                            <td className="py-3 px-4">
                              <Badge 
                                variant={member.role === 'admin' ? 'default' : 'secondary'}
                                className="capitalize"
                              >
                                {member.role === 'admin' ? (
                                  <Crown className="h-3 w-3 mr-1" />
                                ) : (
                                  <Shield className="h-3 w-3 mr-1" />
                                )}
                                {member.role}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                {user?.email !== member.email && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRoleChange(member.id, member.role === 'admin' ? 'user' : 'admin')}
                                    className="text-xs px-3 py-1 h-8 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200"
                                  >
                                    {member.role === 'admin' ? <UserX className="h-3 w-3 mr-1" /> : <UserCheck className="h-3 w-3 mr-1" />}
                                    Cambiar a {member.role === 'admin' ? 'Usuario' : 'Admin'}
                                  </Button>
                                )}
                                {user?.email !== member.email && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRemove(member.id)}
                                    className="text-xs px-3 py-1 h-8 hover:bg-red-50 transition-all duration-200"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Eliminar
                                  </Button>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Invitaciones Pendientes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-200/50 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-2xl">
              <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Mail className="h-5 w-5 text-green-600" />
                </motion.div>
                Invitaciones Pendientes
              </CardTitle>
              <CardDescription className="text-slate-600">
                Gestiona las invitaciones enviadas a nuevos miembros
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {invitationsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
                  <p className="mt-2 text-slate-600">Cargando invitaciones...</p>
                </div>
              ) : invitations.filter(inv => inv.status === 'pending').length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600">No hay invitaciones pendientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {invitations.filter(inv => inv.status === 'pending').map((invitation, index) => (
                      <motion.div
                        key={invitation.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {invitation.status === 'pending' && <Clock className="h-5 w-5 text-yellow-500" />}
                            {invitation.status === 'accepted' && <CheckCircle className="h-5 w-5 text-green-500" />}
                            {invitation.status === 'declined' && <XCircle className="h-5 w-5 text-red-500" />}
                            {invitation.status === 'expired' && <XCircle className="h-5 w-5 text-gray-500" />}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{invitation.email}</p>
                            <p className="text-sm text-slate-500">
                              Enviada el {new Date(invitation.created_at).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={
                            invitation.status === 'pending' ? 'default' :
                            invitation.status === 'accepted' ? 'secondary' :
                            invitation.status === 'declined' ? 'destructive' :
                            'outline'
                          }>
                            {invitation.status === 'pending' ? 'Pendiente' :
                             invitation.status === 'accepted' ? 'Aceptada' :
                             invitation.status === 'declined' ? 'Rechazada' :
                             invitation.status === 'expired' ? 'Expirada' :
                             invitation.status === 'cancelled' ? 'Cancelada' : invitation.status}
                          </Badge>
                          {invitation.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelInvitation(invitation.id)}
                              className="hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-200"
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Invitar miembro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-200/50 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-2xl">
              <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  <UserPlus className="h-5 w-5 text-purple-600" />
                </motion.div>
                Invitar Miembro
              </CardTitle>
              <CardDescription className="text-slate-600">
                Envía una invitación por email a un nuevo miembro
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex gap-3">
                <Input
                  type="email"
                  placeholder="Email del nuevo miembro"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 border-slate-300 focus:border-purple-500 focus:ring-purple-500 rounded-xl"
                  onKeyPress={(e) => e.key === 'Enter' && handleInvite()}
                />
                <Button 
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim()}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Invitar
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
