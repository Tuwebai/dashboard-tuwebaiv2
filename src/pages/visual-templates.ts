// Definir el tipo Component localmente para evitar error de importación
export interface Component {
  id: string;
  type: 'text' | 'button' | 'image' | 'container' | 'grid';
  props: Record<string, any>;
  children?: Component[];
  styles: Record<string, any>;
}

export interface VisualTemplate {
  id: string;
  name: string;
  preview: string;
  description: string;
  components: Component[];
  styles: Record<string, any>;
}

export const templates: VisualTemplate[] = [
  {
    id: 'modern-landing',
    name: 'Landing Moderna',
    preview: '/previews/landing.png',
    description: 'Landing premium con navbar, hero, features, testimonios, CTA y footer.',
    components: [
      // NAVBAR
      {
        id: 'navbar',
        type: 'container',
        props: {},
        styles: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 40px', background: '#18181b', borderRadius: '1.5rem', marginBottom: '2rem', position: 'sticky', top: '0', zIndex: 10 },
        children: [
          {
            id: 'logo',
            type: 'text',
            props: { content: 'TuWeb.ai' },
            styles: { color: '#6366f1', fontWeight: 'bold', fontSize: '1.5rem', letterSpacing: '0.05em' }
          },
          {
            id: 'nav-links',
            type: 'container',
            props: {},
            styles: { display: 'flex', gap: '32px' },
            children: [
              {
                id: 'nav-home',
                type: 'text',
                props: { content: 'Inicio' },
                styles: { color: '#fff', fontWeight: '500', fontSize: '1rem', cursor: 'pointer' }
              },
              {
                id: 'nav-features',
                type: 'text',
                props: { content: 'Características' },
                styles: { color: '#fff', fontWeight: '500', fontSize: '1rem', cursor: 'pointer' }
              },
              {
                id: 'nav-precios',
                type: 'text',
                props: { content: 'Precios' },
                styles: { color: '#fff', fontWeight: '500', fontSize: '1rem', cursor: 'pointer' }
              },
              {
                id: 'nav-contacto',
                type: 'text',
                props: { content: 'Contacto' },
                styles: { color: '#fff', fontWeight: '500', fontSize: '1rem', cursor: 'pointer' }
              }
            ]
          }
        ]
      },
      // HERO
      {
        id: 'hero',
        type: 'container',
        props: {},
        styles: { padding: '64px 0', background: 'linear-gradient(90deg, #0f172a 0%, #312e81 100%)', borderRadius: '1.5rem', textAlign: 'center', marginBottom: '2rem' },
        children: [
          {
            id: 'hero-title',
            type: 'text',
            props: { content: 'Impulsa tu negocio digital con TuWeb.ai' },
            styles: { fontSize: '2.8rem', color: '#fff', fontWeight: 'bold', marginBottom: '1rem' }
          },
          {
            id: 'hero-sub',
            type: 'text',
            props: { content: 'Crea tu web profesional en minutos, sin código y 100% personalizable.' },
            styles: { fontSize: '1.3rem', color: '#c7d2fe', marginBottom: '2rem' }
          },
          {
            id: 'hero-btn',
            type: 'button',
            props: { text: 'Comenzar ahora' },
            styles: { backgroundColor: '#6366f1', color: '#fff', padding: '18px 48px', borderRadius: '999px', fontWeight: 'bold', fontSize: '1.2rem', border: 'none' }
          }
        ]
      },
      // FEATURES
      {
        id: 'features',
        type: 'grid',
        props: { columns: { mobile: 1, tablet: 2, desktop: 3 } },
        styles: { marginTop: '0', gap: '32px', background: 'transparent', marginBottom: '2rem' },
        children: [
          {
            id: 'f1',
            type: 'text',
            props: { content: '⚡ Rápido y seguro' },
            styles: { fontSize: '1.1rem', color: '#fff', background: '#312e81', borderRadius: '1rem', padding: '24px', textAlign: 'center' }
          },
          {
            id: 'f2',
            type: 'text',
            props: { content: '🎨 100% personalizable' },
            styles: { fontSize: '1.1rem', color: '#fff', background: '#312e81', borderRadius: '1rem', padding: '24px', textAlign: 'center' }
          },
          {
            id: 'f3',
            type: 'text',
            props: { content: '💼 Listo para negocios' },
            styles: { fontSize: '1.1rem', color: '#fff', background: '#312e81', borderRadius: '1rem', padding: '24px', textAlign: 'center' }
          }
        ]
      },
      // TESTIMONIOS
      {
        id: 'testimonials',
        type: 'grid',
        props: { columns: { mobile: 1, tablet: 2, desktop: 3 } },
        styles: { marginTop: '0', gap: '24px', background: 'transparent', marginBottom: '2rem' },
        children: [
          {
            id: 't1',
            type: 'container',
            props: {},
            styles: { background: '#18181b', borderRadius: '1rem', padding: '24px', boxShadow: '0 2px 8px #0002' },
            children: [
              {
                id: 't1-text',
                type: 'text',
                props: { content: '“La mejor plataforma para crear webs profesionales sin programar.”' },
                styles: { color: '#fff', fontSize: '1.1rem', marginBottom: '1rem' }
              },
              {
                id: 't1-author',
                type: 'text',
                props: { content: '— Sofía, emprendedora' },
                styles: { color: '#a21caf', fontWeight: 'bold' }
              }
            ]
          },
          {
            id: 't2',
            type: 'container',
            props: {},
            styles: { background: '#18181b', borderRadius: '1rem', padding: '24px', boxShadow: '0 2px 8px #0002' },
            children: [
              {
                id: 't2-text',
                type: 'text',
                props: { content: '“En minutos lancé mi web y empecé a vender online.”' },
                styles: { color: '#fff', fontSize: '1.1rem', marginBottom: '1rem' }
              },
              {
                id: 't2-author',
                type: 'text',
                props: { content: '— Martín, freelancer' },
                styles: { color: '#6366f1', fontWeight: 'bold' }
              }
            ]
          }
        ]
      },
      // CTA
      {
        id: 'cta',
        type: 'container',
        props: {},
        styles: { background: 'linear-gradient(90deg, #6366f1 0%, #a21caf 100%)', borderRadius: '1.5rem', padding: '40px', textAlign: 'center', marginBottom: '2rem' },
        children: [
          {
            id: 'cta-title',
            type: 'text',
            props: { content: '¿Listo para crear tu web?' },
            styles: { color: '#fff', fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }
          },
          {
            id: 'cta-btn',
            type: 'button',
            props: { text: 'Empieza gratis' },
            styles: { backgroundColor: '#fff', color: '#6366f1', padding: '16px 40px', borderRadius: '999px', fontWeight: 'bold', fontSize: '1.1rem', border: 'none' }
          }
        ]
      },
      // FOOTER
      {
        id: 'footer',
        type: 'container',
        props: {},
        styles: { background: '#18181b', borderRadius: '1.5rem', padding: '32px 40px', textAlign: 'center', marginTop: '2rem' },
        children: [
          {
            id: 'footer-text',
            type: 'text',
            props: { content: '© 2024 TuWeb.ai — Todos los derechos reservados.' },
            styles: { color: '#c7d2fe', fontSize: '1rem' }
          },
          {
            id: 'footer-links',
            type: 'container',
            props: {},
            styles: { display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '1rem' },
            children: [
              {
                id: 'footer-link-1',
                type: 'text',
                props: { content: 'Política de privacidad' },
                styles: { color: '#6366f1', fontSize: '1rem', cursor: 'pointer' }
              },
              {
                id: 'footer-link-2',
                type: 'text',
                props: { content: 'Términos de uso' },
                styles: { color: '#6366f1', fontSize: '1rem', cursor: 'pointer' }
              }
            ]
          }
        ]
      },
    ],
    styles: {
      primaryColor: '#6366f1',
      secondaryColor: '#a21caf',
      font: 'Inter, sans-serif',
      borderRadius: '1.5rem',
      background: '#0f172a',
    }
  },
  {
    id: 'ecommerce-minimal',
    name: 'Ecommerce Minimal',
    preview: '/previews/ecommerce.png',
    description: 'Ecommerce moderno con navbar, hero, productos, CTA y footer.',
    components: [
      // NAVBAR
      {
        id: 'navbar-ec',
        type: 'container',
        props: {},
        styles: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 40px', background: '#18181b', borderRadius: '1.5rem', marginBottom: '2rem', position: 'sticky', top: '0', zIndex: 10 },
        children: [
          {
            id: 'logo-ec',
            type: 'text',
            props: { content: 'MiTienda' },
            styles: { color: '#a21caf', fontWeight: 'bold', fontSize: '1.5rem', letterSpacing: '0.05em' }
          },
          {
            id: 'nav-links-ec',
            type: 'container',
            props: {},
            styles: { display: 'flex', gap: '32px' },
            children: [
              {
                id: 'nav-ec-home',
                type: 'text',
                props: { content: 'Inicio' },
                styles: { color: '#fff', fontWeight: '500', fontSize: '1rem', cursor: 'pointer' }
              },
              {
                id: 'nav-ec-productos',
                type: 'text',
                props: { content: 'Productos' },
                styles: { color: '#fff', fontWeight: '500', fontSize: '1rem', cursor: 'pointer' }
              },
              {
                id: 'nav-ec-contacto',
                type: 'text',
                props: { content: 'Contacto' },
                styles: { color: '#fff', fontWeight: '500', fontSize: '1rem', cursor: 'pointer' }
              }
            ]
          }
        ]
      },
      // HERO
      {
        id: 'hero-ec',
        type: 'container',
        props: {},
        styles: { padding: '56px 0', background: 'linear-gradient(90deg, #0f172a 0%, #a21caf 100%)', borderRadius: '1.5rem', textAlign: 'center', marginBottom: '2rem' },
        children: [
          {
            id: 'hero-title-ec',
            type: 'text',
            props: { content: 'Tu tienda, tu marca' },
            styles: { fontSize: '2.2rem', color: '#fff', fontWeight: 'bold', marginBottom: '1rem' }
          },
          {
            id: 'hero-btn-ec',
            type: 'button',
            props: { text: 'Ver productos' },
            styles: { backgroundColor: '#a21caf', color: '#fff', padding: '14px 36px', borderRadius: '999px', fontWeight: 'bold', fontSize: '1.1rem', border: 'none' }
          }
        ]
      },
      // PRODUCTOS
      {
        id: 'products-grid',
        type: 'grid',
        props: { columns: { mobile: 1, tablet: 2, desktop: 3 } },
        styles: { marginTop: '0', gap: '24px', background: 'transparent', marginBottom: '2rem' },
        children: [
          {
            id: 'p1',
            type: 'container',
            props: {},
            styles: { background: '#18181b', borderRadius: '1rem', padding: '16px', textAlign: 'center' },
            children: [
              {
                id: 'img-p1',
                type: 'image',
                props: { src: 'https://images.unsplash.com/photo-1513708927688-890fe8c7b8c3?auto=format&fit=crop&w=400&q=80', alt: 'Producto 1' },
                styles: { width: '100%', borderRadius: '1rem', marginBottom: '0.5rem' }
              },
              {
                id: 'name-p1',
                type: 'text',
                props: { content: 'Producto Estrella' },
                styles: { color: '#fff', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.25rem' }
              },
              {
                id: 'price-p1',
                type: 'text',
                props: { content: '$49.99' },
                styles: { color: '#a21caf', fontWeight: 'bold', fontSize: '1rem' }
              }
            ]
          },
          {
            id: 'p2',
            type: 'container',
            props: {},
            styles: { background: '#18181b', borderRadius: '1rem', padding: '16px', textAlign: 'center' },
            children: [
              {
                id: 'img-p2',
                type: 'image',
                props: { src: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80', alt: 'Producto 2' },
                styles: { width: '100%', borderRadius: '1rem', marginBottom: '0.5rem' }
              },
              {
                id: 'name-p2',
                type: 'text',
                props: { content: 'Accesorio Pro' },
                styles: { color: '#fff', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.25rem' }
              },
              {
                id: 'price-p2',
                type: 'text',
                props: { content: '$19.99' },
                styles: { color: '#a21caf', fontWeight: 'bold', fontSize: '1rem' }
              }
            ]
          },
          {
            id: 'p3',
            type: 'container',
            props: {},
            styles: { background: '#18181b', borderRadius: '1rem', padding: '16px', textAlign: 'center' },
            children: [
              {
                id: 'img-p3',
                type: 'image',
                props: { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80', alt: 'Producto 3' },
                styles: { width: '100%', borderRadius: '1rem', marginBottom: '0.5rem' }
              },
              {
                id: 'name-p3',
                type: 'text',
                props: { content: 'Nuevo Lanzamiento' },
                styles: { color: '#fff', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.25rem' }
              },
              {
                id: 'price-p3',
                type: 'text',
                props: { content: '$29.99' },
                styles: { color: '#a21caf', fontWeight: 'bold', fontSize: '1rem' }
              }
            ]
          }
        ]
      },
      // CTA
      {
        id: 'cta-ec',
        type: 'container',
        props: {},
        styles: { background: 'linear-gradient(90deg, #a21caf 0%, #6366f1 100%)', borderRadius: '1.5rem', padding: '40px', textAlign: 'center', marginBottom: '2rem' },
        children: [
          {
            id: 'cta-title-ec',
            type: 'text',
            props: { content: '¿Listo para vender online?' },
            styles: { color: '#fff', fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }
          },
          {
            id: 'cta-btn-ec',
            type: 'button',
            props: { text: 'Crear mi tienda' },
            styles: { backgroundColor: '#fff', color: '#a21caf', padding: '16px 40px', borderRadius: '999px', fontWeight: 'bold', fontSize: '1.1rem', border: 'none' }
          }
        ]
      },
      // FOOTER
      {
        id: 'footer-ec',
        type: 'container',
        props: {},
        styles: { background: '#18181b', borderRadius: '1.5rem', padding: '32px 40px', textAlign: 'center', marginTop: '2rem' },
        children: [
          {
            id: 'footer-text-ec',
            type: 'text',
            props: { content: '© 2024 MiTienda — Todos los derechos reservados.' },
            styles: { color: '#c7d2fe', fontSize: '1rem' }
          },
          {
            id: 'footer-links-ec',
            type: 'container',
            props: {},
            styles: { display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '1rem' },
            children: [
              {
                id: 'footer-link-ec-1',
                type: 'text',
                props: { content: 'Política de privacidad' },
                styles: { color: '#a21caf', fontSize: '1rem', cursor: 'pointer' }
              },
              {
                id: 'footer-link-ec-2',
                type: 'text',
                props: { content: 'Términos de uso' },
                styles: { color: '#a21caf', fontSize: '1rem', cursor: 'pointer' }
              }
            ]
          }
        ]
      },
    ],
    styles: {
      primaryColor: '#a21caf',
      secondaryColor: '#6366f1',
      font: 'Inter, sans-serif',
      borderRadius: '1.5rem',
      background: '#0f172a',
    }
  },
  {
    id: 'blog-pro',
    name: 'Blog Pro',
    preview: '/previews/blog.png',
    description: 'Blog profesional con navbar, hero, posts, CTA y footer.',
    components: [
      // NAVBAR
      {
        id: 'navbar-blog',
        type: 'container',
        props: {},
        styles: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 40px', background: '#18181b', borderRadius: '1.5rem', marginBottom: '2rem', position: 'sticky', top: '0', zIndex: 10 },
        children: [
          {
            id: 'logo-blog',
            type: 'text',
            props: { content: 'BlogPro' },
            styles: { color: '#6366f1', fontWeight: 'bold', fontSize: '1.5rem', letterSpacing: '0.05em' }
          },
          {
            id: 'nav-links-blog',
            type: 'container',
            props: {},
            styles: { display: 'flex', gap: '32px' },
            children: [
              {
                id: 'nav-blog-home',
                type: 'text',
                props: { content: 'Inicio' },
                styles: { color: '#fff', fontWeight: '500', fontSize: '1rem', cursor: 'pointer' }
              },
              {
                id: 'nav-blog-posts',
                type: 'text',
                props: { content: 'Posts' },
                styles: { color: '#fff', fontWeight: '500', fontSize: '1rem', cursor: 'pointer' }
              },
              {
                id: 'nav-blog-contacto',
                type: 'text',
                props: { content: 'Contacto' },
                styles: { color: '#fff', fontWeight: '500', fontSize: '1rem', cursor: 'pointer' }
              }
            ]
          }
        ]
      },
      // HERO
      {
        id: 'header-blog',
        type: 'container',
        props: {},
        styles: { padding: '48px 0', background: 'linear-gradient(90deg, #0f172a 0%, #6366f1 100%)', borderRadius: '1.5rem', textAlign: 'center', marginBottom: '2rem' },
        children: [
          {
            id: 'header-title',
            type: 'text',
            props: { content: 'Bienvenido a mi blog' },
            styles: { fontSize: '2rem', color: '#fff', fontWeight: 'bold', marginBottom: '1rem' }
          },
          {
            id: 'header-desc',
            type: 'text',
            props: { content: 'Tips, tutoriales y recursos para crecer online.' },
            styles: { fontSize: '1.1rem', color: '#c7d2fe', marginBottom: '2rem' }
          }
        ]
      },
      // POSTS
      {
        id: 'posts-grid',
        type: 'grid',
        props: { columns: { mobile: 1, tablet: 2, desktop: 3 } },
        styles: { marginTop: '0', gap: '24px', background: 'transparent', marginBottom: '2rem' },
        children: [
          {
            id: 'post1',
            type: 'container',
            props: {},
            styles: { background: '#312e81', borderRadius: '1rem', padding: '24px' },
            children: [
              {
                id: 'post1-title',
                type: 'text',
                props: { content: 'Cómo crear una web en 2024' },
                styles: { fontWeight: 'bold', color: '#fff', fontSize: '1.1rem', marginBottom: '0.5rem' }
              },
              {
                id: 'post1-desc',
                type: 'text',
                props: { content: 'Guía paso a paso para lanzar tu web.' },
                styles: { color: '#c7d2fe', fontSize: '1rem' }
              }
            ]
          },
          {
            id: 'post2',
            type: 'container',
            props: {},
            styles: { background: '#312e81', borderRadius: '1rem', padding: '24px' },
            children: [
              {
                id: 'post2-title',
                type: 'text',
                props: { content: 'SEO para principiantes' },
                styles: { fontWeight: 'bold', color: '#fff', fontSize: '1.1rem', marginBottom: '0.5rem' }
              },
              {
                id: 'post2-desc',
                type: 'text',
                props: { content: 'Aprende a posicionar tu web en Google.' },
                styles: { color: '#c7d2fe', fontSize: '1rem' }
              }
            ]
          }
        ]
      },
      // CTA
      {
        id: 'cta-blog',
        type: 'container',
        props: {},
        styles: { background: 'linear-gradient(90deg, #6366f1 0%, #a21caf 100%)', borderRadius: '1.5rem', padding: '40px', textAlign: 'center', marginBottom: '2rem' },
        children: [
          {
            id: 'cta-title-blog',
            type: 'text',
            props: { content: '¿Listo para lanzar tu blog?' },
            styles: { color: '#fff', fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }
          },
          {
            id: 'cta-btn-blog',
            type: 'button',
            props: { text: 'Crear mi blog' },
            styles: { backgroundColor: '#fff', color: '#a21caf', padding: '16px 40px', borderRadius: '999px', fontWeight: 'bold', fontSize: '1.1rem', border: 'none' }
          }
        ]
      },
      // FOOTER
      {
        id: 'footer-blog',
        type: 'container',
        props: {},
        styles: { background: '#18181b', borderRadius: '1.5rem', padding: '32px 40px', textAlign: 'center', marginTop: '2rem' },
        children: [
          {
            id: 'footer-text-blog',
            type: 'text',
            props: { content: '© 2024 BlogPro — Todos los derechos reservados.' },
            styles: { color: '#c7d2fe', fontSize: '1rem' }
          },
          {
            id: 'footer-links-blog',
            type: 'container',
            props: {},
            styles: { display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '1rem' },
            children: [
              {
                id: 'footer-link-blog-1',
                type: 'text',
                props: { content: 'Política de privacidad' },
                styles: { color: '#6366f1', fontSize: '1rem', cursor: 'pointer' }
              },
              {
                id: 'footer-link-blog-2',
                type: 'text',
                props: { content: 'Términos de uso' },
                styles: { color: '#6366f1', fontSize: '1rem', cursor: 'pointer' }
              }
            ]
          }
        ]
      },
    ],
    styles: {
      primaryColor: '#6366f1',
      secondaryColor: '#a21caf',
      font: 'Inter, sans-serif',
      borderRadius: '1.5rem',
      background: '#0f172a',
    }
  }
]; 
