import React from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-bio-bg relative">
      <Header />
      <div className="flex-1 relative overflow-hidden">
        <Sidebar />
        <main className="ml-[174px] h-full">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
