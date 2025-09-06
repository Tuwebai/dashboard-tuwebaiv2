import React from 'react';
import { Sun, Coffee, Rocket, Target, Flame, Zap, Flower, Brain, Lightbulb, Moon, Building, Star, Palette, Waves } from 'lucide-react';

interface DynamicGreetingProps {
  userName: string;
}

const DynamicGreeting: React.FC<DynamicGreetingProps> = ({ userName }) => {
  // Mensajes para la mañana (6:00 - 11:59)
  const morningMessages = [
    { text: `¡Buenos días ${userName}! ¿Cómo amaneciste hoy?`, icon: Sun },
    { text: `¡Hola ${userName}! ¿Listo para empezar el día?`, icon: Sun },
    { text: `¡Buenos días ${userName}! ¿Ya desayunaste?`, icon: Coffee },
    { text: `¡Hola ${userName}! ¡Vamos a hacer algo genial hoy!`, icon: Rocket },
    { text: `¡Buenos días ${userName}! ¿Qué planes tienes?`, icon: Target },
    { text: `¡Hola ${userName}! ¡Hoy va a ser un día increíble!`, icon: Star },
    { text: `¡Buenos días ${userName}! ¡A darle con todo!`, icon: Zap },
    { text: `¡Hola ${userName}! ¡Buen día para crear!`, icon: Brain },
    { text: `¡Buenos días ${userName}! ¡Enfócate y a por todas!`, icon: Target },
    { text: `¡Hola ${userName}! ¡Hoy es tu día!`, icon: Sun },
    { text: `¡Buenos días ${userName}! ¡Vamos a hacer historia!`, icon: Flame },
    { text: `¡Hola ${userName}! ¡Que tengas un día genial!`, icon: Flower }
  ];

  // Mensajes para la tarde (12:00 - 17:59)
  const afternoonMessages = [
    { text: `¡Buenas tardes ${userName}! ¿Cómo va el día?`, icon: Sun },
    { text: `¡Hola ${userName}! ¿Ya almorzaste?`, icon: Coffee },
    { text: `¡Buenas tardes ${userName}! ¡Sigamos trabajando!`, icon: Target },
    { text: `¡Hola ${userName}! ¿Cómo van los proyectos?`, icon: Rocket },
    { text: `¡Buenas tardes ${userName}! ¡La tarde es perfecta!`, icon: Star },
    { text: `¡Hola ${userName}! ¡Aún queda mucho por hacer!`, icon: Zap },
    { text: `¡Buenas tardes ${userName}! ¡Sigue así!`, icon: Sun },
    { text: `¡Hola ${userName}! ¡Momento de enfocarse!`, icon: Target },
    { text: `¡Buenas tardes ${userName}! ¡Vamos que se puede!`, icon: Flame },
    { text: `¡Hola ${userName}! ¡La tarde está que arde!`, icon: Flame },
    { text: `¡Buenas tardes ${userName}! ¡Sigue adelante!`, icon: Rocket },
    { text: `¡Hola ${userName}! ¡Ideas geniales en camino!`, icon: Lightbulb }
  ];

  // Mensajes para la noche (18:00 - 5:59)
  const eveningMessages = [
    { text: `¡Buenas noches ${userName}! ¿Cómo estuvo tu día?`, icon: Moon },
    { text: `¡Hola ${userName}! ¿Listo para la noche?`, icon: Moon },
    { text: `¡Buenas noches ${userName}! ¡A trabajar de noche!`, icon: Building },
    { text: `¡Hola ${userName}! ¡La noche es perfecta!`, icon: Star },
    { text: `¡Buenas noches ${userName}! ¡Los noctámbulos también trabajan!`, icon: Moon },
    { text: `¡Hola ${userName}! ¡La noche es para los valientes!`, icon: Zap },
    { text: `¡Buenas noches ${userName}! ¡A crear de noche!`, icon: Brain },
    { text: `¡Hola ${userName}! ¡Enfoque nocturno!`, icon: Target },
    { text: `¡Buenas noches ${userName}! ¡La noche es mágica!`, icon: Star },
    { text: `¡Hola ${userName}! ¡Noche de productividad!`, icon: Flame },
    { text: `¡Buenas noches ${userName}! ¡Que tengas buena noche!`, icon: Moon },
    { text: `¡Hola ${userName}! ¡Las mejores ideas llegan de noche!`, icon: Lightbulb }
  ];

  // Función para obtener el mensaje dinámico
  const getDynamicMessage = () => {
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDate();
    
    let messages: { text: string; icon: any }[];
    
    // Seleccionar array según la hora
    if (currentHour >= 6 && currentHour < 12) {
      messages = morningMessages;
    } else if (currentHour >= 12 && currentHour < 18) {
      messages = afternoonMessages;
    } else {
      messages = eveningMessages;
    }
    
    // Seleccionar mensaje basado en el día del mes
    const messageIndex = currentDay % messages.length;
    return messages[messageIndex];
  };

  const selectedMessage = getDynamicMessage();
  const IconComponent = selectedMessage.icon;

  return (
    <div className="flex items-center gap-3">
      <IconComponent className="w-8 h-8 text-blue-600" />
      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
        {selectedMessage.text}
      </h1>
    </div>
  );
};

export default DynamicGreeting;