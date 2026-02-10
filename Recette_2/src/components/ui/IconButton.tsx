import React from 'react'

type IconButtonVariant = 'primary' | 'secondary' | 'ghost'
type IconButtonSize = 'sm' | 'md' | 'lg'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant
  size?: IconButtonSize
  children: React.ReactNode
}

const variantClasses: Record<IconButtonVariant, string> = {
  primary: 'bg-bio-primary text-white hover:bg-blue-600',
  secondary: 'bg-white text-bio-dark border border-bio-border hover:bg-gray-50',
  ghost: 'text-bio-gray hover:text-bio-dark hover:bg-gray-100',
}

const sizeClasses: Record<IconButtonSize, string> = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
}

const IconButton: React.FC<IconButtonProps> = ({
  variant = 'ghost',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg transition-colors ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default IconButton
