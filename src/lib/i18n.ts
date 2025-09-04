import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Traducciones reales para la app (puedes expandirlas según tus pantallas reales)
const resources = {
  es: {
    translation: {
      'Dashboard': 'Dashboard',
      'Proyectos': 'Proyectos',
      'Facturación y Pagos': 'Facturación y Pagos',
      'Configuración': 'Configuración',
      'Soporte': 'Soporte',
      'Mi Perfil': 'Mi Perfil',
      'Cerrar Sesión': 'Cerrar Sesión',
      'General': 'General',
      'Privacidad': 'Privacidad',
      'Notificaciones': 'Notificaciones',
      'Rendimiento': 'Rendimiento',
      'Seguridad': 'Seguridad',
      'Idioma': 'Idioma',
      'Español': 'Español',
      'English': 'Inglés',
      'Português': 'Portugués',
      'Guardar cambios': 'Guardar cambios',
      'Zona horaria': 'Zona horaria',
      'Formato de fecha': 'Formato de fecha',
      'Formato de hora': 'Formato de hora',
      'Exportar': 'Exportar',
      'Importar': 'Importar',
      'Restablecer': 'Restablecer',
      'Personaliza tu experiencia en la plataforma': 'Personaliza tu experiencia en la plataforma',
      // ...agrega todas las claves reales de tu UI
    }
  },
  en: {
    translation: {
      'Dashboard': 'Dashboard',
      'Proyectos': 'Projects',
      'Facturación y Pagos': 'Billing & Payments',
      'Configuración': 'Settings',
      'Soporte': 'Support',
      'Mi Perfil': 'My Profile',
      'Cerrar Sesión': 'Log Out',
      'General': 'General',
      'Privacidad': 'Privacy',
      'Notificaciones': 'Notifications',
      'Rendimiento': 'Performance',
      'Seguridad': 'Security',
      'Idioma': 'Language',
      'Español': 'Spanish',
      'English': 'English',
      'Português': 'Portuguese',
      'Guardar cambios': 'Save changes',
      'Zona horaria': 'Timezone',
      'Formato de fecha': 'Date format',
      'Formato de hora': 'Time format',
      'Exportar': 'Export',
      'Importar': 'Import',
      'Restablecer': 'Reset',
      'Personaliza tu experiencia en la plataforma': 'Customize your experience on the platform',
      // ...agrega todas las claves reales de tu UI
    }
  },
  pt: {
    translation: {
      'Dashboard': 'Dashboard',
      'Proyectos': 'Projetos',
      'Facturación y Pagos': 'Faturamento e Pagamentos',
      'Configuración': 'Configurações',
      'Soporte': 'Suporte',
      'Mi Perfil': 'Meu Perfil',
      'Cerrar Sesión': 'Sair',
      'General': 'Geral',
      'Privacidad': 'Privacidade',
      'Notificaciones': 'Notificações',
      'Rendimiento': 'Desempenho',
      'Seguridad': 'Segurança',
      'Idioma': 'Idioma',
      'Español': 'Espanhol',
      'English': 'Inglês',
      'Português': 'Português',
      'Guardar cambios': 'Salvar alterações',
      'Zona horaria': 'Fuso horário',
      'Formato de fecha': 'Formato de data',
      'Formato de hora': 'Formato de hora',
      'Exportar': 'Exportar',
      'Importar': 'Importar',
      'Restablecer': 'Restaurar',
      'Personaliza tu experiencia en la plataforma': 'Personalize sua experiência na plataforma',
      // ...agrega todas las claves reales de tu UI
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n; 
