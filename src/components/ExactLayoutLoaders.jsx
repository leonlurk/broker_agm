import React from 'react';
import { WaveLoader } from './WaveLoader';

// Loader exacto para el Dashboard Home - replica la estructura real
export const HomeDashboardLoader = () => {
  return (
    <div className="border border-[#333] rounded-3xl p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#2b2b2b] text-white min-h-screen flex flex-col">
      {/* Header exacto */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 p-3 md:p-4 bg-gradient-to-br from-[#232323] to-[#2b2b2b] rounded-2xl relative">
        <div className="absolute inset-0 border-solid border-t border-l border-r border-cyan-500 rounded-2xl"></div>
        
        <div className="mb-3 sm:mb-0">
          <WaveLoader height="h-7" width="w-64" className="mb-2" />
          <WaveLoader height="h-4" width="w-48" />
        </div>
        
        <div className="flex items-center space-x-3 md:space-x-4 w-full sm:w-auto justify-end">
          <WaveLoader height="h-10" width="w-10" rounded="rounded-full" />
          <WaveLoader height="h-10" width="w-10" rounded="rounded-full" />
          <WaveLoader height="h-8" width="w-8" rounded="rounded-full" />
          <WaveLoader height="h-8" width="w-16" rounded="rounded-lg" />
        </div>
      </div>

      {/* Main banner section */}
      <div className="mb-6">
        <div className="flex gap-4">
          {/* Welcome Banner */}
          <div className="flex-1 p-4 md:p-6 rounded-2xl relative flex flex-col justify-center border-solid border-t border-l border-r border-cyan-500">
            <div className="relative z-10 py-4">
              <WaveLoader height="h-8" width="w-80" className="mb-3" />
              <WaveLoader height="h-5" width="w-96" className="mb-4" />
              <WaveLoader height="h-10" width="w-40" rounded="rounded-md" />
            </div>
          </div>
          
          {/* KYC Card */}
          <div className="w-[300px] p-4 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/50 flex flex-col justify-center">
            <div className="flex items-start gap-3">
              <WaveLoader height="h-6" width="w-6" rounded="rounded-full" />
              <div className="flex-1">
                <WaveLoader height="h-5" width="w-32" className="mb-2" />
                <WaveLoader height="h-4" width="w-40" className="mb-4" />
                <WaveLoader height="h-8" width="w-28" rounded="rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-5 bg-[#1C1E1E] border border-gray-700 flex flex-col rounded-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <WaveLoader height="h-5" width="w-24" className="mb-2" />
                <WaveLoader height="h-3" width="w-16" />
              </div>
              <WaveLoader height="h-6" width="w-6" rounded="rounded" />
            </div>
            
            <div className="mb-4">
              <WaveLoader height="h-8" width="w-32" className="mb-2" />
              <div className="flex items-center space-x-2">
                <WaveLoader height="h-4" width="w-12" />
                <WaveLoader height="h-4" width="w-16" />
              </div>
            </div>
            
            <div className="flex gap-2">
              <WaveLoader height="h-8" width="w-20" rounded="rounded-md" />
              <WaveLoader height="h-8" width="w-20" rounded="rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Loader exacto para Settings - replica la estructura real
export const SettingsLayoutLoader = () => {
  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-[#232323] to-[#262626] text-white flex flex-col">
      {/* Back button */}
      <div className="mb-4">
        <img 
          src="/Back.svg"
          alt="Back" 
          className="h-6 cursor-pointer hover:opacity-80 transition-opacity" 
        />
      </div>
      
      {/* Settings sections */}
      <div className="space-y-6">
        {/* Account Security Section */}
        <div className="bg-[#1C1C1C] rounded-xl border border-gray-700">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between cursor-pointer">
            <div className="flex items-center space-x-3">
              <WaveLoader height="h-5" width="w-5" rounded="rounded" />
              <WaveLoader height="h-5" width="w-32" />
            </div>
            <WaveLoader height="h-5" width="w-5" />
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <WaveLoader height="h-4" width="w-28" />
              <WaveLoader height="h-8" width="w-24" rounded="rounded-md" />
            </div>
            <div className="flex items-center justify-between">
              <WaveLoader height="h-4" width="w-24" />
              <WaveLoader height="h-8" width="w-20" rounded="rounded-md" />
            </div>
          </div>
        </div>

        {/* KYC Status Section */}
        <div className="bg-[#1C1C1C] rounded-xl border border-gray-700">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between cursor-pointer">
            <div className="flex items-center space-x-3">
              <WaveLoader height="h-5" width="w-5" rounded="rounded" />
              <WaveLoader height="h-5" width="w-40" />
            </div>
            <WaveLoader height="h-5" width="w-5" />
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center space-x-3">
              <WaveLoader height="h-6" width="w-6" rounded="rounded-full" />
              <div className="flex-1">
                <WaveLoader height="h-4" width="w-48" className="mb-1" />
                <WaveLoader height="h-3" width="w-32" />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Section */}
        <div className="bg-[#1C1C1C] rounded-xl border border-gray-700">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between cursor-pointer">
            <div className="flex items-center space-x-3">
              <WaveLoader height="h-5" width="w-5" rounded="rounded" />
              <WaveLoader height="h-5" width="w-36" />
            </div>
            <WaveLoader height="h-5" width="w-5" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Loader exacto para Wallet - replica la estructura real  
export const WalletLayoutLoader = () => {
  return (
    <div className="flex flex-col p-4 text-white min-h-screen">
      {/* Header with tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-shrink-0">
            <img src="/Back.svg" alt="Back" className="h-6 w-6 cursor-pointer" />
          </div>
          <WaveLoader height="h-7" width="w-32" />
        </div>
        
        {/* Tabs */}
        <div className="flex bg-[#1C1C1C] rounded-xl p-1 mb-6">
          <WaveLoader height="h-10" width="w-32" rounded="rounded-lg" className="mr-2" />
          <WaveLoader height="h-10" width="w-32" rounded="rounded-lg" className="mr-2" />
          <WaveLoader height="h-10" width="w-32" rounded="rounded-lg" />
        </div>
      </div>

      {/* Balance Section */}
      <div className="bg-[#232323] rounded-xl border-2 border-[#06b6d4] p-6 mb-6">
        <WaveLoader height="h-5" width="w-24" className="mb-4" />
        <WaveLoader height="h-10" width="w-48" className="mb-4" />
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <WaveLoader height="h-4" width="w-20" className="mb-2" />
            <WaveLoader height="h-6" width="w-32" />
          </div>
          <div>
            <WaveLoader height="h-4" width="w-20" className="mb-2" />
            <WaveLoader height="h-6" width="w-32" />
          </div>
        </div>
        <div className="flex gap-3">
          <WaveLoader height="h-10" width="w-28" rounded="rounded-lg" />
          <WaveLoader height="h-10" width="w-28" rounded="rounded-lg" />
        </div>
      </div>

      {/* Method Selection */}
      <div className="bg-[#232323] rounded-xl border-2 border-[#334155] p-6 mb-6">
        <WaveLoader height="h-5" width="w-32" className="mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 bg-[#1C1C1C] rounded-lg border-2 border-gray-700">
              <WaveLoader height="h-8" width="w-8" className="mb-2" />
              <WaveLoader height="h-4" width="w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Amount Section */}
      <div className="bg-[#232323] rounded-xl border-2 border-[#334155] p-6">
        <WaveLoader height="h-5" width="w-20" className="mb-4" />
        <WaveLoader height="h-12" width="w-full" rounded="rounded-lg" className="mb-4" />
        <div className="flex items-center space-x-2 mb-4">
          <WaveLoader height="h-4" width="w-4" />
          <WaveLoader height="h-4" width="w-40" />
        </div>
        <WaveLoader height="h-12" width="w-full" rounded="rounded-lg" />
      </div>
    </div>
  );
};

// Loader exacto para Trading Accounts - replica la estructura real
export const TradingAccountsLayoutLoader = () => {
  return (
    <div className="flex flex-col p-3 sm:p-4 text-white">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <WaveLoader height="h-7" width="w-48" className="mb-4 sm:mb-6" />
        
        {/* Create Account Button */}
        <WaveLoader height="h-12" width="w-full" rounded="rounded-lg" className="mb-4 sm:mb-6" />
        
        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-4 overflow-x-auto">
          <WaveLoader height="h-10" width="w-20" rounded="rounded-lg" />
          <WaveLoader height="h-10" width="w-20" rounded="rounded-lg" />
          <WaveLoader height="h-10" width="w-20" rounded="rounded-lg" />
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-[#1C1E1E] border border-gray-700 rounded-2xl p-5">
            {/* Account Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <WaveLoader height="h-8" width="w-8" rounded="rounded" />
                <div>
                  <WaveLoader height="h-5" width="w-24" className="mb-1" />
                  <WaveLoader height="h-3" width="w-16" />
                </div>
              </div>
              <WaveLoader height="h-6" width="w-6" />
            </div>

            {/* Balance */}
            <div className="mb-4">
              <WaveLoader height="h-4" width="w-16" className="mb-2" />
              <WaveLoader height="h-8" width="w-32" className="mb-2" />
              <div className="flex items-center space-x-2">
                <WaveLoader height="h-4" width="w-12" />
                <WaveLoader height="h-4" width="w-16" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <WaveLoader height="h-8" width="w-20" rounded="rounded-md" />
              <WaveLoader height="h-8" width="w-20" rounded="rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Performance Chart */}
      <div className="bg-[#1C1E1E] border border-gray-700 rounded-2xl p-6">
        <WaveLoader height="h-6" width="w-40" className="mb-4" />
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
    </div>
  );
};

// Loader exacto para User Information - mejorado del existente
export const UserInformationLayoutLoader = () => {
  return (
    <div className="text-white p-8 rounded-[40px] mx-auto w-full border border-[#3C3C3C]" 
         style={{ background: 'linear-gradient(122.63deg, rgba(34, 34, 34, 0.5) 0%, rgba(53, 53, 53, 0.5) 100%)' }}>
      
      {/* Header with back button */}
      <div className="flex items-center mb-8">
        <img src="/Back.svg" alt="Back" className="h-6 w-6 cursor-pointer mr-4" />
        <WaveLoader height="h-7" width="w-48" />
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row items-start gap-10 w-full">
        {/* Profile Image Section */}
        <div className="flex-shrink-0 flex flex-col items-center gap-4 w-full lg:w-auto">
          <WaveLoader height="h-32" width="w-32" rounded="rounded-full" />
          <WaveLoader height="h-10" width="w-40" rounded="rounded-lg" />
        </div>

        {/* Form Section */}
        <div className="flex-grow w-full space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Form Fields */}
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <WaveLoader height="h-4" width="w-24" />
                <WaveLoader height="h-12" width="w-full" rounded="rounded-xl" />
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <WaveLoader height="h-12" width="w-32" rounded="rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};