import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Función utilitaria para realizar scroll al top manualmente
 * Útil para componentes que necesitan activar scroll en eventos específicos
 */
export const scrollToTopManual = () => {
  try {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    });
  } catch (e) {
    window.scrollTo(0, 0);
  }
};

/**
 * Hook personalizado que realiza un scroll a la parte superior de la página
 * cada vez que la ruta (pathname) cambia o cuando se especifica una dependencia adicional.
 * Esto asegura que cada navegación comience desde el principio.
 * 
 * @param {any} additionalDependency - Dependencia adicional para activar el scroll (ej: selectedOption)
 */
const useScrollToTop = (additionalDependency = null) => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Función para realizar el scroll
    const scrollToTop = () => {
      try {
        // Usar scrollTo inmediato para navegación interna más rápida
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'auto', // Cambio a 'auto' para scroll instantáneo en navegación interna
        });
      } catch (e) {
        // Fallback para navegadores antiguos
        window.scrollTo(0, 0);
      }
    };

    // Ejecutar scroll con un pequeño delay para asegurar que el contenido se haya renderizado
    const timeoutId = setTimeout(scrollToTop, 0);

    return () => clearTimeout(timeoutId);
  }, [pathname, additionalDependency]); // Dependencias: pathname Y la dependencia adicional
};

export default useScrollToTop; 