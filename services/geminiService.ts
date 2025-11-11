
import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getTranslations = async (words: string[]): Promise<{ [key: string]: string }> => {
  const properties: { [key: string]: { type: Type, description: string } } = {};
  words.forEach(word => {
    properties[word.replace(/\s+/g, '_')] = { // Replace spaces with underscores for valid keys
      type: Type.STRING,
      description: `The Korean translation for '${word}'.`
    };
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Translate the English words provided in the schema into Korean.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: properties,
        },
      },
    });
    
    const text = response.text.trim();
    const result = JSON.parse(text);

    const finalResult: { [key: string]: string } = {};
    for (const key in result) {
        const originalWord = key.replace(/_/g, ' ');
        finalResult[originalWord] = result[key];
    }
    
    return finalResult;
  } catch (error) {
    console.error("Error fetching translations from Gemini API:", error);
    throw new Error("Failed to get translations from Gemini.");
  }
};

export const generateImage = async (word: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A simple, clear, child-friendly cartoon illustration of "${word}" on a plain white background.`,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:image/png;base64,${base64ImageBytes}`;
      }
    }
    throw new Error("No image data found in the response.");

  } catch (error) {
    console.error(`Error generating image for "${word}":`, error);
    throw new Error(`Failed to generate image for "${word}".`);
  }
};

export const getAudioForWord = async (word: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: word }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // A clear, friendly voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return base64Audio;
    }
    throw new Error("No audio data found in the response.");

  } catch (error) {
    console.error(`Error generating audio for "${word}":`, error);
    throw new Error(`Failed to generate audio for "${word}".`);
  }
};

export const generateExampleSentence = async (word: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create one simple English example sentence for an elementary school student using the word "${word}". Only return the sentence itself.`,
    });
    let sentence = response.text.trim();
    // Remove potential markdown like quotes
    sentence = sentence.replace(/^["']|["']$/g, '');
    return sentence;
  } catch (error) {
    console.error(`Error generating example sentence for "${word}":`, error);
    throw new Error(`Failed to generate example sentence for "${word}".`);
  }
};
