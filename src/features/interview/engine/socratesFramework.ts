/**
 * SOCRATES Pain Assessment Framework
 *
 * Implements the standard SOCRATES mnemonic for structured pain history:
 *   S — Site         (Where is the pain?)
 *   O — Onset        (When did it start? Sudden or gradual?)
 *   C — Character    (What does it feel like?)
 *   R — Radiation    (Does it spread anywhere?)
 *   A — Associations (Any other symptoms with it?)
 *   T — Time course  (Pattern, duration, frequency)
 *   E — Exacerbating / Relieving factors
 *   S — Severity     (0–10 scale)
 */

import type { InterviewQuestion } from '../../../types/clinical';

export const SOCRATES_QUESTIONS: InterviewQuestion[] = [
  /* ═══════ S — Site ═══════ */
  {
    id: 'socrates_site',
    section: 'socrates',
    type: 'body_region',
    text_en: 'Where exactly is the pain? Tap the area on the body where you feel it.',
    text_hi: 'दर्द ठीक कहाँ है? जहाँ दर्द महसूस हो रहा है वहाँ शरीर पर टैप करें।',
    help_en: 'Point with one finger to where it hurts the most.',
    help_hi: 'एक उंगली से बताएं कि सबसे ज़्यादा दर्द कहाँ है।',
    allowVoice: true,
    required: true,
    redFlagTags: ['pain_site'],
  },

  /* ═══════ O — Onset ═══════ */
  {
    id: 'socrates_onset_when',
    section: 'socrates',
    type: 'single_choice',
    text_en: 'When did the pain start?',
    text_hi: 'दर्द कब शुरू हुआ?',
    allowVoice: true,
    required: true,
    options: [
      { id: 'today',        label_en: 'Today',             label_hi: 'आज',              icon: '📅' },
      { id: 'yesterday',    label_en: 'Yesterday',         label_hi: 'कल',              icon: '📅' },
      { id: 'few_days',     label_en: '2–7 days ago',      label_hi: '2–7 दिन पहले',    icon: '📅' },
      { id: 'weeks',        label_en: '1–4 weeks ago',     label_hi: '1–4 हफ्ते पहले',   icon: '📅' },
      { id: 'months',       label_en: 'Months ago',        label_hi: 'महीनों पहले',      icon: '📅' },
      { id: 'years',        label_en: 'Years ago',         label_hi: 'सालों पहले',       icon: '📅' },
    ],
  },
  {
    id: 'socrates_onset_how',
    section: 'socrates',
    type: 'single_choice',
    text_en: 'Did the pain come on suddenly or gradually?',
    text_hi: 'दर्द अचानक शुरू हुआ या धीरे-धीरे?',
    allowVoice: true,
    required: true,
    options: [
      { id: 'sudden',  label_en: 'Suddenly',            label_hi: 'अचानक',           icon: '⚡', isRedFlag: true },
      { id: 'gradual', label_en: 'Gradually',           label_hi: 'धीरे-धीरे',        icon: '📈' },
      { id: 'unsure',  label_en: 'Not sure',            label_hi: 'पक्का नहीं पता',   icon: '🤷' },
    ],
    redFlagTags: ['onset_type'],
  },

  /* ═══════ C — Character ═══════ */
  {
    id: 'socrates_character',
    section: 'socrates',
    type: 'multi_choice',
    text_en: 'What does the pain feel like? You can select more than one.',
    text_hi: 'दर्द कैसा महसूस होता है? एक से ज़्यादा चुन सकते हैं।',
    allowVoice: true,
    required: true,
    options: [
      { id: 'sharp',     label_en: 'Sharp / Stabbing',   label_hi: 'तेज़ / चुभने वाला',   icon: '🔪' },
      { id: 'dull',      label_en: 'Dull / Aching',      label_hi: 'हल्का / टीसने वाला',  icon: '😟' },
      { id: 'burning',   label_en: 'Burning',            label_hi: 'जलन वाला',          icon: '🔥' },
      { id: 'throbbing', label_en: 'Throbbing / Pulsing',label_hi: 'धड़कने वाला',       icon: '💓' },
      { id: 'crushing',  label_en: 'Crushing / Heavy',   label_hi: 'दबाने वाला / भारी',  icon: '🪨', isRedFlag: true },
      { id: 'cramping',  label_en: 'Cramping',           label_hi: 'ऐंठन वाला',        icon: '🔄' },
      { id: 'tingling',  label_en: 'Tingling / Pins',    label_hi: 'झुनझुनी',           icon: '⚡' },
      { id: 'pressure',  label_en: 'Pressure',           label_hi: 'दबाव',             icon: '⬇️' },
    ],
    redFlagTags: ['pain_character'],
  },

  /* ═══════ R — Radiation ═══════ */
  {
    id: 'socrates_radiation',
    section: 'socrates',
    type: 'single_choice',
    text_en: 'Does the pain spread or travel to any other part of your body?',
    text_hi: 'क्या दर्द शरीर के किसी और हिस्से में फैलता है?',
    allowVoice: true,
    required: true,
    options: [
      { id: 'no',             label_en: 'No, stays in one place',  label_hi: 'नहीं, एक जगह रहता है',    icon: '📍' },
      { id: 'left_arm',       label_en: 'To left arm',            label_hi: 'बाएं हाथ में',             icon: '💪', isRedFlag: true },
      { id: 'right_arm',      label_en: 'To right arm',           label_hi: 'दाहिने हाथ में',            icon: '💪' },
      { id: 'jaw_neck',       label_en: 'To jaw / neck',          label_hi: 'जबड़े / गर्दन में',         icon: '🦷', isRedFlag: true },
      { id: 'back',           label_en: 'To the back',            label_hi: 'पीठ में',                 icon: '🔙' },
      { id: 'shoulder',       label_en: 'To shoulder',            label_hi: 'कंधे में',                icon: '🤷' },
      { id: 'down_leg',       label_en: 'Down the leg',           label_hi: 'पैर में नीचे',              icon: '🦵' },
      { id: 'other',          label_en: 'Other area',             label_hi: 'कोई और जगह',             icon: '➡️' },
    ],
    redFlagTags: ['radiation_pattern'],
  },

  /* ═══════ A — Associations ═══════ */
  {
    id: 'socrates_associations',
    section: 'socrates',
    type: 'multi_choice',
    text_en: 'Do you have any of these other symptoms along with the pain?',
    text_hi: 'दर्द के साथ क्या कोई और लक्षण भी हैं?',
    allowVoice: true,
    options: [
      { id: 'nausea',         label_en: 'Nausea / Vomiting',      label_hi: 'जी मिचलाना / उल्टी',        icon: '🤢' },
      { id: 'breathless',     label_en: 'Shortness of breath',    label_hi: 'सांस फूलना',              icon: '😮‍💨', isRedFlag: true },
      { id: 'sweating',       label_en: 'Excessive sweating',     label_hi: 'बहुत पसीना आना',           icon: '💦', isRedFlag: true },
      { id: 'dizziness',      label_en: 'Dizziness',              label_hi: 'चक्कर आना',               icon: '💫' },
      { id: 'fever',          label_en: 'Fever',                  label_hi: 'बुखार',                  icon: '🌡️' },
      { id: 'weakness',       label_en: 'Weakness / Fatigue',     label_hi: 'कमज़ोरी / थकान',           icon: '😫' },
      { id: 'palpitations',   label_en: 'Heart pounding fast',    label_hi: 'दिल तेज़ धड़कना',           icon: '❤️‍🔥', isRedFlag: true },
      { id: 'vision_change',  label_en: 'Vision changes',         label_hi: 'नज़र में बदलाव',            icon: '👁️' },
      { id: 'none',           label_en: 'None of these',          label_hi: 'इनमें से कोई नहीं',         icon: '✅' },
    ],
    redFlagTags: ['associated_symptoms'],
  },

  /* ═══════ T — Time course ═══════ */
  {
    id: 'socrates_time_pattern',
    section: 'socrates',
    type: 'single_choice',
    text_en: 'How does the pain behave over time?',
    text_hi: 'समय के साथ दर्द कैसा रहता है?',
    allowVoice: true,
    required: true,
    options: [
      { id: 'constant',    label_en: 'Constant (always there)',   label_hi: 'लगातार (हमेशा)',        icon: '➖' },
      { id: 'comes_goes',  label_en: 'Comes and goes',           label_hi: 'आता-जाता है',           icon: '🔄' },
      { id: 'worsening',   label_en: 'Getting worse',            label_hi: 'बढ़ रहा है',             icon: '📈', isRedFlag: true },
      { id: 'improving',   label_en: 'Getting better',           label_hi: 'कम हो रहा है',          icon: '📉' },
      { id: 'worse_night', label_en: 'Worse at night',           label_hi: 'रात को ज़्यादा',          icon: '🌙' },
      { id: 'worse_morning', label_en: 'Worse in morning',       label_hi: 'सुबह ज़्यादा',           icon: '🌅' },
    ],
  },

  /* ═══════ E — Exacerbating / Relieving ═══════ */
  {
    id: 'socrates_exacerbating',
    section: 'socrates',
    type: 'multi_choice',
    text_en: 'What makes the pain WORSE?',
    text_hi: 'किन चीज़ों से दर्द बढ़ता है?',
    allowVoice: true,
    options: [
      { id: 'movement',     label_en: 'Movement / Walking',     label_hi: 'हिलने / चलने से',        icon: '🚶' },
      { id: 'eating',       label_en: 'Eating',                 label_hi: 'खाना खाने से',          icon: '🍽️' },
      { id: 'breathing',    label_en: 'Deep breathing',         label_hi: 'गहरी सांस लेने से',      icon: '💨' },
      { id: 'lying_down',   label_en: 'Lying down',             label_hi: 'लेटने से',              icon: '🛏️' },
      { id: 'stress',       label_en: 'Stress / Anxiety',       label_hi: 'तनाव / चिंता से',       icon: '😰' },
      { id: 'exertion',     label_en: 'Physical exertion',      label_hi: 'शारीरिक मेहनत से',      icon: '🏋️', isRedFlag: true },
      { id: 'nothing',      label_en: 'Nothing specific',       label_hi: 'कुछ खास नहीं',         icon: '🤷' },
    ],
  },
  {
    id: 'socrates_relieving',
    section: 'socrates',
    type: 'multi_choice',
    text_en: 'What makes the pain BETTER?',
    text_hi: 'किन चीज़ों से दर्द कम होता है?',
    allowVoice: true,
    options: [
      { id: 'rest',          label_en: 'Rest',                   label_hi: 'आराम करने से',          icon: '🪑' },
      { id: 'medicine',      label_en: 'Painkiller / Medicine',  label_hi: 'दर्द की दवाई',         icon: '💊' },
      { id: 'heat',          label_en: 'Heat / Warm compress',   label_hi: 'गर्म सिकाई',           icon: '♨️' },
      { id: 'cold',          label_en: 'Cold / Ice',             label_hi: 'ठंडी सिकाई / बर्फ',     icon: '🧊' },
      { id: 'position',      label_en: 'Changing position',      label_hi: 'स्थिति बदलने से',       icon: '🔄' },
      { id: 'nothing',       label_en: 'Nothing helps',          label_hi: 'कुछ काम नहीं करता',    icon: '❌', isRedFlag: true },
    ],
  },

  /* ═══════ S — Severity ═══════ */
  {
    id: 'socrates_severity',
    section: 'socrates',
    type: 'pain_scale',
    text_en: 'How bad is the pain right now? Tap a number from 0 (no pain) to 10 (worst pain).',
    text_hi: 'अभी दर्द कितना है? 0 (कोई दर्द नहीं) से 10 (सबसे तेज़ दर्द) तक एक नंबर चुनें।',
    required: true,
    min: 0,
    max: 10,
    scaleEmojis: ['😊', '🙂', '😐', '😕', '😣', '😖', '😫', '😩', '😭', '🤯', '😱'],
    redFlagTags: ['pain_severity'],
  },
];
