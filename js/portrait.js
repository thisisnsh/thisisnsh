// Portrait grid data
// 0 = empty (transparent)
// 1 = line/outline (transparent - shows gradient)
// 2 = face fill
// 3 = left eye
// 4 = right eye
// 5 = mouth
// 6 = beard
// 7 = shirt
// 8 = hair

const PORTRAIT = {
    // Grid dimensions
    cols: 50,
    rows: 65,

    // Region codes
    EMPTY: 0,
    LINE: 1,
    FACE: 2,
    LEFT_EYE: 3,
    RIGHT_EYE: 4,
    MOUTH: 5,
    BEARD: 6,
    SHIRT: 7,
    HAIR: 8,

    // ASCII character sets for each region
    charSets: {
        2: ['@', '#', '%', '&', '*', '+', '='],  // face
        3: ['O', '0', 'o', '@', '*'],              // left eye
        4: ['O', '0', 'o', '@', '*'],              // right eye
        5: ['~', '-', '=', '_', '^'],              // mouth
        6: ['.', ':', ';', ',', "'", '`'],         // beard
        7: ['/', '\\', '|', '-', '+', 'X'],        // shirt
        8: ['#', '@', '%', '&', 'M', 'W']          // hair
    },

    // Generate the grid
    grid: null,

    init: function() {
        this.grid = [];

        for (let y = 0; y < this.rows; y++) {
            const row = [];
            for (let x = 0; x < this.cols; x++) {
                row.push(this.getCellType(x, y));
            }
            this.grid.push(row);
        }

        return this.grid;
    },

    getCellType: function(x, y) {
        const centerX = this.cols / 2;

        // Helper functions for shapes
        const inEllipse = (cx, cy, rx, ry) => {
            const dx = (x - cx) / rx;
            const dy = (y - cy) / ry;
            return dx * dx + dy * dy <= 1;
        };

        const onEllipseEdge = (cx, cy, rx, ry, thickness = 1.5) => {
            const dx = (x - cx) / rx;
            const dy = (y - cy) / ry;
            const dist = dx * dx + dy * dy;
            return dist <= 1 && dist >= Math.pow((rx - thickness) / rx, 2);
        };

        // Hair region (top of head)
        if (y >= 3 && y <= 18) {
            const hairRx = 18 - (y < 8 ? (8 - y) * 0.5 : 0);
            const hairRy = 16;
            const hairCy = 18;

            if (inEllipse(centerX, hairCy, hairRx, hairRy)) {
                // Hair outline
                if (onEllipseEdge(centerX, hairCy, hairRx, hairRy, 1.2)) {
                    return this.LINE;
                }
                return this.HAIR;
            }
        }

        // Face region (main oval)
        const faceRx = 16;
        const faceRy = 22;
        const faceCy = 28;

        if (inEllipse(centerX, faceCy, faceRx, faceRy)) {
            // Face outline
            if (onEllipseEdge(centerX, faceCy, faceRx, faceRy, 1.3)) {
                return this.LINE;
            }

            // Left eye
            const leftEyeX = centerX - 6;
            const eyeY = 24;
            const eyeRx = 3;
            const eyeRy = 2;

            if (inEllipse(leftEyeX, eyeY, eyeRx, eyeRy)) {
                if (onEllipseEdge(leftEyeX, eyeY, eyeRx, eyeRy, 0.8)) {
                    return this.LINE;
                }
                return this.LEFT_EYE;
            }

            // Right eye
            const rightEyeX = centerX + 6;

            if (inEllipse(rightEyeX, eyeY, eyeRx, eyeRy)) {
                if (onEllipseEdge(rightEyeX, eyeY, eyeRx, eyeRy, 0.8)) {
                    return this.LINE;
                }
                return this.RIGHT_EYE;
            }

            // Nose (simple line)
            if (x >= centerX - 1 && x <= centerX + 1 && y >= 27 && y <= 32) {
                if (x === centerX - 1 || x === centerX + 1) {
                    return this.LINE;
                }
                return this.FACE;
            }

            // Mouth
            const mouthY = 37;
            const mouthRx = 5;
            const mouthRy = 2;

            if (inEllipse(centerX, mouthY, mouthRx, mouthRy)) {
                if (onEllipseEdge(centerX, mouthY, mouthRx, mouthRy, 0.7)) {
                    return this.LINE;
                }
                return this.MOUTH;
            }

            // Beard area (lower face)
            if (y >= 40 && y <= 50) {
                return this.BEARD;
            }

            return this.FACE;
        }

        // Neck and shirt
        if (y >= 48 && y <= 64) {
            // Neck
            if (y < 52 && x >= centerX - 5 && x <= centerX + 5) {
                if (x === centerX - 5 || x === centerX + 5) {
                    return this.LINE;
                }
                return this.FACE;
            }

            // Shirt/shoulders
            if (y >= 52) {
                const shirtWidth = 20 + (y - 52) * 1.5;
                const halfWidth = shirtWidth / 2;

                if (x >= centerX - halfWidth && x <= centerX + halfWidth) {
                    // Collar V-shape
                    const collarDepth = y - 52;
                    const collarWidth = collarDepth * 0.8;

                    if (x >= centerX - collarWidth && x <= centerX + collarWidth && y < 58) {
                        // Collar line
                        if (Math.abs(x - centerX) >= collarWidth - 1) {
                            return this.LINE;
                        }
                        return this.EMPTY;
                    }

                    // Shirt outline
                    if (Math.abs(x - (centerX - halfWidth)) < 1.2 ||
                        Math.abs(x - (centerX + halfWidth)) < 1.2 ||
                        y >= 63) {
                        return this.LINE;
                    }

                    return this.SHIRT;
                }
            }
        }

        return this.EMPTY;
    },

    // Get random character for a region
    getChar: function(regionCode) {
        if (regionCode === this.EMPTY || regionCode === this.LINE) {
            return '';
        }
        const chars = this.charSets[regionCode] || ['*'];
        return chars[Math.floor(Math.random() * chars.length)];
    }
};

// Initialize the grid
PORTRAIT.init();
