import type { InterviewQuestion } from '../../../types/clinical';

/* ═══════════════════ 1. Prakriti (Constitution) ═══════════════════ */

export const PRAKRITI_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'ayush_prakriti_body',
    section: 'ayush_prakriti',
    type: 'single_choice',
    text_en: 'How would you describe your natural body build?',
    text_hi: 'आपकी स्वाभाविक शारीरिक बनावट कैसी है?',
    options: [
      { id: 'vata_build', label_en: 'Thin, hard to gain weight', label_hi: 'पतला, वज़न बढ़ाना मुश्किल', icon: '🍃' }, // Vata
      { id: 'pitta_build', label_en: 'Medium build, muscular', label_hi: 'मध्यम, सुडौल', icon: '🔥' }, // Pitta
      { id: 'kapha_build', label_en: 'Broad, easy to gain weight', label_hi: 'चौड़ा, जल्दी वज़न बढ़ता है', icon: '💧' }, // Kapha
    ],
  },
  {
    id: 'ayush_prakriti_skin',
    section: 'ayush_prakriti',
    type: 'single_choice',
    text_en: 'What is your natural skin type?',
    text_hi: 'आपकी त्वचा का प्राकृतिक प्रकार क्या है?',
    options: [
      { id: 'vata_skin', label_en: 'Dry, rough, cool', label_hi: 'सूखी, खुरदरी, ठंडी', icon: '🏜️' },
      { id: 'pitta_skin', label_en: 'Warm, oily, prone to acne/redness', label_hi: 'गर्म, तैलीय, मुहांसे/लालिमा', icon: '🌡️' },
      { id: 'kapha_skin', label_en: 'Thick, smooth, well-moisturized', label_hi: 'मोटी, मुलायम, नमीयुक्त', icon: '🧴' },
    ],
  },
  {
    id: 'ayush_prakriti_sleep',
    section: 'ayush_prakriti',
    type: 'single_choice',
    text_en: 'How is your sleep pattern?',
    text_hi: 'आपकी नींद कैसी है?',
    options: [
      { id: 'vata_sleep', label_en: 'Light, frequently interrupted', label_hi: 'कच्ची, बार-बार टूटती है', icon: '👁️' },
      { id: 'pitta_sleep', label_en: 'Moderate, sound but short', label_hi: 'मध्यम, गहरी लेकिन कम', icon: '😴' },
      { id: 'kapha_sleep', label_en: 'Deep, prolonged, hard to wake up', label_hi: 'गहरी, लंबी, उठने में मुश्किल', icon: '🛌' },
    ],
  },
  {
    id: 'ayush_prakriti_mind',
    section: 'ayush_prakriti',
    type: 'single_choice',
    text_en: 'How do you usually react to stress?',
    text_hi: 'तनाव के समय आपकी प्रतिक्रिया कैसी होती है?',
    options: [
      { id: 'vata_mind', label_en: 'Anxious, worried, restless', label_hi: 'चिंता, घबराहट, बेचैनी', icon: '😰' },
      { id: 'pitta_mind', label_en: 'Irritable, angry, impatient', label_hi: 'चिड़चिड़ापन, गुस्सा, अधीरता', icon: '😠' },
      { id: 'kapha_mind', label_en: 'Calm, slow, sometimes depressed', label_hi: 'शांत, धीमा, कभी-कभी उदास', icon: '🧘' },
    ],
  },
];

/* ═══════════════════ 2. Vikriti (Imbalance) ═══════════════════ */

export const VIKRITI_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'ayush_vikriti_symptoms',
    section: 'ayush_vikriti',
    type: 'multi_choice',
    text_en: 'Currently, are you experiencing any of these? (Select all that apply)',
    text_hi: 'वर्तमान में, क्या आपको इनमें से कुछ महसूस हो रहा है? (सभी लागू चुनें)',
    options: [
      { id: 'vata_vikriti', label_en: 'Dryness, gas/bloating, pain, coldness', label_hi: 'सूखापन, गैस/सूजन, दर्द, ठंडक', icon: '🍃' },
      { id: 'pitta_vikriti', label_en: 'Heartburn, inflammation, heat, anger', label_hi: 'जलन, सूजन, गर्मी, गुस्सा', icon: '🔥' },
      { id: 'kapha_vikriti', label_en: 'Heaviness, congestion, lethargy, swelling', label_hi: 'भारीपन, कफ/बलगम, सुस्ती, सूजन', icon: '💧' },
      { id: 'none', label_en: 'None of these', label_hi: 'इनमें से कोई नहीं', icon: '✅' },
    ],
  },
];

/* ═══════════════════ 3-9. Other Dashavidha Parameters ═══════════════════ */

export const DASHAVIDHA_QUESTIONS: InterviewQuestion[] = [
  // 3. Sara (Tissue Quality)
  {
    id: 'ayush_sara_quality',
    section: 'ayush_sara',
    type: 'single_choice',
    text_en: 'How would you describe your overall tissue and organ health?',
    text_hi: 'आप अपने समग्र ऊतकों (tissues) और अंगों के स्वास्थ्य का वर्णन कैसे करेंगे?',
    options: [
      { id: 'pravara', label_en: 'Excellent (Strong, very rarely sick)', label_hi: 'उत्तम (मज़बूत, बहुत कम बीमार)', icon: '🟢' },
      { id: 'madhyama', label_en: 'Moderate (Average health)', label_hi: 'मध्यम (औसत स्वास्थ्य)', icon: '🟡' },
      { id: 'avara', label_en: 'Poor (Weak, fall sick often)', label_hi: 'अवर (कमज़ोर, बार-बार बीमार)', icon: '🔴' },
    ],
  },

  // 4. Samhanana (Compactness / Build)
  {
    id: 'ayush_samhanana',
    section: 'ayush_samhanana',
    type: 'single_choice',
    text_en: 'How compact and firm is your body?',
    text_hi: 'आपका शरीर कितना गठीला और सुडौल है?',
    options: [
      { id: 'pravara', label_en: 'Very firm & muscular', label_hi: 'बहुत सुडौल और गठीला', icon: '💪' },
      { id: 'madhyama', label_en: 'Moderately firm', label_hi: 'मध्यम सुडौल', icon: '🧍' },
      { id: 'avara', label_en: 'Loose / Flabby', label_hi: 'ढीला', icon: '🚶' },
    ],
  },

  // 6. Satmya (Adaptability)
  {
    id: 'ayush_satmya',
    section: 'ayush_satmya',
    type: 'single_choice',
    text_en: 'How well do you adapt to changes in food and weather?',
    text_hi: 'भोजन और मौसम में बदलाव के प्रति आपकी अनुकूलता (adaptability) कैसी है?',
    options: [
      { id: 'sarva', label_en: 'Can tolerate any food/weather easily', label_hi: 'कोई भी भोजन/मौसम आसानी से सहन होता है', icon: '🌟' },
      { id: 'eka', label_en: 'Can only tolerate specific foods/weather', label_hi: 'केवल विशिष्ट भोजन/मौसम सहन होता है', icon: '⚠️' },
    ],
  },

  // 7. Satva (Mental Strength)
  {
    id: 'ayush_satva',
    section: 'ayush_satva',
    type: 'single_choice',
    text_en: 'How much pain or difficulty can you mentally tolerate?',
    text_hi: 'आप मानसिक रूप से कितना दर्द या कठिनाई सहन कर सकते हैं?',
    options: [
      { id: 'pravara', label_en: 'High tolerance (Strong mind)', label_hi: 'उच्च सहनशीलता (मज़बूत मन)', icon: '🧠' },
      { id: 'madhyama', label_en: 'Moderate (Needs support)', label_hi: 'मध्यम (सहारे की ज़रूरत)', icon: '🤝' },
      { id: 'avara', label_en: 'Low (Easily frightened/upset)', label_hi: 'निम्न (आसानी से डर/घबराहट)', icon: '😰' },
    ],
  },

  // 8. Ahara Shakti (Digestive Power)
  {
    id: 'ayush_ahara',
    section: 'ayush_ahara',
    type: 'single_choice',
    text_en: 'How is your appetite and digestion?',
    text_hi: 'आपकी भूख और पाचन शक्ति कैसी है?',
    options: [
      { id: 'teekshna', label_en: 'Strong, digest quickly, very hungry', label_hi: 'तेज़ भूख, जल्दी पचता है', icon: '🔥' },
      { id: 'visham', label_en: 'Irregular, sometimes hungry sometimes not', label_hi: 'अनियमित, कभी भूख कभी नहीं', icon: '⚖️' },
      { id: 'manda', label_en: 'Slow digestion, low appetite', label_hi: 'धीमा पाचन, कम भूख', icon: '🐢' },
      { id: 'sama', label_en: 'Balanced and regular', label_hi: 'संतुलित और नियमित', icon: '✅' },
    ],
  },

  // 9. Vyayama Shakti (Exercise Capacity)
  {
    id: 'ayush_vyayama',
    section: 'ayush_vyayama',
    type: 'single_choice',
    text_en: 'What is your physical endurance / stamina for exercise?',
    text_hi: 'व्यायाम के लिए आपकी शारीरिक क्षमता (स्टैमिना) कैसी है?',
    options: [
      { id: 'pravara', label_en: 'High (Can do heavy physical work)', label_hi: 'उच्च (भारी काम कर सकते हैं)', icon: '🏋️' },
      { id: 'madhyama', label_en: 'Moderate', label_hi: 'मध्यम', icon: '🚶' },
      { id: 'avara', label_en: 'Low (Get tired easily)', label_hi: 'निम्न (जल्दी थक जाते हैं)', icon: '🛋️' },
    ],
  },
];

export const AYUSH_QUESTION_BANK = [
  ...PRAKRITI_QUESTIONS,
  ...VIKRITI_QUESTIONS,
  ...DASHAVIDHA_QUESTIONS,
];
