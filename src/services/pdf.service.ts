import pdfParse from 'pdf-parse';

const MAX_EXTRACTED_LENGTH = 3000;

export async function extractTextFromBuffer(buffer: Buffer, mimetype: string): Promise<string> {
  if (mimetype === 'application/pdf') {
    const parsePdf = pdfParse as unknown as (input: Buffer) => Promise<{ text: string }>;
    const parsed = await parsePdf(buffer);
    return parsed.text.slice(0, MAX_EXTRACTED_LENGTH).trim();
  }

  if (mimetype === 'text/plain') {
    return buffer.toString('utf-8').slice(0, MAX_EXTRACTED_LENGTH).trim();
  }

  return '';
}
