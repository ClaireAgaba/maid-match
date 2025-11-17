import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeownerAPI } from '../services/api';
import { 
  Users, Search, Filter, Eye, Home as HomeIcon,
  MapPin, Phone, Mail, Calendar, X
} from 'lucide-react';

const ManageHomeowners = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [homeowners, setHomeowners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHomeowner, setSelectedHomeowner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchHomeowners();
  }, [isAdmin, navigate, currentPage]);

  const fetchHomeowners = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
      };

      const response = await homeownerAPI.getAll(params);
      setHomeowners(response.data.results || response.data);
      setTotalPages(Math.ceil((response.data.count || response.data.length) / 10));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching homeowners:', error);
      setLoading(false);
    }
  };

  const filteredHomeowners = homeowners.filter(homeowner => {
    const matchesSearch = 
      homeowner.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      homeowner.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      homeowner.user?.phone_number?.includes(searchTerm) ||
      homeowner.user?.address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const viewHomeownerDetails = (homeowner) => {
    setSelectedHomeowner(homeowner);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading homeowners...</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Manage Homeowners</h1>
                <p className="text-sm text-gray-600">View and manage registered homeowners</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                {filteredHomeowners.length} Homeowners
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, username, phone, or address..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Homeowners Grid */}
        {filteredHomeowners.length === 0 ? (
          <div className="card text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No homeowners found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHomeowners.map((homeowner) => (
              <div key={homeowner.id} className="card hover:shadow-lg transition-shadow">
                {/* Profile Header */}
                <div className="flex items-start space-x-4 mb-4">
                  <div className="relative flex-shrink-0">
                    <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-gray-200">
                      {homeowner.user?.profile_picture ? (
                        <img
                          src={homeowner.user.profile_picture}
                          alt={homeowner.user.full_name || homeowner.user.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                          <HomeIcon className="h-8 w-8 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {homeowner.user?.full_name || homeowner.user?.username || 'Unnamed Homeowner'}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {homeowner.user?.address || 'Location not set'}
                    </p>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="space-y-2 mb-4">
                  {homeowner.user?.phone_number && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {homeowner.user.phone_number}
                    </div>
                  )}
                  {homeowner.user?.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {homeowner.user.email}
                    </div>
                  )}
                  {homeowner.home_type && (
                    <div className="flex items-center text-sm text-gray-600">
                      <HomeIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {homeowner.home_type.charAt(0).toUpperCase() + homeowner.home_type.slice(1)} • {homeowner.number_of_rooms} rooms
                    </div>
                  )}
                </div>

                {/* Actions */}
                <button
                  onClick={() => viewHomeownerDetails(homeowner)}
                  className="w-full btn-primary flex items-center justify-center"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Homeowner Details Modal */}
      {showModal && selectedHomeowner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Homeowner Details</h2>
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
                    {selectedHomeowner.user?.profile_picture ? (
                      <img
                        src={selectedHomeowner.user.profile_picture}
                        alt={selectedHomeowner.user.full_name || selectedHomeowner.user.username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                        <HomeIcon className="h-12 w-12 text-white" />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedHomeowner.user?.full_name || selectedHomeowner.user?.username}
                  </h3>
                  <p className="text-gray-600">{selectedHomeowner.user?.address}</p>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-5 w-5 mr-3 text-gray-400" />
                    {selectedHomeowner.user?.phone_number || 'Not provided'}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-5 w-5 mr-3 text-gray-400" />
                    {selectedHomeowner.user?.email || 'Not provided'}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-5 w-5 mr-3 text-gray-400" />
                    {selectedHomeowner.user?.address || 'Not provided'}
                  </div>
                </div>
              </div>

              {/* Home Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Home Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Home Type</p>
                    <p className="font-medium">{selectedHomeowner.home_type?.charAt(0).toUpperCase() + selectedHomeowner.home_type?.slice(1) || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Number of Rooms</p>
                    <p className="font-medium">{selectedHomeowner.number_of_rooms || 'Not set'}</p>
                  </div>
                  {selectedHomeowner.home_address && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Home Address</p>
                      <p className="font-medium">{selectedHomeowner.home_address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Registration Date */}
              <div>
                <p className="text-sm text-gray-600">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Registered: {new Date(selectedHomeowner.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageHomeowners;
