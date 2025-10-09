// Text extraction utilities for PDF and images

declare global {
  interface Window {
    pdfjsLib: any;
    Tesseract: any;
  }
}

// Load PDF.js library
const loadPdfJs = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js";
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load PDF.js library"));
    document.head.appendChild(script);
  });
};

// Load Tesseract.js library
const loadTesseract = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.Tesseract) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@4.0.2/dist/tesseract.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Tesseract.js library"));
    document.head.appendChild(script);
  });
};

export const extractTextFromPdf = async (file: File): Promise<string> => {
  await loadPdfJs();

  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onload = async function () {
      try {
        const typedArray = new Uint8Array(this.result as ArrayBuffer);
        const pdf = await window.pdfjsLib.getDocument(typedArray).promise;
        let fullText = "";

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(" ");
          fullText += pageText + "\n";
        }

        if (!fullText.trim()) {
          reject(new Error("No text found in PDF. The PDF might be image-based."));
        } else {
          resolve(fullText);
        }
      } catch (error) {
        reject(new Error("Failed to extract text from PDF: " + error));
      }
    };

    fileReader.onerror = () => reject(new Error("Failed to read PDF file"));
    fileReader.readAsArrayBuffer(file);
  });
};

export const extractTextFromImage = async (file: File): Promise<string> => {
  await loadTesseract();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const imageData = e.target?.result;
        const worker = await window.Tesseract.createWorker();
        await worker.loadLanguage("eng");
        await worker.initialize("eng");
        const { data } = await worker.recognize(imageData);
        await worker.terminate();

        if (!data.text.trim()) {
          reject(new Error("No text found in image"));
        } else {
          resolve(data.text);
        }
      } catch (error) {
        reject(new Error("Failed to perform OCR on image: " + error));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
};
