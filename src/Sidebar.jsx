import { useState } from "react";
import PropTypes from 'prop-types';
import { 
  RiDashboardLine, 
  RiMoneyDollarCircleLine, 
  RiUserLine, 
  RiToolsLine, 
  RiFileList3Line, 
  RiTrophyLine, 
  RiBarChartGroupedLine, 
  RiWalletLine,
  RiAddLine,
  RiLogoutBoxRLine,
  RiComputerLine
} from "react-icons/ri";

const Sidebar = ({ selectedOption, setSelectedOption, onLogout }) => {
    const handleNavigation = (option) => {
        setSelectedOption(option);
    };

    const handleLogout = () => {
        localStorage.removeItem("isAuthenticated");
        onLogout();
    };

    const menuItems = [
        { name: "Dashboard", icon: <RiDashboardLine className="w-8 h-8" /> },
        { name: "Cuentas", icon: <img src="./Flag.png" className="w-8 h-8" alt="Cuentas" /> },
        { name: "Afiliados", icon: <img src="./Afiliados.png" className="w-8 h-8" alt="Afiliados" /> },
        { name: "Herramientas", icon: <img src="./Tools.png" className="w-8 h-8" alt="Herramientas" /> },
        { name: "Certificados", icon: <img src="./Certs.png" className="w-8 h-8" alt="Certificados" /> },
        { name: "Competicion", icon: <img src="./elements.png" className="w-5 h-7" alt="Competicion" /> },
        { name: "Leaderboard", icon: <img src="./leader.png" className="w-7 h-7" alt="Leaderboard" /> },
        { name: "Pagos", icon: <img src="./Money.png" className="w-8 h-8" alt="Pagos" /> },
    ];

    return (
        <div className="h-screen w-[300px] bg-[#232323] flex flex-col justify-between pt-8 pb-4 text-white border-r border-blue-800 border-opacity-20">
            <div className="flex justify-center mb-12 px-4 mx-auto">
                <img 
                    src="/logo.png" 
                    alt="AGM Logo" 
                    className="w-24 h-auto"
                    onError={(e) => {
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%23333333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='white'%3EAGM%3C/text%3E%3C/svg%3E";
                    }}
                />
            </div>

            <div className="flex-grow flex flex-col space-y-2 justify-between">
            
                <button
                    onClick={() => handleNavigation("Plataformas")}
                    className={`h-16 flex items-center space-x-3 py-3 px-6 mx-4 rounded-full border border-[#333] text-lg bg-gradient-to-br from-[#232323] to-[#2d2d2d]
                        ${selectedOption === "Plataformas" 
                            ? "bg-[#232323]" 
                            : "hover:bg-[#232323]"}`}
                    style={{ outline: 'none' }}
                >
                    <img src="./Widget.png" className="w-8 h-8" alt="Widget" />
                    <span className="font-regular">Plataformas</span>
                </button>
                <div className="h-px w-full bg-gray-700 mb-4"></div>

                <nav className="space-y-2 mt-4 flex-grow flex flex-col justify-between">
                    {menuItems.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => handleNavigation(item.name)}
                            className={`flex items-center space-x-3 py-3 px-6 w-full bg-[#232323] text-lg font-regular
                                ${selectedOption === item.name 
                                    ? "bg-[#191919]" 
                                    : "hover:bg-[#191919]"}`}
                            style={{ outline: 'none' }}
                        >
                            <div className="w-8 flex justify-center mr-3">
                                    {item.icon}
                                </div>
                                <span>{item.name}</span>
                                </button>
                            ))}
                            </nav>
            </div>

            <div className="px-4 mt-auto">
                <div className="h-px w-full bg-gray-700 mb-4"></div>
                <button
                    onClick={() => handleNavigation("Nuevo desafío")}
                    className="flex items-center justify-center space-x-2 py-3 px-4 rounded-md w-full bg-gradient-to-r from-[#0F7490] to-[#0A5A72] hover:opacity-90 transition text-lg"
                    style={{ outline: 'none' }}
                >
                    <RiAddLine className="w-4 h-4" />
                    <span>Nuevo desafío</span>
                </button>
                <div className="h-px w-full bg-gray-700 mt-4 mb-4"></div>
            </div>

            <button onClick={handleLogout} 
                className="w-full flex items-center space-x-3 py-3 px-6 text-gray-300 hover:bg-gray-700"
                style={{ outline: 'none' }}>
                <img src="./logout.png" className="w-8 h-8" alt="Logout" />
                <span className="text-lg">Cerrar Sesion</span>
                </button>
        </div>
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