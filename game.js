import { checkFullscreen } from "./utils.js";
import { GameObserver } from "./gameObserver.js";
import { SoundManager, SoundObserver } from "./sound/sound.js";

// Game state

class GameState {
    constructor() {
        this.state = { sentences: [], currentSentenceIndex: 0 };
        this.observers = [];
        this.listeners = [];
    }

    // Add observer and listener to the list
    addObserver(observer) {
        this.observers.push(observer);
    }
    addListener(listener) {
        this.listeners.push(listener);
    }

    async notifyObservers(eventType, payload) {
        // Notify all observers about the event and collect their Promises
        const promises = this.observers.map(observer => observer.update(eventType, payload));
        try {
            await Promise.all(promises);
            console.log(`✅ All observers resolved for event: ${eventType}`);
        } catch (error) {
            console.error(`❌ Observer error for event: ${eventType}`, error);
        }
    }

    async notifyListeners(eventType) {
        console.log('notifyListeners activated')
        // Notify all observers about the event and collect their Promises
        const promises = this.listeners.map(listener => listener.update(eventType));
        try {
            await Promise.all(promises);
            console.log(`✅ All listeners resolved for event: ${eventType}`);
        } catch (error) {
            console.error(`❌ Listener error for event: ${eventType}`, error);
        }

    }

    // Generate word objects for the game state
    generateSentenceObjects(sentences) {
        const sentenceObjects = sentences.map(sentence => ({
            sentence: sentence,  // The original word
            scrambled: sentence.split(" ").sort(() => Math.random() - 0.5), // Scrambled sentence
            topRow: Array(sentence.split(" ").length).fill(""), // Empty progress in the top row
            bottomRow: sentence.split(" ").sort(() => Math.random() - 0.5), // Scrambled letters
            currentWordIndex: 0,
            completed: false // Flag to check if the word is completed
        }));

        this.state.sentences = sentenceObjects
    }

    grabAllSentences() {
        let container = []
        this.state.sentences.forEach((sentence) => {
            container.push(sentence.sentence)
        })
        return container
    }

    // move to next or previous word

    moveToNextSentence(render = false) {
        console.log('moving to next word')
        if (this.state.currentSentenceIndex < this.state.sentences.length - 1) {
            this.state.currentSentenceIndex++;
            if (render) {
                this.notifyObservers("stateChanged", { currentSentenceIndex: this.state.currentSentenceIndex });
                return
            }
        }
        // return currentSentenceIndex no matter if it was ++'d or not
        return this.state.currentSentenceIndex;
    }

    moveToPreviousSentence() {
        if (this.state.currentSentenceIndex > 0) {
            this.state.currentSentenceIndex--;
            console.log(this.state.currentSentenceIndex)
            this.notifyObservers("stateChanged", { currentSentenceIndex: this.state.currentSentenceIndex });
        }
    }

    // Click events

    // Check condition, return true or false
    isSentenceCompleted(sentence) {
        return sentence.topRow.join(" ") == sentence.sentence
    }

    isGameWon() {
        console.log("checking if game won...");
        console.log(this.state.sentences.map(sentence => sentence.completed));
        for (const sentence of this.state.sentences) {
            console.log(sentence.completed);
            if (!sentence.completed) {
                return false;
            }
        }
        return true;
    }

    // Handle click events when a letter is selected
    async handleClick(currentSentenceIndex, wordClicked, wordIndex) {
        const sentence = this.state.sentences[currentSentenceIndex];
        const nextEmptyIndex = sentence.topRow.findIndex(c => c === "");

        if (
            nextEmptyIndex !== -1 // if there is an empty index left
            && wordClicked === sentence.sentence.split(" ")[nextEmptyIndex] //
        ) {
            sentence.currentWordIndex += 1;
            console.log(sentence.currentWordIndex)
            sentence.topRow[nextEmptyIndex] = wordClicked; // Place letter in topRow
            // replace all letters in string with ^ - this is for the purpose of conditional
            // rendering - if word contains ... , then we will render it as a hidden box
            sentence.bottomRow[wordIndex] = sentence.bottomRow[wordIndex].replace(/./g, "^");
            // sentence.bottomRow[wordIndex].replace(/[a-zA-Z]/g, "^");
            // sentence.bottomRow.splice(wordIndex, 1); // Remove letter from bottomRows

            // Make boxes appear and disappear
            await this.notifyObservers("animation", {
                wordIndex,
                nextEmptyIndex
            });
            // await this.notifyObservers("stateChanged", { currentSentenceIndex });
            await this.notifyObservers("triggerRendering", { currentSentenceIndex })
            // Check if the word is completed and trigger the event stateChanged again
            if (this.isSentenceCompleted(sentence)) {
                // The animation has to happen before currentSentenceIndex cursor gets updated
                // animations probably shouldn't be part of 'stateChanged' observer
                await this.notifyObservers("animation", { isCompleted: true });
                // moveToNextSentence isn't passed render = true, therefore it only updates currentSentenceIndex
                // which we can then grab and use to manually trigger re-rendering by passing it to 'stateChanged'
                sentence.completed = true;
                currentSentenceIndex = this.moveToNextSentence();
                await this.notifyObservers("stateChanged", { currentSentenceIndex });

            }
            // Check if game is won
            if (this.isGameWon(this.state.sentences)) {
                let sentences = this.grabAllSentences();
                await this.notifyObservers('stateChanged', { gameWon: true, sentences })
            }

        } else {
            this.notifyObservers("wrongLetter", { wordIndex });
        }
    }


}




// ---------------------------------------


const sample = [
    'Fast and obvious.',
    'Fast and obvious.',
    'Fast and obvious.',
];


document.addEventListener("DOMContentLoaded", () => {

    // Initialize the game state and observer and add observer to the game state
    const gameState = new GameState();
    const gameObserver = new GameObserver(gameState);
    // Init sound
    const soundManager = new SoundManager();
    const soundObserver = new SoundObserver(soundManager);
    // add observer and listener
    gameState.addObserver(gameObserver);
    gameState.addListener(soundObserver);
    // Starting game - Generate word objects for the game state
    const sentences = JSON.parse(localStorage.getItem("sentences"));
    console.log(sentences)
    gameState.generateSentenceObjects(sentences);
    gameState.notifyObservers("triggerRendering", { currentSentenceIndex: gameState.state.currentSentenceIndex });

    // FULL SCREEN prompt
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    fullscreenBtn.addEventListener('click', () => {
        gameState.notifyObservers("enterFullScreen", null);
    })
    document.addEventListener('fullscreenchange', () => {
        checkFullscreen()
    });
    window.addEventListener('resize', () => {
        checkFullscreen()
    });

    // ARROW NAVIGATION - Event listeners
    const prevArrow = document.getElementById("prevArrow");
    const nextArrow = document.getElementById("nextArrow");

    prevArrow.addEventListener("click", () => {
        gameState.moveToPreviousSentence();
    });
    nextArrow.addEventListener("click", () => {
        gameState.moveToNextSentence(true);
    });

    // Add event listeners for bottom row letters
    gameObserver.bottomContainer.addEventListener("click", (event) => {
        const box = event.target.closest(".box");
        if (box) {
            const wordIndex = Array.from(gameObserver.bottomContainer.children).indexOf(box);
            const wordClicked = box.textContent;
            gameState.handleClick(gameState.state.currentSentenceIndex, wordClicked, wordIndex);
        }
    });
});


