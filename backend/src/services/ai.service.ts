import mongoose from 'mongoose';
import { IAssignment } from '../models/Assignment';
import { IQuestionPaper } from '../models/QuestionPaper';

/**
 * Constructs the detailed user prompt for the AI.
 */
function buildPrompt(assignment: IAssignment): string {
  let difficultyDist: string = assignment.difficulty;
  if (difficultyDist === 'mixed') {
    difficultyDist = '30% easy, 50% medium, 20% hard';
  }

  const totalQuestions = assignment.numberOfQuestions;
  const mcqCount = assignment.questionTypes.includes('mcq') ? 
    Math.ceil(totalQuestions * 0.5) : 0;
  const shortCount = assignment.questionTypes.includes('short') ? 
    Math.floor(totalQuestions * 0.3) : 0;
  const longCount = assignment.questionTypes.includes('long') ? 
    Math.floor(totalQuestions * 0.2) : 0;

  return `
Create a question paper with the following specifications:
- Subject: ${assignment.subject}
- Grade Level: ${assignment.gradeLevel}
- Total Marks: ${assignment.totalMarks}
- Duration: ${assignment.duration} minutes
- Number of Questions: ${assignment.numberOfQuestions}
- Question Types Requested: ${assignment.questionTypes.join(', ')}
- Difficulty Distribution: ${difficultyDist}
${assignment.additionalInstructions ? `- Additional Instructions: ${assignment.additionalInstructions}` : ''}

STRICT REQUIREMENTS:
- Total questions: EXACTLY ${totalQuestions}
- MCQ questions need EXACTLY 4 options each with real answer text
- Do not generate placeholder options like "A", "B", "C", "D"
- Each option must be a real answer value

Question distribution:
${assignment.questionTypes.includes('mcq') ? `- MCQ: ${mcqCount} questions, each with 4 real answer options` : ''}
${assignment.questionTypes.includes('short') ? `- Short Answer: ${shortCount} questions` : ''}
${assignment.questionTypes.includes('long') ? `- Long Answer: ${longCount} questions` : ''}
${assignment.questionTypes.includes('true-false') ? `- True/False: remaining questions` : ''}

Generate SHORT, concise questions. Max 15 words per question.

Organize into sections:
- Section A (easiest type)
- Section B (medium)
- Section C (hardest)
(Adjust number of sections based on requested question types if needed, but maintain clear structure)

For each section, provide:
- "id": string (e.g. "sec_A")
- "title": string
- "instruction": string (e.g. "Attempt all questions")
- "totalMarks": number
- "questions": array of question objects

For each question, provide:
- "id": string (e.g. "Q1", "Q2")
- "text": string
- "type": one of [${assignment.questionTypes.map(t => `"${t}"`).join(', ')}]
- "difficulty": one of ["easy", "medium", "hard"]
- "marks": number
- "options": array of strings (ONLY if type is "mcq"). For MCQ questions, the options array MUST contain actual answer text, not just labels.
  EXAMPLE of correct MCQ format:
  {
    "id": "Q1",
    "text": "What is 5 + 3?",
    "type": "mcq", 
    "difficulty": "easy",
    "marks": 2,
    "options": ["8", "6", "9", "7"]
  }
  EXAMPLE of wrong MCQ format (NEVER do this):
  {
    "options": ["A", "B", "C", "D"]
  }
- "answer": string (model answer or correct option)

Output valid JSON only matching this structure exactly:
{
  "title": "Generated Title for the Question Paper",
  "sections": [
    {
      "id": "sec_A",
      "title": "Section A",
      "instruction": "...",
      "totalMarks": 10,
      "questions": [
        {
          "id": "Q1",
          "text": "What is 5 + 3?",
          "type": "mcq",
          "difficulty": "easy",
          "marks": 1,
          "options": ["8", "6", "9", "7"],
          "answer": "8"
        }
      ]
    }
  ]
}
`;
}

/**
 * Safely parses and validates the raw JSON response from the AI.
 * Strips markdown formatting if accidentally included by the model.
 */
export function parseAIResponse(raw: string, assignment: IAssignment): any {
  // Remove markdown fences if present
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let fixed = cleaned;
  // Try direct parse first
  try {
    const data = JSON.parse(fixed);
    return validateAndRepair(validateParsedData(data), assignment);
  } catch (e) {
    // Attempt to salvage truncated JSON by finding the last complete section
    // Try to close any open arrays/objects
    const lines = fixed.split('\n');
    while (lines.length > 1) {
      const lastLine = lines[lines.length - 1].trim();
      // Remove incomplete last line if it doesn't end with } ] or ,
      if (lastLine && !lastLine.match(/[}\],]$/)) {
        lines.pop();
      } else {
        break;
      }
    }
    fixed = lines.join('\n').trim();
    if (fixed.endsWith(',')) {
      fixed = fixed.slice(0, -1).trim();
    }

    // Track nesting stack to close open structures in correct order
    let inString = false;
    let escape = false;
    const stack: ('{' | '[')[] = [];
    for (let i = 0; i < fixed.length; i++) {
      const ch = fixed[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (ch === '{') {
          stack.push('{');
        } else if (ch === '}') {
          if (stack[stack.length - 1] === '{') {
            stack.pop();
          }
        } else if (ch === '[') {
          stack.push('[');
        } else if (ch === ']') {
          if (stack[stack.length - 1] === '[') {
            stack.pop();
          }
        }
      }
    }

    while (stack.length > 0) {
      const open = stack.pop();
      if (open === '{') {
        fixed += '}';
      } else if (open === '[') {
        fixed += ']';
      }
    }

    try {
      const data = JSON.parse(fixed);
      return validateAndRepair(validateParsedData(data), assignment);
    } catch (salvageError) {
      throw new Error(`Failed to parse AI response as JSON: ${(e as Error).message}\nRaw response snippet: ${raw.substring(0, 100)}`);
    }
  }
}

/**
 * Helper to validate basic parsed structure.
 */
function validateParsedData(data: any): any {
  if (!data || typeof data !== 'object') {
    throw new Error('Parsed response is not an object');
  }

  if (!Array.isArray(data.sections) || data.sections.length === 0) {
    throw new Error("Invalid AI Response: missing or empty 'sections' array");
  }

  // Basic structure validation for sections
  for (const section of data.sections) {
    if (!section.title || !Array.isArray(section.questions)) {
      throw new Error("Invalid AI Response: section missing title or questions array");
    }
  }

  return data;
}

function validateAndRepair(parsed: any, assignment: IAssignment): any {
  // Ensure sections exist
  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('Invalid response: no sections found');
  }

  let questionCounter = 1;
  let totalGenerated = 0;

  parsed.sections = parsed.sections.map((section: any) => {
    if (!section.questions || !Array.isArray(section.questions)) {
      section.questions = [];
    }

    section.questions = section.questions.map((q: any) => {
      // Fix missing id
      if (!q.id) q.id = `Q${questionCounter}`;
      questionCounter++;
      totalGenerated++;

      // Fix MCQ with missing or invalid options
      if (q.type === 'mcq') {
        if (!q.options || !Array.isArray(q.options) || q.options.length === 0) {
          // Generate placeholder options if missing
          q.options = ['Option A', 'Option B', 'Option C', 'Option D'];
        } else if (q.options.length < 4) {
          // Pad to 4 options if less than 4
          while (q.options.length < 4) {
            q.options.push(`Option ${q.options.length + 1}`);
          }
        }
        // Fix single letter options
        q.options = q.options.map((opt: string, idx: number) => {
          const labels = ['A','B','C','D','a','b','c','d'];
          if (opt.trim().length === 1 && labels.includes(opt.trim())) {
            return `Choice ${idx + 1}`;
          }
          return opt;
        });
      }

      // Fix missing difficulty
      if (!q.difficulty) q.difficulty = 'medium';
      
      // Fix missing marks
      if (!q.marks || q.marks <= 0) q.marks = 1;

      // Fix missing text
      if (!q.text) q.text = `Question ${q.id}`;

      return q;
    });

    // Fix section totalMarks
    section.totalMarks = section.questions.reduce(
      (sum: number, q: any) => sum + (q.marks || 0), 0
    );

    return section;
  });

  // Log warning if question count doesn't match
  if (totalGenerated !== assignment.numberOfQuestions) {
    console.warn(
      `[AI] Warning: requested ${assignment.numberOfQuestions} questions but got ${totalGenerated}`
    );
  }

  return parsed;
}

const FREE_MODELS = [
  'mistralai/mistral-7b-instruct:free',
  'microsoft/phi-3-mini-128k-instruct:free', 
  'google/gemma-2-9b-it:free',
  'openrouter/auto'  // last resort — auto picks any available model
];

/**
 * Converts assignment data into a structured prompt, calls the API,
 * parses the response, and returns a structured QuestionPaper document instance.
 */
export async function generateQuestionPaper(
  assignment: IAssignment & { _id: mongoose.Types.ObjectId }
): Promise<Partial<IQuestionPaper>> {
  if (!process.env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is not set');
  const apiKey = process.env.OPENROUTER_API_KEY;

  const systemPrompt = 'You are an expert educator. Generate a structured question paper. Always respond with valid JSON only, no markdown. Be concise. Keep each question under 20 words. Keep instructions under 10 words.\n\nYou are a strict JSON generator. You MUST follow the exact counts specified.\nCRITICAL RULES:\n- Generate EXACTLY the number of questions requested, no more, no less\n- Every MCQ question MUST have exactly 4 options with real answer text\n- Never leave options as empty array [] for MCQ type\n- Never skip questions\n- Count your questions before returning JSON';

  async function callAI(prompt: { system: string; user: string }): Promise<{ raw: string; responseData: any; modelUsed: string }> {
    let lastError = '';
    
    for (const model of FREE_MODELS) {
      try {
        console.log(`[AI] Trying model: ${model}`);
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              'HTTP-Referer': 'http://localhost:3000',
              'X-Title': 'VedaAI Assessment Creator'
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: prompt.system },
                { role: 'user', content: prompt.user }
              ],
              max_tokens: 8192,
              temperature: 0.7
            }),
            signal: controller.signal
          }
        );
        
        clearTimeout(timeout);

        const data = await response.json() as any;
        console.log(`[AI] Response status: ${response.status}`);
        console.log('[AI] Full response:', JSON.stringify(data).slice(0, 500));
        console.log('[AI] Choices:', JSON.stringify(data.choices?.slice(0, 1)));

        if (!response.ok) {
          console.warn(`[AI] Model ${model} failed:`, data?.error?.message);
          lastError = data?.error?.message || `HTTP ${response.status}`;
          continue; // try next model
        }

        // OpenRouter can return content in different locations
        const raw = 
          data?.choices?.[0]?.message?.content ||
          data?.choices?.[0]?.text ||
          data?.message?.content ||
          data?.content ||
          null;

        if (!raw || raw.trim() === '') {
          // Log the actual error from OpenRouter if present
          if (data?.error) {
            lastError = `OpenRouter error: ${data.error.message || JSON.stringify(data.error)}`;
            console.warn(`[AI] Model ${model} returned empty content with error:`, lastError);
          } else {
            lastError = `No content returned. Response: ${JSON.stringify(data).slice(0, 200)}`;
            console.warn(`[AI] Model ${model} returned empty content`);
          }
          continue; // try next model
        }

        console.log(`[AI] ✅ Model ${model} succeeded`);
        return { raw, responseData: data, modelUsed: model };

      } catch (err: any) {
        console.warn(`[AI] Model ${model} threw error:`, err.message);
        lastError = err.message;
        continue; // try next model
      }
    }

    throw new Error(`All OpenRouter models failed. Last error: ${lastError}`);
  }

  const promptText = buildPrompt(assignment);
  let aiResult = await callAI({ system: systemPrompt, user: promptText });
  let parsedData = parseAIResponse(aiResult.raw, assignment);
  let responseData = aiResult.responseData;
  let usedModel = aiResult.modelUsed;

  const totalQ = parsedData.sections.flatMap((s: any) => s.questions).length;
  
  if (Math.abs(totalQ - assignment.numberOfQuestions) > 2) {
    console.log('[AI] Question count mismatch, retrying...');
    aiResult = await callAI({ system: systemPrompt, user: promptText });
    parsedData = parseAIResponse(aiResult.raw, assignment);
    responseData = aiResult.responseData;
    usedModel = aiResult.modelUsed;
  }

  return {
    assignmentId: assignment._id,
    title: parsedData.title || `${assignment.subject} Assessment - ${assignment.gradeLevel}`,
    subject: assignment.subject,
    gradeLevel: assignment.gradeLevel,
    duration: assignment.duration,
    totalMarks: assignment.totalMarks,
    sections: parsedData.sections,
    generatedAt: new Date(),
    metadata: {
      model: usedModel,
      promptTokens: responseData.usage?.prompt_tokens,
      completionTokens: responseData.usage?.completion_tokens,
    },
  };
}
