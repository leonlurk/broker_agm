import { useState, useEffect } from "react";
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
        Herramientas: false
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
        if (option === "Herramientas") {
            // Toggle expandido para Herramientas sin cambiar la selección actual
            setExpandedOptions({
                ...expandedOptions,
                Herramientas: !expandedOptions.Herramientas
            });
        } else {
            setSelectedOption(option);
            if (isMobile) {
                setIsMobileMenuOpen(false);
            }
        }
    };
    
    const handleSubOptionClick = (option) => {
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
        { name: "Dashboard", icon: <RiDashboardLine className="w-8 h-8" /> },
        { name: "Cuentas", icon: <img src="./Flag.png" className="w-8 h-8" alt="Cuentas" /> },
        { name: "Afiliados", icon: <img src="./Afiliados.png" className="w-8 h-8" alt="Afiliados" /> },
        { 
            name: "Herramientas", 
            icon: <img src="./Tools.png" className="w-8 h-8" alt="Herramientas" />,
            subOptions: ["Calculadora", "Descargas", "Noticias"]
        },
        { name: "Certificados", icon: <img src="./Certs.png" className="w-8 h-8" alt="Certificados" /> },
        { name: "Competicion", icon: <img src="./elements.png" className="w-5 h-7" alt="Competicion" /> },
        { name: "Leaderboard", icon: <img src="./leader.png" className="w-7 h-7" alt="Leaderboard" /> },
        { name: "Pagos", icon: <img src="./Money.png" className="w-8 h-8" alt="Pagos" /> },
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
                <div className="flex justify-center px-4 pt-8 pb-4">
                    <img 
                        src="/logo.png" 
                        alt="AGM Logo" 
                        className="w-24 h-auto"
                        onError={(e) => {
                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%23333333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='white'%3EAGM%3C/text%3E%3C/svg%3E";
                        }}
                    />
                </div>
                
                {/* Plataformas button - fixed */}
                <button
                    onClick={() => handleNavigation("Plataformas")}
                    className={`flex items-center space-x-3 py-3 px-6 mx-4 rounded-full border border-[#333] text-lg bg-gradient-to-br from-[#232323] to-[#2d2d2d]
                        ${selectedOption === "Plataformas" 
                            ? "bg-[#232323]" 
                            : "hover:bg-[#232323]"}`}
                    style={{ outline: 'none' }}
                >
                    <img src="./Widget.png" className="w-8 h-8" alt="Widget" />
                    <span className="font-regular">Plataformas</span>
                </button>
                
                <div className="h-px w-full bg-gray-700 my-4"></div>
                
                {/* Scrollable menu section */}
                <div className="flex-1 overflow-y-auto transition-all duration-500 ease-in-out" style={{ scrollbarWidth: 'thin', scrollbarColor: '#555 #333' }}>
                    <nav className="space-y-2 px-1">
                        {menuItems.map((item) => (
                            <div key={item.name}>
                                <button
                                    onClick={() => handleNavigation(item.name)}
                                    className={`flex items-center justify-between py-3 px-6 w-full bg-[#232323] text-lg font-regular
                                        ${selectedOption === item.name || (item.subOptions && item.subOptions.includes(selectedOption))
                                            ? "bg-[#191919]" 
                                            : "hover:bg-[#191919]"}`}
                                    style={{ outline: 'none' }}
                                >
                                    <div className="flex items-center">
                                        <div className="w-8 flex justify-center mr-3">
                                            {item.icon}
                                        </div>
                                        <span>{item.name}</span>
                                    </div>
                                    {item.subOptions && (
                                        <RiArrowRightSLine 
                                            className={`w-5 h-5 transition-transform duration-300 ease-in-out ${
                                                expandedOptions[item.name] ? 'rotate-90' : ''
                                            }`} 
                                        />
                                    )}
                                </button>
                                
                                {/* Subopciones para Herramientas con transición suave */}
                                {item.subOptions && (
                                    <div 
                                        className={`pl-8 space-y-1 overflow-hidden transition-all duration-500 ease-in-out w-full
                                            ${expandedOptions[item.name] ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}
                                    >
                                        {item.subOptions.map(subOption => {
                                            // Iconos para cada subopción
                                            let icon;
                                            switch(subOption) {
                                                case "Calculadora":
                                                    icon = <img src="./calculator.png" alt="Calculadora" className="w-5 h-5" onError={(e) => e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24'%3E%3Cpath fill='%23ffffff' d='M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 2v16h16V4H4zm2 2h5v5H6V6zm7 0h5v2h-5V6zm0 4h5v2h-5v-2zm0 4h5v2h-5v-2zm-7 1h2v2H6v-2zm4 0h2v2h-2v-2z'/%3E%3C/svg%3E"} />;
                                                    break;
                                                case "Descargas":
                                                    icon = <img src="./download.png" alt="Descargas" className="w-5 h-5" onError={(e) => e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24'%3E%3Cpath fill='%23ffffff' d='M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z'/%3E%3C/svg%3E"} />;
                                                    break;
                                                case "Noticias":
                                                    icon = <img src="./news.png" alt="Noticias" className="w-5 h-5" onError={(e) => e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24'%3E%3Cpath fill='%23ffffff' d='M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z'/%3E%3C/svg%3E"} />;
                                                    break;
                                                default:
                                                    icon = null;
                                            }
                                            
                                            return (
                                                <button
                                                    key={subOption}
                                                    onClick={() => handleSubOptionClick(subOption)}
                                                    className={`flex items-center py-2 px-4 w-full text-md font-regular rounded-lg transition-colors
                                                        ${selectedOption === subOption 
                                                            ? "bg-transparent border-cyan-500" 
                                                            : "text-gray-400 hover:text-white bg-transparent hover:bg-white hover:bg-opacity-5"}`}
                                                    style={{ outline: 'none' }}
                                                >
                                                    <span className="w-5 h-5 mr-3 flex items-center justify-center">
                                                        {icon}
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
                <div className="mt-2 px-4">
                    <div className="h-px w-full bg-gray-700 my-4"></div>
                    <button
                        onClick={() => handleNavigation("Desafio")}
                        className="flex items-center justify-center space-x-2 py-3 px-4 rounded-md w-full bg-gradient-to-r from-[#0F7490] to-[#0A5A72] hover:opacity-90 transition text-lg"
                        style={{ outline: 'none' }}
                    >
                        <span className="text-xl mr-2">+</span>
                        <span>Nuevo desafío</span>
                    </button>
                    <div className="h-px w-full bg-[#333] my-4"></div>
                    
                    <button onClick={handleLogout} 
                        className="w-full bg-transparent flex items-center space-x-3 py-3 px-6 text-gray-300 hover:bg-gray-700 mb-6 md:mb-2 style={{ outline: 'none' }}"
                        >
                        <img src="./logout.png" className="w-8 h-8" alt="Logout" />
                        <span className="text-lg">Cerrar Sesion</span>
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