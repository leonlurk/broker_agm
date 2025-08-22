import React, { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import { 
  RiDashboardLine, 
  RiArrowRightSLine,
  RiMenuLine,
  RiCloseLine,
  RiLogoutBoxRLine,
  RiWalletLine,
  RiShieldLine,
  RiUserStarLine
} from "react-icons/ri";
import { useTranslation } from 'react-i18next';

const Sidebar = ({ selectedOption, setSelectedOption, onLogout }) => {
    const { t } = useTranslation('dashboard');
    const [expandedOptions, setExpandedOptions] = useState({
        Herramientas: false,
        Copytrading: false,
        Pamm: false
    });
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detectar si es dispositivo móvil
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        // Verificar al cargar y al cambiar tamaño
        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);
        
        return () => {
            window.removeEventListener('resize', checkIfMobile);
        };
    }, []);

    const handleNavigation = (option) => {
        if (option === "Herramientas" || option === "Copytrading" || option === "Pamm") {
            // Cerrar todos los dropdowns primero
            const allClosed = {
                Herramientas: false,
                Copytrading: false,
                Pamm: false
            };
            
            // Si el dropdown actual está cerrado, abrirlo; si está abierto, dejarlo cerrado
            setExpandedOptions({
                ...allClosed,
                [option]: !expandedOptions[option]
            });
        } else {
            // Cerrar todos los dropdowns al navegar a sección simple
            setExpandedOptions({
                Herramientas: false,
                Copytrading: false,
                Pamm: false
            });
            
            // Llamamos a la función pasada como prop, que ahora maneja diferente el caso de Leaderboard
            setSelectedOption(option);
            if (isMobile) {
                setIsMobileMenuOpen(false);
            }
        }
    };
    
    const handleSubOptionClick = (option, parent) => {
        // Cerrar todos los dropdowns al hacer click en subopción
        setExpandedOptions({
            Herramientas: false,
            Copytrading: false,
            Pamm: false
        });
        
        // For "Herramientas" section, use just the option name
        // For other sections (Copytrading, Pamm), use the parent prefix
        const uniqueOption = parent === "Herramientas" ? option : (parent ? `${parent} ${option}` : option);
        console.log("[Sidebar] handleSubOptionClick called with:", uniqueOption);
        setSelectedOption(uniqueOption);
        if (isMobile) {
            setIsMobileMenuOpen(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("isAuthenticated");
        onLogout();
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const menuItems = [
        { name: "Dashboard", translationKey: "sidebar.items.home", icon: <img src="./darhboard_alt.svg" className="w-8 h-8" /> },
        { name: "Cuentas", translationKey: "sidebar.items.tradingAccounts", icon: <img src="./Flag_finish_alt.svg" className="w-8 h-8" alt="Cuentas" /> },
        { name: "Wallet", translationKey: "sidebar.items.wallet", icon: <RiWalletLine className="w-8 h-8 text-white" /> },
        { 
            name: "Herramientas", 
            translationKey: "sidebar.tools",
            icon: <img src="./Setting_alt_line.svg" className="w-8 h-8" alt="Herramientas" />,
            subOptions: [
                { name: "Calculadora", translationKey: "sidebar.items.calculator" },
                { name: "Descargas", translationKey: "sidebar.items.downloads" },
                { name: "Noticias", translationKey: "sidebar.items.news" }
            ]
        },
        { name: "Afiliados", translationKey: "sidebar.items.affiliates", icon: <img src="./Group_light.svg" className="w-8 h-8" alt="Afiliados" /> },
        /* { 
            name: "Copytrading", 
            translationKey: "sidebar.copyTrading",
            icon: <img src="./copy-linear.svg" className="w-8 h-8" alt="Copytrading" onError={(e) => e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24'%3E%3Cpath fill='%23ffffff' d='M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z'/%3E%3C/svg%3E"} />,
            subOptions: [
                { name: "Inversor", translationKey: "sidebar.items.investor" },
                { name: "Gestor", translationKey: "sidebar.items.manager" }
            ]
        },
        { 
            name: "Pamm", 
            translationKey: "sidebar.pamm",
            icon: <img src="./elements.svg" className="w-8 h-8" alt="Pamm" />,
            subOptions: [
                { name: "Inversor", translationKey: "sidebar.items.pammInvestor" },
                { name: "Gestor", translationKey: "sidebar.items.pammManager" }
            ]
        }, */
    ];

    return (
        <>
            {/* Botón hamburguesa para móviles */}
            {isMobile && (
                <button 
                    onClick={toggleMobileMenu}
                    className="fixed top-4 left-4 z-50 p-2 bg-[#232323] rounded-md shadow-lg text-white"
                >
                    {isMobileMenuOpen ? 
                        <RiCloseLine className="w-6 h-6" /> : 
                        <RiMenuLine className="w-6 h-6" />
                    }
                </button>
            )}
            
            {/* Overlay para cerrar el menú al hacer clic afuera (solo en móvil) */}
            {isMobile && isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>
            )}

            <div 
                className={`${isMobile ? 'fixed left-0 top-0 z-50' : 'relative'} h-screen ${isMobile ? (isMobileMenuOpen ? 'w-[80%] max-w-[300px]' : 'w-0') : 'w-[300px]'} 
                bg-[#232323] text-white border-r border-[#333] flex flex-col
                transition-all duration-300 ease-in-out overflow-hidden`}
            >
                {/* Logo section - fixed */}
                <div className={`flex justify-center px-4 ${isMobile ? 'pt-6 pb-4' : 'pt-8 pb-6'}`}>
                    <img 
                        src="/logo.png" 
                        alt="AGM Logo" 
                        className={`${isMobile ? 'w-20' : 'w-24'} h-auto transition-all duration-300`}
                        onError={(e) => {
                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%23333333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='white'%3EAGM%3C/text%3E%3C/svg%3E";
                        }}
                    />
                </div>
                
                {/* Plataformas dropdown removido completamente */}
                
                <div className={`h-px w-full bg-[#333] ${isMobile ? 'mb-4' : 'mb-6'}`}></div>
                
                {/* Scrollable menu section with dynamic spacing */}
                <div className="flex-1 overflow-y-auto transition-all duration-500 ease-in-out flex flex-col" style={{ scrollbarWidth: 'thin', scrollbarColor: '#555 #333' }}>
                    <nav className={`flex flex-col h-full ${isMobile ? 'px-2' : 'px-4'} justify-center gap-4`}>
                        {menuItems.map((item) => (
                            <div key={item.name} className="flex flex-col">
                                <button
                                    onClick={() => handleNavigation(item.name)}
                                    className={`flex items-center justify-between w-full rounded-xl bg-transparent border font-regular transition-all
                                        ${isMobile ? 'py-3 px-4 text-base' : 'py-4 px-6 text-lg'}
                                        ${selectedOption === item.name || 
                                          (item.name === "Herramientas" && item.subOptions && item.subOptions.includes(selectedOption)) ||
                                          (item.name !== "Herramientas" && item.subOptions && item.subOptions.some(sub => selectedOption === `${item.name} ${sub}`))
                                            ? "bg-[#191919] border-cyan-500 border-opacity-30" 
                                            : "hover:bg-[#191919] border-transparent"}`}
                                    style={{ outline: 'none' }}
                                >
                                    <div className="flex items-center">
                                        <div className={`${isMobile ? 'w-6' : 'w-8'} flex justify-center mr-2`}>
                                            {React.cloneElement(item.icon, { className: isMobile ? 'w-6 h-6' : 'w-8 h-8' })}
                                        </div>
                                        <span>{t(item.translationKey)}</span>
                                    </div>
                                    {item.subOptions && (
                                        <RiArrowRightSLine 
                                            className={`w-5 h-5 transition-transform duration-300 ease-in-out ${expandedOptions[item.name] ? 'rotate-90' : ''}`} 
                                        />
                                    )}
                                </button>
                                
                                {/* Subopciones para elementos con subOptions */}
                                {item.subOptions && (
                                    <div 
                                        className={`space-y-1 overflow-hidden transition-all duration-500 ease-in-out w-full
                                            ${isMobile ? 'pl-4' : 'pl-8'}
                                            ${expandedOptions[item.name] ? (isMobile ? 'mt-1 mb-1 max-h-48 opacity-100' : 'mt-3 mb-3 max-h-48 opacity-100') : 'max-h-0 opacity-0'}`}
                                    >
                                        {item.subOptions.map(subOption => {
                                            // Iconos para cada subopción
                                            let icon;
                                            switch(subOption.name) {
                                                case "Calculadora":
                                                    icon = <img src="./Calculadora2.svg" alt="Calculadora" />;
                                                    break;
                                                case "Descargas":
                                                    icon = <img src="./load_light.svg" alt="Descargas" />;
                                                    break;
                                                case "Noticias":
                                                    icon = <img src="./Book_open.svg" alt="Noticias" />;
                                                    break;
                                                case "Inversor":
                                                    icon = <RiShieldLine className="text-white" />;
                                                    break;
                                                case "Gestor":
                                                    icon = <RiUserStarLine className="text-white" />;
                                                    break;
                                                default:
                                                    icon = null;
                                            }
                                            
                                            // Clonar icono existente y aplicar clase de tamaño móvil si es necesario
                                            let existingIcon = null;
                                            if (icon) {
                                                existingIcon = React.cloneElement(icon, {
                                                    className: isMobile ? 'w-4 h-4' : 'w-5 h-5',
                                                    onError: (e) => {
                                                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24'%3E%3Cpath fill='%23ffffff' d='M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 2v16h16V4H4zm2 2h5v5H6V6zm7 0h5v2h-5V6zm0 4h5v2h-5v-2zm0 4h5v2h-5v-2zm-7 1h2v2H6v-2zm4 0h2v2h-2v-2z'/%3E%3C/svg%3E";
                                                    }
                                                });
                                            }
                                            
                                            return (
                                                <button
                                                    key={subOption.name}
                                                    onClick={() => { 
                                                        console.log(`[Sidebar] Clicked on button for: ${subOption.name} under ${item.name}`);
                                                        handleSubOptionClick(subOption.name, item.name);
                                                    }}
                                                    className={`flex items-center w-full font-regular rounded-lg transition-colors
                                                        ${isMobile ? 'py-2 px-3 text-sm' : 'py-3 px-4 text-md'}
                                                        ${(item.name === "Herramientas" && selectedOption === subOption.name) || 
                                                          (item.name !== "Herramientas" && selectedOption === `${item.name} ${subOption.name}`)
                                                            ? "bg-transparent border-l-2 border-cyan-500" 
                                                            : "text-gray-400 hover:text-white bg-transparent hover:bg-white hover:bg-opacity-5"}`}
                                                    style={{ outline: 'none' }}
                                                >
                                                    <span className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} mr-2 flex items-center justify-center`}>
                                                        {existingIcon}
                                                    </span>
                                                    <span>{t(subOption.translationKey)}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>
                </div>
                
                {/* Bottom section - fixed */}
                <div className={`mt-auto ${isMobile ? 'px-2' : 'px-4'}`}>
                    <div className={`h-px w-full bg-[#333] ${isMobile ? 'my-2' : 'my-4'}`}></div>
                    <button
                        onClick={() => handleNavigation("Nueva Cuenta")}
                        className={`flex items-center justify-center space-x-2 rounded-md w-full bg-gradient-to-r from-[#0F7490] to-[#0A5A72] hover:opacity-90 transition 
                                   ${isMobile ? 'py-2.5 px-3 text-base' : 'py-4 px-4 text-lg'}`}
                        style={{ outline: 'none' }}
                    >
                        <span className={`${isMobile ? 'text-lg' : 'text-xl'} mr-1`}>+</span>
                        <span>{t('quickActions.newAccount')}</span>
                    </button>
                    <div className={`h-px w-full bg-[#333] ${isMobile ? 'my-2' : 'my-4'}`}></div>
                    
                    <button onClick={handleLogout} 
                        className={`w-full bg-transparent flex items-center space-x-2 py-2.5 px-4 text-gray-300 hover:bg-gray-700 rounded-lg
                                   ${isMobile ? 'mb-4 text-base' : 'mb-6 text-lg'}`}
                        style={{ outline: 'none' }}
                    >
                        <img src="./Sign_out_circle_light.svg" className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} alt="Logout" />
                        <span>{t('common:buttons.logout')}</span>
                    </button>
                </div>
            </div>
        </>
    );
};

Sidebar.propTypes = {
    selectedOption: PropTypes.string,
    setSelectedOption: PropTypes.func,
    onLogout: PropTypes.func
};

Sidebar.defaultProps = {
    selectedOption: "",
    setSelectedOption: () => {},
    onLogout: () => {}
};

export default Sidebar;