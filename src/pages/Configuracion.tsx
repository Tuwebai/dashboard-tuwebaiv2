import { useApp } from '@/contexts/AppContext';
import type { AppContextType } from '@/contexts/AppContext';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from '@/components/OptimizedMotion';

import { 
  Settings, 
  Palette, 
  Globe, 
  Shield, 
  Monitor, 
  Smartphone, 
  Save, 
  RefreshCw,
  Trash2,
  Download,
  Upload,
  Database,
  Bell,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  FileText,
  Cog
} from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

// Estilos CSS personalizados para animaciones
const customStyles = `
  @keyframes gradient-x {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  
  .animate-gradient-x {
    background-size: 200% 200%;
    animation: gradient-x 3s ease infinite;
  }
  
  .animate-spin-slow {
    animation: spin 3s linear infinite;
  }
`;

const Configuracion = React.memo(() => {
  const { user, updateUserSettings, getUserProjects } = useApp() as AppContextType;
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const { t } = useTranslation();
  
  // Configuración general
  const [generalSettings, setGeneralSettings] = useState({
    language: 'es',
    timezone: 'America/Argentina/Buenos_Aires',
    date_format: 'DD/MM/YYYY',
    time_format: '24h'
  });

  // Configuración de privacidad
  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: 'public',
    show_email: false,
    show_phone: false,
    allow_analytics: true,
    allow_cookies: true,
    two_factor_auth: false
  });

  // Configuración de rendimiento
  const [performanceSettings, setPerformanceSettings] = useState({
    auto_save: true,
    auto_save_interval: 30,
    cache_enabled: true,
    image_quality: 'high',
    animations_enabled: true,
    low_bandwidth_mode: false
  });

  // Configuración de seguridad
  const [securitySettings, setSecuritySettings] = useState({
    session_timeout: 30,
    max_login_attempts: 5,
    require_password_change: false,
    password_expiry_days: 90,
    login_notifications: true,
    device_management: true
  });

  // Configuración del sistema (solo para admins)
  const [systemSettings, setSystemSettings] = useState({
    system_name: 'TuWebAI Dashboard',
    system_timezone: 'UTC',
    system_language: 'es',
    maintenance_mode: false,
    debug_mode: false,
    log_level: 'info',
    backup_frequency: 'daily',
    auto_updates: true
  });

  useEffect(() => {
    if (user) {
      // Cargar configuración guardada del usuario
      setGeneralSettings({
        language: user.language || 'es',
        timezone: user.timezone || 'America/Argentina/Buenos_Aires',
        date_format: user.date_format || 'DD/MM/YYYY',
        time_format: user.time_format || '24h'
      });

      setPrivacySettings({
        profile_visibility: user.profile_visibility || 'public',
        show_email: user.show_email || false,
        show_phone: user.show_phone || false,
        allow_analytics: user.allow_analytics !== false,
        allow_cookies: user.allow_cookies !== false,
        two_factor_auth: user.two_factor_auth || false
      });

      setPerformanceSettings({
        auto_save: user.auto_save !== false,
        auto_save_interval: user.auto_save_interval || 30,
        cache_enabled: user.cache_enabled !== false,
        image_quality: user.image_quality || 'high',
        animations_enabled: user.animations_enabled !== false,
        low_bandwidth_mode: user.low_bandwidth_mode || false
      });

      setSecuritySettings({
        session_timeout: user.session_timeout || 30,
        max_login_attempts: user.max_login_attempts || 5,
        require_password_change: user.require_password_change || false,
        password_expiry_days: user.password_expiry_days || 90,
        login_notifications: user.login_notifications !== false,
        device_management: user.device_management !== false
      });
    }
  }, [user]);

  const handleSaveGeneralSettings = async () => {
    setLoading(true);
    try {
      await updateUserSettings({
        language: generalSettings.language,
        timezone: generalSettings.timezone,
        date_format: generalSettings.date_format,
        time_format: generalSettings.time_format
      });
      
      toast({
        title: 'Configuración guardada',
        description: 'Los cambios se han aplicado correctamente.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los cambios.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrivacySettings = async () => {
    setLoading(true);
    try {
      await updateUserSettings({
        profile_visibility: privacySettings.profile_visibility,
        show_email: privacySettings.show_email,
        show_phone: privacySettings.show_phone,
        allow_analytics: privacySettings.allow_analytics,
        allow_cookies: privacySettings.allow_cookies,
        two_factor_auth: privacySettings.two_factor_auth
      });
      
      toast({
        title: 'Configuración guardada',
        description: 'Los cambios de privacidad se han aplicado correctamente.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los cambios de privacidad.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePerformanceSettings = async () => {
    setLoading(true);
    try {
      await updateUserSettings({
        auto_save: performanceSettings.auto_save,
        auto_save_interval: performanceSettings.auto_save_interval,
        cache_enabled: performanceSettings.cache_enabled,
        image_quality: performanceSettings.image_quality,
        animations_enabled: performanceSettings.animations_enabled,
        low_bandwidth_mode: performanceSettings.low_bandwidth_mode
      });
      
      toast({
        title: 'Configuración guardada',
        description: 'Los cambios de rendimiento se han aplicado correctamente.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los cambios de rendimiento.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSecuritySettings = async () => {
    setLoading(true);
    try {
      await updateUserSettings({
        session_timeout: securitySettings.session_timeout,
        max_login_attempts: securitySettings.max_login_attempts,
        require_password_change: securitySettings.require_password_change,
        password_expiry_days: securitySettings.password_expiry_days,
        login_notifications: securitySettings.login_notifications,
        device_management: securitySettings.device_management
      });
      
      toast({
        title: 'Configuración guardada',
        description: 'Los cambios de seguridad se han aplicado correctamente.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los cambios de seguridad.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSystemSettings = async () => {
    setLoading(true);
    try {
      // Aquí se guardarían los cambios del sistema en la base de datos
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulación
      
      toast({
        title: 'Configuración del sistema guardada',
        description: 'Los cambios del sistema han sido guardados correctamente.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los cambios del sistema.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAllSettings = async () => {
    setLoading(true);
    try {
      await updateUserSettings({
        ...generalSettings,
        ...privacySettings,
        ...performanceSettings,
        ...securitySettings
      });
      
      toast({
        title: 'Configuración guardada',
        description: 'Todas las configuraciones se han guardado correctamente.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron guardar todas las configuraciones.',
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
          <p className="mt-4 text-muted-foreground">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{customStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900">
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Header con diseño claro y moderno */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative group"
          >
            <div className="bg-card dark:bg-slate-800/50 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 border border-border/50 dark:border-slate-700/50 backdrop-blur-sm overflow-hidden bg-gradient-to-br from-white via-blue-25 to-indigo-25 dark:from-slate-800 dark:via-slate-700/50 dark:to-slate-800">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <motion.h1 
                    className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    Configuración
                  </motion.h1>
                  <motion.p 
                    className="text-muted-foreground dark:text-slate-300 mt-2 text-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    Personaliza tu experiencia en la plataforma
                  </motion.p>
                </div>
                <motion.div 
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-slate-300 bg-muted/50 dark:bg-slate-700/50 px-4 py-2 rounded-xl">
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold">Proyectos: {getUserProjects().length}</span>
                  </div>
                </motion.div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/20 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
            </div>
          </motion.div>

          {/* Tabs de configuración con diseño moderno */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className={`grid w-full ${user?.role === 'admin' ? 'grid-cols-5' : 'grid-cols-4'} bg-card dark:bg-slate-800/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50 dark:border-slate-700/50 p-1 backdrop-blur-sm`}>
                <TabsTrigger 
                  value="general" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl transition-all duration-300 hover:scale-105 data-[state=active]:shadow-lg text-slate-700 dark:text-slate-300 font-medium"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2"
                  >
                    <Globe className="h-4 w-4" />
                    <span className="font-medium">General</span>
                  </motion.div>
                </TabsTrigger>
                <TabsTrigger 
                  value="privacidad" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-xl transition-all duration-300 hover:scale-105 data-[state=active]:shadow-lg text-slate-700 dark:text-slate-300 font-medium"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    <span className="font-medium">Privacidad</span>
                  </motion.div>
                </TabsTrigger>
                <TabsTrigger 
                  value="rendimiento" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-xl transition-all duration-300 hover:scale-105 data-[state=active]:shadow-lg text-slate-700 dark:text-slate-300 font-medium"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2"
                  >
                    <Monitor className="h-4 w-4" />
                    <span className="font-medium">Rendimiento</span>
                  </motion.div>
                </TabsTrigger>
                <TabsTrigger 
                  value="seguridad" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-xl transition-all duration-300 hover:scale-105 data-[state=active]:shadow-lg text-slate-700 dark:text-slate-300 font-medium"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2"
                  >
                    <Lock className="h-4 w-4" />
                    <span className="font-medium">Seguridad</span>
                  </motion.div>
                </TabsTrigger>
                {user?.role === 'admin' && (
                  <TabsTrigger 
                    value="admin" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white rounded-xl transition-all duration-300 hover:scale-105 data-[state=active]:shadow-lg text-slate-700 dark:text-slate-300 font-medium"
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2"
                    >
                      <Cog className="h-4 w-4" />
                      <span className="font-medium">Admin</span>
                    </motion.div>
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Configuración General */}
              <TabsContent value="general" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="relative group"
                >
                  <Card className="bg-card dark:bg-slate-800/50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 border border-border/50 dark:border-slate-700/50 backdrop-blur-sm overflow-hidden bg-gradient-to-br from-white via-blue-25 to-indigo-25 dark:from-slate-800 dark:via-slate-700/50 dark:to-slate-800">
                    <CardHeader>
                      <CardTitle className="text-xl text-slate-800 dark:text-white flex items-center gap-2">
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </motion.div>
                        Configuración General
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div 
                          className="space-y-2"
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Label htmlFor="language" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Idioma
                          </Label>
                          <Select
                            value={generalSettings.language}
                            onValueChange={(value) => setGeneralSettings({...generalSettings, language: value})}
                          >
                            <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors duration-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="es">Español</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="pt">Português</SelectItem>
                            </SelectContent>
                          </Select>
                        </motion.div>

                        <div className="space-y-2">
                          <Label htmlFor="timezone" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Zona horaria
                          </Label>
                          <Select
                            value={generalSettings.timezone}
                            onValueChange={(value) => setGeneralSettings({...generalSettings, timezone: value})}
                          >
                            <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</SelectItem>
                              <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                              <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
                              <SelectItem value="UTC">UTC</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <motion.div 
                          className="space-y-2"
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Label htmlFor="date_format" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Formato de fecha
                          </Label>
                          <Select
                            value={generalSettings.date_format}
                            onValueChange={(value) => setGeneralSettings({...generalSettings, date_format: value})}
                          >
                            <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors duration-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                            </SelectContent>
                          </Select>
                        </motion.div>

                        <motion.div 
                          className="space-y-2"
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Label htmlFor="time_format" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Formato de hora
                          </Label>
                          <Select
                            value={generalSettings.time_format}
                            onValueChange={(value) => setGeneralSettings({...generalSettings, time_format: value})}
                          >
                            <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors duration-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="24h">24 horas</SelectItem>
                              <SelectItem value="12h">12 horas</SelectItem>
                            </SelectContent>
                          </Select>
                        </motion.div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <Button
                          onClick={handleSaveGeneralSettings}
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
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Configuración de Privacidad */}
              <TabsContent value="privacidad" className="space-y-6">
                <Card className="bg-card dark:bg-slate-800/50 rounded-2xl shadow-lg border border-border/50 dark:border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-xl text-slate-800 dark:text-white flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                      Configuración de Privacidad
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Visibilidad del perfil
                          </Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Controla quién puede ver tu información
                          </p>
                        </div>
                        <Select
                          value={privacySettings.profile_visibility}
                          onValueChange={(value) => setPrivacySettings({...privacySettings, profile_visibility: value})}
                        >
                          <SelectTrigger className="w-32 border-slate-300 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Público</SelectItem>
                            <SelectItem value="friends">Amigos</SelectItem>
                            <SelectItem value="private">Privado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Mostrar email
                          </Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Permite que otros usuarios vean tu email
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings.show_email}
                          onCheckedChange={(checked) => setPrivacySettings({...privacySettings, show_email: checked})}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Mostrar teléfono
                          </Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Permite que otros usuarios vean tu teléfono
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings.show_phone}
                          onCheckedChange={(checked) => setPrivacySettings({...privacySettings, show_phone: checked})}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Análisis y cookies
                          </Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Permite el uso de cookies para mejorar la experiencia
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings.allow_cookies}
                          onCheckedChange={(checked) => setPrivacySettings({...privacySettings, allow_cookies: checked})}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Autenticación de dos factores
                          </Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Añade una capa extra de seguridad a tu cuenta
                          </p>
                        </div>
                        <Switch
                          checked={privacySettings.two_factor_auth}
                          onCheckedChange={(checked) => setPrivacySettings({...privacySettings, two_factor_auth: checked})}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={handleSavePrivacySettings}
                        disabled={loading}
                        className="bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 hover:from-green-600 hover:to-teal-700 shadow-lg text-white font-medium"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Shield className="h-4 w-4 mr-2" />
                        )}
                        Guardar cambios
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Configuración de Rendimiento */}
              <TabsContent value="rendimiento" className="space-y-6">
                <Card className="bg-card dark:bg-slate-800/50 rounded-2xl shadow-lg border border-border/50 dark:border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-xl text-slate-800 dark:text-white flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      Configuración de Rendimiento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Guardado automático
                          </Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Guarda automáticamente tus cambios
                          </p>
                        </div>
                        <Switch
                          checked={performanceSettings.auto_save}
                          onCheckedChange={(checked) => setPerformanceSettings({...performanceSettings, auto_save: checked})}
                        />
                      </div>

                      {performanceSettings.auto_save && (
                        <div className="space-y-2 p-4 bg-blue-50 rounded-xl border-l-4 border-blue-500">
                          <Label className="text-sm font-medium text-blue-700">
                            Intervalo de guardado: {performanceSettings.auto_save_interval} segundos
                          </Label>
                          <Slider
                            value={[performanceSettings.auto_save_interval]}
                            onValueChange={(value) => setPerformanceSettings({...performanceSettings, auto_save_interval: value[0]})}
                            max={120}
                            min={10}
                            step={10}
                            className="w-full"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Cache habilitado
                          </Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Mejora la velocidad de carga
                          </p>
                        </div>
                        <Switch
                          checked={performanceSettings.cache_enabled}
                          onCheckedChange={(checked) => setPerformanceSettings({...performanceSettings, cache_enabled: checked})}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Calidad de imagen
                          </Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Balance entre calidad y velocidad
                          </p>
                        </div>
                        <Select
                          value={performanceSettings.image_quality}
                          onValueChange={(value) => setPerformanceSettings({...performanceSettings, image_quality: value})}
                        >
                          <SelectTrigger className="w-32 border-slate-300 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Baja</SelectItem>
                            <SelectItem value="medium">Media</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Animaciones
                          </Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Habilita las animaciones de la interfaz
                          </p>
                        </div>
                        <Switch
                          checked={performanceSettings.animations_enabled}
                          onCheckedChange={(checked) => setPerformanceSettings({...performanceSettings, animations_enabled: checked})}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Modo de bajo ancho de banda
                          </Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Optimiza para conexiones lentas
                          </p>
                        </div>
                        <Switch
                          checked={performanceSettings.low_bandwidth_mode}
                          onCheckedChange={(checked) => setPerformanceSettings({...performanceSettings, low_bandwidth_mode: checked})}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={handleSavePerformanceSettings}
                        disabled={loading}
                        className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:to-red-600 shadow-lg text-white font-medium"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Monitor className="h-4 w-4 mr-2" />
                        )}
                        Guardar cambios
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Configuración de Seguridad */}
              <TabsContent value="seguridad" className="space-y-6">
                <Card className="bg-card dark:bg-slate-800/50 rounded-2xl shadow-lg border border-border/50 dark:border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-xl text-slate-800 dark:text-white flex items-center gap-2">
                      <Lock className="h-5 w-5 text-red-600 dark:text-red-400" />
                      Configuración de Seguridad
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Tiempo de sesión: {securitySettings.session_timeout} minutos
                        </Label>
                        <Slider
                          value={[securitySettings.session_timeout]}
                          onValueChange={(value) => setSecuritySettings({...securitySettings, session_timeout: value[0]})}
                          max={120}
                          min={15}
                          step={15}
                          className="w-full"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Tiempo antes de que se cierre la sesión por inactividad
                        </p>
                      </div>

                      <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Intentos máximos de login: {securitySettings.max_login_attempts}
                        </Label>
                        <Slider
                          value={[securitySettings.max_login_attempts]}
                          onValueChange={(value) => setSecuritySettings({...securitySettings, max_login_attempts: value[0]})}
                          max={10}
                          min={3}
                          step={1}
                          className="w-full"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Número de intentos antes de bloquear la cuenta
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Cambio obligatorio de contraseña
                          </Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Fuerza el cambio de contraseña periódicamente
                          </p>
                        </div>
                        <Switch
                          checked={securitySettings.require_password_change}
                          onCheckedChange={(checked) => setSecuritySettings({...securitySettings, require_password_change: checked})}
                        />
                      </div>

                      {securitySettings.require_password_change && (
                        <div className="space-y-2 p-4 bg-blue-50 rounded-xl border-l-4 border-blue-500">
                          <Label className="text-sm font-medium text-blue-700">
                            Días antes de expirar: {securitySettings.password_expiry_days}
                          </Label>
                          <Slider
                            value={[securitySettings.password_expiry_days]}
                            onValueChange={(value) => setSecuritySettings({...securitySettings, password_expiry_days: value[0]})}
                            max={365}
                            min={30}
                            step={30}
                            className="w-full"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Notificaciones de login
                          </Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Recibe alertas cuando se inicie sesión en tu cuenta
                          </p>
                        </div>
                        <Switch
                          checked={securitySettings.login_notifications}
                          onCheckedChange={(checked) => setSecuritySettings({...securitySettings, login_notifications: checked})}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Gestión de dispositivos
                          </Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Permite gestionar dispositivos conectados
                          </p>
                        </div>
                        <Switch
                          checked={securitySettings.device_management}
                          onCheckedChange={(checked) => setSecuritySettings({...securitySettings, device_management: checked})}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={handleSaveSecuritySettings}
                        disabled={loading}
                        className="bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 hover:from-red-600 hover:to-purple-600 shadow-lg text-white font-medium"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Lock className="h-4 w-4 mr-2" />
                        )}
                        Guardar cambios
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Configuración de Administración del Sistema (Solo para Admins) */}
              {user?.role === 'admin' && (
                <TabsContent value="admin" className="space-y-6">
                  <Card className="bg-card dark:bg-slate-800/50 rounded-2xl shadow-lg border border-border/50 dark:border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-xl text-slate-800 dark:text-white flex items-center gap-2">
                        <Cog className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        Administración del Sistema
                      </CardTitle>
                      <CardDescription className="text-muted-foreground dark:text-slate-300">
                        Configuraciones avanzadas del sistema (solo para administradores)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Nombre del Sistema
                          </Label>
                          <Input
                            value={systemSettings.system_name}
                            onChange={(e) => setSystemSettings({...systemSettings, system_name: e.target.value})}
                            className="border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                            placeholder="Nombre del sistema"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Zona Horaria del Sistema
                          </Label>
                          <Select
                            value={systemSettings.system_timezone}
                            onValueChange={(value) => setSystemSettings({...systemSettings, system_timezone: value})}
                          >
                            <SelectTrigger className="border-slate-300 focus:border-orange-500 focus:ring-orange-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UTC">UTC</SelectItem>
                              <SelectItem value="America/Argentina/Buenos_Aires">Argentina (GMT-3)</SelectItem>
                              <SelectItem value="America/New_York">Nueva York (GMT-5)</SelectItem>
                              <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
                              <SelectItem value="Asia/Tokyo">Tokio (GMT+9)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Idioma del Sistema
                          </Label>
                          <Select
                            value={systemSettings.system_language}
                            onValueChange={(value) => setSystemSettings({...systemSettings, system_language: value})}
                          >
                            <SelectTrigger className="border-slate-300 focus:border-orange-500 focus:ring-orange-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="es">Español</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="pt">Português</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Nivel de Log
                          </Label>
                          <Select
                            value={systemSettings.log_level}
                            onValueChange={(value) => setSystemSettings({...systemSettings, log_level: value})}
                          >
                            <SelectTrigger className="border-slate-300 focus:border-orange-500 focus:ring-orange-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="error">Error</SelectItem>
                              <SelectItem value="warn">Warning</SelectItem>
                              <SelectItem value="info">Info</SelectItem>
                              <SelectItem value="debug">Debug</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl border-l-4 border-orange-500">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium text-orange-700">
                              Modo de Mantenimiento
                            </Label>
                            <p className="text-xs text-orange-600">
                              Bloquea el acceso al sistema para mantenimiento
                            </p>
                          </div>
                          <Switch
                            checked={systemSettings.maintenance_mode}
                            onCheckedChange={(checked) => setSystemSettings({...systemSettings, maintenance_mode: checked})}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Modo Debug
                            </Label>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Habilita información de debug para desarrolladores
                            </p>
                          </div>
                          <Switch
                            checked={systemSettings.debug_mode}
                            onCheckedChange={(checked) => setSystemSettings({...systemSettings, debug_mode: checked})}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Actualizaciones Automáticas
                            </Label>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Permite actualizaciones automáticas del sistema
                            </p>
                          </div>
                          <Switch
                            checked={systemSettings.auto_updates}
                            onCheckedChange={(checked) => setSystemSettings({...systemSettings, auto_updates: checked})}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <Button
                          onClick={handleSaveSystemSettings}
                          disabled={loading}
                          className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-lg text-white font-medium"
                        >
                          {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <Cog className="h-4 w-4 mr-2" />
                          )}
                          Guardar configuración del sistema
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </motion.div>

          {/* Botón para guardar toda la configuración */}
          <div className="flex justify-center">
            <Button
              onClick={handleSaveAllSettings}
              disabled={loading}
              size="lg"
              className="bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:from-indigo-600 hover:to-pink-700 shadow-lg text-white font-medium px-8"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-5 w-5 mr-2" />
              )}
              Guardar toda la configuración
            </Button>
          </div>
        </div>
      </div>
    </>
  );
});

Configuracion.displayName = 'Configuracion';

export default Configuracion; 
