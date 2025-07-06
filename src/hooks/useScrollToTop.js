import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Función utilitaria para realizar scroll al top manualmente dentro de un elemento específico.
 * Útil para componentes que necesitan activar scroll en eventos específicos.
 * @param {React.RefObject<HTMLElement>} elementRef - Referencia al elemento que tiene el scroll.
 */
export const scrollToTopManual = (elementRef = null) => {
  const target = elementRef?.current;
  if (target) {
    target.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  } else {
    // Fallback a window si no se proporciona una referencia
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
};

/**
 * Hook personalizado que realiza un scroll a la parte superior de un contenedor
 * cada vez que la ruta (pathname) cambia o cuando se especifica una dependencia adicional.
 * @param {any} additionalDependency - Dependencia adicional para activar el scroll.
 * @param {React.RefObject<HTMLElement>} elementRef - Referencia al elemento que tiene el scroll.
 */
const useScrollToTop = (additionalDependency = null, elementRef = null) => {
  const { pathname } = useLocation();

  useEffect(() => {
    const target = elementRef?.current;
    if (target) {
      target.scrollTo({ top: 0, behavior: 'auto' });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, additionalDependency, elementRef]);
};

export default useScrollToTop;