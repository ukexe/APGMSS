import { createWorker } from 'tesseract.js';
import { PDFExtract } from 'pdf.js-extract';

const pdfExtract = new PDFExtract();
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

export type FileProcessingResult = {
  text: string;
  error?: string;
};

export async function processFile(file: File): Promise<FileProcessingResult> {
  try {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 5MB limit');
    }

    // Process based on file type
    if (file.type === 'application/pdf') {
      return await processPDF(file);
    } else if (file.type.startsWith('image/')) {
      return await processImage(file);
    } else {
      throw new Error('Unsupported file type. Please upload a PDF or image file.');
    }
  } catch (error) {
    console.error('Error processing file:', error);
    return {
      text: '',
      error: error instanceof Error ? error.message : 'Unknown error processing file',
    };
  }
}

async function processImage(file: File): Promise<FileProcessingResult> {
  const worker = await createWorker();
  
  try {
    // Convert File to base64
    const base64Data = await fileToBase64(file);
    
    // Recognize text
    await worker.loadLanguage('eng+tam');
    await worker.initialize('eng+tam');
    const { data: { text } } = await worker.recognize(base64Data);
    
    await worker.terminate();
    
    return { text: text.trim() };
  } catch (error) {
    if (worker) {
      await worker.terminate();
    }
    throw error;
  }
}

async function processPDF(file: File): Promise<FileProcessingResult> {
  try {
    // Convert PDF to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Extract text from PDF
    const data = await pdfExtract.extractBuffer(arrayBuffer, {});
    const text = data.pages.map(page => page.content.join(' ')).join('\n');
    
    return { text: text.trim() };
  } catch (error) {
    throw new Error('Failed to process PDF file');
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
} 