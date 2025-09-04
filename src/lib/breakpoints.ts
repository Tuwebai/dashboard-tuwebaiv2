// Sistema de breakpoints consistente para toda la aplicación

import React from 'react';
export const BREAKPOINTS = {
  xs: '320px',    // Móviles pequeños
  sm: '640px',    // Móviles
  md: '768px',    // Tablets
  lg: '1024px',   // Laptops
  xl: '1280px',   // Desktops
  '2xl': '1536px' // Pantallas grandes
} as const;

export const GRID_BREAKPOINTS = {
  xs: 'grid-cols-1',
  sm: 'grid-cols-1 sm:grid-cols-2',
  md: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
  lg: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  xl: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  '2xl': 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
} as const;

export const FLEX_BREAKPOINTS = {
  xs: 'flex-col',
  sm: 'flex-col sm:flex-row',
  md: 'flex-col sm:flex-row md:flex-col lg:flex-row',
  lg: 'flex-col sm:flex-row md:flex-col lg:flex-row',
  xl: 'flex-col sm:flex-row md:flex-col lg:flex-row xl:flex-row',
  '2xl': 'flex-col sm:flex-row md:flex-col lg:flex-row xl:flex-row 2xl:flex-row'
} as const;

export const SPACING_BREAKPOINTS = {
  xs: 'p-4',
  sm: 'p-4 sm:p-6',
  md: 'p-4 sm:p-6 md:p-8',
  lg: 'p-4 sm:p-6 md:p-8 lg:p-10',
  xl: 'p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12',
  '2xl': 'p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 2xl:p-16'
} as const;

export const TEXT_BREAKPOINTS = {
  xs: 'text-sm',
  sm: 'text-sm sm:text-base',
  md: 'text-sm sm:text-base md:text-lg',
  lg: 'text-sm sm:text-base md:text-lg lg:text-xl',
  xl: 'text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl',
  '2xl': 'text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl'
} as const;

// Hook para detectar breakpoints
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = React.useState<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'>('lg');
  const [isMobile, setIsMobile] = React.useState(false);
  const [isTablet, setIsTablet] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      if (width < 640) {
        setBreakpoint('xs');
        setIsMobile(true);
        setIsTablet(false);
        setIsDesktop(false);
      } else if (width < 768) {
        setBreakpoint('sm');
        setIsMobile(true);
        setIsTablet(false);
        setIsDesktop(false);
      } else if (width < 1024) {
        setBreakpoint('md');
        setIsMobile(false);
        setIsTablet(true);
        setIsDesktop(false);
      } else if (width < 1280) {
        setBreakpoint('lg');
        setIsMobile(false);
        setIsTablet(false);
        setIsDesktop(true);
      } else if (width < 1536) {
        setBreakpoint('xl');
        setIsMobile(false);
        setIsTablet(false);
        setIsDesktop(true);
      } else {
        setBreakpoint('2xl');
        setIsMobile(false);
        setIsTablet(false);
        setIsDesktop(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isSmallScreen: isMobile || isTablet,
    isLargeScreen: isDesktop
  };
}

// Clases de utilidad para responsividad
export const RESPONSIVE_CLASSES = {
  // Grid layouts
  grid: {
    mobile: 'grid-cols-1 gap-4',
    tablet: 'grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6',
    desktop: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8'
  },
  
  // Flex layouts
  flex: {
    mobile: 'flex-col space-y-4',
    tablet: 'flex-col sm:flex-row sm:space-y-0 sm:space-x-6',
    desktop: 'flex-col lg:flex-row lg:space-y-0 lg:space-x-8'
  },
  
  // Spacing
  spacing: {
    mobile: 'p-4 space-y-4',
    tablet: 'p-4 sm:p-6 space-y-4 sm:space-y-6',
    desktop: 'p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8'
  },
  
  // Text sizes
  text: {
    mobile: 'text-sm sm:text-base',
    tablet: 'text-sm sm:text-base md:text-lg',
    desktop: 'text-sm sm:text-base md:text-lg lg:text-xl'
  },
  
  // Button sizes
  button: {
    mobile: 'h-10 px-4 text-sm',
    tablet: 'h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base',
    desktop: 'h-10 sm:h-11 lg:h-12 px-4 sm:px-6 lg:px-8 text-sm sm:text-base lg:text-lg'
  }
} as const;

// Clases para touch targets móviles (mínimo 44px según WCAG)
export const TOUCH_TARGET_CLASSES = {
  button: 'min-h-[44px] min-w-[44px] px-4 py-2',
  icon: 'min-h-[44px] min-w-[44px] p-2',
  link: 'min-h-[44px] min-w-[44px] px-4 py-2',
  input: 'min-h-[44px] px-4 py-2',
  select: 'min-h-[44px] px-4 py-2'
} as const;

// Clases para navegación móvil
export const MOBILE_NAV_CLASSES = {
  sidebar: 'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out',
  overlay: 'fixed inset-0 bg-black bg-opacity-50 z-40',
  menuButton: 'lg:hidden p-2 rounded-md hover:bg-gray-100',
  closeButton: 'absolute top-4 right-4 p-2 rounded-md hover:bg-gray-100'
} as const;

// Clases para formularios móviles
export const MOBILE_FORM_CLASSES = {
  container: 'space-y-6 p-4 sm:p-6',
  field: 'space-y-2',
  label: 'text-sm font-medium text-gray-700',
  input: 'w-full min-h-[44px] px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
  button: 'w-full sm:w-auto min-h-[44px] px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
} as const;

// Clases para tablas móviles
export const MOBILE_TABLE_CLASSES = {
  container: 'overflow-x-auto',
  table: 'min-w-full divide-y divide-gray-200',
  header: 'bg-gray-50',
  headerCell: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
  row: 'bg-white hover:bg-gray-50',
  cell: 'px-4 py-3 text-sm text-gray-900'
} as const;

// Clases para cards móviles
export const MOBILE_CARD_CLASSES = {
  container: 'bg-white rounded-lg shadow-sm border border-gray-200',
  header: 'px-4 py-3 border-b border-gray-200',
  content: 'p-4 sm:p-6',
  footer: 'px-4 py-3 border-t border-gray-200 bg-gray-50'
} as const;

// Clases para modales móviles
export const MOBILE_MODAL_CLASSES = {
  overlay: 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4',
  container: 'bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto',
  header: 'px-6 py-4 border-b border-gray-200',
  content: 'px-6 py-4',
  footer: 'px-6 py-4 border-t border-gray-200 bg-gray-50'
} as const;

export default BREAKPOINTS;
