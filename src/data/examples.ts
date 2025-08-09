export interface ExampleGraph {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  nodes: Array<{
    id: string;
    label: string;
    nodeType: 'start' | 'process' | 'decision' | 'end';
    position: { x: number; y: number };
    description?: string;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    condition?: string;
    isConditional: boolean;
  }>;
}


// Streaming Chatbot Workflow Example based on the Burr FastAPI example
export const streamingChatbotWorkflow: ExampleGraph = {
  id: 'streaming-chatbot',
  title: 'Streaming Chatbot',
  description: 'A simple AI chatbot workflow with safety checks and multiple response modes',
  thumbnail: '/api/placeholder/300/200',
  nodes: [
    {
      id: 'input_prompt',
      label: 'input: prompt',
      nodeType: 'start',
      position: { x: 500, y: 50 }
    },
    {
      id: 'input_model',
      label: 'input: model',
      nodeType: 'start', 
      position: { x: 100, y: 400 }
    },
    {
      id: 'prompt',
      label: 'prompt',
      nodeType: 'process',
      position: { x: 500, y: 200 }
    },
    {
      id: 'check_safety',
      label: 'check_safety',
      nodeType: 'decision',
      position: { x: 500, y: 350 }
    },
    {
      id: 'decide_mode',
      label: 'decide_mode',
      nodeType: 'decision',
      position: { x: 400, y: 500 }
    },
    {
      id: 'unsafe_response',
      label: 'unsafe_response',
      nodeType: 'process',
      position: { x: 750, y: 500 }
    },
    {
      id: 'generate_code',
      label: 'generate_code',
      nodeType: 'process',
      position: { x: 150, y: 650 }
    },
    {
      id: 'answer_question',
      label: 'answer_question',
      nodeType: 'process',
      position: { x: 350, y: 700 }
    },
    {
      id: 'generate_poem',
      label: 'generate_poem',
      nodeType: 'process',
      position: { x: 550, y: 750 }
    },
    {
      id: 'prompt_for_more',
      label: 'prompt_for_more',
      nodeType: 'end',
      position: { x: 700, y: 700 }
    }
  ],
  edges: [
    {
      id: 'input_prompt-prompt',
      source: 'input_prompt',
      target: 'prompt',
      isConditional: false
    },
    {
      id: 'input_model-generate_code',
      source: 'input_model',
      target: 'generate_code',
      isConditional: false
    },
    {
      id: 'input_model-answer_question',
      source: 'input_model',
      target: 'answer_question',
      isConditional: false
    },
    {
      id: 'input_model-decide_mode',
      source: 'input_model',
      target: 'decide_mode',
      isConditional: false
    },
    {
      id: 'prompt-check_safety',
      source: 'prompt',
      target: 'check_safety',
      isConditional: false
    },
    {
      id: 'check_safety-decide_mode',
      source: 'check_safety',
      target: 'decide_mode',
      condition: 'safe=True',
      isConditional: true
    },
    {
      id: 'check_safety-unsafe_response',
      source: 'check_safety',
      target: 'unsafe_response',
      isConditional: false
    },
    {
      id: 'decide_mode-generate_code',
      source: 'decide_mode',
      target: 'generate_code',
      condition: 'mode=generate_code',
      isConditional: true
    },
    {
      id: 'decide_mode-answer_question',
      source: 'decide_mode',
      target: 'answer_question',
      condition: 'mode=answer_question',
      isConditional: true
    },
    {
      id: 'decide_mode-generate_poem',
      source: 'decide_mode',
      target: 'generate_poem',
      condition: 'mode=generate_poem',
      isConditional: true
    },
    {
      id: 'decide_mode-prompt_for_more',
      source: 'decide_mode',
      target: 'prompt_for_more',
      isConditional: false
    },
    {
      id: 'generate_code-prompt',
      source: 'generate_code',
      target: 'prompt',
      isConditional: false
    },
    {
      id: 'answer_question-prompt',
      source: 'answer_question',
      target: 'prompt',
      isConditional: false
    },
    {
      id: 'generate_poem-prompt',
      source: 'generate_poem',
      target: 'prompt',
      isConditional: false
    },
    {
      id: 'unsafe_response-prompt',
      source: 'unsafe_response',
      target: 'prompt',
      isConditional: false
    },
    {
      id: 'prompt_for_more-prompt',
      source: 'prompt_for_more',
      target: 'prompt',
      isConditional: false
    }
  ]
};

export const examples = [streamingChatbotWorkflow];
