// MiniMax M2.1 AI Service

const API_KEY = 'sk-api-wYlfcEA1rKSu1vVTZSseG2OPoMsQHHzq14fGcQonDHTLTM_unCWlQ6w7AlYihP4MF-Z8O6dFJ2AbHRvOfLff9nRlweDC53BT8AmS_gjh_zxyh0fMK8aX0Bs';
const BASE_URL = 'https://api.minimax.io/v1';

const SYSTEM_PROMPT = `Tu es un assistant IA pour créer des recettes de bioréacteur dans un éditeur visuel.

TYPES DE BLOCS DISPONIBLES:
- start: Bloc de démarrage (1 seul par recette)
- end: Bloc de fin
- parameter: Définir des paramètres (pH, Temperature, DO%, etc.)
- instrument: Exécuter une séquence DCU (calibration, nettoyage, etc.)
- wait: Attendre une durée
- profile: Courbe de progression d'un paramètre
- operator-prompt: Demander confirmation à l'opérateur

VARIABLES DISPONIBLES: pH, DO%, Temperature, Agitation, ProcessTime, Pressure, Flow, Level, CO2, O2

SÉQUENCES DCU: pH Calibration, DO Calibration, CIP Cleaning Cycle, SIP Sterilization, Foam Control Sequence, Feed Pump Prime, Harvest Sequence

QUAND L'UTILISATEUR DEMANDE UNE RECETTE, RÉPONDS AVEC DES COMMANDES JSON:

Pour créer des blocs:
{"cmd": "CREATE_BLOCK", "type": "parameter", "x": 280, "y": 100, "label": "Init pH", "config": {"setpoints": [{"variable": "pH", "value": "7.0", "unit": ""}]}}

Pour créer des connexions:
{"cmd": "CREATE_CONNECTION", "fromIndex": 0, "toIndex": 1}

Pour ajouter une condition sur un fil:
{"cmd": "SET_CONDITION", "connectionIndex": 0, "variable": "pH", "operator": ">", "value": 7}

IMPORTANT:
- Commence TOUJOURS par un bloc "start" 
- Termine par un ou plusieurs blocs "end"
- Les indices (fromIndex, toIndex) correspondent à l'ordre de création des blocs
- Pour des branches parallèles, crée plusieurs connexions depuis le même bloc source

Si l'utilisateur pose une question générale, réponds normalement en français.
Si l'utilisateur demande de créer quelque chose, génère les commandes JSON une par ligne SANS les mentionner dans ta réponse textuelle.

IMPORTANT POUR LES RÉPONSES:
- Ne JAMAIS mentionner "JSON", "commandes", "code" ou termes techniques
- Répondre naturellement: "Je crée votre recette..." ou "Voici votre recette..."
- Décrire ce qui est créé de façon simple

Réponds de manière concise et professionnelle en français.`;

export interface AICommand {
  cmd: 'CREATE_BLOCK' | 'CREATE_CONNECTION' | 'SET_CONDITION' | 'TEXT';
  type?: string;
  x?: number;
  y?: number;
  label?: string;
  config?: any;
  fromIndex?: number;
  toIndex?: number;
  connectionIndex?: number;
  variable?: string;
  operator?: string;
  value?: number;
  text?: string;
}

export async function callMiniMaxAI(userMessage: string, conversationHistory: {role: string; content: string}[] = []): Promise<{text: string; commands: AICommand[]}> {
  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'MiniMax-M2',
        messages,
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '';
    
    // Remove <think> tags and their content
    const content = rawContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    // Parse commands from response
    const commands: AICommand[] = [];
    const textParts: string[] = [];

    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip markdown code blocks and empty json
      if (trimmed.startsWith('```') || trimmed === '```') {
        continue;
      }
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const cmd = JSON.parse(trimmed);
          if (cmd.cmd) {
            commands.push(cmd);
          }
        } catch {
          textParts.push(line);
        }
      } else if (trimmed) {
        textParts.push(trimmed);
      }
    }

    // Filter out any mentions of JSON or technical terms
    const cleanText = textParts
      .filter(line => !line.toLowerCase().includes('json') && 
                      !line.toLowerCase().includes('commande') &&
                      !line.toLowerCase().includes('code'))
      .join('\n');

    return {
      text: cleanText,
      commands
    };
  } catch (error) {
    console.error('AI Service Error:', error);
    return {
      text: "Désolé, je rencontre une erreur de connexion. Veuillez réessayer.",
      commands: []
    };
  }
}
