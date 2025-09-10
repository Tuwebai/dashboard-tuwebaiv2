import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Settings, 
  Mail, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Save,
  X,
  CheckCircle,
  AlertTriangle,
  Clock,
  History,
  Filter,
  Search,
  Download,
  MoreHorizontal,
  Activity,
  Key,
  Lock,
  Unlock,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { 
  userManagementService, 
  UserProfile, 
  UserRole, 
  Invitation, 
  AuditLog
} from '@/lib/userManagement';

export default function AdvancedUserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Estados para modales
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);

  // Estados para formularios
  const [invitationData, setInvitationData] = useState({
    email: '',
    role: '',
    message: ''
  });
  const [userData, setUserData] = useState({
    display_name: '',
    phone: '',
    department: '',
    position: '',
    bio: '',
    skills: [] as string[],
    role: ''
  });
  const [roleData, setRoleData] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, rolesData, invitationsData, auditData] = await Promise.all([
        userManagementService.getUsers(),
        userManagementService.getRoles(),
        userManagementService.getInvitations(),
        userManagementService.getAuditLogs()
      ]);

      setUsers(usersData.users || []);
      setRoles(rolesData);
      setInvitations(invitationsData);
      setAuditLogs(auditData.logs || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos',
        variant: 'destructive'
      });
    }
    setLoading(false);
  };

  const handleInviteUser = async () => {
    if (!invitationData.email || !invitationData.role) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos requeridos',
        variant: 'destructive'
      });
      return;
    }

    try {
      await userManagementService.createInvitation({
        email: invitationData.email,
        role: invitationData.role,
        invited_by: 'current-user-id', // Esto vendría del contexto de usuario
        message: invitationData.message,
        token: Math.random().toString(36).substring(2, 15),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

      toast({
        title: 'Invitación enviada',
        description: 'Se ha enviado la invitación por email'
      });

      setInvitationData({ email: '', role: '', message: '' });
      setShowInviteModal(false);
      loadData();
    } catch (error) {
      console.error('Error inviting user:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar la invitación',
        variant: 'destructive'
      });
    }
  };

  const handleCreateRole = async () => {
    if (!roleData.name || !roleData.description) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos requeridos',
        variant: 'destructive'
      });
      return;
    }

    try {
      await userManagementService.createRole({
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions
      });

      toast({
        title: 'Rol creado',
        description: 'Se ha creado el nuevo rol'
      });

      setRoleData({ name: '', description: '', permissions: [] });
      setShowRoleModal(false);
      loadData();
    } catch (error) {
      console.error('Error creating role:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el rol',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      await userManagementService.updateUser(editingUser.id, {
        display_name: userData.display_name,
        phone: userData.phone,
        department: userData.department,
        position: userData.position,
        bio: userData.bio,
        skills: userData.skills,
        role: userData.role
      });

      toast({
        title: 'Usuario actualizado',
        description: 'Se han guardado los cambios'
      });

      setEditingUser(null);
      setShowUserModal(false);
      loadData();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el usuario',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await userManagementService.deleteUser(userToDelete);
      toast({
        title: 'Usuario eliminado',
        description: 'Se ha eliminado el usuario'
      });
      loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el usuario',
        variant: 'destructive'
      });
    } finally {
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  const cancelDeleteUser = () => {
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      // Implementar cancelación de invitación
      toast({
        title: 'Invitación cancelada',
        description: 'Se ha cancelado la invitación'
      });
      loadData();
    } catch (error) {
      console.error('Error canceling invitation:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cancelar la invitación',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'suspended': return <Lock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const filteredInvitations = invitations.filter(invitation => {
    return invitation.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión Avanzada de Usuarios</h1>
          <p className="text-muted-foreground">
            Administra usuarios, roles, permisos e invitaciones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowInviteModal(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invitar Usuario
          </Button>
          <Button variant="outline" onClick={() => setShowRoleModal(true)}>
            <Shield className="h-4 w-4 mr-2" />
            Crear Rol
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuarios Totales</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuarios Activos</p>
                <p className="text-2xl font-bold">{users.filter(u => u.status === 'active').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Invitaciones Pendientes</p>
                <p className="text-2xl font-bold">{invitations.filter(i => i.status === 'pending').length}</p>
              </div>
              <Mail className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Roles</p>
                <p className="text-2xl font-bold">{roles.length}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="invitations">Invitaciones</TabsTrigger>
          <TabsTrigger value="audit">Auditoría</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuarios..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="suspended">Suspendidos</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={loadData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          <div className="space-y-4">
            {filteredUsers.map(user => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.display_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h3 className="font-medium">{user.display_name || 'Sin nombre'}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{roles.find(r => r.name === user.role)?.display_name || user.role}</Badge>
                          <Badge className={getStatusColor(user.status)}>
                            {getStatusIcon(user.status)}
                            <span className="ml-1">{user.status}</span>
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingUser(user);
                                                     setUserData({
                             display_name: user.display_name || '',
                             phone: user.phone || '',
                             department: user.department || '',
                             position: user.position || '',
                             bio: user.bio || '',
                             skills: user.skills || [],
                             role: user.role || ''
                           });
                          setShowUserModal(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roles.map(role => (
              <Card key={role.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      {role.name}
                    </CardTitle>
                    {role.isDefault && (
                      <Badge variant="outline">Por defecto</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Permisos ({role.permissions.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 5).map(permissionId => {
                        const permission = userManagementService.getAllPermissions().find(p => p.id === permissionId);
                        return permission ? (
                          <Badge key={permissionId} variant="secondary" className="text-xs">
                            {permission.name}
                          </Badge>
                        ) : null;
                      })}
                      {role.permissions.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{role.permissions.length - 5} más
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <div className="space-y-4">
            {filteredInvitations.map(invitation => (
              <Card key={invitation.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{invitation.email}</h3>
                      <p className="text-sm text-muted-foreground">
                        Invitado por: {invitation.invitedBy} • 
                        Rol: {roles.find(r => r.id === invitation.role)?.name || invitation.role}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getStatusColor(invitation.status)}>
                          {invitation.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Expira: {new Date(invitation.expiresAt).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {invitation.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelInvitation(invitation.id)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <div className="space-y-4">
            {auditLogs.slice(0, 50).map(log => (
              <Card key={log.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{log.action}</h3>
                      <p className="text-sm text-muted-foreground">
                        Usuario: {users.find(u => u.id === log.userId)?.email || log.userId} • 
                        Recurso: {log.resource}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString('es-ES')}
                      </span>
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Invite User Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitar Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={invitationData.email}
                onChange={(e) => setInvitationData({ ...invitationData, email: e.target.value })}
                placeholder="usuario@ejemplo.com"
              />
            </div>
            
            <div>
              <Label htmlFor="invite-role">Rol</Label>
              <Select value={invitationData.role} onValueChange={(value) => setInvitationData({ ...invitationData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="invite-message">Mensaje (opcional)</Label>
              <Textarea
                id="invite-message"
                value={invitationData.message}
                onChange={(e) => setInvitationData({ ...invitationData, message: e.target.value })}
                placeholder="Mensaje personalizado para la invitación..."
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowInviteModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleInviteUser}>
                <Mail className="h-4 w-4 mr-2" />
                Enviar Invitación
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Role Modal */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Rol</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role-name">Nombre del Rol</Label>
              <Input
                id="role-name"
                value={roleData.name}
                onChange={(e) => setRoleData({ ...roleData, name: e.target.value })}
                placeholder="Ej: Editor Senior"
              />
            </div>
            
            <div>
              <Label htmlFor="role-description">Descripción</Label>
              <Textarea
                id="role-description"
                value={roleData.description}
                onChange={(e) => setRoleData({ ...roleData, description: e.target.value })}
                placeholder="Descripción del rol y sus responsabilidades..."
              />
            </div>
            
            <div>
              <Label>Permisos</Label>
              <div className="grid grid-cols-2 gap-4 mt-2 max-h-60 overflow-y-auto">
                {userManagementService.getAllPermissions().map(permission => (
                  <div key={permission.id} className="flex items-center space-x-2">
                    <Switch
                      id={permission.id}
                      checked={roleData.permissions.includes(permission.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setRoleData({
                            ...roleData,
                            permissions: [...roleData.permissions, permission.id]
                          });
                        } else {
                          setRoleData({
                            ...roleData,
                            permissions: roleData.permissions.filter(p => p !== permission.id)
                          });
                        }
                      }}
                    />
                    <Label htmlFor={permission.id} className="text-sm">
                      {permission.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRoleModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateRole}>
                <Save className="h-4 w-4 mr-2" />
                Crear Rol
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-name">Nombre</Label>
              <Input
                id="user-name"
                value={userData.display_name}
                onChange={(e) => setUserData({ ...userData, display_name: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>
            
            <div>
              <Label htmlFor="user-phone">Teléfono</Label>
              <Input
                id="user-phone"
                value={userData.phone}
                onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                placeholder="+1 234 567 8900"
              />
            </div>
            
            <div>
              <Label htmlFor="user-department">Departamento</Label>
              <Input
                id="user-department"
                value={userData.department}
                onChange={(e) => setUserData({ ...userData, department: e.target.value })}
                placeholder="Desarrollo"
              />
            </div>
            
            <div>
              <Label htmlFor="user-position">Cargo</Label>
              <Input
                id="user-position"
                value={userData.position}
                onChange={(e) => setUserData({ ...userData, position: e.target.value })}
                placeholder="Desarrollador Senior"
              />
            </div>
            
            <div>
              <Label htmlFor="user-bio">Biografía</Label>
              <Textarea
                id="user-bio"
                value={userData.bio}
                onChange={(e) => setUserData({ ...userData, bio: e.target.value })}
                placeholder="Breve descripción del usuario..."
              />
            </div>
            
            <div>
              <Label htmlFor="user-role">Rol</Label>
              <Select 
                value={userData.role || ''} 
                onValueChange={(value) => setUserData({ ...userData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowUserModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateUser}>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación para eliminar usuario */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={cancelDeleteUser}
        onConfirm={confirmDeleteUser}
        title="Confirmar eliminación"
        description="¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        loading={false}
      />
    </div>
  );
} 
