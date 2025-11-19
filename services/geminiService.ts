import { GoogleGenAI, Type, Modality } from "@google/genai";
import { BrandIdentity } from "../types";

// Helper to initialize AI client
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// 1. Generate Brand Strategy (Text/JSON)
export const generateBrandStrategy = async (mission: string): Promise<Omit<BrandIdentity, 'logoUrl' | 'videoUrl'>> => {
  const ai = getAiClient();
  
  const prompt = `
    Actúa como un experto en branding de clase mundial y diseño gráfico.
    Basado en la siguiente misión de la empresa: "${mission}".
    
    Genera una identidad de marca completa en formato JSON.
    La respuesta debe incluir:
    1. Un nombre creativo para la empresa (si la misión no lo especifica explícitamente).
    2. Un eslogan (tagline) pegadizo en español.
    3. Una paleta de colores de 5 colores hexadecimales con nombres y notas de uso.
    4. 2 sugerencias de emparejamiento de fuentes de Google Fonts (header y body).
    5. Un prompt muy detallado y artístico para generar un logotipo moderno y minimalista. El prompt del logo debe estar en inglés para mejorar la compatibilidad con el modelo de imagen.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          companyName: { type: Type.STRING },
          tagline: { type: Type.STRING },
          missionStatement: { type: Type.STRING }, // Return the refined mission
          colors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                hex: { type: Type.STRING },
                name: { type: Type.STRING },
                usage: { type: Type.STRING },
              }
            }
          },
          fonts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                header: { type: Type.STRING },
                body: { type: Type.STRING },
                reasoning: { type: Type.STRING },
              }
            }
          },
          logoPrompt: { type: Type.STRING },
        },
        required: ["companyName", "tagline", "colors", "fonts", "logoPrompt"]
      }
    }
  });

  if (!response.text) throw new Error("No se pudo generar la estrategia de marca.");
  
  const data = JSON.parse(response.text);
  // Ensure mission is passed through if model didn't return it ideally, but schema has it.
  return { ...data, missionStatement: mission };
};

// 2. Generate Logo (Imagen 4.0)
export const generateLogo = async (prompt: string): Promise<string> => {
  const ai = getAiClient();
  
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: `${prompt}, white background, high quality, vector style, minimal`,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio: '1:1',
    },
  });

  const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
  if (!base64ImageBytes) throw new Error("Falló la generación de imagen.");
  
  return `data:image/jpeg;base64,${base64ImageBytes}`;
};

// 3. Edit Image (Gemini 2.5 Flash Image - Nano Banana)
export const editBrandImage = async (imageBase64: string, editInstruction: string): Promise<string> => {
  const ai = getAiClient();
  
  // Remove header if present for the payload
  const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: 'image/jpeg', 
          },
        },
        {
          text: editInstruction,
        },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  const part = response.candidates?.[0]?.content?.parts?.[0];
  if (part && part.inlineData) {
    return `data:image/png;base64,${part.inlineData.data}`;
  }
  
  throw new Error("No se pudo editar la imagen.");
};

// 4. Generate Video (Veo 3.1)
export const animateBrandAsset = async (imageBase64: string, prompt: string = "Cinematic slow motion movement"): Promise<string> => {
  // Important: For Veo, we must ensure the correct key is selected via the UI helper if available
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
          throw new Error("API_KEY_MISSING");
      }
  }

  // Re-instantiate client to ensure it picks up the potentially newly selected key
  const ai = getAiClient();
  
  const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    image: {
      imageBytes: cleanBase64,
      mimeType: 'image/jpeg', // Assuming generic jpeg for uploaded/generated content
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p', // Fast preview supports 720p
      aspectRatio: '16:9'
    }
  });

  // Polling loop
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("No se generó enlace de video.");

  // Fetch the actual video bytes
  const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const videoBlob = await videoResponse.blob();
  return URL.createObjectURL(videoBlob);
};
