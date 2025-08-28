import { GoogleGenAI, Type, Modality } from '@google/genai';
import { ClosetItem } from '../types';

// IMPORTANT: The application now uses live API calls. Ensure your API key is set up.
const USE_MOCK_DATA = false;

const getAi = () => {
    // This function initializes the Gemini client.
    // It requires the API_KEY to be set in your environment variables.
    if (process.env.GEMINI_API_KEY) {
        return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    // If the API key is not set, we cannot proceed with live calls.
    throw new Error("API_KEY environment variable not set. Please configure your API key to use the application.");
}

export const suggestOutfit = async (
  userImage: { data: string; mimeType: string },
  closetItems: ClosetItem[],
  purpose: string
): Promise<{ image: string; items: ClosetItem[] }> => {
  if (USE_MOCK_DATA) {
    // Mock data is kept for testing/fallback but is disabled by default.
    return mockSuggestOutfit(closetItems);
  }
  
  const ai = getAi();

  // Step 1: Use Gemini text model to select items
  const selectedItems = await selectItemsWithAI(ai, closetItems, purpose);
  // console.log('[Gemini] selectItemsWithAI returned', {
//     requestedClosetCount: closetItems.length,
//     selectedCount: selectedItems.length,
//     selectedIds: selectedItems.map(i => i.id)
//   });
  if (selectedItems.length === 0) {
    throw new Error("AI could not select an outfit. Try adding more items or changing the purpose.");
  }
  
  // Step 2: Use Gemini image preview model to generate the outfit image
  const generatedImage = await generateOutfitImageWithAI(ai, userImage, selectedItems);
  // console.log('[Gemini] generateOutfitImageWithAI returned image length', generatedImage?.length);

  return {
    image: `data:image/png;base64,${generatedImage}`,
    items: selectedItems,
  };
};

// --- Mock Implementation (for testing) ---
const mockSuggestOutfit = async (
  closetItems: ClosetItem[]
): Promise<{ image: string; items: ClosetItem[] }> => {
  // console.log("Using mock data for outfit suggestion.");
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay

  const shuffled = [...closetItems].sort(() => 0.5 - Math.random());
  const selectedItems = shuffled.slice(0, Math.min(3, shuffled.length));

  if (selectedItems.length === 0) {
      return { image: 'https://picsum.photos/512/512', items: [] };
  }
  const mockImageUrl = 'https://picsum.photos/512/512?random=' + Math.random();
  return { image: mockImageUrl, items: selectedItems };
};


// --- Real API Implementations ---

const selectItemsWithAI = async (
    ai: GoogleGenAI,
    closetItems: ClosetItem[], 
    purpose: string
): Promise<ClosetItem[]> => {
    const headerText = `You will be shown a set of clothing items as images. Each image is preceded by a text line that includes an 'id' and maybe some 'tags' for that item. You may also be provided with the purpose for which you have decide the outfit, like for a wedding or a casual day. Always keep that in mind. If no purpose is given, suggest the best outfit overall. Select a coherent outfit by choosing one top, one bottom, and one pair of shoes if available. Respond ONLY with JSON following the provided schema.
    ${purpose.length>0 ? `Purpose: "${purpose}".` : ""}`;

    const parts: Array<any> = [{ text: headerText }];
    for (const item of closetItems) {
        const { data, mimeType } = base64fromDataUrl(item.image);
        parts.push({ text: `ITEM_META id: ${item.id} | tags: ${item.tags.join(', ')}` });
        parts.push({ inlineData: { data, mimeType } });
    }

    // console.log('[Gemini] selectItemsWithAI sending parts', {
    //     itemCount: closetItems.length,
    //     partsLength: parts.length,
    //     mimeTypes: closetItems.map(i => i.mimeType)
    // });

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    selected_item_ids: {
                        type: Type.ARRAY,
                        description: "An array of the string IDs of the selected items.",
                        items: { type: Type.STRING }
                    },
                    reasoning: {
                        type: Type.STRING,
                        description: "A brief reason for your selection."
                    }
                },
                required: ["selected_item_ids"]
            },
        },
    });

    const jsonResponse = JSON.parse(response.text);
    // console.log('[Gemini] selectItemsWithAI response', jsonResponse);
    const selectedIds = new Set(jsonResponse.selected_item_ids || []);
    
    return closetItems.filter(item => selectedIds.has(item.id));
};

/**
 * Helper to extract base64 data and mime type from a data URL.
 */
const base64fromDataUrl = (dataUrl: string): { data: string, mimeType: string } => {
    const parts = dataUrl.split(',');
    const mimeType = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
    const data = parts[1];
    return { data, mimeType };
}

const generateOutfitImageWithAI = async (
    ai: GoogleGenAI,
    userImage: { data: string; mimeType: string },
    selectedItems: ClosetItem[]
): Promise<string> => {
    const clothingImageParts = selectedItems.map(item => {
        const { data, mimeType } = base64fromDataUrl(item.image);
        return {
            inlineData: { data, mimeType }
        };
    });

    const userImagePart = {
        inlineData: {
            data: userImage.data,
            mimeType: userImage.mimeType,
        },
    };

    // console.log('[Gemini] Building request parts', {
    //   userImageMimeType: userImage.mimeType,
    //   userImageDataLen: userImage.data?.length,
    //   clothingPartsCount: clothingImageParts.length,
    //   clothingMimeTypes: selectedItems.map(i => i.mimeType)
    // });

    const itemDescriptionsText = selectedItems.map(item => item.tags.join(', ')).join(' and ');

    const prompt = `Virtually try on these clothes. The first image is the person; the following images are clothing items to apply. Edit the first image so the person is wearing a complete outfit composed ONLY of: ${itemDescriptionsText}. Generate a full-body image of the same person wearing these items.

STRICT RULES (follow ALL):
- MUST REPLACE every original garment with the provided items. The original outfit must not remain visible in any part of the image.
- MUST place the provided items on the body realistically: correct fit, drape, seams, and occlusion around arms, waist, legs, and neck.
- MUST preserve the person's identity: face, hair, body shape, skin tone, pose, expression, and lighting from the first image.
- MUST preserve the original background exactly. Do not blur, replace, or crop it.
- MUST keep the provided items' colors, patterns, textures, and logos exactly as shown. Do not recolor or restyle.
- MUST include the full person head-to-toe (no unexpected cropping) and keep natural proportions.
- MUST ensure correct layering: tops over torso, bottoms at waist/legs, footwear on feet. Add realistic shadows and intersections where fabrics meet.
- NEVER invent extra garments, accessories, or colors not present in the provided items.
- NEVER modify the person's physical attributes, face, or hair.

QUALITY TARGET:
- Photorealistic output with clean edges and natural shadows; no artifacts, watermarks, or text overlays.
- Clothing should look worn, not pasted: match perspective, wrinkles, and fabric behavior.

IF ANY ITEM IS MISSING OR UNCHANGED AFTER YOUR FIRST PASS:
- Internally refine and output the corrected image so that all original garments are replaced by the provided items.

OUTPUT FORMAT:
- Return only the edited image as inlineData with no additional text.`;


    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [
                userImagePart,
                ...clothingImageParts,
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    // console.log('[Gemini] Response candidates', {
    //   candidateCount: response.candidates?.length,
    //   firstCandidateParts: response.candidates?.[0]?.content?.parts?.length,
    //   safety: response.candidates?.[0]?.safetyRatings,
    // });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return part.inlineData.data; // Return the base64 image data
        }
    }

    throw new Error("The AI did not return an image. Please try again.");
};