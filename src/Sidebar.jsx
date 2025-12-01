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
import toast from 'react-hot-toast';

const Sidebar = ({ selectedOption, setSelectedOption, onLogout, user }) => {
    const { t } = useTranslation(['dashboard', 'common']);
    const [expandedOptions, setExpandedOptions] = useState({
        Herramientas: false,
        Copytrading: false,
        Pamm: false
    });
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isSmallHeight, setIsSmallHeight] = useState(false);

    // Debug KYC status
    useEffect(() => {
        console.log("[Sidebar] User data received:", {
            exists: !!user,
            kyc_status: user?.kyc_status,
            kyc_verified: user?.kyc_verified,
            email: user?.email
        });
    }, [user]);

    // Force re-render when selectedOption changes to ensure visual update
    useEffect(() => {
        // Force re-render by updating a local state if needed
        if (selectedOption) {
            // Ensure the component re-renders when selectedOption changes
            setExpandedOptions(prev => ({ ...prev }));
        }
    }, [selectedOption]);

    // Detectar si es dispositivo móvil o pantalla con altura pequeña
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 768);
            // Detectar pantallas con altura limitada (laptops pequeñas, MacBooks)
            setIsSmallHeight(window.innerHeight < 800);
        };

        // Verificar al cargar y al cambiar tamaño
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => {
            window.removeEventListener('resize', checkScreenSize);
        };
    }, []);

    const handleNavigation = (option) => {
        console.log("[Sidebar] handleNavigation called with:", option, "KYC status:", user?.kyc_status);
        
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

    const handleLogout = async () => {
        try {
            // Solo llamar a onLogout que ya maneja todo
            await onLogout();
        } catch (error) {
            console.error("Error during logout:", error);
            toast.error("Error al cerrar sesión");
        }
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const menuItems = [
        { name: "Dashboard", translationKey: "sidebar.items.home", icon: <img src="/darhboard_alt.svg" className="w-8 h-8" /> },
        { name: "Cuentas", translationKey: "sidebar.items.tradingAccounts", icon: <img src="/Flag_finish_alt.svg" className="w-8 h-8" alt="Cuentas" /> },
        { name: "Wallet", translationKey: "sidebar.items.wallet", icon: <RiWalletLine className="w-8 h-8 text-white" /> },
        { name: "Leaderboard", translationKey: "sidebar.items.leaderboard", icon: <img src="/trophy.svg" className="w-8 h-8" alt="Leaderboard" onError={(e) => e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2'%3E%3Cpath d='M6 9H4.5a2.5 2.5 0 0 1 0-5H6'/%3E%3Cpath d='M18 9h1.5a2.5 2.5 0 0 0 0-5H18'/%3E%3Cpath d='M4 22h16'/%3E%3Cpath d='M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22'/%3E%3Cpath d='M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22'/%3E%3Cpath d='M18 2H6v7a6 6 0 0 0 12 0V2Z'/%3E%3C/svg%3E"} /> },
        {
            name: "Herramientas",
            translationKey: "sidebar.tools",
            icon: <img src="/Setting_alt_line.svg" className="w-8 h-8" alt="Herramientas" />,
            subOptions: [
                { name: "Calculadora", translationKey: "sidebar.items.calculator" },
                { name: "Descargas", translationKey: "sidebar.items.downloads" },
                { name: "Noticias", translationKey: "sidebar.items.news" }
            ]
        },
        { name: "Afiliados", translationKey: "sidebar.items.affiliates", icon: <img src="/Group_light.svg" className="w-8 h-8" alt="Afiliados" /> },
        {
            name: "Copytrading",
            translationKey: "sidebar.copyTrading",
            icon: <img src="/copy-linear.svg" className="w-8 h-8" alt="Copytrading" onError={(e) => e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24'%3E%3Cpath fill='%23ffffff' d='M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z'/%3E%3C/svg%3E"} />,
            subOptions: [
                { name: "Inversor", translationKey: "sidebar.items.investor" },
                { name: "Gestor", translationKey: "sidebar.items.manager" }
            ]
        },
        {
            name: "Pamm",
            translationKey: "sidebar.pamm",
            icon: <img src="/elements.svg" className="w-8 h-8" alt="Pamm" />,
            subOptions: [
                { name: "Inversor", translationKey: "sidebar.items.pammInvestor" },
                { name: "Gestor", translationKey: "sidebar.items.pammManager" }
            ]
        }
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
                className={`${isMobile ? 'fixed left-0 top-0 z-50' : 'relative'} ${isMobile ? 'h-full min-h-screen' : 'h-screen'} ${isMobile ? (isMobileMenuOpen ? 'w-[80%] max-w-[300px]' : 'w-0') : 'w-[300px]'} 
                bg-[#232323] text-white border-r border-[#333] flex flex-col
                transition-all duration-300 ease-in-out ${isMobile ? 'overflow-y-auto' : 'overflow-hidden'}`}
            >
                {/* Logo section - fixed */}
                <div className={`flex justify-center px-4 ${isMobile ? 'pt-6 pb-4' : isSmallHeight ? 'pt-4 pb-3' : 'pt-8 pb-6'}`}>
                    <img
                        src="/Capa_x0020_1.svg"
                        alt="AGM Logo"
                        className={`${isMobile ? 'w-20' : isSmallHeight ? 'w-16' : 'w-24'} h-auto transition-all duration-300`}
                        onError={(e) => {
                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%23333333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='white'%3EAGM%3C/text%3E%3C/svg%3E";
                        }}
                    />
                </div>
                
                {/* Plataformas dropdown removido completamente */}
                
                <div className={`h-px w-full bg-[#333] ${isMobile ? 'mb-4' : isSmallHeight ? 'mb-3' : 'mb-6'}`}></div>

                {/* Scrollable menu section with dynamic spacing */}
                <div className={`${isMobile ? 'flex-1 min-h-0' : 'flex-1'} overflow-y-auto transition-all duration-500 ease-in-out flex flex-col`} style={{ scrollbarWidth: 'thin', scrollbarColor: '#555 #333' }}>
                    <nav className={`flex flex-col ${isMobile ? 'px-2' : 'px-4'} ${isSmallHeight ? 'justify-start py-2' : 'justify-center h-full'} ${isSmallHeight ? 'gap-1' : 'gap-4'}`}>
                        {menuItems.map((item) => (
                            <div key={item.name} className="flex flex-col">
                                <button
                                    onClick={() => handleNavigation(item.name)}
                                    className={`flex items-center justify-between w-full rounded-xl bg-transparent border font-regular transition-all
                                        ${isMobile ? 'py-3 px-4 text-base' : isSmallHeight ? 'py-2 px-4 text-sm' : 'py-4 px-6 text-lg'}
                                        ${(() => {
                                            const isSelected = selectedOption === item.name;
                                            const isSubSelected = item.subOptions && item.subOptions.some(sub => 
                                                item.name === "Herramientas" ? sub.name === selectedOption : selectedOption === `${item.name} ${sub.name}`
                                            );
                                            const result = isSelected || isSubSelected;
                                            
                                            // Debug removed for performance
                                            
                                            return result;
                                        })()
                                            ? "bg-[#191919] border-cyan-500 border-opacity-30" 
                                            : "hover:bg-[#191919] border-transparent"}`}
                                    style={{ outline: 'none' }}
                                >
                                    <div className="flex items-center">
                                        <div className={`${isMobile ? 'w-6' : isSmallHeight ? 'w-5' : 'w-8'} flex justify-center mr-2`}>
                                            {React.cloneElement(item.icon, { className: isMobile ? 'w-6 h-6' : isSmallHeight ? 'w-5 h-5' : 'w-8 h-8' })}
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
                                            ${isMobile ? 'pl-4' : isSmallHeight ? 'pl-6' : 'pl-8'}
                                            ${expandedOptions[item.name] ? (isMobile ? 'mt-1 mb-1 max-h-48 opacity-100' : isSmallHeight ? 'mt-1 mb-1 max-h-40 opacity-100' : 'mt-3 mb-3 max-h-48 opacity-100') : 'max-h-0 opacity-0'}`}
                                    >
                                        {item.subOptions.map(subOption => {
                                            // Iconos para cada subopción
                                            let icon;
                                            switch(subOption.name) {
                                                case "Calculadora":
                                                    icon = <img src="/Calculadora2.svg" alt="Calculadora" />;
                                                    break;
                                                case "Descargas":
                                                    icon = <img src="/load_light.svg" alt="Descargas" />;
                                                    break;
                                                case "Noticias":
                                                    icon = <img src="/Book_open.svg" alt="Noticias" />;
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
                                                        ${isMobile ? 'py-2 px-3 text-sm' : isSmallHeight ? 'py-1.5 px-3 text-xs' : 'py-3 px-4 text-md'}
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
                <div className={`${isMobile ? 'mt-2 flex-shrink-0 px-2' : 'mt-auto px-4'}`}>
                    <div className={`h-px w-full bg-[#333] ${isMobile ? 'my-2' : isSmallHeight ? 'my-2' : 'my-4'}`}></div>
                    <button
                        onClick={() => {
                            // Allow navigation to account creation for all users
                            // KYC restriction will be handled in the account creation form itself
                            handleNavigation("Nueva Cuenta");
                        }}
                        className={`flex items-center justify-center space-x-2 rounded-md w-full transition relative
                                   bg-gradient-to-r from-[#0F7490] to-[#0A5A72] hover:opacity-90
                                   ${isMobile ? 'py-2.5 px-3 text-base' : isSmallHeight ? 'py-2 px-3 text-sm' : 'py-4 px-4 text-lg'}`}
                        style={{ outline: 'none' }}
                        title={!user ? 'Cargando información del usuario...' : user?.kyc_status !== 'approved' ? 'Solo puedes crear cuentas Demo sin KYC aprobado' : ''}
                    >
                        {(!user || user?.kyc_status !== 'approved') && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                                <span className="text-black text-xs font-bold">!</span>
                            </span>
                        )}
                        <span className={`${isMobile ? 'text-lg' : isSmallHeight ? 'text-base' : 'text-xl'} mr-1`}>+</span>
                        <span>{t('quickActions.newAccount')}</span>
                    </button>
                    <div className={`h-px w-full bg-[#333] ${isMobile ? 'my-2' : isSmallHeight ? 'my-2' : 'my-4'}`}></div>

                    <button onClick={handleLogout}
                        className={`w-full bg-transparent flex items-center space-x-2 py-2.5 px-4 text-gray-300 hover:bg-gray-700 rounded-lg
                                   ${isMobile ? 'mb-4 text-base' : isSmallHeight ? 'mb-3 text-sm' : 'mb-6 text-lg'}`}
                        style={{ outline: 'none' }}
                    >
                        <img src="/Sign_out_circle_light.svg" className={`${isMobile ? 'w-6 h-6' : isSmallHeight ? 'w-5 h-5' : 'w-8 h-8'}`} alt="Logout" />
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