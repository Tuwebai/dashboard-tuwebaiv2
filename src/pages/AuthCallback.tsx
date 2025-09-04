import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from '@/hooks/use-toast';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error en callback de autenticación:', error);
          navigate('/login?error=auth_callback_failed');
          return;
        }

        if (session?.user) {
          // Mostrar notificación de bienvenida
          toast({
            title: '¡Bienvenido!',
            description: 'Has iniciado sesión correctamente.',
          });
          
          // Redirigir según el rol del usuario
          const email = session.user.email;
          if (email && email.toLowerCase() === 'tuwebai@gmail.com') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Error procesando callback:', error);
        navigate('/login?error=callback_processing_failed');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-white">Procesando autenticación...</p>
      </div>
    </div>
  );
}
