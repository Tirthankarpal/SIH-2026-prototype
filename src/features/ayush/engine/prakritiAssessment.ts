import type { InterviewAnswer } from '../../../types/clinical';

export interface DoshaScore {
  vata: number;
  pitta: number;
  kapha: number;
}

export interface PrakritiResult {
  scores: DoshaScore;
  totalPoints: number;
  percentages: {
    vata: number;
    pitta: number;
    kapha: number;
  };
  primaryDosha: 'Vata' | 'Pitta' | 'Kapha';
  secondaryDosha?: 'Vata' | 'Pitta' | 'Kapha';
}

/**
 * Calculates the Prakriti (Constitution) score based on the answers
 * provided in the ayush_prakriti section.
 */
export function calculatePrakriti(answers: Map<string, InterviewAnswer>): PrakritiResult {
  const scores: DoshaScore = { vata: 0, pitta: 0, kapha: 0 };
  let totalPoints = 0;

  // Tally scores from all answers
  for (const answer of answers.values()) {
    if (answer.section === 'ayush_prakriti') {
      const values = Array.isArray(answer.value) ? answer.value : [String(answer.value)];
      
      for (const val of values) {
        if (val.startsWith('vata_')) {
          scores.vata += 1;
          totalPoints += 1;
        } else if (val.startsWith('pitta_')) {
          scores.pitta += 1;
          totalPoints += 1;
        } else if (val.startsWith('kapha_')) {
          scores.kapha += 1;
          totalPoints += 1;
        }
      }
    }
  }

  // Calculate percentages
  const percentages = {
    vata: totalPoints > 0 ? Math.round((scores.vata / totalPoints) * 100) : 0,
    pitta: totalPoints > 0 ? Math.round((scores.pitta / totalPoints) * 100) : 0,
    kapha: totalPoints > 0 ? Math.round((scores.kapha / totalPoints) * 100) : 0,
  };

  // Determine Primary and Secondary Doshas
  const doshaArray: { name: 'Vata' | 'Pitta' | 'Kapha'; score: number }[] = [
    { name: 'Vata', score: scores.vata },
    { name: 'Pitta', score: scores.pitta },
    { name: 'Kapha', score: scores.kapha },
  ];

  // Sort descending by score
  doshaArray.sort((a, b) => b.score - a.score);

  const primaryDosha = doshaArray[0].name;
  
  // If the second highest is close (e.g., within 20%), assign it as secondary
  let secondaryDosha: 'Vata' | 'Pitta' | 'Kapha' | undefined = undefined;
  if (totalPoints > 0 && (doshaArray[1].score / totalPoints) >= 0.3) {
    secondaryDosha = doshaArray[1].name;
  }

  return {
    scores,
    totalPoints,
    percentages,
    primaryDosha,
    secondaryDosha,
  };
}
