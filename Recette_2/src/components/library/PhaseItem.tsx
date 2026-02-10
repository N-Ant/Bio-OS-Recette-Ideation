import React from 'react'

type PhaseType = 'start' | 'parameter' | 'prompt' | 'instrument' | 'wait' | 'profile' | 'end'

interface PhaseItemProps {
  type: PhaseType
  name: string
}

const phaseColors: Record<PhaseType, string> = {
  start: 'bg-phase-start',
  parameter: 'bg-phase-param',
  prompt: 'bg-phase-prompt',
  instrument: 'bg-phase-instrument',
  wait: 'bg-phase-wait',
  profile: 'bg-phase-profile',
  end: 'bg-phase-end',
}

// Phase Icons
const PlayIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 2L11 7L3 12V2Z" fill="currentColor" />
  </svg>
)

const ParameterIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <text x="7" y="10" fontSize="8" fill="currentColor" textAnchor="middle" fontWeight="bold">P</text>
  </svg>
)

const PromptIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="3" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M5 6H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5 9H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const InstrumentIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M7 4V7L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const WaitIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M7 4V7H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const ProfileIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 10L5 6L8 8L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const EndIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="8" height="8" fill="currentColor" />
  </svg>
)

const phaseIcons: Record<PhaseType, React.FC> = {
  start: PlayIcon,
  parameter: ParameterIcon,
  prompt: PromptIcon,
  instrument: InstrumentIcon,
  wait: WaitIcon,
  profile: ProfileIcon,
  end: EndIcon,
}

const PhaseItem: React.FC<PhaseItemProps> = ({ type, name }) => {
  const Icon = phaseIcons[type]
  const colorClass = phaseColors[type]

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab hover:bg-gray-50 transition-colors"
      draggable
    >
      <div className={`w-6 h-6 flex items-center justify-center rounded ${colorClass} text-white`}>
        <Icon />
      </div>
      <span className="text-sm text-bio-dark">{name}</span>
    </div>
  )
}

export default PhaseItem
