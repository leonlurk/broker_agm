import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, Calendar, Clock, AlertTriangle, Loader, Globe } from 'lucide-react';
import useTranslation from '../hooks/useTranslation';
import newsEs from '../locales/es/news.json';
import newsEn from '../locales/en/news.json';

const Noticias = () => {
    const { currentLanguage } = useTranslation();
    const newsTranslations = currentLanguage === 'es' ? newsEs : newsEn;
    const t = (key) => {
      const keys = key.split('.');
      let value = newsTranslations;
      for (const k of keys) {
        value = value?.[k];
      }
      return value || key;
    };
    
    // Fecha actual y rango
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today to the start of the day

  // Días de la semana con traducción
  const days = useMemo(() => [
    t('days.monday'),
    t('days.tuesday'),
    t('days.wednesday'),
    t('days.thursday'),
    t('days.friday')
  ], [currentLanguage]); // Dependencia de idioma

  const isWeekend = today.getDay() === 0 || today.getDay() === 6; // 0 es domingo, 6 es sábado

  // Helper to get Monday of a given date's week
  const getMonday = (d) => {
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };
  
  // Helper to get last Friday's date
  const getLastFriday = () => {
    const lastFriday = new Date(today);
    while (lastFriday.getDay() !== 5) { // 5 es viernes
      lastFriday.setDate(lastFriday.getDate() - 1);
    }
    return lastFriday;
  };

  // Initialize states
  const [currentViewMonday, setCurrentViewMonday] = useState(getMonday(today));
  
  // Determine initial selected date and active day
  const dayOfWeek = today.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
  let initialDayIndexResolved = isWeekend ? 4 : (dayOfWeek - 1); // 4 is Friday's index

  const initialSelectedDate = isWeekend ? getLastFriday() : new Date(currentViewMonday);
  if (!isWeekend) {
    initialSelectedDate.setDate(currentViewMonday.getDate() + initialDayIndexResolved);
  }

  const [selectedFullDate, setSelectedFullDate] = useState(initialSelectedDate);
  const [activeDay, setActiveDay] = useState(days[initialDayIndexResolved]); // 'Lunes', 'Martes', etc.
  
  // Estado para eventos económicos
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [impactFilters, setImpactFilters] = useState({
    feriados: false,
    bajo: true,
    medio: true,
    alto: true
  });

  const [visibilityFilters, setVisibilityFilters] = useState({
    ocultarNoticias: false,
    mostrarRestringidos: false
  });

  // Currency filter state
  const [currencyFilters, setCurrencyFilters] = useState({
    USD: true,
    EUR: true,
    GBP: true,
    JPY: true,
    AUD: true,
    CAD: true,
    CHF: true,
    NZD: true,
    CNY: true,
    MXN: true,
    BRL: true,
    INR: true,
    RUB: true,
    KRW: true,
    TRY: true,
    ZAR: true,
    SGD: true,
    HKD: true,
    Global: true
  });

  // Estado para controlar la zona horaria
  const [timeZone, setTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  console.log("Zona horaria actual:", timeZone);
  
  const [showTimeZoneMenu, setShowTimeZoneMenu] = useState(false);

  // Lista de zonas horarias comunes
  const timeZones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Mexico_City',
    'Europe/London',
    'Europe/Madrid',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Dubai',
    'Australia/Sydney'
  ];

  const formatTimeForZone = (zone) => {
    try {
      return new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: zone
      });
    } catch (error) {
      console.error(`Error formateando hora para zona ${zone}:`, error);
      return "--:--";
    }
  };

  // Reloj en tiempo real
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone }));

  // Obtener noticias financieras desde API
  useEffect(() => {
    const fetchFinancialNews = async () => {
      console.log("===== INICIANDO FETCH DE NOTICIAS =====");
      console.log("Selected Full Date for Fetch:", selectedFullDate.toISOString());
      setIsLoading(true);
      setError(null);
      
      try {
        const fromDateStr = selectedFullDate.toISOString().split('T')[0];
        const toDateStr = fromDateStr; // Fetch for a single day

        console.log("Rango de fechas para API (single day):", fromDateStr);
        
        const apiKey = 'cvs569hr01qvc2murvngcvs569hr01qvc2murvo0';
        const apiUrl = `https://finnhub.io/api/v1/news?category=general&from=${fromDateStr}&to=${toDateStr}&token=${apiKey}`;
        
        console.log("URL de la API:", apiUrl);
        
        console.log("Iniciando fetch...");
        const response = await fetch(apiUrl);
        console.log("Respuesta de la API recibida:", response.status, response.statusText);
        
        if (!response.ok) {
          console.error("Error en la respuesta de la API:", response.status, response.statusText);
          throw new Error(`Error al obtener noticias: ${response.status} ${response.statusText}`);
        }
        
        console.log("Parseando respuesta JSON...");
        const data = await response.json();
        console.log("Datos recibidos:", data);
        console.log("Cantidad de noticias:", data ? data.length : 0);

        // Transformar datos de noticias a formato de eventos económicos
        if (data && data.length > 0) {
          console.log("Transformando noticias a eventos...");
          const transformedEvents = data.map(news => {
            // Determinar impacto basado en factores como la categoría
            let impact = 'low';
            let color = 'red';
            
            // Determinar impacto basado en la categoría y el título
            const keyword = news.headline.toLowerCase();
            if (keyword.includes('crisis') || 
                keyword.includes('crash') || 
                keyword.includes('surge') ||
                keyword.includes('collapse')) {
              impact = 'high';
              color = 'cyan';
            } else if (keyword.includes('increase') || 
                       keyword.includes('decrease') || 
                       keyword.includes('announce') || 
                       keyword.includes('report')) {
              impact = 'medium';
              color = 'green';
            }
            
            // Determinar instrumento financiero basado en el contenido
            let instrument = 'Global';
            if (news.related) {
              const symbols = news.related.split(',');
              if (symbols.length > 0) {
                instrument = symbols[0];
              }
            }
            
            // Formatear fecha y hora para mostrar
            const publishDate = new Date(news.datetime * 1000); // Convertir timestamp a fecha
            const displayDate = `${publishDate.getDate()} ${getMonthName(publishDate.getMonth()).substring(0, 3)}`;
            const displayTime = `${publishDate.getHours().toString().padStart(2, '0')}:${publishDate.getMinutes().toString().padStart(2, '0')}`;
            
            // Determinar si un evento ya ha pasado
            const isPast = publishDate < new Date();
            
            // Determinar si el evento es destacado
            const isHighlighted = news.category === 'economy' || news.category === 'general';
            
            return {
              description: news.headline || 'Noticia financiera',
              instrument: instrument,
              time: displayTime,
              date: displayDate,
              timestamp: `${publishDate.getHours().toString().padStart(2, '0')}:${publishDate.getMinutes().toString().padStart(2, '0')}:${publishDate.getSeconds().toString().padStart(2, '0')}`,
              actual: isPast ? news.summary.substring(0, 20) + '...' : '-',
              forecast: news.category || '-',
              previous: '-',
              impact: impact,
              color: color,
              highlighted: isHighlighted,
              isPast: isPast,
              url: news.url,
              raw: news // Mantener datos originales
            };
          });
          
          console.log("Eventos transformados:", transformedEvents.length);
          setEvents(transformedEvents);
          console.log("Estado de eventos actualizado");
        } else {
          console.log("No hay datos de la API, cargando datos de respaldo");
          // Si no hay datos, cargar datos de respaldo
          loadFallbackData();
        }
      } catch (err) {
        console.error('Error en la API de noticias financieras:', err);
        console.error('Detalles:', err.message);
        console.error('Stack:', err.stack);
        setError('No se pudieron cargar las noticias financieras: ' + err.message);
        
        console.log("Cargando datos de respaldo debido al error");
        // Cargar datos de ejemplo si falla la API
        loadFallbackData();
      } finally {
        setIsLoading(false);
        console.log("Carga finalizada, isLoading=false");
      }
    };
    
    const loadFallbackData = () => {
      console.log("CARGANDO DATOS DE RESPALDO (FALLBACK)");
      // Datos de ejemplo para mostrar si falla la API
      const dayIndex = days.indexOf(activeDay);
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + dayIndex);
      
      const fallbackEvents = [
        {
          description: 'Decisión de Tasas de Interés FED',
      instrument: 'USD',
      time: '12:00',
          date: `${targetDate.getDate()} ${getMonthName(targetDate.getMonth()).substring(0, 3)}`,
      timestamp: '00:30:23',
      actual: '-',
      forecast: '0,6%',
      previous: '0,2%',
      impact: 'high',
          color: 'cyan',
          highlighted: true,
          isPast: false
        },
        {
          description: 'Declaración de Política Monetaria BCE',
          instrument: 'EUR',
          time: '14:30',
          date: `${targetDate.getDate()} ${getMonthName(targetDate.getMonth()).substring(0, 3)}`,
          timestamp: '14:30:00',
      actual: '-',
          forecast: '0,3%',
          previous: '0,1%',
      impact: 'medium',
      color: 'green',
          highlighted: false,
          isPast: targetDate.getDate() === today.getDate() && 14 < today.getHours()
        },
        // Otros eventos de ejemplo...
      ];
      
      console.log("Estableciendo eventos de respaldo:", fallbackEvents.length);
      setEvents(fallbackEvents);
    };

    // Cargar datos al montar el componente o cambiar de día
    fetchFinancialNews();
    console.log("Inicializando intervalo para actualizaciones periódicas");
    
    // Intervalo para actualizar cada 5 minutos
    const intervalId = setInterval(() => {
      console.log("Ejecutando actualización periódica");
      fetchFinancialNews();
    }, 300000);
    
    return () => {
      console.log("Limpiando intervalo");
      clearInterval(intervalId);
    };
  }, [selectedFullDate]); // Depend on selectedFullDate

  // Effect to update selectedFullDate when activeDay (tab) changes
  useEffect(() => {
    const dayIndex = days.indexOf(activeDay);
    if (dayIndex !== -1) {
      const newSelectedDate = new Date(currentViewMonday);
      newSelectedDate.setDate(currentViewMonday.getDate() + dayIndex);
      setSelectedFullDate(newSelectedDate);
      console.log("ActiveDay changed. New SelectedFullDate:", newSelectedDate.toISOString());
    }
  }, [activeDay, currentViewMonday]);

  // Efecto para actualizar el reloj en tiempo real
  useEffect(() => {
    console.log("Configurando reloj en tiempo real para zona:", timeZone);
    const updateClock = () => {
      setCurrentTime(formatTimeForZone(timeZone));
    };
    
    // Actualizar inmediatamente y luego cada segundo
    updateClock();
    const intervalId = setInterval(updateClock, 1000);
    
    return () => clearInterval(intervalId);
  }, [timeZone]);

  // Función para obtener el nombre del mes
  const getMonthName = (monthIndex) => {
    const monthKeys = [
      'months.january', 'months.february', 'months.march', 'months.april', 
      'months.may', 'months.june', 'months.july', 'months.august', 
      'months.september', 'months.october', 'months.november', 'months.december'
    ];
    return t(monthKeys[monthIndex]);
  };

  // Calcular conteo de eventos por moneda
  const eventCountByCurrency = useMemo(() => {
    const counts = {};
    Object.keys(currencyFilters).forEach(currency => {
      counts[currency] = events.filter(event => event.instrument === currency).length;
    });
    return counts;
  }, [events, currencyFilters]);

  // Filtrar eventos según criterios
  const filteredEvents = events.filter(event => {
    // Filtrar por impacto
    const impactMatches = 
      (impactFilters.alto && event.impact === 'high') ||
      (impactFilters.medio && event.impact === 'medium') ||
      (impactFilters.bajo && event.impact === 'low') ||
      (impactFilters.feriados && event.impact === 'holiday');
    
    // Si ningún filtro de impacto está activo, mostrar todos
    const showAllImpacts = !impactFilters.alto && !impactFilters.medio && !impactFilters.bajo && !impactFilters.feriados;
    
    // Filtro de moneda
    const currencyMatches = currencyFilters[event.instrument] || false;
    
    // Si ningún filtro de moneda está activo, mostrar todos
    const showAllCurrencies = !Object.values(currencyFilters).some(v => v);
    
    // Filtro de noticias pasadas
    const pastFilter = !visibilityFilters.ocultarNoticias || !event.isPast;
    
    // Filtro de eventos restringidos
    const restrictedFilter = !visibilityFilters.mostrarRestringidos || event.highlighted;
    
    return (impactMatches || showAllImpacts) && (currencyMatches || showAllCurrencies) && pastFilter && restrictedFilter;
  });

  console.log("Eventos filtrados:", filteredEvents.length);

  // Funciones de utilidad para manejo de filtros y UI
  const toggleImpactFilter = (filter) => {
    console.log("Toggling filtro de impacto:", filter);
    setImpactFilters({
      ...impactFilters,
      [filter]: !impactFilters[filter]
    });
  };

  const toggleVisibilityFilter = (filter) => {
    console.log("Toggling filtro de visibilidad:", filter);
    setVisibilityFilters({
      ...visibilityFilters,
      [filter]: !visibilityFilters[filter]
    });
  };

  const toggleCurrencyFilter = (currency) => {
    console.log("Toggling filtro de moneda:", currency);
    setCurrencyFilters({
      ...currencyFilters,
      [currency]: !currencyFilters[currency]
    });
  };

  const selectAllCurrencies = () => {
    const newFilters = {};
    Object.keys(currencyFilters).forEach(currency => {
      newFilters[currency] = true;
    });
    setCurrencyFilters(newFilters);
  };

  const selectNoCurrencies = () => {
    const newFilters = {};
    Object.keys(currencyFilters).forEach(currency => {
      newFilters[currency] = false;
    });
    setCurrencyFilters(newFilters);
  };

  const getImpactColor = (color) => {
    switch (color) {
      case 'cyan':
        return 'bg-cyan-500';
      case 'green':
        return 'bg-green-500';
      case 'red':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Función para obtener la bandera del país
  const getCountryFlag = (instrument) => {
    // Mapeo de instrumentos a códigos de país
    const countryMap = {
      'USD': 'us',
      'EUR': 'eu',
      'GBP': 'gb',
      'JPY': 'jp',
      'AUD': 'au',
      'CAD': 'ca',
      'CHF': 'ch',
      'NZD': 'nz',
      'CNY': 'cn',
      'MXN': 'mx',
      'BRL': 'br',
      'INR': 'in',
      'RUB': 'ru',
      'KRW': 'kr',
      'TRY': 'tr',
      'ZAR': 'za',
      'SGD': 'sg',
      'HKD': 'hk',
      'Global': 'global'
    };
    
    const code = countryMap[instrument] || 'global';
    return `/flags/${code}.png`;
  };

  // Función para añadir un evento al calendario
  const addEventToCalendar = (event) => {
    try {
      console.log("Añadiendo evento al calendario:", event);
      const eventDate = new Date(`${event.date} ${event.time}`);
      const endTime = new Date(eventDate.getTime() + 60 * 60 * 1000); // 1 hora más
      
      const calendarEvent = {
        title: event.description,
        start: eventDate.toISOString(),
        end: endTime.toISOString(),
        description: `Impacto: ${event.impact}, Pronóstico: ${event.forecast}, Previo: ${event.previous}`
      };
      
      // Abrir Google Calendar con los datos del evento
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(calendarEvent.title)}&dates=${calendarEvent.start.replace(/[-:]/g, '').replace('.000', '')}/${calendarEvent.end.replace(/[-:]/g, '').replace('.000', '')}&details=${encodeURIComponent(calendarEvent.description)}`;
      
      console.log("Abriendo URL de Calendar:", url);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error al añadir evento al calendario:', error);
    }
  };

  // Función para cambiar la zona horaria
  const changeTimeZone = (newTimeZone) => {
    console.log("Cambiando zona horaria a:", newTimeZone);
    setTimeZone(newTimeZone);
    setCurrentTime(formatTimeForZone(newTimeZone)); // Actualizar inmediatamente la hora mostrada
    setShowTimeZoneMenu(false);
  };

  console.log("Render del componente Noticias");

  return (
    <div className="flex flex-col border border-[#333] rounded-3xl bg-[#232323] text-white p-2 mobile-p-3 sm:p-4">
      {/* Days of the week tabs - Scrollable on mobile */}
      <div className="flex flex-col space-y-2">
        {isWeekend && (
          <div className="text-amber-500 text-sm text-center bg-amber-500/10 py-2 px-4 rounded-lg">
            {t('marketClosed')}
          </div>
        )}
        <div className="flex space-x-1 xs:space-x-2 overflow-x-auto pb-2 scrollbar-thin">
        {days.map((day) => (
          <button
            key={day}
              className={`px-3 py-1.5 text-sm xs:px-4 xs:py-2 sm:text-base sm:px-8 md:px-12 sm:py-3 rounded-full whitespace-nowrap focus:outline-none transition-colors
                ${isWeekend 
                  ? 'bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] text-gray-500 cursor-not-allowed opacity-50' 
                  : activeDay === day 
                ? 'bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-cyan-500 text-white' 
                    : 'bg-gradient-to-br from-[#232323] to-[#2d2d2d] border border-[#333] text-gray-300 hover:text-gray-100 hover:border-cyan-400'
            }`}
              onClick={() => !isWeekend && setActiveDay(day)}
              disabled={isWeekend}
          >
            {day}
          </button>
        ))}
        </div>
      </div>

      {/* Date selector with market closed message */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-3">
        <div className="p-2 text-sm xs:text-base sm:text-xl bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-lg sm:rounded-full border border-[#333] text-white text-center sm:text-left mr-0 sm:mr-2">
          {isWeekend ? (
            <span className="text-gray-400">{t('marketClosed')}</span>
          ) : (
            activeDay === days[initialDayIndexResolved] ? t('today') : activeDay
          )}
        </div>
        <div className="p-2 text-sm xs:text-base sm:text-xl bg-transparent text-white text-center sm:text-left mr-0 sm:mr-auto whitespace-nowrap">
          {getMonthName(selectedFullDate.getMonth())} <span className="text-[#a0a0a0]">{selectedFullDate.getDate()}</span>, {selectedFullDate.getFullYear()}
          {isWeekend && (
            <div className="text-xs text-amber-500 mt-1">
              {t('showingLastFriday')} ({getLastFriday().getDate()} {getMonthName(getLastFriday().getMonth())})
            </div>
          )}
        </div>

        <div className="relative w-full sm:w-auto">
          <div 
            className="flex items-center p-2 sm:p-3 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-lg sm:rounded-full border border-[#333] text-white w-full justify-between cursor-pointer"
            onClick={() => setShowTimeZoneMenu(!showTimeZoneMenu)}
          >
            <div className="flex items-center overflow-hidden">
            <img 
              src="/pin.png" 
              alt="Location Pin" 
                className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 mr-1.5 sm:mr-2 flex-shrink-0"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='white' d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E";
              }}
            />
              <span className="mr-1 sm:mr-2 text-xs xs:text-sm sm:text-xl truncate">
                {currentTime} {timeZone.split('/').pop().replace('_', ' ')}
              </span>
            </div>
            <ChevronDown size={16} className={`transform transition-transform duration-200 flex-shrink-0 ${showTimeZoneMenu ? 'rotate-180' : ''}`} />
          </div>
          
            {/* Menú de zonas horarias */}
            {showTimeZoneMenu && (
              <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-1 z-20 bg-[#2d2d2d] border border-[#444] rounded-lg shadow-lg w-full sm:w-60 md:w-64 max-h-52 sm:max-h-60 overflow-y-auto scrollbar-thin">
                {timeZones.map((zone) => (
                  <div 
                    key={zone} 
                    className="p-2 hover:bg-[#3a3a3a] cursor-pointer text-xs sm:text-sm flex justify-between items-center"
                    onClick={() => changeTimeZone(zone)}
                  >
                    <span className="truncate">{zone.split('/').pop().replace('_', ' ')}</span>
                    <span className="text-gray-400 ml-2 whitespace-nowrap">{formatTimeForZone(zone)}</span>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>

      {/* Filters - Stack on mobile */}
      <div className="flex flex-col mb-4 sm:mb-6 gap-3 sm:gap-4">
        {/* Currency filter */}
        <div>
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <h3 className="text-gray-400 text-base sm:text-xl">{t('filters.currencyCountry')}</h3>
            <div className="flex gap-2">
              <button
                onClick={selectAllCurrencies}
                className="px-2 py-1 text-xs sm:text-sm bg-[#2d2d2d] hover:bg-[#3a3a3a] text-cyan-400 rounded-md border border-[#444] transition-colors"
              >
                {t('filters.all')}
              </button>
              <button
                onClick={selectNoCurrencies}
                className="px-2 py-1 text-xs sm:text-sm bg-[#2d2d2d] hover:bg-[#3a3a3a] text-cyan-400 rounded-md border border-[#444] transition-colors"
              >
                {t('filters.none')}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
            {Object.keys(currencyFilters).map(currency => (
              <label 
                key={currency}
                className="flex items-center space-x-1 sm:space-x-1.5 cursor-pointer text-xs sm:text-sm bg-[#2d2d2d] hover:bg-[#3a3a3a] rounded-lg p-1.5 sm:p-2 border border-[#444] transition-all"
              >
                <input 
                  type="checkbox" 
                  className="form-checkbox h-3 w-3 sm:h-3.5 sm:w-3.5 text-cyan-500 rounded bg-[#333] border-[#444] focus:ring-cyan-500"
                  checked={currencyFilters[currency]}
                  onChange={() => toggleCurrencyFilter(currency)}
                />
                <img 
                  src={getCountryFlag(currency)} 
                  alt={currency} 
                  className="w-4 h-3 sm:w-5 sm:h-4 rounded object-contain"
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 16'%3E%3Crect width='24' height='16' fill='%233C3B6E'/%3E%3C/svg%3E";
                  }}
                />
                <span className="flex items-center">
                  <span className={currencyFilters[currency] ? 'text-white' : 'text-gray-500'}>{currency}</span>
                  {eventCountByCurrency[currency] > 0 && (
                    <span className="ml-1 text-[10px] sm:text-xs text-gray-400">({eventCountByCurrency[currency]})</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Impact filter */}
        <div>
          <h3 className="text-gray-400 mb-1.5 sm:mb-2 text-base sm:text-xl">{t('filters.impact')}</h3>
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-x-3 sm:gap-y-1.5">
            <label className="flex items-center space-x-1.5 sm:space-x-2 cursor-pointer text-sm sm:text-base">
              <input 
                type="checkbox" 
                className="form-checkbox h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-500 rounded bg-[#333] border-[#444] focus:ring-cyan-500"
                checked={impactFilters.feriados}
                onChange={() => toggleImpactFilter('feriados')}
              />
              <span>{t('filters.holidays')}</span>
            </label>
            <label className="flex items-center space-x-1.5 sm:space-x-2 cursor-pointer text-sm sm:text-base">
              <input 
                type="checkbox" 
                className="form-checkbox h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-500 rounded bg-[#333] border-[#444] focus:ring-cyan-500"
                checked={impactFilters.bajo}
                onChange={() => toggleImpactFilter('bajo')}
              />
              <span>{t('filters.low')}</span>
            </label>
            <label className="flex items-center space-x-1.5 sm:space-x-2 cursor-pointer text-sm sm:text-base">
              <input 
                type="checkbox" 
                className="form-checkbox h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-500 rounded bg-[#333] border-[#444] focus:ring-cyan-500"
                checked={impactFilters.medio}
                onChange={() => toggleImpactFilter('medio')}
              />
              <span>{t('filters.medium')}</span>
            </label>
            <label className="flex items-center space-x-1.5 sm:space-x-2 cursor-pointer text-sm sm:text-base">
              <input 
                type="checkbox" 
                className="form-checkbox h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-500 rounded bg-[#333] border-[#444] focus:ring-cyan-500"
                checked={impactFilters.alto}
                onChange={() => toggleImpactFilter('alto')}
              />
              <span>{t('filters.high')}</span>
            </label>
          </div>
        </div>

        {/* Visibility filter */}
        <div>
          <h3 className="text-gray-400 mb-1.5 sm:mb-2 text-base sm:text-xl">{t('filters.visibility')}</h3>
          <div className="flex flex-col space-y-1.5 sm:space-y-0 sm:flex-row sm:space-x-3">
            <label className="flex items-center space-x-1.5 sm:space-x-2 cursor-pointer text-sm sm:text-base">
              <input 
                type="checkbox" 
                className="form-checkbox h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-500 rounded bg-[#333] border-[#444] focus:ring-cyan-500"
                checked={visibilityFilters.ocultarNoticias}
                onChange={() => toggleVisibilityFilter('ocultarNoticias')}
              />
              <span>{t('filters.hidePastNews')}</span>
            </label>
            <label className="flex items-center space-x-1.5 sm:space-x-2 cursor-pointer text-sm sm:text-base">
              <input 
                type="checkbox" 
                className="form-checkbox h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-500 rounded bg-[#333] border-[#444] focus:ring-cyan-500"
                checked={visibilityFilters.mostrarRestringidos}
                onChange={() => toggleVisibilityFilter('mostrarRestringidos')}
              />
              <span>{t('filters.showRestrictedOnly')}</span>
            </label>
          </div>
        </div>
      </div>

      {/* Events table - Card view on mobile, table on desktop */}
      <div className="bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-xl border border-[#333]">
        <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
        {isLoading ? (
            <div className="p-2 xs:p-3 sm:p-4 md:p-6 flex justify-center items-center h-48 sm:h-64">
              <Loader size={32} smSize={40} className="animate-spin text-cyan-500" />
          </div>
        ) : error ? (
            <div className="p-2 xs:p-3 sm:p-4 md:p-6 flex flex-col justify-center items-center h-48 sm:h-64 text-center">
              <AlertTriangle size={24} smSize={30} className="mr-0 mb-2 sm:mr-2 sm:mb-0 text-red-400" />
              <span className="text-red-400 text-sm sm:text-base">{t('errors.loadingError')}</span>
            </div>
        ) : filteredEvents.length === 0 ? (
            <div className="p-2 xs:p-3 sm:p-4 md:p-6 flex justify-center items-center h-48 sm:h-64">
              <div className="text-gray-400 text-center text-sm sm:text-base">
                {t('errors.noEvents')}
            </div>
          </div>
        ) : (
          <>
        {/* Desktop Table (hidden on mobile) */}
              <div className="hidden md:block relative">
          <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-[#2d2d2d] shadow-lg">
              <tr className="text-left border-b border-gray-700">
                      <th className="p-6 font-medium text-sm lg:text-base whitespace-nowrap">{t('table.description')}</th>
                      <th className="p-6 font-medium text-sm lg:text-base whitespace-nowrap">{t('table.instrument')}</th>
                      <th className="p-6 font-medium text-sm lg:text-base whitespace-nowrap">{t('table.date')}</th>
                      <th className="p-6 font-medium text-sm lg:text-base whitespace-nowrap">{t('table.actual')}</th>
                      <th className="p-6 font-medium text-sm lg:text-base whitespace-nowrap">{t('table.forecast')}</th>
                      <th className="p-6 font-medium text-sm lg:text-base whitespace-nowrap">{t('table.previous')}</th>
                      <th className="p-6 font-medium text-sm lg:text-base whitespace-nowrap">{t('table.action')}</th>
              </tr>
            </thead>
            <tbody>
                  {filteredEvents.map((event, index) => (
                <tr 
                  key={index}
                        className={`border-b border-gray-800 hover:bg-opacity-5 hover:bg-gray-700 ${event.highlighted ? 'bg-[#3d2c2e]' : ''}`}
                >
                        <td className="p-6 text-sm lg:text-base">
                    <div className="flex flex-col">
                      <div className="flex items-center">
                              <div className={`w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full mr-2 lg:mr-3 flex-shrink-0 ${getImpactColor(event.color)}`}></div>
                            <span className="line-clamp-2">{event.description}</span>
                      </div>
                      {event.highlighted && (
                              <div className="flex items-center text-red-500 text-xs mt-1 ml-4 lg:ml-6">
                                <AlertTriangle className="h-3.5 w-3.5 lg:h-4 lg:w-4 mr-1 flex-shrink-0" />
                          {t('table.restrictedEvent')}
                        </div>
                      )}
                    </div>
                  </td>

                        <td className="p-6 text-sm lg:text-base">
                    <div className="flex items-center">
                            <div className="w-6 h-4 lg:w-8 lg:h-5 mr-1.5 lg:mr-2 flex items-center justify-center flex-shrink-0">
                            <img 
                              src={getCountryFlag(event.instrument)} 
                              alt={event.instrument} 
                                className="max-w-full max-h-full rounded object-contain"
                          onError={(e) => {
                            e.target.onerror = null; 
                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 16'%3E%3Crect width='24' height='16' fill='%233C3B6E'/%3E%3C/svg%3E";
                          }}
                        />
                      </div>
                            <span className="whitespace-nowrap">{event.instrument}</span>
                    </div>
                  </td>
                        <td className="p-6 text-sm lg:text-base whitespace-nowrap">
                    <div>
                      <div>{event.time} {event.date}</div>
                          {!event.isPast && (
                        <div className="text-xs text-gray-400 flex items-center">
                                <Clock className="w-2.5 h-2.5 lg:w-3 lg:h-3 mr-1 flex-shrink-0" />
                          {event.timestamp}
                        </div>
                      )}
                          {event.isPast && (
                        <div className="text-xs text-cyan-500 mt-1">{t('table.expired')}</div>
                      )}
                    </div>
                  </td>
                        <td className="p-6 text-sm lg:text-base whitespace-nowrap">{t('table.actual')}: {event.actual}</td>
                        <td className="p-6 text-sm lg:text-base whitespace-nowrap">{t('table.forecast')}: {event.forecast}</td>
                        <td className="p-6 text-sm lg:text-base whitespace-nowrap">{t('table.previous')}: {event.previous}</td>
                        <td className="p-6 text-sm lg:text-base">
                        <button 
                            className="p-1.5 lg:p-2 bg-transparent hover:bg-[#333] rounded-full transition-colors focus:outline-none"
                          onClick={() => addEventToCalendar(event)}
                          title={t('table.addToCalendar')}
                        >
                            <Calendar className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View (hidden on desktop) */}
              <div className="md:hidden space-y-3 sm:space-y-4">
              {filteredEvents.map((event, index) => (
            <div 
              key={index} 
                    className={`p-3 rounded-lg border border-gray-800 hover:border-gray-700 ${event.highlighted ? 'bg-[#3d2c2e]' : 'bg-[#2b2b2b]'}`}
                >
                    <div className="flex justify-between items-start mb-2 sm:mb-3">
                      <div className="flex items-start mr-2">
                        <div className={`w-2.5 h-2.5 rounded-full mr-2 mt-1 flex-shrink-0 ${getImpactColor(event.color)}`}></div>
                        <span className="font-medium text-sm leading-snug line-clamp-3">{event.description}</span>
                </div>
                    <button 
                        className="p-1 bg-transparent hover:bg-[#333] rounded-full transition-colors flex-shrink-0 focus:outline-none"
                      onClick={() => addEventToCalendar(event)}
                      title="Añadir al calendario"
                    >
                        <Calendar className="h-4 w-4 text-gray-400" />
                </button>
              </div>

              {event.highlighted && (
                      <div className="flex items-center text-red-500 text-xs mb-2 ml-4.5">
                        <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />
                  Evento Restringido
                </div>
              )}

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 sm:gap-y-2 text-xs sm:text-sm pl-4.5">
                <div>
                        <div className="text-gray-400">{t('table.actual')}</div>
                        <div className="whitespace-nowrap">{event.actual}</div>
                    </div>

                      <div>
                        <div className="text-gray-400">{t('table.forecast')}</div>
                        <div className="whitespace-nowrap">{event.forecast}</div>
                </div>

                <div>
                        <div className="text-gray-400">{t('table.previous')}</div>
                        <div className="whitespace-nowrap">{event.previous}</div>
                      </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
};

export default Noticias;