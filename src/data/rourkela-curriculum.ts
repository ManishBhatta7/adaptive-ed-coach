// Rourkela-specific curriculum content aligned with ICSE/CBSE/Odisha Board

export interface LessonContent {
  id: string;
  title: string;
  titleOdia: string;
  class: number;
  subject: string;
  board: 'ICSE' | 'CBSE' | 'Odisha';
  chapter: number;
  concepts: ConceptNode[];
  localContext: LocalContext;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // minutes
  prerequisites: string[];
  learningOutcomes: string[];
  assessmentQuestions: Question[];
  practiceProblems: PracticeProblem[];
  multimedia: MultimediaContent[];
}

export interface ConceptNode {
  id: string;
  concept: string;
  conceptOdia: string;
  explanation: string;
  explanationOdia: string;
  examples: Example[];
  diagrams?: string[];
  formulas?: Formula[];
  keyTerms: KeyTerm[];
}

export interface LocalContext {
  rourkelaExamples: string[];
  industrialConnections: string[];
  culturalReferences: string[];
  environmentalContext: string[];
}

export interface Example {
  description: string;
  descriptionOdia: string;
  isLocal: boolean;
  relatedTo?: 'steel_plant' | 'mining' | 'forest' | 'river' | 'tribal_culture';
}

export interface Formula {
  name: string;
  nameOdia: string;
  formula: string;
  variables: { symbol: string; meaning: string; meaningOdia: string }[];
  example: string;
}

export interface KeyTerm {
  term: string;
  termOdia: string;
  definition: string;
  definitionOdia: string;
}

export interface Question {
  id: string;
  question: string;
  questionOdia: string;
  type: 'mcq' | 'short' | 'long' | 'numerical';
  options?: string[];
  optionsOdia?: string[];
  correctAnswer: string;
  explanation: string;
  explanationOdia: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
}

export interface PracticeProblem {
  id: string;
  problem: string;
  problemOdia: string;
  solution: string;
  solutionOdia: string;
  steps: string[];
  stepsOdia: string[];
  hints: string[];
  hintsOdia: string[];
}

export interface MultimediaContent {
  type: 'video' | 'animation' | 'simulation' | 'image';
  url: string;
  title: string;
  titleOdia: string;
  description: string;
  descriptionOdia: string;
  duration?: number;
  thumbnail?: string;
}

// Sample content for Class 6 Science - Light and Shadows
export const sampleScienceContent: LessonContent = {
  id: 'sci_6_light_shadows',
  title: 'Light and Shadows',
  titleOdia: 'ଆଲୋକ ଏବଂ ଛାୟା',
  class: 6,
  subject: 'Science',
  board: 'Odisha',
  chapter: 11,
  difficulty: 'easy',
  estimatedTime: 45,
  prerequisites: ['basic_observation_skills'],
  learningOutcomes: [
    'Students will understand how light travels',
    'Students will identify different sources of light',
    'Students will explain how shadows are formed'
  ],
  concepts: [
    {
      id: 'light_sources',
      concept: 'Sources of Light',
      conceptOdia: 'ଆଲୋକର ଉତ୍ସ',
      explanation: 'Light comes from different sources. Some objects produce their own light (luminous objects) while others reflect light (non-luminous objects).',
      explanationOdia: 'ଆଲୋକ ବିଭିନ୍ନ ଉତ୍ସରୁ ଆସେ। କିଛି ବସ୍ତୁ ନିଜର ଆଲୋକ ଉତ୍ପାଦନ କରନ୍ତି (ଆଲୋକିତ ବସ୍ତୁ) ଏବଂ ଅନ୍ୟମାନେ ଆଲୋକ ପ୍ରତିଫଳିତ କରନ୍ତି (ଅନାଲୋକିତ ବସ୍ତୁ)।',
      examples: [
        {
          description: 'The steel plant furnace in Rourkela glows brightly - it produces its own light',
          descriptionOdia: 'ରାଉରକେଲାର ଇସ୍ପାତ କାରଖାନାର ଚୁଲି ଉଜ୍ଜ୍ୱଳ ଭାବରେ ଜଳେ - ଏହା ନିଜର ଆଲୋକ ଉତ୍ପାଦନ କରେ',
          isLocal: true,
          relatedTo: 'steel_plant'
        },
        {
          description: 'The Brahmani river reflects sunlight during day time',
          descriptionOdia: 'ବ୍ରହ୍ମାଣୀ ନଦୀ ଦିନ ସମୟରେ ସୂର୍ଯ୍ୟ ଆଲୋକ ପ୍ରତିଫଳିତ କରେ',
          isLocal: true,
          relatedTo: 'river'
        },
        {
          description: 'Fireflies seen in Rourkela forests produce their own light',
          descriptionOdia: 'ରାଉରକେଲା ଜଙ୍ଗଲରେ ଦେଖାଯାଉଥିବା ଜୁଗନୁ ନିଜର ଆଲୋକ ଉତ୍ପାଦନ କରନ୍ତି',
          isLocal: true,
          relatedTo: 'forest'
        }
      ],
      keyTerms: [
        {
          term: 'Luminous objects',
          termOdia: 'ଆଲୋକିତ ବସ୍ତୁ',
          definition: 'Objects that produce their own light',
          definitionOdia: 'ଯେଉଁ ବସ୍ତୁମାନେ ନିଜର ଆଲୋକ ଉତ୍ପାଦନ କରନ୍ତି'
        },
        {
          term: 'Non-luminous objects',
          termOdia: 'ଅନାଲୋକିତ ବସ୍ତୁ',
          definition: 'Objects that do not produce their own light',
          definitionOdia: 'ଯେଉଁ ବସ୍ତୁମାନେ ନିଜର ଆଲୋକ ଉତ୍ପାଦନ କରନ୍ତି ନାହିଁ'
        }
      ]
    },
    {
      id: 'shadow_formation',
      concept: 'Formation of Shadows',
      conceptOdia: 'ଛାୟା ସୃଷ୍ଟି',
      explanation: 'Shadows are formed when light cannot pass through an object. The object blocks the light and creates a dark area behind it.',
      explanationOdia: 'ଆଲୋକ ଏକ ବସ୍ତୁ ଦେଇ ଯାଇପାରେ ନାହିଁ ଯେତେବେଳେ ଛାୟା ସୃଷ୍ଟି ହୁଏ। ବସ୍ତୁ ଆଲୋକକୁ ଅବରୋଧ କରେ ଏବଂ ଏହାର ପଛରେ ଏକ ଅନ୍ଧକାର ଅଞ୍ଚଳ ସୃଷ୍ଟି କରେ।',
      examples: [
        {
          description: 'The shadow of the Rourkela Steel Plant chimney can be seen on the ground during sunny days',
          descriptionOdia: 'ଖରା ଦିନରେ ରାଉରକେଲା ଇସ୍ପାତ କାରଖାନାର ଚିମିନିର ଛାୟା ଭୂମିରେ ଦେଖାଯାଏ',
          isLocal: true,
          relatedTo: 'steel_plant'
        },
        {
          description: 'Tree shadows provide cool areas for people to rest during hot afternoons',
          descriptionOdia: 'ଗରମ ଅପରାହ୍ନରେ ଗଛର ଛାୟା ଲୋକମାନଙ୍କ ବିଶ୍ରାମ ପାଇଁ ଥଣ୍ଡା ସ୍ଥାନ ପ୍ରଦାନ କରେ',
          isLocal: false
        }
      ],
      keyTerms: [
        {
          term: 'Shadow',
          termOdia: 'ଛାୟା',
          definition: 'A dark area formed when light is blocked by an object',
          definitionOdia: 'ଆଲୋକ ଏକ ବସ୍ତୁ ଦ୍ୱାରା ଅବରୋଧିତ ହେଲେ ସୃଷ୍ଟି ହେଉଥିବା ଅନ୍ଧକାର ଅଞ୍ଚଳ'
        }
      ]
    }
  ],
  localContext: {
    rourkelaExamples: [
      'Steel plant furnace as a source of light and heat',
      'Industrial chimneys casting long shadows',
      'Brahmani river reflecting sunlight',
      'Forest fireflies producing natural light'
    ],
    industrialConnections: [
      'How furnaces in steel plants produce light through high temperature',
      'Use of artificial lighting in industrial areas',
      'Shadow analysis in industrial design'
    ],
    culturalReferences: [
      'Traditional oil lamps (diya) used during festivals',
      'Shadow puppet shows in Odisha culture',
      'Sun worship traditions'
    ],
    environmentalContext: [
      'Effect of industrial lighting on local wildlife',
      'Natural light cycles in forest areas',
      'Seasonal shadow patterns'
    ]
  },
  assessmentQuestions: [
    {
      id: 'q1',
      question: 'Which of the following is a luminous object?',
      questionOdia: 'ନିମ୍ନଲିଖିତ ମଧ୍ୟରୁ କେଉଁଟି ଆଲୋକିତ ବସ୍ତୁ?',
      type: 'mcq',
      options: ['Moon', 'Steel plant furnace', 'Mirror', 'Water'],
      optionsOdia: ['ଚନ୍ଦ୍ର', 'ଇସ୍ପାତ କାରଖାନାର ଚୁଲି', 'ଦର୍ପଣ', 'ପାଣି'],
      correctAnswer: 'Steel plant furnace',
      explanation: 'Steel plant furnace produces its own light due to high temperature, making it a luminous object.',
      explanationOdia: 'ଇସ୍ପାତ କାରଖାନାର ଚୁଲି ଉଚ୍ଚ ତାପମାତ୍ରା କାରଣରୁ ନିଜର ଆଲୋକ ଉତ୍ପାଦନ କରେ, ଏହାକୁ ଆଲୋକିତ ବସ୍ତୁ କରେ।',
      difficulty: 'easy',
      marks: 1
    }
  ],
  practiceProblems: [
    {
      id: 'p1',
      problem: 'Observe shadows at different times of the day near your school. What changes do you notice?',
      problemOdia: 'ଆପଣଙ୍କ ବିଦ୍ୟାଳୟ ନିକଟରେ ଦିନର ବିଭିନ୍ନ ସମୟରେ ଛାୟା ପରିଦର୍ଶନ କରନ୍ତୁ। ଆପଣ କଣ ପରିବର୍ତ୍ତନ ଦେଖନ୍ତି?',
      solution: 'Shadows are longest in early morning and late evening when the sun is low. They are shortest at noon when the sun is overhead.',
      solutionOdia: 'ସୂର୍ଯ୍ୟ ନିମ୍ନରେ ଥିବାବେଳେ ଛାୟା ସକାଳ ଏବଂ ସନ୍ଧ୍ୟାରେ ସବୁଠାରୁ ଲମ୍ବା ହୁଏ। ମଧ୍ୟାହ୍ନରେ ସୂର୍ଯ୍ୟ ଉପରେ ଥିବାବେଳେ ଏହା ସବୁଠାରୁ ଛୋଟ ହୁଏ।',
      steps: [
        'Go outside during morning, noon, and evening',
        'Place a stick vertically on the ground',
        'Measure and draw the shadow at each time',
        'Compare the lengths and directions'
      ],
      stepsOdia: [
        'ସକାଳ, ମଧ୍ୟାହ୍ନ ଏବଂ ସନ୍ଧ୍ୟାରେ ବାହାରକୁ ଯାଆନ୍ତୁ',
        'ଭୂମିରେ ଗୋଟିଏ ଦଣ୍ଡ ଲମ୍ବ ଭାବରେ ରଖନ୍ତୁ',
        'ପ୍ରତ୍ୟେକ ସମୟରେ ଛାୟା ମାପ କରି ଆଙ୍କନ୍ତୁ',
        'ଲମ୍ବତା ଏବଂ ଦିଗ ତୁଳନା କରନ୍ତୁ'
      ],
      hints: [
        'Use the same stick and location for all measurements',
        'Mark the tip of the shadow clearly',
        'Notice which direction the shadow points'
      ],
      hintsOdia: [
        'ସମସ୍ତ ମାପ ପାଇଁ ସମାନ ଦଣ୍ଡ ଏବଂ ସ୍ଥାନ ବ୍ୟବହାର କରନ୍ତୁ',
        'ଛାୟାର ଟିପକୁ ସ୍ପଷ୍ଟ ଭାବରେ ଚିହ୍ନିତ କରନ୍ତୁ',
        'ଛାୟା କେଉଁ ଦିଗକୁ ସୂଚାଏ ତାହା ଲକ୍ଷ୍ୟ କରନ୍ତୁ'
      ]
    }
  ],
  multimedia: [
    {
      type: 'animation',
      url: '/animations/shadow_formation.mp4',
      title: 'How Shadows are Formed',
      titleOdia: 'ଛାୟା କିପରି ସୃଷ୍ଟି ହୁଏ',
      description: 'Interactive animation showing shadow formation with different light sources',
      descriptionOdia: 'ବିଭିନ୍ନ ଆଲୋକ ଉତ୍ସ ସହିତ ଛାୟା ସୃଷ୍ଟି ଦର୍ଶାଉଥିବା ଇଣ୍ଟରଆକ୍ଟିଭ ଆନିମେସନ',
      duration: 180
    }
  ]
};

// Mathematics content for Class 7 - Fractions
export const sampleMathContent: LessonContent = {
  id: 'math_7_fractions',
  title: 'Fractions and Decimals',
  titleOdia: 'ଭଗ୍ନାଂଶ ଏବଂ ଦଶମିକ',
  class: 7,
  subject: 'Mathematics',
  board: 'CBSE',
  chapter: 2,
  difficulty: 'medium',
  estimatedTime: 60,
  prerequisites: ['basic_arithmetic', 'number_system'],
  learningOutcomes: [
    'Students will understand fraction representations',
    'Students will perform operations on fractions',
    'Students will convert fractions to decimals'
  ],
  concepts: [
    {
      id: 'fraction_basics',
      concept: 'Understanding Fractions',
      conceptOdia: 'ଭଗ୍ନାଂଶ ବୁଝିବା',
      explanation: 'A fraction represents a part of a whole. It consists of a numerator (top number) and denominator (bottom number).',
      explanationOdia: 'ଏକ ଭଗ୍ନାଂଶ ସମ୍ପୂର୍ଣ୍ଣର ଏକ ଅଂଶକୁ ପ୍ରତିନିଧିତ୍ୱ କରେ। ଏହାରେ ଗୋଟିଏ ଲବ (ଉପର ସଂଖ୍ୟା) ଏବଂ ହର (ତଳ ସଂଖ୍ୟା) ଅଛି।',
      examples: [
        {
          description: 'If Rourkela Steel Plant produces 100 tons of steel and ships 3/4 of it, how much is shipped?',
          descriptionOdia: 'ଯଦି ରାଉରକେଲା ଇସ୍ପାତ କାରଖାନା 100 ଟନ ଇସ୍ପାତ ଉତ୍ପାଦନ କରେ ଏବଂ ଏହାର 3/4 ପଠାଇବ, କେତେ ପଠାଇବ?',
          isLocal: true,
          relatedTo: 'steel_plant'
        },
        {
          description: 'A tribal village near Rourkela has 2/3 of its area covered by forest',
          descriptionOdia: 'ରାଉରକେଲା ନିକଟ ଏକ ଆଦିବାସୀ ଗାଁର 2/3 ଅଂଶ ଜଙ୍ଗଲ ଦ୍ୱାରା ଆବୃତ',
          isLocal: true,
          relatedTo: 'tribal_culture'
        }
      ],
      formulas: [
        {
          name: 'Fraction Addition (Same Denominator)',
          nameOdia: 'ଭଗ୍ନାଂଶ ଯୋଗ (ସମାନ ହର)',
          formula: 'a/c + b/c = (a+b)/c',
          variables: [
            { symbol: 'a', meaning: 'First numerator', meaningOdia: 'ପ୍ରଥମ ଲବ' },
            { symbol: 'b', meaning: 'Second numerator', meaningOdia: 'ଦ୍ୱିତୀୟ ଲବ' },
            { symbol: 'c', meaning: 'Common denominator', meaningOdia: 'ସାଧାରଣ ହର' }
          ],
          example: '2/5 + 1/5 = 3/5'
        }
      ],
      keyTerms: [
        {
          term: 'Numerator',
          termOdia: 'ଲବ',
          definition: 'The top number in a fraction',
          definitionOdia: 'ଭଗ୍ନାଂଶର ଉପର ସଂଖ୍ୟା'
        },
        {
          term: 'Denominator',
          termOdia: 'ହର',
          definition: 'The bottom number in a fraction',
          definitionOdia: 'ଭଗ୍ନାଂଶର ତଳ ସଂଖ୍ୟା'
        }
      ]
    }
  ],
  localContext: {
    rourkelaExamples: [
      'Steel production ratios and fractions',
      'Mining output calculations',
      'Population demographics in fractions'
    ],
    industrialConnections: [
      'Quality control percentages in manufacturing',
      'Material composition ratios',
      'Production efficiency calculations'
    ],
    culturalReferences: [
      'Traditional measurements in local markets',
      'Festival preparation ratios',
      'Agricultural yield calculations'
    ],
    environmentalContext: [
      'Forest coverage ratios',
      'Water resource distribution',
      'Pollution level measurements'
    ]
  },
  assessmentQuestions: [
    {
      id: 'q1',
      question: 'What is 1/3 + 2/3?',
      questionOdia: '1/3 + 2/3 କେତେ?',
      type: 'short',
      correctAnswer: '1 or 3/3',
      explanation: 'When adding fractions with the same denominator, add the numerators: 1+2=3, so 3/3 = 1',
      explanationOdia: 'ସମାନ ହର ଥିବା ଭଗ୍ନାଂଶ ଯୋଗ କରିବାବେଳେ, ଲବଗୁଡ଼ିକ ଯୋଗ କରନ୍ତୁ: 1+2=3, ତେଣୁ 3/3 = 1',
      difficulty: 'easy',
      marks: 2
    }
  ],
  practiceProblems: [
    {
      id: 'p1',
      problem: 'The Rourkela Steel Plant produces steel in three shifts. Morning shift produces 2/7 of daily output, afternoon shift produces 3/7, and night shift produces the rest. What fraction does the night shift produce?',
      problemOdia: 'ରାଉରକେଲା ଇସ୍ପାତ କାରଖାନା ତିନି ସିଫ୍ଟରେ ଇସ୍ପାତ ଉତ୍ପାଦନ କରେ। ସକାଳ ସିଫ୍ଟ ଦୈନିକ ଉତ୍ପାଦନର 2/7, ଅପରାହ୍ନ ସିଫ୍ଟ 3/7, ଏବଂ ରାତି ସିଫ୍ଟ ବାକି। ରାତି ସିଫ୍ଟ କେତେ ଭଗ୍ନାଂଶ ଉତ୍ପାଦନ କରେ?',
      solution: '2/7 (night shift produces 2/7 of daily output)',
      solutionOdia: '2/7 (ରାତି ସିଫ୍ଟ ଦୈନିକ ଉତ୍ପାଦନର 2/7 ଉତ୍ପାଦନ କରେ)',
      steps: [
        'Total production = 1 (whole)',
        'Morning + Afternoon = 2/7 + 3/7 = 5/7',
        'Night shift = 1 - 5/7 = 7/7 - 5/7 = 2/7'
      ],
      stepsOdia: [
        'ମୋଟ ଉତ୍ପାଦନ = 1 (ସମ୍ପୂର୍ଣ୍ଣ)',
        'ସକାଳ + ଅପରାହ୍ନ = 2/7 + 3/7 = 5/7',
        'ରାତି ସିଫ୍ଟ = 1 - 5/7 = 7/7 - 5/7 = 2/7'
      ],
      hints: [
        'The total of all three shifts should equal 1',
        'Add the morning and afternoon fractions first'
      ],
      hintsOdia: [
        'ତିନି ସିଫ୍ଟର ମୋଟ 1 ହେବା ଉଚିତ',
        'ପ୍ରଥମେ ସକାଳ ଏବଂ ଅପରାହ୍ନର ଭଗ୍ନାଂଶ ଯୋଗ କରନ୍ତୁ'
      ]
    }
  ],
  multimedia: [
    {
      type: 'simulation',
      url: '/simulations/fraction_visualizer.html',
      title: 'Fraction Visualizer',
      titleOdia: 'ଭଗ୍ନାଂଶ ଦୃଶ୍ୟକାରୀ',
      description: 'Interactive tool to visualize fractions using local examples',
      descriptionOdia: 'ସ୍ଥାନୀୟ ଉଦାହରଣ ବ୍ୟବହାର କରି ଭଗ୍ନାଂଶ ଦୃଶ୍ୟମାନ କରିବା ପାଇଁ ଇଣ୍ଟରଆକ୍ଟିଭ ଉପକରଣ'
    }
  ]
};

// Export all curriculum data
export const rourkelaCurriculum = {
  science: {
    6: [sampleScienceContent],
    7: [],
    8: [],
    9: [],
    10: []
  },
  mathematics: {
    6: [],
    7: [sampleMathContent],
    8: [],
    9: [],
    10: []
  },
  english: {
    6: [],
    7: [],
    8: [],
    9: [],
    10: []
  }
};

// Helper functions
export function getContentByClassAndSubject(className: number, subject: string): LessonContent[] {
  return rourkelaCurriculum[subject as keyof typeof rourkelaCurriculum][className] || [];
}

export function getLocalContextExamples(relationType: string): string[] {
  const examples = {
    steel_plant: [
      'Rourkela Steel Plant furnace temperatures',
      'Iron ore processing calculations',
      'Steel production efficiency',
      'Industrial safety measurements'
    ],
    mining: [
      'Iron ore extraction rates',
      'Mining depth calculations',
      'Mineral composition analysis',
      'Environmental impact measurements'
    ],
    forest: [
      'Tree species diversity in local forests',
      'Wildlife population studies',
      'Deforestation impact calculations',
      'Forest cover percentage'
    ],
    river: [
      'Brahmani river flow rates',
      'Water pollution measurements',
      'Seasonal water level changes',
      'Aquatic ecosystem studies'
    ],
    tribal_culture: [
      'Traditional measurement systems',
      'Population demographics',
      'Cultural festival preparations',
      'Agricultural practices'
    ]
  };
  
  return examples[relationType as keyof typeof examples] || [];
}