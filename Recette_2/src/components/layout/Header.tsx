import React from 'react'

// Bio-OS Logo (droplet-like icon from Figma)
const BioOSLogo: React.FC = () => (
  <svg width="45" height="48" viewBox="0 0 45 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.5 0C22.5 0 0 20 0 32C0 40.837 10.074 48 22.5 48C34.926 48 45 40.837 45 32C45 20 22.5 0 22.5 0Z" fill="url(#gradient)"/>
    <defs>
      <linearGradient id="gradient" x1="22.5" y1="0" x2="22.5" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0075C9"/>
        <stop offset="1" stopColor="#00A3E0"/>
      </linearGradient>
    </defs>
  </svg>
)

const StatusDot: React.FC<{ active?: boolean }> = ({ active }) => (
  <div className={`w-4 h-4 rounded-full ${active ? 'bg-green-400' : 'bg-gray-300'}`} />
)

interface DeviceSelectorProps {
  name: string
  isActive?: boolean
  showDot?: boolean
}

const DeviceSelector: React.FC<DeviceSelectorProps> = ({ name, isActive = false, showDot = false }) => (
  <button
    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-base font-medium transition-colors ${
      isActive
        ? 'bg-white border-2 border-[rgba(0,117,201,0.7)]'
        : 'bg-white'
    } text-[rgba(74,79,86,0.9)]`}
  >
    {showDot && <StatusDot active />}
    <span>{name}</span>
  </button>
)

const Header: React.FC = () => {
  return (
    <header className="h-20 bg-[#fafafa] flex items-center justify-between px-8">
      <div className="flex items-center gap-11">
        <BioOSLogo />
        <span className="font-semibold text-bio-dark text-2xl">WORKFLOW</span>
        <div className="flex items-center gap-2">
          <DeviceSelector name="BioCat L1-1" isActive showDot />
          <DeviceSelector name="L1-2" />
          <button className="bg-white flex items-center justify-center px-6 py-2.5 rounded-lg text-2xl text-[rgba(74,79,86,0.9)]">
            +
          </button>
        </div>
      </div>

      <div className="bg-white flex items-center px-4 py-2.5 rounded-2xl">
        <div className="font-normal text-bio-dark">
          <span className="text-2xl">9/18/16</span>
          <span className="text-sm tracking-[3.22px] ml-2">00h30m</span>
        </div>
      </div>
    </header>
  )
}

export default Header
