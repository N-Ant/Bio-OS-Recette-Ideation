import React from 'react'

const CheckboxIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M4 8L7 11L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const FilterIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 4H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M4 8H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M6 12H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const RecipeFilters: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-bio-gray hover:text-bio-dark hover:bg-gray-100 rounded transition-colors">
        <CheckboxIcon />
        <span>Cases à cocher</span>
      </button>
      <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-bio-gray hover:text-bio-dark hover:bg-gray-100 rounded transition-colors">
        <FilterIcon />
        <span>Filter</span>
      </button>
    </div>
  )
}

export default RecipeFilters
