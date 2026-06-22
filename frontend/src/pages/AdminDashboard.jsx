import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPendingPapers, approvePaper, rejectPaper, deletePaper, getViewUrl } from '../services/api';

const AdminDashboard = () => {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const navigate = useNavigate();

  const fetchPapers = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await getPendingPapers();
      setPapers(data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }
      setError('Failed to load papers.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, []);

  const handleApprove = async (id) => {
    try {
      setActionLoading(id);
      await approvePaper(id);
      setPapers(papers.filter((p) => p._id !== id));
    } catch (err) {
      alert('Failed to approve paper.');
      console.error(err);
    } finally {
      setActionLoading('');
    }
  };

  const handleReject = async (id) => {
    try {
      setActionLoading(id);
      await rejectPaper(id);
      setPapers(papers.filter((p) => p._id !== id));
    } catch (err) {
      alert('Failed to reject paper.');
      console.error(err);
    } finally {
      setActionLoading('');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this paper?')) return;

    try {
      setActionLoading(id);
      await deletePaper(id);
      setPapers(papers.filter((p) => p._id !== id));
    } catch (err) {
      alert('Failed to delete paper.');
      console.error(err);
    } finally {
      setActionLoading('');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
      <p className="text-gray-600 mb-6">Review and manage pending paper submissions.</p>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading pending papers...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : papers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No pending papers to review. 🎉</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{papers.length} pending paper(s)</p>

          {/* Mobile cards / Desktop table */}
          <div className="space-y-4">
            {papers.map((paper) => (
              <div
                key={paper._id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-lg">{paper.subjectName}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 text-sm text-gray-600">
                      <p><span className="font-medium">Dept:</span> {paper.department}</p>
                      <p><span className="font-medium">Semester:</span> {paper.semester}</p>
                      <p><span className="font-medium">Exam:</span> {paper.examType}</p>
                      <p><span className="font-medium">Year:</span> {paper.year}</p>
                      <p><span className="font-medium">File:</span> {paper.pdfName}</p>
                      <p><span className="font-medium">Uploaded:</span> {formatDate(paper.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 md:flex-col md:min-w-[120px]">
                    <a
                      href={getViewUrl(paper._id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-center bg-blue-100 text-blue-700 px-3 py-1.5 rounded text-sm hover:bg-blue-200"
                    >
                      View PDF
                    </a>
                    <button
                      onClick={() => handleApprove(paper._id)}
                      disabled={actionLoading === paper._id}
                      className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 disabled:bg-gray-400"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(paper._id)}
                      disabled={actionLoading === paper._id}
                      className="bg-yellow-500 text-white px-3 py-1.5 rounded text-sm hover:bg-yellow-600 disabled:bg-gray-400"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleDelete(paper._id)}
                      disabled={actionLoading === paper._id}
                      className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 disabled:bg-gray-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
