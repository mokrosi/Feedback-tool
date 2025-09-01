import {
  improveQuestionText,
  improveOptionText,
  improveTextPhrasing,
  generateTextSuggestions,
} from "./TextPhrasing";

/**
 * Question-specific phrasing utilities for survey questions and options
 * Provides specialized functions for improving survey question content
 */

/**
 * Improve survey question text with question-specific optimizations
 * @param {string} questionText - Original question text
 * @param {string} [questionType] - Type of question (TEXT, RATING, MULTIPLE_CHOICE, etc.)
 * @param {Object} [options] - Additional options
 * @returns {Promise<string>} Improved question text
 */
export const improveQuestionPhrasing = async (
  questionText,
  questionType = "",
  options = {}
) => {
  if (!questionText || !questionText.trim()) {
    throw new Error("Question text is required");
  }

  // Add question type specific context
  let context =
    "This is a survey question that should be clear, neutral, and unbiased.";

  switch (questionType.toUpperCase()) {
    case "RATING":
      context +=
        " This is a RATING question that asks users to rate something on a numerical scale (e.g., 1-5, 1-10). The question should prompt users to assign a numerical value. Avoid turning this into a multiple choice or open-ended question.";
      break;
    case "MULTIPLE_CHOICE":
      context +=
        " This is a MULTIPLE CHOICE question with predefined options that users can select from. The question should be designed to work with specific answer choices. Avoid turning this into a rating scale or open-ended question.";
      break;
    case "TEXT":
      context +=
        " This is a SHORT TEXT input question that allows brief, open-ended responses (typically 1-2 sentences). The question should encourage concise written answers. Avoid turning this into a rating scale or multiple choice question.";
      break;
    case "LONG_TEXT":
      context +=
        " This is a LONG TEXT question for detailed, open-ended responses (paragraphs or essays). The question should encourage comprehensive written explanations. Avoid turning this into a rating scale or multiple choice question.";
      break;
    default:
      context +=
        " Make it engaging but neutral while preserving the original question format.";
  }

  return improveQuestionText(questionText, {
    context,
    ...options,
  });
};

/**
 * Improve multiple choice option text
 * @param {string} optionText - Original option text
 * @param {Object} [options] - Additional options
 * @returns {Promise<string>} Improved option text
 */
export const improveOptionPhrasing = async (optionText, options = {}) => {
  return improveOptionText(optionText, {
    context:
      "This is a multiple choice option that should be clear and distinct from other options.",
    ...options,
  });
};

/**
 * Generate option suggestions for multiple choice questions
 * @param {string} questionText - The question text these options are for
 * @param {number} [count=4] - Number of options to generate
 * @returns {Promise<string[]>} Array of option suggestions
 */
export const generateOptionSuggestions = async (questionText, count = 4) => {
  if (!questionText || !questionText.trim()) {
    throw new Error(
      "Question text is required for generating option suggestions"
    );
  }

  const prompt = `Generate ${count} appropriate multiple choice options for this question: "${questionText}"

Requirements:
- Options should be mutually exclusive and comprehensive
- Cover the most likely responses
- Be concise and clear
- Avoid overlapping meanings
- Return only the options, one per line, without numbering or formatting`;

  try {
    const suggestions = await improveTextPhrasing({
      text: prompt,
      type: "option",
      context: "Generate multiple choice options",
      maxLength: 500,
    });

    return suggestions
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, count);
  } catch (error) {
    console.error("Error generating option suggestions:", error);
    throw new Error("Failed to generate option suggestions. Please try again.");
  }
};
