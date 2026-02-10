import React from 'react'

interface NavIconProps {
  children: React.ReactNode
  isActive?: boolean
  onClick?: () => void
}

const NavIcon: React.FC<NavIconProps> = ({ children, isActive = false, onClick }) => (
  <button
    onClick={onClick}
    className="w-[54px] h-[54px] flex items-center justify-center rounded-full transition-colors relative"
  >
    {isActive && (
      <div className="absolute left-[-24px] w-1 h-[37px] bg-[rgba(0,117,201,0.9)] rounded-full" />
    )}
    <div className={isActive ? 'text-bio-primary' : 'text-[#666]'}>
      {children}
    </div>
  </button>
)

// Synoptic/Home icon
const SynopticIcon: React.FC = () => (
  <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M27 6C27 6 10 20 10 30C10 38 17 44 27 44C37 44 44 38 44 30C44 20 27 6 27 6Z" fill="currentColor" fillOpacity="0.5"/>
  </svg>
)

// Chat icon
const ChatIcon: React.FC = () => (
  <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="12" width="34" height="24" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M18 22H36M18 28H30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// Workflow icon (active)
const WorkflowIcon: React.FC = () => (
  <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="8" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
    <rect x="32" y="8" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
    <rect x="20" y="32" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M15 22V27H27V32" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M39 22V27H27" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// Charts icon
const ChartsIcon: React.FC = () => (
  <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 40L18 28L26 34L34 20L44 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// Logbook icon
const LogbookIcon: React.FC = () => (
  <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="8" width="30" height="38" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M18 18H36M18 26H36M18 34H28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// Calibration/Droplet icon
const CalibrationIcon: React.FC = () => (
  <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M27 8C27 8 14 22 14 32C14 40 20 46 27 46C34 46 40 40 40 32C40 22 27 8 27 8Z" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
)

// Settings icon
const SettingsIcon: React.FC = () => (
  <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="27" cy="27" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M27 10V14M27 40V44M10 27H14M40 27H44M14.5 14.5L17.3 17.3M36.7 36.7L39.5 39.5M39.5 14.5L36.7 17.3M17.3 36.7L14.5 39.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const Sidebar: React.FC = () => {
  return (
    <aside className="absolute left-8 top-1/2 -translate-y-1/2 w-[102px] bg-white rounded-[50px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] flex flex-col items-center py-8 gap-12 z-10" style={{ height: '737px' }}>
      <NavIcon>
        <SynopticIcon />
      </NavIcon>
      <NavIcon>
        <ChatIcon />
      </NavIcon>
      <NavIcon isActive>
        <WorkflowIcon />
      </NavIcon>
      <NavIcon>
        <ChartsIcon />
      </NavIcon>
      <NavIcon>
        <LogbookIcon />
      </NavIcon>
      <NavIcon>
        <CalibrationIcon />
      </NavIcon>
      <NavIcon>
        <SettingsIcon />
      </NavIcon>
    </aside>
  )
}

export default Sidebar
