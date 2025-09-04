import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  Mail,
  Calendar,
  Shield,
  User,
  Building,
  Globe,
  Phone,
  MapPin,
  Clock
} from 'lucide-react';
import { formatDateSafe } from '@/utils/formatDateSafe';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  company?: string;
  website?: string;
  phone?: string;
  location?: string;
  bio?: string;
}

export default function UserProfileView() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useApp();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadUserProfile();
    }
  }, [userId]);

  const loadUserProfile = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error cargando perfil del usuario:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el perfil del usuario',
        variant: 'destructive'
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Admin</Badge>;
      case 'client':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Cliente</Badge>;
      case 'user':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Usuario</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{role}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Usuario no encontrado</h2>
          <p className="text-slate-600 mb-4">El usuario que buscas no existe o no tienes acceso.</p>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200/50">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Perfil de Usuario</h1>
              <p className="text-slate-600 mt-2">Información del perfil público</p>
            </div>
          </div>

          {/* Información principal del usuario */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Avatar y información básica */}
            <div className="flex flex-col items-center lg:items-start space-y-4">
              <Avatar className="w-32 h-32 ring-4 ring-slate-200">
                {userProfile.avatar_url ? (
                  <AvatarImage 
                    src={userProfile.avatar_url} 
                    alt={userProfile.full_name}
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback className="text-4xl font-bold bg-slate-100 text-slate-600">
                  {userProfile.full_name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center lg:text-left">
                <h2 className="text-2xl font-bold text-slate-800">{userProfile.full_name}</h2>
                <div className="flex items-center justify-center lg:justify-start gap-2 mt-2">
                  {getRoleBadge(userProfile.role)}
                </div>
              </div>
            </div>

            {/* Información detallada */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Mail className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="font-medium text-slate-800">{userProfile.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-500">Miembro desde</p>
                    <p className="font-medium text-slate-800">{formatDateSafe(userProfile.created_at)}</p>
                  </div>
                </div>

                {userProfile.company && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Building className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-sm text-slate-500">Empresa</p>
                      <p className="font-medium text-slate-800">{userProfile.company}</p>
                    </div>
                  </div>
                )}

                {userProfile.website && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Globe className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-sm text-slate-500">Sitio web</p>
                      <a 
                        href={userProfile.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {userProfile.website}
                      </a>
                    </div>
                  </div>
                )}

                {userProfile.phone && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Phone className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-sm text-slate-500">Teléfono</p>
                      <p className="font-medium text-slate-800">{userProfile.phone}</p>
                    </div>
                  </div>
                )}

                {userProfile.location && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-sm text-slate-500">Ubicación</p>
                      <p className="font-medium text-slate-800">{userProfile.location}</p>
                    </div>
                  </div>
                )}
              </div>

              {userProfile.bio && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h3 className="font-medium text-slate-800 mb-2">Biografía</h3>
                  <p className="text-slate-600">{userProfile.bio}</p>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Clock className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-500">Última actualización</p>
                  <p className="font-medium text-slate-800">{formatDateSafe(userProfile.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200/50">
          <div className="flex flex-wrap gap-3">
            {currentUser?.id !== userProfile.id && (
              <Button 
                variant="outline"
                onClick={() => navigate(`/proyectos/${userProfile.id}`)}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Ver proyectos de {userProfile.full_name}
              </Button>
            )}
            
            <Button 
              variant="outline"
              onClick={() => navigate(-1)}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Volver
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
