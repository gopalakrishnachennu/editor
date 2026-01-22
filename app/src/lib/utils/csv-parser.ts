/**
 * CSV and JSON Parser Utility
 * Handles parsing of external data files for bulk generation
 */

import Papa from "papaparse";

export interface ParsedData {
    headers: string[];
    rows: Record<string, string>[];
    totalRows: number;
}

export const parseFile = async (file: File): Promise<ParsedData> => {
    return new Promise((resolve, reject) => {
        if (file.type === "application/json" || file.name.endsWith(".json")) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const json = JSON.parse(e.target?.result as string);
                    const data = Array.isArray(json) ? json : [json];

                    if (data.length === 0) {
                        resolve({ headers: [], rows: [], totalRows: 0 });
                        return;
                    }

                    // Flatten nested objects logic could go here if needed
                    // For now, we assume a flat array of objects
                    const headers = Array.from(new Set(data.flatMap(Object.keys)));

                    // Normalize all values to strings
                    const rows = data.map(row => {
                        const normalized: Record<string, string> = {};
                        headers.forEach(header => {
                            normalized[header] = String(row[header] ?? "");
                        });
                        return normalized;
                    });

                    resolve({ headers, rows, totalRows: rows.length });
                } catch (error) {
                    reject(new Error("Invalid JSON file"));
                }
            };
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsText(file);
        } else {
            // Assume CSV
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const headers = results.meta.fields || [];
                    const rows = results.data.map((row: any) => {
                        const normalized: Record<string, string> = {};
                        headers.forEach(header => {
                            normalized[header] = String(row[header] ?? "");
                        });
                        return normalized;
                    });

                    resolve({
                        headers,
                        rows,
                        totalRows: rows.length
                    });
                },
                error: (error) => reject(error)
            });
        }
    });
};

/**
 * Helper to match CSV headers to Template Fields based on similarity
 */
export const suggestMapping = (
    csvHeaders: string[],
    templateFields: { id: string; label: string }[]
): Record<string, string> => {
    const mapping: Record<string, string> = {};

    templateFields.forEach(field => {
        // 1. Exact match (ID)
        if (csvHeaders.includes(field.id)) {
            mapping[field.id] = field.id;
            return;
        }

        // 2. Exact match (Label)
        const labelMatch = csvHeaders.find(h => h.toLowerCase() === field.label.toLowerCase());
        if (labelMatch) {
            mapping[field.id] = labelMatch;
            return;
        }

        // 3. Fuzzy match (Partial)
        const fuzzyMatch = csvHeaders.find(h =>
            h.toLowerCase().includes(field.id.toLowerCase()) ||
            field.id.toLowerCase().includes(h.toLowerCase())
        );
        if (fuzzyMatch) {
            mapping[field.id] = fuzzyMatch;
        }
    });

    return mapping;
};
