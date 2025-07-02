import useScrollToTop from '../../hooks/useScrollToTop';

/**
 * Componente gestor de scroll.
 * Su única responsabilidad es ejecutar el hook `useScrollToTop`
 * para interceptar los cambios de ruta globales y navegación interna,
 * realizando el scroll al top en ambos casos.
 * No renderiza ningún elemento en el DOM.
 * 
 * @param {any} navigationDependency - Dependencia adicional para detectar navegación interna
 */
const ScrollManager = ({ navigationDependency }) => {
  useScrollToTop(navigationDependency);

  return null;
};

export default ScrollManager; 