import React from 'react'
import { NodeType } from '../../context/WorkflowContext'

const ExpandIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 6L15 12L9 18" stroke="#4A4F56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// Phase Icons (24x24)
const PlayIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 4L20 12L6 20V4Z" fill="white"/>
  </svg>
)

const LetterPIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="white"/>
    <text x="12" y="17" fontSize="14" fill="#84b3ff" textAnchor="middle" fontWeight="bold">P</text>
  </svg>
)

const PromptIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="6" width="16" height="12" rx="2" stroke="white" strokeWidth="2" fill="none"/>
    <path d="M7 10H17M7 14H12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const InstrumentIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="7" stroke="white" strokeWidth="2" fill="none"/>
    <path d="M12 8V12L15 15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const TimeIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="2" fill="none"/>
    <path d="M12 7V12H16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const GraphIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 18L8 12L12 15L20 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const FlagIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 4V20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <path d="M5 4H17L14 9L17 14H5" fill="white"/>
  </svg>
)

const phaseData: { type: NodeType; name: string; color: string; Icon: React.FC }[] = [
  { type: 'start', name: 'Start', color: '#55b479', Icon: PlayIcon },
  { type: 'parameter', name: 'Parameter phase', color: '#84b3ff', Icon: LetterPIcon },
  { type: 'prompt', name: 'Operator prompt phase', color: '#ffc35e', Icon: PromptIcon },
  { type: 'instrument', name: 'Instrument phase', color: '#b08efd', Icon: InstrumentIcon },
  { type: 'wait', name: 'Wait phase', color: '#9a9b9e', Icon: TimeIcon },
  { type: 'profile', name: 'Profile phase', color: '#50be9a', Icon: GraphIcon },
  { type: 'end', name: 'End', color: '#fb6a6a', Icon: FlagIcon },
]

interface PhaseItemProps {
  type: NodeType
  name: string
  color: string
  Icon: React.FC
}

const PhaseItem: React.FC<PhaseItemProps> = ({ type, name, color, Icon }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type, label: name.replace(' phase', '') }))
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div
      className="flex items-center gap-4 h-[42px] rounded-lg cursor-grab hover:bg-gray-50 active:cursor-grabbing transition-colors"
      draggable
      onDragStart={handleDragStart}
    >
      <div
        className="w-[42px] h-[42px] flex items-center justify-center rounded-lg flex-shrink-0"
        style={{ backgroundColor: color }}
      >
        <Icon />
      </div>
      <span className="text-base font-medium text-bio-dark">{name}</span>
    </div>
  )
}

const LibraryPanel: React.FC = () => {
  return (
    <div className="w-[396px] bg-white border border-[rgba(192,192,192,0.32)] rounded-2xl flex flex-col overflow-hidden" style={{ height: '525px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14">
        <span className="text-base font-medium text-bio-dark">Library</span>
        <button className="w-6 h-6 flex items-center justify-center">
          <ExpandIcon />
        </button>
      </div>

      {/* Instructions */}
      <div className="px-4 pb-2">
        <p className="text-xs text-bio-gray">Glissez-déposez une phase sur le canvas</p>
      </div>

      {/* Phase List */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4">
        {phaseData.map((phase, index) => (
          <PhaseItem
            key={index}
            type={phase.type}
            name={phase.name}
            color={phase.color}
            Icon={phase.Icon}
          />
        ))}
      </div>
    </div>
  )
}

export default LibraryPanel
