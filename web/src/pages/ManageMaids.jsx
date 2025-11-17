import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { maidAPI } from '../services/api';
import { 
  Users, Search, Filter, Eye, Ban, CheckCircle, 
  MapPin, Phone, Mail, Calendar, Briefcase, Star,
  ChevronLeft, ChevronRight, X, Shield, ShieldCheck, UserX, UserCheck
} from 'lucide-react';

const ManageMaids = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [maids, setMaids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedMaid, setSelectedMaid] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchMaids();
  }, [isAdmin, navigate, currentPage, filterStatus]);

  const fetchMaids = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
      };
      
      if (filterStatus !== 'all') {
        params.availability_status = filterStatus === 'available';
      }

      const response = await maidAPI.getAll(params);
      setMaids(response.data.results || response.data);
      setTotalPages(Math.ceil((response.data.count || response.data.length) / 10));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching maids:', error);
      setLoading(false);
    }
  };

  const filteredMaids = maids.filter(maid => {
    const matchesSearch = 
      maid.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maid.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maid.phone_number?.includes(searchTerm) ||
      maid.username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const viewMaidDetails = (maid) => {
    setSelectedMaid(maid);
    setShowModal(true);
  };

  const handleVerify = async (maidId) => {
    const notes = prompt('Enter verification notes (optional):');
    try {
      await maidAPI.verify(maidId, notes || '');
      alert('Maid account verified successfully!');
      fetchMaids();
      if (selectedMaid?.id === maidId) {
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error verifying maid:', error);
      alert('Failed to verify maid account');
    }
  };

  const handleUnverify = async (maidId) => {
    if (!confirm('Are you sure you want to unverify this maid?')) return;
    try {
      await maidAPI.unverify(maidId);
      alert('Maid account unverified');
      fetchMaids();
      if (selectedMaid?.id === maidId) {
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error unverifying maid:', error);
      alert('Failed to unverify maid account');
    }
  };

  const handleDisable = async (maidId) => {
    const reason = prompt('Enter reason for disabling (optional):');
    if (reason === null) return; // User cancelled
    try {
      await maidAPI.disable(maidId, reason || '');
      alert('Maid account disabled');
      fetchMaids();
      if (selectedMaid?.id === maidId) {
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error disabling maid:', error);
      alert('Failed to disable maid account');
    }
  };

  const handleEnable = async (maidId) => {
    if (!confirm('Are you sure you want to enable this maid account?')) return;
    try {
      await maidAPI.enable(maidId);
      alert('Maid account enabled');
      fetchMaids();
      if (selectedMaid?.id === maidId) {
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error enabling maid:', error);
      alert('Failed to enable maid account');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading maids...</p>
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
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Manage Maids</h1>
                <p className="text-sm text-gray-600">View and manage registered maids</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                {filteredMaids.length} Maids
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, location, or phone..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-600" />
                <select
                  className="input-field"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Maids</option>
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Maids Grid */}
        {filteredMaids.length === 0 ? (
          <div className="card text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No maids found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaids.map((maid) => (
              <div key={maid.id} className="card hover:shadow-lg transition-shadow">
                {/* Profile Header */}
                <div className="flex items-start space-x-4 mb-4">
                  <div className="relative flex-shrink-0">
                    <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-gray-200">
                      {maid.profile_photo ? (
                        <img
                          src={maid.profile_photo}
                          alt={maid.full_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                          <Users className="h-8 w-8 text-white" />
                        </div>
                      )}
                    </div>
                    {/* Status Indicator */}
                    <div
                      className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${
                        maid.availability_status ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {maid.full_name || maid.username || 'Unnamed Maid'}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {maid.location || 'Location not set'}
                    </p>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="space-y-2 mb-4">
                  {maid.phone_number && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {maid.phone_number}
                    </div>
                  )}
                  {maid.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {maid.email}
                    </div>
                  )}
                  {maid.experience_years > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                      {maid.experience_years} years experience
                    </div>
                  )}
                  {maid.rating > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Star className="h-4 w-4 mr-2 text-yellow-500" />
                      {maid.rating} ({maid.total_jobs_completed} jobs)
                    </div>
                  )}
                </div>

                {/* Status Badges */}
                <div className="mb-4 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      maid.availability_status
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {maid.availability_status ? 'Available' : 'Unavailable'}
                  </span>
                  
                  {maid.is_verified ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <Shield className="h-3 w-3 mr-1" />
                      Not Verified
                    </span>
                  )}
                  
                  {!maid.is_enabled && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <Ban className="h-3 w-3 mr-1" />
                      Disabled
                    </span>
                  )}
                  
                  {maid.hourly_rate && (
                    <span className="text-sm font-semibold text-gray-900">
                      KSH {maid.hourly_rate}/hr
                    </span>
                  )}
                </div>

                {/* Actions */}
                <button
                  onClick={() => viewMaidDetails(maid)}
                  className="w-full btn-primary flex items-center justify-center"
                >
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
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn-secondary flex items-center disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </button>
            <span className="text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary flex items-center disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        )}
      </div>

      {/* Maid Details Modal */}
      {showModal && selectedMaid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Maid Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Profile Section */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-gray-200">
                    {selectedMaid.profile_photo ? (
                      <img
                        src={selectedMaid.profile_photo}
                        alt={selectedMaid.full_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                        <Users className="h-12 w-12 text-white" />
                      </div>
                    )}
                  </div>
                  <div
                    className={`absolute bottom-0 right-0 h-6 w-6 rounded-full border-4 border-white ${
                      selectedMaid.availability_status ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedMaid.full_name || selectedMaid.username}
                  </h3>
                  <p className="text-gray-600">{selectedMaid.location}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        selectedMaid.availability_status
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {selectedMaid.availability_status ? 'Available' : 'Unavailable'}
                    </span>
                    
                    {selectedMaid.is_verified ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <Shield className="h-3 w-3 mr-1" />
                        Not Verified
                      </span>
                    )}
                    
                    {!selectedMaid.is_enabled && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <Ban className="h-3 w-3 mr-1" />
                        Disabled
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-5 w-5 mr-3 text-gray-400" />
                    {selectedMaid.phone_number || 'Not provided'}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-5 w-5 mr-3 text-gray-400" />
                    {selectedMaid.email || 'Not provided'}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-5 w-5 mr-3 text-gray-400" />
                    {selectedMaid.location || 'Not provided'}
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Professional Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Experience</p>
                    <p className="font-medium">{selectedMaid.experience_years} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Hourly Rate</p>
                    <p className="font-medium">KSH {selectedMaid.hourly_rate || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Rating</p>
                    <p className="font-medium flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      {selectedMaid.rating || '0.0'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Jobs Completed</p>
                    <p className="font-medium">{selectedMaid.total_jobs_completed || 0}</p>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {selectedMaid.bio && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Bio</h4>
                  <p className="text-gray-600">{selectedMaid.bio}</p>
                </div>
              )}

              {/* Skills */}
              {selectedMaid.skills && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Skills</h4>
                  <p className="text-gray-600">{selectedMaid.skills}</p>
                </div>
              )}

              {/* Registration Date */}
              <div>
                <p className="text-sm text-gray-600">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Registered: {new Date(selectedMaid.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t px-6 py-4">
              <div className="flex flex-col space-y-3">
                {/* Admin Actions */}
                <div className="flex flex-wrap gap-2">
                  {selectedMaid.is_verified ? (
                    <button
                      onClick={() => handleUnverify(selectedMaid.id)}
                      className="btn-secondary flex items-center"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Unverify Account
                    </button>
                  ) : (
                    <button
                      onClick={() => handleVerify(selectedMaid.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Verify Account
                    </button>
                  )}
                  
                  {selectedMaid.is_enabled ? (
                    <button
                      onClick={() => handleDisable(selectedMaid.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Disable Account
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEnable(selectedMaid.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Enable Account
                    </button>
                  )}
                </div>
                
                {/* Close Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowModal(false)}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageMaids;
