import React, { useRef, useState, useEffect } from 'react'
import { NodeType } from '../../context/WorkflowContext'

interface WorkflowNodeProps {
  id: string
  type: NodeType
  label: string
  subtitle?: string
  x: number
  y: number
  isSelected?: boolean
  isConnecting?: boolean
  onPositionChange: (id: string, x: number, y: number) => void
  onSelect: (id: string) => void
  onStartConnect: (id: string) => void
  onCompleteConnect: (id: string) => void
}

const nodeColors: Record<NodeType, string> = {
  start: '#55b479',
  parameter: '#84b3ff',
  prompt: '#ffc35e',
  instrument: '#b08efd',
  wait: '#9a9b9e',
  profile: '#50be9a',
  end: '#fb6a6a',
}

// Node Icons (32x32)
const PlayIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 6L26 16L8 26V6Z" fill="white"/>
  </svg>
)

const LetterPIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="24" height="24" rx="3" fill="white"/>
    <text x="16" y="23" fontSize="18" fill="#84b3ff" textAnchor="middle" fontWeight="bold">P</text>
  </svg>
)

const PromptIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="7" width="24" height="18" rx="3" stroke="white" strokeWidth="2.5" fill="none"/>
    <path d="M9 13H23M9 19H16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
)

const InstrumentIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="10" stroke="white" strokeWidth="2.5" fill="none"/>
    <path d="M16 10V16L20 20" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
)

const WaitIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="10" stroke="white" strokeWidth="2.5" fill="none"/>
    <path d="M16 10V16H22" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
)

const ProfileIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 24L10 14L16 18L28 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const EndIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="8" width="16" height="16" fill="white"/>
  </svg>
)

const nodeIcons: Record<NodeType, React.FC> = {
  start: PlayIcon,
  parameter: LetterPIcon,
  prompt: PromptIcon,
  instrument: InstrumentIcon,
  wait: WaitIcon,
  profile: ProfileIcon,
  end: EndIcon,
}

const WorkflowNode: React.FC<WorkflowNodeProps> = ({
  id,
  type,
  label,
  subtitle,
  x,
  y,
  isSelected = false,
  isConnecting = false,
  onPositionChange,
  onSelect,
  onStartConnect,
  onCompleteConnect,
}) => {
  const Icon = nodeIcons[type]
  const color = nodeColors[type]
  const nodeRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.connector')) return
    e.preventDefault()
    setIsDragging(true)
    const rect = nodeRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
    onSelect(id)
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = nodeRef.current?.parentElement
      if (!canvas) return
      const canvasRect = canvas.getBoundingClientRect()
      const newX = e.clientX - canvasRect.left - dragOffset.x
      const newY = e.clientY - canvasRect.top - dragOffset.y
      onPositionChange(id, Math.max(0, newX), Math.max(0, newY))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, id, onPositionChange])

  const handleConnectorClick = (e: React.MouseEvent, isOutput: boolean) => {
    e.stopPropagation()
    if (isOutput) {
      onStartConnect(id)
    } else {
      onCompleteConnect(id)
    }
  }

  return (
    <div
      ref={nodeRef}
      className={`absolute flex items-center bg-white border-2 rounded-3xl cursor-move transition-shadow select-none ${
        isSelected ? 'border-bio-primary shadow-lg' : 'border-[rgba(191,191,191,0.56)] hover:shadow-md'
      } ${isConnecting ? 'ring-2 ring-green-400 ring-offset-2' : ''}`}
      style={{
        left: x,
        top: y,
        height: '82px',
        minWidth: subtitle ? '280px' : '160px',
        zIndex: isDragging || isSelected ? 100 : 1,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Input Connector (Left) */}
      {type !== 'start' && (
        <div
          className="connector absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-400 rounded-full cursor-pointer hover:border-bio-primary hover:bg-blue-50 transition-colors z-10"
          onClick={(e) => handleConnectorClick(e, false)}
          title="Connecter ici"
        />
      )}

      {/* Icon Box */}
      <div
        className="w-[50px] h-[48px] flex items-center justify-center rounded-[12px] ml-3 flex-shrink-0"
        style={{ backgroundColor: color }}
      >
        <Icon />
      </div>

      {/* Content */}
      <div className="flex-1 px-3 min-w-0">
        <p className="text-lg font-medium text-bio-dark truncate">{label}</p>
        {subtitle && (
          <>
            <div className="w-full h-px bg-[rgba(191,191,191,0.56)] my-0.5" />
            <p className="text-xs font-medium text-[#727272] truncate">{subtitle}</p>
          </>
        )}
      </div>

      {/* Output Connector (Right) */}
      {type !== 'end' && (
        <div
          className="connector absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-400 rounded-full cursor-pointer hover:border-bio-primary hover:bg-blue-50 transition-colors z-10"
          onClick={(e) => handleConnectorClick(e, true)}
          title="Créer une connexion"
        />
      )}
    </div>
  )
}

export default WorkflowNode
