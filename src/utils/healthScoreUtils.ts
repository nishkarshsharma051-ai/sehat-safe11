import { HealthProfile } from '../types';

export const calculateHealthScore = (profile: HealthProfile | null): number => {
    if (!profile) return 70; // Neutral starting score for incomplete profiles

    let score = 100;

    // 1. BMI Calculation & Penalty
    if (profile.weight && profile.height) {
        const heightInMeters = profile.height / 100;
        const bmi = profile.weight / (heightInMeters * heightInMeters);

        if (bmi < 18.5 || (bmi >= 25 && bmi < 30)) {
            score -= 10; // Underweight or Overweight
        } else if (bmi >= 30) {
            score -= 20; // Obese
        }
    }

    // 2. Blood Pressure Penalty
    if (profile.bp_systolic && profile.bp_diastolic) {
        if (profile.bp_systolic >= 140 || profile.bp_diastolic >= 90) {
            score -= 15; // Hypertension Stage 2
        } else if (profile.bp_systolic >= 130 || profile.bp_diastolic >= 80) {
            score -= 5; // Hypertension Stage 1
        }
    }

    // 3. Blood Sugar Penalty
    if (profile.sugar_level) {
        if (profile.sugar_level >= 140) {
            score -= 15; // High sugar
        } else if (profile.sugar_level >= 200) {
            score -= 25; // Critical sugar
        }
    }

    // 4. Chronic Conditions Penalty
    if (profile.chronic_conditions && profile.chronic_conditions.length > 0) {
        const penalty = Math.min(profile.chronic_conditions.length * 5, 25);
        score -= penalty;
    }

    // Ensure score stays within 30-100 range
    return Math.max(30, Math.min(100, score));
};
