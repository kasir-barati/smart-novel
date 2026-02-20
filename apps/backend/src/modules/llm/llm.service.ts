import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

import { WordExplanation } from './types';

@Injectable()
export class LlmService {
  private readonly ollamaBaseUrl: string;
  private readonly ollamaModel: string;

  constructor(private readonly configService: ConfigService) {
    this.ollamaBaseUrl = this.configService.get<string>(
      'OLLAMA_BASE_URL',
      'http://ollama:11434',
    );
    this.ollamaModel = this.configService.get<string>(
      'OLLAMA_MODEL',
      'llama3.2:1b',
    );
  }

  async explainWord(
    word: string,
    context: string,
  ): Promise<WordExplanation> {
    try {
      const prompt = `Analyze the word "${word}" in this context: "${context}".
      
Provide a JSON response with:
1. meaning: A brief definition of the word in this context
2. synonyms: An array of 3-5 synonyms
3. antonyms: An array of 3-5 antonyms
4. simplifiedExplanation: A simple, easy-to-understand explanation

Format your response as valid JSON only, no additional text.`;

      const response = await axios.post(
        `${this.ollamaBaseUrl}/api/generate`,
        {
          model: this.ollamaModel,
          prompt,
          stream: false,
        },
        {
          timeout: 30000,
        },
      );

      // Parse the LLM response
      const generatedText = response.data.response;

      // Try to extract JSON from the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          antonyms: Array.isArray(parsed.antonyms)
            ? parsed.antonyms
            : [],
          meaning: parsed.meaning || 'No meaning available',
          simplifiedExplanation:
            parsed.simplifiedExplanation ||
            'No explanation available',
          synonyms: Array.isArray(parsed.synonyms)
            ? parsed.synonyms
            : [],
        };
      }

      // Fallback response if parsing fails
      return {
        antonyms: [],
        meaning: `The word "${word}" in the context provided.`,
        simplifiedExplanation: generatedText.substring(0, 200),
        synonyms: [],
      };
    } catch (error) {
      console.error('Error calling Ollama:', error);

      // Return a fallback response on error
      return {
        antonyms: [],
        meaning: `Unable to analyze the word "${word}" at this time.`,
        simplifiedExplanation:
          'The LLM service is currently unavailable.',
        synonyms: [],
      };
    }
  }
}
