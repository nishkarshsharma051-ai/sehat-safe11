import { HealthProfile, HealthPlan } from '../types';
import { getGeminiResponse } from '../services/geminiService';

export const recommendHealthPlans = (profile: HealthProfile | null, healthScore: number, lang: 'en' | 'hi' = 'en'): HealthPlan[] => {
    const plans: HealthPlan[] = [];

    const t = (en: string, hi: string) => lang === 'hi' ? hi : en;

    // 1. Critical/Medical Plans based on conditions
    if (profile?.chronic_conditions?.some(c => c.toLowerCase().includes('diabetes'))) {
        plans.push({
            id: 'plan-diabetes',
            name: t('Diabetes Management Gold', 'मधुमेह प्रबंधन गोल्ड'),
            description: t('A comprehensive plan focused on blood sugar stabilization and diabetic-friendly lifestyle changes.', 'रक्त शर्करा स्थिरीकरण और मधुमेह के अनुकूल जीवनशैली परिवर्तनों पर केंद्रित एक व्यापक योजना।'),
            duration: t('3 Months', '3 महीने'),
            intensity: 'Moderate',
            category: 'medical',
            recommendation_reason: t('Recommended based on your chronic condition: Diabetes.', 'आपकी पुरानी स्थिति: मधुमेह के आधार पर अनुशंसित।'),
            activities: [
                { id: 'act-1', title: t('Sugar Monitoring', 'चीनी की निगरानी'), description: t('Check fasting blood sugar daily.', 'रोजाना खाली पेट ब्लड शुगर की जांच करें।'), frequency: t('Daily', 'दैनिक'), type: 'checkup' },
                { id: 'act-2', title: t('Low-Carb Diet', 'कम कार्ब आहार'), description: t('Follow high-fiber, low-glycemic index meals.', 'उच्च फाइबर, कम ग्लाइसेमिक इंडेक्स भोजन का पालन करें।'), frequency: t('Daily', 'दैनिक'), type: 'diet' },
                { id: 'act-3', title: t('Steady Walk', 'नियमित पैदल चलना'), description: t('30 minutes of brisk walking.', '30 मिनट तेज चलना।'), frequency: t('Daily', 'दैनिक'), type: 'exercise' }
            ]
        });
    }

    // 2. Weight Management based on BMI
    if (profile?.weight && profile?.height) {
        const heightInMeters = profile.height / 100;
        const bmi = profile.weight / (heightInMeters * heightInMeters);

        if (bmi >= 25) {
            plans.push({
                id: 'plan-weight',
                name: t('Weight Loss & Vitality', 'वजन घटाने और जीवन शक्ति'),
                description: t('Goal-oriented plan to reach your ideal BMI through calorie deficit and metabolic training.', 'कैलोरी की कमी और मेटाबॉलिक ट्रेनिंग के माध्यम से आपके आदर्श बीएमआई तक पहुँचने के लिए लक्ष्य-उन्मुख योजना।'),
                duration: t('6 Months', '6 महीने'),
                intensity: 'High',
                category: 'wellness',
                recommendation_reason: t('Recommended because your BMI is in the overweight/obese range.', 'अनुशंसित क्योंकि आपका बीएमआई अधिक वजन/मोटापे की सीमा में है।'),
                activities: [
                    { id: 'act-4', title: t('HIIT Session', 'एचआईआईटी सत्र'), description: t('Short bursts of high-intensity interval training.', 'उच्च तीव्रता अंतराल प्रशिक्षण के छोटे विस्फोट।'), frequency: t('3x Weekly', 'साप्ताहिक 3 बार'), type: 'exercise' },
                    { id: 'act-5', title: t('Protein Rich Diet', 'प्रोटीन युक्त आहार'), description: t('Focus on lean proteins and vegetables.', 'लीन प्रोटीन और सब्जियों पर ध्यान दें।'), frequency: t('Daily', 'दैनिक'), type: 'diet' },
                    { id: 'act-6', title: t('Weight Tracking', 'वजन ट्रैकिंग'), description: t('Record weight and body measurements.', 'वजन और शरीर के माप रिकॉर्ड करें।'), frequency: t('Weekly', 'साप्ताहिक'), type: 'checkup' }
                ]
            });
        }
    }

    // 3. General Wellness for Low Score
    if (healthScore < 80) {
        plans.push({
            id: 'plan-wellness',
            name: t('Total Wellness Immunity', 'कुल कल्याण प्रतिरक्षा'),
            description: t('Holistic plan to boost your health score and improve overall immunity and stress levels.', 'आपके स्वास्थ्य स्कोर को बढ़ाने और समग्र प्रतिरक्षा और तनाव के स्तर में सुधार करने के लिए समग्र योजना।'),
            duration: t('1 Month', '1 महीना'),
            intensity: 'Low',
            category: 'wellness',
            recommendation_reason: t('Recommended to help improve your overall Health Score.', 'आपके समग्र स्वास्थ्य स्कोर को बेहतर बनाने में मदद करने के लिए अनुशंसित।'),
            activities: [
                { id: 'act-7', title: t('Guided Meditation', 'निर्देशित ध्यान'), description: t('Mindfulness and breathing exercises to reduce stress.', 'तनाव कम करने के लिए माइंडफुलनेस और सांस लेने के व्यायाम।'), frequency: t('Daily', 'दैनिक'), type: 'meditation' },
                { id: 'act-8', title: t('Probiotic Intake', 'प्रोबायोटिक सेवन'), description: t('Add Greek yogurt or fermented foods to your breakfast.', 'अपने नाश्ते में ग्रीक योगर्ट या फर्मेंटेड फूड्स शामिल करें।'), frequency: t('Daily', 'दैनिक'), type: 'diet' },
                { id: 'act-9', title: t('Sleep Hygiene', 'नींद की स्वच्छता'), description: t('Maintain a consistent 8-hour sleep schedule.', 'लगातार 8 घंटे की नींद का शेड्यूल बनाए रखें।'), frequency: t('Daily', 'दैनिक'), type: 'wellness' }
            ]
        });
    }

    // 4. Heart Health based on BP
    if (profile?.bp_systolic && (profile.bp_systolic >= 130 || profile.bp_diastolic! >= 85)) {
        plans.push({
            id: 'plan-heart',
            name: t('Cardio-Vascular Shield', 'कार्डियो-वैस्कुलर शील्ड'),
            description: t('Protect your heart through sodium reduction, specific cardio exercises, and regular BP monitoring.', 'सोडियम की कमी, विशिष्ट हृदय व्यायाम और नियमित बीपी निगरानी के माध्यम से अपने दिल की रक्षा करें।'),
            duration: t('4 Months', '4 महीने'),
            intensity: 'Moderate',
            category: 'medical',
            recommendation_reason: t('Recommended based on your elevated blood pressure readings.', 'आपके बढ़े हुए रक्तचाप की रीडिंग के आधार पर अनुशंसित।'),
            activities: [
                { id: 'act-11', title: t('BP Check', 'बीपी की जांच'), description: t('Measure and log blood pressure readings.', 'रक्तचाप की रीडिंग मापें और लॉग करें।'), frequency: t('Daily', 'दैनिक'), type: 'checkup' },
                { id: 'act-12', title: t('Salt Reduction', 'नमक में कमी'), description: t('Limit daily sodium intake to under 2.3g.', 'दैनिक सोडियम सेवन को 2.3 ग्राम से कम तक सीमित करें।'), frequency: t('Daily', 'दैनिक'), type: 'diet' },
                { id: 'act-13', title: t('Aerobic Exercise', 'एरोबिक व्यायाम'), description: t('Moderate intensity cardio like cycling or swimming.', 'साइकिल चलाना या तैरने जैसा मध्यम तीव्रता का कार्डियो।'), frequency: t('4x Weekly', 'साप्ताहिक 4 बार'), type: 'exercise' }
            ]
        });
    }

    // 5. Stress Relief for Low Scores / High Reports
    if (healthScore < 70 || profile?.chronic_conditions?.some(c => c.toLowerCase().includes('stress') || c.toLowerCase().includes('anxiety'))) {
        plans.push({
            id: 'plan-stress',
            name: t('Stress Neutralizer', 'तनाव न्यूट्रलाइज़र'),
            description: t('Lower cortisol levels through scientifically proven mindfulness techniques and sleep optimization.', 'वैज्ञानिक रूप से सिद्ध माइंडफुलनेस तकनीकों और नींद के अनुकूलन के माध्यम से कोर्टिसोल के स्तर को कम करें।'),
            duration: t('2 Months', '2 महीने'),
            intensity: 'Low',
            category: 'wellness',
            recommendation_reason: t('Recommended to help manage stress levels and improve mental well-being.', 'तनाव के स्तर को प्रबंधित करने और मानसिक कल्याण में सुधार करने में मदद के लिए अनुशंसित।'),
            activities: [
                { id: 'act-14', title: t('Deep Breathing', 'गहरी सांस लेना'), description: t('5 minutes of box breathing practice.', 'बॉक्स ब्रीदिंग अभ्यास के 5 मिनट।'), frequency: t('2x Daily', 'दैनिक 2 बार'), type: 'meditation' },
                { id: 'act-15', title: t('Digital Detox', 'डिजिटल डिटॉक्स'), description: t('No screens 1 hour before bedtime.', 'सोने से 1 घंटा पहले कोई स्क्रीन नहीं।'), frequency: t('Daily', 'दैनिक'), type: 'wellness' },
                { id: 'act-16', title: t('Herbal Tea', 'हर्बल चाय'), description: t('Chamomile or Ashwagandha tea in the evening.', 'शाम को कैमोमाइल या अश्वगंधा की चाय।'), frequency: t('Daily', 'दैनिक'), type: 'diet' }
            ]
        });
    }

    // 6. Gut Health Optimizer
    if (profile?.chronic_conditions?.some(c =>
        c.toLowerCase().includes('acidity') ||
        c.toLowerCase().includes('digestion') ||
        c.toLowerCase().includes('stomach') ||
        c.toLowerCase().includes('gas')
    )) {
        plans.push({
            id: 'plan-gut-health',
            name: t('Gut Health Optimizer', 'गट हेल्थ ऑप्टिमाइज़र'),
            description: t('Restore your digestive balance and microbiome health through targeted nutrition and timing.', 'लक्षित पोषण और समय के माध्यम से अपने पाचन संतुलन और माइक्रोबायोम स्वास्थ्य को बहाल करें।'),
            duration: t('1 Month', '1 महीना'),
            intensity: 'Low',
            category: 'wellness',
            recommendation_reason: t('Recommended based on your history of digestive concerns.', 'पाचन संबंधी चिंताओं के आपके इतिहास के आधार पर अनुशंसित।'),
            activities: [
                { id: 'act-17', title: t('Probiotic Intake', 'प्रोबायोटिक सेवन'), description: t('Add Greek yogurt, kefir, or kombucha to your daily routine.', 'अपने दैनिक दिनचर्या में ग्रीक योगर्ट, केफिर या कोम्बुचा शामिल करें।'), frequency: t('Daily', 'दैनिक'), type: 'diet' },
                { id: 'act-18', title: t('Fiber Boost', 'फाइबर बूस्ट'), description: t('Increase intake of soluble and insoluble fibers.', 'घुलनशील और अघुलनशील फाइबर का सेवन बढ़ाएं।'), frequency: t('Daily', 'दैनिक'), type: 'diet' },
                { id: 'act-19', title: t('Post-Meal Walk', 'भोजन के बाद टहलना'), description: t('A gentle 10-minute stroll after dinner.', 'रात के खाने के बाद 10 मिनट की हल्की चहलकदमी।'), frequency: t('Daily', 'दैनिक'), type: 'exercise' }
            ]
        });
    }

    // Default Plan if none recommended
    if (plans.length === 0) {
        plans.push({
            id: 'plan-maintenance',
            name: t('Elite Health Maintenance', 'एलीट स्वास्थ्य रखरखाव'),
            description: t('Stay at the top of your game with regular checkups and preventive care.', 'नियमित जांच और निवारक देखभाल के साथ अपने खेल में शीर्ष पर रहें।'),
            duration: t('Yearly', 'वार्षिक'),
            intensity: 'Low',
            category: 'wellness',
            recommendation_reason: t('Recommended for maintaining your excellent health score.', 'अपने उत्कृष्ट स्वास्थ्य स्कोर को बनाए रखने के लिए अनुशंसित।'),
            activities: [
                { id: 'act-10', title: t('Full Checkup', 'पूर्ण जांच'), description: t('Annual comprehensive blood work and physical.', 'वार्षिक व्यापक रक्त कार्य और शारीरिक जांच।'), frequency: t('Yearly', 'वार्षिक'), type: 'checkup' }
            ]
        });
    }

    return plans;
};

export const generateHealthPlansWithAI = async (profile: HealthProfile | null, healthScore: number, lang: 'en' | 'hi' = 'en'): Promise<HealthPlan[]> => {
    if (!profile) return recommendHealthPlans(profile, healthScore, lang); // fallback

    const languageStr = lang === 'hi' ? 'Hindi' : 'English';

    try {
        const prompt = `
You are an expert AI Health Coach. Generate 2 highly customized, personalized health plans for the patient based on their health profile.
        
Patient Profile:
Age: ${profile.age || 'Unknown'}
Weight: ${profile.weight || 'Unknown'} kg
Height: ${profile.height || 'Unknown'} cm
Blood Sugar: ${profile.sugar_level || 'Unknown'} mg/dL
Blood Pressure: ${profile.bp_systolic || '?'}/${profile.bp_diastolic || '?'} mmHg
Allergies: ${profile.allergies?.join(', ') || 'None'}
Chronic Conditions: ${profile.chronic_conditions?.join(', ') || 'None'}
Overall Health Score: ${healthScore}/100

Format Requirements:
Output EXACTLY a JSON array of objects. No markdown formatting (don't use \`\`\`json), just the raw JSON array.
Language: ${lang === 'hi' ? 'Hindi' : 'English'}
Each object must match this interface:
{
  "id": "A unique string ID (e.g. plan-ai-1)",
  "name": "Catchy Plan Name",
  "description": "Short description of what the plan achieves",
  "duration": "E.g., 4 Weeks or 3 Months",
  "intensity": "Low" | "Moderate" | "High",
  "category": "medical" | "wellness" | "fitness",
  "recommendation_reason": "Why this plan fits their specific bio-markers",
  "activities": [
    {
      "id": "Unique activity ID (e.g. act-ai-1)",
      "title": "Activity Name",
      "description": "Short explanation",
      "frequency": "E.g., Daily, 3x Weekly",
      "type": "exercise" | "diet" | "meditation" | "checkup" | "wellness"
    }
  ]
}
Ensure there are 2-3 activities per plan.
`;

        const responseText = await getGeminiResponse(prompt, [], { name: profile.id, role: 'patient', language: languageStr as 'Hindi' | 'English' });

        let cleanedText = responseText.trim();
        if (cleanedText.startsWith('\`\`\`json')) {
            cleanedText = cleanedText.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
        } else if (cleanedText.startsWith('\`\`\`')) {
            cleanedText = cleanedText.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
        }

        const data = JSON.parse(cleanedText);
        if (Array.isArray(data) && data.length > 0 && data[0].name) {
            const standardPlans = recommendHealthPlans(profile, healthScore, lang);
            return [...(data as HealthPlan[]), ...standardPlans.filter(p => !data.find((d: any) => d.name === p.name))];
        }
    } catch (e) {
        console.error("Failed to parse AI health plan, falling back to static", e);
    }

    return recommendHealthPlans(profile, healthScore, lang); // Fallback to hardcoded logic if AI fails
};
