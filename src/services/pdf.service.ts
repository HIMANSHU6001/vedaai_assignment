import { PDFParse } from 'pdf-parse';

const MAX_EXTRACTED_LENGTH = 3000;

export async function extractTextFromBuffer(buffer: Buffer, mimetype: string): Promise<string> {
  if (mimetype === 'application/pdf') {
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    await parser.destroy();
    return parsed.text.slice(0, MAX_EXTRACTED_LENGTH).trim();
  }

  if (mimetype === 'text/plain') {
    return buffer.toString('utf-8').slice(0, MAX_EXTRACTED_LENGTH).trim();
  }

  return '';
}

