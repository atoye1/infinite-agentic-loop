import OpenAI from "openai";

/**
 * LLM Service - Provides interface for OpenAI API interactions
 */
export class LLMService {
  private openai: OpenAI;

  /**
   * Initialize LLM service with OpenAI API key
   * @param apiKey OpenAI API key
   */
  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Process text input and get AI response using gpt-4o-mini model
   * @param input User input text
   * @returns AI generated response
   */
  async processText(input: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: input },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      return response.choices[0]?.message?.content || "No response generated";
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      throw new Error(
        `Failed to process text: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Process text with custom system prompt
   * @param input User input text
   * @param systemPrompt Custom system prompt
   * @returns AI generated response
   */
  async processTextWithSystemPrompt(
    input: string,
    systemPrompt: string,
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      return response.choices[0]?.message?.content || "No response generated";
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      throw new Error(
        `Failed to process text: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

// Example usage:
// const llmService = new LLMService('your-api-key');
// const response = await llmService.processText('Hello, how are you?');
// console.log(response);
