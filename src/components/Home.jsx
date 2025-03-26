import React from 'react';
const fondoTarjetaUrl = "/fondoTarjeta.png";

const Home = () => {
  return (
    <div className="p-6 bg-[#232323] text-white h-screen flex flex-col">
      {/* Header con saludo y fecha */}
      <div className="flex justify-between items-center mb-6 p-4 bg-gradient-to-br from-[#232323] to-[#202020] border border-[#333] rounded-xl relative">
  <div className="absolute inset-0 border-solid border-t border-l border-r border-cyan-500 border-opacity-50 rounded-xl"></div>
  <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/30 to-transparent pointer-events-none" style={{height: '1px', top: 'auto'}}></div>
        <div>
          <h1 className="text-2xl font-semibold">Hola, Santiago</h1>
          <p className="text-gray-400">Miércoles, 8 de diciembre 2025</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="relative rounded-full bg-transparent"
          style={{ outline: 'none' }}>
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full"></span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <button className="relative rounded-full bg-transparent"
          style={{ outline: 'none' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <div className="flex items-center space-x-2">
            <img src="/Perfil.png" alt="Avatar" className="w-12 h-12 rounded-full" 
              onError={(e) => {
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23555'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='white'%3ES%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>
          <div className="flex items-center space-x-2">
            <img src="/IdiomaES.png" alt="Avatar" className="w-8 h-8 rounded-full" 
              onError={(e) => {
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23555'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='white'%3ES%3C/text%3E%3C/svg%3E";
              }}
            />
            <span className="text-gray-300">ES</span>
          </div>
        </div>
      </div>

      {/* Tarjeta principal con fondo de imagen */}
      <div 
  className="mb-6 p-6 rounded-2xl relative h-80 flex flex-col justify-center border border-cyan-500 border-opacity-30 shadow-lg shadow-cyan-900/20"
>
  <div 
    className="absolute inset-0 rounded-md"
    style={{ 
      backgroundImage: `url(${fondoTarjetaUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      opacity: 0.2,
      zIndex: 0
    }}
  ></div>
  <div className="max-w-lg relative z-10">
    <h2 className="text-3xl font-bold mb-4">Impulsa tu trading con AGM Prop Firm</h2>
    <p className="text-xl mb-6">¡Obtén hasta un 90% de profit split y gestiona cuentas de hasta $200,000</p>
    <button className="bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white py-2 px-6 rounded-md hover:opacity-90 transition"
    style={{ outline: 'none' }}>
      Empezar
    </button>
  </div>
</div>
      {/* Sección de cuentas */}
      <div className="mb-6 border border-[#333] p-4 rounded-xl flex-grow flex flex-col bg-gradient-to-br from-[#232323] to-[#202020]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-4xl font-semibold">Tus Cuentas</h2>
          <button className="text-white bg-[#232323] rounded-full py-2 px-4 text-lg font-regular border border-gray-700 w-1/6 hover:bg-gray-800 transition"
          style={{ outline: 'none' }}>
            Ver Todo
          </button>
        </div>
        
        {/* Tarjetas de cuentas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow">
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-gradient-to-br from-[#232323] to-[#2d2d2d] p-4 rounded-md border border-[#333] flex flex-col h-full">
              <div className="flex justify-between items-center mb-2 text-4xl">
                <h3 className="font-medium">ONE STEP CHALLENGE 100K</h3>
                <span className="text-gray-400 text-xl">#657237</span>
              </div>
              <div className="flex justify-center mt-auto">
                <button className="border border-cyan-500 border-opacity-50 text-white py-2 px-4 rounded-full hover:bg-gray-800 transition"
                style={{ outline: 'none' }}>
                  Ver Detalles
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;