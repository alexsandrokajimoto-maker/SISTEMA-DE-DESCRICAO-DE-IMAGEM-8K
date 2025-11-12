
import { GoogleGenAI, Type } from '@google/genai';
import { GenerationResult, AspectRatio } from '../types';

const MODEL_NAME = 'gemini-2.5-flash-image';
const MAX_FILE_SIZE_MB = 25;

const buildPrompt = (aspectRatio: AspectRatio): string => `
Estou fornecendo uma imagem. Por favor, analise-a minuciosamente e gere uma descrição de altíssima fidelidade para re-renderização em 8K em modelos de geração de imagem. O objetivo é replicar a imagem com a maior precisão possível.

A resposta deve ser um objeto JSON com duas propriedades: \`description8K\` (string) e \`suggestedTechnicalSpecs\` (array de strings).

---
## \`description8K\` (String - 1 a 3 parágrafos):
Descreva a imagem seguindo esta ordem lógica, usando frases curtas, separadas por vírgulas e ponto e vírgula quando útil. Seja neutro e observacional, evitando invenções; se algo for incerto, use "indeterminado", "parece", "provável".

1.  **Assunto & Cena:** Cenário (interno/externo), época do dia/estação, ação/pose, enquadramento (close-up, meio corpo, plano aberto, vista aérea).
2.  **Composição:** Regra dos terços/centralizado/simetria, profundidade de campo, linhas-guia, perspectiva (ângulo alto/baixo/ocular), proporção aproximada (estimada, mas considere a proporção ${aspectRatio}).
3.  **Elementos Visuais:** Pessoas/objetos/arquitetura/natureza; trajes e acessórios; textura e material (metal, vidro, tecido, pele, madeira).
4.  **Iluminação:** Tipo (natural, softbox, néon, contraluz, rim light), direção, dureza, intensidade, temperatura (quente/fria), sombras/reflexos.
5.  **Cores:** Paleta dominante (ex.: "tons terrosos com acentos ciano"), saturação/contraste.
6.  **Estética/Estilo:** Realista/cinematográfico/minimalista/vintage/anime/ilustração/3D; referência suave a movimentos ou técnicas (ex.: "noir", "bokeh pronunciado").
7.  **Detalhes Finos:** Pele/poros/cabelos/grão; padrões (listras, xadrez); escrita/placas (copie o texto visível fielmente, se legível).
8.  **Pós-processamento:** Granulação, bloom, vinheta, nitidez, HDR, tonal mapping.
9.  **Restrições/Negatives:** "sem cortes de cabeça/mãos", "sem artefatos", "sem ruído", "sem banding".

---
## \`suggestedTechnicalSpecs\` (Array de Strings - lista com marcadores):
Forneça uma lista de especificações técnicas relevantes, como:

*   **Resolução alvo:** 7680x4320 (8K).
*   **Proporção:** ${aspectRatio}.
*   **Câmera/Óptica (se fotográfico):** Tipo de lente (grande angular/50mm/tele), abertura (estimada: f/1.8–f/8), distância focal aproximada, profundidade de campo.
*   **Render/Engine (se parecer 3D):** Possível engine/renderer (ex.: path tracing), nível de detalhamento (subdiv alta, displacement), displacement), SSS, DOF.
*   **Iluminação:** Key/fill/rim, temperatura (K) aproximada.
*   **Pós-processamento:** Sharpening leve, redução de ruído, tone mapping suave.
*   **Seed/Variação:** "usar seed fixa para consistência; variar <5% para ajustes finos".
*   **Texto na imagem:** Se houver texto legível, transcreva-o exatamente.

Lembre-se: não alucine. Marque como "indeterminado" o que não for visível/óbvio. Priorize precisão descritiva a adjetivos vagos. Mantenha termos técnicos coerentes. Não inclua dados pessoais não visíveis.
`;

export const generate8KDescription = async (
  base64Image: string,
  mimeType: string,
  selectedAspectRatio: AspectRatio,
): Promise<GenerationResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY não está configurada. Por favor, forneça uma chave de API.");
  }

  // Ensure the image size is within limits (this check is also done on client side, but good for backend too)
  const imageSize = (base64Image.length * 3) / 4 - (base64Image.endsWith('==') ? 2 : base64Image.endsWith('=') ? 1 : 0);
  if (imageSize / (1024 * 1024) > MAX_FILE_SIZE_MB) {
    throw new Error(`O tamanho da imagem excede o limite de ${MAX_FILE_SIZE_MB} MB.`);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imagePart = {
    inlineData: {
      mimeType: mimeType,
      data: base64Image,
    },
  };
  const textPart = {
    text: buildPrompt(selectedAspectRatio),
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description8K: { type: Type.STRING },
            suggestedTechnicalSpecs: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['description8K', 'suggestedTechnicalSpecs'],
        },
        // Smaller thinkingBudget for Flash models when maxOutputTokens is not explicitly set,
        // as the model decides when and how much to think by default.
        thinkingConfig: { thinkingBudget: 0 } 
      },
    });

    const jsonStr = response.text.trim();
    // Some models might wrap JSON in markdown code blocks
    let cleanedJsonStr = jsonStr.startsWith('\`\`\`json') && jsonStr.endsWith('\`\`\`')
      ? jsonStr.substring(7, jsonStr.length - 3).trim()
      : jsonStr;

    const result: GenerationResult = JSON.parse(cleanedJsonStr);
    return result;
  } catch (error) {
    console.error('Erro ao gerar descrição 8K:', error);
    // Attempt to parse specific error messages for better user feedback
    if (error instanceof Error) {
      if (error.message.includes("400 Bad Request") || error.message.includes("Failed to parse JSON response")) {
        throw new Error("Formato de resposta inválido do modelo. Tente novamente ou use outra imagem.");
      }
      if (error.message.includes("500 Internal Server Error")) {
        throw new Error("Erro interno do servidor. Por favor, tente novamente mais tarde.");
      }
      if (error.message.includes("429 Too Many Requests")) {
        throw new Error("Muitas requisições. Por favor, espere um pouco e tente novamente.");
      }
      throw new Error(`Falha na API Gemini: ${error.message}`);
    }
    throw new Error('Ocorreu um erro desconhecido ao gerar a descrição.');
  }
};
