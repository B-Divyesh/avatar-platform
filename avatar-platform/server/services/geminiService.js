// client/src/services/geminiService.js

import axios from 'axios';

/**
 * Service for interacting with the Google Gemini API
 * Handles content generation for presentations and other AI tasks
 */

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

/**
 * Generate presentation content using Gemini API
 * @param {Object} options - Content generation options
 * @param {string} options.url - URL to generate content from
 * @param {string} options.text - Text to generate content from
 * @param {string} options.template - Template style to use
 * @param {number} options.slideCount - Number of slides to generate (optional)
 * @returns {Promise<Object>} Generated presentation content
 */
export const generateContentWithGemini = async (options) => {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    let prompt = '';
    let contentSource = '';

    // Build the prompt based on the source type
    if (options.url) {
      prompt = `Create a professional presentation based on the content from this website: ${options.url}. `;
      contentSource = `URL: ${options.url}`;
    } else if (options.text) {
      prompt = `Create a professional presentation based on this content: "${options.text.substring(0, 1000)}". `;
      contentSource = 'Text input';
    } else if (options.fileContent) {
      prompt = `Create a professional presentation based on this content: "${options.fileContent.substring(0, 1000)}". `;
      contentSource = `File: ${options.fileName || 'Uploaded file'}`;
    } else {
      throw new Error('No content source provided for generation');
    }

    // Add template instructions
    prompt += `Use the "${options.template}" presentation style. `;
    
    // Add slide count if specified
    if (options.slideCount) {
      prompt += `Create approximately ${options.slideCount} slides. `;
    }

    // Add detailed instructions for output format
    prompt += `Format your response as JSON with the following structure:
    {
      "title": "Presentation title",
      "slides": [
        {
          "title": "Slide title",
          "content": ["bullet point 1", "bullet point 2"],
          "notes": "Speaker notes for this slide"
        }
      ]
    }`;

    // Make the API request to Gemini
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract and parse the JSON response
    const textResponse = response.data.candidates[0].content.parts[0].text;
    
    // Extract JSON from the response
    const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/) || 
                      textResponse.match(/{[\s\S]*}/) ||
                      null;
    
    let presentationData;
    
    if (jsonMatch) {
      try {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        presentationData = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Error parsing JSON from Gemini response:', parseError);
        throw new Error('Failed to parse presentation data from AI response');
      }
    } else {
      throw new Error('No valid presentation data found in AI response');
    }

    // Add additional metadata
    return {
      ...presentationData,
      generatedFrom: contentSource,
      template: options.template,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating content with Gemini:', error);
    throw error;
  }
};

/**
 * Convert presentation data to PowerPoint compatible format
 * @param {Object} presentationData - Presentation data from Gemini
 * @returns {Object} Formatted presentation data for PowerPoint
 */
export const formatPresentationForPowerPoint = (presentationData) => {
  // Structure the data in a format expected by PowerPoint via MCP
  return {
    title: presentationData.title,
    template: presentationData.template || 'professional',
    slides: presentationData.slides.map(slide => ({
      title: slide.title,
      content: Array.isArray(slide.content) ? slide.content : [slide.content],
      notes: slide.notes || '',
    })),
    metadata: {
      createdAt: new Date().toISOString(),
      source: presentationData.generatedFrom || 'AI Generated',
      slideCount: presentationData.slides.length
    }
  };
};

/**
 * Generate HTML preview of the presentation
 * @param {Object} presentationData - Presentation data
 * @param {string} template - Template name
 * @returns {string} HTML preview of the presentation
 */
export const generatePreviewHTML = (presentationData, template = 'modern') => {
  // Define template color schemes
  const colors = {
    modern: {
      primary: "#2196F3",
      secondary: "#FFC107",
      bg: "#FFFFFF",
      text: "#212121",
    },
    professional: {
      primary: "#3F51B5",
      secondary: "#FF5722",
      bg: "#F5F5F5",
      text: "#212121",
    },
    creative: {
      primary: "#E91E63",
      secondary: "#CDDC39",
      bg: "#FFFFFF",
      text: "#212121",
    },
    minimal: {
      primary: "#607D8B",
      secondary: "#CFD8DC",
      bg: "#FFFFFF",
      text: "#212121",
    },
    corporate: {
      primary: "#0D47A1",
      secondary: "#FFC107",
      bg: "#FFFFFF",
      text: "#212121",
    },
  };

  const color = colors[template] || colors.modern;

  // Generate slides HTML
  let slidesHTML = '';
  const slides = presentationData.slides || [];
  
  for (let i = 0; i < Math.min(slides.length, 3); i++) {
    const slide = slides[i];
    const contentHTML = Array.isArray(slide.content) 
      ? `<ul>${slide.content.map(item => `<li>${item}</li>`).join('')}</ul>`
      : `<p>${slide.content || ''}</p>`;
    
    slidesHTML += `
      <div style="margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; border-radius: 4px; background-color: ${color.bg};">
        <h3 style="color: ${color.primary}; margin-bottom: 10px;">${slide.title || `Slide ${i+1}`}</h3>
        ${contentHTML}
      </div>
    `;
  }

  // Generate complete HTML preview
  return `
    <div style="font-family: Arial, sans-serif; color: ${color.text};">
      <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
        <strong>Template:</strong> ${template.charAt(0).toUpperCase() + template.slice(1)} |
        <strong>Source:</strong> ${presentationData.generatedFrom || 'AI Generated'}
      </div>
      <h2 style="color: ${color.primary}; margin-bottom: 20px;">${presentationData.title || 'Presentation Preview'}</h2>
      ${slidesHTML}
      <p style="font-style: italic; color: #666; margin-top: 20px;">
        * This is a preview. The full presentation contains ${slides.length} slides with complete content.
      </p>
    </div>
  `;
};