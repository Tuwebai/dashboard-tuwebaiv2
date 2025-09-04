import React, { useState } from 'react';
import { motion } from '@/components/OptimizedMotion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  Smartphone, 
  CheckCircle, 
  AlertCircle, 
  QrCode,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TwoFactorAuthProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function TwoFactorAuth({ isEnabled, onToggle }: TwoFactorAuthProps) {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [secretKey, setSecretKey] = useState('JBSWY3DPEHPK3PXP'); // Clave de ejemplo
  const [showSecret, setShowSecret] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiMwMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkFSIENvZGUKU2VjcmV0OiB7c2VjcmV0S2V5fTwvdGV4dD48L3N2Zz4=');

  const handleSetup2FA = () => {
    setIsSettingUp(true);
    // En producción, aquí generarías la clave secreta real
    toast({
      title: 'Configuración de 2FA',
      description: 'Escanea el código QR con tu app de autenticación'
    });
  };

  const handleVerifyCode = () => {
    if (verificationCode.length !== 6) {
      toast({
        title: 'Código inválido',
        description: 'El código debe tener 6 dígitos',
        variant: 'destructive'
      });
      return;
    }

    // En producción, aquí verificarías el código con el servidor
    onToggle(true);
    setIsSettingUp(false);
    setVerificationCode('');
    
    toast({
      title: '2FA Activado',
      description: 'La autenticación de dos factores está ahora activa',
      variant: 'default'
    });
  };

  const handleDisable2FA = () => {
    onToggle(false);
    toast({
      title: '2FA Desactivado',
      description: 'La autenticación de dos factores ha sido desactivada',
      variant: 'default'
    });
  };

  const copySecretKey = () => {
    navigator.clipboard.writeText(secretKey);
    toast({
      title: 'Clave copiada',
      description: 'La clave secreta ha sido copiada al portapapeles'
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-blue-500" />
          Autenticación de Dos Factores (2FA)
          {isEnabled ? (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="w-3 h-3 mr-1" />
              Activo
            </Badge>
          ) : (
            <Badge variant="secondary">
              <AlertCircle className="w-3 h-3 mr-1" />
              Inactivo
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estado actual */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-slate-600" />
            <div>
              <p className="font-medium">
                {isEnabled ? '2FA Protegiendo tu cuenta' : 'Protege tu cuenta con 2FA'}
              </p>
              <p className="text-sm text-slate-600">
                {isEnabled 
                  ? 'Tu cuenta está protegida con autenticación de dos factores'
                  : 'Agrega una capa extra de seguridad a tu cuenta'
                }
              </p>
            </div>
          </div>
          {!isEnabled && (
            <Button onClick={handleSetup2FA} className="bg-blue-500 hover:bg-blue-600">
              Activar 2FA
            </Button>
          )}
        </div>

        {/* Configuración de 2FA */}
        {isSettingUp && (
          <motion.div
            initial="hidden"
            animate="visible"
            className="space-y-4 p-4 border border-blue-200 rounded-lg bg-blue-50"
          >
            <h4 className="font-semibold text-blue-900">Configuración de 2FA</h4>
            
            {/* Paso 1: Instalar app */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Paso 1: Instala una app de autenticación</p>
              <p className="text-sm text-slate-600">
                Recomendamos Google Authenticator, Authy o Microsoft Authenticator
              </p>
            </div>

            {/* Paso 2: Código QR */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Paso 2: Escanea este código QR</p>
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white rounded border">
                  <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-slate-600">O ingresa manualmente:</p>
                  <div className="flex items-center gap-2">
                    <Input
                      value={showSecret ? secretKey : '••••••••••••••••'}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copySecretKey}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Paso 3: Verificar código */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Paso 3: Ingresa el código de verificación</p>
              <div className="flex items-center gap-2">
                <Input
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="font-mono text-center text-lg tracking-widest"
                  maxLength={6}
                />
                <Button 
                  onClick={handleVerifyCode}
                  disabled={verificationCode.length !== 6}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Verificar
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Información de seguridad */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-900">
                Importante sobre la seguridad
              </p>
              <ul className="text-xs text-amber-800 space-y-1">
                <li>• Guarda la clave secreta en un lugar seguro</li>
                <li>• Sin esta clave no podrás recuperar el acceso</li>
                <li>• El 2FA protege contra el 99.9% de ataques</li>
                <li>• Puedes desactivarlo en cualquier momento</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botón para desactivar */}
        {isEnabled && (
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              onClick={handleDisable2FA}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Desactivar 2FA
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
