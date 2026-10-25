import { useState, useRef } from 'react';
import ExamPaperForm from '../components/ExamPaperForm';
import QuestionPaperPreview from '../components/QuestionPaperPreview';
import { generatePaper } from '../services/api';

const ExamPaperGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [lastConfig, setLastConfig] = useState(null);
  const previewRef = useRef(null);

  const handleGenerate = async (formData) => {
    setLoading(true);
    setError('');
    setResult(null);
    setLastConfig(formData);

    try {
      const { data } = await generatePaper({
        degree: formData.degree,
        department: formData.department,
        semester: formData.semester,
        subjectName: formData.subjectName,
        examType: formData.examType,
        year: formData.year,
        paperTitle: formData.paperTitle,
        institutionName: formData.institutionName,
        syllabus: formData.syllabus,
        provider: formData.provider,
        apiKey: formData.apiKey,
      });

      if (data.success) {
        setResult(data);
        // Scroll to preview
        setTimeout(() => {
          previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
      } else {
        setError(data.message || 'Generation failed. Please try again.');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'An unexpected error occurred. Please check your API key and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (lastConfig) {
      setResult(null);
      // Scroll back to form top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            🎯 AI Exam Paper Generator
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Generate university-style practice question papers using AI. Select your exam details,
            provide your syllabus, and let AI create a formatted paper based on previous-year patterns.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs px-3 py-1.5 rounded-full border border-amber-200">
            ⚠️ AI-generated papers are for practice only — not official examinations
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700" id="generation-error">
            <p className="font-medium mb-1">❌ Generation Failed</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        {!result && (
          <ExamPaperForm onSubmit={handleGenerate} loading={loading} />
        )}

        {/* Loading State */}
        {loading && (
          <div className="mt-8 text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Generating Your Practice Paper...</p>
                <p className="text-sm text-gray-500 mt-1">
                  Analyzing previous papers, processing syllabus, and generating questions.
                </p>
                <p className="text-xs text-gray-400 mt-2">This typically takes 15-30 seconds</p>
              </div>
            </div>
          </div>
        )}

        {/* Generated Result */}
        {result && (
          <div ref={previewRef}>
            <QuestionPaperPreview data={result} onRegenerate={handleRegenerate} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamPaperGenerator;
