import { supabase, TABLES } from "./supabaseClient";

/**
 * Generate presentation from URL content
 * @param {Object} options - Options for generation
 * @param {string} options.url - URL to generate presentation from
 * @param {string} options.template - Template to use
 * @param {boolean} options.useMCP - Whether to use MCP for editing
 * @returns {Promise<Object>} Generated presentation data
 */
export const generatePresentation = async (options) => {
  try {
    // In a real app, this would call an AI service
    // For demo purposes, we'll simulate the response

    let title, preview, slideCount;

    // Simulate different content based on input
    if (options.url) {
      await simulateNetworkDelay();
      title = `Presentation from ${new URL(options.url).hostname}`;
      preview = generatePreviewHTML(options.url, options.template);
      slideCount = Math.floor(Math.random() * 10) + 5;
    } else if (options.text) {
      await simulateNetworkDelay();
      title = generateTitleFromText(options.text);
      preview = generatePreviewHTML(null, options.template, options.text);
      slideCount = Math.floor(Math.random() * 8) + 3;
    } else if (options instanceof FormData) {
      // Handle file upload
      await simulateNetworkDelay(2500); // Longer delay for file processing
      const file = options.get("file");
      title = `Presentation from ${file.name}`;
      preview = generatePreviewHTML(null, options.get("template"));
      slideCount = Math.floor(Math.random() * 12) + 6;
    } else {
      throw new Error("Invalid input for presentation generation");
    }

    // Save presentation to database if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      const { data, error } = await supabase
        .from(TABLES.PRESENTATIONS)
        .insert({
          user_id: session.user.id,
          title,
          description: `Generated from ${options.url || "text input"}`,
          content: { preview },
          slide_count: slideCount,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving presentation:", error);
      }
    }

    // If using MCP, we would call the MCP service here
    if (options.useMCP || options.get?.("useMCP") === "true") {
      // Mock MCP call - in a real app, this would integrate with presentation software
      console.log("Using MCP to open presentation in local application");
    }

    return {
      title,
      preview,
      slideCount,
    };
  } catch (error) {
    console.error("Error generating presentation:", error);
    throw error;
  }
};

/**
 * Generate summary of text
 * @param {string} text - Text to summarize
 * @returns {Promise<string>} Summarized text
 */
export const generateSummary = async (text) => {
  try {
    // In a real app, this would call an AI service
    // For demo purposes, we'll simulate the response
    await simulateNetworkDelay();

    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    if (sentences.length <= 3) {
      return text;
    }

    // Take first sentence, one from the middle, and last sentence
    const summary =
      [
        sentences[0],
        sentences[Math.floor(sentences.length / 2)],
        sentences[sentences.length - 1],
      ].join(". ") + ".";

    return summary;
  } catch (error) {
    console.error("Error generating summary:", error);
    throw error;
  }
};

/**
 * Get user's saved presentations
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of presentations
 */
export const getUserPresentations = async (userId) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.PRESENTATIONS)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data.map((presentation) => ({
      id: presentation.id,
      title: presentation.title,
      description: presentation.description,
      slideCount: presentation.slide_count,
      thumbnail: presentation.thumbnail,
      fileUrl: presentation.file_url,
      createdAt: presentation.created_at,
      updatedAt: presentation.updated_at,
    }));
  } catch (error) {
    console.error("Error fetching user presentations:", error);
    throw error;
  }
};

/**
 * Delete a presentation
 * @param {string} presentationId - Presentation ID
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const deletePresentation = async (presentationId, userId) => {
  try {
    const { error } = await supabase
      .from(TABLES.PRESENTATIONS)
      .delete()
      .eq("id", presentationId)
      .eq("user_id", userId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error deleting presentation:", error);
    throw error;
  }
};

// Helper functions
const simulateNetworkDelay = (delay = 1500) => {
  return new Promise((resolve) => setTimeout(resolve, delay));
};

const generateTitleFromText = (text) => {
  const firstLine = text.split("\n")[0].trim();
  if (firstLine.length <= 50) {
    return firstLine;
  }
  return firstLine.substring(0, 47) + "...";
};

const generatePreviewHTML = (url, template = "modern", text = null) => {
  // This would generate actual presentation preview HTML
  // For demo, we'll just create a mock preview

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

  // Generate mock content
  const source = url
    ? `Website: ${url}`
    : text
    ? "Text input"
    : "Uploaded file";

  // Generate random slides for preview
  const slideCount = Math.floor(Math.random() * 3) + 2;
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
        <strong>Source:</strong> ${source}
      </div>
      <h2 style="color: ${color.primary}; margin-bottom: 20px;">Preview</h2>
      ${slides}
      <p style="font-style: italic; color: #666; margin-top: 20px;">
        * This is a preview. The full presentation contains more slides with complete content.
      </p>
    </div>
  `;
};
