import React, { useRef, useState } from 'react'
import WorkflowNode from './WorkflowNode'
import WorkflowToolbar from './WorkflowToolbar'
import { useWorkflow, NodeType } from '../../context/WorkflowContext'

const EyeIcon: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 6C1 6 3 2 6 2C9 2 11 6 11 6C11 6 9 10 6 10C3 10 1 6 1 6Z" stroke="#4A4F56" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="6" cy="6" r="1.5" stroke="#4A4F56" strokeWidth="1.5"/>
  </svg>
)

const ReduceIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 6L15 12L9 18" stroke="#4A4F56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// Connection line component
interface ConnectionLineProps {
  fromX: number
  fromY: number
  toX: number
  toY: number
  isTemp?: boolean
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({ fromX, fromY, toX, toY, isTemp = false }) => {
  // Calculate control points for bezier curve
  const midX = (fromX + toX) / 2
  const dx = Math.abs(toX - fromX)
  const controlOffset = Math.min(dx * 0.5, 100)

  const path = `M ${fromX} ${fromY} C ${fromX + controlOffset} ${fromY}, ${toX - controlOffset} ${toY}, ${toX} ${toY}`

  return (
    <path
      d={path}
      stroke={isTemp ? '#0075c9' : '#9ca3af'}
      strokeWidth={isTemp ? 3 : 2}
      strokeDasharray={isTemp ? '5,5' : 'none'}
      fill="none"
      className="pointer-events-none"
    />
  )
}

const WorkflowCanvas: React.FC = () => {
  const {
    nodes,
    connections,
    selectedNodeId,
    connectingFromId,
    updateNodePosition,
    selectNode,
    addNode,
    startConnecting,
    completeConnection,
    cancelConnecting,
  } = useWorkflow()

  const canvasRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // Handle mouse move for temporary connection line
  const handleMouseMove = (e: React.MouseEvent) => {
    if (connectingFromId && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  // Handle canvas click to cancel connecting
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      selectNode(null)
      if (connectingFromId) {
        cancelConnecting()
      }
    }
  }

  // Handle drop from library
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const data = e.dataTransfer.getData('application/json')
    if (data && canvasRef.current) {
      const { type, label } = JSON.parse(data) as { type: NodeType; label: string }
      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left - 80
      const y = e.clientY - rect.top - 41
      addNode({ type, label, x: Math.max(0, x), y: Math.max(0, y) })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  // Get node center position for connections
  const getNodeConnectionPoint = (nodeId: string, isOutput: boolean) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return { x: 0, y: 0 }
    const width = node.subtitle ? 280 : 160
    return {
      x: isOutput ? node.x + width : node.x,
      y: node.y + 41, // half of node height (82px)
    }
  }

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 h-14 bg-[#f2f2f2] border border-[rgba(233,233,233,0.45)] rounded-2xl mx-4 mt-4">
        <ol className="list-decimal list-inside text-base font-medium text-bio-dark ml-2">
          <li>Preparation</li>
        </ol>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-2.5 py-2.5 border border-[rgba(74,79,86,0.7)] rounded-[14px]">
            <EyeIcon />
            <span className="text-base font-medium text-bio-dark">Aperçu</span>
          </button>
          <button className="w-6 h-6 flex items-center justify-center">
            <ReduceIcon />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-auto bg-bio-bg"
        onMouseMove={handleMouseMove}
        onClick={handleCanvasClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* Connection Lines SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          {/* Existing connections */}
          {connections.map(conn => {
            const from = getNodeConnectionPoint(conn.fromNodeId, true)
            const to = getNodeConnectionPoint(conn.toNodeId, false)
            return (
              <ConnectionLine
                key={conn.id}
                fromX={from.x}
                fromY={from.y}
                toX={to.x}
                toY={to.y}
              />
            )
          })}

          {/* Temporary connection line while connecting */}
          {connectingFromId && (
            <ConnectionLine
              fromX={getNodeConnectionPoint(connectingFromId, true).x}
              fromY={getNodeConnectionPoint(connectingFromId, true).y}
              toX={mousePos.x}
              toY={mousePos.y}
              isTemp
            />
          )}
        </svg>

        {/* Workflow Nodes */}
        {nodes.map(node => (
          <WorkflowNode
            key={node.id}
            id={node.id}
            type={node.type}
            label={node.label}
            subtitle={node.subtitle}
            x={node.x}
            y={node.y}
            isSelected={selectedNodeId === node.id}
            isConnecting={connectingFromId !== null && connectingFromId !== node.id}
            onPositionChange={updateNodePosition}
            onSelect={selectNode}
            onStartConnect={startConnecting}
            onCompleteConnect={completeConnection}
          />
        ))}

        {/* Instructions overlay when connecting */}
        {connectingFromId && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-bio-primary text-white px-4 py-2 rounded-lg shadow-lg z-50">
            Cliquez sur un connecteur d'entrée (cercle gauche) pour connecter, ou cliquez ailleurs pour annuler
          </div>
        )}

        {/* Toolbar */}
        <WorkflowToolbar />
      </div>
    </div>
  )
}

export default WorkflowCanvas
