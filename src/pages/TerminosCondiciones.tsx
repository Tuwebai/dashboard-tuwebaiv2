import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TerminosCondiciones() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src="/logoweb.jpg" 
                alt="TuWebAI Logo" 
                className="h-8 w-8 object-contain rounded-lg"
              />
              <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                TuWebAI
              </h1>
            </div>
            <Link to="/login">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver al Login
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="relative">
          {/* Fondo azul eléctrico borroso */}
          <div className="absolute inset-0 bg-[#00CCFF] rounded-lg blur-xl opacity-20 -z-10"></div>
          
          <Card className="bg-card border-border shadow-card relative z-10">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                Términos y Condiciones
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Última actualización: {new Date().toLocaleDateString('es-ES')}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6 text-foreground">
              <section>
                <h2 className="text-xl font-semibold mb-3 text-primary">1. Aceptación de los Términos</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Al acceder y utilizar el dashboard de TuWebAI, usted acepta estar sujeto a estos términos y condiciones. 
                  Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestros servicios.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-primary">2. Descripción del Servicio</h2>
                <p className="text-muted-foreground leading-relaxed">
                  TuWebAI proporciona una plataforma de dashboard para la gestión de proyectos web, incluyendo:
                </p>
                <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1 ml-4">
                  <li>Herramientas de desarrollo y colaboración</li>
                  <li>Editor de código integrado</li>
                  <li>Constructor visual de interfaces</li>
                  <li>Gestión de proyectos y equipos</li>
                  <li>Análisis y métricas de rendimiento</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-primary">3. Uso Aceptable</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Usted se compromete a utilizar nuestros servicios únicamente para fines legales y de acuerdo con estos términos. 
                  Está prohibido:
                </p>
                <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1 ml-4">
                  <li>Usar los servicios para actividades ilegales o fraudulentas</li>
                  <li>Intentar acceder no autorizado a sistemas o datos</li>
                  <li>Interferir con el funcionamiento de la plataforma</li>
                  <li>Compartir credenciales de acceso con terceros</li>
                  <li>Crear contenido que viole derechos de propiedad intelectual</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-primary">4. Cuentas de Usuario</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Para acceder a ciertos servicios, debe crear una cuenta. Usted es responsable de:
                </p>
                <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1 ml-4">
                  <li>Mantener la confidencialidad de sus credenciales</li>
                  <li>Proporcionar información precisa y actualizada</li>
                  <li>Notificar inmediatamente cualquier uso no autorizado</li>
                  <li>Aceptar responsabilidad por todas las actividades en su cuenta</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-primary">5. Propiedad Intelectual</h2>
                <p className="text-muted-foreground leading-relaxed">
                  La plataforma y su contenido son propiedad de TuWebAI o sus licenciantes. Usted conserva los derechos 
                  sobre el contenido que crea, pero nos otorga una licencia no exclusiva para utilizarlo en la prestación 
                  de nuestros servicios.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-primary">6. Limitación de Responsabilidad</h2>
                <p className="text-muted-foreground leading-relaxed">
                  En ningún caso TuWebAI será responsable por daños indirectos, incidentales, especiales o consecuentes 
                  que resulten del uso o la imposibilidad de usar nuestros servicios. Nuestra responsabilidad total no 
                  excederá el monto pagado por usted en los 12 meses anteriores al evento que dio lugar a la reclamación.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-primary">7. Disponibilidad del Servicio</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Nos esforzamos por mantener nuestros servicios disponibles, pero no garantizamos que estén libres de 
                  interrupciones. Podemos realizar mantenimiento programado con notificación previa cuando sea posible.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-primary">8. Modificaciones</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en 
                  vigor inmediatamente después de su publicación. Su uso continuado de los servicios constituye aceptación 
                  de los términos modificados.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-primary">9. Terminación</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Podemos suspender o terminar su acceso a nuestros servicios en cualquier momento, con o sin causa, 
                  con notificación previa. Usted también puede cancelar su cuenta en cualquier momento a través de 
                  la configuración de su perfil.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-primary">10. Ley Aplicable</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Estos términos se rigen por las leyes del país donde opera TuWebAI. Cualquier disputa será resuelta 
                  en los tribunales competentes de dicha jurisdicción.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-primary">11. Contacto</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Si tiene preguntas sobre estos términos y condiciones, puede contactarnos en:
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
