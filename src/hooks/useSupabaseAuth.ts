import React from 'react';
import { useState, useEffect } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { config } from '@/config/environment';

// Función para obtener la URL base correcta según el entorno
const getBaseUrl = () => config.getBaseUrl();

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        // Verificar que las credenciales de Supabase sean válidas
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('Error al obtener sesión inicial:', error);
          if (error.message.includes('Invalid API key')) {
            setError('Error de configuración: Clave API de Supabase inválida');
          } else {
            setError(error.message);
          }
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error: any) {
        console.warn('Error en getInitialSession:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listener para cambios de autenticación
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      );

      return () => subscription.unsubscribe();
    } catch (error: any) {
      console.warn('Error al configurar listener de autenticación:', error);
      setError('Error al configurar autenticación');
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async (): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);
      
      const redirectUrl = config.getAuthRedirectUrl();
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });

      if (error) {
        console.warn('Error en autenticación con Google:', error);
        setError(error.message);
        setLoading(false);
        return false;
      }
      
      // Para OAuth, retornar true ya que se redirige a otra página
      // La autenticación se maneja en el callback
      return true;
      
    } catch (error: any) {
      console.warn('Error en signInWithGoogle:', error);
      setError(error.message);
      setLoading(false);
      return false;
    }
  };

  const signInWithGithub = async (): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);
      
      const redirectUrl = config.getAuthRedirectUrl();
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: redirectUrl
        }
      });

      if (error) {
        console.warn('Error en autenticación con GitHub:', error);
        setError(error.message);
        setLoading(false);
        return false;
      }
      
      // Para OAuth, retornar true ya que se redirige a otra página
      // La autenticación se maneja en el callback
      return true;
      
    } catch (error: any) {
      console.warn('Error en signInWithGithub:', error);
      setError(error.message);
      setLoading(false);
      return false;
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.warn('Error en autenticación con email:', error);
        setError(error.message);
        setLoading(false);
        return false;
      }
      
      // Esperar a que la autenticación se complete realmente
      // Retornar true solo después de que el usuario esté autenticado
      return new Promise((resolve) => {
        const checkAuth = () => {
          if (user && session) {
            resolve(true);
          } else {
            // Verificar cada 100ms por hasta 5 segundos
            setTimeout(checkAuth, 100);
          }
        };
        
        // Si ya hay usuario y sesión, resolver inmediatamente
        if (user && session) {
          resolve(true);
        } else {
          // Esperar un poco y luego verificar
          setTimeout(checkAuth, 100);
        }
        
        // Timeout de seguridad después de 5 segundos
        setTimeout(() => {
          resolve(false);
        }, 5000);
      });
      
    } catch (error: any) {
      console.warn('Error en signInWithEmail:', error);
      setError(error.message);
      setLoading(false);
      return false;
    }
  };

  const signUpWithEmail = async (email: string, password: string, metadata?: any) => {
    try {
      setError(null);
      setLoading(true);
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (error) {
        console.warn('Error en registro con email:', error);
        setError(error.message);
        setLoading(false);
      }
    } catch (error: any) {
      console.warn('Error en signUpWithEmail:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('Error en logout:', error);
        setError(error.message);
      }
    } catch (error: any) {
      console.warn('Error en signOut:', error);
      setError(error.message);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: config.getResetPasswordUrl()
      });

      if (error) {
        console.warn('Error en reset password:', error);
        setError(error.message);
        setLoading(false);
      }
    } catch (error: any) {
      console.warn('Error en resetPassword:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const updatePassword = async (password: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.updateUser({
        password
      });
      
      if (error) {
        console.warn('Error en update password:', error);
        setError(error.message);
      }
    } catch (error: any) {
      console.warn('Error en updatePassword:', error);
      setError(error.message);
    }
  };

  const updateProfile = async (updates: any) => {
    try {
      setError(null);
      const { error } = await supabase.auth.updateUser({
        data: updates
      });
      
      if (error) {
        console.warn('Error en update profile:', error);
        setError(error.message);
      }
    } catch (error: any) {
      console.warn('Error en updateProfile:', error);
      setError(error.message);
    }
  };

  return {
    user,
    session,
    loading,
    error,
    signInWithGoogle,
    signInWithGithub,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    clearError: () => setError(null)
  };
}
