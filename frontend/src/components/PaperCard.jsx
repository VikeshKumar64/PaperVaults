import { getViewUrl, getDownloadUrl } from '../services/api';

const PaperCard = ({ paper }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{paper.subjectName}</h3>
      <div className="space-y-1 text-sm text-gray-600 mb-4">
        <p>
          <span className="font-medium">Department:</span> {paper.department}
        </p>
        <p>
          <span className="font-medium">Semester:</span> {paper.semester}
        </p>
        <p>
          <span className="font-medium">Year:</span> {paper.year}
        </p>
        <p>
          <span className="font-medium">Exam:</span>{' '}
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
            {paper.examType}
          </span>
        </p>
      </div>
      <div className="flex gap-2">
        <a
          href={getViewUrl(paper._id)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700"
        >
          View PDF
        </a>
        <a
          href={getDownloadUrl(paper._id)}
          className="flex-1 text-center bg-gray-600 text-white py-2 px-3 rounded text-sm hover:bg-gray-700"
        >
          Download
        </a>
      </div>
    </div>
  );
};

export default PaperCard;
