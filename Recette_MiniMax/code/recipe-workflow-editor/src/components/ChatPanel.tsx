import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, GraduationCap, Zap, Loader2, Sparkles } from 'lucide-react';
import { useStore } from '../store';
import AICursor from './AICursor';
import { callMiniMaxAI, AICommand } from '../services/aiService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isTyping?: boolean;
}

export default function ChatPanel() {
  const { addBlock, addConnection, setConfigModalBlockId, updateBlock, updateConnection, setEditingConnectionId, selectOperation, addOperation } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'learning' | 'fast'>('learning');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Bonjour! Je suis votre assistant IA pour créer des recettes. Que souhaitez-vous faire?' }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // État du curseur IA
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [cursorLabel, setCursorLabel] = useState('');
  const [cursorClicking, setCursorClicking] = useState(false);
  const [cursorTyping, setCursorTyping] = useState('');
  const [cursorVisible, setCursorVisible] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), role, content }]);
  };

  const simulateTyping = async (text: string, delay = 50) => {
    const msgId = Date.now().toString();
    setMessages(prev => [...prev, { id: msgId, role: 'assistant', content: '', isTyping: true }]);
    
    for (let i = 0; i <= text.length; i++) {
      await new Promise(r => setTimeout(r, delay));
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: text.slice(0, i) } : m));
    }
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isTyping: false } : m));
  };

  const executeWithDelay = async (actions: { message: string; action: () => void }[]) => {
    for (const { message, action } of actions) {
      if (mode === 'learning') {
        await simulateTyping(message, 30);
        await new Promise(r => setTimeout(r, 800));
      }
      action();
      if (mode === 'learning') {
        await new Promise(r => setTimeout(r, 500));
      }
    }
  };

  // Exécuter les commandes générées par l'IA
  const executeAICommands = async (commands: AICommand[]) => {
    const createdBlockIds: string[] = [];
    const createdConnectionIds: string[] = [];
    
    // S'assurer qu'on utilise l'opération existante
    const currentState = useStore.getState();
    const currentRecipe = currentState.recipes.find(r => r.id === currentState.selectedRecipeId);
    if (currentRecipe && currentRecipe.operations.length > 0 && !currentState.selectedOperationId) {
      selectOperation(currentRecipe.operations[0].id);
    }
    
    const canvasArea = document.getElementById('canvas-area');
    const canvasRect = canvasArea?.getBoundingClientRect();
    const canvasX = canvasRect ? canvasRect.left : 300;
    const canvasY = canvasRect ? canvasRect.top : 100;

    for (const cmd of commands) {
      if (cmd.cmd === 'CREATE_BLOCK') {
        // Force vertical layout: fixed X, incremental Y
        const x = 280;
        const y = createdBlockIds.length * 120 + 20;
        
        if (mode === 'learning') {
          setCursorVisible(true);
          setCursorLabel(`Création: ${cmd.label || cmd.type}`);
          setCursorPos({ x: canvasX + x + 95, y: canvasY + y + 33 });
          setCursorClicking(true);
          await new Promise(r => setTimeout(r, 400));
          setCursorClicking(false);
        }
        
        addBlock(cmd.type as any, x, y);
        await new Promise(r => setTimeout(r, 200));
        
        // Récupérer l'ID du bloc créé
        const state = useStore.getState();
        const recipe = state.recipes.find(r => r.id === state.selectedRecipeId);
        const op = recipe?.operations.find(o => o.id === state.selectedOperationId);
        const lastBlockId = op?.blocks[op.blocks.length - 1]?.id || '';
        createdBlockIds.push(lastBlockId);
        
        // Appliquer config et label
        if (cmd.config || cmd.label) {
          updateBlock(lastBlockId, { 
            config: cmd.config, 
            label: cmd.label,
            subtitle: cmd.config?.setpoints?.[0]?.variable ? 
              `${cmd.config.setpoints[0].variable}=${cmd.config.setpoints[0].value}` : undefined
          });
        }
        
        if (mode === 'learning') {
          addMessage('assistant', `   ✓ Bloc "${cmd.label || cmd.type}" créé`);
          await new Promise(r => setTimeout(r, 300));
        }
      }
      else if (cmd.cmd === 'CREATE_CONNECTION') {
        const fromId = createdBlockIds[cmd.fromIndex || 0];
        const toId = createdBlockIds[cmd.toIndex || 1];
        
        if (fromId && toId) {
          addConnection(fromId, toId);
          await new Promise(r => setTimeout(r, 150));
          
          // Récupérer l'ID de la connexion
          const state = useStore.getState();
          const recipe = state.recipes.find(r => r.id === state.selectedRecipeId);
          const op = recipe?.operations.find(o => o.id === state.selectedOperationId);
          const lastConnId = op?.connections[op.connections.length - 1]?.id || '';
          createdConnectionIds.push(lastConnId);
          
          if (mode === 'learning') {
            setCursorLabel('Connexion créée');
            await new Promise(r => setTimeout(r, 200));
          }
        }
      }
      else if (cmd.cmd === 'SET_CONDITION') {
        const connId = createdConnectionIds[cmd.connectionIndex || 0];
        if (connId && cmd.variable && cmd.operator && cmd.value !== undefined) {
          updateConnection(connId, {
            condition: {
              variable: cmd.variable,
              operator: cmd.operator as any,
              value: cmd.value
            }
          });
          
          if (mode === 'learning') {
            addMessage('assistant', `   🔗 Condition: ${cmd.variable} ${cmd.operator} ${cmd.value}`);
            await new Promise(r => setTimeout(r, 300));
          }
        }
      }
    }
    
    if (mode === 'learning') {
      setCursorVisible(false);
      setCursorLabel('');
    }
  };

  // Appel à l'API MiniMax
  const [isThinking, setIsThinking] = useState(false);
  
  const callAI = async (userMessage: string) => {
    try {
      setIsThinking(true);
      const response = await callMiniMaxAI(userMessage);
      setIsThinking(false);
      
      if (response.text) {
        if (mode === 'learning') {
          await simulateTyping(response.text, 15);
        } else {
          addMessage('assistant', response.text);
        }
      }
      
      if (response.commands.length > 0) {
        if (mode === 'learning') {
          await simulateTyping(`📋 Exécution de ${response.commands.length} commandes...`, 20);
          await new Promise(r => setTimeout(r, 500));
        }
        await executeAICommands(response.commands);
        
        if (mode === 'learning') {
          await simulateTyping("✅ Recette générée par l'IA!", 20);
        } else {
          addMessage('assistant', `✅ ${response.commands.length} éléments créés.`);
        }
      }
    } catch (error) {
      setIsThinking(false);
      addMessage('assistant', "❌ Erreur de communication avec l'IA. Réessayez.");
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || isProcessing) return;
    
    const originalMessage = input.trim();
    const userMessage = originalMessage.toLowerCase();
    addMessage('user', originalMessage);
    setInput('');
    setIsProcessing(true);

    await new Promise(r => setTimeout(r, 500));

    // Pattern matching for commands
    // Détection du type de recette
    const isComplexe = userMessage.includes('complexe') || userMessage.includes('plusieurs opérations') || 
                       userMessage.includes('plusieurs operations') || userMessage.includes('4 opérations') ||
                       userMessage.includes('4 operations') || userMessage.includes('complète') || 
                       userMessage.includes('complete') || userMessage.includes('multi');
    const isBranche = userMessage.includes('branche') || userMessage.includes('parallele') || userMessage.includes('parallèle') || 
                      userMessage.includes('condition') || userMessage.includes('décision') || userMessage.includes('decision') ||
                      userMessage.includes('choix') || userMessage.includes('selon') || userMessage.match(/\bsi\b/);
    const isSimple = (userMessage.includes('simple') || userMessage.includes('basique') || userMessage.includes('linéaire') || 
                      userMessage.includes('lineaire') || userMessage.includes('fermentation') || userMessage.includes('e.coli') ||
                      userMessage.includes('recette')) && !isComplexe && !isBranche;

    // === RECETTE SIMPLE (1 opération) ===
    if (isSimple) {
      // Helpers pour animation
      const getElementCenter = (selector: string): { x: number; y: number } | null => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      };
      
      const moveCursor = async (x: number, y: number, label: string, duration = 600) => {
        setCursorLabel(label);
        setCursorPos({ x, y });
        await new Promise(r => setTimeout(r, duration));
      };
      
      const clickAt = async (x: number, y: number, label: string) => {
        await moveCursor(x, y, label, 500);
        setCursorClicking(true);
        await new Promise(r => setTimeout(r, 250));
        setCursorClicking(false);
        await new Promise(r => setTimeout(r, 300));
      };
      
      const typeText = async (text: string, charDelay = 80) => {
        for (let i = 0; i <= text.length; i++) {
          setCursorTyping(text.slice(0, i));
          await new Promise(r => setTimeout(r, charDelay));
        }
        await new Promise(r => setTimeout(r, 400));
        setCursorTyping('');
      };

      const blocksToCreate = [
        { type: 'start' as const, name: 'Start', config: null, subtitle: '', showPopup: false },
        { type: 'parameter' as const, name: 'Init pH/Temp', 
          config: { setpoints: [{ variable: 'pH', value: '7.0', unit: '' }, { variable: 'Temperature', value: '37', unit: '°C' }] }, 
          subtitle: 'pH=7.0, Temp=37°C', showPopup: true },
        { type: 'instrument' as const, name: 'Calibration DO', 
          config: { sequence: 'DO Calibration', forceRestart: false }, subtitle: 'DO Calibration', showPopup: true },
        { type: 'wait' as const, name: 'Incubation', 
          config: { duration: 30, unit: 'min' }, subtitle: '30 minutes', showPopup: true },
        { type: 'profile' as const, name: 'Rampe Temp', 
          config: { points: [{ time: 0, value: 25 }, { time: 60, value: 37 }], variable: 'Temperature', unit: '°C' }, 
          subtitle: 'Rampe 25→37°C', showPopup: true },
        { type: 'end' as const, name: 'End', config: null, subtitle: '', showPopup: false }
      ];

      const canvasArea = document.getElementById('canvas-area');
      const canvasRect = canvasArea?.getBoundingClientRect();
      const canvasX = canvasRect ? canvasRect.left : 300;
      const canvasY = canvasRect ? canvasRect.top : 100;

      if (mode === 'learning') {
        setCursorVisible(true);
        await simulateTyping("Je vais créer une recette simple (1 opération)...", 25);
        await new Promise(r => setTimeout(r, 600));
      }

      const createdBlockIds: string[] = [];
      
      for (let i = 0; i < blocksToCreate.length; i++) {
        const block = blocksToCreate[i];
        const y = i * 120 + 20;
        const x = 280;
        const blockScreenX = canvasX + x + 95;
        const blockScreenY = canvasY + y + 33;
        
        if (mode === 'learning') {
          await clickAt(blockScreenX, blockScreenY, `Création: ${block.name}`);
        }
        
        addBlock(block.type, x, y);
        await new Promise(r => setTimeout(r, 200));
        
        const currentState = useStore.getState();
        const currentRecipe = currentState.recipes.find(r => r.id === currentState.selectedRecipeId);
        const currentOp = currentRecipe?.operations.find(o => o.id === currentState.selectedOperationId);
        
        if (currentOp && currentOp.blocks.length > 0) {
          const lastBlockId = currentOp.blocks[currentOp.blocks.length - 1].id;
          createdBlockIds.push(lastBlockId);
          
          // Connexion
          if (createdBlockIds.length > 1) {
            addConnection(createdBlockIds[createdBlockIds.length - 2], lastBlockId);
            if (mode === 'learning') {
              setCursorLabel('Connexion créée');
              await new Promise(r => setTimeout(r, 300));
            }
          }
          
          // Popup configuration avec animation
          if (block.config && block.showPopup && mode === 'learning') {
            await clickAt(blockScreenX, blockScreenY, 'Double-clic pour configurer');
            setConfigModalBlockId(lastBlockId);
            await new Promise(r => setTimeout(r, 800));
            
            // Aller vers le champ sous-titre
            const subtitlePos = getElementCenter('[data-ai-target="block-subtitle"]');
            if (subtitlePos) {
              await moveCursor(subtitlePos.x, subtitlePos.y, 'Édition sous-titre', 500);
              await typeText(block.subtitle, 60);
            }
            
            // Clic sur Sauvegarder
            const savePos = getElementCenter('[data-ai-target="save-button"]');
            if (savePos) {
              await clickAt(savePos.x, savePos.y, 'Enregistrer');
            }
            
            updateBlock(lastBlockId, { config: block.config, subtitle: block.subtitle, label: block.name });
            addMessage('assistant', `   ⚙️ ${block.name}: ${block.subtitle}`);
            
            setConfigModalBlockId(null);
            await new Promise(r => setTimeout(r, 400));
          } else if (block.config) {
            updateBlock(lastBlockId, { config: block.config, subtitle: block.subtitle, label: block.name });
          }
        }
        
        await new Promise(r => setTimeout(r, 300));
      }

      if (mode === 'learning') {
        setCursorVisible(false);
        setCursorLabel('');
        await simulateTyping("\n✅ Recette simple créée! 6 blocs dans 1 opération.", 25);
      } else {
        addMessage('assistant', '✅ Recette simple créée! 6 blocs: Start → Parameter → Instrument → Wait → Profile → End');
      }
    }
    // === RECETTE COMPLEXE (4 opérations) ===
    else if (isComplexe) {
      const moveCursor = async (x: number, y: number, label: string, duration = 400) => {
        setCursorLabel(label);
        setCursorPos({ x, y });
        await new Promise(r => setTimeout(r, duration));
      };

      const operationsToCreate = [
        { name: 'Préparation', blocks: [
          { type: 'start' as const, name: 'Start', config: null, subtitle: '' },
          { type: 'parameter' as const, name: 'Init pH/Temp', 
            config: { setpoints: [{ variable: 'pH', value: '7.0', unit: '' }, { variable: 'Temperature', value: '37', unit: '°C' }] }, 
            subtitle: 'pH=7.0, Temp=37°C' },
          { type: 'instrument' as const, name: 'Calibration DO', 
            config: { sequence: 'DO Calibration', forceRestart: false }, subtitle: 'DO Calibration' },
          { type: 'end' as const, name: 'End', config: null, subtitle: '' }
        ]},
        { name: 'Fermentation', blocks: [
          { type: 'start' as const, name: 'Start', config: null, subtitle: '' },
          { type: 'profile' as const, name: 'Rampe Temp', 
            config: { points: [{ time: 0, value: 25 }, { time: 60, value: 37 }], variable: 'Temperature', unit: '°C' }, 
            subtitle: 'Rampe 25→37°C' },
          { type: 'wait' as const, name: 'Incubation', 
            config: { duration: 120, unit: 'min' }, subtitle: '120 minutes' },
          { type: 'end' as const, name: 'End', config: null, subtitle: '' }
        ]},
        { name: 'Récolte', blocks: [
          { type: 'start' as const, name: 'Start', config: null, subtitle: '' },
          { type: 'operator-prompt' as const, name: 'Confirmation', 
            config: { message: 'Confirmer récolte?' }, subtitle: 'Attente opérateur' },
          { type: 'parameter' as const, name: 'Arrêt agitation', 
            config: { setpoints: [{ variable: 'Agitation', value: '0', unit: 'rpm' }] }, subtitle: 'Agitation=0' },
          { type: 'end' as const, name: 'End', config: null, subtitle: '' }
        ]},
        { name: 'Nettoyage', blocks: [
          { type: 'start' as const, name: 'Start', config: null, subtitle: '' },
          { type: 'instrument' as const, name: 'CIP Cycle', 
            config: { sequence: 'CIP Cleaning Cycle', forceRestart: false }, subtitle: 'CIP Cleaning' },
          { type: 'end' as const, name: 'End', config: null, subtitle: '' }
        ]}
      ];

      const canvasArea = document.getElementById('canvas-area');
      const canvasRect = canvasArea?.getBoundingClientRect();
      const canvasX = canvasRect ? canvasRect.left : 300;
      const canvasY = canvasRect ? canvasRect.top : 100;

      if (mode === 'learning') {
        setCursorVisible(true);
        await simulateTyping("Je vais créer une recette complexe avec 4 opérations...", 25);
        await new Promise(r => setTimeout(r, 600));
      }

      for (let opIdx = 0; opIdx < operationsToCreate.length; opIdx++) {
        const opDef = operationsToCreate[opIdx];
        
        if (opIdx > 0) {
          addOperation(opDef.name);
          await new Promise(r => setTimeout(r, 200));
        } else {
          const state = useStore.getState();
          const recipe = state.recipes.find(r => r.id === state.selectedRecipeId);
          if (recipe && recipe.operations[0]) {
            selectOperation(recipe.operations[0].id);
          }
        }
        
        if (mode === 'learning') {
          await simulateTyping(`\n📋 Opération ${opIdx + 1}: ${opDef.name}`, 15);
        }
        
        const createdBlockIds: string[] = [];
        
        for (let i = 0; i < opDef.blocks.length; i++) {
          const block = opDef.blocks[i];
          const y = i * 120 + 20;
          const x = 280;
          
          if (mode === 'learning') {
            await moveCursor(canvasX + x + 95, canvasY + y + 33, `Ajout: ${block.name}`, 300);
            setCursorClicking(true);
            await new Promise(r => setTimeout(r, 150));
            setCursorClicking(false);
          }
          
          addBlock(block.type, x, y);
          await new Promise(r => setTimeout(r, 100));
          
          const currentState = useStore.getState();
          const currentRecipe = currentState.recipes.find(r => r.id === currentState.selectedRecipeId);
          const currentOp = currentRecipe?.operations.find(o => o.id === currentState.selectedOperationId);
          
          if (currentOp && currentOp.blocks.length > 0) {
            const lastBlockId = currentOp.blocks[currentOp.blocks.length - 1].id;
            createdBlockIds.push(lastBlockId);
            
            if (createdBlockIds.length > 1) {
              addConnection(createdBlockIds[createdBlockIds.length - 2], lastBlockId);
            }
            
            if (block.config) {
              updateBlock(lastBlockId, { config: block.config, subtitle: block.subtitle, label: block.name });
            }
          }
        }
        
        if (mode === 'learning') {
          addMessage('assistant', `   ✅ ${opDef.name}: ${opDef.blocks.length} blocs`);
        }
      }

      if (mode === 'learning') {
        setCursorVisible(false);
        await simulateTyping("\n✅ Recette complexe créée! 4 opérations.", 25);
      } else {
        addMessage('assistant', '✅ Recette complexe créée! 4 opérations: Préparation, Fermentation, Récolte, Nettoyage.');
      }
    } 
    else if (isBranche) {
      // === RECETTE AVEC BRANCHES PARALLÈLES ET CONDITIONS SUR LES FILS ===
      
      const getElementCenter = (selector: string): { x: number; y: number } | null => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      };
      
      const moveCursor = async (x: number, y: number, label: string, duration = 600) => {
        setCursorLabel(label);
        setCursorPos({ x, y });
        await new Promise(r => setTimeout(r, duration));
      };
      
      const clickAt = async (x: number, y: number, label: string) => {
        await moveCursor(x, y, label, 500);
        setCursorClicking(true);
        await new Promise(r => setTimeout(r, 250));
        setCursorClicking(false);
        await new Promise(r => setTimeout(r, 300));
      };
      
      const typeText = async (text: string, charDelay = 80) => {
        for (let i = 0; i <= text.length; i++) {
          setCursorTyping(text.slice(0, i));
          await new Promise(r => setTimeout(r, charDelay));
        }
        await new Promise(r => setTimeout(r, 400));
        setCursorTyping('');
      };
      
      const canvasArea = document.getElementById('canvas-area');
      const canvasRect = canvasArea?.getBoundingClientRect();
      const canvasX = canvasRect ? canvasRect.left : 300;
      const canvasY = canvasRect ? canvasRect.top : 100;
      
      const blockIds: Record<string, string> = {};
      
      const createBlockAt = async (type: any, x: number, y: number, name: string) => {
        if (mode === 'learning') {
          await clickAt(canvasX + x + 95, canvasY + y + 33, `Création: ${name}`);
        }
        addBlock(type, x, y);
        await new Promise(r => setTimeout(r, 200));
        const state = useStore.getState();
        const recipe = state.recipes.find(r => r.id === state.selectedRecipeId);
        const op = recipe?.operations.find(o => o.id === state.selectedOperationId);
        return op?.blocks[op.blocks.length - 1]?.id || '';
      };
      
      const connectWithCondition = async (fromId: string, toId: string, condition?: { variable: string; operator: string; value: number }) => {
        addConnection(fromId, toId);
        await new Promise(r => setTimeout(r, 200));
        
        if (condition && mode === 'learning') {
          // Récupérer la connexion créée
          const state = useStore.getState();
          const recipe = state.recipes.find(r => r.id === state.selectedRecipeId);
          const op = recipe?.operations.find(o => o.id === state.selectedOperationId);
          const conn = op?.connections[op.connections.length - 1];
          
          if (conn) {
            // Trouver position du fil (milieu entre les 2 blocs)
            const fromBlock = op?.blocks.find(b => b.id === fromId);
            const toBlock = op?.blocks.find(b => b.id === toId);
            if (fromBlock && toBlock) {
              const midX = canvasX + (fromBlock.x + toBlock.x) / 2 + 95;
              const midY = canvasY + (fromBlock.y + toBlock.y) / 2 + 50;
              
              await clickAt(midX, midY, 'Clic sur le fil');
              await simulateTyping(`Ajout condition: ${condition.variable} ${condition.operator} ${condition.value}`, 20);
              
              // Ouvrir modal
              setEditingConnectionId(conn.id);
              await new Promise(r => setTimeout(r, 800));
              
              await typeText(`${condition.value}`, 80);
              
              // Appliquer
              updateConnection(conn.id, { 
                condition: { 
                  variable: condition.variable, 
                  operator: condition.operator as any, 
                  value: condition.value 
                } 
              });
              
              setEditingConnectionId(null);
              await new Promise(r => setTimeout(r, 400));
              
              addMessage('assistant', `   🔗 Condition: ${condition.variable} ${condition.operator} ${condition.value}`);
            }
          }
        } else if (condition) {
          // Mode rapide: appliquer directement
          const state = useStore.getState();
          const recipe = state.recipes.find(r => r.id === state.selectedRecipeId);
          const op = recipe?.operations.find(o => o.id === state.selectedOperationId);
          const conn = op?.connections[op.connections.length - 1];
          if (conn) {
            updateConnection(conn.id, { 
              condition: { 
                variable: condition.variable, 
                operator: condition.operator as any, 
                value: condition.value 
              } 
            });
          }
        }
      };
      
      if (mode === 'learning') {
        setCursorVisible(true);
        await simulateTyping("Je vais créer une recette avec BRANCHES PARALLÈLES et CONDITIONS sur les fils...", 20);
        await new Promise(r => setTimeout(r, 600));
      }
      
      // Créer les blocs
      blockIds['start'] = await createBlockAt('start', 280, 20, 'Start');
      
      blockIds['param'] = await createBlockAt('parameter', 280, 100, 'Mesure pH');
      addConnection(blockIds['start'], blockIds['param']);
      updateBlock(blockIds['param'], { config: { setpoints: [{ variable: 'pH', value: '7.0', unit: '' }] }, subtitle: 'Mesure pH' });
      
      if (mode === 'learning') {
        await simulateTyping("Maintenant je crée 2 branches parallèles avec conditions différentes sur les fils...", 20);
        await new Promise(r => setTimeout(r, 500));
      }
      
      // === BRANCHE 1: pH > 7 → Continuer normalement ===
      blockIds['branch1'] = await createBlockAt('instrument', 120, 220, 'Branche pH OK');
      await connectWithCondition(blockIds['param'], blockIds['branch1'], { variable: 'pH', operator: '>', value: 7 });
      updateBlock(blockIds['branch1'], { config: { sequence: 'DO Calibration', forceRestart: false }, subtitle: 'Continuer' });
      
      blockIds['wait1'] = await createBlockAt('wait', 120, 320, 'Attente');
      addConnection(blockIds['branch1'], blockIds['wait1']);
      updateBlock(blockIds['wait1'], { config: { duration: 30, unit: 'min' }, subtitle: '30 min' });
      
      // === BRANCHE 2: pH <= 7 → Ajustement ===
      blockIds['branch2'] = await createBlockAt('parameter', 440, 220, 'Branche Ajust');
      await connectWithCondition(blockIds['param'], blockIds['branch2'], { variable: 'pH', operator: '<=', value: 7 });
      updateBlock(blockIds['branch2'], { config: { setpoints: [{ variable: 'pH', value: '7.5', unit: '' }] }, subtitle: 'Ajuster pH' });
      
      blockIds['wait2'] = await createBlockAt('wait', 440, 320, 'Attente ajust');
      addConnection(blockIds['branch2'], blockIds['wait2']);
      updateBlock(blockIds['wait2'], { config: { duration: 15, unit: 'min' }, subtitle: '15 min' });
      
      // === FIN COMMUNE ===
      blockIds['end'] = await createBlockAt('end', 280, 420, 'End');
      addConnection(blockIds['wait1'], blockIds['end']);
      addConnection(blockIds['wait2'], blockIds['end']);
      
      if (mode === 'learning') {
        setCursorLabel('');
        setCursorVisible(false);
        await simulateTyping("✅ Recette avec 2 branches parallèles créée!", 20);
        await new Promise(r => setTimeout(r, 300));
        await simulateTyping("📝 Branche 1: pH > 7 → Continue | Branche 2: pH ≤ 7 → Ajuste", 20);
      } else {
        addMessage('assistant', '✅ Recette avec branches parallèles créée! Conditions sur les fils: pH > 7 et pH ≤ 7');
      }
    }
    else if (userMessage.includes('do%') || userMessage.includes('po2')) {
      if (mode === 'learning') {
        await simulateTyping("Cliquez sur un fil entre 2 blocs pour ajouter une condition DO% ou pO2.", 25);
      } else {
        addMessage('assistant', "Cliquez sur un fil → '+ Condition' → définissez DO% < 35.");
      }
    }
    else if (userMessage.includes('profile') || userMessage.includes('rampe') || userMessage.includes('courbe')) {
      if (mode === 'learning') {
        await simulateTyping("La Profile Phase permet de définir une évolution progressive d'un paramètre dans le temps.", 25);
        await new Promise(r => setTimeout(r, 300));
        await simulateTyping("📊 Elle contient une courbe avec des points (Temps, Valeur).", 25);
        await new Promise(r => setTimeout(r, 300));
        await simulateTyping("➜ Double-cliquez sur un bloc Profile pour éditer la courbe. Vous pouvez ajouter des points et voir le graphique se mettre à jour.", 25);
      } else {
        addMessage('assistant', "Profile Phase = courbe temps/valeur. Double-cliquez pour éditer les points.");
      }
    }
    else if (userMessage.includes('optimise') || userMessage.includes('améliore')) {
      if (mode === 'learning') {
        await simulateTyping("Je vais analyser votre recette actuelle...", 25);
        await new Promise(r => setTimeout(r, 500));
        await simulateTyping("💡 Suggestions d'optimisation:", 25);
        await new Promise(r => setTimeout(r, 300));
        await simulateTyping("1. Ajoutez des conditions sur les transitions pour un meilleur contrôle", 25);
        await new Promise(r => setTimeout(r, 300));
        await simulateTyping("2. Utilisez des variables personnalisées pour des formules complexes", 25);
        await new Promise(r => setTimeout(r, 300));
        await simulateTyping("3. Considérez l'ajout de phases de monitoring avec Operator Prompt", 25);
      } else {
        addMessage('assistant', "💡 Optimisations: 1) Ajoutez des conditions sur transitions 2) Utilisez des variables personnalisées 3) Ajoutez des points de contrôle opérateur");
      }
    }
    else if (userMessage.includes('aide') || userMessage.includes('help') || userMessage.includes('comment')) {
      const helpText = mode === 'learning' 
        ? "Voici ce que je peux faire:\n• 'Recette simple' - 1 opération, 6 blocs\n• 'Recette complexe' - 4 opérations\n• 'Recette branche' - parallélisme + conditions\n• 'Profile' - tutoriel courbes"
        : "Commandes: recette simple, recette complexe, recette branche, profile";
      
      if (mode === 'learning') {
        await simulateTyping(helpText, 20);
      } else {
        addMessage('assistant', helpText);
      }
    }
    else {
      // Appeler l'IA MiniMax pour les demandes non reconnues
      await callAI(originalMessage);
    }

    setIsProcessing(false);
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform z-50"
        >
          <Bot size={24} />
        </button>
      )}

      {/* Slide-in panel */}
      <div className={`fixed top-0 right-0 h-full w-72 sm:w-80 bg-white shadow-2xl transform transition-transform duration-300 z-50 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot size={20} />
            <span className="font-semibold">Assistant IA</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded">
            <X size={18} />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="p-3 border-b bg-gray-50 flex gap-2">
          <button
            onClick={() => setMode('learning')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors ${mode === 'learning' ? 'bg-amber-500 text-white' : 'bg-white border text-gray-600 hover:bg-gray-100'}`}
          >
            <GraduationCap size={14} /> Apprentissage
          </button>
          <button
            onClick={() => setMode('fast')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors ${mode === 'fast' ? 'bg-blue-500 text-white' : 'bg-white border text-gray-600 hover:bg-gray-100'}`}
          >
            <Zap size={14} /> Rapide
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-500 text-white rounded-br-sm' 
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}>
                {msg.content}
                {msg.isTyping && <span className="animate-pulse">▊</span>}
              </div>
            </div>
          ))}
          {(isProcessing || isThinking) && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-xl px-4 py-3 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t bg-white">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Tapez votre message..."
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isProcessing}
            />
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !input.trim()}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </div>
          <div className="text-xs text-gray-400 mt-2 text-center">
            Essayez: "Crée une recette de fermentation"
          </div>
        </div>
      </div>

      {/* Backdrop when open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* AI Cursor overlay for learning mode */}
      <AICursor
        x={cursorPos.x}
        y={cursorPos.y}
        label={cursorLabel}
        isClicking={cursorClicking}
        typingText={cursorTyping}
        visible={cursorVisible}
      />
    </>
  );
}
