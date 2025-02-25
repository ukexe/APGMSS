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
    
    // Initialize worker with both English and Tamil
    await worker.loadLanguage('eng+tam');
    await worker.initialize('eng+tam');
    
    // Set PSM to handle mixed text better
    await worker.setParameters({
      tessedit_pageseg_mode: '6', // Assume uniform text block
      tessedit_ocr_engine_mode: '3', // Legacy + LSTM mode
      preserve_interword_spaces: '1',
    });
    
    const { data: { text } } = await worker.recognize(base64Data);
    
    await worker.terminate();
    
    if (!text.trim()) {
      throw new Error('No text could be extracted from the image');
    }
    
    return { text: text.trim() };
  } catch (error) {
    if (worker) {
      await worker.terminate();
    }
    console.error('Image processing error:', error);
    throw error;
  }
}

async function processPDF(file: File): Promise<FileProcessingResult> {
  try {
    // Convert PDF to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Extract text from PDF
    const data = await pdfExtract.extractBuffer(arrayBuffer, {});
    let text = data.pages.map(page => page.content.join(' ')).join('\n');
    
    // If text is empty, try OCR on the PDF
    if (!text.trim()) {
      const worker = await createWorker();
      try {
        await worker.loadLanguage('eng+tam');
        await worker.initialize('eng+tam');
        
        // Process each page
        for (let i = 0; i < data.pages.length; i++) {
          const { data: { text: pageText } } = await worker.recognize(data.pages[i].canvas);
          text += pageText + '\n';
        }
        
        await worker.terminate();
      } catch (ocrError) {
        console.error('OCR error:', ocrError);
        if (worker) {
          await worker.terminate();
        }
      }
    }
    
    if (!text.trim()) {
      throw new Error('No text could be extracted from the PDF');
    }
    
    return { text: text.trim() };
  } catch (error) {
    console.error('PDF processing error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to process PDF file');
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