import React, { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import { 
  RiDashboardLine, 
  RiArrowRightSLine,
  RiMenuLine,
  RiCloseLine,
  RiLogoutBoxRLine
} from "react-icons/ri";

const Sidebar = ({ selectedOption, setSelectedOption, onLogout }) => {
    const [expandedOptions, setExpandedOptions] = useState({
        Herramientas: false,
        Plataformas: false,
        Copytrading: false
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
        if (option === "Herramientas" || option === "Plataformas" || option === "Copytrading") {
            // Toggle expandido sin cambiar la selección actual
            setExpandedOptions({
                ...expandedOptions,
                [option]: !expandedOptions[option]
            });
        } else {
            // Llamamos a la función pasada como prop, que ahora maneja diferente el caso de Leaderboard
            setSelectedOption(option);
            if (isMobile) {
                setIsMobileMenuOpen(false);
            }
        }
    };
    
    const handleSubOptionClick = (option) => {
        console.log("[Sidebar] handleSubOptionClick called with:", option);
        console.log("[Sidebar] Calling setSelectedOption prop with:", option);
        setSelectedOption(option);
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
        { name: "Dashboard", icon: <img src="./darhboard_alt.svg" className="w-8 h-8" /> },
        { name: "Cuentas", icon: <img src="./Flag_finish_alt.svg" className="w-8 h-8" alt="Cuentas" /> },
        { name: "Wallet", icon: <img src="./wallet-line.svg" className="w-8 h-8" alt="Wallet" /> },
        { 
            name: "Herramientas", 
            icon: <img src="./Setting_alt_line.svg" className="w-8 h-8" alt="Herramientas" />,
            subOptions: ["Calculadora", "Descargas", "Noticias"]
        },
        { name: "Afiliados", icon: <img src="./Group_light.svg" className="w-8 h-8" alt="Afiliados" /> },
        { 
            name: "Copytrading", 
            icon: <img src="./copy-linear.svg" className="w-8 h-8" alt="Copytrading" onError={(e) => e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24'%3E%3Cpath fill='%23ffffff' d='M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z'/%3E%3C/svg%3E"} />,
            subOptions: ["Inversor", "Gestor"]
        },
        { name: "Pamm", icon: <img src="./elements.svg" className="w-8 h-8" alt="Pamm" /> },
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
                bg-[#232323] text-white border-r border-blue-800 border-opacity-20 flex flex-col
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
                
                {/* Plataformas button - ahora con flecha y desplegable */}
                <div className={`${isMobile ? 'mx-2 mb-4' : 'mx-4 mb-6'}`}>
                    <button
                        onClick={() => handleNavigation("Plataformas")}
                        className={`flex items-center justify-between w-full rounded-full border border-[#333] bg-gradient-to-br from-[#232323] to-[#2d2d2d]
                            ${isMobile ? 'py-2.5 px-4 text-base' : 'py-3.5 px-6 text-lg'} 
                            ${expandedOptions.Plataformas ? "bg-[#232323]" : "hover:bg-[#232323]"}`}
                        style={{ outline: 'none' }}
                    >
                        <div className="flex items-center">
                         <img src="./Widget.svg" className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} mr-2`} alt="Widget" />
                            <span className="font-regular">Plataformas</span>
                        </div>
                        <RiArrowRightSLine 
                            className={`w-5 h-5 transition-transform duration-300 ease-in-out ${expandedOptions.Plataformas ? 'rotate-90' : ''}`} 
                        />
                    </button>
                    
                    {/* Subopciones para Plataformas */}
                    <div 
                        className={`pl-6 space-y-1 overflow-hidden transition-all duration-500 ease-in-out w-full
                            ${isMobile ? 'pl-4' : 'pl-8'}
                            ${expandedOptions.Plataformas ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}
                    >
                        <button
                            onClick={() => handleSubOptionClick("PropFirm")}
                            className={`flex items-center w-full font-regular rounded-lg transition-colors
                                ${isMobile ? 'py-2 px-3 text-sm' : 'py-2.5 px-4 text-md'}
                                ${selectedOption === "PropFirm" ? "bg-transparent border-cyan-500" : "text-gray-400 hover:text-white bg-transparent hover:bg-white hover:bg-opacity-5"}`}
                            style={{ outline: 'none' }}
                        >
                            <span className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} mr-2 flex items-center justify-center`}>
                                <img src="./candlestick.png" alt="Prop Firm" className={`${isMobile ? 'w-5 h-5' : 'w-7 h-7'}`} onError={(e) => e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24'%3E%3Cpath fill='%23ffffff' d='M4 4h16v2H4v-2zm0 3h16v2H4V7zm0 3h16v2H4v-2zm0 3h10v2H4v-2z'/%3E%3C/svg%3E"} />
                            </span>
                            <span>Prop Firm</span>
                        </button>
                        <button
                            onClick={() => handleSubOptionClick("Broker")}
                            className={`flex items-center w-full font-regular rounded-lg transition-colors
                                ${isMobile ? 'py-2 px-3 text-sm' : 'py-2.5 px-4 text-md'}
                                ${selectedOption === "Broker" ? "bg-transparent border-cyan-500" : "text-gray-400 hover:text-white bg-transparent hover:bg-white hover:bg-opacity-5"}`}
                            style={{ outline: 'none' }}
                        >
                            <span className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} mr-2 flex items-center justify-center`}>
                                <img src="./waterfall.png" alt="Broker" className={`${isMobile ? 'w-5 h-5' : 'w-7 h-7'}`} onError={(e) => e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24'%3E%3Cpath fill='%23ffffff' d='M21 18v1c0 1.1-.9 2-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14c1.1 0 2 .9 2 2v1h-9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9zm-9-2h10V8H12v8z'/%3E%3C/svg%3E"} />
                            </span>
                            <span>Broker</span>
                        </button>
                    </div>
                </div>
                
                <div className={`h-px w-full bg-gray-700 ${isMobile ? 'mb-4' : 'mb-6'}`}></div>
                
                {/* Scrollable menu section */}
                <div className="flex-1 overflow-y-auto transition-all duration-500 ease-in-out" style={{ scrollbarWidth: 'thin', scrollbarColor: '#555 #333' }}>
                    <nav className={`space-y-2 ${isMobile ? 'px-2' : 'px-4'}`}>
                        {menuItems.map((item) => (
                            <div key={item.name}>
                                <button
                                    onClick={() => handleNavigation(item.name)}
                                    className={`flex items-center justify-between w-full rounded-xl bg-transparent border font-regular
                                        ${isMobile ? 'py-2.5 px-4 text-base' : 'py-4 px-6 text-lg'}
                                        ${selectedOption === item.name || (item.subOptions && item.subOptions.includes(selectedOption))
                                            ? "bg-[#191919] border-cyan-500 border-opacity-30" 
                                            : "hover:bg-[#191919] border-transparent"}`}
                                    style={{ outline: 'none' }}
                                >
                                    <div className="flex items-center">
                                        <div className={`${isMobile ? 'w-6' : 'w-8'} flex justify-center mr-2`}>
                                            {React.cloneElement(item.icon, { className: isMobile ? 'w-6 h-6' : 'w-8 h-8' })}
                                        </div>
                                        <span>{item.name}</span>
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
                                            ${isMobile ? 'pl-4 mt-1 mb-1' : 'pl-8 mt-3 mb-3'}
                                            ${expandedOptions[item.name] ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
                                    >
                                        {item.subOptions.map(subOption => {
                                            // Iconos para cada subopción
                                            let icon;
                                            switch(subOption) {
                                                case "Calculadora":
                                                    icon = <img src="./calculator.png" alt="Calculadora" />;
                                                    break;
                                                case "Descargas":
                                                    icon = <img src="./download.png" alt="Descargas" />;
                                                    break;
                                                case "Noticias":
                                                    icon = <img src="./news.png" alt="Noticias" />;
                                                    break;
                                                case "Inversor":
                                                    icon = <img src="./money-safe.svg" alt="Inversor" />;
                                                    break;
                                                case "Gestor":
                                                    icon = <img src="./Calculadora.svg" alt="Gestor" />;
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
                                                    key={subOption}
                                                    onClick={() => { 
                                                        console.log(`[Sidebar] Clicked on button for: ${subOption}`);
                                                        handleSubOptionClick(subOption);
                                                    }}
                                                    className={`flex items-center w-full font-regular rounded-lg transition-colors
                                                        ${isMobile ? 'py-2 px-3 text-sm' : 'py-3 px-4 text-md'}
                                                        ${selectedOption === subOption 
                                                            ? "bg-transparent border-l-2 border-cyan-500" 
                                                            : "text-gray-400 hover:text-white bg-transparent hover:bg-white hover:bg-opacity-5"}`}
                                                    style={{ outline: 'none' }}
                                                >
                                                    <span className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} mr-2 flex items-center justify-center`}>
                                                        {existingIcon}
                                                    </span>
                                                    <span>{subOption}</span>
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
                    <div className={`h-px w-full bg-gray-700 ${isMobile ? 'my-2' : 'my-4'}`}></div>
                    <button
                        onClick={() => handleNavigation("Desafio")}
                        className={`flex items-center justify-center space-x-2 rounded-md w-full bg-gradient-to-r from-[#0F7490] to-[#0A5A72] hover:opacity-90 transition 
                                   ${isMobile ? 'py-2.5 px-3 text-base' : 'py-4 px-4 text-lg'}`}
                        style={{ outline: 'none' }}
                    >
                        <span className={`${isMobile ? 'text-lg' : 'text-xl'} mr-1`}>+</span>
                        <span>Nuevo desafío</span>
                    </button>
                    <div className={`h-px w-full bg-[#333] ${isMobile ? 'my-2' : 'my-4'}`}></div>
                    
                    <button onClick={handleLogout} 
                        className={`w-full bg-transparent flex items-center space-x-2 py-2.5 px-4 text-gray-300 hover:bg-gray-700 rounded-lg
                                   ${isMobile ? 'mb-4 text-base' : 'mb-6 text-lg'}`}
                        style={{ outline: 'none' }}
                    >
                        <img src="./Sign_out_circle_light.svg" className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} alt="Logout" />
                        <span>Cerrar Sesion</span>
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