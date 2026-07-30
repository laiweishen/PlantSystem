// ⭐ NEW FUNCTION - Generate mixed quiz from both plant and disease questions
export const generateMixedAutoQuiz = (plantQuestions, diseaseQuestions, numQuestions) => {
  console.log('🎯 Generating MIXED auto quiz');
  console.log('Plant questions available:', plantQuestions.length);
  console.log('Disease questions available:', diseaseQuestions.length);
  console.log('Requested questions:', numQuestions);
  
  // Combine all questions and mark their type
  const allQuestions = [
    ...plantQuestions.map(q => ({ ...q, type: 'plant' })),
    ...diseaseQuestions.map(q => ({ ...q, type: 'disease' }))
  ];
  
  console.log('Total available questions:', allQuestions.length);
  
  // Shuffle all questions together
  const shuffled = shuffleArray(allQuestions);
  
  // Take the requested number (or all if not enough)
  const selected = shuffled.slice(0, Math.min(numQuestions, shuffled.length));
  
  console.log('Selected questions:', selected.length);
  
  // Transform to quiz format with shuffled options
  const questions = selected.map((q, index) => {
    // Shuffle the options array
    const shuffledOptions = shuffleArray([...q.options]);
    
    // Convert to object format
    const optionsObject = {
      'A': shuffledOptions[0],
      'B': shuffledOptions[1],
      'C': shuffledOptions[2],
      'D': shuffledOptions[3]
    };
    
    // Find correct answer from original data
    let correctAnswer = shuffledOptions[0]; // Default fallback
    
    // Try to find the correct answer in the shuffled options
    if (q.correctAnswer) {
      // If correctAnswer is a letter (A, B, C, D), map it to the original option
      if (['A', 'B', 'C', 'D'].includes(q.correctAnswer)) {
        const originalOptions = q.options;
        const correctIndex = q.correctAnswer.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
        correctAnswer = originalOptions[correctIndex];
      } else {
        correctAnswer = q.correctAnswer;
      }
    }
    
    // Find which letter has the correct answer in shuffled options
    const correctAnswerLetter = findAnswerLetter(optionsObject, correctAnswer);
    
    return {
      id: index + 1,
      questionText: q.questionText || `Identify this ${q.type}:`,
      imageUrl: q.imageUrl || null,
      options: optionsObject,
      correctAnswer: correctAnswer,
      correctAnswerLetter: correctAnswerLetter,
      difficulty: 2,
      questionType: q.type // Track if it's plant or disease
    };
  });
  
  const plantCount = questions.filter(q => q.questionType === 'plant').length;
  const diseaseCount = questions.filter(q => q.questionType === 'disease').length;
  
  console.log('✅ Generated mixed quiz:', {
    total: questions.length,
    plant: plantCount,
    disease: diseaseCount
  });
  
  return questions;
};

// Original function - still available for single-type quizzes
export const generateAutoQuiz = (classNames, quizType, numQuestions, existingImages = []) => {
  const questions = [];
  
  // Extract unique plants and diseases
  const plants = extractUniquePlants(classNames);
  const diseases = extractUniqueDiseases(classNames);
  
  for (let i = 0; i < numQuestions; i++) {
    if (quizType === 'plant') {
      questions.push(generatePlantQuestion(plants, i, existingImages));
    } else {
      questions.push(generateDiseaseQuestion(diseases, i, existingImages));
    }
  }

  return questions;
};

// Helper functions
const extractUniquePlants = (classNames) => {
  const plants = new Set();
  classNames.forEach(className => {
    if (className.includes('___')) {
      const plant = className.split('___')[0];
      plants.add(cleanPlantName(plant));
    }
  });
  return Array.from(plants);
};

const extractUniqueDiseases = (classNames) => {
  const diseases = new Set();
  classNames.forEach(className => {
    if (className.includes('___')) {
      const disease = className.split('___')[1];
      if (disease.toLowerCase() !== 'healthy') {
        diseases.add(cleanDiseaseName(disease));
      }
    }
  });
  return Array.from(diseases);
};

const generatePlantQuestion = (plants, index, existingImages) => {
  const correctPlant = plants[Math.floor(Math.random() * plants.length)];
  const wrongOptions = getWrongOptions(plants, correctPlant, 3);
  const allOptions = shuffleArray([correctPlant, ...wrongOptions]);
  
  // Convert array to object with A, B, C, D keys
  const optionsObject = {
    'A': allOptions[0],
    'B': allOptions[1],
    'C': allOptions[2],
    'D': allOptions[3]
  };
  
  // Find the correct answer letter
  const correctAnswerLetter = findAnswerLetter(optionsObject, correctPlant);

  // Find matching image from database
  const matchingImage = existingImages.find(img => 
    img.name.toLowerCase().includes(correctPlant.toLowerCase())
  );
  
  return {
    id: index + 1,
    questionText: 'Identify this plant:',
    imageUrl: matchingImage?.url || null,
    options: optionsObject,
    correctAnswer: correctPlant,
    correctAnswerLetter: correctAnswerLetter,
    difficulty: 2
  };
};

const generateDiseaseQuestion = (diseases, index, existingImages) => {
  const correctDisease = diseases[Math.floor(Math.random() * diseases.length)];
  const wrongOptions = getWrongOptions(diseases, correctDisease, 3);
  const allOptions = shuffleArray([correctDisease, ...wrongOptions]);
  
  // Convert array to object with A, B, C, D keys
  const optionsObject = {
    'A': allOptions[0],
    'B': allOptions[1],
    'C': allOptions[2],
    'D': allOptions[3]
  };
  
  // Find the correct answer letter
  const correctAnswerLetter = findAnswerLetter(optionsObject, correctDisease);
  
  // Find matching image from database
  const matchingImage = existingImages.find(img => 
    img.name.toLowerCase().includes(correctDisease.toLowerCase())
  );

  return {
    id: index + 1,
    questionText: 'Identify this plant disease:',
    imageUrl: matchingImage?.url || null,
    options: optionsObject,
    correctAnswer: correctDisease,
    correctAnswerLetter: correctAnswerLetter,
    difficulty: 2
  };
};

// Helper function to find the letter for a given answer text
const findAnswerLetter = (optionsObject, correctAnswer) => {
  for (const [letter, text] of Object.entries(optionsObject)) {
    if (text?.toLowerCase() === correctAnswer?.toLowerCase()) {
      return letter;
    }
  }
  return 'A'; // Fallback
};

const getWrongOptions = (allItems, correctItem, count) => {
  const wrongItems = allItems.filter(item => item !== correctItem);
  return shuffleArray(wrongItems).slice(0, count);
};

const shuffleArray = (array) => {
  return [...array].sort(() => Math.random() - 0.5);
};

const cleanPlantName = (plant) => {
  return plant.replace(/\([^)]*\)/g, '').trim();
};

const cleanDiseaseName = (disease) => {
  return disease.replace(/_/g, ' ');
};
