import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Clock, 
  Settings, 
  Shield, 
  Activity,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Bell,
  Globe,
  Palette,
  Key,
  History,
  Award,
  Target,
  TrendingUp
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { userManagementService, UserProfile, UserAuditLog } from '@/lib/userManagement';
import { useApp } from '@/contexts/AppContext';

export default function AdvancedUserProfile() {
  const { user } = useApp();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [auditLogs, setAuditLogs] = useState<UserAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Estados para formularios
  const [profileData, setProfileData] = useState({
    displayName: '',
    phone: '',
    department: '',
    position: '',
    bio: '',
    skills: [] as string[]
  });
  const [preferences, setPreferences] = useState({
    language: 'es',
    timezone: 'America/New_York',
    theme: 'auto' as 'light' | 'dark' | 'auto',
    notifications: {
      email: true,
      push: true,
      sms: false
    }
  });
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [profileData, auditData] = await Promise.all([
        userManagementService.getUserById(user.uid),
        userManagementService.getAuditLogs(user.uid, 50)
      ]);

      if (profileData) {
        setProfile(profileData);
        setProfileData({
          displayName: profileData.displayName || '',
          phone: profileData.phone || '',
          department: profileData.department || '',
          position: profileData.position || '',
          bio: profileData.bio || '',
          skills: profileData.skills || []
        });
        setPreferences(profileData.preferences);
      }
      setAuditLogs(auditData);
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el perfil',
        variant: 'destructive'
      });
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      await userManagementService.updateUser(user.uid, {
        displayName: profileData.displayName,
        phone: profileData.phone,
        department: profileData.department,
        position: profileData.position,
        bio: profileData.bio,
        skills: profileData.skills,
        preferences
      });

      toast({
        title: 'Perfil actualizado',
        description: 'Se han guardado los cambios'
      });

      setEditing(false);
      loadUserProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el perfil',
        variant: 'destructive'
      });
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !profileData.skills.includes(newSkill.trim())) {
      setProfileData({
        ...profileData,
        skills: [...profileData.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setProfileData({
      ...profileData,
      skills: profileData.skills.filter(s => s !== skill)
    });
  };

  const getActivityStats = () => {
    const totalActions = auditLogs.length;
    const todayActions = auditLogs.filter(log => {
      const logDate = new Date(log.timestamp).toDateString();
      const today = new Date().toDateString();
      return logDate === today;
    }).length;

    const uniqueResources = new Set(auditLogs.map(log => log.resource)).size;
    const mostUsedAction = auditLogs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topAction = Object.entries(mostUsedAction).sort(([,a], [,b]) => b - a)[0];

    return {
      totalActions,
      todayActions,
      uniqueResources,
      topAction: topAction ? { action: topAction[0], count: topAction[1] } : null
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No se pudo cargar el perfil</p>
      </div>
    );
  }

  const stats = getActivityStats();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.avatar} />
            <AvatarFallback className="text-2xl">
              {profile.displayName?.charAt(0) || profile.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{profile.displayName || 'Usuario'}</h1>
            <p className="text-muted-foreground">{profile.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{profile.role}</Badge>
              <Badge className={profile.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {profile.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSaveProfile}>
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Perfil
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Acciones Totales</p>
                <p className="text-2xl font-bold">{stats.totalActions}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hoy</p>
                <p className="text-2xl font-bold">{stats.todayActions}</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recursos Únicos</p>
                <p className="text-2xl font-bold">{stats.uniqueResources}</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Acción Principal</p>
                <p className="text-lg font-bold">{stats.topAction?.action || 'N/A'}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="preferences">Preferencias</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información Personal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="displayName">Nombre Completo</Label>
                  <Input
                    id="displayName"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                    disabled={!editing}
                    placeholder="Tu nombre completo"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    disabled={!editing}
                    placeholder="+1 234 567 8900"
                  />
                </div>
                
                <div>
                  <Label htmlFor="department">Departamento</Label>
                  <Input
                    id="department"
                    value={profileData.department}
                    onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                    disabled={!editing}
                    placeholder="Desarrollo"
                  />
                </div>
                
                <div>
                  <Label htmlFor="position">Cargo</Label>
                  <Input
                    id="position"
                    value={profileData.position}
                    onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
                    disabled={!editing}
                    placeholder="Desarrollador Senior"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Biografía y Habilidades */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Biografía y Habilidades
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bio">Biografía</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    disabled={!editing}
                    placeholder="Cuéntanos sobre ti..."
                    rows={4}
                  />
                </div>
                
                <div>
                  <Label>Habilidades</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profileData.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        {editing && (
                          <button
                            onClick={() => handleRemoveSkill(skill)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  
                  {editing && (
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Nueva habilidad"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                      />
                      <Button size="sm" onClick={handleAddSkill}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuración General */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuración General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="language">Idioma</Label>
                  <Select 
                    value={preferences.language} 
                    onValueChange={(value) => setPreferences({ ...preferences, language: value })}
                    disabled={!editing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <Select 
                    value={preferences.timezone} 
                    onValueChange={(value) => setPreferences({ ...preferences, timezone: value })}
                    disabled={!editing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/Madrid">Madrid</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="theme">Tema</Label>
                  <Select 
                    value={preferences.theme} 
                    onValueChange={(value: 'light' | 'dark' | 'auto') => setPreferences({ ...preferences, theme: value })}
                    disabled={!editing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Oscuro</SelectItem>
                      <SelectItem value="auto">Automático</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Notificaciones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">Notificaciones por Email</Label>
                    <p className="text-sm text-muted-foreground">Recibir notificaciones por correo electrónico</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={preferences.notifications.email}
                    onCheckedChange={(checked) => setPreferences({
                      ...preferences,
                      notifications: { ...preferences.notifications, email: checked }
                    })}
                    disabled={!editing}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications">Notificaciones Push</Label>
                    <p className="text-sm text-muted-foreground">Recibir notificaciones en tiempo real</p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={preferences.notifications.push}
                    onCheckedChange={(checked) => setPreferences({
                      ...preferences,
                      notifications: { ...preferences.notifications, push: checked }
                    })}
                    disabled={!editing}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sms-notifications">Notificaciones SMS</Label>
                    <p className="text-sm text-muted-foreground">Recibir notificaciones por mensaje de texto</p>
                  </div>
                  <Switch
                    id="sms-notifications"
                    checked={preferences.notifications.sms}
                    onCheckedChange={(checked) => setPreferences({
                      ...preferences,
                      notifications: { ...preferences.notifications, sms: checked }
                    })}
                    disabled={!editing}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historial de Actividad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{log.action}</h4>
                      <p className="text-sm text-muted-foreground">
                        Recurso: {log.resource} • {new Date(log.timestamp).toLocaleString('es-ES')}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información de Seguridad */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Información de Seguridad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Último Acceso</p>
                    <p className="text-sm text-muted-foreground">
                      {profile.metadata.lastLogin 
                        ? new Date(profile.metadata.lastLogin).toLocaleString('es-ES')
                        : 'Nunca'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Total de Accesos</p>
                    <p className="text-sm text-muted-foreground">{profile.metadata.loginCount}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Miembro desde</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(profile.metadata.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Acciones de Seguridad */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Acciones de Seguridad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="h-4 w-4 mr-2" />
                  Cambiar Contraseña
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Autenticación de Dos Factores
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="h-4 w-4 mr-2" />
                  Ver Sesiones Activas
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <History className="h-4 w-4 mr-2" />
                  Historial de Inicios de Sesión
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
