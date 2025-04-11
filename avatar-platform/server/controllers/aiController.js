const { createClient } = require('@supabase/supabase-js');
const config = require('../config/config');
const GeminiService = require('../services/geminiService');

// Create Supabase client
const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

// Initialize Gemini service
const geminiService = new GeminiService(config.gemini.apiKey);

// Table names
const TABLES = {
  PRESENTATIONS: 'presentations',
};

/**
 * Generate presentation from URL or text
 */
const generatePresentation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { url, text, template, useMCP } = req.body;
    
    // Validate input
    if (!url && !text) {
      return res.status(400).json({ error: 'URL or text is required' });
    }
    
    // Initialize options
    const options = {
      template: template || 'modern',
      url,
      text,
    };
    
    // Generate presentation using Gemini service
    const generatedPresentation = await geminiService.generatePresentation(options);
    
    // Save to database if user is authenticated
    let savedPresentation = null;
    if (userId) {
      const { data, error } = await supabase
        .from(TABLES.PRESENTATIONS)
        .insert({
          user_id: userId,
          title: generatedPresentation.title,
          description: `Generated from ${url || 'text input'}`,
          content: { preview: generatedPresentation.preview },
          slide_count: generatedPresentation.slideCount,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error saving presentation:', error);
      } else {
        savedPresentation = data;
      }
    }
    
    // Handle MCP if requested
    if (useMCP) {
      // In a production app, this would integrate with MCP service
      console.log('MCP integration would happen here');
    }
    
    res.status(200).json({
      id: savedPresentation?.id,
      title: generatedPresentation.title,
      preview: generatedPresentation.preview,
      slideCount: generatedPresentation.slideCount,
    });
  } catch (error) {
    console.error('Error generating presentation:', error);
    res.status(500).json({ error: 'Failed to generate presentation' });
  }
};

/**
 * Generate summary of text
 */
const generateSummary = async (req, res) => {
  try {
    const { text } = req.body;
    
    // Validate input
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    // Generate summary using Gemini service
    const summary = await geminiService.generateSummary(text);
    
    res.status(200).json({ summary });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
};

/**
 * Analyze smart contract
 */
const analyzeContract = async (req, res) => {
  try {
    const { contractCode } = req.body;
    
    // Validate input
    if (!contractCode) {
      return res.status(400).json({ error: 'Contract code is required' });
    }
    
    // Analyze contract using Gemini service
    const analysis = await geminiService.analyzeContract(contractCode);
    
    res.status(200).json(analysis);
  } catch (error) {
    console.error('Error analyzing contract:', error);
    res.status(500).json({ error: 'Failed to analyze contract' });
  }
};

/**
 * Get user presentations
 */
const getUserPresentations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get presentations from database
    const { data, error } = await supabase
      .from(TABLES.PRESENTATIONS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    // Format response
    const presentations = data.map(presentation => ({
      id: presentation.id,
      title: presentation.title,
      description: presentation.description,
      slideCount: presentation.slide_count,
      thumbnail: presentation.thumbnail,
      fileUrl: presentation.file_url,
      createdAt: presentation.created_at,
      updatedAt: presentation.updated_at,
    }));
    
    res.status(200).json(presentations);
  } catch (error) {
    console.error('Error fetching presentations:', error);
    res.status(500).json({ error: 'Failed to fetch presentations' });
  }
};

/**
 * Delete a presentation
 */
const deletePresentation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Delete presentation
    const { error } = await supabase
      .from(TABLES.PRESENTATIONS)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) {
      throw error;
    }
    
    res.status(200).json({ message: 'Presentation deleted successfully' });
  } catch (error) {
    console.error('Error deleting presentation:', error);
    res.status(500).json({ error: 'Failed to delete presentation' });
  }
};

module.exports = {
  generatePresentation,
  generateSummary,
  analyzeContract,
  getUserPresentations,
  deletePresentation,
};