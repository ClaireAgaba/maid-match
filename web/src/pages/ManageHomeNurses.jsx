import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeNursingAPI } from '../services/api';
import { Users, Search, Filter, Eye, MapPin, Briefcase, Calendar, X, ChevronLeft, ChevronRight, Stethoscope, Shield, ShieldCheck, UserX, UserCheck } from 'lucide-react';

const ManageHomeNurses = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [acting, setActing] = useState(false);

  // Helper: parse service_pricing (one "Category: value" per line) into a map
  const parseServiceRates = (service_pricing) => {
    if (!service_pricing) return {};
    const raw = String(service_pricing || '');
    const lines = raw.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const map = {};
    lines.forEach((line) => {
      const idx = line.indexOf(':');
      if (idx !== -1) {
        const name = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        if (name) map[name] = value;
      }
    });
    return map;
  };

  useEffect(() => {
    if (!isAdmin) { navigate('/dashboard'); return; }
    fetchNurses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, navigate, currentPage, filterLevel, searchTerm]);

  const fetchNurses = async () => {
    try {
      setLoading(true);
      const params = { page: currentPage };
      if (filterLevel !== 'all') params.level = filterLevel;
      if (searchTerm) params.q = searchTerm;
      const res = await homeNursingAPI.adminList(params);
      const results = res.data.results || res.data;
      setNurses(results);
      const count = res.data.count ?? results.length;
      setTotalPages(Math.max(1, Math.ceil(count / 10)));
    } catch (e) {
      console.error('Error fetching nurses', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading nurses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-gray-900">← Back</button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Manage Home Nurses</h1>
                <p className="text-sm text-gray-600">View and manage registered home nurses</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                {nurses.length} Nurses
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by username or location..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => { setCurrentPage(1); setSearchTerm(e.target.value); }}
              />
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-600" />
                <select
                  className="input-field"
                  value={filterLevel}
                  onChange={(e) => { setCurrentPage(1); setFilterLevel(e.target.value); }}
                >
                  <option value="all">All Levels</option>
                  <option value="enrolled">Enrolled Nurse</option>
                  <option value="registered">Registered Nurse</option>
                  <option value="midwife">Midwife</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Nurses Grid */}
        {nurses.length === 0 ? (
          <div className="card text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No nurses found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nurses.map((n) => (
              <div key={n.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4 mb-4">
                  {/* Placeholder avatar */}
                  <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-gray-200 flex items-center justify-center bg-gradient-to-br from-pink-400 to-purple-600">
                    <Stethoscope className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{n.username || 'Nurse'}</h3>
                    <p className="text-sm text-gray-600 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {n.location || 'Location not set'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {n.nursing_level && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                      Level: {n.nursing_level}
                    </div>
                  )}
                  <div className="text-sm text-gray-600">
                    {typeof n.age === 'number' && <>Age: {n.age} yrs</>}
                    {n.gender && (
                      <>
                        {typeof n.age === 'number' ? ' • ' : ''}
                        {n.gender.charAt(0).toUpperCase() + n.gender.slice(1)}
                      </>
                    )}
                  </div>
                  {n.years_of_experience > 0 && (
                    <div className="text-sm text-gray-600">Experience: {n.years_of_experience} yrs</div>
                  )}
                </div>

                {/* Services chips */}
                {Array.isArray(n.services) && n.services.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {n.services.slice(0, 6).map((s) => (
                      <span key={s.id} className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs">{s.name}</span>
                    ))}
                    {n.services.length > 6 && (
                      <span className="text-xs text-gray-600">+{n.services.length - 6} more</span>
                    )}
                  </div>
                )}

                <button onClick={() => { setSelected(n); setShowModal(true); }} className="w-full btn-primary flex items-center justify-center">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center space-x-4">
            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="btn-secondary flex items-center disabled:opacity-50">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </button>
            <span className="text-gray-600">Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="btn-secondary flex items-center disabled:opacity-50">
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showModal && selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Nurse Details</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center space-x-4">
                <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-gray-200 flex items-center justify-center bg-gradient-to-br from-pink-400 to-purple-600">
                  <Stethoscope className="h-12 w-12 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selected.username}</h3>
                  <p className="text-gray-600">{selected.location || 'Location not set'}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-700">
                    {selected.nursing_level && (<span>Level: {selected.nursing_level}</span>)}
                    {typeof selected.age === 'number' && (<span>Age: {selected.age} yrs</span>)}
                    {selected.gender && (
                      <span>{selected.gender.charAt(0).toUpperCase() + selected.gender.slice(1)}</span>
                    )}
                    {selected.years_of_experience > 0 && (<span>Experience: {selected.years_of_experience} yrs</span>)}
                    {selected.date_of_birth && (<span>DOB: {selected.date_of_birth}</span>)}
                  </div>
                </div>
              </div>

              {(selected.id_document || selected.nursing_certificate) && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Documents</h4>
                  <div className="space-y-1 text-sm">
                    {selected.id_document && (
                      <div>
                        <span className="text-gray-700 mr-2">ID Document:</span>
                        <a
                          href={selected.id_document}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 underline"
                        >
                          View
                        </a>
                      </div>
                    )}
                    {selected.nursing_certificate && (
                      <div>
                        <span className="text-gray-700 mr-2">Nursing certificate / diploma:</span>
                        <a
                          href={selected.nursing_certificate}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 underline"
                        >
                          View
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {Array.isArray(selected.services) && selected.services.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Services</h4>
                  <div className="flex flex-wrap gap-2">
                    {selected.services.map((s) => {
                      const rates = parseServiceRates(selected.service_pricing);
                      const rate = rates[s.name];
                      return (
                        <span
                          key={s.id}
                          className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                        >
                          {s.name}
                          {rate ? ` (Starting Service fee: ${rate})` : ''}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">
                  <Calendar className="h-4 w-4 inline mr-1" /> Registered: {new Date(selected.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="border-t px-6 py-4 flex justify-end">
              <div className="flex flex-wrap gap-2 w-full justify-between items-center">
                <div className="flex flex-wrap gap-2">
                  {selected?.is_verified ? (
                    <button
                      disabled={acting}
                      onClick={async ()=>{ try{ setActing(true); await homeNursingAPI.adminUnverify(selected.id); await fetchNurses(); setShowModal(false);} finally{ setActing(false);} }}
                      className="btn-secondary flex items-center"
                    >
                      <Shield className="h-4 w-4 mr-2" /> Unverify
                    </button>
                  ) : (
                    <button
                      disabled={acting}
                      onClick={async ()=>{ try{ setActing(true); await homeNursingAPI.adminVerify(selected.id); await fetchNurses(); setShowModal(false);} finally{ setActing(false);} }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <ShieldCheck className="h-4 w-4 mr-2" /> Verify
                    </button>
                  )}
                  {selected?.user_active ? (
                    <button
                      disabled={acting}
                      onClick={async ()=>{ const reason = prompt('Reason (optional):') ?? ''; try{ setActing(true); await homeNursingAPI.adminDisable(selected.id, { reason }); await fetchNurses(); setShowModal(false);} finally{ setActing(false);} }}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                    >
                      <UserX className="h-4 w-4 mr-2" /> Disable
                    </button>
                  ) : (
                    <button
                      disabled={acting}
                      onClick={async ()=>{ try{ setActing(true); await homeNursingAPI.adminEnable(selected.id); await fetchNurses(); setShowModal(false);} finally{ setActing(false);} }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                      <UserCheck className="h-4 w-4 mr-2" /> Enable
                    </button>
                  )}
                </div>
                <button onClick={() => setShowModal(false)} className="btn-secondary">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageHomeNurses;
