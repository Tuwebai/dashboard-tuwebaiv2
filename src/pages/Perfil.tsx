import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { StorageService } from '@/lib/storageService';
import { getDefaultAvatar, isDefaultAvatar } from '@/constants/avatars';

import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Bell, 
  Camera, 
  Save, 
  Edit3,
  Check,
  X,
  Eye,
  EyeOff,
  Building,
  Globe,
  FileText,
  Trash2,
  Lock
} from 'lucide-react';

// Importar componentes de seguridad
import TwoFactorAuth from '@/components/security/TwoFactorAuth';
import PasswordValidator from '@/components/security/PasswordValidator';
import SecurityIndicators from '@/components/security/SecurityIndicators';

// Importar integraciones sociales (solo para admins)
import { SocialIntegrations } from '@/components/admin/profile/SocialIntegrations';

const Perfil = React.memo(() => {
  const { user, getUserProjects, updateUserSettings } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para seguridad
  const [has2FA, setHas2FA] = useState(false);
  const [hasStrongPassword, setHasStrongPassword] = useState(false);
  const [isSecureConnection, setIsSecureConnection] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSecurityExpanded, setIsSecurityExpanded] = useState(false);
  
  // Estados para edición de perfil
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    bio: '',
    location: '',
    website: ''
  });

  // Estados para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.full_name || user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        company: user.company || '',
        position: user.position || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || ''
      });
    }
  }, [user]);

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Validar campos obligatorios
      if (!profileData.name.trim() || !profileData.email.trim()) {
        toast({
          title: 'Error',
          description: 'El nombre y email son campos obligatorios.',
          variant: 'destructive'
        });
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileData.email)) {
        toast({
          title: 'Error',
          description: 'El formato del email no es válido.',
          variant: 'destructive'
        });
        return;
      }

      // Actualizar perfil en Supabase
      const { error } = await supabase
        .from('users')
        .update({
          full_name: profileData.name,
          email: profileData.email,
          phone: profileData.phone || null,
          company: profileData.company || null,
          position: profileData.position || null,
          bio: profileData.bio || null,
          location: profileData.location || null,
          website: profileData.website || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      // Actualizar datos del usuario en el contexto
      const updatedUser = {
        ...user,
        full_name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        company: profileData.company,
        position: profileData.position,
        bio: profileData.bio,
        location: profileData.location,
        website: profileData.website
      };

      // Actualizar el contexto local (esto requeriría una función en AppContext)
      // Por ahora solo actualizamos el estado local
      
      toast({
        title: 'Perfil actualizado',
        description: 'Los datos de tu perfil han sido actualizados correctamente.'
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el perfil. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!user) return;
    
    // Validar campos
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Todos los campos son obligatorios.',
        variant: 'destructive'
      });
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden.',
        variant: 'destructive'
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'La nueva contraseña debe tener al menos 6 caracteres.',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    try {
      // Cambiar contraseña usando Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Contraseña actualizada',
        description: 'Tu contraseña ha sido actualizada correctamente.'
      });
      
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cambiar la contraseña. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Error',
        description: 'Solo se permiten archivos de imagen (JPEG, PNG, GIF).',
        variant: 'destructive'
      });
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'La imagen debe ser menor a 5MB.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // Intentar subir al bucket avatars primero
      let bucketName = 'avatars';
      let filePath = fileName; // Sin prefijo de carpeta
      let uploadError = null;
      
      const { error: avatarsError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (avatarsError && avatarsError.message.includes('Bucket not found')) {
        // Si el bucket avatars no existe, usar project-files con carpeta avatars
        bucketName = 'project-files';
        filePath = `avatars/${fileName}`;
        const { error: projectError } = await supabase.storage
          .from('project-files')
          .upload(filePath, file);
        uploadError = projectError;
      } else {
        uploadError = avatarsError;
      }

      if (uploadError) {
        throw uploadError;
      }

      // Obtener URL pública del archivo
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      // Actualizar URL del avatar en la base de datos
      const { error: updateError } = await supabase
        .from('users')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Actualizar el usuario en el contexto global para sincronización en tiempo real
      await updateUserSettings({
        avatar: publicUrl // Para compatibilidad con el campo avatar
      });

      toast({
        title: 'Foto actualizada',
        description: 'Tu foto de perfil ha sido actualizada correctamente.'
      });

      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error subiendo foto:', error);
      toast({
        title: 'Error',
        description: 'No se pudo subir la foto. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user) return;

    // Verificar si ya tiene avatar por defecto
    if (isDefaultAvatar(user.avatar_url)) {
      toast({
        title: 'Información',
        description: 'Ya tienes el avatar por defecto.',
        variant: 'default'
      });
      return;
    }

    setLoading(true);
    try {
      // Eliminar avatar actual del storage si existe
      if (user.avatar_url && !isDefaultAvatar(user.avatar_url)) {
        await StorageService.deleteAvatar(user.id, user.avatar_url);
      }

      // Actualizar avatar a por defecto en la base de datos
      const defaultAvatarUrl = getDefaultAvatar();
      const { error: updateError } = await supabase
        .from('users')
        .update({
          avatar_url: defaultAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Actualizar el usuario en el contexto global
      await updateUserSettings({
        avatar: defaultAvatarUrl
      });

      toast({
        title: 'Avatar eliminado',
        description: 'Tu foto de perfil ha sido eliminada y se ha establecido el avatar por defecto.'
      });

    } catch (error) {
      console.error('Error eliminando avatar:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la foto. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header con diseño claro */}
        <div className="bg-card dark:bg-slate-800/50 rounded-2xl p-6 shadow-lg border border-border/50 dark:border-slate-700/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Mi Perfil</h1>
              <p className="text-slate-600 dark:text-slate-300 mt-2">
                Gestiona tu información personal y configuración
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <User className="h-4 w-4" />
                <span>Proyectos: {getUserProjects().length}</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700/50">
                Miembro desde {new Date(user.created_at || Date.now()).toLocaleDateString('es-ES')}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda - Información personal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información Personal */}
            <Card className="bg-card dark:bg-slate-800/50 rounded-2xl shadow-lg border border-border/50 dark:border-slate-700/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                      <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-slate-800 dark:text-white">Información Personal</CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-300">
                        Actualiza tu información personal y de contacto
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="border-border text-foreground hover:bg-muted/50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/50"
                  >
                    {isEditing ? <X className="h-4 w-4 mr-2" /> : <Edit3 className="h-4 w-4 mr-2" />}
                    {isEditing ? 'Cancelar' : 'Editar'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-foreground dark:text-slate-300">
                      Nombre completo
                    </Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      placeholder="Tu nombre completo"
                      disabled={!isEditing}
                      className="border-border focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground dark:text-slate-300">
                      Email
                    </Label>
                    <Input
                      id="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      placeholder="tuemail@ejemplo.com"
                      disabled={!isEditing}
                      className="border-border focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-foreground dark:text-slate-300">
                      Teléfono
                    </Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      placeholder="+54 9 11 1234-5678"
                      disabled={!isEditing}
                      className="border-border focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-sm font-medium text-foreground dark:text-slate-300">
                      Empresa
                    </Label>
                    <Input
                      id="company"
                      value={profileData.company}
                      onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                      placeholder="Nombre de tu empresa"
                      disabled={!isEditing}
                      className="border-border focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position" className="text-sm font-medium text-foreground dark:text-slate-300">
                      Cargo
                    </Label>
                    <Input
                      id="position"
                      value={profileData.position}
                      onChange={(e) => setProfileData({...profileData, position: e.target.value})}
                      placeholder="Tu cargo o posición"
                      disabled={!isEditing}
                      className="border-border focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-medium text-foreground dark:text-slate-300">
                      Ubicación
                    </Label>
                    <Input
                      id="location"
                      value={profileData.location}
                      onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                      placeholder="Ciudad, País"
                      disabled={!isEditing}
                      className="border-border focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-sm font-medium text-foreground dark:text-slate-300">
                    Sitio web
                  </Label>
                  <Input
                    id="website"
                    value={profileData.website}
                    onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                    placeholder="https://tu-sitio.com"
                    disabled={!isEditing}
                    className="border-border focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-sm font-medium text-foreground dark:text-slate-300">
                    Biografía
                  </Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    placeholder="Cuéntanos sobre ti..."
                    rows={3}
                    disabled={!isEditing}
                    className="border-border focus:border-blue-500 focus:ring-blue-500 resize-none"
                  />
                </div>
                {isEditing && (
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleProfileUpdate}
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-500 via-purple-600 to-fuchsia-600 hover:from-blue-600 hover:to-fuchsia-700 shadow-lg text-white font-medium"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Guardar cambios
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Seguridad - Acordeón Completo */}
            <Card className="bg-card dark:bg-slate-800/50 rounded-2xl shadow-lg border border-border/50 dark:border-slate-700/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-xl">
                      <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-slate-800 dark:text-white">Seguridad</CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-300">
                        Gestiona la seguridad de tu cuenta
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSecurityExpanded(!isSecurityExpanded)}
                    className="border-border text-foreground hover:bg-muted/50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/50"
                  >
                    {isSecurityExpanded ? <X className="h-4 w-4 mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
                    {isSecurityExpanded ? 'Cerrar' : 'Abrir'}
                  </Button>
                </div>
              </CardHeader>
              
              {isSecurityExpanded && (
                <CardContent className="space-y-6">
                  {/* Indicadores de Seguridad */}
                  <SecurityIndicators
                    has2FA={has2FA}
                    hasStrongPassword={hasStrongPassword}
                    isSecureConnection={isSecureConnection}
                    lastLogin={user.last_sign_in_at}
                    loginLocation="Buenos Aires, Argentina"
                  />

                  {/* Autenticación de Dos Factores */}
                  <TwoFactorAuth
                    isEnabled={has2FA}
                    onToggle={setHas2FA}
                  />

                  {/* Cambio de Contraseña */}
                  <div className="border-t border-slate-200 dark:border-slate-600 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                          <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Cambiar Contraseña</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            Actualiza tu contraseña para mantener tu cuenta segura
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsChangingPassword(!isChangingPassword)}
                        className="border-border text-foreground hover:bg-muted/50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/50"
                      >
                        {isChangingPassword ? <X className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                        {isChangingPassword ? 'Cancelar' : 'Cambiar contraseña'}
                      </Button>
                    </div>

                    {!isChangingPassword ? (
                      <div className="flex items-center justify-between p-4 bg-muted/50 dark:bg-slate-700/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Lock className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-300">Última actualización: Nunca</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword" className="text-sm font-medium text-foreground dark:text-slate-300">
                            Contraseña actual
                          </Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              type={showPassword ? 'text' : 'password'}
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                              placeholder="Ingresa tu contraseña actual"
                              className="border-border focus:border-blue-500 focus:ring-blue-500 pr-10 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4 text-slate-500 dark:text-slate-400" /> : <Eye className="h-4 w-4 text-slate-500 dark:text-slate-400" />}
                            </Button>
                          </div>
                        </div>
                        
                        {/* Nueva contraseña con validador */}
                        <div className="space-y-2">
                          <Label htmlFor="newPassword" className="text-sm font-medium text-foreground dark:text-slate-300">
                            Nueva contraseña
                          </Label>
                          <PasswordValidator
                            password={passwordData.newPassword}
                            onPasswordChange={(password) => {
                              setPasswordData({...passwordData, newPassword: password});
                              setHasStrongPassword(password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password));
                            }}
                            showPassword={showNewPassword}
                            onToggleShowPassword={() => setShowNewPassword(!showNewPassword)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground dark:text-slate-300">
                            Confirmar nueva contraseña
                          </Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                              placeholder="Confirma tu nueva contraseña"
                              className="border-border focus:border-blue-500 focus:ring-blue-500 pr-10 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4 text-slate-500" /> : <Eye className="h-4 w-4 text-slate-500" />}
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                          <Button
                            onClick={handlePasswordChange}
                            disabled={loading || !hasStrongPassword || passwordData.newPassword !== passwordData.confirmPassword}
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            {loading ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Actualizando...
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Save className="h-4 w-4" />
                                Actualizar contraseña
                              </div>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setIsChangingPassword(false)}
                            className="border-border text-foreground hover:bg-muted/50"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Columna derecha - Foto de perfil y cuenta */}
          <div className="space-y-6">
            {/* Foto de perfil */}
            <Card className="bg-card dark:bg-slate-800/50 rounded-2xl shadow-lg border border-border/50 dark:border-slate-700/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
                    <Camera className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-xl text-slate-800 dark:text-white">Foto de perfil</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="flex justify-center">
                  <Avatar className="h-24 w-24 border-4 border-slate-200 dark:border-slate-600">
                    <AvatarImage 
                      src={user.avatar_url || user.avatar} 
                      alt={user.full_name || user.email} 
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                      {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <Button
                  variant="outline"
                  onClick={handlePhotoChange}
                  disabled={loading}
                  className="w-full border-border text-foreground hover:bg-muted/50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-500 mr-2"></div>
                  ) : (
                    <Camera className="h-4 w-4 mr-2" />
                  )}
                  {loading ? 'Subiendo...' : 'Cambiar foto'}
                </Button>

                {/* Botón de eliminar foto */}
                {!isDefaultAvatar(user?.avatar_url) && (
                  <Button
                    variant="outline"
                    onClick={handleDeleteAvatar}
                    disabled={loading}
                    className="w-full border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/20 dark:hover:border-red-500"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500 mr-2"></div>
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    {loading ? 'Eliminando...' : 'Eliminar foto'}
                  </Button>
                )}
                
                {/* Input de archivo oculto */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </CardContent>
            </Card>

            {/* Información de la cuenta */}
            <Card className="bg-card dark:bg-slate-800/50 rounded-2xl shadow-lg border border-border/50 dark:border-slate-700/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-xl">
                    <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <CardTitle className="text-xl text-slate-800 dark:text-white">Información de la cuenta</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 dark:bg-slate-700/50 rounded-xl">
                  <span className="text-sm font-medium text-foreground dark:text-slate-300">Rol:</span>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700/50">
                    {user.role || 'user'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 dark:bg-slate-700/50 rounded-xl">
                  <span className="text-sm font-medium text-foreground dark:text-slate-300">Estado:</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700/50">
                    {user.status || 'active'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 dark:bg-slate-700/50 rounded-xl">
                  <span className="text-sm font-medium text-foreground dark:text-slate-300">Miembro desde:</span>
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {new Date(user.created_at || Date.now()).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Integraciones Sociales - Solo para Administradores */}
        {user?.role === 'admin' && (
          <div className="space-y-6">
            <Separator />
            <SocialIntegrations />
          </div>
        )}
      </div>
    </div>
  );
});

Perfil.displayName = 'Perfil';

export default Perfil; 
