import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Reply, 
  Heart, 
  ThumbsUp, 
  ThumbsDown,
  Flag,
  Edit,
  Trash2,
  MoreVertical,
  AtSign,
  Paperclip,
  Send,
  Clock,
  User,
  CheckCircle
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { supabaseService, type Comment } from '@/lib/supabaseService';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatDateSafe } from '@/utils/formatDateSafe';

interface CollaborativeCommentsProps {
  projectId: string;
  phaseKey?: string;
  onCommentAdded?: () => void;
}

export default function CollaborativeComments({ 
  projectId, 
  phaseKey,
  onCommentAdded 
}: CollaborativeCommentsProps) {
  const { user } = useApp();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load comments
  useEffect(() => {
    if (!projectId) return;
    setIsLoading(true);

    const loadComments = async () => {
      try {
        const commentsData = await supabaseService.getComments(projectId, phaseKey);
        setComments(commentsData);
      } catch (error) {
        console.error('Error loading comments:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los comentarios.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadComments();

    // Suscribirse a cambios en tiempo real
    const subscription = supabaseService.subscribeToTable('comments', () => {
      loadComments();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [projectId, phaseKey]);

  // Load replies for each comment
  useEffect(() => {
    const loadReplies = async () => {
      if (comments.length === 0) return;

      try {
        const commentsWithReplies = await Promise.all(
          comments.map(async (comment) => {
            if (comment.replies && comment.replies.length > 0) {
              return comment;
            }

            // Buscar respuestas para este comentario
            const replies = await supabaseService.getComments(projectId, phaseKey);
            const commentReplies = replies.filter(reply => reply.parent_id === comment.id);
            
            return {
              ...comment,
              replies: commentReplies
            };
          })
        );

        setComments(commentsWithReplies);
      } catch (error) {
        console.error('Error loading replies:', error);
      }
    };

    loadReplies();
  }, [comments.length, projectId, phaseKey]);

  // Add new comment
  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;

    try {
      const commentData: Omit<Comment, 'id'> = {
        text: newComment,
        author_id: user.email,
        author_name: user.name || user.email,
        author_role: user.role === 'admin' ? 'admin' : 'user',
        timestamp: new Date().toISOString(),
        project_id: projectId,
        phase_key: phaseKey,
        parent_id: replyTo?.id || null,
        replies: [],
        reactions: {},
        mentions: [],
        is_edited: false
      };

      await supabaseService.createComment(commentData);
      
      setNewComment('');
      setReplyTo(null);
      
      if (onCommentAdded) {
        onCommentAdded();
      }

      toast({
        title: 'Comentario agregado',
        description: 'Tu comentario ha sido publicado.'
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'No se pudo agregar el comentario.',
        variant: 'destructive'
      });
    }
  };

  // Edit comment
  const handleEditComment = async (commentId: string) => {
    if (!editText.trim()) return;

    try {
      await supabaseService.updateComment(commentId, {
        text: editText,
        is_edited: true,
        edited_at: new Date().toISOString()
      });

      setEditingComment(null);
      setEditText('');

      toast({
        title: 'Comentario editado',
        description: 'Tu comentario ha sido actualizado.'
      });
    } catch (error) {
      console.error('Error editing comment:', error);
      toast({
        title: 'Error',
        description: 'No se pudo editar el comentario.',
        variant: 'destructive'
      });
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) return;

    try {
      await supabaseService.deleteComment(commentId);
      
      toast({
        title: 'Comentario eliminado',
        description: 'El comentario ha sido eliminado.'
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el comentario.',
        variant: 'destructive'
      });
    }
  };

  // Add reaction
  const handleAddReaction = async (commentId: string, reactionType: string) => {
    if (!user) return;

    try {
      const comment = comments.find(c => c.id === commentId);
      if (!comment) return;

      const currentReactions = comment.reactions || {};
      const currentUserReactions = currentReactions[reactionType] || [];
      
      let newReactions;
      if (currentUserReactions.includes(user.email)) {
        // Remove reaction
        newReactions = {
          ...currentReactions,
          [reactionType]: currentUserReactions.filter(email => email !== user.email)
        };
      } else {
        // Add reaction
        newReactions = {
          ...currentReactions,
          [reactionType]: [...currentUserReactions, user.email]
        };
      }

      await supabaseService.updateComment(commentId, {
        reactions: newReactions
      });
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  };

  // Handle mentions
  const handleMentions = (text: string) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = text.match(mentionRegex)?.map(mention => mention.slice(1)) || [];
    return mentions;
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!user) return;

    try {
      // Aquí se implementaría la subida de archivos usando el servicio de almacenamiento
      // Por ahora solo simulamos
      toast({
        title: 'Archivo adjuntado',
        description: 'Funcionalidad de archivos en desarrollo.'
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: 'No se pudo adjuntar el archivo.',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comment Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {replyTo ? `Responder a ${replyTo.author_name}` : 'Agregar comentario'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                ref={textareaRef}
                placeholder={replyTo ? 'Escribe tu respuesta...' : 'Escribe tu comentario...'}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    handleAddComment();
                  }
                }}
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*,.pdf,.doc,.docx,.txt';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleFileUpload(file);
                      };
                      input.click();
                    }}
                  >
                    <Paperclip className="h-4 w-4 mr-2" />
                    Adjuntar
                  </Button>
                  
                  {replyTo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyTo(null)}
                    >
                      Cancelar respuesta
                    </Button>
                  )}
                </div>
                
                <Button 
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="ml-auto"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {replyTo ? 'Responder' : 'Comentar'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay comentarios aún. ¡Sé el primero en comentar!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={user}
              onReply={(comment) => setReplyTo(comment)}
              onEdit={(commentId) => {
                setEditingComment(commentId);
                setEditText(comment.text);
              }}
              onDelete={handleDeleteComment}
              onReaction={handleAddReaction}
              onEditSubmit={handleEditComment}
              editingComment={editingComment}
              editText={editText}
              setEditText={setEditText}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Comment Item Component
interface CommentItemProps {
  comment: Comment;
  currentUser: any;
  onReply: (comment: Comment) => void;
  onEdit: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onReaction: (commentId: string, reactionType: string) => void;
  onEditSubmit: (commentId: string) => void;
  editingComment: string | null;
  editText: string;
  setEditText: (text: string) => void;
}

function CommentItem({
  comment,
  currentUser,
  onReply,
  onEdit,
  onDelete,
  onReaction,
  onEditSubmit,
  editingComment,
  editText,
  setEditText
}: CommentItemProps) {
  const isEditing = editingComment === comment.id;
  const canEdit = currentUser?.email === comment.author_id;
  const canDelete = currentUser?.email === comment.author_id || currentUser?.role === 'admin';

  const reactionCounts = Object.entries(comment.reactions || {}).reduce((acc, [type, users]) => {
    acc[type] = users.length;
    return acc;
  }, {} as Record<string, number>);

  const userReactions = Object.entries(comment.reactions || {}).reduce((acc, [type, users]) => {
    if (users.includes(currentUser?.email)) {
      acc[type] = true;
    }
    return acc;
  }, {} as Record<string, boolean>);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={comment.author_id === currentUser?.email ? currentUser?.avatar : undefined} />
            <AvatarFallback>
              {comment.author_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-sm">{comment.author_name}</span>
              <Badge variant={comment.author_role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                {comment.author_role === 'admin' ? 'Admin' : 'Usuario'}
              </Badge>
              {comment.is_edited && (
                <Badge variant="outline" className="text-xs">
                  <Edit className="h-3 w-3 mr-1" />
                  Editado
                </Badge>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                {formatDateSafe(comment.timestamp)}
              </span>
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onEditSubmit(comment.id)}
                    disabled={!editText.trim()}
                  >
                    Guardar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditText(comment.text);
                      setEditText('');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm whitespace-pre-wrap">{comment.text}</p>
                
                {/* Attachments */}
                {comment.attachments && comment.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {comment.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                        <Paperclip className="h-4 w-4" />
                        <span className="text-xs">{attachment.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reactions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={userReactions['like'] ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onReaction(comment.id, 'like')}
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    {reactionCounts['like'] || 0}
                  </Button>
                  
                  <Button
                    variant={userReactions['heart'] ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onReaction(comment.id, 'heart')}
                  >
                    <Heart className="h-4 w-4 mr-1" />
                    {reactionCounts['heart'] || 0}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReaction(comment.id, 'dislike')}
                  >
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    {reactionCounts['dislike'] || 0}
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReply(comment)}
                  >
                    <Reply className="h-4 w-4 mr-1" />
                    Responder
                  </Button>
                  
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(comment.id)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  )}
                  
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(comment.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 ml-12 space-y-3">
            <Separator />
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUser={currentUser}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onReaction={onReaction}
                onEditSubmit={onEditSubmit}
                editingComment={editingComment}
                editText={editText}
                setEditText={setEditText}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
