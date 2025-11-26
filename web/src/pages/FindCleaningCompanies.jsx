import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cleaningCompanyAPI, reviewAPI } from '../services/api';
import { Users, Search, MapPin, ShieldCheck, X, Star, Mail, Phone, ArrowLeft } from 'lucide-react';

const FindCleaningCompanies = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showContact, setShowContact] = useState(false);
  const [showRate, setShowRate] = useState(false);
  const [ratePunctuality, setRatePunctuality] = useState(0);
  const [rateQuality, setRateQuality] = useState(0);
  const [rateCommunication, setRateCommunication] = useState(0);
  const [rateReliability, setRateReliability] = useState(0);
  const [submittingRate, setSubmittingRate] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await cleaningCompanyAPI.browse({ q: search || undefined });
        const data = res.data?.results || res.data || [];
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to load companies', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [search]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 text-gray-700 hover:text-primary-600 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-white shadow-sm border border-gray-200 group-hover:border-primary-300 group-hover:shadow transition-all">
                  <ArrowLeft className="h-4 w-4" />
                </div>
                <span className="font-medium"></span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Find Cleaning Companies</h1>
              </div>
            </div>
            <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">{items.length} Companies</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by company or location..."
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : items.length === 0 ? (
          <div className="card text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
            <p className="text-gray-600">Try changing your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((c) => (
              <div key={c.id} className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => { setSelected(c); setShowContact(false); setShowRate(false); }}>
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-gray-200">
                    {c.display_photo_url ? (
                      <img src={c.display_photo_url} alt={c.company_name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                        <Users className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{c.company_name}</h3>
                    <p className="text-sm text-gray-600 flex items-center"><MapPin className="h-3 w-3 mr-1" />{c.location || 'Location not set'}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Verified</span>
                      {Array.isArray(c.services) && c.services.slice(0, 3).map(s => (
                        <span key={s.id} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 text-xs">{s.name}</span>
                      ))}
                      {Array.isArray(c.services) && c.services.length > 3 && (
                        <span className="text-xs text-gray-600">+{c.services.length - 3} more</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto sm:rounded-lg sm:max-w-xl">
            <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Company Details</h2>
              <button onClick={() => { setSelected(null); setShowContact(false); setShowRate(false); }} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-gray-200">
                  {selected.display_photo_url ? (
                    <img src={selected.display_photo_url} alt={selected.company_name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                      <Users className="h-10 w-10 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selected.company_name}</h3>
                  <p className="text-gray-600 flex items-center"><MapPin className="h-4 w-4 mr-1" />{selected.location || 'Location not set'}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Verified</span>
                  </div>
                </div>
              </div>

              {Array.isArray(selected.services) && selected.services.length > 0 && (
                <div>
                  <p className="text-gray-900 font-medium mb-1">Services</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.services.map((s) => (
                      <span key={s.id} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">{s.name}</span>
                    ))}
                  </div>
                </div>
              )}

              {showContact && (
                <div className="p-4 border rounded-lg bg-gray-50">
                  <p className="text-gray-600 text-sm mb-1">Contact</p>
                  <div className="text-gray-900 font-semibold flex items-center gap-2"><Phone className="h-4 w-4" /> {selected.phone_number || 'Not provided'}</div>
                  <div className="text-gray-900 font-semibold flex items-center gap-2 mt-1"><Mail className="h-4 w-4" /> {selected.email || 'Not provided'}</div>
                </div>
              )}

              {showRate && (
                <div className="p-4 border rounded-lg bg-gray-50">
                  <p className="text-gray-900 font-medium mb-2">Rate this company</p>
                  <div className="space-y-3 mb-3">
                    {[{ k: 'punctuality', label: 'Punctuality', val: ratePunctuality, set: setRatePunctuality },
                    { k: 'quality', label: 'Service Quality', val: rateQuality, set: setRateQuality },
                    { k: 'communication', label: 'Communication', val: rateCommunication, set: setRateCommunication },
                    { k: 'reliability', label: 'Reliability', val: rateReliability, set: setRateReliability }].map(item => (
                      <div key={item.k}>
                        <p className="text-sm text-gray-700 mb-1">{item.label}</p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(n => (
                            <button key={`${item.k}-${n}`} type="button" onClick={() => item.set(n)} className="focus:outline-none" title={`${n} star${n > 1 ? 's' : ''}`}>
                              <Star className={`h-6 w-6 ${item.val >= n ? 'text-yellow-500' : 'text-gray-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setShowRate(false); setRatePunctuality(0); setRateQuality(0); setRateCommunication(0); setRateReliability(0); }} className="btn-secondary">Cancel</button>
                    <button
                      disabled={submittingRate || [ratePunctuality, rateQuality, rateCommunication, rateReliability].some(v => v === 0)}
                      onClick={async () => {
                        try {
                          setSubmittingRate(true);
                          await reviewAPI.create({
                            reviewee: selected.user_id,
                            punctuality: ratePunctuality,
                            quality: rateQuality,
                            communication: rateCommunication,
                            reliability: rateReliability,
                            comment: ''
                          });
                          setShowRate(false);
                          setRatePunctuality(0); setRateQuality(0); setRateCommunication(0); setRateReliability(0);
                          alert('Thanks for rating the company!');
                        } catch (e) {
                          console.error('Failed to submit rating', e);
                          alert('Failed to submit rating.');
                        } finally {
                          setSubmittingRate(false);
                        }
                      }}
                      className="btn-primary"
                    >
                      {submittingRate ? 'Submitting...' : 'Submit Rating'}
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row justify-end gap-2">
                <button onClick={() => { setSelected(null); setShowContact(false); setShowRate(false); }} className="btn-secondary w-full sm:w-auto">Close</button>
                <button onClick={() => setShowRate(true)} className="btn-secondary w-full sm:w-auto">Rate Company</button>
                <button onClick={() => setShowContact(true)} className="btn-primary w-full sm:w-auto">View Contact</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindCleaningCompanies;
