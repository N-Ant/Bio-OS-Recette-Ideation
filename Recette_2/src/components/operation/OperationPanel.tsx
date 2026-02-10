import React, { useState } from 'react'

const ReduceIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 12H5" stroke="#4A4F56" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const PlusIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5V19M5 12H19" stroke="#b2b2b2" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

interface OperationItemProps {
  number: number
  name: string
  isSelected?: boolean
  onClick?: () => void
}

const OperationItem: React.FC<OperationItemProps> = ({ number, name, isSelected = false, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center h-[42px] rounded-2xl cursor-pointer overflow-hidden ${
      isSelected
        ? 'border-2 border-[#2095e8] bg-white'
        : 'border border-[rgba(191,191,191,0.56)] bg-white'
    }`}
  >
    {/* Number Badge */}
    <div className={`w-9 h-full flex items-center justify-center ${isSelected ? 'bg-[#323232]' : 'bg-[#666]'}`}>
      <span className="text-xs font-medium text-white">{number}</span>
    </div>
    {/* Name */}
    <span className="flex-1 px-3 text-xs font-medium text-bio-dark">{name}</span>
  </div>
)

const operations = [
  { id: '1', number: 1, name: 'Preparation' },
  { id: '2', number: 2, name: 'Inoculation' },
  { id: '3', number: 3, name: 'Batch' },
]

const OperationPanel: React.FC = () => {
  const [selectedId, setSelectedId] = useState('1')

  return (
    <div className="w-[186px] bg-white border border-[rgba(192,192,192,0.32)] rounded-2xl flex flex-col" style={{ height: '289px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14">
        <span className="text-base font-medium text-bio-dark">Operation</span>
        <button className="w-6 h-6 flex items-center justify-center">
          <ReduceIcon />
        </button>
      </div>

      {/* Vertical Line */}
      <div className="absolute left-[104px] top-[71px] w-px h-[135px] bg-gray-400 hidden" />

      {/* Operation List */}
      <div className="flex-1 px-4 space-y-3">
        {operations.map((op) => (
          <OperationItem
            key={op.id}
            number={op.number}
            name={op.name}
            isSelected={selectedId === op.id}
            onClick={() => setSelectedId(op.id)}
          />
        ))}
      </div>

      {/* Add Button */}
      <div className="px-4 pb-4">
        <button className="w-full h-[42px] flex items-center justify-center border border-dashed border-[rgba(178,178,178,0.5)] rounded-md hover:bg-gray-50">
          <PlusIcon />
        </button>
      </div>
    </div>
  )
}

export default OperationPanel
