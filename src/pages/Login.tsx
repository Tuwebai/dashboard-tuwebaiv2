import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Github, Chrome, Sparkles, Zap, Globe, Database, Code, Palette, BarChart3, PieChart, TrendingUp, Users, FileText, Settings, Bell, CreditCard, Target, Activity, Layers, Cpu, Network } from 'lucide-react';

// Componente para texto deformable
const DeformableText = ({ 
  text, 
  id, 
  isDeformed, 
  className = "" 
}: { 
  text: string; 
  id: string; 
  isDeformed: boolean; 
  className?: string; 
}) => {
  const letters = text.split('');
  

  
  return (
    <span 
      id={id} 
      className={`${className} ${isDeformed ? 'text-chaos' : ''}`}
      style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
    >
      {letters.map((letter, index) => (
        <span
          key={index}
          className={`letter-scatter ${isDeformed ? 'text-deformed' : ''}`}
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            '--random-x': isDeformed ? `${(Math.random() - 0.5) * 100}px` : '0px',
            '--random-y': isDeformed ? `${(Math.random() - 0.5) * 100}px` : '0px',
            '--random-rotation': isDeformed ? `${(Math.random() - 0.5) * 360}deg` : '0deg',
            '--scatter-x': isDeformed ? `${(Math.random() - 0.5) * 50}px` : '0px',
            '--scatter-y': isDeformed ? `${(Math.random() - 0.5) * 50}px` : '0px',
            '--scatter-rotation': isDeformed ? `${(Math.random() - 0.5) * 180}deg` : '0deg',
            '--scatter-color': isDeformed ? `hsl(${Math.random() * 360}, 70%, 60%)` : 'inherit',
            animationDelay: isDeformed ? `${index * 0.05}s` : '0s'
          } as React.CSSProperties}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </span>
      ))}
    </span>
  );
};


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [elementPositions, setElementPositions] = useState<Record<string, { x: number; y: number }>>({
    logo: { x: 0, y: 0 },
    barChart: { x: 0, y: 0 },
    pieChart: { x: 0, y: 0 },
    users: { x: 0, y: 0 },
    analytics: { x: 0, y: 0 },
    database: { x: 0, y: 0 },
    settings: { x: 0, y: 0 },
    payments: { x: 0, y: 0 },
    target: { x: 0, y: 0 },
    activity: { x: 0, y: 0 },
    layers: { x: 0, y: 0 },
    cpu: { x: 0, y: 0 },
    network: { x: 0, y: 0 }
  });
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [textDeformation, setTextDeformation] = useState<Record<string, boolean>>({});
  const { login, loginWithGoogle, loginWithGithub } = useApp();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Detectar dispositivo táctil
  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouchDevice();
  }, []);

  // Funciones para manejar el arrastre de elementos
  const handleElementSelect = (elementId: string, clientX: number, clientY: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const currentPos = elementPositions[elementId];
      
      // Calcular el offset entre el mouse y la posición actual del elemento
      const mouseX = clientX - rect.left - rect.width / 2;
      const mouseY = clientY - rect.top - rect.height / 2;
      
      setDragOffset({
        x: mouseX - currentPos.x,
        y: mouseY - currentPos.y
      });
    }
    setSelectedElement(elementId);
  };

  const handleElementDrag = (elementId: string, clientX: number, clientY: number) => {
    if (containerRef.current && selectedElement === elementId) {
      const rect = containerRef.current.getBoundingClientRect();
      // Calcular posición relativa al centro del contenedor, aplicando el offset
      const x = clientX - rect.left - rect.width / 2 - dragOffset.x;
      const y = clientY - rect.top - rect.height / 2 - dragOffset.y;
      
      setElementPositions(prev => ({
        ...prev,
        [elementId]: { x, y }
      }));

      // Detectar colisión con elementos de texto
      checkTextCollision(elementId, clientX, clientY);
    }
  };

  const checkTextCollision = (elementId: string, clientX: number, clientY: number) => {
    const textElements = ['title', 'subtitle', 'emailLabel', 'passwordLabel'];
    
    textElements.forEach(textId => {
      const textElement = document.getElementById(textId);
      if (textElement) {
        const textRect = textElement.getBoundingClientRect();
        // Detectar colisión con TODA la pantalla para asegurar que funcione
        const isColliding = true; // SIEMPRE detectar colisión para probar
        
        setTextDeformation(prev => ({
          ...prev,
          [textId]: isColliding
        }));
      }
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (selectedElement && isDragging) {
      handleElementDrag(selectedElement, e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setSelectedElement(null);
    // Limpiar deformaciones después de un delay
    setTimeout(() => {
      setTextDeformation({});
    }, 1000);
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (selectedElement && isDragging && e.touches.length > 0) {
      const touch = e.touches[0];
      handleElementDrag(selectedElement, touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setSelectedElement(null);
    // Limpiar deformaciones después de un delay
    setTimeout(() => {
      setTextDeformation({});
    }, 1000);
  };

  // Event listeners globales para el arrastre
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseup', handleMouseUp);
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseup', handleMouseUp);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [selectedElement, isDragging]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await login(email, password);
    if (success) {
      // La notificación se muestra en el contexto después de la autenticación exitosa
      // Redirigir según el rol
      if (email.toLowerCase() === 'tuwebai@gmail.com') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      toast({
        title: "Error",
        description: "Credenciales inválidas o usuario no registrado.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const success = await loginWithGoogle();
    if (success) {
      // La notificación se muestra en el callback de autenticación
      // No redirigir aquí ya que OAuth redirige automáticamente
    } else {
      toast({ title: 'Error', description: 'No se pudo iniciar sesión con Google.', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const handleGithubLogin = async () => {
    setIsLoading(true);
    const success = await loginWithGithub();
    if (success) {
      // La notificación se muestra en el callback de autenticación
      // No redirigir aquí ya que OAuth redirige automáticamente
    } else {
      toast({ title: 'Error', description: 'No se pudo iniciar sesión con GitHub.', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  return (
    <div 
      ref={containerRef} 
      className="min-h-screen bg-gradient-to-br from-blue-900 via-cyan-800 to-emerald-900 flex items-center justify-center p-4 relative overflow-hidden"
      style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
    >
      {/* Partículas flotantes animadas */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full opacity-60 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Elementos 3D relacionados con dashboards */}
      <div className="absolute inset-0 overflow-hidden element-3d">
        {/* Gráfico de barras 3D flotante */}
        <div 
          className={`absolute top-20 left-10 float-3d interactive-3d cursor-move select-none z-50 ${isTouchDevice ? 'touch-pulse touch-wave' : ''}`}
          onMouseDown={(e) => {
            handleElementSelect('barChart', e.clientX, e.clientY);
            setIsDragging(true);
          }}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            handleElementSelect('barChart', touch.clientX, touch.clientY);
            setIsDragging(true);
          }}
          style={{
            transform: `translate(${elementPositions.barChart.x}px, ${elementPositions.barChart.y}px)`,
            transition: isDragging && selectedElement === 'barChart' ? 'none' : 'transform 0.2s ease-out'
          }}
        >
          <div className={`bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 shadow-3d depth-2 ${selectedElement === 'barChart' ? 'ring-4 ring-blue-400 ring-opacity-50 scale-110' : 'hover:scale-105'} transition-all duration-200`}>
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Gráfico circular 3D */}
        <div 
          className={`absolute top-32 right-16 rotate-3d interactive-3d cursor-move select-none z-50 ${isTouchDevice ? 'touch-pulse touch-wave' : ''}`}
          onMouseDown={(e) => {
            handleElementSelect('pieChart', e.clientX, e.clientY);
            setIsDragging(true);
          }}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            handleElementSelect('pieChart', touch.clientX, touch.clientY);
            setIsDragging(true);
          }}
          style={{
            transform: `translate(${elementPositions.pieChart.x}px, ${elementPositions.pieChart.y}px)`,
            transition: isDragging && selectedElement === 'pieChart' ? 'none' : 'transform 0.2s ease-out'
          }}
        >
          <div className={`bg-gradient-to-br from-green-500 to-green-600 rounded-full p-4 shadow-3d depth-1 ${selectedElement === 'pieChart' ? 'ring-4 ring-green-400 ring-opacity-50 scale-110' : 'hover:scale-105'} transition-all duration-200`}>
            <PieChart className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Icono de usuarios 3D */}
        <div 
          className={`absolute bottom-40 left-20 pulse-3d interactive-3d cursor-move select-none z-50 ${isTouchDevice ? 'touch-pulse touch-wave' : ''}`}
          onMouseDown={(e) => {
            handleElementSelect('users', e.clientX, e.clientY);
            setIsDragging(true);
          }}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            handleElementSelect('users', touch.clientX, touch.clientY);
            setIsDragging(true);
          }}
          style={{
            transform: `translate(${elementPositions.users.x}px, ${elementPositions.users.y}px)`,
            transition: isDragging && selectedElement === 'users' ? 'none' : 'transform 0.2s ease-out'
          }}
        >
          <div className={`bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 shadow-3d depth-3 ${selectedElement === 'users' ? 'ring-4 ring-purple-400 ring-opacity-50 scale-110' : 'hover:scale-105'} transition-all duration-200`}>
            <Users className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Icono de analytics 3D */}
        <div 
          className={`absolute bottom-32 right-20 float-3d interactive-3d cursor-move select-none z-50 ${isTouchDevice ? 'touch-pulse touch-wave' : ''}`}
          onMouseDown={(e) => {
            handleElementSelect('analytics', e.clientX, e.clientY);
            setIsDragging(true);
          }}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            handleElementSelect('analytics', touch.clientX, touch.clientY);
            setIsDragging(true);
          }}
          style={{
            transform: `translate(${elementPositions.analytics.x}px, ${elementPositions.analytics.y}px)`,
            transition: isDragging && selectedElement === 'analytics' ? 'none' : 'transform 0.2s ease-out'
          }}
        >
          <div className={`bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 shadow-3d depth-2 ${selectedElement === 'analytics' ? 'ring-4 ring-orange-400 ring-opacity-50 scale-110' : 'hover:scale-105'} transition-all duration-200`}>
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Icono de base de datos 3D */}
        <div 
          className={`absolute top-1/2 left-8 transform -translate-y-1/2 pulse-3d interactive-3d cursor-move select-none z-50 ${isTouchDevice ? 'touch-pulse touch-wave' : ''}`}
          onMouseDown={(e) => {
            handleElementSelect('database', e.clientX, e.clientY);
            setIsDragging(true);
          }}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            handleElementSelect('database', touch.clientX, touch.clientY);
            setIsDragging(true);
          }}
          style={{
            transform: `translate(${elementPositions.database.x}px, ${elementPositions.database.y}px)`,
            transition: isDragging && selectedElement === 'database' ? 'none' : 'transform 0.2s ease-out'
          }}
        >
          <div className={`bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg p-4 shadow-3d depth-1 ${selectedElement === 'database' ? 'ring-4 ring-cyan-400 ring-opacity-50 scale-110' : 'hover:scale-105'} transition-all duration-200`}>
            <Database className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Icono de configuración 3D */}
        <div 
          className={`absolute top-1/2 right-8 transform -translate-y-1/2 rotate-3d interactive-3d cursor-move select-none z-50 ${isTouchDevice ? 'touch-pulse touch-wave' : ''}`}
          onMouseDown={(e) => {
            handleElementSelect('settings', e.clientX, e.clientY);
            setIsDragging(true);
          }}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            handleElementSelect('settings', touch.clientX, touch.clientY);
            setIsDragging(true);
          }}
          style={{
            transform: `translate(${elementPositions.settings.x}px, ${elementPositions.settings.y}px)`,
            transition: isDragging && selectedElement === 'settings' ? 'none' : 'transform 0.2s ease-out'
          }}
        >
          <div className={`bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-4 shadow-3d depth-2 ${selectedElement === 'settings' ? 'ring-4 ring-pink-400 ring-opacity-50 scale-110' : 'hover:scale-105'} transition-all duration-200`}>
            <Settings className="w-8 h-8 text-white" />
          </div>
        </div>



        {/* Icono de pagos 3D */}
        <div 
          className={`absolute bottom-20 left-1/2 transform -translate-x-1/2 pulse-3d interactive-3d cursor-move select-none z-50 ${isTouchDevice ? 'touch-pulse touch-wave' : ''}`}
          onMouseDown={(e) => {
            handleElementSelect('payments', e.clientX, e.clientY);
            setIsDragging(true);
          }}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            handleElementSelect('payments', touch.clientX, touch.clientY);
            setIsDragging(true);
          }}
          style={{
            transform: `translate(${elementPositions.payments.x}px, ${elementPositions.payments.y}px)`,
            transition: isDragging && selectedElement === 'payments' ? 'none' : 'transform 0.2s ease-out'
          }}
        >
          <div className={`bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-4 shadow-3d depth-3 ${selectedElement === 'payments' ? 'ring-4 ring-emerald-400 ring-opacity-50 scale-110' : 'hover:scale-105'} transition-all duration-200`}>
            <CreditCard className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Elementos orbitales */}
        <div 
          className={`absolute top-1/3 left-1/3 orbit interactive-3d cursor-move select-none z-50 ${isTouchDevice ? 'touch-pulse touch-wave' : ''}`}
          onMouseDown={(e) => {
            handleElementSelect('target', e.clientX, e.clientY);
            setIsDragging(true);
          }}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            handleElementSelect('target', touch.clientX, touch.clientY);
            setIsDragging(true);
          }}
          style={{
            transform: `translate(${elementPositions.target.x}px, ${elementPositions.target.y}px)`,
            transition: isDragging && selectedElement === 'target' ? 'none' : 'transform 0.2s ease-out'
          }}
        >
          <div className={`bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-3 shadow-3d ${selectedElement === 'target' ? 'ring-4 ring-indigo-400 ring-opacity-50 scale-110' : 'hover:scale-105'} transition-all duration-200`}>
            <Target className="w-6 h-6 text-white" />
          </div>
        </div>

        <div 
          className={`absolute top-2/3 right-1/3 orbit interactive-3d cursor-move select-none z-50 ${isTouchDevice ? 'touch-pulse touch-wave' : ''}`}
          onMouseDown={(e) => {
            handleElementSelect('activity', e.clientX, e.clientY);
            setIsDragging(true);
          }}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            handleElementSelect('activity', touch.clientX, touch.clientY);
            setIsDragging(true);
          }}
          style={{ 
            animationDelay: '2s',
            transform: `translate(${elementPositions.activity.x}px, ${elementPositions.activity.y}px)`,
            transition: isDragging && selectedElement === 'activity' ? 'none' : 'transform 0.2s ease-out'
          }}
        >
          <div className={`bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-3 shadow-3d ${selectedElement === 'activity' ? 'ring-4 ring-red-400 ring-opacity-50 scale-110' : 'hover:scale-105'} transition-all duration-200`}>
            <Activity className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Flujo de datos animado */}
        <div 
          className={`absolute top-1/4 left-1/4 data-flow interactive-3d cursor-move select-none z-50 ${isTouchDevice ? 'touch-pulse touch-wave' : ''}`}
          onMouseDown={(e) => {
            handleElementSelect('layers', e.clientX, e.clientY);
            setIsDragging(true);
          }}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            handleElementSelect('layers', touch.clientX, touch.clientY);
            setIsDragging(true);
          }}
          style={{
            transform: `translate(${elementPositions.layers.x}px, ${elementPositions.layers.y}px)`,
            transition: isDragging && selectedElement === 'layers' ? 'none' : 'transform 0.2s ease-out'
          }}
        >
          <div className={`bg-gradient-to-r from-blue-400 to-purple-400 rounded-full p-2 shadow-3d ${selectedElement === 'layers' ? 'ring-4 ring-blue-400 ring-opacity-50 scale-110' : 'hover:scale-105'} transition-all duration-200`}>
            <Layers className="w-4 h-4 text-white" />
          </div>
        </div>

        <div 
          className={`absolute bottom-1/4 right-1/4 data-flow interactive-3d cursor-move select-none z-50 ${isTouchDevice ? 'touch-pulse touch-wave' : ''}`}
          onMouseDown={(e) => {
            handleElementSelect('cpu', e.clientX, e.clientY);
            setIsDragging(true);
          }}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            handleElementSelect('cpu', touch.clientX, touch.clientY);
            setIsDragging(true);
          }}
          style={{
            animationDelay: '1s',
            transform: `translate(${elementPositions.cpu.x}px, ${elementPositions.cpu.y}px)`,
            transition: isDragging && selectedElement === 'cpu' ? 'none' : 'transform 0.2s ease-out'
          }}
        >
          <div className={`bg-gradient-to-r from-green-400 to-blue-400 rounded-full p-2 shadow-3d ${selectedElement === 'cpu' ? 'ring-4 ring-green-400 ring-opacity-50 scale-110' : 'hover:scale-105'} transition-all duration-200`}>
            <Cpu className="w-4 h-4 text-white" />
          </div>
        </div>

        <div 
          className={`absolute top-1/2 left-1/4 data-flow interactive-3d cursor-move select-none z-50 ${isTouchDevice ? 'touch-pulse touch-wave' : ''}`}
          onMouseDown={(e) => {
            handleElementSelect('network', e.clientX, e.clientY);
            setIsDragging(true);
          }}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            handleElementSelect('network', touch.clientX, touch.clientY);
            setIsDragging(true);
          }}
          style={{
            animationDelay: '2s',
            transform: `translate(${elementPositions.network.x}px, ${elementPositions.network.y}px)`,
            transition: isDragging && selectedElement === 'network' ? 'none' : 'transform 0.2s ease-out'
          }}
        >
          <div className={`bg-gradient-to-r from-purple-400 to-pink-400 rounded-full p-2 shadow-3d ${selectedElement === 'network' ? 'ring-4 ring-purple-400 ring-opacity-50 scale-110' : 'hover:scale-105'} transition-all duration-200`}>
            <Network className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>



      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo estático */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            {/* Logo arrastrable */}
            <div 
              className="relative cursor-move select-none z-50"
              onMouseDown={(e) => {
                handleElementSelect('logo', e.clientX, e.clientY);
                setIsDragging(true);
              }}
              onTouchStart={(e) => {
                const touch = e.touches[0];
                handleElementSelect('logo', touch.clientX, touch.clientY);
                setIsDragging(true);
              }}
              style={{
                transform: `translate(${elementPositions.logo.x}px, ${elementPositions.logo.y}px)`,
                transition: isDragging && selectedElement === 'logo' ? 'none' : 'transform 0.2s ease-out'
              }}
            >
              <div className={`bg-gradient-to-r from-cyan-500 to-emerald-600 rounded-2xl p-3 shadow-2xl ${selectedElement === 'logo' ? 'ring-4 ring-cyan-400 ring-opacity-50 scale-110' : 'hover:scale-105'} transition-all duration-200`}>
            <img 
              src="/logoweb.jpg" 
              alt="TuWebAI Logo" 
                  className="h-12 w-12 object-contain rounded-xl"
            />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
              <DeformableText 
                text="Dashboard-TuWebAI" 
                id="title" 
                isDeformed={textDeformation.title || false}
                className="bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent"
              />
            </h1>
          </div>
          <p className="text-gray-300 text-lg">
            <DeformableText 
              text="Accede a tu dashboard para gestionar tus proyectos" 
              id="subtitle" 
              isDeformed={textDeformation.subtitle || false}
              className="text-gray-300"
            />
          </p>
        </div>

        <div className="relative">
          {/* Efecto glassmorphism mejorado */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-emerald-500/20 rounded-2xl blur-xl"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 via-blue-400/10 to-emerald-400/10 rounded-2xl"></div>
          
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl relative z-10">
            <CardHeader className="space-y-2 text-center">
              <CardTitle className="text-3xl font-bold text-white">
                Iniciar Sesión
              </CardTitle>
              <CardDescription className="text-gray-200 text-lg">
                Ingresa tus credenciales para acceder
              </CardDescription>
            </CardHeader>
            
          <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-gray-200 text-lg font-medium">
                    <DeformableText 
                      text="Email" 
                      id="emailLabel" 
                      isDeformed={textDeformation.emailLabel || false}
                      className="text-gray-200"
                    />
                  </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                                         className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 focus:border-cyan-400 focus:ring-cyan-400 h-12 text-lg backdrop-blur-sm"
                />
              </div>
              
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-gray-200 text-lg font-medium">
                    <DeformableText 
                      text="Contraseña" 
                      id="passwordLabel" 
                      isDeformed={textDeformation.passwordLabel || false}
                      className="text-gray-200"
                    />
                  </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                                             className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 focus:border-cyan-400 focus:ring-cyan-400 pr-12 h-12 text-lg backdrop-blur-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                    ) : (
                        <Eye className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                  className="w-full relative overflow-hidden bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500 hover:from-cyan-600 hover:via-blue-600 hover:to-emerald-600 transition-all duration-500 h-14 text-lg font-bold shadow-2xl hover:shadow-cyan-500/25 transform hover:scale-105 rounded-xl border-0"
                disabled={isLoading}
              >
                  {/* Efecto de brillo animado */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-3 relative z-10">
                      <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Iniciando sesión...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3 relative z-10">
                      <Zap className="w-6 h-6 animate-pulse" />
                      <span>Iniciar Sesión</span>
                    </div>
                  )}
              </Button>
            </form>

              {/* Botones de login social mejorados */}
              <div className="flex flex-col gap-4 mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleGoogleLogin}
                disabled={isLoading}
                  className="relative overflow-hidden bg-white/5 border-2 border-white/20 text-white hover:bg-white/15 hover:border-white/40 transition-all duration-300 h-14 text-lg font-semibold backdrop-blur-md group rounded-xl shadow-lg hover:shadow-xl"
                >
                  {/* Efecto de brillo para Google */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  
                  <div className="flex items-center justify-center gap-3 relative z-10">
                    <Chrome className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                    <span>Iniciar sesión con Google</span>
                  </div>
              </Button>
                
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleGithubLogin}
                disabled={isLoading}
                  className="relative overflow-hidden bg-white/5 border-2 border-white/20 text-white hover:bg-white/15 hover:border-white/40 transition-all duration-300 h-14 text-lg font-semibold backdrop-blur-md group rounded-xl shadow-lg hover:shadow-xl"
                >
                  {/* Efecto de brillo para GitHub */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  
                  <div className="flex items-center justify-center gap-3 relative z-10">
                    <Github className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                    <span>Iniciar sesión con GitHub</span>
                  </div>
              </Button>
            </div>

              <div className="mt-8 text-center space-y-3">
                <p className="text-gray-300 text-lg">
                ¿No tienes cuenta?{' '}
                <Link 
                  to="/register" 
                    className="text-cyan-400 hover:text-cyan-300 transition-colors font-semibold hover:underline"
                >
                  Regístrate aquí
                </Link>
              </p>
                <p className="text-sm text-gray-400">
                Al continuar, aceptas nuestros{' '}
                <Link 
                  to="/terminos-condiciones" 
                    className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium underline"
                >
                  Términos y Condiciones
                </Link>
                {' '}y{' '}
                <Link 
                  to="/politica-privacidad" 
                    className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium underline"
                >
                  Política de Privacidad
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
