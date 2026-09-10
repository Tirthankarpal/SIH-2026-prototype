/**
 * Demo Scenarios — Pre-written clinical narratives for offline demo fallback.
 *
 * Each scenario simulates a patient's spoken response to the chief complaint
 * question. These are used by `triggerDemoMode()` in the speech recognition
 * hook to instantly populate the transcript when the venue WiFi drops or
 * the Web Speech API is unavailable.
 *
 * Scenarios are available in both English and Hindi.
 */

export type DemoScenarioId =
  | 'cardiac_emergency'
  | 'chronic_headache'
  | 'diabetic_followup'
  | 'respiratory_infection'
  | 'abdominal_pain'
  | 'joint_pain'
  | 'ayush_prakriti'
  | 'pediatric_fever';

export interface DemoScenario {
  id: DemoScenarioId;
  label: string;
  description: string;
  /** Whether this scenario should trigger red-flag detection */
  triggersRedFlag: boolean;
  transcript: {
    en: string;
    hi: string;
  };
}

export const DEMO_SCENARIOS: Record<DemoScenarioId, DemoScenario> = {
  cardiac_emergency: {
    id: 'cardiac_emergency',
    label: '🚨 Cardiac Emergency',
    description: 'Acute chest pain — triggers red-flag detection',
    triggersRedFlag: true,
    transcript: {
      en: 'I have been having severe, crushing chest pain for the last 2 hours, and it is radiating to my left arm. I am also feeling very short of breath and sweating profusely. The pain came on suddenly while I was climbing stairs. It feels like a heavy weight on my chest. Nothing makes it better. On a scale of 1 to 10, the pain is about 9.',
      hi: 'पिछले 2 घंटों से मेरे सीने में बहुत तेज़, दबाने वाला दर्द हो रहा है, और यह मेरे बाएं हाथ तक फैल रहा है। मुझे सांस लेने में बहुत तकलीफ हो रही है और बहुत पसीना आ रहा है। सीढ़ियां चढ़ते समय अचानक दर्द शुरू हुआ। ऐसा लगता है जैसे छाती पर कोई भारी वजन रखा हो। किसी चीज़ से आराम नहीं मिल रहा। 1 से 10 के पैमाने पर दर्द लगभग 9 है।',
    },
  },

  chronic_headache: {
    id: 'chronic_headache',
    label: '🧠 Chronic Headache',
    description: 'Recurring migraine with aura — standard HPI',
    triggersRedFlag: false,
    transcript: {
      en: 'I have been getting these terrible headaches for the past 6 months. They happen about 2 to 3 times a week. The pain is on the right side of my head, mostly around my temple and behind my eye. It is a throbbing, pulsating kind of pain. Before the headache starts, I sometimes see flashing lights or zigzag lines for about 20 minutes. Light and noise make it much worse. I usually have to lie down in a dark room. Paracetamol does not help anymore. The pain is usually around 7 out of 10.',
      hi: 'पिछले 6 महीनों से मुझे बहुत भयंकर सिरदर्द हो रहा है। हफ्ते में करीब 2 से 3 बार होता है। दर्द मेरे सिर के दाहिनी तरफ होता है, ज़्यादातर कनपटी और आंख के पीछे। यह धड़कने वाला, टपकने जैसा दर्द होता है। सिरदर्द शुरू होने से पहले, मुझे कभी-कभी लगभग 20 मिनट तक चमकती रोशनी या टेढ़ी-मेढ़ी लाइनें दिखती हैं। रोशनी और शोर से दर्द और बढ़ जाता है। मुझे आमतौर पर अंधेरे कमरे में लेटना पड़ता है। पैरासिटामोल अब काम नहीं करती। दर्द आमतौर पर 10 में से 7 होता है।',
    },
  },

  diabetic_followup: {
    id: 'diabetic_followup',
    label: '💉 Diabetic Follow-up',
    description: 'Type 2 diabetes management visit',
    triggersRedFlag: false,
    transcript: {
      en: 'I am here for my diabetes check-up. I was diagnosed with Type 2 diabetes about 3 years ago. I am currently taking Metformin 500 mg twice a day and Glimepiride 1 mg in the morning. My last sugar reading at home was fasting 156 and after food it was 220. I have been feeling more thirsty than usual and going to the bathroom frequently, especially at night, maybe 3 to 4 times. I also have some tingling and numbness in my feet for the past 2 months. My eyesight has become slightly blurry recently. I try to walk daily but have not been very regular.',
      hi: 'मैं अपनी डायबिटीज़ की जांच के लिए आया हूं। मुझे लगभग 3 साल पहले टाइप 2 डायबिटीज़ का पता चला था। मैं अभी Metformin 500 mg दिन में दो बार और Glimepiride 1 mg सुबह ले रहा हूं। घर पर मेरी आखिरी शुगर रीडिंग खाली पेट 156 थी और खाने के बाद 220 थी। मुझे सामान्य से ज़्यादा प्यास लग रही है और बार-बार बाथरूम जाना पड़ रहा है, ख़ासकर रात में, शायद 3 से 4 बार। पिछले 2 महीनों से मेरे पैरों में झुनझुनी और सुन्नपन भी है। हाल ही में मेरी आंखों की रोशनी थोड़ी धुंधली हो गई है। मैं रोज़ चलने की कोशिश करता हूं लेकिन नियमित नहीं रहा।',
    },
  },

  respiratory_infection: {
    id: 'respiratory_infection',
    label: '🫁 Respiratory Infection',
    description: 'Upper respiratory tract infection with cough',
    triggersRedFlag: false,
    transcript: {
      en: 'I have had a bad cough for the past 5 days. It started with a sore throat and runny nose. The cough is now producing yellowish-green phlegm, especially in the morning. I have had a mild fever, around 100 degrees, on and off. I also have some body aches and feel very tired. I have not lost any weight. No blood in the cough. I work in a factory and there is a lot of dust. I smoke about 5 cigarettes a day for the last 10 years. I took some cough syrup from the chemist but it did not help much.',
      hi: 'पिछले 5 दिनों से मुझे बहुत बुरी खांसी है। यह गले में खराश और नाक बहने से शुरू हुई थी। अब खांसी में पीला-हरा बलगम आ रहा है, खासकर सुबह। मुझे हल्का बुखार रहा है, लगभग 100 डिग्री, आता-जाता है। शरीर में दर्द भी है और बहुत थकान महसूस हो रही है। वज़न नहीं घटा है। खांसी में खून नहीं आया। मैं फैक्ट्री में काम करता हूं और वहां बहुत धूल है। मैं पिछले 10 सालों से दिन में करीब 5 सिगरेट पीता हूं। केमिस्ट से खांसी की दवाई ली लेकिन ज़्यादा फ़ायदा नहीं हुआ।',
    },
  },

  abdominal_pain: {
    id: 'abdominal_pain',
    label: '🤢 Abdominal Pain',
    description: 'Acute epigastric pain with vomiting',
    triggersRedFlag: false,
    transcript: {
      en: 'I have been having pain in my upper stomach area since last night. It is a burning kind of pain, right here in the center above my navel. The pain gets worse after eating, especially spicy food, and also when I lie down. I have vomited twice today. I have not had any fever. I have been taking painkillers for my back pain for the past 2 weeks, Ibuprofen I think. I also feel a lot of acidity and bloating. I had a similar episode about 6 months ago and they said it was gastritis. The pain is about 6 out of 10 right now.',
      hi: 'कल रात से मेरे पेट के ऊपरी हिस्से में दर्द हो रहा है। यह जलन जैसा दर्द है, नाभि के ऊपर बीच में। खाना खाने के बाद दर्द बढ़ जाता है, ख़ासकर मसालेदार खाना खाने पर, और लेटने पर भी। आज दो बार उल्टी हुई। बुखार नहीं है। मैं पिछले 2 हफ्तों से कमर दर्द के लिए दर्द निवारक दवा ले रहा हूं, शायद Ibuprofen। बहुत एसिडिटी और पेट फूलना भी है। करीब 6 महीने पहले भी ऐसा हुआ था और उन्होंने कहा था कि गैस्ट्राइटिस है। अभी दर्द 10 में से 6 है।',
    },
  },

  joint_pain: {
    id: 'joint_pain',
    label: '🦴 Joint Pain',
    description: 'Chronic knee pain — good SOCRATES candidate',
    triggersRedFlag: false,
    transcript: {
      en: 'Both my knees have been hurting for about 8 months now. The pain is worse in my right knee. It is a dull, aching kind of pain. It gets worse when I climb stairs, squat for toilet, or walk for a long time. In the morning, my knees feel stiff for about 15 to 20 minutes then it gets a bit better. I hear a grinding sound when I bend my knees. I have not had any swelling or redness. I am 58 years old and weigh about 85 kilos. My mother also had knee problems. I have been applying some pain relief ointment which helps a little. The pain is about 5 out of 10 on a normal day but 8 when climbing stairs.',
      hi: 'लगभग 8 महीनों से मेरे दोनों घुटनों में दर्द हो रहा है। दाहिने घुटने में ज़्यादा दर्द है। यह हल्का, टीसने वाला दर्द है। सीढ़ियां चढ़ने, शौचालय के लिए बैठने, या बहुत देर चलने पर बढ़ जाता है। सुबह घुटनों में करीब 15 से 20 मिनट अकड़न रहती है, फिर थोड़ा ठीक होता है। घुटने मोड़ने पर कड़कड़ाहट की आवाज़ आती है। सूजन या लालिमा नहीं है। मेरी उम्र 58 साल है और वज़न करीब 85 किलो। मेरी मां को भी घुटनों की समस्या थी। दर्द निवारक मलहम लगाता हूं जिससे थोड़ा आराम मिलता है। सामान्य दिन में दर्द 10 में से 5 है लेकिन सीढ़ियां चढ़ते समय 8 हो जाता है।',
    },
  },

  ayush_prakriti: {
    id: 'ayush_prakriti',
    label: '🪷 AYUSH — Prakriti Assessment',
    description: 'Vata-dominant constitution description',
    triggersRedFlag: false,
    transcript: {
      en: 'I am generally a thin person, I find it hard to gain weight. My skin tends to be dry, especially in winter. I feel cold easily and prefer warm weather. My appetite is irregular — sometimes I am very hungry, other times I do not feel like eating at all. My digestion is also irregular, I sometimes get bloating and gas. I am a light sleeper and sometimes have trouble falling asleep. I tend to worry a lot and get anxious easily. My joints sometimes crack when I move. I prefer warm foods and drinks. I get tired quickly with heavy exercise but I enjoy walking and yoga.',
      hi: 'मैं आमतौर पर पतला हूं, मेरा वज़न बढ़ना मुश्किल है। मेरी त्वचा रूखी रहती है, ख़ासकर सर्दियों में। मुझे जल्दी ठंड लगती है और गर्म मौसम पसंद है। मेरी भूख अनियमित है — कभी बहुत भूख लगती है, कभी बिल्कुल खाने का मन नहीं करता। पाचन भी अनियमित है, कभी-कभी पेट फूलना और गैस हो जाती है। मेरी नींद हल्की है और कभी-कभी सोने में दिक्कत होती है। मैं बहुत चिंता करता हूं और जल्दी घबरा जाता हूं। हिलने-डुलने पर कभी-कभी जोड़ों में कड़कड़ाहट होती है। मुझे गर्म खाना-पीना पसंद है। भारी व्यायाम से जल्दी थक जाता हूं लेकिन चलना और योग पसंद है।',
    },
  },

  pediatric_fever: {
    id: 'pediatric_fever',
    label: '👶 Pediatric Fever (Parent)',
    description: 'Parent describing child\'s fever — caregiver narration',
    triggersRedFlag: false,
    transcript: {
      en: 'My son is 4 years old. He has had a high fever since yesterday evening, it was 103 degrees when I checked this morning. He is also complaining of ear pain on the right side and has been pulling at his ear. He has a runny nose with clear discharge for the past 3 days. He did not eat dinner last night and only had some milk this morning. He is drinking water but less than usual. He vomited once last night after the fever went up. He does not have any rash. He is up to date on all his vaccinations. He goes to play school and two other children in his class also had fever recently. He had a similar ear infection about 4 months ago and was given Amoxicillin.',
      hi: 'मेरा बेटा 4 साल का है। कल शाम से उसे तेज़ बुखार है, आज सुबह चेक किया तो 103 डिग्री था। वह दाहिने कान में दर्द की शिकायत कर रहा है और कान खींच रहा है। पिछले 3 दिनों से नाक बह रही है, पानी जैसा। कल रात खाना नहीं खाया और आज सुबह बस थोड़ा दूध पिया। पानी पी रहा है लेकिन सामान्य से कम। कल रात बुखार बढ़ने के बाद एक बार उल्टी हुई। कोई दाने नहीं हैं। सभी टीके लगे हुए हैं। वह प्ले स्कूल जाता है और उसकी कक्षा के दो और बच्चों को भी हाल ही में बुखार हुआ था। करीब 4 महीने पहले भी ऐसा ही कान का इन्फेक्शन हुआ था और Amoxicillin दी गई थी।',
    },
  },
};

/**
 * Returns all scenarios as an ordered array for UI listing.
 */
export function getAllDemoScenarios(): DemoScenario[] {
  return Object.values(DEMO_SCENARIOS);
}

/**
 * Returns scenario by ID, or undefined if not found.
 */
export function getDemoScenario(id: DemoScenarioId): DemoScenario | undefined {
  return DEMO_SCENARIOS[id];
}
