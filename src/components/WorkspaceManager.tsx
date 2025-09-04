import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { 
  Plus, 
  Settings, 
  Users, 
  Folder, 
  Star, 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserPlus,
  Crown,
  Eye,
  Shield,
  Globe,
  Lock
} from 'lucide-react';


export interface Workspace {
  id: string;
  name: string;
  description: string;
  owner: string;
  members: WorkspaceMember[];
  projects: string[];
  settings: WorkspaceSettings;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'archived' | 'suspended';
  plan: 'free' | 'pro' | 'enterprise';
}

export interface WorkspaceMember {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joinedAt: string;
  lastActivity: string;
  status: 'active' | 'pending' | 'suspended';
}

export interface WorkspaceSettings {
  visibility: 'private' | 'public' | 'restricted';
  projectCreation: 'all' | 'admins' | 'owner';
  invitePermission: 'all' | 'admins' | 'owner';
  defaultRole: 'editor' | 'viewer';
  features: {
  
    visualBuilder: boolean;
    analytics: boolean;
    collaboration: boolean;
    apiAccess: boolean;
  };
}

interface WorkspaceManagerProps {
  currentWorkspace?: Workspace;
  onWorkspaceChange?: (workspace: Workspace) => void;
}

export default function WorkspaceManager({ currentWorkspace, onWorkspaceChange }: WorkspaceManagerProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(currentWorkspace || null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newWorkspace, setNewWorkspace] = useState<{
    name: string;
    description: string;
    visibility: 'private' | 'public' | 'restricted';
  }>({
    name: '',
    description: '',
    visibility: 'private'
  });
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');

  // Cargar workspaces desde Supabase
  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        setLoading(true);
        
        const { data: workspacesData, error } = await supabase
          .from('workspaces')
          .select('*')
          .eq('status', 'active');
        
        if (error) throw error;
        
        const workspaces = workspacesData || [];
        setWorkspaces(workspaces);
        
        if (workspaces.length > 0 && !activeWorkspace) {
          setActiveWorkspace(workspaces[0]);
          onWorkspaceChange?.(workspaces[0]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading workspaces:', error);
        setLoading(false);
      }
    };

    // Load initial data
    loadWorkspaces();

    // Set up real-time subscription
    const workspacesChannel = supabase
      .channel('workspaces_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'workspaces',
          filter: `status=eq.active`
        }, 
        (payload) => {
          loadWorkspaces();
        }
      )
      .subscribe();

    return () => {
      workspacesChannel.unsubscribe();
    };
  }, [activeWorkspace, onWorkspaceChange]);

  const handleCreateWorkspace = () => {
    if (!newWorkspace.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del espacio de trabajo es obligatorio.",
        variant: "destructive",
      });
      return;
    }

    const workspace: Workspace = {
      id: Date.now().toString(),
      name: newWorkspace.name,
      description: newWorkspace.description,
      owner: 'admin@tuweb.com', // En producción, obtener del usuario actual
      members: [
        {
          id: Date.now().toString(),
          email: 'admin@tuweb.com',
          name: 'Administrador',
          role: 'owner',
          joinedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          status: 'active'
        }
      ],
      projects: [],
      settings: {
        visibility: newWorkspace.visibility,
        projectCreation: 'all',
        invitePermission: 'admins',
        defaultRole: 'editor',
        features: {
  
          visualBuilder: true,
          analytics: false,
          collaboration: true,
          apiAccess: false
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      plan: 'free'
    };

    setWorkspaces(prev => [...prev, workspace]);
    setActiveWorkspace(workspace);
    onWorkspaceChange?.(workspace);
    setIsCreateModalOpen(false);
    setNewWorkspace({ name: '', description: '', visibility: 'private' });

    toast({
      title: "Espacio de trabajo creado",
      description: `${workspace.name} ha sido creado exitosamente.`,
    });
  };

  const handleInviteMember = () => {
    if (!inviteEmail.trim() || !activeWorkspace) return;

    // Verificar si el usuario ya es miembro
    const existingMember = activeWorkspace.members.find(m => m.email === inviteEmail);
    if (existingMember) {
      toast({
        title: "Error",
        description: "Este usuario ya es miembro del espacio de trabajo.",
        variant: "destructive",
      });
      return;
    }

    const newMember: WorkspaceMember = {
      id: Date.now().toString(),
      email: inviteEmail,
      name: inviteEmail.split('@')[0],
      role: inviteRole,
      joinedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      status: 'pending'
    };

    setWorkspaces(prev => prev.map(ws => 
      ws.id === activeWorkspace.id 
        ? { ...ws, members: [...ws.members, newMember], updatedAt: new Date().toISOString() }
        : ws
    ));

    setActiveWorkspace(prev => prev ? { 
      ...prev, 
      members: [...prev.members, newMember] 
    } : null);

    setInviteEmail('');
    setIsInviteModalOpen(false);

    toast({
      title: "Invitación enviada",
      description: `Se ha enviado una invitación a ${inviteEmail}.`,
    });
  };

  const removeMember = (memberId: string) => {
    if (!activeWorkspace) return;

    setWorkspaces(prev => prev.map(ws => 
      ws.id === activeWorkspace.id 
        ? { 
            ...ws, 
            members: ws.members.filter(m => m.id !== memberId),
            updatedAt: new Date().toISOString()
          }
        : ws
    ));

    setActiveWorkspace(prev => prev ? { 
      ...prev, 
      members: prev.members.filter(m => m.id !== memberId)
    } : null);

    toast({
      title: "Miembro eliminado",
      description: "El miembro ha sido eliminado del espacio de trabajo.",
    });
  };

  const updateMemberRole = (memberId: string, newRole: WorkspaceMember['role']) => {
    if (!activeWorkspace) return;

    setWorkspaces(prev => prev.map(ws => 
      ws.id === activeWorkspace.id 
        ? { 
            ...ws, 
            members: ws.members.map(m => 
              m.id === memberId ? { ...m, role: newRole } : m
            ),
            updatedAt: new Date().toISOString()
          }
        : ws
    ));

    setActiveWorkspace(prev => prev ? { 
      ...prev, 
      members: prev.members.map(m => 
        m.id === memberId ? { ...m, role: newRole } : m
      )
    } : null);

    toast({
      title: "Rol actualizado",
      description: "El rol del miembro ha sido actualizado.",
    });
  };

  const getRoleIcon = (role: WorkspaceMember['role']) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'editor':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'viewer':
        return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: WorkspaceMember['role']) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'editor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Espacios de Trabajo</h1>
          <p className="text-muted-foreground">
            Gestiona tus espacios de trabajo y colabora en equipo
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Espacio
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-popover border-border">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Espacio de Trabajo</DialogTitle>
              <DialogDescription>
                Crea un nuevo espacio para organizar tus proyectos y colaborar con tu equipo.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del espacio</Label>
                <Input
                  id="name"
                  placeholder="Mi Equipo de Desarrollo"
                  value={newWorkspace.name}
                  onChange={(e) => setNewWorkspace(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-input border-border"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  placeholder="Espacio para proyectos del equipo..."
                  value={newWorkspace.description}
                  onChange={(e) => setNewWorkspace(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-input border-border"
                />
              </div>
              
              <div>
                <Label htmlFor="visibility">Visibilidad</Label>
                <Select 
                  value={newWorkspace.visibility} 
                  onValueChange={(value: 'private' | 'public' | 'restricted') => 
                    setNewWorkspace(prev => ({ ...prev, visibility: value }))
                  }
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Privado
                      </div>
                    </SelectItem>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Público
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateWorkspace} className="bg-gradient-primary hover:opacity-90">
                  Crear Espacio
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Workspace Selector */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Espacio Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select 
                value={activeWorkspace?.id || ''} 
                onValueChange={(workspaceId) => {
                  const workspace = workspaces.find(w => w.id === workspaceId);
                  if (workspace) {
                    setActiveWorkspace(workspace);
                    onWorkspaceChange?.(workspace);
                  }
                }}
              >
                <SelectTrigger className="w-64 bg-input border-border">
                  <SelectValue placeholder="Selecciona un espacio" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {workspaces.map(workspace => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        {workspace.name}
                        <Badge className={`ml-2 ${workspace.plan === 'pro' ? 'bg-primary/10 text-primary' : 'bg-muted'}`}>
                          {workspace.plan}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {activeWorkspace && (
                <div>
                  <h3 className="font-medium">{activeWorkspace.name}</h3>
                  <p className="text-sm text-muted-foreground">{activeWorkspace.description}</p>
                </div>
              )}
            </div>
            
            {activeWorkspace && (
              <div className="flex items-center gap-2">
                <Badge className={getRoleColor(activeWorkspace.members[0]?.role || 'viewer')}>
                  {getRoleIcon(activeWorkspace.members[0]?.role || 'viewer')}
                  <span className="ml-1">{activeWorkspace.members[0]?.role}</span>
                </Badge>
                
                <Dialog open={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-popover border-border max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Configuración del Espacio</DialogTitle>
                      <DialogDescription>
                        Gestiona la configuración y miembros de {activeWorkspace.name}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Tabs defaultValue="members" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="members">Miembros</TabsTrigger>
                        <TabsTrigger value="settings">Configuración</TabsTrigger>
                        <TabsTrigger value="features">Funcionalidades</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="members" className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">
                            Miembros ({activeWorkspace.members.length})
                          </h3>
                          
                          <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm" className="bg-gradient-primary hover:opacity-90">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Invitar
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-popover border-border">
                              <DialogHeader>
                                <DialogTitle>Invitar Miembro</DialogTitle>
                                <DialogDescription>
                                  Invita a un nuevo miembro a tu espacio de trabajo.
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="email">Email</Label>
                                  <Input
                                    id="email"
                                    type="email"
                                    placeholder="usuario@email.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="bg-input border-border"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor="role">Rol</Label>
                                  <Select value={inviteRole} onValueChange={(value: 'editor' | 'viewer') => setInviteRole(value)}>
                                    <SelectTrigger className="bg-input border-border">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border">
                                      <SelectItem value="editor">Editor</SelectItem>
                                      <SelectItem value="viewer">Visualizador</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div className="flex justify-end gap-3">
                                  <Button variant="outline" onClick={() => setIsInviteModalOpen(false)}>
                                    Cancelar
                                  </Button>
                                  <Button onClick={handleInviteMember} className="bg-gradient-primary hover:opacity-90">
                                    Enviar Invitación
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        
                        <div className="space-y-2">
                          {activeWorkspace.members.map(member => (
                            <div key={member.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                                  <Users className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{member.name}</p>
                                  <p className="text-sm text-muted-foreground">{member.email}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Badge 
                                  className={`${getRoleColor(member.role)} border`}
                                  variant="outline"
                                >
                                  {getRoleIcon(member.role)}
                                  <span className="ml-1">{member.role}</span>
                                </Badge>
                                
                                <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                                  {member.status}
                                </Badge>
                                
                                {member.role !== 'owner' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeMember(member.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="settings">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Configuración General</h3>
                          {/* Aquí irían los controles de configuración */}
                          <p className="text-muted-foreground">Configuración avanzada próximamente...</p>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="features">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Funcionalidades Disponibles</h3>
                          {/* Aquí irían los toggles de funcionalidades */}
                          <p className="text-muted-foreground">Panel de funcionalidades próximamente...</p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Workspace Stats */}
      {activeWorkspace && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Proyectos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeWorkspace.projects.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Miembros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeWorkspace.members.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={activeWorkspace.plan === 'pro' ? 'bg-primary/10 text-primary' : 'bg-muted'}>
                {activeWorkspace.plan}
              </Badge>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={activeWorkspace.status === 'active' ? 'default' : 'secondary'}>
                {activeWorkspace.status}
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
