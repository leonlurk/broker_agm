import useScrollToTop from '../../hooks/useScrollToTop';

/**
 * Componente gestor de scroll.
 * Su única responsabilidad es ejecutar el hook `useScrollToTop`
 * para interceptar los cambios de ruta globales y navegación interna,
 * realizando el scroll al top en ambos casos.
 * No renderiza ningún elemento en el DOM.
 * 
 * @param {any} navigationDependency - Dependencia adicional para detectar navegación interna
 * @param {React.RefObject<HTMLElement>} scrollContainerRef - Referencia al contenedor con scroll
 */
const ScrollManager = ({ navigationDependency, scrollContainerRef }) => {
  useScrollToTop(navigationDependency, scrollContainerRef);

  return null;
};

export default ScrollManager; 