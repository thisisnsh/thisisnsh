// ASCII Canvas Rendering Engine

const ASCII_ENGINE = {
    canvas: null,
    ctx: null,
    cellWidth: 10,
    cellHeight: 14,
    lastUpdate: 0,
    updateInterval: 100, // ms between character updates

    // Current character state for each cell
    charGrid: [],

    // Animation state (controlled by animations.js)
    animState: {
        leftEyeOpen: true,
        rightEyeOpen: true,
        smiling: false
    },

    init: function() {
        this.canvas = document.getElementById('ascii-portrait');
        this.ctx = this.canvas.getContext('2d');

        // Initialize character grid
        this.initCharGrid();

        // Size canvas appropriately
        this.resize();

        // Handle window resize
        window.addEventListener('resize', () => this.resize());

        // Start render loop
        this.render();
    },

    initCharGrid: function() {
        this.charGrid = [];
        for (let y = 0; y < PORTRAIT.rows; y++) {
            const row = [];
            for (let x = 0; x < PORTRAIT.cols; x++) {
                const regionCode = PORTRAIT.grid[y][x];
                row.push(PORTRAIT.getChar(regionCode));
            }
            this.charGrid.push(row);
        }
    },

    resize: function() {
        // Calculate optimal cell size based on viewport
        const wrapper = document.querySelector('.portrait-wrapper');
        const maxWidth = wrapper.clientWidth - 40;
        const maxHeight = wrapper.clientHeight - 40;

        // Calculate cell size to fit within bounds
        const cellW = Math.floor(maxWidth / PORTRAIT.cols);
        const cellH = Math.floor(maxHeight / PORTRAIT.rows);

        // Maintain aspect ratio (roughly 1:1.4 for monospace)
        this.cellWidth = Math.min(cellW, cellH * 0.7);
        this.cellHeight = this.cellWidth * 1.4;

        // Minimum cell size
        this.cellWidth = Math.max(6, this.cellWidth);
        this.cellHeight = Math.max(8, this.cellHeight);

        // Set canvas size
        this.canvas.width = PORTRAIT.cols * this.cellWidth;
        this.canvas.height = PORTRAIT.rows * this.cellHeight;

        // Set font
        this.ctx.font = `${this.cellHeight}px 'Courier New', monospace`;
        this.ctx.textBaseline = 'top';
    },

    updateChars: function() {
        // Randomly update some characters for animation effect
        for (let y = 0; y < PORTRAIT.rows; y++) {
            for (let x = 0; x < PORTRAIT.cols; x++) {
                // Only update ~20% of cells each frame for subtle animation
                if (Math.random() < 0.2) {
                    const regionCode = PORTRAIT.grid[y][x];

                    // Handle eye animations
                    if (regionCode === PORTRAIT.LEFT_EYE && !this.animState.leftEyeOpen) {
                        this.charGrid[y][x] = '';
                        continue;
                    }
                    if (regionCode === PORTRAIT.RIGHT_EYE && !this.animState.rightEyeOpen) {
                        this.charGrid[y][x] = '';
                        continue;
                    }

                    // Handle smile animation
                    if (regionCode === PORTRAIT.MOUTH && this.animState.smiling) {
                        this.charGrid[y][x] = ['^', 'v', ')', '(', 'D'][Math.floor(Math.random() * 5)];
                        continue;
                    }

                    this.charGrid[y][x] = PORTRAIT.getChar(regionCode);
                }
            }
        }
    },

    render: function(timestamp = 0) {
        // Update characters periodically
        if (timestamp - this.lastUpdate > this.updateInterval) {
            this.updateChars();
            this.lastUpdate = timestamp;
        }

        // Clear canvas (transparent)
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw characters
        this.ctx.fillStyle = 'white';

        for (let y = 0; y < PORTRAIT.rows; y++) {
            for (let x = 0; x < PORTRAIT.cols; x++) {
                const char = this.charGrid[y][x];
                if (char) {
                    const px = x * this.cellWidth;
                    const py = y * this.cellHeight;
                    this.ctx.fillText(char, px, py);
                }
            }
        }

        // Continue animation loop
        requestAnimationFrame((t) => this.render(t));
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ASCII_ENGINE.init();
});
