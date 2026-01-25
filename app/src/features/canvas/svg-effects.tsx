export function SVGEffectsDefinition() {
    return (
        <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
            <defs>
                {/* Pixelate Filter */}
                {/* Note: True pixelation is hard in SVG. We use a 'blocky' approximation using morphology or noise */}
                {/* Better approach: We will use a standard pixelate filter pattern if possible, 
                    but for now, let's use a "Crisp" scaling trick in CSS, 
                    and use SVG for something else like Chromatic Aberration 
                */}

                {/* Chromatic Aberration / RGB Shift */}
                <filter id="chromatic-aberration">
                    <feOffset in="SourceGraphic" dx="2" dy="0" result="red" />
                    <feOffset in="SourceGraphic" dx="-2" dy="0" result="blue" />
                    <feBlend in="red" in2="blue" mode="screen" />
                </filter>
            </defs>
        </svg>
    );
}
