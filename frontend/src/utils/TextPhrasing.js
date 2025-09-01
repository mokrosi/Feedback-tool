import { generateFromAI } from "./AIservice";

/**
 * Text phrasing utilities for improving user input with AI assistance
 * Provides modular functions for different types of text enhancement
 */

/**
 * Improve text phrasing with specific constraints and context
 * @param {Object} options - Configuration options for text improvement
 * @param {string} options.text - The original text to improve
 * @param {string} options.type - Type of text ('title', 'description', 'question', 'option', 'general')
 * @param {number} [options.maxLength] - Maximum character length for the improved text
 * @param {string} [options.context] - Additional context about the text purpose
 * @param {string} [options.tone] - Desired tone ('professional', 'casual', 'formal', 'friendly')
 * @param {boolean} [options.preserveLength] - Whether to maintain similar length to original
 * @returns {Promise<string>} Improved text
 */
export const improveTextPhrasing = async ({
  text,
  type = "general",
  maxLength = null,
  context = "",
  tone = "professional",
  preserveLength = false,
}) => {
  console.log("📝 TextPhrasing - Starting improvement with:", {
    text: text?.substring(0, 100) + (text?.length > 100 ? "..." : ""),
    type,
    maxLength,
    context,
    tone,
    preserveLength,
  });

  if (!text || !text.trim()) {
    console.error("❌ TextPhrasing - Text is required for improvement");
    throw new Error("Text is required for improvement");
  }

  // Define type-specific configurations
  const typeConfigs = {
    title: {
      maxLength: maxLength || 80,
      systemPrompt: `You are an expert at creating clear, engaging, and concise titles. 
Your task is to improve the user's title while keeping it short, impactful, and professional.
Focus on clarity, engagement, and brevity.`,
      instructions: "Make it catchy but professional, clear and concise",
    },
    description: {
      maxLength: maxLength || 500,
      systemPrompt: `You are an expert at writing clear, informative descriptions. 
Your task is to improve the user's description while maintaining clarity and engagement.
Focus on being informative, clear, and well-structured.`,
      instructions: "Make it clear, informative, and well-structured",
    },
    question: {
      maxLength: maxLength || 200,
      systemPrompt: `You are an expert at creating clear, unbiased survey questions. 
Your task is to improve the user's question while ensuring it's clear, neutral, and easy to understand.
Focus on clarity, neutrality, and avoiding leading questions.
CRITICAL: Preserve the original question type and format. Do not change a text question into a rating question, or a rating question into multiple choice, etc.`,
      instructions:
        "Make it clear, neutral, and easy to understand while preserving the question type",
    },
    option: {
      maxLength: maxLength || 100,
      systemPrompt: `You are an expert at creating clear, concise option text. 
Your task is to improve the user's option while keeping it brief and clear.
Focus on clarity and brevity.`,
      instructions: "Make it clear and concise",
    },
    general: {
      maxLength: maxLength || 300,
      systemPrompt: `You are an expert at improving text clarity and engagement. 
Your task is to enhance the user's text while maintaining its original intent.
Focus on clarity, flow, and readability.`,
      instructions: "Make it clear, well-written, and engaging",
    },
  };

  const config = typeConfigs[type] || typeConfigs.general;

  // Build the improvement prompt
  let prompt = `Please improve the following ${type}:\n\n"${text}"\n\n`;

  // Add context first if provided (especially important for questions)
  if (context) {
    prompt += `IMPORTANT CONTEXT: ${context}\n\n`;
  }

  // Add specific instructions based on type
  prompt += `Instructions: ${config.instructions}. `;

  // Add length constraints
  if (preserveLength) {
    prompt += `Keep the length similar to the original (around ${text.length} characters). `;
  } else {
    prompt += `Keep it under ${config.maxLength} characters. `;
  }

  // Add tone specification
  prompt += `Use a ${tone} tone. `;

  // Add final instructions
  prompt += `\n\nReturn only the improved text without any additional explanation or formatting.`;

  console.log("🚀 TextPhrasing - Sending prompt:", {
    prompt: prompt.substring(0, 300) + (prompt.length > 300 ? "..." : ""),
    systemPrompt: config.systemPrompt.substring(0, 100) + "...",
    config: {
      temperature: 0.7,
      maxTokens: Math.ceil(config.maxLength / 2),
    },
  });

  try {
    const improvedText = await generateFromAI({
      prompt,
      systemPrompt: config.systemPrompt,
      temperature: 0.7,
      maxTokens: Math.ceil(config.maxLength / 2), // Rough estimate for tokens
    });

    console.log("📥 TextPhrasing - Received response:", {
      improvedText:
        improvedText?.substring(0, 200) +
        (improvedText?.length > 200 ? "..." : ""),
      originalLength: text.length,
      improvedLength: improvedText?.length,
    });

    // Basic cleanup - remove quotes if AI added them
    const cleanedText = improvedText.trim().replace(/^["']|["']$/g, "");

    console.log("🧹 TextPhrasing - After cleanup:", {
      cleanedText:
        cleanedText?.substring(0, 200) +
        (cleanedText?.length > 200 ? "..." : ""),
      length: cleanedText?.length,
    });

    // Validate length if maxLength is specified
    if (config.maxLength && cleanedText.length > config.maxLength) {
      // Truncate if too long, but try to end at a word boundary
      const truncated = cleanedText.substring(0, config.maxLength);
      const lastSpace = truncated.lastIndexOf(" ");
      const finalText =
        lastSpace > config.maxLength * 0.8
          ? truncated.substring(0, lastSpace) + "..."
          : truncated;

      console.log("✂️ TextPhrasing - Truncated text:", {
        original: cleanedText.length,
        truncated: finalText.length,
        text: finalText.substring(0, 100) + "...",
      });

      return finalText;
    }

    console.log("✅ TextPhrasing - Final result:", {
      text:
        cleanedText?.substring(0, 200) +
        (cleanedText?.length > 200 ? "..." : ""),
      length: cleanedText?.length,
    });

    return cleanedText;
  } catch (error) {
    console.error("❌ TextPhrasing - Error improving text:", error);
    console.error("❌ TextPhrasing - Error details:", {
      message: error.message,
      stack: error.stack,
    });
    throw new Error("Failed to improve text. Please try again.");
  }
};

/**
 * Improve survey title - optimized for titles
 * @param {string} title - Original title text
 * @param {Object} [options] - Additional options
 * @returns {Promise<string>} Improved title
 */
export const improveSurveyTitle = async (title, options = {}) => {
  return improveTextPhrasing({
    text: title,
    type: "title",
    maxLength: 80,
    tone: "professional",
    context: "This is a survey title that should be engaging and clear",
    ...options,
  });
};

/**
 * Improve survey description - optimized for descriptions
 * @param {string} description - Original description text
 * @param {Object} [options] - Additional options
 * @returns {Promise<string>} Improved description
 */
export const improveSurveyDescription = async (description, options = {}) => {
  return improveTextPhrasing({
    text: description,
    type: "description",
    maxLength: 500,
    tone: "professional",
    context:
      "This is a survey description that explains the purpose and instructions",
    ...options,
  });
};

/**
 * Improve question text - optimized for survey questions
 * @param {string} question - Original question text
 * @param {Object} [options] - Additional options
 * @returns {Promise<string>} Improved question
 */
export const improveQuestionText = async (question, options = {}) => {
  return improveTextPhrasing({
    text: question,
    type: "question",
    maxLength: 200,
    tone: "professional",
    context: "This is a survey question that should be clear and unbiased",
    ...options,
  });
};

/**
 * Improve option text - optimized for multiple choice options
 * @param {string} option - Original option text
 * @param {Object} [options] - Additional options
 * @returns {Promise<string>} Improved option
 */
export const improveOptionText = async (option, options = {}) => {
  return improveTextPhrasing({
    text: option,
    type: "option",
    maxLength: 100,
    tone: "professional",
    context:
      "This is a multiple choice option that should be clear and concise",
    ...options,
  });
};

/**
 * Generate suggestions for text improvement
 * @param {string} text - Original text
 * @param {string} type - Type of text improvement needed
 * @param {number} [count=3] - Number of suggestions to generate
 * @returns {Promise<string[]>} Array of suggested improvements
 */
export const generateTextSuggestions = async (
  text,
  type = "general",
  count = 3
) => {
  if (!text || !text.trim()) {
    throw new Error("Text is required for generating suggestions");
  }

  const prompt = `Generate ${count} different improved versions of this ${type}:\n\n"${text}"\n\nRequirements:
- Each version should be distinct and offer a different approach
- Maintain the original meaning and intent
- Focus on clarity, engagement, and professionalism
- Return only the suggestions, one per line, without numbering or additional text`;

  try {
    const suggestions = await generateFromAI({
      prompt,
      systemPrompt: `You are an expert copywriter who creates multiple variations of text improvements. 
            Focus on providing diverse, high-quality alternatives that maintain the original intent.`,
      temperature: 0.8,
    });

    return suggestions
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, count);
  } catch (error) {
    console.error("Error generating text suggestions:", error);
    throw new Error("Failed to generate suggestions. Please try again.");
  }
};

/**
 * Quick text improvement - simplified interface for common use cases
 * @param {string} text - Text to improve
 * @param {string} [type='general'] - Type of improvement needed
 * @returns {Promise<string>} Improved text
 */
export const quickImprove = async (text, type = "general") => {
  return improveTextPhrasing({
    text,
    type,
    tone: "professional",
  });
};
