import { ChatOpenAI } from '@langchain/openai';
import { QuestionPaperOutputSchema } from './schema';
import { SYSTEM_PROMPT } from './prompt';

export function createModel() {
  return new ChatOpenAI({
    modelName: process.env.DEEPSEEK_MODEL ?? 'deepseek-chat',
    apiKey: process.env.DEEPSEEK_API_KEY!,
    configuration: {
      baseURL: process.env.DO_BASE_URL!,
    },
    temperature: 0.7,
    maxTokens: 4096,
  });
}

export async function runGenerationAgent(userPrompt: string) {
  const model = createModel();

  const structuredModel = model.withStructuredOutput(QuestionPaperOutputSchema, {
    name: 'generate_question_paper',
  });

  return structuredModel.invoke([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ]);
}
