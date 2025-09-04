// Configuración de Mercado Pago
export const MERCADOPAGO_CONFIG = {
  // Configuración pública (frontend)
  PUBLIC_KEY: 'TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', // Reemplazar con tu clave pública
  ACCESS_TOKEN: 'TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Reemplazar con tu access token
  
  // URLs de webhooks
  WEBHOOK_URL: 'https://tuweb-ai.com/api/webhooks/mercadopago',
  SUCCESS_URL: 'https://tuweb-ai.com/dashboard/facturacion?status=success',
  PENDING_URL: 'https://tuweb-ai.com/dashboard/facturacion?status=pending',
  FAILURE_URL: 'https://tuweb-ai.com/dashboard/facturacion?status=failure',
  
  // Configuración de la aplicación
  APP_NAME: 'TuWebAI Dashboard',
  APP_VERSION: '1.0.0'
};

// Tipos de pago disponibles
export const PAYMENT_TYPES = {
  WEBSITE: {
    id: 'website',
    name: 'Desarrollo de Sitio Web',
    description: 'Sitio web profesional con diseño personalizado',
    price: 99900, // $999.00 en centavos
    currency: 'ARS',
    features: [
      'Diseño responsive',
      'SEO optimizado',
      'Panel de administración',
      'Hosting incluido (1 año)',
      'Dominio incluido (1 año)',
      'Soporte técnico (3 meses)'
    ]
  },
  ECOMMERCE: {
    id: 'ecommerce',
    name: 'Tienda Online',
    description: 'Tienda virtual completa con pasarela de pagos',
    price: 199900, // $1,999.00 en centavos
    currency: 'ARS',
    features: [
      'Todo lo del sitio web',
      'Catálogo de productos',
      'Carrito de compras',
      'Pasarela de pagos',
      'Gestión de inventario',
      'Reportes de ventas',
      'Soporte técnico (6 meses)'
    ]
  },
  CUSTOM: {
    id: 'custom',
    name: 'Proyecto Personalizado',
    description: 'Solución a medida según tus necesidades',
    price: 299900, // $2,999.00 en centavos
    currency: 'ARS',
    features: [
      'Análisis de requerimientos',
      'Diseño personalizado',
      'Desarrollo a medida',
      'Integraciones especiales',
      'Capacitación del equipo',
      'Soporte técnico (12 meses)'
    ]
  }
};

// Estados de pago de Mercado Pago
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  AUTHORIZED: 'authorized',
  IN_PROCESS: 'in_process',
  IN_MEDIATION: 'in_mediation',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  CHARGED_BACK: 'charged_back'
};

// Función para formatear moneda
export const formatCurrency = (amount: number, currency: string = 'ARS') => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency
  }).format(amount / 100); // Convertir de centavos a pesos
};

// Función para convertir pesos a centavos
export const toCents = (amount: number) => {
  return Math.round(amount * 100);
};

// Función para convertir centavos a pesos
export const fromCents = (amount: number) => {
  return amount / 100;
}; 
