// Animation State Machine

const ANIMATIONS = {
    // Timing constants (ms)
    BLINK_DURATION: 150,
    WINK_DURATION: 300,
    SMILE_DURATION: 1500,
    MIN_INTERVAL: 2000,
    MAX_INTERVAL: 6000,

    isAnimating: false,

    init: function() {
        this.scheduleNext();
    },

    scheduleNext: function() {
        const delay = this.MIN_INTERVAL + Math.random() * (this.MAX_INTERVAL - this.MIN_INTERVAL);
        setTimeout(() => this.triggerRandom(), delay);
    },

    triggerRandom: function() {
        if (this.isAnimating) {
            this.scheduleNext();
            return;
        }

        // Randomly choose an animation
        const rand = Math.random();

        if (rand < 0.5) {
            this.blink();
        } else if (rand < 0.8) {
            this.wink();
        } else {
            this.smile();
        }
    },

    blink: function() {
        this.isAnimating = true;

        // Close both eyes
        ASCII_ENGINE.animState.leftEyeOpen = false;
        ASCII_ENGINE.animState.rightEyeOpen = false;

        // Open eyes after duration
        setTimeout(() => {
            ASCII_ENGINE.animState.leftEyeOpen = true;
            ASCII_ENGINE.animState.rightEyeOpen = true;
            this.isAnimating = false;
            this.scheduleNext();
        }, this.BLINK_DURATION);
    },

    wink: function() {
        this.isAnimating = true;

        // Randomly choose which eye to wink
        const winkLeft = Math.random() < 0.5;

        if (winkLeft) {
            ASCII_ENGINE.animState.leftEyeOpen = false;
        } else {
            ASCII_ENGINE.animState.rightEyeOpen = false;
        }

        // Open eye after duration
        setTimeout(() => {
            ASCII_ENGINE.animState.leftEyeOpen = true;
            ASCII_ENGINE.animState.rightEyeOpen = true;
            this.isAnimating = false;
            this.scheduleNext();
        }, this.WINK_DURATION);
    },

    smile: function() {
        this.isAnimating = true;

        // Activate smile
        ASCII_ENGINE.animState.smiling = true;

        // Deactivate after duration
        setTimeout(() => {
            ASCII_ENGINE.animState.smiling = false;
            this.isAnimating = false;
            this.scheduleNext();
        }, this.SMILE_DURATION);
    }
};

// Initialize animations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure ASCII_ENGINE is initialized first
    setTimeout(() => ANIMATIONS.init(), 100);
});
