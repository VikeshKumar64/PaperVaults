import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getPendingPapers, 
  getAllPapers, 
  approvePaper, 
  rejectPaper, 
  updatePaper, 
  deletePaper, 
  getViewUrl 
} from '../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'all'
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  
  // Edit State
  const [editingPaper, setEditingPaper] = useState(null);
  const [editForm, setEditForm] = useState({
    department: '',
    subjectName: '',
    semester: 1,
    examType: 'MST1',
    year: new Date().getFullYear(),
  });

  const navigate = useNavigate();

  const fetchPapers = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = activeTab === 'pending' ? await getPendingPapers() : await getAllPapers();
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
  }, [activeTab]);

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

  const startEdit = (paper) => {
    setEditingPaper(paper._id);
    setEditForm({
      department: paper.department,
      subjectName: paper.subjectName,
      semester: paper.semester,
      examType: paper.examType,
      year: paper.year,
    });
  };

  const cancelEdit = () => {
    setEditingPaper(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: name === 'semester' || name === 'year' ? Number(value) : value,
    });
  };

  const handleUpdate = async (e, id) => {
    e.preventDefault();
    try {
      setActionLoading(id);
      const { data } = await updatePaper(id, editForm);
      setPapers(papers.map((p) => (p._id === id ? data.paper : p)));
      setEditingPaper(null);
      alert('Paper updated successfully.');
    } catch (err) {
      alert('Failed to update paper.');
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded">Approved</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded">Rejected</span>;
      default:
        return <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded">Pending Approval</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
      <p className="text-gray-600 mb-6 font-light">Review submissions and manage the PaperVault database.</p>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => { setActiveTab('pending'); setEditingPaper(null); }}
          className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors duration-200 ${
            activeTab === 'pending'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending Approval ({activeTab === 'pending' ? papers.length : '...'})
        </button>
        <button
          onClick={() => { setActiveTab('all'); setEditingPaper(null); }}
          className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors duration-200 ${
            activeTab === 'all'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Manage Database ({activeTab === 'all' ? papers.length : '...'})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading papers...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : papers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No papers found in this section. 🎉</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{papers.length} paper(s) found</p>

          {/* Cards List */}
          <div className="space-y-4">
            {papers.map((paper) => (
              <div
                key={paper._id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
              >
                {editingPaper === paper._id ? (
                  /* Edit Mode Form */
                  <form onSubmit={(e) => handleUpdate(e, paper._id)} className="space-y-4">
                    <h3 className="font-semibold text-blue-600 text-md">Edit Paper Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Subject Name</label>
                        <input
                          type="text"
                          name="subjectName"
                          value={editForm.subjectName}
                          onChange={handleEditChange}
                          required
                          className="w-full border border-gray-300 rounded p-1.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Department</label>
                        <select
                          name="department"
                          value={editForm.department}
                          onChange={handleEditChange}
                          required
                          className="w-full border border-gray-300 rounded p-1.5 text-sm"
                        >
                          <option value="CSE">CSE</option>
                          <option value="ECE">ECE</option>
                          <option value="ME">ME</option>
                          <option value="CE">CE</option>
                          <option value="EE">EE</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Semester</label>
                        <input
                          type="number"
                          name="semester"
                          value={editForm.semester}
                          onChange={handleEditChange}
                          min={1}
                          max={8}
                          required
                          className="w-full border border-gray-300 rounded p-1.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Exam Type</label>
                        <select
                          name="examType"
                          value={editForm.examType}
                          onChange={handleEditChange}
                          required
                          className="w-full border border-gray-300 rounded p-1.5 text-sm"
                        >
                          <option value="MST1">MST1</option>
                          <option value="MST2">MST2</option>
                          <option value="EST">EST</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Year</label>
                        <input
                          type="number"
                          name="year"
                          value={editForm.year}
                          onChange={handleEditChange}
                          required
                          className="w-full border border-gray-300 rounded p-1.5 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end mt-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={actionLoading === paper._id}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Standard View Mode */
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-800 text-lg">{paper.subjectName}</h3>
                        {activeTab === 'all' && getStatusBadge(paper.status)}
                      </div>
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
                        className="text-center bg-blue-100 text-blue-700 px-3 py-1.5 rounded text-sm hover:bg-blue-200 font-medium"
                      >
                        View PDF
                      </a>
                      {activeTab === 'pending' ? (
                        <>
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
                        </>
                      ) : (
                        <button
                          onClick={() => startEdit(paper)}
                          disabled={actionLoading === paper._id}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          Update / Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(paper._id)}
                        disabled={actionLoading === paper._id}
                        className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 disabled:bg-gray-400"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;

