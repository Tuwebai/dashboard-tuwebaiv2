import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  ScreenShare, 
  Monitor, 
  Users, 
  MessageSquare,
  Phone,
  PhoneOff,
  Settings,
  Volume2,
  VolumeX,
  Share2,
  UserPlus,
  UserMinus,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Zap,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface CollaborationToolsProps {
  projectId: string;
  isCallActive: boolean;
  onCallToggle: (type: 'voice' | 'video') => void;
  onScreenShareToggle: () => void;
  participants: string[];
  onParticipantAdd: (email: string) => void;
  onParticipantRemove: (email: string) => void;
}

interface CursorPosition {
  x: number;
  y: number;
  userId: string;
  userName: string;
  color: string;
}

interface VoiceMessage {
  id: string;
  audioUrl: string;
  senderId: string;
  senderName: string;
  duration: number;
  timestamp: string;
}

export default function CollaborationTools({
  projectId,
  isCallActive,
  onCallToggle,
  onScreenShareToggle,
  participants,
  onParticipantAdd,
  onParticipantRemove
}: CollaborationToolsProps) {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceMessages, setVoiceMessages] = useState<VoiceMessage[]>([]);
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  const [isCursorSharing, setIsCursorSharing] = useState(false);
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [newParticipant, setNewParticipant] = useState('');
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  
  const recordingIntervalRef = useRef<NodeJS.Timeout>();
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);

  // Voice call controls
  const toggleVoiceCall = () => {
    if (isVoiceActive) {
      setIsVoiceActive(false);
      setIsMuted(false);
      stopRecording();
      onCallToggle('voice');
    } else {
      setIsVoiceActive(true);
      onCallToggle('voice');
      toast({
        title: 'Llamada de voz iniciada',
        description: 'Conectando con el equipo...'
      });
    }
  };

  // Video call controls
  // (Eliminado: toggleVideoCall)

  // Screen sharing
  // (Eliminado: toggleScreenSharing)

  // Mute/unmute
  // (Eliminado: toggleMute)

  // Toggle video
  // (Eliminado: toggleVideo)

  // Voice recording
  // (Eliminado: startRecording, stopRecording)

  // Cursor sharing
  const toggleCursorSharing = () => {
    setIsCursorSharing(!isCursorSharing);
    
    if (!isCursorSharing) {
      // Start cursor tracking
      document.addEventListener('mousemove', handleMouseMove);
      toast({
        title: 'Cursor compartido',
        description: 'Tu cursor es visible para el equipo'
      });
    } else {
      // Stop cursor tracking
      document.removeEventListener('mousemove', handleMouseMove);
      setCursors([]);
      toast({
        title: 'Cursor privado',
        description: 'Tu cursor ya no es visible'
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isCursorSharing) {
      const newCursor: CursorPosition = {
        x: e.clientX,
        y: e.clientY,
        userId: 'current-user',
        userName: 'Tú',
        color: '#3b82f6'
      };
      
      setCursors(prev => {
        const filtered = prev.filter(c => c.userId !== 'current-user');
        return [...filtered, newCursor];
      });
    }
  };

  // Add participant
  const addParticipant = () => {
    if (newParticipant.trim() && !participants.includes(newParticipant.trim())) {
      onParticipantAdd(newParticipant.trim());
      setNewParticipant('');
      setIsParticipantModalOpen(false);
      toast({
        title: 'Participante agregado',
        description: `${newParticipant} se unió a la colaboración`
      });
    }
  };

  // Remove participant
  const removeParticipant = (email: string) => {
    onParticipantRemove(email);
    toast({
      title: 'Participante removido',
      description: `${email} fue removido de la colaboración`
    });
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Participantes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Participantes ({participants.length})
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsParticipantModalOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {participants.map((participant) => (
              <div key={participant} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">{participant}</span>
                  <Badge variant="secondary" className="text-xs">En línea</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeParticipant(participant)}
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Voice Messages */}
      {voiceMessages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Mensajes de Voz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {voiceMessages.map((message) => (
                <div key={message.id} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                  <Mic className="h-4 w-4 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{message.senderName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(message.duration)} • {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cursor Positions */}
      {cursors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Cursores Compartidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cursors.map((cursor) => (
                <div key={cursor.userId} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cursor.color }}
                  ></div>
                  <span className="text-sm">{cursor.userName}</span>
                  <span className="text-xs text-muted-foreground">
                    ({cursor.x}, {cursor.y})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden video/audio elements */}
      <audio ref={audioRef} autoPlay muted={isMuted} />
      <video ref={videoRef} autoPlay muted={isMuted} style={{ display: 'none' }} />
      <video ref={screenShareRef} autoPlay muted style={{ display: 'none' }} />

      {/* Add Participant Modal */}
      <Dialog open={isParticipantModalOpen} onOpenChange={setIsParticipantModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Participante</DialogTitle>
            <DialogDescription>
              Invita a alguien a colaborar en este proyecto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email del participante</label>
              <Input
                type="email"
                value={newParticipant}
                onChange={(e) => setNewParticipant(e.target.value)}
                placeholder="usuario@ejemplo.com"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addParticipant();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsParticipantModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={addParticipant} disabled={!newParticipant.trim()}>
                Agregar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
