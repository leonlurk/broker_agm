# Claude TODO List - Plataforma de Trading AGM Broker

## Estado Actual del Proyecto
**Fecha de última actualización:** `r new Date().toLocaleDateString('es-ES')`

---

## 🎯 TAREAS COMPLETADAS ✅

### ✅ **[TAREA 1] - Gestión de Dropdowns en Sidebar** 
**Estado:** COMPLETADA  
**Prioridad:** ALTA  

**Implementación realizada:**
- ✅ Solo un dropdown activo a la vez en el sidebar
- ✅ Al abrir un dropdown, se cierran todos los demás automáticamente
- ✅ Al navegar a sección sin dropdown (ej: Cuentas, Gestor), se cierran todos los dropdowns
- ✅ Comportamiento fluido sin parpadeos
- ✅ Aplicado a dropdowns: PAMM, CopyTrading, Herramientas, Plataformas

**Archivos modificados:**
- `src/Sidebar.jsx` - Lógica de exclusividad de dropdowns

---

### ✅ **[TAREA 2] - Sistema de Internacionalización**
**Estado:** COMPLETADA  
**Prioridad:** ALTA  

**Implementación realizada:**
- ✅ Creado hook `useTranslation` personalizado
- ✅ Archivos de traducción: `es.json` e `en.json` con traducciones completas
- ✅ Componente `LanguageSelector` con dropdown funcional y banderas
- ✅ Persistencia del idioma en localStorage
- ✅ Selector integrado en header del componente Home
- ✅ Traducciones aplicadas en Sidebar y componente Home
- ✅ Cambio instantáneo de idioma en toda la aplicación

**Archivos creados:**
- `src/locales/es.json` - Traducciones en español
- `src/locales/en.json` - Traducciones en inglés  
- `src/hooks/useTranslation.js` - Hook de internacionalización
- `src/components/LanguageSelector.jsx` - Selector de idiomas

**Archivos modificados:**
- `src/Sidebar.jsx` - Traducciones del sidebar
- `src/components/Home.jsx` - Integración del selector y traducciones

---

## 🚧 TAREAS PENDIENTES 

### 🔴 **PRIORIDAD ALTA**

#### **[TAREA 3] - Remoción de Dropdown Plataformas**
**Estado:** PENDIENTE  
**Descripción:** Eliminar completamente el dropdown de plataformas del sidebar
- ❌ Remover componente de dropdown plataformas  
- ❌ Limpiar rutas relacionadas
- ❌ Actualizar navegación del sidebar
- ❌ Verificar que no queden referencias rotas

---

### 🟡 **PRIORIDAD MEDIA**

#### **[TAREA 4] - Alineación de Iconos en Header**
**Estado:** PENDIENTE  
**Descripción:** Unificar tamaño de todos los iconos del header
- ❌ Auditar todos los iconos del header
- ❌ Establecer tamaño estándar (24x24px)
- ❌ Aplicar clases CSS consistentes
- ❌ Verificar alineación vertical

#### **[TAREA 5] - Styling del Balance en Cuentas**
**Estado:** PENDIENTE  
**Descripción:** Mostrar balance total en color blanco, mantener porcentaje sin cambios
- ❌ Localizar componente de balance en sección Cuentas
- ❌ Aplicar `color: white` solo al monto total
- ❌ Preservar styling actual del porcentaje

#### **[TAREA 6] - Ajuste de Escala en Gráfico**
**Estado:** PENDIENTE  
**Descripción:** Gráfico inicia desde balance original con incrementos proporcionales
- ❌ Identificar balance inicial de la cuenta
- ❌ Calcular incrementos dinámicos basados en monto inicial
- ❌ Ajustar eje Y del gráfico dinámicamente

---

### 🟢 **PRIORIDAD BAJA**

#### **[TAREA 7] - Fusión de Wallet: Depositar + Retirar**
**Estado:** PENDIENTE  
**Descripción:** Cambiar "Depositar" por "Wallet" y fusionar con funcionalidad de retiros
- ❌ Renombrar sección "Depositar" a "Wallet"
- ❌ Crear componente con tabs: "Depositar" y "Retirar"
- ❌ Agregar botón "Historial" junto a los tabs
- ❌ Implementar modal de detalles para historial

#### **[TAREA 8] - Paginación en Afiliados**
**Estado:** PENDIENTE  
**Descripción:** Implementar paginación en "Cuentas Activas" y "Comisiones Generadas"
- ❌ Agregar componente de paginación reutilizable
- ❌ Implementar en tabla "Cuentas Activas"
- ❌ Implementar en tabla "Comisiones Generadas"

#### **[TAREA 9] - Limpieza de Filtros en Historiales**
**Estado:** PENDIENTE  
**Descripción:** Remover filtros en historiales de afiliados
- ❌ Localizar componentes de filtros en historiales
- ❌ Remover elementos de filtrado
- ❌ Simplificar interfaz

#### **[TAREA 10] - Configuración CopyTrading**
**Estado:** PENDIENTE  
**Descripción:** Agregar campos de configuración CopyTrading
- ❌ Campo apalancamiento (dropdown: 1:50, 1:100, 1:200, 1:500)
- ❌ Campo contraseña (input password)  
- ❌ Campo cuenta MetaTrader (dropdown con datos estáticos)
- ❌ Campo cuenta para recibir balance (dropdown con cuentas del usuario)

#### **[TAREA 11] - Limpieza de Enlaces**
**Estado:** PENDIENTE  
**Descripción:** Remover elementos específicos
- ❌ Remover link de wallet en sección afiliados
- ❌ Remover botón descargar en Gestor

---

## 📊 RESUMEN DE PROGRESO

**Tareas Completadas:** 2/11 (18%)
**Tareas Pendientes:** 9/11 (82%)

### Por Prioridad:
- **Alta:** 1/2 completadas (50%)
- **Media:** 0/3 completadas (0%)  
- **Baja:** 0/6 completadas (0%)

---

## 🔍 PRÓXIMOS PASOS RECOMENDADOS

1. **Inmediato:** Continuar con Tarea 3 (Remoción de Dropdown Plataformas)
2. **Esta semana:** Completar todas las tareas de prioridad alta
3. **Siguiente semana:** Abordar tareas de prioridad media (visual improvements)
4. **Semana 3-4:** Implementar funcionalidades de prioridad baja

---

## 📝 NOTAS TÉCNICAS

### Arquitectura Implementada:
- **Internacionalización:** Hook personalizado + archivos JSON + localStorage
- **Dropdowns:** Estado local con lógica de exclusividad  
- **Componentes:** Reutilización y separación de responsabilidades

### Tecnologías Utilizadas:
- React Hooks (useState, useEffect, useRef)
- LocalStorage para persistencia
- Tailwind CSS para estilos
- Arquitectura modular de componentes

---

*Este documento se actualiza automáticamente con cada cambio en el proyecto.*