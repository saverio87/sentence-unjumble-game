export class SoundManager {
    constructor() {
        this.sounds = {
            correct: new Audio('sound/correct.wav'),
            incorrect: new Audio('sound/incorrect.wav'),
            sentenceCompleted: new Audio('sound/sentenceCompleted.wav'),
            gameOver: new Audio('')
        };

        // Set default volume, can be changed later
        Object.values(this.sounds).forEach(sound => {
            sound.volume = 0.5;
        });
    }

    // Play the sound based on the event
    playSound(event) {
        if (this.sounds[event]) {
            const soundClone = this.sounds[event].cloneNode();
            soundClone.volume = this.sounds[event].volume;
            soundClone.play();

            // ✅ Cleanup: Remove reference after sound finishes playing
            soundClone.addEventListener('ended', () => {
                soundClone.remove(); // Helps the garbage collector clean it up
            });
        } else {
            console.log(`No sound mapped for event: ${event}`);
        }
    }

}

export class SoundObserver {
    constructor(soundManager) {
        this.soundManager = soundManager;
    }

    // The update method that gets called when an event is triggered
    update(event) {
        this.soundManager.playSound(event);
    }
}