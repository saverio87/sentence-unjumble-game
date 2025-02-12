import { animateSentenceCompletion, disappearBox, appearBox, animateWrongWord } from "./animations.js";
import { requestFullScreen, checkFullscreen } from "./utils.js";

// Game state

class GameState {
    constructor() {
        this.state = { sentences: [], currentSentenceIndex: 0 };
        this.observers = [];
    }

    // Add observer to the list
    addObserver(observer) {
        this.observers.push(observer);
    }

    async notifyObservers(eventType, payload) {
        // Notify all observers about the event and collect their Promises
        const promises = this.observers.map(observer => observer.update(eventType, payload));
        // Wait for all Promises to resolve
        await Promise.all(promises);
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

    // Utility function to introduce a delay (pause)

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
            sentence.bottomRow.splice(wordIndex, 1); // Remove letter from bottomRows

            // Make boxes appear and disappear
            await this.notifyObservers("animation", { wordIndex });
            await this.notifyObservers("animation", { nextEmptyIndex });
            await this.notifyObservers("stateChanged", { currentSentenceIndex });

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


// Game Observer


class GameObserver {
    constructor(gameState) {
        this.gameState = gameState;
        this.gameContainer = document.getElementById("gameContainer");
        this.endScreen = document.getElementById("endScreen");
        // Rows containers
        this.topContainer = document.getElementById("topRow");
        this.bottomContainer = document.getElementById("bottomRow");
        this.sentenceIndicator = document.getElementById("sentenceIndicator");
    }


    // This method is called when the GameState changes
    async update(eventType, payload) {
        switch (eventType) {

            case "animation":

                Array.from(this.topContainer.children).forEach((box) => {
                    box.classList.add('not-clickable')
                });
                Array.from(this.bottomContainer.children).forEach((box) => {
                    box.classList.add('not-clickable')
                });

                const { wordIndex, nextEmptyIndex, isCompleted } = payload;

                if (wordIndex !== undefined) {
                    // if payload includes 'wordIndex' it means we want the box in the bottom row to disappear
                    await disappearBox(this.bottomContainer, wordIndex);
                }
                if (nextEmptyIndex !== undefined) {
                    // if payload includes 'nextEmptyIndex' it means we want the box in the top row to appear
                    await appearBox(this.topContainer, nextEmptyIndex);
                }
                if (isCompleted) {
                    await animateSentenceCompletion(this.topContainer);
                }

                break;

            case "stateChanged":
                // as topContainer and bottomContainer are re-rendered in renderSentence() everytime
                // this event is observed, there is no need to remove the class .not-clickable
                // at a later time
                Array.from(this.topContainer.children).forEach((box) => {
                    box.classList.add('not-clickable')
                });
                Array.from(this.bottomContainer.children).forEach((box) => {
                    box.classList.add('not-clickable')
                });

                // Handling animations before re-rendering word
                let currentSentenceIndex = payload.currentSentenceIndex;
                const { isDelayed, gameWon } = payload;

                console.log("gameWon", gameWon)

                if (isDelayed) {
                    await this.gameState.delay(isDelayed);
                }

                if (gameWon) {
                    this.toggleScreens(payload.sentences);
                    return
                };
                // Re-render word
                this.renderSentence(currentSentenceIndex);
                console.log("Called renderSentence");

                break;

            case "enterFullScreen":
                requestFullScreen();
                break;

            case "wrongLetter":
                animateWrongWord(this.bottomContainer, payload.wordIndex);
                break;
        }

        return
    }



    checkFullscreen() {
        const overlay = document.getElementById('overlay');
        if (document.fullscreenElement) {
            overlay.classList.add('hidden');
        } else {
            overlay.classList.remove('hidden');
        }
    }


    // Re-rendering

    toggleScreens(words) {
        this.gameContainer.classList.add("hidden");
        this.endScreen.classList.remove("hidden");
        this.renderEndScreen(words);
    }

    renderEndScreen(sentences) {
        sentences.forEach((sentence, sentenceIndex) => {
            // Create a row for the sentence
            const row = document.createElement("div");
            row.classList.add("row");
            row.id = `topRow`; // Assign a unique ID for each row

            // Populate the row with letters
            sentence.split(" ").forEach(letter => {
                const box = document.createElement("div");
                box.classList.add("box", "normal", "correct"); // Add classes
                box.textContent = letter; // Set the letter
                row.appendChild(box); // Add the box to the row
            });

            // Append the row to the container
            this.endScreen.appendChild(row);
        });
    }

    // Render both the top and bottom rows
    renderSentence(currentSentenceIndex) {
        const sentence = this.gameState.state.sentences[currentSentenceIndex];
        console.log(sentence)
        this.renderRow(this.topContainer, { topRow: sentence.topRow });
        this.renderRow(this.bottomContainer, { bottomRow: sentence.bottomRow });
        this.sentenceIndicator.textContent = `Sentence ${currentSentenceIndex + 1} of ${this.gameState.state.sentences.length}`;
    }

    // Render a single row (top or bottom)
    renderRow(container, rowData) {
        container.innerHTML = ""; // Clear current content
        const currentSentence = this.gameState.state.sentences[this.gameState.state.currentSentenceIndex].sentence;
        // Top row
        if (rowData.topRow) {
            rowData.topRow.forEach((word, index) => {
                const box = document.createElement("div");

                word == "" ?
                    box.classList.add('box', 'underscored') :
                    box.classList.add('box', 'normal', 'correct')
                box.textContent = word;
                console.log(currentSentence.split(" ")[index])
                box.style.width = `${(currentSentence.split(" ")[index].length) + 2}rem`; // Dynamically set width based on word length
                container.appendChild(box);
            });
        };
        // Bottom row
        if (rowData.bottomRow) {
            rowData.bottomRow.forEach(word => {
                const box = document.createElement("div");
                box.classList.add("box", "normal");
                box.style.width = `${(word.length) + 2}rem`; // Dynamically set width based on word length
                box.textContent = word;
                container.appendChild(box);
            });
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
    gameState.addObserver(gameObserver);

    // Full screen
    // const fullscreenBtn = document.getElementById('fullscreen-btn');
    // fullscreenBtn.addEventListener('click', () => {
    //     gameState.notifyObservers("enterFullScreen", null);
    // })
    // document.addEventListener('fullscreenchange', () => {
    //     gameObserver.checkFullscreen()
    // });
    // window.addEventListener('resize', () => {
    //     gameObserver.checkFullscreen()
    // });


    // Starting game - Generate word objects for the game state
    const sentences = JSON.parse(localStorage.getItem("sentences"));
    console.log(sentences)
    gameState.generateSentenceObjects(sentences);
    gameState.notifyObservers("stateChanged", { currentSentenceIndex: gameState.state.currentSentenceIndex });

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


