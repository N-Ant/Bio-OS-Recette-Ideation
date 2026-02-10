import React, { createContext, useContext, useState, useCallback } from 'react'

export type NodeType = 'start' | 'parameter' | 'prompt' | 'instrument' | 'wait' | 'profile' | 'end'

export interface WorkflowNode {
  id: string
  type: NodeType
  label: string
  subtitle?: string
  x: number
  y: number
}

export interface Connection {
  id: string
  fromNodeId: string
  toNodeId: string
}

interface WorkflowContextType {
  nodes: WorkflowNode[]
  connections: Connection[]
  selectedNodeId: string | null
  connectingFromId: string | null
  addNode: (node: Omit<WorkflowNode, 'id'>) => string
  updateNodePosition: (id: string, x: number, y: number) => void
  selectNode: (id: string | null) => void
  deleteNode: (id: string) => void
  startConnecting: (fromId: string) => void
  completeConnection: (toId: string) => void
  cancelConnecting: () => void
  deleteConnection: (id: string) => void
}

const WorkflowContext = createContext<WorkflowContextType | null>(null)

export const useWorkflow = () => {
  const context = useContext(WorkflowContext)
  if (!context) {
    throw new Error('useWorkflow must be used within WorkflowProvider')
  }
  return context
}

let nodeIdCounter = 0
const generateNodeId = () => `node_${++nodeIdCounter}`

let connectionIdCounter = 0
const generateConnectionId = () => `conn_${++connectionIdCounter}`

interface WorkflowProviderProps {
  children: React.ReactNode
}

export const WorkflowProvider: React.FC<WorkflowProviderProps> = ({ children }) => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    { id: 'node_1', type: 'start', label: 'Start', x: 120, y: 120 },
    { id: 'node_2', type: 'parameter', label: 'Regule Ph', subtitle: 'Ph Setpoint 7', x: 420, y: 190 },
    { id: 'node_3', type: 'prompt', label: 'Prompt', subtitle: 'Ph Setpoint 7', x: 250, y: 320 },
  ])

  const [connections, setConnections] = useState<Connection[]>([
    { id: 'conn_1', fromNodeId: 'node_1', toNodeId: 'node_2' },
    { id: 'conn_2', fromNodeId: 'node_2', toNodeId: 'node_3' },
  ])

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null)

  const addNode = useCallback((node: Omit<WorkflowNode, 'id'>) => {
    const id = generateNodeId()
    setNodes(prev => [...prev, { ...node, id }])
    return id
  }, [])

  const updateNodePosition = useCallback((id: string, x: number, y: number) => {
    setNodes(prev => prev.map(node =>
      node.id === id ? { ...node, x, y } : node
    ))
  }, [])

  const selectNode = useCallback((id: string | null) => {
    setSelectedNodeId(id)
  }, [])

  const deleteNode = useCallback((id: string) => {
    setNodes(prev => prev.filter(node => node.id !== id))
    setConnections(prev => prev.filter(conn =>
      conn.fromNodeId !== id && conn.toNodeId !== id
    ))
    if (selectedNodeId === id) {
      setSelectedNodeId(null)
    }
  }, [selectedNodeId])

  const startConnecting = useCallback((fromId: string) => {
    setConnectingFromId(fromId)
  }, [])

  const completeConnection = useCallback((toId: string) => {
    if (connectingFromId && connectingFromId !== toId) {
      // Check if connection already exists
      const exists = connections.some(
        conn => conn.fromNodeId === connectingFromId && conn.toNodeId === toId
      )
      if (!exists) {
        const id = generateConnectionId()
        setConnections(prev => [...prev, { id, fromNodeId: connectingFromId, toNodeId: toId }])
      }
    }
    setConnectingFromId(null)
  }, [connectingFromId, connections])

  const cancelConnecting = useCallback(() => {
    setConnectingFromId(null)
  }, [])

  const deleteConnection = useCallback((id: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== id))
  }, [])

  return (
    <WorkflowContext.Provider value={{
      nodes,
      connections,
      selectedNodeId,
      connectingFromId,
      addNode,
      updateNodePosition,
      selectNode,
      deleteNode,
      startConnecting,
      completeConnection,
      cancelConnecting,
      deleteConnection,
    }}>
      {children}
    </WorkflowContext.Provider>
  )
}
