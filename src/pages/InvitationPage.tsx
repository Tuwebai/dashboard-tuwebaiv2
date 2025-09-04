import React from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  Briefcase,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { userManagementService, UserInvitation } from '@/lib/userManagement';

export default function InvitationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<UserInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  const [userData, setUserData] = useState({
    displayName: '',
    phone: '',
    department: '',
    position: '',
    bio: ''
  });

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      validateInvitation();
    } else {
      setError('Token de invitación no válido');
      setLoading(false);
    }
  }, [token]);

  const validateInvitation = async () => {
    if (!token) return;

    try {
      // Buscar la invitación por token
      const invitations = await userManagementService.getInvitations();
      const foundInvitation = invitations.find(inv => inv.token === token);

      if (!foundInvitation) {
        setError('Invitación no encontrada');
        setLoading(false);
        return;
      }

      if (foundInvitation.status !== 'pending') {
        setError('Esta invitación ya ha sido procesada');
        setLoading(false);
        return;
      }

      if (new Date(foundInvitation.expiresAt) < new Date()) {
        setExpired(true);
        setError('Esta invitación ha expirado');
        setLoading(false);
        return;
      }

      setInvitation(foundInvitation);
    } catch (error) {
      console.error('Error validating invitation:', error);
      setError('Error al validar la invitación');
    }
    setLoading(false);
  };

  const handleAcceptInvitation = async () => {
    if (!token || !invitation) return;

    setAccepting(true);
    try {
      await userManagementService.acceptInvitation(token, {
        displayName: userData.displayName,
        phone: userData.phone,
        department: userData.department,
        position: userData.position,
        bio: userData.bio
      });

      toast({
        title: 'Invitación aceptada',
        description: 'Tu cuenta ha sido creada exitosamente'
      });

      // Redirigir al login
      navigate('/login');
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: 'Error',
        description: 'No se pudo aceptar la invitación',
        variant: 'destructive'
      });
    }
    setAccepting(false);
  };

  const handleDeclineInvitation = () => {
    // Implementar lógica para rechazar invitación
    toast({
      title: 'Invitación rechazada',
      description: 'Has rechazado la invitación'
    });
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              {expired ? (
                <Clock className="h-12 w-12 text-yellow-500 mx-auto" />
              ) : (
                <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              )}
              <h2 className="text-xl font-semibold">
                {expired ? 'Invitación Expirada' : 'Error'}
              </h2>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => navigate('/')} className="w-full">
                Volver al Inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
              <h2 className="text-xl font-semibold">Invitación No Válida</h2>
              <p className="text-muted-foreground">
                La invitación no se pudo encontrar o ya no es válida.
              </p>
              <Button onClick={() => navigate('/')} className="w-full">
                Volver al Inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">¡Has sido invitado!</CardTitle>
          <p className="text-muted-foreground">
            Completa tu información para unirte al equipo
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Información de la invitación */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Detalles de la invitación</span>
            </div>
            <div className="space-y-1 text-sm">
              <p><strong>Email:</strong> {invitation.email}</p>
              <p><strong>Rol:</strong> {invitation.role}</p>
              <p><strong>Invitado por:</strong> {invitation.invitedBy}</p>
              <p><strong>Expira:</strong> {new Date(invitation.expiresAt).toLocaleDateString('es-ES')}</p>
            </div>
            {invitation.message && (
              <div className="mt-3 p-3 bg-white rounded border">
                <p className="text-sm italic">"{invitation.message}"</p>
              </div>
            )}
          </div>

          {/* Formulario de información personal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="displayName">Nombre Completo *</Label>
                <Input
                  id="displayName"
                  value={userData.displayName}
                  onChange={(e) => setUserData({ ...userData, displayName: e.target.value })}
                  placeholder="Tu nombre completo"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={userData.phone}
                  onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Departamento</Label>
                <Input
                  id="department"
                  value={userData.department}
                  onChange={(e) => setUserData({ ...userData, department: e.target.value })}
                  placeholder="Desarrollo"
                />
              </div>
              
              <div>
                <Label htmlFor="position">Cargo</Label>
                <Input
                  id="position"
                  value={userData.position}
                  onChange={(e) => setUserData({ ...userData, position: e.target.value })}
                  placeholder="Desarrollador Senior"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="bio">Biografía</Label>
              <Textarea
                id="bio"
                value={userData.bio}
                onChange={(e) => setUserData({ ...userData, bio: e.target.value })}
                placeholder="Cuéntanos sobre ti..."
                rows={3}
              />
            </div>
          </div>

          {/* Términos y condiciones */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Al aceptar esta invitación, confirmas que has leído y aceptas nuestros{' '}
              <a href="#" className="underline">términos de servicio</a> y{' '}
              <a href="#" className="underline">política de privacidad</a>.
            </AlertDescription>
          </Alert>

          {/* Botones de acción */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleDeclineInvitation}
              className="flex-1"
              disabled={accepting}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rechazar
            </Button>
            
            <Button
              onClick={handleAcceptInvitation}
              className="flex-1"
              disabled={accepting || !userData.displayName.trim()}
            >
              {accepting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Aceptar Invitación
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
