import { createWorker } from "tesseract.js";

/**
 * OCR utility class for extracting text and data from images
 */
export class OCR {
    /**
     * Extracts text from an image URL using Tesseract OCR
     * @param imageUrl URL of the image to process
     * @returns The extracted text or null if extraction failed
     */
    static async extractTextFromImage(imageUrl: string): Promise<string | null> {
        if (!imageUrl) {
            console.error("imageUrl is required");
            return null;
        }
        
        const worker = await createWorker('eng');
        
        try {
            const ret = await worker.recognize(imageUrl);
            return ret.data.text;
        } catch (e) {
            console.error("OCR failed: ", e);
            return null;
        } finally {
            await worker.terminate();
        }
    }

    /**
     * Extracts amount from OCR text
     * @param text The OCR text to analyze
     * @returns Extracted amount as a number
     */
    static extractAmountFromText(text: string): number {
        // More flexible regex that accounts for common OCR errors
        const amountRegex = /(SU[A4]|SU[BM][A4]|SU[BM][A4]\s*PL N|T[O0]TAL|[A4]M[O0]UNT|TOTAL\s*DUE|AMOUNT\s*PAID|PAYMENT|P[A4]Y[A4]BLE)\s*(PLN|EUR|USD|£|\$|€)?\s*([\d\s,.]+\d)/i;
        const match = text.match(amountRegex);

        if (match && match[3]) {
            // Clean the amount string: remove spaces, replace comma with dot
            const cleanedAmount = match[3]
                .replace(/\s/g, '')      // Remove any spaces
                .replace(',', '.');      // Replace comma with dot

            // Parse to float and round to 2 decimal places
            const amount = parseFloat(cleanedAmount);
            return isNaN(amount) ? 0 : parseFloat(amount.toFixed(2));
        }

        // Fallback: look for currency patterns if the main regex fails
        const currencyRegex = /(PLN|EUR|USD|£|\$|€)\s*([\d\s,.]+\d)/i;
        const currencyMatch = text.match(currencyRegex);

        if (currencyMatch && currencyMatch[2]) {
            const cleanedAmount = currencyMatch[2]
                .replace(/\s/g, '')
                .replace(',', '.');
            const amount = parseFloat(cleanedAmount);
            return isNaN(amount) ? 0 : parseFloat(amount.toFixed(2));
        }

        return 0;
    }

    /**
     * Extracts company name from OCR text
     * @param text The OCR text to analyze
     * @returns Extracted company name
     */
    static extractCompanyFromText(text: string): string {
        // Split text into lines and clean each line
        const lines = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        // Common patterns that indicate this isn't the company name
        const exclusionPatterns = [
            /^[|~*]+$/,      // Lines with only symbols like | ~ *
            /^PARAGON/i,     // Receipt-related words
            /^FISKALNY/i,
            /^nr wydr/i,
            /^NIP/i,
            /^ARKADTA/i,
            /^SUMA PLN/i,
            /^ROZLICZENIE/i
        ];

        // Common company patterns to look for
        const companyPatterns = [
            /Sp\.\s*z\s*o\.?o\.?/i,    // "Sp. z o.o." with possible OCR errors
            /Sp\.\s*z\s*o\.?[0-9]\.?/i,    // "Sp. z o.0." with possible OCR errors
            /Sp\.\s*z\s*[0-9]\.?o\.?/i,    // "Sp. z 0.o." with possible OCR errors
            /sp\.\s*z\s*[0-9]\.?[0-9]\.?/i,    // "Sp. z 0.0." with possible OCR errors
            /sp\.\s*z\s*o\.?o\.?/i,    // "sp. z o.o." with possible OCR errors
            /sp\.\s*z\s*o\.?0\.?/i,    // "sp. z o.0." with possible OCR errors
            /sp\.\s*z\s*[0-9]\.?o\.?/i,    // "sp. z 0.o." with possible OCR errors
            /sp\.\s*z\s*[0-9]\.?[0-9]\.?/i,  // "sp. z 0.0" with possible OCR errors
            /sp\.\s*2\s*[0-9]\.?[0-9]\.?/i,  // "sp. 2 0.0" with possible OCR errors
            /sp\.\s*2\s*o\.?[0-9]\.?/i,  // "sp. 2 o.0" with possible OCR errors
            /sp\.\s*2\s*[0-9]\.?o\.?/i,  // "sp. 2 0.o" with possible OCR errors
            /sp\.\s*2\s*o\.?o\.?/i,  // "sp. 2 o.o" with possible OCR errors
            /Sp\.\s*2\s*[0-9]\.?[0-9]\.?/i,  // "Sp. 2 0.0" with possible OCR errors
            /Sp\.\s*2\s*o\.?[0-9]\.?/i,  // "Sp. 2 o.0" with possible OCR errors
            /Sp\.\s*2\s*[0-9]\.?o\.?/i,  // "Sp. 2 0.o" with possible OCR errors
            /Sp\.\s*2\s*o\.?o\.?/i,  // "Sp. 2 o.o" with possible OCR errors

            /S\.?A\.?/i,  // "S.A." with possible OCR errors
            /s\.?A\.?/i,  // "s.A." with possible OCR errors
            /8\.?A\.?/i,  // "8.A." with possible OCR errors
            /6\.?A\.?/i,  // "6.A." with possible OCR errors

            /ltd/i,
            /inc/i,
            /s\.r\.o\./i
        ];

        // Look through lines for the most likely company name
        for (const line of lines) {
            // Skip excluded patterns
            if (exclusionPatterns.some(pattern => pattern.test(line))) {
                continue;
            }

            // If line contains company pattern, return it
            if (companyPatterns.some(pattern => pattern.test(line))) {
                return OCR.cleanAndFixCompanyName(line);
            }

            // If line looks like a potential company name (has multiple words)
            const words = line.split(/\s+/);
            if (words.length >= 2 && words.every(word => word.length > 1)) {
                return OCR.cleanAndFixCompanyName(line);
            }
        }

        // Fallback: return first non-excluded line if nothing better found
        for (const line of lines) {
            if (!exclusionPatterns.some(pattern => pattern.test(line))) {
                return OCR.cleanAndFixCompanyName(line);
            }
        }

        return '';
    }

    /**
     * Helper function to clean up and fix common company name typos
     * @param name The company name to clean
     * @returns Cleaned company name
     */
    static cleanAndFixCompanyName(name: string): string {
        return name
            // Remove leading/trailing symbols
            .replace(/^[|~*]+/, '')
            .replace(/[|~*]+$/, '')
            // Fix common OCR typos in Polish company forms
            .replace(/(sp|5p|Sp|5P)\.?\s*([zZ2])\s*([o0]\.?){2}/gi, 'Sp. z o.o.')
            .replace(/(sp|5p|Sp|5P)\.?\s*([zZ2])\s*(\d\.\d)/gi, 'Sp. z o.o.')
            .replace(/(sp|5p|Sp|5P)[.,]\s*([zZ2])\s*([o0][.,]?){2}/gi, 'Sp. z o.o.')
            .replace(/(sp|5p|Sp|5P)[.,]\s*([zZ2])[.,]?\s*([o0][.,]?){2}/gi, 'Sp. z o.o.')
            // Normalize whitespace and trim
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Extracts date from OCR text
     * @param text The OCR text to analyze
     * @returns Extracted date or null if no date found
     */
    static extractDateFromText(text: string): Date | null {
        // Common date formats to look for
        // ISO format: YYYY-MM-DD
        const isoDateRegex = /(\d{4})[-.\\/](\d{1,2})[-.\\/](\d{1,2})/;

        // Date with time: YYYY-MM-DD HH:MM or DD-MM-YYYY HH:MM
        const dateTimeRegex = /(\d{4})[-.\\/](\d{1,2})[-.\\/](\d{1,2})[ T](\d{1,2}):(\d{1,2})|(\d{1,2})[-.\\/](\d{1,2})[-.\\/](\d{4})[ T](\d{1,2}):(\d{1,2})/;

        // European format: DD.MM.YYYY or DD/MM/YYYY
        const europeanDateRegex = /(\d{1,2})[-.\\/](\d{1,2})[-.\\/](\d{4})/;

        // Common keywords that often appear near dates on receipts
        const dateKeywords = [
            /date:?\s*/i,
            /invoice\s*date:?\s*/i,
            /receipt\s*date:?\s*/i,
            /purchase\s*date:?\s*/i,
            /transaction\s*date:?\s*/i,
            /issued\s*on:?\s*/i,
            /data\s*zakupu:?\s*/i,  // Polish: purchase date
            /data\s*sprzedaży:?\s*/i  // Polish: sale date
        ];

        // Split text into lines for better processing
        const lines = text.split('\n');

        // First, try to find dates near common keywords
        for (const line of lines) {
            for (const keyword of dateKeywords) {
                const keywordMatch = line.match(keyword);
                if (keywordMatch && keywordMatch.index !== undefined) {
                    // Extract the text after the keyword
                    const afterKeyword = line.substring(keywordMatch.index + keywordMatch[0].length).trim();

                    // Try to match date with time first (more specific)
                    const dateTimeMatch = afterKeyword.match(dateTimeRegex);
                    if (dateTimeMatch) {
                        if (dateTimeMatch[1]) { // YYYY-MM-DD HH:MM format
                            const year = parseInt(dateTimeMatch[1]);
                            const month = parseInt(dateTimeMatch[2]) - 1; // JS months are 0-indexed
                            const day = parseInt(dateTimeMatch[3]);
                            const hour = parseInt(dateTimeMatch[4]);
                            const minute = parseInt(dateTimeMatch[5]);
                            return new Date(year, month, day, hour, minute);
                        } else { // DD-MM-YYYY HH:MM format
                            const day = parseInt(dateTimeMatch[6]);
                            const month = parseInt(dateTimeMatch[7]) - 1;
                            const year = parseInt(dateTimeMatch[8]);
                            const hour = parseInt(dateTimeMatch[9]);
                            const minute = parseInt(dateTimeMatch[10]);
                            return new Date(year, month, day, hour, minute);
                        }
                    }

                    // Try ISO format (YYYY-MM-DD)
                    const isoMatch = afterKeyword.match(isoDateRegex);
                    if (isoMatch) {
                        const year = parseInt(isoMatch[1]);
                        const month = parseInt(isoMatch[2]) - 1;
                        const day = parseInt(isoMatch[3]);
                        return new Date(year, month, day);
                    }

                    // Try European format (DD.MM.YYYY)
                    const euroMatch = afterKeyword.match(europeanDateRegex);
                    if (euroMatch) {
                        const day = parseInt(euroMatch[1]);
                        const month = parseInt(euroMatch[2]) - 1;
                        const year = parseInt(euroMatch[3]);
                        return new Date(year, month, day);
                    }
                }
            }
        }

        // If no date found near keywords, scan the entire text for date patterns
        for (const line of lines) {
            // Try to match date with time first
            const dateTimeMatch = line.match(dateTimeRegex);
            if (dateTimeMatch) {
                if (dateTimeMatch[1]) { // YYYY-MM-DD HH:MM format
                    const year = parseInt(dateTimeMatch[1]);
                    const month = parseInt(dateTimeMatch[2]) - 1;
                    const day = parseInt(dateTimeMatch[3]);
                    const hour = parseInt(dateTimeMatch[4]);
                    const minute = parseInt(dateTimeMatch[5]);
                    return new Date(year, month, day, hour, minute);
                } else { // DD-MM-YYYY HH:MM format
                    const day = parseInt(dateTimeMatch[6]);
                    const month = parseInt(dateTimeMatch[7]) - 1;
                    const year = parseInt(dateTimeMatch[8]);
                    const hour = parseInt(dateTimeMatch[9]);
                    const minute = parseInt(dateTimeMatch[10]);
                    return new Date(year, month, day, hour, minute);
                }
            }

            // Try ISO format (YYYY-MM-DD)
            const isoMatch = line.match(isoDateRegex);
            if (isoMatch) {
                const year = parseInt(isoMatch[1]);
                const month = parseInt(isoMatch[2]) - 1;
                const day = parseInt(isoMatch[3]);
                return new Date(year, month, day);
            }

            // Try European format (DD.MM.YYYY)
            const euroMatch = line.match(europeanDateRegex);
            if (euroMatch) {
                const day = parseInt(euroMatch[1]);
                const month = parseInt(euroMatch[2]) - 1;
                const year = parseInt(euroMatch[3]);
                return new Date(year, month, day);
            }
        }

        return null;
    }

    /**
     * Processes an image and extracts all relevant data
     * @param imageUrl URL of the image to process
     * @returns Object containing extracted text, amount, company name, and date
     */
    static async processImage(imageUrl: string): Promise<{
        text: string | null;
        amount: number;
        company: string;
        date: Date | null;
    }> {
        if (!imageUrl) {
            return {
                text: null,
                amount: 0,
                company: '',
                date: null
            };
        }

        const extractedText = await OCR.extractTextFromImage(imageUrl);
        
        if (!extractedText) {
            return {
                text: null,
                amount: 0,
                company: '',
                date: null
            };
        }

        const amount = OCR.extractAmountFromText(extractedText);
        const company = OCR.extractCompanyFromText(extractedText);
        const date = OCR.extractDateFromText(extractedText);

        return {
            text: extractedText,
            amount,
            company,
            date
        };
    }
}

export default OCR;