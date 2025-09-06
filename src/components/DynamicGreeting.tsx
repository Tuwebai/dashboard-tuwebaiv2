import React from 'react';

interface DynamicGreetingProps {
  userName: string;
}

const DynamicGreeting: React.FC<DynamicGreetingProps> = ({ userName }) => {
  // Mensajes para la mañana (6:00 - 11:59)
  const morningMessages = [
    `¡Buenos días ${userName}! ☀️ ¿Listo para conquistar el día?`,
    `¡Hola ${userName}! 🌅 Un nuevo día lleno de posibilidades te espera`,
    `¡Buenos días ${userName}! ☕ ¿Ya tomaste tu café para empezar?`,
    `¡Hola ${userName}! 🌞 El sol brilla y tus proyectos también pueden brillar`,
    `¡Buenos días ${userName}! 🚀 Vamos a hacer que este día sea increíble`,
    `¡Hola ${userName}! 🌻 Un nuevo día, nuevas oportunidades de crecer`,
    `¡Buenos días ${userName}! ⚡ Energía positiva para empezar con todo`,
    `¡Hola ${userName}! 🌱 Cada mañana es una nueva oportunidad de éxito`,
    `¡Buenos días ${userName}! 🎯 Hoy es perfecto para avanzar en tus proyectos`,
    `¡Hola ${userName}! 🌱 Como las plantas, tus ideas crecen mejor con luz matutina`,
    `¡Buenos días ${userName}! 🔥 Vamos a encender la chispa de la creatividad`,
    `¡Hola ${userName}! 💪 La mañana es el momento perfecto para ser productivo`
  ];

  // Mensajes para la tarde (12:00 - 17:59)
  const afternoonMessages = [
    `¡Buenas tardes ${userName}! 🌤️ ¿Cómo va el día? ¡Sigamos adelante!`,
    `¡Hola ${userName}! ☀️ La tarde es perfecta para revisar el progreso`,
    `¡Buenas tardes ${userName}! 💡 Momento ideal para darle vida a tus ideas`,
    `¡Hola ${userName}! ⚡ Energía de tarde para seguir construyendo`,
    `¡Buenas tardes ${userName}! 🚀 El mediodía es perfecto para despegar`,
    `¡Hola ${userName}! 🌟 La tarde brilla con nuevas oportunidades`,
    `¡Buenas tardes ${userName}! 🎯 Momento perfecto para enfocarse en los objetivos`,
    `¡Hola ${userName}! 🔥 La tarde arde con potencial creativo`,
    `¡Buenas tardes ${userName}! 💡 Las mejores ideas surgen en la tarde`,
    `¡Hola ${userName}! 🌈 La tarde pinta el cielo de posibilidades`,
    `¡Buenas tardes ${userName}! 🎪 El show de la productividad continúa`,
    `¡Hola ${userName}! 🌻 La tarde florece con nuevas ideas`
  ];

  // Mensajes para la noche (18:00 - 5:59)
  const eveningMessages = [
    `¡Buenas noches ${userName}! 🌙 ¿Cómo fue tu día? ¡Sigamos trabajando!`,
    `¡Hola ${userName}! 🌆 La noche es perfecta para proyectos creativos`,
    `¡Buenas noches ${userName}! 🌌 Momento ideal para reflexionar y planificar`,
    `¡Hola ${userName}! 🌌 La noche está llena de estrellas y buenas ideas`,
    `¡Buenas noches ${userName}! 🦉 Los búhos nocturnos también son productivos`,
    `¡Hola ${userName}! 🌚 La noche esconde secretos de creatividad`,
    `¡Buenas noches ${userName}! ✨ La noche es mágica para los proyectos`,
    `¡Hola ${userName}! 🌠 Las estrellas brillan y tus ideas también pueden brillar`,
    `¡Buenas noches ${userName}! 🎭 La noche es el escenario perfecto para crear`,
    `¡Hola ${userName}! 🌊 La noche fluye con tranquilidad y productividad`,
    `¡Buenas noches ${userName}! 🎨 La noche pinta con colores de inspiración`,
    `¡Hola ${userName}! 🌸 La noche florece con nuevas posibilidades`
  ];

  // Función para obtener el mensaje dinámico
  const getDynamicMessage = () => {
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDate();
    
    let messages: string[];
    
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

  return (
    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
      {getDynamicMessage()}
    </h1>
  );
};

export default DynamicGreeting;