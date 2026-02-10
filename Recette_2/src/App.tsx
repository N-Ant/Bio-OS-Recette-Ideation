import React from 'react'
import { Layout } from './components/layout'
import { RecipePanel } from './components/recipe'
import { OperationPanel } from './components/operation'
import { LibraryPanel } from './components/library'
import { WorkflowCanvas } from './components/workflow'
import { WorkflowProvider } from './context/WorkflowContext'

const App: React.FC = () => {
  return (
    <WorkflowProvider>
      <Layout>
        <div className="flex gap-4 p-4 h-full">
          {/* Left Side Panels */}
          <RecipePanel />
          <OperationPanel />

          {/* Center - Workflow Canvas */}
          <WorkflowCanvas />

          {/* Right Side Panel */}
          <LibraryPanel />
        </div>
      </Layout>
    </WorkflowProvider>
  )
}

export default App
