import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class ChatGptService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    console.log(apiKey);
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  async generateCustomizedLatex(
    templateTexContent: string,
    extractedPdfContent: string,
    userInstructions: string,
  ): Promise<string> {
    try {
      // Truncate PDF content if it's too long to prevent token overflow
      const maxPdfContentLength = 3000; // Approximate character limit for PDF content
      const truncatedPdfContent = extractedPdfContent.length > maxPdfContentLength 
        ? extractedPdfContent.substring(0, maxPdfContentLength) + '\n\n[Content truncated due to length...]'
        : extractedPdfContent;

      const systemPrompt = `You are an expert LaTeX resume assistant. Your task is to:

1. Analyze the LaTeX template structure
2. Extract relevant information from the user's PDF content  
3. Follow user instructions for customization
4. Generate valid LaTeX code that maintains the template's formatting

Guidelines:
- Preserve all LaTeX commands and structure from the template
- Replace placeholder content with user's information
- Follow user instructions for emphasis and modifications
- Ensure output is valid LaTeX
- Maintain professional formatting
- If information doesn't fit a section, leave it empty

Return ONLY the complete LaTeX code, no explanations.`;

      const userPrompt = `Template LaTeX:
${templateTexContent}

User's Information:
${truncatedPdfContent}

Instructions:
${userInstructions}

Generate a customized LaTeX resume incorporating the user's information into the template structure.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        max_tokens: 2500, // Reduced from 4000 to stay within context limits
        temperature: 0.3,
      });

      const generatedLatex = completion.choices[0]?.message?.content;
      
      if (!generatedLatex) {
        throw new BadRequestException('Failed to generate LaTeX content from ChatGPT');
      }

      return generatedLatex.trim();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Handle specific OpenAI API errors
      if (error.status === 400 && error.message?.includes('maximum context length')) {
        throw new BadRequestException('Document content is too long. Please try with a shorter document or provide more specific instructions.');
      }
      
      throw new BadRequestException(`ChatGPT API error: ${error.message}`);
    }
  }
} 