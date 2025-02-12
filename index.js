const negatives = [
    "Stealing is illegal; you must not take things that aren't yours.",
    "The teacher couldn't read Tom's illegible handwriting.",
    "Sally's immature behavior showed she wasn't ready for big responsibilities.",
    "In stories, vampires are often described as immortal beings.",
    "It's impossible to breathe underwater without special equipment.",
    "The children grew impatient waiting for the show to start.",
    "The handmade vase was imperfect but still beautiful.",
    "The table had an irregular shape, making it unique.",
    "Talking about the weather was irrelevant to our math lesson.",
    "Leaving the gate open was irresponsible, and the dog ran out."
];

const ation = [
    "The teacher gave us information about the new project.",
    "Touching the ice gave me a cold sensation.",
    "We did a lot of preparation for the school play.",
    "I felt a vibration when my phone rang.",
    "We put up decoration for the classroom party.",
    "Our class made a donation to the animal shelter.",
    "The duration of the movie was two hours.",
    "Registration for the art club starts today.",
    "The population of our town is growing.",
    "With determination, she finished the difficult puzzle."
];

const adverbs = [
    "I usually eat cereal for breakfast.",
    "After a long day, we finally reached home.",
    "The butterfly's wings are beautifully colored.",
    "He thoughtfully shared his umbrella with me.",
    "The cake tasted wonderfully sweet.",
    "She carefully crossed the busy street.",
    "The dog waited faithfully for its owner.",
    "The baby slept peacefully in her crib.",
    "The villain laughed cruelly in the story.",
    "Generally, cats are independent animals."
];


const submitSentences = () => {
    let arr = [];
    const sentences = [...document.querySelectorAll('.sentence')]
        .map(input => input.value.trim()).filter(sentence => sentence);
    sentences.forEach((sentence, index) => {
        arr.push(sentence)
    })
    localStorage.setItem('sentences', JSON.stringify(arr));
    window.location.href = "game.html";
};


function submitSampleSentences(arr) {
    switch (arr) {
        case 'negatives':
            arr = negatives;
            break;
        case 'ation':
            arr = ation;
            break;
        case 'adverbs':
            arr = adverbs
            break;
    }
    localStorage.setItem('sentences', JSON.stringify(arr));
    window.location.href = "game.html";
}

const createForm = () => {
    const formContainer = document.querySelector('.form-container');
    for (let i = 0; i < 10; i++) {
        formContainer.innerHTML += `
        <input type="text" placeholder="Sentence ${i + 1}" class="sentence">
    `;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Dynamically create the form rows
    createForm();
    // submitWords();
})