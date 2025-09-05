import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useApp } from '@/contexts/AppContext';
import { useEffect, useState } from 'react';

import { Navigate } from 'react-router-dom';
import { Download, CreditCard, Calendar, FileText, TrendingUp, AlertCircle, Plus, ExternalLink, CheckCircle, Star, Zap, Globe, Users, Shield, RefreshCw } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { PAYMENT_TYPES, formatCurrency } from '@/lib/mercadopago';
import { getUserPayments, createMercadoPagoPreference, Payment } from '@/lib/paymentService';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';

export default function Facturacion() {
  const { user } = useApp();
  const [pagos, setPagos] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPago, setSelectedPago] = useState<Payment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    
    // Timeout para evitar carga infinita
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 5000); // 5 segundos máximo
    
    // Escuchar pagos en tiempo real
    const unsubscribe = getUserPayments(user.email, (payments) => {
      try {
        setPagos(payments || []);
        setError(null);
        setLoading(false);
        clearTimeout(timeoutId);
      } catch (err) {
        setError('Error al cargar los pagos. Inténtalo de nuevo.');
        setLoading(false);
        clearTimeout(timeoutId);
      }
    });

    // Función de limpieza
    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [user]);

  if (!user) return <Navigate to="/login" />;

  const totalGastado = pagos
    .filter(p => p.status === 'approved')
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const pagosPendientes = pagos.filter(p => p.status === 'pending').length;
  const pagosCompletados = pagos.filter(p => p.status === 'approved').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/10 text-green-600 border-green-500/20 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700/50';
      case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700/50';
      case 'rejected': return 'bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700/50';
      case 'cancelled': return 'bg-gray-500/10 text-gray-600 border-gray-500/20 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600/50';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600/50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprobado';
      case 'pending': return 'Pendiente';
      case 'rejected': return 'Rechazado';
      case 'cancelled': return 'Cancelado';
      default: return 'Desconocido';
    }
  };

  const handleDownloadInvoice = (pago: Payment) => {
    if (pago.invoiceUrl) {
      window.open(pago.invoiceUrl, '_blank');
    } else {
      // Generar factura en el momento
      const facturaData = {
        numero: `FAC-${pago.id.slice(-6)}`,
        fecha: new Date(pago.createdAt).toLocaleDateString('es-ES'),
        cliente: user.name || user.email,
        concepto: pago.description,
        monto: formatCurrency(pago.amount, pago.currency),
        estado: pago.status
      };
      
      const facturaText = `
        FACTURA ${facturaData.numero}
        
        Fecha: ${facturaData.fecha}
        Cliente: ${facturaData.cliente}
        Concepto: ${facturaData.concepto}
        Monto: ${facturaData.monto}
        Estado: ${facturaData.estado}
      `;
      
      const blob = new Blob([facturaText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura-${facturaData.numero}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleRetryLoad = () => {
    setLoading(true);
    setError(null);
    setPagos([]);
    
    // Timeout para evitar carga infinita
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError('Tiempo de espera agotado. Verifica tu conexión e inténtalo de nuevo.');
    }, 5000);
    
    // Reintentar carga
    const unsubscribe = getUserPayments(user!.email, (payments) => {
      try {
        setPagos(payments || []);
        setError(null);
        setLoading(false);
        clearTimeout(timeoutId);
      } catch (err) {
        setError('Error al cargar los pagos. Inténtalo de nuevo.');
        setLoading(false);
        clearTimeout(timeoutId);
      }
    });
    
    // Limpiar timeout si se desmonta el componente
    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  };

  const handleCreatePayment = async (paymentType: string) => {
    if (!user) return;
    
    setProcessingPayment(true);
    try {
      const preference = await createMercadoPagoPreference({
        title: `Pago ${paymentType}`,
        description: `Pago realizado por ${user.name || user.email}`,
        amount: 100, // Monto de ejemplo
        currency: 'ARS',
        payerEmail: user.email
      });
      
      if (preference.init_point) {
        window.open(preference.init_point, '_blank');
        toast({
          title: 'Pago iniciado',
          description: 'Se ha abierto la página de pago en una nueva pestaña.'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo iniciar el pago. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header con diseño claro */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Facturación y Pagos</h1>
              <p className="text-slate-600 dark:text-slate-300 mt-2">
                Gestiona tus pagos y descarga facturas
              </p>
            </div>
            <Button
              onClick={() => setIsPaymentModalOpen(true)}
              className="bg-gradient-to-r from-blue-500 via-purple-600 to-fuchsia-600 hover:from-blue-600 hover:to-fuchsia-700 shadow-lg text-white font-medium"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Pago
            </Button>
          </div>
        </div>

        {/* Sincronización de Pagos */}
        {/* Removed PaymentSync component */}

        {/* Resumen de pagos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Gastado</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {formatCurrency(totalGastado, 'ARS')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
                  <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Pagos Completados</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{pagosCompletados}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Pagos Pendientes</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{pagosPendientes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de pagos */}
        <Card className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-xl text-slate-800 dark:text-white">
              Lista completa de todos tus pagos y transacciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-6"></div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                    Cargando historial de pagos
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                    Estamos sincronizando tu información de pagos desde tuweb-ai.com. 
                    Esto puede tomar unos segundos.
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/20 dark:to-red-800/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <AlertCircle className="h-10 w-10 text-red-500 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-800 dark:text-white">
                  Error al cargar los pagos
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-md mx-auto leading-relaxed">
                  {error}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={handleRetryLoad}
                    className="bg-gradient-to-r from-blue-500 via-purple-600 to-fuchsia-600 hover:from-blue-600 hover:to-fuchsia-700 shadow-lg text-white font-medium px-6"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reintentar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/50 px-6"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear pago
                  </Button>
                </div>
              </div>
            ) : pagos.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <CreditCard className="h-10 w-10 text-slate-500 dark:text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-800 dark:text-white">
                  No tienes pagos registrados
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-md mx-auto leading-relaxed">
                  Tu historial de pagos aparecerá aquí una vez que realices tu primera transacción. 
                  Todos los pagos se sincronizan automáticamente desde tuweb-ai.com.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="bg-gradient-to-r from-blue-500 via-purple-600 to-fuchsia-600 hover:from-blue-600 hover:to-fuchsia-700 shadow-lg text-white font-medium px-6"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear primer pago
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRetryLoad}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/50 px-6"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualizar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {pagos.map((pago) => (
                  <div
                    key={pago.id}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedPago(pago);
                      setIsModalOpen(true);
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">{pago.description}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          {new Date(pago.createdAt).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={getStatusColor(pago.status)}>
                        {getStatusText(pago.status)}
                      </Badge>
                      <p className="font-semibold text-slate-800 dark:text-white">
                        {formatCurrency(pago.amount, pago.currency)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadInvoice(pago);
                        }}
                        className="text-slate-600 hover:text-slate-800 hover:bg-slate-200 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-600/50"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de detalles del pago */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl bg-white dark:bg-slate-800/50 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
            {selectedPago && (
              <div className="space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-slate-800 dark:text-white">
                    Detalles del Pago
                  </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">ID:</span>
                    <p className="font-medium text-slate-800 dark:text-white">{selectedPago.id}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Estado:</span>
                    <Badge className={`ml-2 ${getStatusColor(selectedPago.status)}`}>
                      {getStatusText(selectedPago.status)}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Monto:</span>
                    <p className="font-medium text-slate-800 dark:text-white">
                      {formatCurrency(selectedPago.amount, selectedPago.currency)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Fecha:</span>
                    <p className="font-medium text-slate-800 dark:text-white">
                      {new Date(selectedPago.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 dark:text-slate-400">Descripción:</span>
                    <p className="font-medium text-slate-800 dark:text-white">{selectedPago.description}</p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/50"
                  >
                    Cerrar
                  </Button>
                  <Button
                    onClick={() => handleDownloadInvoice(selectedPago)}
                    className="bg-gradient-to-r from-blue-500 via-purple-600 to-fuchsia-600 hover:from-blue-600 hover:to-fuchsia-700 shadow-lg text-white font-medium"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Factura
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de nuevo pago */}
        <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
          <DialogContent className="max-w-2xl bg-white dark:bg-slate-800/50 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-800 dark:text-white">
                Crear Nuevo Pago
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(PAYMENT_TYPES).map(([key, value]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="lg"
                    onClick={() => handleCreatePayment(key)}
                    disabled={processingPayment}
                    className="h-20 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-blue-500 hover:text-blue-600"
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">{value.icon}</div>
                      <div className="text-sm font-medium">{value.label}</div>
                    </div>
                  </Button>
                ))}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 
