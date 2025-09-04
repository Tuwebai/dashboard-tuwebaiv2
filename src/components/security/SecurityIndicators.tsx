import React from 'react';
import { motion } from '@/components/OptimizedMotion';
import { 
  Shield, 
  Lock, 
  CheckCircle, 
  AlertTriangle, 
  Eye,
  Clock,
  Smartphone,
  Globe
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SecurityIndicatorsProps {
  has2FA: boolean;
  hasStrongPassword: boolean;
  isSecureConnection: boolean;
  lastLogin?: string;
  loginLocation?: string;
  className?: string;
}

export default function SecurityIndicators({
  has2FA,
  hasStrongPassword,
  isSecureConnection,
  lastLogin,
  loginLocation,
  className = ''
}: SecurityIndicatorsProps) {
  
  const getSecurityScore = () => {
    let score = 0;
    if (has2FA) score += 40;
    if (hasStrongPassword) score += 30;
    if (isSecureConnection) score += 30;
    return score;
  };

  const getSecurityLevel = () => {
    const score = getSecurityScore();
    if (score >= 90) return { level: 'Excelente', color: 'green', icon: Shield };
    if (score >= 70) return { level: 'Bueno', color: 'blue', icon: Lock };
    if (score >= 50) return { level: 'Regular', color: 'yellow', icon: AlertTriangle };
    return { level: 'Bajo', color: 'red', icon: AlertTriangle };
  };

  const securityLevel = getSecurityLevel();
  const SecurityIcon = securityLevel.icon;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Score general de seguridad */}
      <motion.div
        initial="hidden"
        animate="visible"
        className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <SecurityIcon className={`w-6 h-6 text-${securityLevel.color}-500`} />
            <div>
              <h3 className="font-semibold text-gray-900">Nivel de Seguridad</h3>
              <p className="text-sm text-gray-600">Protección de tu cuenta</p>
            </div>
          </div>
          <Badge 
            variant="default" 
            className={`bg-${securityLevel.color}-500 text-white`}
          >
            {securityLevel.level}
          </Badge>
        </div>
        
        {/* Barra de progreso */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <motion.div
            className={`h-2 rounded-full bg-${securityLevel.color}-500`}
            initial={{ width: 0 }}
            animate={{ width: `${getSecurityScore()}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <p className="text-xs text-gray-500">
          {getSecurityScore()}% de protección activa
        </p>
      </motion.div>

      {/* Indicadores específicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* 2FA */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
        >
          <div className={`p-2 rounded-full ${has2FA ? 'bg-green-100' : 'bg-gray-100'}`}>
            <Smartphone className={`w-4 h-4 ${has2FA ? 'text-green-600' : 'text-gray-400'}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Autenticación 2FA</p>
            <p className="text-xs text-gray-600">
              {has2FA ? 'Protegido con 2FA' : 'No configurado'}
            </p>
          </div>
          {has2FA ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          )}
        </motion.div>

        {/* Contraseña */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
        >
          <div className={`p-2 rounded-full ${hasStrongPassword ? 'bg-green-100' : 'bg-gray-100'}`}>
            <Lock className={`w-4 h-4 ${hasStrongPassword ? 'text-green-600' : 'text-gray-400'}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Contraseña Segura</p>
            <p className="text-xs text-gray-600">
              {hasStrongPassword ? 'Cumple requisitos' : 'Necesita mejorar'}
            </p>
          </div>
          {hasStrongPassword ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          )}
        </motion.div>

        {/* Conexión segura */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
        >
          <div className={`p-2 rounded-full ${isSecureConnection ? 'bg-green-100' : 'bg-red-100'}`}>
            <Globe className={`w-4 h-4 ${isSecureConnection ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Conexión Segura</p>
            <p className="text-xs text-gray-600">
              {isSecureConnection ? 'HTTPS activo' : 'Conexión insegura'}
            </p>
          </div>
          {isSecureConnection ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          )}
        </motion.div>

        {/* Último acceso */}
        {lastLogin && (
          <motion.div
            initial="hidden"
            animate="visible"
            className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
          >
            <div className="p-2 rounded-full bg-blue-100">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Último Acceso</p>
              <p className="text-xs text-gray-600">
                {new Date(lastLogin).toLocaleString()}
              </p>
              {loginLocation && (
                <p className="text-xs text-gray-500">{loginLocation}</p>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Recomendaciones */}
      {getSecurityScore() < 90 && (
        <motion.div
          initial="hidden"
          animate="visible"
          className="p-4 bg-amber-50 border border-amber-200 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-900 mb-2">
                Mejora tu seguridad
              </h4>
              <ul className="text-xs text-amber-800 space-y-1">
                {!has2FA && <li>• Activa la autenticación de dos factores</li>}
                {!hasStrongPassword && <li>• Usa una contraseña más segura</li>}
                {!isSecureConnection && <li>• Asegúrate de usar HTTPS</li>}
                <li>• Revisa regularmente tu actividad de cuenta</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
