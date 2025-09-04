import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { SupabaseService, type Ticket } from '@/lib/supabaseService';
import { ticketService } from '@/lib/supabaseService';
import { 
  Ticket as TicketIcon, 
  Plus, 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc,
  Calendar,
  User,
  Tag,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  X
} from 'lucide-react';

interface TicketFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  assigned_to: string;
}

interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  highPriority: number;
  urgentPriority: number;
}

interface AdvancedTicketManagerProps {
  tickets?: Ticket[];
  updateTicketStatus?: (ticketId: string, status: string) => void;
  updateUserRole?: (userId: string, role: string) => void;
  refreshData?: () => void;
  lastUpdate?: Date;
}

export default function AdvancedTicketManager({ 
  tickets: externalTickets,
  updateTicketStatus,
  refreshData,
  lastUpdate
}: AdvancedTicketManagerProps) {
  const { user } = useApp();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [formData, setFormData] = useState<TicketFormData>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'open',
    category: '',
    assigned_to: ''
  });

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Stats
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    highPriority: 0,
    urgentPriority: 0
  });

  // Sistema de respuestas
  const [respondingTicket, setRespondingTicket] = useState<Ticket | null>(null);
  const [responseText, setResponseText] = useState('');

  // Load tickets on component mount
  useEffect(() => {
    if (externalTickets) {
      setTickets(externalTickets);
      setFilteredTickets(externalTickets);
      updateStats(externalTickets);
      setLoading(false);
    } else {
      loadTickets();
    }
  }, [externalTickets]);

  // Filter and sort tickets when filters change
  useEffect(() => {
    let filtered = tickets;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        (ticket.asunto || ticket.title)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ticket.mensaje || ticket.description)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ticket.email || ticket.assigned_to)?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => (ticket.estado || ticket.status) === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.category === categoryFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'title':
          aValue = (a.asunto || a.title) || '';
          bValue = (b.asunto || b.title) || '';
          break;
        case 'status':
          aValue = (a.estado || a.status) || '';
          bValue = (b.estado || b.status) || '';
          break;
        case 'priority':
          aValue = a.priority || '';
          bValue = b.priority || '';
          break;
        case 'created_at':
        default:
          aValue = new Date(a.fecha || a.created_at || 0);
          bValue = new Date(b.fecha || b.created_at || 0);
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTickets(filtered);
  }, [tickets, searchTerm, statusFilter, priorityFilter, categoryFilter, sortBy, sortOrder]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const ticketsData = await SupabaseService.getTickets();
      setTickets(ticketsData || []);
      setFilteredTickets(ticketsData || []);
      updateStats(ticketsData || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los tickets.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (ticketsData: Ticket[]) => {
    const stats = {
      total: ticketsData.length,
      open: ticketsData.filter(t => t.estado === 'abierto' || t.status === 'open').length,
      inProgress: ticketsData.filter(t => t.estado === 'en_progreso' || t.status === 'in_progress').length,
      resolved: ticketsData.filter(t => t.estado === 'resuelto' || t.status === 'resolved').length,
      closed: ticketsData.filter(t => t.estado === 'cerrado' || t.status === 'closed').length,
      highPriority: ticketsData.filter(t => t.priority === 'high').length,
      urgentPriority: ticketsData.filter(t => t.priority === 'urgent').length
    };
    setStats(stats);
  };

  // Sistema de respuestas
  const handleSubmitResponse = async () => {
    if (!respondingTicket || !responseText.trim()) return;

    try {
      await ticketService.updateTicket(respondingTicket.id, {
        respuesta: responseText,
        respondido_por: user?.full_name || user?.email || 'Admin',
        fecha_respuesta: new Date().toISOString(),
        estado: 'respondido'
      });

      // Actualizar estado local sin recargar
      const updatedTickets = tickets.map(ticket => 
        ticket.id === respondingTicket.id 
          ? { 
              ...ticket, 
              respuesta: responseText,
              respondido_por: user?.full_name || user?.email || 'Admin',
              fecha_respuesta: new Date().toISOString(),
              estado: 'respondido'
            }
          : ticket
      );

      setTickets(updatedTickets);
      setFilteredTickets(updatedTickets);
      updateStats(updatedTickets);

      toast({
        title: 'Respuesta enviada',
        description: 'La respuesta se ha enviado correctamente',
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

  const handleDelete = async (ticketId: string) => {
    try {
      await ticketService.deleteTicket(ticketId);
      
      // Actualizar estado local sin recargar
      const updatedTickets = tickets.filter(ticket => ticket.id !== ticketId);
      setTickets(updatedTickets);
      setFilteredTickets(updatedTickets);
      updateStats(updatedTickets);

      toast({
        title: 'Ticket eliminado',
        description: 'El ticket se ha eliminado correctamente',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast({
        title: 'Error',
        description: 'Error al eliminar el ticket',
        variant: 'destructive'
      });
    }
      };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      await ticketService.updateTicket(ticketId, { estado: newStatus });
      
      // Actualizar estado local sin recargar
      const updatedTickets = tickets.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, estado: newStatus }
          : ticket
      );

      setTickets(updatedTickets);
      setFilteredTickets(updatedTickets);
      updateStats(updatedTickets);

      toast({
        title: 'Estado actualizado',
        description: 'El estado del ticket se ha actualizado',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Error al actualizar el estado',
        variant: 'destructive'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      toast({
        title: 'Error',
        description: 'El título y la descripción son obligatorios.',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingTicket) {
        // Update existing ticket
        await SupabaseService.updateTicket(editingTicket.id, {
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          status: formData.status,
          category: formData.category,
          assigned_to: formData.assigned_to
        });

        toast({
          title: 'Ticket actualizado',
          description: 'El ticket ha sido actualizado correctamente.'
        });
      } else {
        // Create new ticket
        await SupabaseService.createTicket({
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          status: formData.status,
          user_id: user?.email || '',
          assigned_to: formData.assigned_to,
          category: formData.category
        });

        toast({
          title: 'Ticket creado',
          description: 'El ticket ha sido creado correctamente.'
        });
      }

      // Reset form and reload tickets
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'open',
        category: '',
        assigned_to: ''
      });
      setShowForm(false);
      setEditingTicket(null);
      
      // Refresh data if callback provided
      if (refreshData) {
        refreshData();
      } else {
        loadTickets();
      }
    } catch (error) {
      console.error('Error saving ticket:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el ticket.',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setFormData({
      title: ticket.title,
      description: ticket.description || '',
      priority: ticket.priority as any,
      status: ticket.status as any,
      category: ticket.category || '',
      assigned_to: ticket.assigned_to || ''
    });
    setShowForm(true);
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
      case 'abierto': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
      case 'en_progreso': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved':
      case 'resuelto': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed':
      case 'cerrado': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'respondido': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
      case 'abierto': return <AlertCircle className="h-4 w-4" />;
      case 'in_progress':
      case 'en_progreso': return <Clock className="h-4 w-4" />;
      case 'resolved':
      case 'resuelto': return <CheckCircle className="h-4 w-4" />;
      case 'closed':
      case 'cerrado': return <XCircle className="h-4 w-4" />;
      case 'respondido': return <MessageSquare className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
      case 'abierto': return 'Abierto';
      case 'in_progress':
      case 'en_progreso': return 'En Progreso';
      case 'resolved':
      case 'resuelto': return 'Resuelto';
      case 'closed':
      case 'cerrado': return 'Cerrado';
      case 'respondido': return 'Respondido';
      default: return 'Desconocido';
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Cargando tickets...</p>
        </div>
      </div>
    );
  }

  // Si no hay tickets, mostrar mensaje apropiado
  if (tickets.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Gestión de Tickets</h1>
            <p className="text-slate-600 text-base">Administra y rastrea todos los tickets del sistema</p>
            {lastUpdate && (
              <p className="text-sm text-slate-500 mt-1">
                Última actualización: {lastUpdate.toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {refreshData && (
              <Button 
                variant="outline" 
                onClick={refreshData}
                className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 hover:from-emerald-100 hover:to-teal-100 text-emerald-700 hover:text-emerald-800 font-medium transition-all duration-200 shadow-sm hover:shadow-md px-4 py-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            )}
            <Button 
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Ticket
            </Button>
          </div>
        </div>

        {/* Stats Cards - Empty State */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total</p>
                <p className="text-3xl font-bold text-slate-800">0</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <TicketIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Abiertos</p>
                <p className="text-3xl font-bold text-blue-600">0</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">En Progreso</p>
                <p className="text-3xl font-bold text-yellow-600">0</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Resueltos</p>
                <p className="text-3xl font-bold text-green-600">0</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-2xl p-12 text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50">
          <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <TicketIcon className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-3">No hay tickets registrados</h3>
          <p className="text-slate-500 mb-6 text-base">
            Cuando se creen tickets de soporte, aparecerán aquí para su gestión.
          </p>
          <Button 
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4 mr-2" />
            Crear Primer Ticket
          </Button>
        </div>

        {/* Ticket Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">
                  {editingTicket ? 'Editar Ticket' : 'Nuevo Ticket'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingTicket(null);
                    setFormData({
                      title: '',
                      description: '',
                      priority: 'medium',
                      status: 'open',
                      category: '',
                      assigned_to: ''
                    });
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors duration-200 group"
                >
                  <span className="text-slate-600 group-hover:text-slate-800 text-lg font-semibold">×</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="title" className="text-slate-700 font-medium">Título *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Título del ticket"
                      required
                      className="mt-2 bg-white border-slate-300 text-slate-800"
                    />
                  </div>

                  <div>
                    <Label htmlFor="priority" className="text-slate-700 font-medium">Prioridad</Label>
                    <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                      <SelectTrigger className="mt-2 bg-white border-slate-300 text-slate-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baja</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status" className="text-slate-700 font-medium">Estado</Label>
                    <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger className="mt-2 bg-white border-slate-300 text-slate-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Abierto</SelectItem>
                        <SelectItem value="in_progress">En Progreso</SelectItem>
                        <SelectItem value="resolved">Resuelto</SelectItem>
                        <SelectItem value="closed">Cerrado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="assigned_to" className="text-slate-700 font-medium">Asignado a</Label>
                    <Input
                      id="assigned_to"
                      value={formData.assigned_to}
                      onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                      placeholder="Email del usuario"
                      className="mt-2 bg-white border-slate-300 text-slate-800"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category" className="text-slate-700 font-medium">Categoría</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Categoría del ticket"
                      className="mt-2 bg-white border-slate-300 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-slate-700 font-medium">Descripción *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción detallada del ticket"
                    rows={4}
                    required
                    className="mt-2 bg-white border-slate-300 text-slate-800"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingTicket(null);
                    }}
                    className="px-6 py-2 bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-800 transition-all duration-200 font-medium"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {editingTicket ? 'Actualizar' : 'Crear'} Ticket
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Gestión de Tickets</h1>
          <p className="text-slate-600 text-base">Administra y rastrea todos los tickets del sistema</p>
          {lastUpdate && (
            <p className="text-sm text-slate-500 mt-1">
              Última actualización: {lastUpdate.toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {refreshData && (
            <Button 
              variant="outline" 
              onClick={refreshData}
              className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 hover:from-emerald-100 hover:to-teal-100 text-emerald-700 hover:text-emerald-800 font-medium transition-all duration-200 shadow-sm hover:shadow-md px-4 py-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          )}
          <Button 
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Ticket
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total</p>
              <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <TicketIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Abiertos</p>
              <p className="text-3xl font-bold text-blue-600">{stats.open}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">En Progreso</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.inProgress}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Resueltos</p>
              <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <Label htmlFor="search" className="text-slate-700 font-medium">Buscar</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="search"
                placeholder="Buscar tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-slate-300 text-slate-800"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status" className="text-slate-700 font-medium">Estado</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="mt-2 bg-white border-slate-300 text-slate-800">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="abierto">Abierto</SelectItem>
                <SelectItem value="en_progreso">En Progreso</SelectItem>
                <SelectItem value="resuelto">Resuelto</SelectItem>
                <SelectItem value="cerrado">Cerrado</SelectItem>
                <SelectItem value="respondido">Respondido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="priority" className="text-slate-700 font-medium">Prioridad</Label>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="mt-2 bg-white border-slate-300 text-slate-800">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="order" className="text-slate-700 font-medium">Orden</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="w-full mt-2 bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-800 transition-all duration-200"
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50">
        <div className="p-6 border-b border-slate-200/50">
          <h2 className="text-xl font-bold text-slate-800">Tickets ({filteredTickets.length})</h2>
        </div>
        <div className="p-6">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {filteredTickets.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <TicketIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No se encontraron tickets</p>
                </div>
              ) : (
                filteredTickets.map((ticket) => (
                  <div key={ticket.id} className="bg-gradient-to-r from-slate-50 to-white p-6 rounded-2xl hover:from-slate-100 hover:to-slate-50 transition-all duration-300 border border-slate-200/50 hover:border-slate-300/50 hover:shadow-lg group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-slate-800 text-lg group-hover:text-slate-900 transition-colors duration-300">
                            {ticket.asunto || ticket.title || 'Sin título'}
                          </h3>
                          <Badge className={`px-3 py-1 text-xs font-medium border ${getStatusColor(ticket.estado || ticket.status)}`}>
                            {getStatusIcon(ticket.estado || ticket.status)}
                            {getStatusText(ticket.estado || ticket.status)}
                          </Badge>
                          <Badge className="px-3 py-1 text-xs font-medium border bg-yellow-100 text-yellow-800 border-yellow-200">
                            Media
                          </Badge>
                        </div>
                        
                        {(ticket.mensaje || ticket.description) && (
                          <p className="text-sm text-slate-600 line-clamp-2">
                            {ticket.mensaje || ticket.description}
                          </p>
                        )}

                        {/* Mostrar respuesta del admin si existe */}
                        {ticket.respuesta && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">Respuesta del Admin:</span>
                            </div>
                            <p className="text-sm text-blue-700">{ticket.respuesta}</p>
                            <div className="text-xs text-blue-600 mt-2">
                              Respondido por: {ticket.respondido_por} - {ticket.fecha_respuesta ? new Date(ticket.fecha_respuesta).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        )}

                        {/* Mostrar respuesta del cliente si existe */}
                        {ticket.respuesta_cliente && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800">Respuesta del Cliente:</span>
                            </div>
                            <p className="text-sm text-green-700">{ticket.respuesta_cliente}</p>
                            <div className="text-xs text-green-600 mt-2">
                              Respondido el: {ticket.fecha_respuesta_cliente ? new Date(ticket.fecha_respuesta_cliente).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-6 text-xs text-slate-500">
                          <span className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {ticket.email || ticket.assigned_to || 'Sin asignar'}
                          </span>
                          {ticket.category && (
                            <span className="flex items-center gap-2">
                              <Tag className="h-4 w-4" />
                              {ticket.category}
                            </span>
                          )}
                          <span className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {ticket.fecha || ticket.created_at ? new Date(ticket.fecha || ticket.created_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Select
                          value={ticket.estado || ticket.status}
                          onValueChange={(value) => handleStatusChange(ticket.id, value)}
                        >
                          <SelectTrigger className="w-36 bg-white border-slate-300 hover:border-slate-400 transition-colors duration-200 text-slate-800 font-medium">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="abierto">Abierto</SelectItem>
                            <SelectItem value="en_progreso">En Progreso</SelectItem>
                            <SelectItem value="resuelto">Resuelto</SelectItem>
                            <SelectItem value="cerrado">Cerrado</SelectItem>
                            <SelectItem value="respondido">Respondido</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {/* Botón de responder */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRespondingTicket(ticket)}
                          className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:from-green-100 hover:to-emerald-100 text-green-700 hover:text-green-800 transition-all duration-200 px-3 py-2 h-9"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(ticket)}
                          className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 text-blue-700 hover:text-blue-800 transition-all duration-200 px-3 py-2 h-9"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(ticket.id)}
                          className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200 hover:from-red-100 hover:to-pink-100 text-red-700 hover:text-red-800 transition-all duration-200 px-3 py-2 h-9"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Ticket Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">
                {editingTicket ? 'Editar Ticket' : 'Nuevo Ticket'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingTicket(null);
                  setFormData({
                    title: '',
                    description: '',
                    priority: 'medium',
                    status: 'open',
                    category: '',
                    assigned_to: ''
                  });
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors duration-200 group"
              >
                <span className="text-slate-600 group-hover:text-slate-800 text-lg font-semibold">×</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="title" className="text-slate-700 font-medium">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Título del ticket"
                    required
                    className="mt-2 bg-white border-slate-300 text-slate-800"
                  />
                </div>

                <div>
                  <Label htmlFor="priority" className="text-slate-700 font-medium">Prioridad</Label>
                  <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger className="mt-2 bg-white border-slate-300 text-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status" className="text-slate-700 font-medium">Estado</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger className="mt-2 bg-white border-slate-300 text-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Abierto</SelectItem>
                      <SelectItem value="in_progress">En Progreso</SelectItem>
                      <SelectItem value="resolved">Resuelto</SelectItem>
                      <SelectItem value="closed">Cerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assigned_to" className="text-slate-700 font-medium">Asignado a</Label>
                  <Input
                    id="assigned_to"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    placeholder="Email del usuario"
                    className="mt-2 bg-white border-slate-300 text-slate-800"
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="text-slate-700 font-medium">Categoría</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Categoría del ticket"
                    className="mt-2 bg-white border-slate-300 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-slate-700 font-medium">Descripción *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción detallada del ticket"
                  rows={4}
                  required
                  className="mt-2 bg-white border-slate-300 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTicket(null);
                  }}
                  className="px-6 py-2 bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-800 transition-all duration-200 font-medium"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {editingTicket ? 'Actualizar' : 'Crear'} Ticket
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Respuesta */}
      {respondingTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">
                Responder Ticket
              </h2>
              <button
                onClick={() => {
                  setRespondingTicket(null);
                  setResponseText('');
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors duration-200 group"
              >
                <X className="h-4 w-4 text-slate-600 group-hover:text-slate-800" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Información del ticket */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold text-slate-800 mb-2">
                  {respondingTicket.asunto || respondingTicket.title || 'Sin título'}
                </h3>
                <p className="text-sm text-slate-600">
                  {respondingTicket.mensaje || respondingTicket.description || 'Sin descripción'}
                </p>
                <div className="text-xs text-slate-500 mt-2">
                  Cliente: {respondingTicket.email || respondingTicket.assigned_to || 'N/A'}
                </div>
              </div>

              {/* Campo de respuesta */}
              <div>
                <Label htmlFor="response" className="text-slate-700 font-medium">Tu respuesta *</Label>
                <Textarea
                  id="response"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Escribe tu respuesta al cliente..."
                  rows={6}
                  required
                  className="mt-2 bg-white border-slate-300 text-slate-800"
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
                  onClick={handleSubmitResponse}
                  disabled={!responseText.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
