const axios = require("axios");

// Base URL for Gemini API
const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

/**
 * Gemini AI Service for Avatar platform
 * Uses Google's Gemini API to generate presentations and summaries
 */
class GeminiService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.model = "models/gemini-1.5-pro"; // Default model, can be changed
  }

  /**
   * Generate text using Gemini API
   * @param {string} prompt - The prompt to send to Gemini
   * @param {Object} options - Additional options
   * @returns {Promise<string>} Generated text
   */
  async generateText(prompt, options = {}) {
    try {
      const url = `${GEMINI_API_BASE_URL}/${this.model}:generateContent?key=${this.apiKey}`;

      const payload = {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: options.temperature || 0.7,
          topK: options.topK || 40,
          topP: options.topP || 0.95,
          maxOutputTokens: options.maxTokens || 2048,
          stopSequences: options.stopSequences || [],
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      };

      const response = await axios.post(url, payload);

      // Extract the generated text from the response
      if (
        response.data &&
        response.data.candidates &&
        response.data.candidates[0] &&
        response.data.candidates[0].content &&
        response.data.candidates[0].content.parts
      ) {
        return response.data.candidates[0].content.parts[0].text;
      }

      throw new Error("Failed to extract generated text from response");
    } catch (error) {
      console.error("Error generating text with Gemini:", error);
      throw error;
    }
  }

  /**
   * Generate a presentation from text or URL content
   * @param {Object} data - Input data for presentation
   * @param {string} data.text - Optional text content
   * @param {string} data.url - Optional URL to extract content from
   * @param {string} data.template - Presentation template to use
   * @returns {Promise<Object>} Generated presentation data
   */
  async generatePresentation(data) {
    try {
      let prompt = "";

      if (data.url) {
        prompt = `Generate a professional presentation based on the content from this URL: ${
          data.url
        }. 
        Use the ${data.template || "modern"} template style. 
        Structure the presentation with a title slide, introduction, key points, and conclusion.
        Format your response as JSON with the following structure:
        {
          "title": "Presentation Title",
          "slides": [
            {
              "title": "Slide Title",
              "content": "Slide content in HTML format, use <ul> for bullet points, <strong> for emphasis",
              "notes": "Speaker notes for this slide"
            }
          ]
        }`;
      } else if (data.text) {
        prompt = `Generate a professional presentation based on the following content:
        
        ${data.text.substring(
          0,
          5000
        )}  // Limit text length to avoid token limits
        
        Use the ${data.template || "modern"} template style.
        Structure the presentation with a title slide, introduction, key points, and conclusion.
        Format your response as JSON with the following structure:
        {
          "title": "Presentation Title",
          "slides": [
            {
              "title": "Slide Title",
              "content": "Slide content in HTML format, use <ul> for bullet points, <strong> for emphasis",
              "notes": "Speaker notes for this slide"
            }
          ]
        }`;
      } else {
        throw new Error("Either URL or text must be provided");
      }

      const generatedText = await this.generateText(prompt, {
        temperature: 0.3, // Lower temperature for more structured output
        maxTokens: 4096,
      });

      try {
        // Extract the JSON part from the response
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        const presentationData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

        if (!presentationData) {
          throw new Error("Failed to parse presentation data");
        }

        // Convert presentation data to required format
        return {
          title: presentationData.title,
          slideCount: presentationData.slides.length,
          slides: presentationData.slides,
          preview: this.generatePreviewHTML(presentationData, data.template),
          source: data.url || "text input",
        };
      } catch (parseError) {
        console.error("Error parsing Gemini response:", parseError);
        // Fallback if parsing fails
        return {
          title: "Generated Presentation",
          slideCount: 5,
          preview: this.generateFallbackPreview(data.template),
          source: data.url || "text input",
        };
      }
    } catch (error) {
      console.error("Error generating presentation with Gemini:", error);
      throw error;
    }
  }

  /**
   * Generate summary of text
   * @param {string} text - Text to summarize
   * @returns {Promise<string>} Summarized text
   */
  async generateSummary(text) {
    try {
      const prompt = `Summarize the following text in a concise manner, preserving the key points and main ideas:
      
      ${text.substring(0, 5000)}  // Limit text length to avoid token limits
      
      Provide a summary that is about 25% the length of the original text.`;

      return await this.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 1024,
      });
    } catch (error) {
      console.error("Error generating summary with Gemini:", error);
      throw error;
    }
  }

  /**
   * Generate smart contract analysis
   * @param {string} contractCode - Contract code to analyze
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeContract(contractCode) {
    try {
      const prompt = `Analyze the following smart contract code and identify potential security issues, gas optimization opportunities, and best practices compliance:
      
      ${contractCode.substring(
        0,
        8000
      )}  // Limit code length to avoid token limits
      
      Format your response as JSON with the following structure:
      {
        "securityIssues": [
          { "severity": "high/medium/low", "description": "Description of issue", "recommendation": "How to fix" }
        ],
        "gasOptimizations": [
          { "description": "Description of optimization", "recommendation": "How to optimize" }
        ],
        "bestPractices": [
          { "compliant": true/false, "practice": "Description of practice", "recommendation": "How to comply" }
        ],
        "overallRating": "1-10 rating of contract quality",
        "summary": "Brief summary of analysis"
      }`;

      const generatedText = await this.generateText(prompt, {
        temperature: 0.2,
        maxTokens: 4096,
      });

      try {
        // Extract the JSON part from the response
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        const analysisData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

        if (!analysisData) {
          throw new Error("Failed to parse analysis data");
        }

        return analysisData;
      } catch (parseError) {
        console.error("Error parsing Gemini response:", parseError);
        // Return simple object if parsing fails
        return {
          securityIssues: [],
          gasOptimizations: [],
          bestPractices: [],
          overallRating: "N/A",
          summary:
            "Failed to parse detailed analysis. Please try again with a simpler contract.",
        };
      }
    } catch (error) {
      console.error("Error analyzing contract with Gemini:", error);
      throw error;
    }
  }

  /**
   * Generate preview HTML for presentation
   * @param {Object} presentationData - Presentation data
   * @param {string} template - Template name
   * @returns {string} HTML preview
   */
  generatePreviewHTML(presentationData, template = "modern") {
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

    // Generate preview slides
    let slidesHTML = "";
    const maxPreviewSlides = Math.min(3, presentationData.slides.length);

    for (let i = 0; i < maxPreviewSlides; i++) {
      const slide = presentationData.slides[i];
      slidesHTML += `
        <div style="margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; border-radius: 4px; background-color: ${color.bg};">
          <h3 style="color: ${color.primary}; margin-bottom: 10px;">${slide.title}</h3>
          <div style="color: ${color.text}; font-size: 14px;">
            ${slide.content}
          </div>
        </div>
      `;
    }

    // If there are more slides than shown in preview
    if (presentationData.slides.length > maxPreviewSlides) {
      slidesHTML += `
        <div style="text-align: center; padding: 15px; color: #757575; font-style: italic;">
          + ${presentationData.slides.length - maxPreviewSlides} more slides
        </div>
      `;
    }

    return `
      <div style="font-family: Arial, sans-serif; color: ${color.text};">
        <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
          <strong>Template:</strong> ${
            template.charAt(0).toUpperCase() + template.slice(1)
          } |
          <strong>Source:</strong> ${
            presentationData.source || "Generated content"
          }
        </div>
        <h2 style="color: ${color.primary}; margin-bottom: 20px;">${
      presentationData.title
    }</h2>
        ${slidesHTML}
        <p style="font-style: italic; color: #666; margin-top: 20px;">
          * This is a preview. The full presentation contains ${
            presentationData.slides.length
          } slides with complete content.
        </p>
      </div>
    `;
  }

  /**
   * Generate fallback preview when parsing fails
   * @param {string} template - Template name
   * @returns {string} HTML preview
   */
  generateFallbackPreview(template = "modern") {
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

    // Generate random slides for preview
    const slideCount = 3;
    let slides = "";

    for (let i = 0; i < slideCount; i++) {
      const slideTitle = i === 0 ? "Title Slide" : `Slide ${i}`;
      slides += `
        <div style="margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; border-radius: 4px; background-color: ${color.bg};">
          <h3 style="color: ${color.primary}; margin-bottom: 10px;">${slideTitle}</h3>
          <div style="height: 100px; background-color: ${color.secondary}; opacity: 0.2; border-radius: 4px; margin-bottom: 10px;"></div>
          <div style="display: flex; justify-content: space-between;">
            <div style="width: 45%; height: 20px; background-color: ${color.text}; opacity: 0.1; border-radius: 2px;"></div>
            <div style="width: 45%; height: 20px; background-color: ${color.text}; opacity: 0.1; border-radius: 2px;"></div>
          </div>
        </div>
      `;
    }

    return `
      <div style="font-family: Arial, sans-serif; color: ${color.text};">
        <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
          <strong>Template:</strong> ${
            template.charAt(0).toUpperCase() + template.slice(1)
          } |
          <strong>Source:</strong> Generated content
        </div>
        <h2 style="color: ${
          color.primary
        }; margin-bottom: 20px;">Generated Presentation</h2>
        ${slides}
        <p style="font-style: italic; color: #666; margin-top: 20px;">
          * This is a preview. The full presentation contains more slides with complete content.
        </p>
      </div>
    `;
  }
}

module.exports = GeminiService;
