import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

import { Navigate } from 'react-router-dom';
import { MessageSquare, Send, Clock, CheckCircle, AlertCircle, HelpCircle, FileText, Phone, Mail, Plus, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { sendSupportTicketEmail, sendTicketConfirmationEmail } from '@/lib/emailService';
import { formatDateSafe } from '@/utils/formatDateSafe';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'responded' | 'closed' | 'in_conversation';
  priority: 'low' | 'medium' | 'high';
  user_id: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  // Campos adicionales para funcionalidad extendida
  respuesta?: string;
  respondido_por?: string;
  fecha_respuesta?: string;
  respuesta_cliente?: string;
  fecha_respuesta_cliente?: string;
}

export default function Soporte() {
  const { user, getUserProjects } = useApp();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  // Sistema de respuestas del cliente
  const [respondingTicket, setRespondingTicket] = useState<Ticket | null>(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const fetchTickets = async () => {
      try {
        const { data: ticketsData, error } = await supabase
          .from('tickets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const tickets = ticketsData || [];
        setTickets(tickets);
      } catch (error) {
        console.error('Error cargando tickets:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [user]);

  if (!user) return <Navigate to="/login" />;

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({ title: 'Error', description: 'Por favor completa todos los campos.', variant: 'destructive' });
      return;
    }

    // Confirmación instantánea y limpieza del formulario
    toast({ title: 'Ticket enviado', description: 'Tu ticket de soporte fue enviado. Procesando en segundo plano...' });
    setFormData({ title: '', description: '', priority: 'medium' });
    setShowForm(false);

    // Procesamiento real en segundo plano
    (async () => {
      try {
        const newTicket = {
          title: formData.title,
          description: formData.description,
          status: 'open' as const,
          priority: formData.priority,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Crear el ticket en Supabase
        const { data: ticketData, error } = await supabase
          .from('tickets')
          .insert(newTicket)
          .select()
          .single();
        
        if (error) throw error;
        const ticketId = ticketData.id;
        
        // Enviar email de confirmación
        await sendTicketConfirmationEmail({
          email: user.email,
          ticketId: ticketId,
          asunto: formData.title,
          mensaje: formData.description,
          prioridad: formData.priority,
          fecha: new Date().toISOString()
        });
        
        // Enviar email al equipo de soporte
        await sendSupportTicketEmail({
          asunto: formData.title,
          mensaje: formData.description,
          email: user.email,
          prioridad: formData.priority,
          fecha: new Date().toISOString()
        });
        
        // Actualizar la lista de tickets
        setTickets(prev => [ticketData, ...prev]);
        
        toast({ title: 'Ticket procesado', description: 'Tu ticket ha sido procesado correctamente.' });
      } catch (error) {
        console.error('Error procesando ticket:', error);
        toast({ title: 'Error', description: 'Hubo un problema procesando tu ticket. Contacta al equipo de soporte.', variant: 'destructive' });
      }
    })();
  };

  // Función para responder a un ticket del admin
  const handleClientResponse = async () => {
    if (!respondingTicket || !responseText.trim()) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          respuesta_cliente: responseText,
          fecha_respuesta_cliente: new Date().toISOString(),
          status: 'in_conversation',
          updated_at: new Date().toISOString()
        })
        .eq('id', respondingTicket.id);

      if (error) throw error;

      // Actualizar estado local
      const updatedTickets = tickets.map(ticket => 
        ticket.id === respondingTicket.id 
          ? { 
              ...ticket, 
              respuesta_cliente: responseText,
              fecha_respuesta_cliente: new Date().toISOString(),
              status: 'in_conversation',
              updated_at: new Date().toISOString()
            }
          : ticket
      );

      setTickets(updatedTickets);

      toast({
        title: 'Respuesta enviada',
        description: 'Tu respuesta se ha enviado correctamente',
        variant: 'default'
      });

      setRespondingTicket(null);
      setResponseText('');
    } catch (error) {
      console.error('Error sending response:', error);
      toast({
        title: 'Error',
        description: 'Error al enviar la respuesta',
        variant: 'destructive'
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700/50';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700/50';
      case 'low': return 'bg-green-500/10 text-green-600 border-green-500/20 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700/50';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600/50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700/50';
      case 'responded': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700/50';
      case 'in_conversation': return 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700/50';
      case 'closed': return 'bg-green-500/10 text-green-600 border-green-500/20 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700/50';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600/50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Abierto';
      case 'responded': return 'Respondido';
      case 'in_conversation': return 'En Conversación';
      case 'closed': return 'Cerrado';
      default: return 'Desconocido';
    }
  };

  const ticketsAbiertos = tickets.filter(t => t.status === 'open').length;
  const ticketsRespondidos = tickets.filter(t => t.status === 'responded').length;
  const ticketsResueltos = tickets.filter(t => t.status === 'closed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header con diseño claro */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Soporte</h1>
              <p className="text-slate-600 dark:text-slate-300 mt-2">
                Obtén ayuda y resuelve tus consultas
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <FileText className="h-4 w-4" />
                <span>Proyectos: {getUserProjects().length}</span>
              </div>
              <Button
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/50"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Soporte 24/7
              </Button>
            </div>
          </div>
        </div>

        {/* Resumen de tickets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Tickets Abiertos</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{ticketsAbiertos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                  <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Respondidos</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{ticketsRespondidos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Resueltos</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{ticketsResueltos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información de contacto */}
          <Card className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-xl text-slate-800 dark:text-white flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Múltiples formas de contactarnos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">Email</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">tuwebai@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">Teléfono</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">+5493571416044</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">Horarios de atención</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Lunes a Viernes 9:00 - 18:00</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formulario de nuevo ticket */}
          <Card className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-xl text-slate-800 dark:text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-600 dark:text-green-400" />
                Envía una consulta y te responderemos pronto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Asunto
                  </label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Describe brevemente tu consulta"
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Mensaje
                  </label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Explica detalladamente tu consulta o problema"
                    rows={4}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="priority" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Prioridad
                  </label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: 'low' | 'medium' | 'high') => 
                      setFormData({...formData, priority: value})
                    }
                  >
                    <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 via-purple-600 to-fuchsia-600 hover:from-blue-600 hover:to-fuchsia-700 shadow-lg text-white font-medium"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Crear Ticket de Soporte
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Historial de tickets */}
        <Card className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-xl text-slate-800 dark:text-white">
              Historial completo de tus consultas y respuestas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-slate-600 dark:text-slate-300">Cargando tickets...</p>
                </div>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-white">No hay tickets</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Cuando envíes tu primer ticket, aparecerá aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                                             <div className="flex-1">
                         <h4 className="font-semibold text-slate-800 dark:text-white mb-1">{ticket.title}</h4>
                         <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{ticket.description}</p>
                         <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                           <span>{formatDateSafe(ticket.created_at)}</span>
                           <span>•</span>
                           <span>{user.email}</span>
                         </div>
                       </div>
                       <div className="flex items-center gap-2 ml-4">
                         <Badge className={getPriorityColor(ticket.priority)}>
                           {ticket.priority === 'low' ? 'Baja' : ticket.priority === 'medium' ? 'Media' : 'Alta'}
                         </Badge>
                         <Badge className={getStatusColor(ticket.status)}>
                           {getStatusText(ticket.status)}
                         </Badge>
                       </div>
                    </div>
                    
                    {/* Respuesta del admin */}
                    {ticket.respuesta && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500 dark:border-blue-400">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Respuesta del equipo</span>
                        </div>
                        <p className="text-sm text-blue-700 dark:text-blue-300">{ticket.respuesta}</p>
                        {ticket.respondido_por && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                            Respondido por: {ticket.respondido_por}
                          </p>
                        )}
                        {ticket.fecha_respuesta && (
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            {formatDateSafe(ticket.fecha_respuesta)}
                          </p>
                        )}
                        
                                                 {/* Botón para responder al admin */}
                         {ticket.status !== 'closed' && (
                          <Button
                            onClick={() => setRespondingTicket(ticket)}
                            className="mt-3 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 h-8"
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Responder
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Respuesta del cliente */}
                    {ticket.respuesta_cliente && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Tu respuesta</span>
                        </div>
                        <p className="text-sm text-green-700">{ticket.respuesta_cliente}</p>
                        {ticket.fecha_respuesta_cliente && (
                          <p className="text-xs text-green-600 mt-2">
                            Respondido el: {formatDateSafe(ticket.fecha_respuesta_cliente)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de respuesta del cliente */}
      {respondingTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">
                Responder al equipo de soporte
              </h2>
              <button
                onClick={() => {
                  setRespondingTicket(null);
                  setResponseText('');
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors duration-200 group"
              >
                <span className="text-slate-600 group-hover:text-slate-800 text-lg font-semibold">×</span>
              </button>
            </div>

            <div className="space-y-6">
              {/* Información del ticket */}
                             <div className="bg-slate-50 p-4 rounded-lg">
                 <h3 className="font-semibold text-slate-800 mb-2">
                   {respondingTicket.title}
                 </h3>
                 <p className="text-sm text-slate-600">
                   {respondingTicket.description}
                 </p>
                 <div className="text-xs text-slate-500 mt-2">
                   Estado: {getStatusText(respondingTicket.status)}
                 </div>
               </div>

              {/* Campo de respuesta */}
              <div>
                <label htmlFor="response" className="text-sm font-medium text-slate-700">
                  Tu respuesta *
                </label>
                <Textarea
                  id="response"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Escribe tu respuesta o pregunta adicional..."
                  rows={6}
                  required
                  className="mt-2 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRespondingTicket(null);
                    setResponseText('');
                  }}
                  className="px-6 py-2 bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-800 transition-all duration-200 font-medium"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleClientResponse}
                  disabled={!responseText.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enviar Respuesta
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
