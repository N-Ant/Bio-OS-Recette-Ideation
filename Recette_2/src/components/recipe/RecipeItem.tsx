import React from 'react'

interface RecipeItemProps {
  name: string
  isSelected?: boolean
  onClick?: () => void
}

const MoreIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="3" r="1.5" fill="currentColor" />
    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    <circle cx="8" cy="13" r="1.5" fill="currentColor" />
  </svg>
)

const RecipeItem: React.FC<RecipeItemProps> = ({ name, isSelected = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors group ${
        isSelected
          ? 'bg-bio-primary text-white'
          : 'hover:bg-gray-100 text-bio-dark'
      }`}
    >
      <span className="text-sm font-medium">{name}</span>
      <button
        className={`w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity ${
          isSelected ? 'hover:bg-blue-600' : 'hover:bg-gray-200'
        }`}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <MoreIcon />
      </button>
    </div>
  )
}

export default RecipeItem
