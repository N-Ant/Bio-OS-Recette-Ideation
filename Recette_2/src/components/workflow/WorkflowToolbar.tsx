import React from 'react'

const HandIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 16V8C10 6.9 10.9 6 12 6C13.1 6 14 6.9 14 8V16" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 14V6C14 4.9 14.9 4 16 4C17.1 4 18 4.9 18 6V14" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 14V8C18 6.9 18.9 6 20 6C21.1 6 22 6.9 22 8V18C22 23.5 18.5 28 14 28C9.5 28 6 23.5 6 18V14C6 12.9 6.9 12 8 12C9.1 12 10 12.9 10 14" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const CursorIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 6L14 26L17 17L26 14L6 6Z" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const UndoIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 12H21C23.76 12 26 14.24 26 17C26 19.76 23.76 22 21 22H15" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 7L7 12L12 17" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const RedoIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M25 12H11C8.24 12 6 14.24 6 17C6 19.76 8.24 22 11 22H17" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 7L25 12L20 17" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

interface ToolButtonProps {
  children: React.ReactNode
  isActive?: boolean
  onClick?: () => void
}

const ToolButton: React.FC<ToolButtonProps> = ({ children, isActive = false, onClick }) => (
  <button
    onClick={onClick}
    className={`w-8 h-8 flex items-center justify-center rounded-[14px] transition-colors ${
      isActive ? 'bg-[#e0e0e0]' : 'hover:bg-gray-100'
    }`}
  >
    {children}
  </button>
)

const WorkflowToolbar: React.FC = () => {
  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-10 px-6 py-2.5 bg-white rounded-[32px] shadow-[0px_4px_4px_0px_rgba(150,150,150,0.21)] border border-[rgba(205,205,205,0.57)]" style={{ height: '62px', width: '269px' }}>
      <ToolButton isActive>
        <HandIcon />
      </ToolButton>
      <ToolButton>
        <CursorIcon />
      </ToolButton>
      <ToolButton>
        <UndoIcon />
      </ToolButton>
      <ToolButton>
        <RedoIcon />
      </ToolButton>
    </div>
  )
}

export default WorkflowToolbar
