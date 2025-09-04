// =====================================================
// DETECTOR AUTOMÁTICO DE TIPOS DE PROYECTO
// =====================================================

export interface ProjectType {
  id: string;
  name: string;
  category: string;
  keywords: string[];
  description: string;
  icon: string;
  color: string;
}

// Categorías predefinidas de tipos de proyecto
export const PROJECT_TYPES: ProjectType[] = [
  {
    id: 'landing-page',
    name: 'Landing Page',
    category: 'Web',
    keywords: ['landing', 'página de aterrizaje', 'conversión', 'ventas', 'marketing', 'promoción'],
    description: 'Página web enfocada en conversión y ventas',
    icon: 'Globe',
    color: 'blue'
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    category: 'Web',
    keywords: ['tienda', 'ecommerce', 'e-commerce', 'ventas online', 'productos', 'carrito', 'compra'],
    description: 'Tienda online para venta de productos',
    icon: 'ShoppingCart',
    color: 'green'
  },
  {
    id: 'corporate',
    name: 'Corporativo',
    category: 'Web',
    keywords: ['empresa', 'corporativo', 'institucional', 'negocio', 'compañía', 'organización'],
    description: 'Sitio web corporativo para empresas',
    icon: 'Briefcase',
    color: 'purple'
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    category: 'Web',
    keywords: ['portfolio', 'portafolio', 'trabajos', 'proyectos', 'muestra', 'galería'],
    description: 'Portfolio personal o profesional',
    icon: 'User',
    color: 'pink'
  },
  {
    id: 'blog',
    name: 'Blog',
    category: 'Web',
    keywords: ['blog', 'artículos', 'contenido', 'noticias', 'publicaciones', 'posts'],
    description: 'Blog para publicar artículos y contenido',
    icon: 'MessageSquare',
    color: 'orange'
  },
  {
    id: 'mobile-app',
    name: 'App Móvil',
    category: 'Mobile',
    keywords: ['app', 'móvil', 'mobile', 'aplicación', 'smartphone', 'ios', 'android'],
    description: 'Aplicación móvil para iOS/Android',
    icon: 'Smartphone',
    color: 'indigo'
  },
  {
    id: 'web-app',
    name: 'Aplicación Web',
    category: 'Web',
    keywords: ['aplicación web', 'web app', 'sistema', 'plataforma', 'dashboard', 'admin'],
    description: 'Aplicación web compleja con funcionalidades avanzadas',
    icon: 'Laptop',
    color: 'cyan'
  },
  {
    id: 'ui-ux',
    name: 'Diseño UI/UX',
    category: 'Design',
    keywords: ['diseño', 'ui', 'ux', 'interfaz', 'usuario', 'experiencia', 'wireframe'],
    description: 'Diseño de interfaz y experiencia de usuario',
    icon: 'Palette',
    color: 'rose'
  },
  {
    id: 'development',
    name: 'Desarrollo',
    category: 'Development',
    keywords: ['desarrollo', 'programación', 'código', 'software', 'aplicación', 'sistema'],
    description: 'Desarrollo de software y aplicaciones',
    icon: 'Code',
    color: 'emerald'
  },
  {
    id: 'database',
    name: 'Base de Datos',
    category: 'Development',
    keywords: ['base de datos', 'database', 'sql', 'datos', 'almacenamiento', 'información'],
    description: 'Diseño y gestión de bases de datos',
    icon: 'Database',
    color: 'amber'
  },
  {
    id: 'api',
    name: 'API/Backend',
    category: 'Development',
    keywords: ['api', 'backend', 'servidor', 'endpoint', 'rest', 'graphql', 'microservicio'],
    description: 'API y servicios backend',
    icon: 'Zap',
    color: 'violet'
  },
  {
    id: 'other',
    name: 'Otro',
    category: 'Other',
    keywords: [],
    description: 'Tipo de proyecto no especificado',
    icon: 'Home',
    color: 'slate'
  }
];

// Función para detectar automáticamente el tipo de proyecto
export function detectProjectType(projectData: {
  name: string;
  description?: string;
  technologies?: string[];
}): ProjectType {
  const { name, description = '', technologies = [] } = projectData;
  
  // Combinar todo el texto para análisis
  const searchText = `${name} ${description} ${technologies.join(' ')}`.toLowerCase();
  
  // Buscar coincidencias con keywords
  const matches: { type: ProjectType; score: number }[] = [];
  
  PROJECT_TYPES.forEach(type => {
    if (type.id === 'other') return; // Saltar "Otro"
    
    let score = 0;
    
    // Buscar coincidencias en keywords
    type.keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      if (searchText.includes(keywordLower)) {
        score += 1;
        
        // Bonus por coincidencia exacta en el nombre
        if (name.toLowerCase().includes(keywordLower)) {
          score += 2;
        }
        
        // Bonus por coincidencia en descripción
        if (description.toLowerCase().includes(keywordLower)) {
          score += 1.5;
        }
      }
    });
    
    if (score > 0) {
      matches.push({ type, score });
    }
  });
  
  // Ordenar por score y retornar el mejor match
  if (matches.length > 0) {
    matches.sort((a, b) => b.score - a.score);
    return matches[0].type;
  }
  
  // Si no hay coincidencias, retornar tipo por defecto basado en el nombre
  return getDefaultTypeByName(name);
}

// Función para obtener tipo por defecto basado en el nombre
function getDefaultTypeByName(name: string): ProjectType {
  const nameLower = name.toLowerCase();
  
  // Patrones específicos en el nombre
  if (nameLower.includes('landing') || nameLower.includes('conversión')) {
    return PROJECT_TYPES.find(t => t.id === 'landing-page')!;
  }
  
  if (nameLower.includes('tienda') || nameLower.includes('ecommerce') || nameLower.includes('shop')) {
    return PROJECT_TYPES.find(t => t.id === 'ecommerce')!;
  }
  
  if (nameLower.includes('empresa') || nameLower.includes('corporativo') || nameLower.includes('business')) {
    return PROJECT_TYPES.find(t => t.id === 'corporate')!;
  }
  
  if (nameLower.includes('portfolio') || nameLower.includes('portafolio')) {
    return PROJECT_TYPES.find(t => t.id === 'portfolio')!;
  }
  
  if (nameLower.includes('blog') || nameLower.includes('noticias')) {
    return PROJECT_TYPES.find(t => t.id === 'blog')!;
  }
  
  if (nameLower.includes('app') || nameLower.includes('móvil') || nameLower.includes('mobile')) {
    return PROJECT_TYPES.find(t => t.id === 'mobile-app')!;
  }
  
  if (nameLower.includes('sistema') || nameLower.includes('dashboard') || nameLower.includes('admin')) {
    return PROJECT_TYPES.find(t => t.id === 'web-app')!;
  }
  
  // Por defecto, retornar "Desarrollo" para proyectos técnicos
  return PROJECT_TYPES.find(t => t.id === 'development')!;
}

// Función para obtener todos los tipos por categoría
export function getTypesByCategory(): Record<string, ProjectType[]> {
  const categories: Record<string, ProjectType[]> = {};
  
  PROJECT_TYPES.forEach(type => {
    if (!categories[type.category]) {
      categories[type.category] = [];
    }
    categories[type.category].push(type);
  });
  
  return categories;
}

// Función para obtener tipo por ID
export function getTypeById(id: string): ProjectType | undefined {
  return PROJECT_TYPES.find(type => type.id === id);
}

// Función para obtener tipos sugeridos basados en texto
export function getSuggestedTypes(text: string, limit: number = 5): ProjectType[] {
  const suggestions: { type: ProjectType; score: number }[] = [];
  const textLower = text.toLowerCase();
  
  PROJECT_TYPES.forEach(type => {
    if (type.id === 'other') return;
    
    let score = 0;
    type.keywords.forEach(keyword => {
      if (textLower.includes(keyword.toLowerCase())) {
        score += 1;
      }
    });
    
    if (score > 0) {
      suggestions.push({ type, score });
    }
  });
  
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.type);
}
