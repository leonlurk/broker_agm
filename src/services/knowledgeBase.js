// Base de conocimientos completa de AGM
export const AGM_KNOWLEDGE_BASE = {
  // Información general de la plataforma
  platform: {
    name: "Alpha Global Market (AGM)",
    description: "Plataforma de trading profesional con más de 100 instrumentos financieros",
    features: [
      "Trading de Forex, índices, materias primas y criptomonedas",
      "Sistema PAMM para gestión de inversiones",
      "Copy Trading automatizado",
      "Cuentas demo ilimitadas",
      "Apalancamiento hasta 1:200",
      "Spreads competitivos desde 0.8 pips",
      "Ejecución instantánea de órdenes",
      "MetaTrader 5 como plataforma principal"
    ],
    support: {
      email: "soporte@alphaglobalmarket.com",
      hours: "24/5 Lunes-Viernes",
      languages: ["Español", "Inglés", "Portugués"]
    }
  },

  // Trading e instrumentos
  trading: {
    instruments: {
      forex: {
        description: "Pares de divisas principales, menores y exóticos",
        major_pairs: ["EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", "USD/CAD", "NZD/USD"],
        spreads: {
          "EUR/USD": "0.8 pips",
          "GBP/USD": "1.2 pips",
          "USD/JPY": "1.0 pips"
        },
        leverage: "Hasta 1:200 para cuentas profesionales",
        trading_hours: "24 horas, 5 días a la semana",
        minimum_lot: "0.01 lotes"
      },
      crypto: {
        description: "Principales criptomonedas contra USD",
        available: ["BTC/USD", "ETH/USD", "XRP/USD", "LTC/USD", "BNB/USD", "ADA/USD"],
        leverage: "Hasta 1:20",
        trading_hours: "24/7",
        minimum_trade: "0.01 lotes"
      },
      indices: {
        description: "Índices bursátiles globales",
        available: ["US30", "US500", "NAS100", "GER40", "UK100", "ESP35", "FRA40"],
        leverage: "Hasta 1:100",
        trading_hours: "Según horario de cada mercado"
      },
      commodities: {
        description: "Materias primas y metales preciosos",
        metals: ["XAU/USD (Oro)", "XAG/USD (Plata)", "XPT/USD (Platino)"],
        energy: ["CL/USD (Petróleo WTI)", "NG/USD (Gas Natural)"],
        leverage: "Hasta 1:100",
        minimum_trade: "0.01 lotes"
      }
    },
    platforms: {
      mt5: {
        description: "MetaTrader 5 - Plataforma profesional de trading",
        versions: ["Windows", "Mac", "iOS", "Android", "WebTrader"],
        features: [
          "21 marcos temporales",
          "Más de 80 indicadores técnicos",
          "Trading algorítmico (Expert Advisors)",
          "Profundidad de mercado",
          "Calendario económico integrado",
          "Trading con un click",
          "Gestión avanzada de órdenes"
        ],
        download_links: {
          windows: "https://download.mql5.com/cdn/web/agm/mt5setup.exe",
          mac: "https://download.mql5.com/cdn/web/agm/mt5mac.dmg",
          android: "https://play.google.com/store/apps/details?id=net.metaquotes.metatrader5",
          ios: "https://apps.apple.com/app/metatrader-5/id413251709"
        }
      }
    }
  },

  // Tipos de cuenta y requisitos
  accounts: {
    types: {
      demo: {
        description: "Cuenta de práctica con dinero virtual",
        initial_balance: "$10,000 USD virtuales",
        duration: "Ilimitada",
        reset_available: "Sí, mensualmente",
        features: [
          "Acceso completo a todos los instrumentos",
          "Condiciones reales de mercado",
          "Sin riesgo de pérdida real",
          "Ideal para practicar estrategias"
        ],
        how_to_create: [
          "1. Ir a 'Cuentas de Trading'",
          "2. Click en 'Nueva Cuenta'",
          "3. Seleccionar 'Cuenta Demo'",
          "4. Elegir plataforma MT5",
          "5. Configurar apalancamiento deseado",
          "6. Crear cuenta"
        ]
      },
      real: {
        description: "Cuenta real para trading con dinero real",
        minimum_deposit: "$50 USD",
        account_types: {
          standard: {
            minimum: "$50",
            spreads: "Desde 1.2 pips",
            commission: "Sin comisión",
            leverage: "Hasta 1:100"
          },
          pro: {
            minimum: "$500",
            spreads: "Desde 0.8 pips",
            commission: "$7 por lote",
            leverage: "Hasta 1:200"
          },
          vip: {
            minimum: "$10,000",
            spreads: "Desde 0.5 pips",
            commission: "$5 por lote",
            leverage: "Hasta 1:200",
            benefits: ["Gestor de cuenta personal", "Análisis exclusivos", "Webinars VIP"]
          }
        },
        requirements: [
          "Verificación KYC completa",
          "Mayor de 18 años",
          "Documento de identidad válido",
          "Comprobante de domicilio"
        ]
      }
    },
    verification: {
      kyc: {
        description: "Proceso de verificación Know Your Customer",
        required_documents: [
          "Documento de identidad (pasaporte, DNI, licencia)",
          "Comprobante de domicilio (no mayor a 3 meses)",
          "Selfie sosteniendo el documento"
        ],
        process: [
          "1. Ir a Configuración > Verificación KYC",
          "2. Subir foto clara del documento de identidad",
          "3. Subir comprobante de domicilio reciente",
          "4. Tomar selfie con el documento",
          "5. Enviar para revisión"
        ],
        processing_time: "24-48 horas hábiles",
        status_types: {
          pending: "Documentos enviados, en revisión",
          approved: "Verificación completada exitosamente",
          rejected: "Documentos rechazados, revisar motivos",
          not_started: "Verificación no iniciada"
        }
      }
    }
  },

  // Depósitos y retiros
  financial: {
    deposits: {
      minimum: "$50 USD",
      maximum: "$50,000 USD por transacción",
      methods: {
        bank_transfer: {
          name: "Transferencia Bancaria",
          processing_time: "1-3 días hábiles",
          fees: "Sin comisión por parte de AGM",
          minimum: "$100",
          instructions: [
            "1. Ir a Wallet > Depositar",
            "2. Seleccionar 'Transferencia Bancaria'",
            "3. Ingresar monto a depositar",
            "4. Recibir datos bancarios de AGM",
            "5. Realizar transferencia desde tu banco",
            "6. Enviar comprobante en la plataforma"
          ]
        },
        credit_card: {
          name: "Tarjeta de Crédito/Débito",
          processing_time: "Instantáneo",
          fees: "2.5% del monto",
          minimum: "$50",
          accepted: ["Visa", "Mastercard", "American Express"],
          instructions: [
            "1. Ir a Wallet > Depositar",
            "2. Seleccionar 'Tarjeta'",
            "3. Ingresar datos de la tarjeta",
            "4. Confirmar monto",
            "5. Completar verificación 3D Secure"
          ]
        },
        crypto: {
          name: "Criptomonedas",
          processing_time: "10-60 minutos",
          fees: "Sin comisión",
          minimum: "$50",
          accepted: ["Bitcoin", "Ethereum", "USDT", "USDC"],
          networks: {
            USDT: ["ERC20", "TRC20", "BEP20"],
            USDC: ["ERC20", "BEP20"]
          },
          instructions: [
            "1. Ir a Wallet > Depositar",
            "2. Seleccionar 'Criptomonedas'",
            "3. Elegir moneda y red",
            "4. Copiar dirección de depósito",
            "5. Enviar desde tu wallet",
            "6. Esperar confirmaciones en blockchain"
          ]
        }
      }
    },
    withdrawals: {
      minimum: "$50 USD",
      maximum: "$10,000 USD por día",
      requirements: [
        "KYC verificado y aprobado",
        "Sin bonos activos en la cuenta",
        "Fondos disponibles en wallet principal"
      ],
      methods: {
        bank_transfer: {
          processing_time: "24-72 horas hábiles",
          fees: "$25 USD fijo",
          minimum: "$100"
        },
        crypto: {
          processing_time: "2-24 horas",
          fees: "Comisión de red variable",
          minimum: "$50"
        }
      },
      process: [
        "1. Verificar que KYC esté aprobado",
        "2. Ir a Wallet > Retirar",
        "3. Seleccionar método de retiro",
        "4. Configurar método si es primera vez",
        "5. Ingresar monto a retirar",
        "6. Confirmar con código de verificación",
        "7. Esperar procesamiento"
      ]
    }
  },

  // PAMM y Copy Trading
  investment: {
    pamm: {
      description: "Percent Allocation Management Module - Sistema de gestión de inversiones",
      for_investors: {
        minimum_investment: "$100 USD",
        how_it_works: [
          "Los gestores operan con fondos combinados",
          "Las ganancias/pérdidas se distribuyen proporcionalmente",
          "Comisión de rendimiento solo sobre ganancias"
        ],
        how_to_invest: [
          "1. Ir a sección PAMM",
          "2. Explorar gestores disponibles",
          "3. Revisar estadísticas y rendimiento histórico",
          "4. Seleccionar gestor",
          "5. Definir monto de inversión",
          "6. Confirmar términos y comisiones"
        ],
        risks: "El trading conlleva riesgo de pérdida del capital invertido"
      },
      for_managers: {
        requirements: [
          "Cuenta real verificada",
          "Depósito mínimo de $500",
          "Experiencia comprobable en trading"
        ],
        benefits: [
          "Ganar comisiones sobre las ganancias",
          "Gestionar capital de múltiples inversores",
          "Construir reputación como trader profesional"
        ],
        commission_types: [
          "Comisión de rendimiento: 10-50% de ganancias",
          "Comisión de gestión: 0-5% anual"
        ]
      }
    },
    copytrading: {
      description: "Sistema automático para copiar operaciones de traders exitosos",
      how_it_works: [
        "Selecciona un trader para copiar",
        "Define el monto a invertir",
        "Las operaciones se copian automáticamente",
        "Proporción según tu capital"
      ],
      for_copiers: {
        minimum: "$100 USD",
        process: [
          "1. Ir a Copy Trading",
          "2. Explorar traders disponibles",
          "3. Filtrar por rendimiento, drawdown, etc.",
          "4. Seleccionar trader",
          "5. Configurar monto y parámetros",
          "6. Activar copia automática"
        ],
        controls: [
          "Stop loss por operación",
          "Stop loss total",
          "Pausar/detener copia en cualquier momento"
        ]
      },
      for_providers: {
        requirements: "Cuenta real con historial mínimo de 3 meses",
        benefits: "Comisión por cada copiador activo"
      }
    }
  },

  // Problemas comunes y soluciones
  troubleshooting: {
    login_issues: {
      "No puedo iniciar sesión": [
        "Verificar usuario/email y contraseña",
        "Revisar si el email está verificado",
        "Intentar restablecer contraseña",
        "Limpiar caché del navegador"
      ],
      "Olvidé mi contraseña": [
        "Click en 'Olvidé mi contraseña'",
        "Ingresar email registrado",
        "Revisar correo (incluyendo spam)",
        "Seguir link para restablecer"
      ]
    },
    deposit_issues: {
      "Mi depósito no se refleja": [
        "Verificar tiempo de procesamiento según método",
        "Revisar comprobante de transacción",
        "Contactar soporte con número de referencia"
      ],
      "Tarjeta rechazada": [
        "Verificar fondos suficientes",
        "Confirmar que la tarjeta permite compras internacionales",
        "Intentar con otro método de pago"
      ]
    },
    trading_issues: {
      "No puedo abrir operaciones": [
        "Verificar que el mercado esté abierto",
        "Revisar fondos disponibles en la cuenta",
        "Confirmar tamaño mínimo de lote",
        "Verificar conexión a internet"
      ],
      "Spread muy alto": [
        "Normal durante noticias importantes",
        "Revisar horario de baja liquidez",
        "Considerar cuenta Pro para spreads menores"
      ]
    },
    withdrawal_issues: {
      "No puedo retirar": [
        "Verificar KYC aprobado",
        "Revisar si hay bonos activos",
        "Confirmar método de retiro configurado",
        "Verificar monto mínimo de retiro"
      ]
    }
  },

  // FAQs frecuentes
  faqs: [
    {
      question: "¿Cuál es el depósito mínimo?",
      answer: "El depósito mínimo es de $50 USD para cuentas reales estándar.",
      category: "deposits"
    },
    {
      question: "¿Cuánto tarda la verificación KYC?",
      answer: "La verificación KYC normalmente toma entre 24-48 horas hábiles después de enviar todos los documentos.",
      category: "kyc"
    },
    {
      question: "¿Puedo tener múltiples cuentas?",
      answer: "Sí, puedes tener múltiples cuentas MT5, tanto demo como reales, desde tu mismo perfil.",
      category: "accounts"
    },
    {
      question: "¿Qué métodos de pago aceptan?",
      answer: "Aceptamos transferencias bancarias, tarjetas de crédito/débito (Visa, Mastercard), y criptomonedas (BTC, ETH, USDT, USDC).",
      category: "payments"
    },
    {
      question: "¿Cobran comisiones por depósito?",
      answer: "No cobramos comisiones por depósitos, excepto 2.5% en tarjetas de crédito. Las transferencias bancarias y crypto son gratuitas.",
      category: "deposits"
    },
    {
      question: "¿Cuál es el apalancamiento máximo?",
      answer: "El apalancamiento máximo es 1:200 para cuentas profesionales en Forex, 1:100 en índices y materias primas, y 1:20 en criptomonedas.",
      category: "trading"
    },
    {
      question: "¿Cómo funciona el sistema PAMM?",
      answer: "PAMM permite invertir con gestores profesionales. Eliges un gestor, inviertes desde $100, y las ganancias/pérdidas se distribuyen proporcionalmente.",
      category: "pamm"
    },
    {
      question: "¿Es seguro el Copy Trading?",
      answer: "El Copy Trading copia automáticamente traders exitosos. Puedes controlar el riesgo con stops y pausar cuando quieras, pero siempre existe riesgo de pérdida.",
      category: "copytrading"
    },
    {
      question: "¿Qué documentos necesito para KYC?",
      answer: "Necesitas: documento de identidad válido, comprobante de domicilio reciente (menos de 3 meses), y una selfie con tu documento.",
      category: "kyc"
    },
    {
      question: "¿Cuánto tarda un retiro?",
      answer: "Los retiros por transferencia bancaria tardan 24-72 horas hábiles. Los retiros en criptomonedas normalmente se procesan en 2-24 horas.",
      category: "withdrawals"
    }
  ],

  // Respuestas rápidas para intents específicos
  quick_responses: {
    greeting: [
      "¡Hola! Soy Flofy, tu asistente de AGM. ¿En qué puedo ayudarte hoy?",
      "¡Bienvenido a AGM! Estoy aquí para ayudarte con tu trading. ¿Qué necesitas?",
      "¡Hola trader! ¿Cómo puedo asistirte en AGM hoy?"
    ],
    thanks: [
      "¡De nada! Si necesitas más ayuda, aquí estaré.",
      "¡Un placer ayudarte! ¿Algo más que necesites?",
      "¡Excelente! Recuerda que estoy disponible 24/7 para ayudarte."
    ],
    unclear: [
      "No estoy seguro de entender tu pregunta. ¿Podrías darme más detalles?",
      "¿Podrías reformular tu pregunta? Quiero asegurarme de darte la información correcta.",
      "Hmm, no tengo clara tu consulta. ¿Es sobre cuentas, depósitos, trading o verificación?"
    ]
  }
};

// Función para buscar en la base de conocimientos
export function searchKnowledgeBase(query) {
  const lowerQuery = query.toLowerCase();
  const results = [];
  
  // Buscar en FAQs
  AGM_KNOWLEDGE_BASE.faqs.forEach(faq => {
    if (faq.question.toLowerCase().includes(lowerQuery) || 
        faq.answer.toLowerCase().includes(lowerQuery)) {
      results.push({
        type: 'faq',
        relevance: calculateRelevance(query, faq.question + ' ' + faq.answer),
        content: faq
      });
    }
  });
  
  // Buscar en troubleshooting
  Object.entries(AGM_KNOWLEDGE_BASE.troubleshooting).forEach(([category, issues]) => {
    Object.entries(issues).forEach(([problem, solutions]) => {
      if (problem.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'troubleshooting',
          relevance: calculateRelevance(query, problem),
          content: { problem, solutions }
        });
      }
    });
  });
  
  // Ordenar por relevancia
  return results.sort((a, b) => b.relevance - a.relevance).slice(0, 5);
}

// Calcular relevancia simple
function calculateRelevance(query, text) {
  const queryWords = query.toLowerCase().split(' ');
  const textLower = text.toLowerCase();
  let score = 0;
  
  queryWords.forEach(word => {
    if (textLower.includes(word)) {
      score += word.length > 3 ? 2 : 1;
    }
  });
  
  return score;
}

export default AGM_KNOWLEDGE_BASE;