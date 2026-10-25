import { useRef } from 'react';
import jsPDF from 'jspdf';

const QuestionPaperPreview = ({ data, onRegenerate }) => {
  const previewRef = useRef(null);

  if (!data || !data.paper) return null;

  const { paper, analysis, disclaimer } = data;
  const { metadata, sections, generatedAt, label } = paper;

  const defaultDuration = metadata.examType === 'EST' ? '3 Hours' : '1 Hour';

  // --- Generate PDF ---
  const handleDownloadPdf = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const usableWidth = pageWidth - margin * 2;
    let y = 15;

    const checkPageBreak = (needed) => {
      if (y + needed > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        y = 15;
      }
    };

    // Header
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(label || 'AI-Generated Practice Question Paper', pageWidth / 2, y, { align: 'center' });
    y += 6;

    if (metadata.institutionName) {
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.setFont(undefined, 'bold');
      doc.text(metadata.institutionName, pageWidth / 2, y, { align: 'center' });
      y += 8;
    }

    if (metadata.paperTitle) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(metadata.paperTitle, pageWidth / 2, y, { align: 'center' });
      y += 7;
    }

    // Exam details
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(40);

    const details = [];
    if (metadata.degree) details.push(`Degree: ${metadata.degree}`);
    if (metadata.department) details.push(`Dept: ${metadata.department}`);
    if (metadata.semester) details.push(`Semester: ${metadata.semester}`);
    details.push(`Subject: ${metadata.subjectName}`);
    details.push(`Exam: ${metadata.examType}`);
    if (metadata.year) details.push(`Year: ${metadata.year}`);

    const detailLine = details.join('  |  ');
    doc.text(detailLine, pageWidth / 2, y, { align: 'center' });
    y += 6;

    doc.text(`Maximum Marks: ${metadata.structure.totalMarks}`, margin, y);
    doc.text(`Suggested Duration: ${defaultDuration}`, pageWidth - margin, y, { align: 'right' });
    y += 5;

    // Divider
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // Instructions
    doc.setFontSize(9);
    doc.setFont(undefined, 'italic');
    doc.text('General Instructions:', margin, y);
    y += 4;
    doc.setFont(undefined, 'normal');
    const instructions = [
      'Attempt all questions.',
      'Marks are indicated against each question.',
      `This is an AI-generated practice paper for study purposes only.`,
    ];
    instructions.forEach((inst) => {
      doc.text(`• ${inst}`, margin + 2, y);
      y += 4;
    });
    y += 4;

    // Sections & Questions
    sections.forEach((section) => {
      checkPageBreak(15);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0);
      doc.text(`${section.name}: ${section.description || ''}`, margin, y);
      y += 3;
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100);
      doc.text(`(${section.questions.length} questions × ${section.marksEach} marks each = ${section.questions.length * section.marksEach} marks)`, margin, y);
      y += 6;

      section.questions.forEach((q, qi) => {
        const globalNum = sections
          .slice(0, sections.indexOf(section))
          .reduce((sum, s) => sum + s.questions.length, 0) + qi + 1;

        const qText = `Q${globalNum}. ${q.text}`;
        const marksLabel = `[${q.marks} marks]`;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0);

        const lines = doc.splitTextToSize(qText, usableWidth - 25);
        checkPageBreak(lines.length * 5 + 6);

        lines.forEach((line, li) => {
          doc.text(line, margin, y);
          if (li === 0) {
            doc.setTextColor(100);
            doc.setFontSize(9);
            doc.text(marksLabel, pageWidth - margin, y, { align: 'right' });
            doc.setTextColor(0);
            doc.setFontSize(10);
          }
          y += 5;
        });

        // Subparts
        if (q.subparts && q.subparts.length > 0) {
          q.subparts.forEach((sp, spi) => {
            const spText = `   (${String.fromCharCode(97 + spi)}) ${sp.text || sp}`;
            const spLines = doc.splitTextToSize(spText, usableWidth - 30);
            checkPageBreak(spLines.length * 5);
            spLines.forEach((line) => {
              doc.text(line, margin + 5, y);
              y += 5;
            });
          });
        }

        y += 3;
      });

      y += 4;
    });

    // Footer
    checkPageBreak(15);
    y += 5;
    doc.setDrawColor(180);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text('This is an AI-generated practice paper. NOT an official university examination.', pageWidth / 2, y, { align: 'center' });
    y += 3;
    doc.text(`Generated by PaperVault AI on ${new Date(generatedAt).toLocaleDateString()}`, pageWidth / 2, y, { align: 'center' });

    const fileName = `${metadata.subjectName.replace(/\s+/g, '_')}_${metadata.examType}_Practice_Paper.pdf`;
    doc.save(fileName);
  };

  // --- Print ---
  const handlePrint = () => {
    const printContent = previewRef.current;
    if (!printContent) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>${metadata.subjectName} - ${metadata.examType} Practice Paper</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 30px; color: #000; }
            h1 { text-align: center; font-size: 14pt; margin: 0; }
            h2 { text-align: center; font-size: 12pt; margin: 4px 0; }
            .meta { text-align: center; font-size: 10pt; margin: 4px 0; }
            .divider { border-top: 1px solid #000; margin: 10px 0; }
            .section-title { font-size: 11pt; font-weight: bold; margin-top: 16px; }
            .section-sub { font-size: 9pt; color: #666; margin-bottom: 8px; }
            .question { margin: 8px 0; font-size: 10.5pt; }
            .marks { float: right; font-size: 9pt; color: #444; }
            .disclaimer { font-size: 8pt; color: #999; text-align: center; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 8px; }
            .subpart { margin-left: 20px; font-size: 10pt; }
            @media print { body { padding: 15px; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>window.onload = function() { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    win.document.close();
  };

  let questionCounter = 0;

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div>
          <h3 className="font-semibold text-gray-800">✅ Paper Generated Successfully</h3>
          <p className="text-xs text-gray-500">
            {paper.totalQuestions} questions | {paper.totalMarks} marks | {metadata.examType}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap w-full sm:w-auto">
          <button
            onClick={handleDownloadPdf}
            id="download-pdf-btn"
            className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
          >
            📥 Download PDF
          </button>
          <button
            onClick={handlePrint}
            id="print-paper-btn"
            className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-1.5"
          >
            🖨️ Print
          </button>
          <button
            onClick={onRegenerate}
            id="regenerate-btn"
            className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5"
          >
            🔄 Regenerate
          </button>
        </div>
      </div>

      {/* Analysis Summary */}
      {analysis && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h4 className="font-medium text-gray-700 text-sm mb-2">📊 Analysis Summary</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-blue-50 rounded-lg p-2">
              <p className="text-lg font-bold text-blue-700">{analysis.paperCount}</p>
              <p className="text-xs text-blue-600">Papers Found</p>
            </div>
            <div className="bg-green-50 rounded-lg p-2">
              <p className="text-lg font-bold text-green-700">
                {analysis.usableExtractedPapers}
                {analysis.ocrProcessedCount > 0 && (
                  <span className="text-xs font-semibold text-emerald-600 block">
                    ({analysis.ocrProcessedCount} via OCR)
                  </span>
                )}
              </p>
              <p className="text-xs text-green-600">Extracted</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-2">
              <p className="text-lg font-bold text-purple-700 capitalize">{analysis.analysisMode}</p>
              <p className="text-xs text-purple-600">Mode</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-2">
              <p className="text-lg font-bold text-amber-700">{analysis.syllabusProvided ? 'Yes' : 'No'}</p>
              <p className="text-xs text-amber-600">Syllabus</p>
            </div>
          </div>
          {analysis.partiallyExtractedCount > 0 && (
            <p className="text-xs text-amber-600 mt-2">
              ⚠️ {analysis.partiallyExtractedCount} PDF(s) were partially extracted.
            </p>
          )}
          {analysis.extractionErrors && analysis.extractionErrors.length > 0 && (
            <p className="text-xs text-red-500 mt-2">
              ⚠️ {analysis.extractionErrors.length} PDF(s) could not be extracted.
            </p>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
        ⚠️ {disclaimer}
      </div>

      {/* Paper Preview */}
      <div
        ref={previewRef}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8 max-w-4xl mx-auto"
        id="paper-preview"
      >
        {/* Paper Header */}
        <div className="text-center border-b border-gray-300 pb-4 mb-4">
          <p className="text-xs text-gray-400 italic mb-1">{label}</p>
          {metadata.institutionName && (
            <h1 className="text-xl font-bold text-gray-900">{metadata.institutionName}</h1>
          )}
          {metadata.paperTitle && (
            <h2 className="text-lg font-semibold text-gray-800 mt-1">{metadata.paperTitle}</h2>
          )}
          <div className="mt-2 text-sm text-gray-600 space-y-0.5">
            {metadata.degree && <p>Degree: {metadata.degree}</p>}
            <p>
              {metadata.department && `Department: ${metadata.department} | `}
              {metadata.semester && `Semester: ${metadata.semester} | `}
              Subject: {metadata.subjectName}
            </p>
            <p>
              Exam: {metadata.examType}
              {metadata.year && ` | Year: ${metadata.year}`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-xs sm:text-sm font-medium text-gray-700 gap-1">
            <span>Max Marks: {metadata.structure.totalMarks}</span>
            <span>Suggested Duration: {defaultDuration}</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-5 text-sm text-gray-600 italic">
          <p className="font-medium mb-1">General Instructions:</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            <li>Attempt all questions.</li>
            <li>Marks are indicated against each question.</li>
            <li>This is an AI-generated practice paper for study purposes only.</li>
          </ul>
        </div>

        {/* Questions */}
        {sections.map((section, si) => (
          <div key={si} className="mb-6">
            <div className="bg-gray-50 rounded-lg px-4 py-2 mb-3">
              <h3 className="font-bold text-gray-800">
                {section.name}
                {section.description && (
                  <span className="font-normal text-sm text-gray-500"> — {section.description}</span>
                )}
              </h3>
              <p className="text-xs text-gray-500">
                {section.questions.length} questions × {section.marksEach} marks = {section.questions.length * section.marksEach} marks
              </p>
            </div>

            <div className="space-y-3 pl-2">
              {section.questions.map((q, qi) => {
                questionCounter++;
                return (
                  <div key={qi} className="flex gap-2">
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">
                        <span className="font-semibold">Q{questionCounter}.</span>{' '}
                        {q.text}
                      </p>
                      {q.subparts && q.subparts.length > 0 && (
                        <div className="ml-6 mt-1 space-y-0.5">
                          {q.subparts.map((sp, spi) => (
                            <p key={spi} className="text-sm text-gray-700">
                              ({String.fromCharCode(97 + spi)}) {sp.text || sp}
                            </p>
                          ))}
                        </div>
                      )}
                      {q.topic && (
                        <p className="text-xs text-gray-400 mt-0.5 italic">Topic: {q.topic}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap font-medium">
                      [{q.marks} marks]
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="border-t border-gray-200 pt-3 mt-6 text-center">
          <p className="text-xs text-gray-400">— End of Paper —</p>
          <p className="text-xs text-gray-400 mt-1">
            AI-generated practice paper by PaperVault | {new Date(generatedAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Generation Note */}
      {paper.generationNote && (
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
          <span className="font-medium">📝 Generation Note:</span> {paper.generationNote}
        </div>
      )}
    </div>
  );
};

export default QuestionPaperPreview;
