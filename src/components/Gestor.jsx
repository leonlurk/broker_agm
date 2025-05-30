import React, { useState } from 'react';
import { Download } from 'lucide-react'; // Opcional: icono para descargar

// Datos de ejemplo para la tabla (reemplazar con datos reales)
const placeholderInvestors = [
  // Inicialmente vacío o con placeholders
  // { id: 1, nombre: 'Inversor Alfa', cuenta: '123456', fecha: '2024-01-15', rentabilidad: '15.2%', rendimiento: 'Alto', bajoGestion: '$10,500', estado: 'Activo', accion: '...' },
];

const Gestor = () => {
  console.log("[Gestor] Component rendering started."); // <-- DEBUG LOG
  const [investors, setInvestors] = useState(placeholderInvestors);
  const [isLoading, setIsLoading] = useState(false); // Para futuras cargas

  const handleCreateCopy = () => {
    console.log("Botón 'Crear Copia' presionado.");
    // Lógica futura para crear una copia/estrategia
  };

  const handleDownload = () => {
    console.log("Botón 'Descargar' presionado.");
    // Lógica futura para descargar datos de la tabla
  };

  return (
    <div className="p-4 md:p-6 bg-[#232323] text-white min-h-screen border border-[#333] rounded-3xl">

      {/* Contenedor Superior: Título, Descripción y Botón Crear Copia */}
      <div className="mb-6 md:mb-8 p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-3xl border border-[#333]">
        <div className="flex flex-col md:flex-row justify-between md:items-start">
          {/* Título y Descripción */}
          <div className="mb-4 md:mb-0 max-w-xl">
            <h1 className="text-2xl md:text-3xl font-semibold mb-2">Clasificación de inversores</h1>
            <p className="text-sm md:text-base text-gray-400">
              Los inversores a menudo se clasifican en diferentes niveles según su experiencia, capital y estrategias de inversión.
            </p>
          </div>
          {/* Botón Crear Copia */}
          <button
            onClick={handleCreateCopy}
            className="flex-shrink-0 bg-gradient-to-r from-[#0F7490] to-[#0A5A72] text-white py-2 px-5 rounded-lg hover:opacity-90 transition text-sm md:text-base"
            style={{ outline: 'none' }}
          >
            Crear Copia
          </button>
        </div>
      </div>

      {/* Botón Descargar (Debajo del contenedor superior, alineado a la derecha) */}
      <div className="mb-4 flex justify-end">
          <button
            onClick={handleDownload}
            className="bg-[#2a2a2a] border border-[#444] text-gray-300 hover:text-white hover:border-gray-500 py-2 px-5 rounded-lg transition text-sm md:text-base flex items-center gap-2"
            style={{ outline: 'none' }}
          >
             Descargar
             {/* <Download size={16} /> */}
          </button>
      </div>

      {/* Contenedor Tabla Inversores */}
      <div className="bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-3xl border border-[#333] p-1">
        <div className="overflow-x-auto">
          {/* Encabezado de la tabla */}
          <div className="grid grid-cols-[repeat(6,minmax(100px,1fr)),minmax(120px,1fr),minmax(80px,auto)] gap-x-4 px-4 py-3 border-b border-[#333] text-xs text-gray-400 sticky top-0 bg-gradient-to-br from-[#232323] to-[#2b2b2b] z-10">
            <div className="text-left">Nombre</div>
            <div className="text-left">Cuenta</div>
            <div className="text-left">Fecha</div>
            <div className="text-left">Rentabilidad</div>
            <div className="text-left">Rendimiento</div>
            <div className="text-left">Bajo Gestión</div>
            <div className="text-left">Estado</div>
            <div className="text-left">Acción</div>
          </div>

          {/* Cuerpo de la tabla */}
          <div className="divide-y divide-[#333]">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Cargando inversores...</div>
            ) : investors.length > 0 ? (
              investors.map((investor) => (
                <div
                   key={investor.id}
                   className="grid grid-cols-[repeat(6,minmax(100px,1fr)),minmax(120px,1fr),minmax(80px,auto)] gap-x-4 px-4 py-3 items-center text-sm transition-colors"
                 >
                  {/* Datos - Reemplazar con datos reales */}
                  <div className="text-left truncate">{investor.nombre || '-'}</div>
                  <div className="text-left truncate">{investor.cuenta || '-'}</div>
                  <div className="text-left truncate">{investor.fecha || '-'}</div>
                  <div className="text-left truncate font-medium">{investor.rentabilidad || '-'}</div>
                  <div className="text-left truncate">{investor.rendimiento || '-'}</div>
                  <div className="text-left truncate font-medium">{investor.bajoGestion || '-'}</div>
                  <div className="text-left truncate">
                    {/* Ejemplo de estado con color */}
                    <span className={`px-2 py-0.5 rounded-full text-xs ${investor.estado === 'Activo' ? 'bg-green-500 bg-opacity-20 text-green-400' : 'bg-gray-500 bg-opacity-20 text-gray-400'}`}>
                        {investor.estado || '-'}
                    </span>
                  </div>
                  <div className="text-left">
                     {/* Placeholder para acciones, ej: botón */}
                     <button className="text-cyan-500 hover:text-cyan-400 text-xs">Ver</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No hay inversores para mostrar.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Gestor; 