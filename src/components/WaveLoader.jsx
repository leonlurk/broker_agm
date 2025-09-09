import React from 'react';

// Componente principal de Wave Loading con animación skeleton
export const WaveLoader = ({ 
  height = 'h-4', 
  width = 'w-full', 
  rounded = 'rounded', 
  className = '',
  animate = true 
}) => {
  return (
    <div 
      className={`
        ${height} ${width} ${rounded} ${className}
        bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700
        bg-[length:200%_100%]
        ${animate ? 'animate-wave' : ''}
      `}
    />
  );
};

// Loader para tarjetas del dashboard
export const DashboardCardLoader = () => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <WaveLoader height="h-5" width="w-24" />
        <WaveLoader height="h-8" width="w-8" rounded="rounded-full" />
      </div>
      <WaveLoader height="h-8" width="w-32" />
      <WaveLoader height="h-3" width="w-40" />
    </div>
  );
};

// Loader para información de usuario
export const UserInfoLoader = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <WaveLoader height="h-20" width="w-20" rounded="rounded-full" />
        <div className="space-y-2 flex-1">
          <WaveLoader height="h-6" width="w-40" />
          <WaveLoader height="h-4" width="w-60" />
          <WaveLoader height="h-3" width="w-32" />
        </div>
      </div>
    </div>
  );
};

// Loader para estado KYC
export const KYCStatusLoader = () => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-4">
      <WaveLoader height="h-6" width="w-32" />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <WaveLoader height="h-4" width="w-40" />
          <WaveLoader height="h-4" width="w-20" />
        </div>
        <div className="flex items-center justify-between">
          <WaveLoader height="h-4" width="w-40" />
          <WaveLoader height="h-4" width="w-20" />
        </div>
        <div className="flex items-center justify-between">
          <WaveLoader height="h-4" width="w-40" />
          <WaveLoader height="h-4" width="w-20" />
        </div>
      </div>
      <WaveLoader height="h-10" width="w-full" rounded="rounded-lg" />
    </div>
  );
};

// Loader para tabla
export const TableLoader = ({ rows = 5 }) => {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-700 p-4 flex space-x-4">
        <WaveLoader height="h-4" width="w-24" />
        <WaveLoader height="h-4" width="w-32" />
        <WaveLoader height="h-4" width="w-20" />
        <WaveLoader height="h-4" width="w-28" />
      </div>
      {/* Rows */}
      <div className="divide-y divide-gray-700">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="p-4 flex space-x-4">
            <WaveLoader height="h-4" width="w-24" />
            <WaveLoader height="h-4" width="w-32" />
            <WaveLoader height="h-4" width="w-20" />
            <WaveLoader height="h-4" width="w-28" />
          </div>
        ))}
      </div>
    </div>
  );
};

// Loader para gráficos
export const ChartLoader = () => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-4">
      <WaveLoader height="h-6" width="w-40" />
      <div className="h-64 relative">
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between space-x-2">
          {[...Array(12)].map((_, i) => (
            <WaveLoader 
              key={i} 
              height={`h-${Math.floor(Math.random() * 32 + 8)}`} 
              width="w-full" 
              className="flex-1"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Loader para wallet/balance
export const WalletLoader = () => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="space-y-2">
        <WaveLoader height="h-4" width="w-32" />
        <WaveLoader height="h-10" width="w-48" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <WaveLoader height="h-3" width="w-20" />
          <WaveLoader height="h-6" width="w-32" />
        </div>
        <div className="space-y-2">
          <WaveLoader height="h-3" width="w-20" />
          <WaveLoader height="h-6" width="w-32" />
        </div>
      </div>
      <div className="flex space-x-3">
        <WaveLoader height="h-10" width="w-32" rounded="rounded-lg" />
        <WaveLoader height="h-10" width="w-32" rounded="rounded-lg" />
      </div>
    </div>
  );
};

// Loader para lista de items (trading accounts, etc)
export const ListLoader = ({ items = 3 }) => {
  return (
    <div className="space-y-3">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
          <div className="space-y-2">
            <WaveLoader height="h-5" width="w-32" />
            <WaveLoader height="h-3" width="w-24" />
          </div>
          <div className="flex items-center space-x-3">
            <WaveLoader height="h-6" width="w-20" />
            <WaveLoader height="h-8" width="w-24" rounded="rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Loader para formularios
export const FormLoader = ({ fields = 4 }) => {
  return (
    <div className="space-y-4">
      {[...Array(fields)].map((_, i) => (
        <div key={i} className="space-y-2">
          <WaveLoader height="h-4" width="w-24" />
          <WaveLoader height="h-10" width="w-full" rounded="rounded-lg" />
        </div>
      ))}
      <WaveLoader height="h-10" width="w-32" rounded="rounded-lg" className="mt-6" />
    </div>
  );
};

// Loader para notificaciones
export const NotificationLoader = () => {
  return (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-gray-800 rounded-lg p-3 flex items-start space-x-3">
          <WaveLoader height="h-8" width="w-8" rounded="rounded-full" />
          <div className="flex-1 space-y-2">
            <WaveLoader height="h-4" width="w-3/4" />
            <WaveLoader height="h-3" width="w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Hook para simular delay mínimo de carga
export const useMinLoadingTime = (isLoading, minTime = 2000) => {
  const [showLoader, setShowLoader] = React.useState(true);
  const timeoutRef = React.useRef(null);

  React.useEffect(() => {
    if (isLoading) {
      setShowLoader(true);
      timeoutRef.current = setTimeout(() => {
        setShowLoader(false);
      }, minTime);
    } else {
      // Si ya pasó el tiempo mínimo, ocultar loader
      if (timeoutRef.current) {
        const remaining = minTime - performance.now();
        if (remaining <= 0) {
          setShowLoader(false);
        }
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, minTime]);

  return showLoader || isLoading;
};

export default WaveLoader;