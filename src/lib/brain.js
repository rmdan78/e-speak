
import { getTopicById } from './curriculum.js';

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// List of models to try in order. Maximum resilience against rate limits.
const MODELS = [
    'llama-3.1-8b-instant',      // 1. Primary: Fast & Efficient
    'mixtral-8x7b-32768',        // 2. Backup: High Context
    'llama-3.3-70b-versatile',   // 3. Smartest: Use sparingly
    'llama3-70b-8192',           // 4. Legacy Large
    'llama3-8b-8192',            // 5. Legacy Small
    'gemma2-9b-it',              // 6. Google Option 1
    'gemma-7b-it'                // 7. Google Option 2
];

let requestCount = 0;

export const getGeminiResponse = async (history, message, mode, topicId = null, customVocab = null, userProfile = null) => {
    requestCount++;
    console.log(`🔴 API Request #${requestCount}`);

    if (!API_KEY) {
        return { avatar_response: "API key not configured.", correction: null };
    }

    const topic = topicId ? getTopicById(topicId) : null;
    let systemPrompt = '';

    // --- PERSONALIZATION CONTEXT ---
    let personalityPrompt = "";
    if (userProfile) {
        personalityPrompt = `
USER PROFILE INFO:
- Name: ${userProfile.username}
- Profession/Field: ${userProfile.profession}
- English Level: ${userProfile.english_level}
- Learning Goal: "${userProfile.goal}"

ADAPTATION INSTRUCTIONS:
1. Adjust your language complexity to match their level (${userProfile.english_level}).
2. When giving examples or context, relate it to their profession (${userProfile.profession}).
3. Keep their goal in mind: ${userProfile.goal}.
`;
    }

    if (mode === 'practice') {
        const vocabSource = (customVocab && customVocab.length > 0) ? customVocab : (topic ? topic.vocabulary : []);
        const vocabList = vocabSource.map((word, i) => `${i + 1}. ${word}`).join('\n');

        systemPrompt = `You are a strict Vocabulary Drill Instructor.
Your goal is to teach the words below.

${personalityPrompt}

TARGET VOCABULARY LIST (STRICT ORDER):
${vocabList}

INSTRUCTIONS FOR NEW WORD INTRODUCTION:
1.  'avatar_response' (WHAT YOU SPEAK):
    - LANGUAGE: ENGLISH ONLY.
    - KEEP IT VERY SHORT.
    - IF it is the FIRST word (User said "START_DRILL..."): Say "Let's start. Your first word is [WORD]. Please use it in a sentence."
    - IF it is the NEXT word: Say "The next word is [WORD]. Please use it in a sentence."
    - DO NOT explain the meaning.

2.  'vocab_lesson' (WHAT USER READS IN SIDEBAR):
    - LANGUAGE: **BAHASA INDONESIA ONLY** for the definition.
    - **Usage Example MUST be in ENGLISH.**
    - Do NOT use markdown bold (**). Use UPPERCASE labels.
    - Format:
      ARTI: [Penjelasan Bahasa Indonesia]
      CONTOH: [English Sentence]

NORMAL FLOW (When User Succeeds):
1.  Verify the usage.
2.  If Correct:
    - Praise briefly (max 3 words, e.g. "Excellent!", "Perfect.").
    - IMMEDIATELY introduce the NEXT word.
    - **CRITICAL**: Update 'vocab_lesson' with the definition of the **NEW** word. Do not show the old word's lesson.
    - Update 'current_word' to the **NEW** word.
3.  If Incorrect:
    - Give feedback in 'correction'.
    - Ask to retry the SAME word.

RESPONSE FORMAT (JSON):
{
  "avatar_response": "ENGLISH. 'Good job. The next word is [WORD]...'",
  "current_word": "[NEW WORD]",
  "word_number": [NUMBER],
  "correction": "INDONESIA. Feedback (if wrong).",
  "vocab_lesson": "INDONESIA. Definition of [NEW WORD]."
}
`;
    } else {
        systemPrompt = `You are a professional English conversation partner.
ROLE: ${topic ? topic.role : 'Professional'} named ${topic ? topic.roleName : 'Alex'}
SCENARIO: ${topic ? topic.scenario : 'General conversation'}

${personalityPrompt}

RULES:
1. Speak ONLY in English.
2. Act naturally.
3. Do NOT teach unless asked.

RESPONSE FORMAT (JSON):
{
  "avatar_response": "ENGLISH ONLY. Response.",
  "correction": null,
  "vocab_lesson": null,
  "current_word": null,
  "word_number": null
}`;
    }

    const messages = [
        { role: "system", content: systemPrompt },
        ...history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: typeof msg.text === 'string' ? msg.text : JSON.stringify(msg.text)
        })),
        { role: "user", content: message }
    ];

    // --- AUTO-SWITCH MODEL LOGIC ---
    let lastError = null;

    for (const modelName of MODELS) {
        try {
            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: messages,
                    temperature: 0.2, // Low temp for consistency
                    max_tokens: 1024,
                    response_format: { type: "json_object" }
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (response.status === 429 || response.status === 503) {
                    console.warn(`Model ${modelName} hit rate limit/error. Switching...`);
                    lastError = `Rate limit on ${modelName}`;
                    continue;
                }
                throw new Error(`API Error ${response.status}: ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;
            return JSON.parse(content);

        } catch (error) {
            console.error(`Error with ${modelName}:`, error);
            lastError = error;
        }
    }

    console.error("All models failed.");
    return {
        avatar_response: "System overloaded. Please wait 10 seconds and try again.",
        correction: `All models busy. Last error: ${lastError}`
    };
};
