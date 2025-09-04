import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

import { supabase } from '@/lib/supabase';

import { 
  Users, 
  User, 
  UserCheck, 
  UserX, 
  MousePointer, 
  Eye, 
  EyeOff,
  Activity,
  Clock,
  Zap,
  Wifi,
  WifiOff,
  Settings,
  Bell,
  BellOff,
  Lock,
  Unlock,
  Share2,
  Copy,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface UserPresence {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'client';
  isOnline: boolean;
  lastSeen: string;
  currentPage: string;
  isTyping: boolean;
  cursorPosition?: {
    x: number;
    y: number;
  };
  avatar?: string;
  status: 'available' | 'busy' | 'away' | 'offline';
}

interface CollaborationSession {
  id: string;
  projectId: string;
  participants: string[];
  startTime: string;
  endTime?: string;
  isActive: boolean;
  sharedCursor: boolean;
  sharedScreen: boolean;
  voiceChat: boolean;
  videoChat: boolean;
}

interface CursorPosition {
  userId: string;
  userName: string;
  userRole: 'admin' | 'client';
  x: number;
  y: number;
  timestamp: string;
  color: string;
}

export default function RealTimeCollaboration({ projectId }: { projectId: string }) {
  const { user } = useApp();
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [cursorPositions, setCursorPositions] = useState<CursorPosition[]>([]);
  const [isCursorSharing, setIsCursorSharing] = useState(false);
  const [isPresenceVisible, setIsPresenceVisible] = useState(true);
  const [collaborationSession, setCollaborationSession] = useState<CollaborationSession | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [sessionStats, setSessionStats] = useState({
    totalParticipants: 0,
    activeTime: 0,
    messagesSent: 0,
    filesShared: 0
  });

  const presenceRef = useRef<any>(null);
  const cursorIntervalRef = useRef<NodeJS.Timeout>();
  const statsIntervalRef = useRef<NodeJS.Timeout>();

  // Initialize presence
  useEffect(() => {
    if (!user || !projectId) return;

    let connectionLost = false;
    // Update user presence
    const updatePresence = async () => {
      try {
        const { error } = await supabase
          .from('userPresence')
          .upsert({
            email: user.email,
            name: user.full_name || user.name,
            role: user.role,
            isOnline: true,
            lastSeen: new Date().toISOString(),
            currentPage: 'collaboration',
            isTyping: false,
            status: 'available',
            projectId
          }, {
            onConflict: 'email'
          });
        
        if (error) throw error;
      } catch (error) {
        toast({
          title: 'Error de presencia',
          description: 'No se pudo actualizar tu presencia en tiempo real.',
          variant: 'destructive'
        });
      }
    };

    updatePresence();

    // Listen to presence changes
    const loadPresence = async () => {
      try {
        const { data, error } = await supabase
          .from('userPresence')
          .select('*')
          .eq('projectId', projectId)
          .eq('isOnline', true);
        
        if (error) throw error;
        
        const users = data || [];
        setOnlineUsers(users);
        setSessionStats(prev => ({ ...prev, totalParticipants: users.length }));
        if (connectionLost) {
          toast({
            title: 'Conexión restablecida',
            description: 'Te has reconectado a la colaboración en tiempo real.',
            variant: 'default'
          });
          connectionLost = false;
        }
      } catch (error) {
        toast({
          title: 'Conexión perdida',
          description: 'Se perdió la conexión en tiempo real. Intentando reconectar...',
          variant: 'destructive'
        });
        connectionLost = true;
      }
    };

    // Load initial presence
    loadPresence();

    // Set up real-time subscription
    const presenceChannel = supabase
      .channel('userPresence_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'userPresence',
          filter: `projectId=eq.${projectId}`
        }, 
        (payload) => {
          loadPresence();
        }
      )
      .subscribe();

    presenceRef.current = presenceChannel;

    // Cleanup on unmount
    return () => {
      if (presenceRef.current) {
        presenceRef.current.unsubscribe();
      }
      // Set user as offline y elimina cursor
      if (user) {
        supabase
          .from('userPresence')
          .update({
            isOnline: false,
            lastSeen: new Date().toISOString(),
            status: 'offline'
          })
          .eq('email', user.email)
          .then(() => {});
        
        // Eliminar cursor
        supabase
          .from('cursorPositions')
          .delete()
          .eq('userId', user.email)
          .then(() => {});
      }
    };
  }, [user, projectId]);

  // Initialize collaboration session
  useEffect(() => {
    if (!projectId || !user) return;

    const initializeSession = async () => {
      try {
        // Check for existing active session
        const { data: existingSessions, error: queryError } = await supabase
          .from('collaborationSessions')
          .select('*')
          .eq('projectId', projectId)
          .eq('isActive', true);
        
        if (queryError) throw queryError;
        
        if (!existingSessions || existingSessions.length === 0) {
          // Create new session
          const { data: newSession, error: insertError } = await supabase
            .from('collaborationSessions')
            .insert({
              projectId,
              participants: [user.email],
              startTime: new Date().toISOString(),
              isActive: true,
              sharedCursor: false,
              sharedScreen: false,
              voiceChat: false,
              videoChat: false
            })
            .select()
            .single();
          
          if (insertError) throw insertError;
          
          setCollaborationSession({
            id: newSession.id,
            projectId,
            participants: [user.email],
            startTime: new Date().toISOString(),
            isActive: true,
            sharedCursor: false,
            sharedScreen: false,
            voiceChat: false,
            videoChat: false
          });
        } else {
          // Join existing session
          const existingSession = existingSessions[0];
          
          if (!existingSession.participants.includes(user.email)) {
            const { error: updateError } = await supabase
              .from('collaborationSessions')
              .update({
                participants: [...existingSession.participants, user.email]
              })
              .eq('id', existingSession.id);
            
            if (updateError) throw updateError;
          }
          
          setCollaborationSession({
            id: existingSession.id,
            ...existingSession,
            participants: existingSession.participants.includes(user.email) 
              ? existingSession.participants 
              : [...existingSession.participants, user.email]
          });
        }
      } catch (error) {
        console.error('Error initializing collaboration session:', error);
      }
    };

    initializeSession();
  }, [projectId, user]);

  // Cursor sharing
  useEffect(() => {
    if (!isCursorSharing || !user) return;

    const updateCursorPosition = async (e: MouseEvent) => {
      const cursorData: CursorPosition = {
        userId: user.email,
        userName: user.name,
        userRole: user.role === 'admin' ? 'admin' : 'client',
        x: e.clientX,
        y: e.clientY,
        timestamp: new Date().toISOString(),
        color: user.role === 'admin' ? '#ef4444' : '#3b82f6'
      };
      // Update cursor position in Supabase
      const { error } = await supabase
        .from('cursorPositions')
        .upsert(cursorData, {
          onConflict: 'userId'
        });
      
      if (error) {
        toast({
          title: 'Error de cursor',
          description: 'No se pudo actualizar tu cursor en tiempo real.',
          variant: 'destructive'
        });
      }
    };

    document.addEventListener('mousemove', updateCursorPosition);

    return () => {
      document.removeEventListener('mousemove', updateCursorPosition);
      // Eliminar cursor al dejar de compartir
      supabase
        .from('cursorPositions')
        .delete()
        .eq('userId', user.email)
        .then(() => {});
    };
  }, [isCursorSharing, user]);

  // Listen to cursor positions
  useEffect(() => {
    if (!projectId) return;

    const loadCursorPositions = async () => {
      try {
        const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
        const { data, error } = await supabase
          .from('cursorPositions')
          .select('*')
          .gt('timestamp', fiveSecondsAgo);
        
        if (error) throw error;
        setCursorPositions(data || []);
      } catch (error) {
        toast({
          title: 'Error de cursores',
          description: 'No se pueden mostrar los cursores en tiempo real.',
          variant: 'destructive'
        });
      }
    };

    // Load initial cursor positions
    loadCursorPositions();

    // Set up real-time subscription
    const cursorChannel = supabase
      .channel('cursorPositions_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'cursorPositions'
        }, 
        (payload) => {
          loadCursorPositions();
        }
      )
      .subscribe();

    return () => {
      cursorChannel.unsubscribe();
    };
  }, [projectId]);

  // Session stats timer
  useEffect(() => {
    if (!collaborationSession) return;

    statsIntervalRef.current = setInterval(() => {
      setSessionStats(prev => ({
        ...prev,
        activeTime: prev.activeTime + 1
      }));
    }, 1000);

    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, [collaborationSession]);

  // Toggle cursor sharing
  const toggleCursorSharing = () => {
    setIsCursorSharing(!isCursorSharing);
    
    if (collaborationSession) {
      supabase
        .from('collaborationSessions')
        .update({
          sharedCursor: !isCursorSharing
        })
        .eq('id', collaborationSession.id)
        .then(() => {});
    }

    toast({
      title: isCursorSharing ? 'Cursor privado' : 'Cursor compartido',
      description: isCursorSharing 
        ? 'Tu cursor ya no es visible para otros' 
        : 'Tu cursor es visible para el equipo'
    });
  };

  // Toggle presence visibility
  const togglePresenceVisibility = () => {
    setIsPresenceVisible(!isPresenceVisible);
    toast({
      title: isPresenceVisible ? 'Presencia oculta' : 'Presencia visible',
      description: isPresenceVisible 
        ? 'Otros no pueden ver tu estado' 
        : 'Otros pueden ver tu estado'
    });
  };

  // Toggle notifications
  const toggleNotifications = () => {
    setNotifications(!notifications);
    toast({
      title: notifications ? 'Notificaciones desactivadas' : 'Notificaciones activadas',
      description: notifications 
        ? 'No recibirás notificaciones de colaboración' 
        : 'Recibirás notificaciones de colaboración'
    });
  };

  // Copy session link
  const copySessionLink = () => {
    const sessionUrl = `${window.location.origin}/collaboration/${projectId}`;
    navigator.clipboard.writeText(sessionUrl);
    toast({
      title: 'Enlace copiado',
      description: 'El enlace de colaboración ha sido copiado al portapapeles'
    });
  };

  // Format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isConnected ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-red-500" />}
              Estado de Conexión
            </div>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Conectado" : "Desconectado"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Tiempo activo: {formatTime(sessionStats.activeTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-500" />
                <span className="text-sm">{sessionStats.totalParticipants} participantes</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={togglePresenceVisibility}
              >
                {isPresenceVisible ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                {isPresenceVisible ? "Ocultar" : "Mostrar"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleNotifications}
              >
                {notifications ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Online Users */}
      {isPresenceVisible && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuarios en Línea ({onlineUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {onlineUsers.map((userPresence) => (
                <div key={userPresence.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {userPresence.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div 
                        className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(userPresence.status)}`}
                      ></div>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{userPresence.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {userPresence.currentPage} • {userPresence.isTyping ? 'Escribiendo...' : 'En línea'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {userPresence.role}
                    </Badge>
                    {userPresence.isTyping && (
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cursor Sharing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MousePointer className="h-5 w-5" />
            Cursores Compartidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant={isCursorSharing ? "default" : "outline"}
                  size="sm"
                  onClick={toggleCursorSharing}
                >
                  {isCursorSharing ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {isCursorSharing ? "Ocultar Cursor" : "Compartir Cursor"}
                </Button>
                <Badge variant="outline">
                  {cursorPositions.length} cursores activos
                </Badge>
              </div>
            </div>
            
            {cursorPositions.length > 0 && (
              <div className="space-y-2">
                {cursorPositions.map((cursor) => (
                  <div key={cursor.userId} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cursor.color }}
                    ></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{cursor.userName}</p>
                      <p className="text-xs text-muted-foreground">
                        Posición: ({cursor.x}, {cursor.y})
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {cursor.userRole}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Session Info */}
      {collaborationSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Información de Sesión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">ID de Sesión</p>
                <p className="text-xs text-muted-foreground font-mono">{collaborationSession.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Iniciada</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(collaborationSession.startTime).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Participantes</p>
                <p className="text-xs text-muted-foreground">{collaborationSession.participants.length}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Estado</p>
                <Badge variant={collaborationSession.isActive ? "default" : "secondary"}>
                  {collaborationSession.isActive ? "Activa" : "Inactiva"}
                </Badge>
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copySessionLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar Enlace
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Estadísticas de Sesión
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">{sessionStats.totalParticipants}</p>
              <p className="text-xs text-muted-foreground">Participantes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{formatTime(sessionStats.activeTime)}</p>
              <p className="text-xs text-muted-foreground">Tiempo Activo</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-500">{sessionStats.messagesSent}</p>
              <p className="text-xs text-muted-foreground">Mensajes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">{sessionStats.filesShared}</p>
              <p className="text-xs text-muted-foreground">Archivos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
