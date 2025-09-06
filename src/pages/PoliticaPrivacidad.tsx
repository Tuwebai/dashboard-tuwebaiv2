import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PoliticaPrivacidad() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src="/logoweb.jpg" 
                alt="TuWebAI Logo" 
                className="h-6 w-6 sm:h-8 sm:w-8 object-contain rounded-lg"
              />
              <h1 className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                <span className="hidden sm:inline">TuWebAI - Dashboard Profesional</span>
                <span className="sm:hidden">TuWebAI</span>
              </h1>
            </div>
            <Link to="/login">
              <Button variant="outline" size="sm" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Volver al Login</span>
                <span className="sm:hidden">Volver</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 max-w-4xl">
        <div className="relative">
          {/* Fondo azul eléctrico borroso */}
          <div className="absolute inset-0 bg-[#00CCFF] rounded-lg blur-xl opacity-20 -z-10"></div>
          
          <Card className="bg-card border-border shadow-card relative z-10">
            <CardHeader className="text-center pb-4 sm:pb-6 lg:pb-8 p-4 sm:p-6">
              <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                Política de Privacidad
              </CardTitle>
              <p className="text-sm sm:text-base text-muted-foreground mt-2">
                Última actualización: {new Date().toLocaleDateString('es-ES')}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4 sm:space-y-6 text-foreground p-4 sm:p-6">
              <section>
                <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-primary">1. Información que Recopilamos</h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Recopilamos información que usted nos proporciona directamente, como cuando crea una cuenta, 
                  completa formularios, o se comunica con nosotros. Esto puede incluir:
                </p>
                <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1 ml-4">
                  <li>Información de contacto (nombre, dirección de correo electrónico)</li>
                  <li>Información de la cuenta (nombre de usuario, contraseña)</li>
                  <li>Información del perfil (foto de perfil, preferencias)</li>
                  <li>Contenido que usted crea o comparte en nuestra plataforma</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-primary">2. Cómo Utilizamos su Información</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Utilizamos la información recopilada para:
                </p>
                <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1 ml-4">
                  <li>Proporcionar, mantener y mejorar nuestros servicios</li>
                  <li>Procesar transacciones y enviar notificaciones relacionadas</li>
                  <li>Responder a sus comentarios, preguntas y solicitudes de servicio al cliente</li>
                  <li>Enviar comunicaciones técnicas, actualizaciones y mensajes administrativos</li>
                  <li>Detectar, investigar y prevenir actividades fraudulentas y otros usos inapropiados</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-primary">3. Compartir Información</h2>
                <p className="text-muted-foreground leading-relaxed">
                  No vendemos, alquilamos ni compartimos su información personal con terceros, excepto:
                </p>
                <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1 ml-4">
                  <li>Con su consentimiento explícito</li>
                  <li>Para cumplir con obligaciones legales</li>
                  <li>Con proveedores de servicios que nos ayudan a operar nuestra plataforma</li>
                  <li>Para proteger nuestros derechos, propiedad o seguridad</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-primary">4. Seguridad de Datos</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger 
                  su información personal contra acceso no autorizado, alteración, divulgación o destrucción. 
                  Sin embargo, ningún método de transmisión por Internet o almacenamiento electrónico es 100% seguro.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-primary">5. Sus Derechos</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Usted tiene derecho a:
                </p>
                <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1 ml-4">
                  <li>Acceder a la información personal que tenemos sobre usted</li>
                  <li>Corregir información inexacta o incompleta</li>
                  <li>Solicitar la eliminación de su información personal</li>
                  <li>Oponerse al procesamiento de su información personal</li>
                  <li>Retirar su consentimiento en cualquier momento</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-primary">6. Cookies y Tecnologías Similares</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Utilizamos cookies y tecnologías similares para mejorar su experiencia, analizar el tráfico 
                  del sitio web y personalizar el contenido. Puede controlar el uso de cookies a través de 
                  la configuración de su navegador.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-primary">7. Cambios a esta Política</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Podemos actualizar esta Política de Privacidad de vez en cuando. Le notificaremos sobre 
                  cualquier cambio publicando la nueva Política en esta página y actualizando la fecha de 
                  "Última actualización".
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-primary">8. Contacto</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Si tiene preguntas sobre esta Política de Privacidad o nuestras prácticas de privacidad, 
                  puede contactarnos en:
                </p>
                <div className="mt-3 p-4 bg-muted rounded-lg">
                  <p className="text-foreground font-medium">TuWebAI</p>
                  <p className="text-muted-foreground">Email: tuwebai@gmail.com</p>
                  <p className="text-muted-foreground">Soporte: dashboard.tuweb-ai.com/soporte</p>
                </div>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-card border-t border-border mt-8">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} TuWebAI. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
