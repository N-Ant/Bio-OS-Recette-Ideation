import React, { useState } from 'react'

const RecipeIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6H20M4 12H20M4 18H20" stroke="#4A4F56" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const ReduceIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 12H5" stroke="#4A4F56" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const AddIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const MoreIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="5" r="2" fill="#626262"/>
    <circle cx="12" cy="12" r="2" fill="#626262"/>
    <circle cx="12" cy="19" r="2" fill="#626262"/>
  </svg>
)

const CheckboxIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="3" stroke="#4A4F56" strokeWidth="1.5" fill="none"/>
    <path d="M7 12L10 15L17 8" stroke="#4A4F56" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const FilterIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6H20M6 12H18M9 18H15" stroke="#4A4F56" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const ImportIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3V15M12 15L8 11M12 15L16 11" stroke="#2B2B2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 17V19C4 20.1 4.9 21 6 21H18C19.1 21 20 20.1 20 19V17" stroke="#2B2B2B" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

interface RecipeItemProps {
  name: string
  isSelected?: boolean
  onClick?: () => void
}

const RecipeItem: React.FC<RecipeItemProps> = ({ name, isSelected = false, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center justify-between px-2 h-8 rounded-lg cursor-pointer transition-colors ${
      isSelected
        ? 'border-2 border-[rgba(32,149,232,0.7)]'
        : 'hover:bg-gray-50'
    }`}
  >
    <span className="text-base font-medium text-[#626262]">{name}</span>
    <button className="w-6 h-6 flex items-center justify-center">
      <MoreIcon />
    </button>
  </div>
)

const recipes = [
  { id: '1', name: 'Grow-A' },
  { id: '2', name: 'Grow-B' },
  { id: '3', name: 'Feed-1' },
  { id: '4', name: 'Mix-1' },
  { id: '5', name: 'O₂-Opt' },
  { id: '6', name: 'Base-1' },
]

const RecipePanel: React.FC = () => {
  const [selectedId, setSelectedId] = useState('1')

  return (
    <div className="w-[395px] bg-white border border-[rgba(192,192,192,0.32)] rounded-[17px] flex flex-col" style={{ height: '639px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-3">
          <RecipeIcon />
          <span className="text-base font-medium text-bio-dark">Recette</span>
        </div>
        <button className="w-6 h-6 flex items-center justify-center">
          <ReduceIcon />
        </button>
      </div>

      {/* New Recipe Button */}
      <div className="px-4 py-4">
        <button className="w-full h-10 bg-[#323232] text-white text-base font-medium rounded-lg flex items-center justify-center gap-1">
          <span>New Recipe</span>
          <AddIcon />
        </button>
      </div>

      {/* Filters */}
      <div className="px-4 pb-4 flex gap-2">
        <button className="flex-1 h-12 flex items-center justify-center gap-1 bg-white border border-[#d0d5dd] rounded-lg">
          <CheckboxIcon />
          <span className="text-base font-medium text-[#626262]">Cases à cocher</span>
        </button>
        <button className="flex-1 h-12 flex items-center justify-center gap-1 bg-white border border-[#d0d5dd] rounded-lg">
          <FilterIcon />
          <span className="text-base font-medium text-bio-dark">Filter</span>
        </button>
      </div>

      {/* Recipe List */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="space-y-2">
          {recipes.map((recipe) => (
            <RecipeItem
              key={recipe.id}
              name={recipe.name}
              isSelected={selectedId === recipe.id}
              onClick={() => setSelectedId(recipe.id)}
            />
          ))}
        </div>
      </div>

      {/* Import Button */}
      <div className="px-4 py-4 flex justify-center">
        <button className="h-[42px] px-2 flex items-center gap-2 border border-[rgba(191,191,191,0.54)] rounded-lg">
          <ImportIcon />
          <span className="text-sm font-medium text-[#2b2b2b]">Import Recipe</span>
        </button>
      </div>
    </div>
  )
}

export default RecipePanel
