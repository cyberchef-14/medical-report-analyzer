import jsPDF from "jspdf";

export const exportReportAsPDF = (report: {
  report_name: string;
  summary: string;
  extracted_text: string;
  created_at: string;
}) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Medical Report Summary", margin, yPosition);
  yPosition += 10;

  // Report name
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(`Report: ${report.report_name}`, margin, yPosition);
  yPosition += 8;

  // Date
  doc.setFontSize(10);
  doc.text(`Date: ${new Date(report.created_at).toLocaleDateString()}`, margin, yPosition);
  yPosition += 15;

  // Summary section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Summary:", margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const summaryLines = doc.splitTextToSize(report.summary || "No summary available", maxWidth);
  summaryLines.forEach((line: string) => {
    if (yPosition > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      yPosition = margin;
    }
    doc.text(line, margin, yPosition);
    yPosition += 6;
  });

  yPosition += 10;

  // Extracted text section
  if (report.extracted_text) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Extracted Text:", margin, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const textLines = doc.splitTextToSize(report.extracted_text, maxWidth);
    textLines.forEach((line: string) => {
      if (yPosition > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });
  }

  // Save the PDF
  doc.save(`${report.report_name.replace(/\.[^/.]+$/, "")}_summary.pdf`);
};
