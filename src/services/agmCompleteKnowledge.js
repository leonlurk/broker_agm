// ========================================
// BASE DE CONOCIMIENTO COMPLETA DE AGM
// ========================================
// Información exhaustiva de TODAS las características de la plataforma

export const AGM_COMPLETE_KNOWLEDGE = {
  // HERRAMIENTAS Y CALCULADORAS
  tools: {
    pipCalculator: {
      name: "Calculadora de Pips",
      location: "Menú principal > Herramientas > Calculadora de Pips",
      description: "Herramienta avanzada de cálculo para trading",
      features: [
        "Calculadora de valor de pip para 60+ pares de forex",
        "Cálculo para acciones (AAPL, MSFT, GOOGL, AMZN, TSLA, etc.)",
        "Criptomonedas: BTC, ETH, XRP, LTC, ADA, SOL, DOGE, DOT",
        "Metales: Oro (XAU/USD), Plata (XAG/USD), Platino, Paladio, Cobre",
        "Índices: S&P 500, Dow Jones, NASDAQ, DAX, FTSE, Nikkei",
        "Calculadora de tamaño de posición basada en riesgo",
        "Sistema de favoritos para guardar instrumentos frecuentes",
        "Soporte para múltiples divisas de cuenta",
        "Tamaños de lote predefinidos (0.01 a 10.0)",
        "Motor de tipo de cambio integrado para 100+ pares"
      ],
      howToUse: "Ve a Herramientas, selecciona Calculadora de Pips, elige tu instrumento, ingresa el tamaño del lote y tu divisa de cuenta"
    },
    
    economicCalendar: {
      name: "Calendario Económico",
      location: "Menú principal > Noticias",
      description: "Calendario de eventos económicos importantes",
      features: [
        "Eventos económicos semanales",
        "Noticias del mercado en tiempo real",
        "Detección automática de fin de semana",
        "Eventos organizados por día de trading",
        "Soporte multiidioma"
      ]
    },
    
    accountAnalytics: {
      name: "Análisis de Cuenta",
      location: "Cuentas de Trading > Seleccionar cuenta > Ver análisis",
      description: "Análisis detallado del rendimiento de tu cuenta",
      features: [
        "Gráficos de progresión de balance",
        "Curvas de equity",
        "Estadísticas de rendimiento (ganancia, pérdida, win rate, drawdown)",
        "Métricas de riesgo",
        "Análisis comparativo",
        "Exportación de datos"
      ]
    },
    
    mt5Download: {
      name: "Descargas MT5",
      location: "Menú principal > Descargas",
      description: "Centro de descargas de MetaTrader 5",
      platforms: [
        "Windows desktop",
        "Mac desktop", 
        "Android móvil",
        "iOS móvil",
        "WebTrader (sin descarga)"
      ]
    }
  },

  // SISTEMAS DE TRADING
  tradingSystems: {
    copyTrading: {
      name: "Copy Trading",
      minInvestment: "$100 USD",
      location: "Menú principal > Inversor / Gestor",
      features: {
        investor: [
          "Explorador de traders maestros",
          "Filtros avanzados (rendimiento, riesgo, activos, AUM)",
          "Perfiles detallados con gráficos",
          "Gestión de suscripciones",
          "Análisis de portafolio",
          "Sistema de seguimiento de traders"
        ],
        manager: [
          "Gestión de perfil de trader",
          "Configuración de estrategias",
          "Análisis de seguidores",
          "Gestión de comisiones (20% estándar)",
          "Reportes de rendimiento",
          "Comunicación con inversores"
        ]
      },
      commission: "20% de las ganancias",
      availableTraders: "50+ traders verificados"
    },
    
    pammSystem: {
      name: "Sistema PAMM",
      minInvestment: "$100 USD",
      location: "Menú principal > PAMM",
      features: [
        "Explorador de fondos PAMM",
        "Filtros y búsqueda avanzada",
        "Gestión de inversiones",
        "Seguimiento de rendimiento",
        "Comparación de fondos",
        "Creación y gestión de fondos (para gestores)",
        "Configuración de fees",
        "Marketing de fondos"
      ],
      managerCommission: "20-30% de ganancias",
      lockPeriod: "30 días mínimo",
      maxDrawdown: "30% protección"
    }
  },

  // CUENTAS Y FINANZAS
  accounts: {
    demo: {
      name: "Cuenta Demo",
      cost: "Gratis",
      virtualBalance: "Configurable hasta $1,000,000",
      features: [
        "Sin límite de tiempo",
        "Todos los instrumentos disponibles",
        "Datos de mercado en tiempo real",
        "Sin riesgo real",
        "Práctica ilimitada"
      ],
      howToCreate: "Ve a Cuentas de Trading > Nueva Cuenta > Selecciona Demo"
    },
    
    real: {
      name: "Cuenta Real",
      minDeposit: "$50 USD",
      maxInitialDeposit: "$1,000,000",
      leverage: {
        forex: "Hasta 1:200",
        crypto: "Hasta 1:20",
        indices: "Hasta 1:100",
        commodities: "Hasta 1:100"
      },
      spreads: "Desde 0.8 pips",
      howToCreate: "Ve a Cuentas de Trading > Nueva Cuenta > Selecciona Real > Deposita mínimo $50"
    },
    
    wallet: {
      name: "Wallet",
      location: "Menú principal > Wallet",
      features: [
        "Gestión de balance interno",
        "Depósitos y retiros",
        "Historial de transacciones",
        "Configuración de métodos de pago",
        "Seguimiento de estado de transacciones"
      ]
    }
  },

  // MÉTODOS DE PAGO
  paymentMethods: {
    deposits: {
      crypto: {
        currencies: ["Bitcoin", "Ethereum", "USDT", "USDC"],
        fee: "0%",
        processingTime: "Instantáneo",
        minimum: "$50"
      },
      bankTransfer: {
        fee: "0%",
        processingTime: "1-3 días hábiles",
        minimum: "$50"
      },
      cards: {
        types: ["Visa", "Mastercard"],
        fee: "2.5%",
        processingTime: "Instantáneo",
        minimum: "$50"
      }
    },
    
    withdrawals: {
      requirements: "KYC aprobado obligatorio",
      minimum: "$50",
      processingTime: "24-72 horas hábiles",
      fees: {
        bankTransfer: "$25",
        cards: "2%",
        crypto: "Fee de red blockchain"
      },
      methods: "Mismo método usado para depositar"
    }
  },

  // VERIFICACIÓN Y SEGURIDAD
  verification: {
    kyc: {
      name: "Verificación KYC",
      location: "Configuración > Verificación KYC",
      requiredDocuments: [
        "Documento de identidad (ID/Pasaporte)",
        "Comprobante de domicilio (menos de 3 meses)",
        "Selfie con documento"
      ],
      processingTime: "24-48 horas hábiles",
      states: ["pending", "under_review", "approved", "rejected"],
      benefits: "Habilita retiros y acceso completo a la plataforma"
    },
    
    security: {
      twoFactorAuth: {
        methods: ["SMS", "Email", "Google Authenticator"],
        location: "Configuración > Seguridad > 2FA"
      },
      encryption: "SSL 256-bit",
      fundsSecurity: "Fondos segregados en bancos tier 1",
      compliance: "Cumplimiento AML/KYC"
    }
  },

  // COMPETENCIAS Y GAMIFICACIÓN
  competitions: {
    name: "Competencias de Trading",
    location: "Menú principal > Competencias",
    types: [
      "100k Challenge",
      "Competencias mensuales",
      "Competencias por categoría (Forex, Crypto, General)"
    ],
    prizes: "$5,000 - $10,000 en premios",
    requirements: "Cuenta real activa",
    features: [
      "Leaderboard en tiempo real",
      "Certificados de finalización",
      "Sistema de medallas (oro, plata, bronce)",
      "Gráficos de rendimiento",
      "Rankings internacionales"
    ]
  },

  // PROGRAMA DE AFILIADOS
  affiliates: {
    name: "Programa de Afiliados",
    location: "Menú principal > Afiliados",
    commission: {
      revenueShare: "25% lifetime",
      cpa: "Hasta $800 por referido",
      secondTier: "5% segundo nivel"
    },
    minimumPayout: "$100",
    paymentFrequency: "Mensual",
    features: [
      "Sistema de referidos multi-nivel",
      "Tracking de comisiones en tiempo real",
      "Análisis de referidos",
      "Historial de pagos",
      "Enlaces y materiales promocionales",
      "Estadísticas detalladas"
    ]
  },

  // INSTRUMENTOS DE TRADING
  instruments: {
    forex: {
      pairs: "28 pares principales, menores y exóticos",
      leverage: "Hasta 1:200",
      spreads: "Desde 0.8 pips",
      tradingHours: "24/5 (Lunes-Viernes)"
    },
    cryptocurrencies: {
      available: ["BTC", "ETH", "XRP", "LTC", "ADA", "SOL", "DOGE", "DOT", "+10 altcoins"],
      leverage: "Hasta 1:20",
      tradingHours: "24/7",
      spreads: "Variables"
    },
    indices: {
      available: ["US30", "NAS100", "S&P500", "DAX", "FTSE", "Nikkei"],
      leverage: "Hasta 1:100",
      tradingHours: "Según horario del mercado"
    },
    commodities: {
      available: ["Oro", "Plata", "Petróleo WTI", "Petróleo Brent"],
      leverage: "Hasta 1:100",
      tradingHours: "Según mercado"
    },
    stocks: {
      available: ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA"],
      leverage: "Hasta 1:20",
      tradingHours: "Horario de NYSE/NASDAQ"
    }
  },

  // SOPORTE Y COMUNICACIÓN
  support: {
    chatBot: {
      name: "Alpha AI Assistant",
      availability: "24/7",
      features: [
        "Respuestas instantáneas con IA",
        "Escalación a soporte humano",
        "Historial de conversaciones",
        "Sistema de feedback",
        "Soporte multiidioma"
      ]
    },
    humanSupport: {
      availability: "24/5 (Lunes-Viernes)",
      responseTime: "2-4 horas promedio",
      email: "support@alphaglobalmarket.io",
      languages: ["Español", "Inglés"]
    }
  },

  // CARACTERÍSTICAS ADICIONALES
  additionalFeatures: {
    notifications: {
      types: ["Trading", "Cuenta", "Sistema", "Promociones"],
      delivery: ["In-app", "Email opcional"],
      customization: "Configurable en ajustes"
    },
    operationsHistory: {
      location: "Cuentas > Historial de operaciones",
      features: [
        "Registro completo de transacciones",
        "Filtros avanzados",
        "Búsqueda",
        "Exportación de datos",
        "Seguimiento de ganancias"
      ]
    },
    certificates: {
      types: ["Certificados de challenge", "Certificados de pago"],
      location: "Generados automáticamente al completar challenges"
    },
    mobileApp: {
      platforms: ["iOS", "Android"],
      features: "Todas las funciones de la versión web",
      responsive: "Diseño 100% adaptativo"
    }
  },

  // UBICACIONES EN EL MENÚ
  menuLocations: {
    mainMenu: [
      "Dashboard (Home)",
      "Cuentas",
      "Wallet",
      "Inversor",
      "Gestor", 
      "PAMM",
      "Afiliados",
      "Noticias",
      "Competencias",
      "Descargas",
      "Herramientas > Calculadora de Pips",
      "Configuración"
    ],
    settings: [
      "Perfil",
      "Verificación KYC",
      "Seguridad",
      "Métodos de pago",
      "Notificaciones",
      "Idioma"
    ]
  }
};

// Función para buscar información específica
export function searchAGMFeature(query) {
  const lowerQuery = query.toLowerCase();
  const results = [];
  
  // Buscar en todas las secciones
  function searchObject(obj, path = '') {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        if (value.toLowerCase().includes(lowerQuery)) {
          results.push({ path, key, value });
        }
      } else if (typeof value === 'object' && value !== null) {
        searchObject(value, path ? `${path}.${key}` : key);
      }
    }
  }
  
  searchObject(AGM_COMPLETE_KNOWLEDGE);
  return results;
}

export default AGM_COMPLETE_KNOWLEDGE;