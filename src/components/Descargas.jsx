import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const Descargas = () => {
  const { t } = useTranslation('tools');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Función para detectar si es dispositivo móvil
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Verificar al cargar
    checkIfMobile();
    
    // Configurar el listener para cambios de tamaño
    window.addEventListener('resize', checkIfMobile);
    
    // Limpiar el listener al desmontar
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Datos de las plataformas
  const platforms = [
  {
    id: 'mt5',
    name: t('downloads.platforms.mt5.name'),
    description: t('downloads.platforms.mt5.description'),
    image: '/mt5.png',
    downloads: [
      { 
        os: isMobile ? t('downloads.operatingSystems.android') : t('downloads.operatingSystems.windows'),
        icon: isMobile ? '/Android.png' : '/windows.png',
        link: isMobile ? 'https://download.mql5.com/cdn/mobile/mt5/android?utm_source=www.metatrader5.com&utm_campaign=install.metaquotes' : 'https://download.mql5.com/cdn/web/metaquotes.ltd/mt5/mt5setup.exe?utm_source=www.metatrader5.com&utm_campaign=download'
      },
      { 
        os: isMobile ? t('downloads.operatingSystems.iphone') : t('downloads.operatingSystems.mac'),
        icon: isMobile ? '/apple.png' : '/apple.png',
        link: isMobile ? 'https://download.mql5.com/cdn/mobile/mt5/ios?utm_source=www.metatrader5.com&utm_campaign=install.metaquotes' : 'https://download.mql5.com/cdn/web/metaquotes.ltd/mt5/MetaTrader5.pkg.zip?utm_source=www.metatrader5.com&utm_campaign=download.mt5.macos'
      }
    ]
  }
];

  return (
    <div className="flex flex-col border border-[#333] rounded-3xl bg-[#232323] text-white p-4 md:p-6">
      <div className="space-y-6">
        {platforms.map((platform) => (
          <div 
            key={platform.id}
            className="p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2d2d2d] rounded-xl border border-[#333] flex flex-col md:flex-row gap-4"
          >
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-semibold mb-2">{platform.name}</h2>
              <p className="text-sm md:text-base text-[#7a7a7a] mb-4">{platform.description}</p>
              
              <div className="flex flex-wrap gap-2">
                {platform.downloads.map((download, index) => (
                  <a 
                    key={index}
                    href={download.link}
                    className="flex items-center text-white px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#444] rounded-full transition"
                  >
                    <img 
                      src={download.icon} 
                      alt={download.os} 
                      className="w-5 h-5 mr-2"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect width='20' height='20' fill='%23555'/%3E%3C/svg%3E";
                      }}
                    />
                    <span>{download.os}</span>
                  </a>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-center md:w-1/3">
              <img 
                src={platform.image} 
                alt={platform.name}
                className="max-w-full max-h-32 md:max-h-48"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='120'%3E%3Crect width='200' height='120' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='white'%3ELogo%3C/text%3E%3C/svg%3E";
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Descargas;