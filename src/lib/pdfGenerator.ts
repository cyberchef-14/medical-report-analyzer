export const downloadAsPDF = async (summary: string, fileName: string = "medical-summary.pdf") => {
  // Use jsPDF for PDF generation
  const { jsPDF } = await import('jspdf');
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  
  // Title
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text("Medical Report Summary", margin, 20);
  
  // Date
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, 30);
  
  // Summary content
  doc.setFontSize(12);
  const lines = doc.splitTextToSize(summary, maxWidth);
  doc.text(lines, margin, 45);
  
  // Save the PDF
  doc.save(fileName);
};
