export interface SnapResult {
    x: number;
    y: number;
    guides: {
        vertical?: number; // X position of vertical guide
        horizontal?: number; // Y position of horizontal guide
    };
}

export function calculateSnapping(
    x: number,
    y: number,
    width: number,
    height: number,
    canvasWidth: number,
    canvasHeight: number,
    threshold: number = 10
): SnapResult {
    const result: SnapResult = { x, y, guides: {} };

    // Center points
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Canvas Center
    const canvasCenterX = canvasWidth / 2;
    const canvasCenterY = canvasHeight / 2;

    // --- Horizontal Snapping (X axis) ---
    // Snap Center to Center
    if (Math.abs(centerX - canvasCenterX) < threshold) {
        result.x = canvasCenterX - width / 2;
        result.guides.vertical = canvasCenterX;
    }
    // Snap Left to Left Edge
    else if (Math.abs(x) < threshold) {
        result.x = 0;
        result.guides.vertical = 0;
    }
    // Snap Right to Right Edge
    else if (Math.abs(x + width - canvasWidth) < threshold) {
        result.x = canvasWidth - width;
        result.guides.vertical = canvasWidth;
    }

    // --- Vertical Snapping (Y axis) ---
    // Snap Center to Center
    if (Math.abs(centerY - canvasCenterY) < threshold) {
        result.y = canvasCenterY - height / 2;
        result.guides.horizontal = canvasCenterY;
    }
    // Snap Top to Top Edge
    else if (Math.abs(y) < threshold) {
        result.y = 0;
        result.guides.horizontal = 0;
    }
    // Snap Bottom to Bottom Edge
    else if (Math.abs(y + height - canvasHeight) < threshold) {
        result.y = canvasHeight - height;
        result.guides.horizontal = canvasHeight;
    }

    return result;
}
