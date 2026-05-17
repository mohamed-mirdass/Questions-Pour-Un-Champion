// js/services/DataLoader.js
export async function loadQuestions() {
    try {
        const response = await fetch('data/questions.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const questions = await response.json();
        console.log('? Questions chargées:', questions.length);
        return questions;
    } catch (error) {
        console.error('? Erreur chargement questions.json:', error);
        return [];
    }
}
