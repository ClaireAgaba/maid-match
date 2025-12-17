import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLiveLocationUpdater } from '../hooks/useLiveLocationUpdater';
import { maidAPI, reviewAPI, homeownerAPI } from '../services/api';
import { Users, Search, MapPin, Star, User, CheckCircle2, X, ArrowLeft } from 'lucide-react';

const FindMaids = () => {
  const { user, isHomeowner } = useAuth();
  const navigate = useNavigate();
  const [maids, setMaids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showContact, setShowContact] = useState(false);
  const [showRate, setShowRate] = useState(false);
  const [ratingComment, setRatingComment] = useState('');
  const [ratePunctuality, setRatePunctuality] = useState(0);
  const [rateQuality, setRateQuality] = useState(0);
  const [rateCommunication, setRateCommunication] = useState(0);
  const [rateReliability, setRateReliability] = useState(0);
  const [submittingRate, setSubmittingRate] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submittingClose, setSubmittingClose] = useState(false);
  const [homeownerProfile, setHomeownerProfile] = useState(null);
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // Ensure homeowner live GPS is updated while browsing maids so the
  // backend distance filter has fresh coordinates.
  useLiveLocationUpdater(user);

  // Helper: parse service_pricing (one "Service: value" per line) into a map
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

  const getMediaUrl = (url) => {
    if (!url) return null;
    // If already absolute, return as is
    if (/^https?:\/\//i.test(url)) return url;
    // Otherwise prefix backend origin
    const origin = 'http://localhost:8000';
    return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
  };

  useEffect(() => {
    if (!isHomeowner) {
      navigate('/dashboard');
      return;
    }
    (async () => {
      try {
        setLoading(true);
        // Load homeowner profile to determine payment plan status
        try {
          const hpRes = await homeownerAPI.getMyProfile();
          const hp = hpRes.data;
          setHomeownerProfile(hp);
          if (hp) {
            const now = new Date();
            const exp = hp.subscription_expires_at ? new Date(hp.subscription_expires_at) : null;
            const hasSub = hp.subscription_type && hp.subscription_type !== 'none' && exp && exp > now;
            const active = !!hasSub || !!hp.has_live_in_credit;
            setHasActivePlan(active);
          }
        } catch (e) {
          // non-blocking if profile fails
        }

        const res = await maidAPI.getAvailable();
        setMaids(res.data || []);
      } catch (e) {
        console.error('Failed to load available maids', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [isHomeowner, navigate]);

  // When a maid is selected, fetch full details (to get user id) and load a recent review
  useEffect(() => {
    (async () => {
      if (!selected) { setReviews([]); setReviewsCount(0); setReviewsExpanded(false); return; }
      try {
        // Ensure we have full profile with user id
        const detail = await maidAPI.getById(selected.id);
        const full = detail.data || selected;
        setSelected((prev) => ({ ...prev, ...full }));
        const userId = full?.user?.id;
        if (!userId) { setReviews([]); setReviewsCount(0); return; }
        setLoadingReviews(true);
        // Fetch the most recent one
        const res = await reviewAPI.getAll({ reviewee: userId, ordering: '-created_at', page_size: 1 });
        const data = res.data;
        const items = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
        const count = Array.isArray(data) ? items.length : (data?.count ?? items.length);
        setReviews(items);
        setReviewsCount(count);
      } catch (e) {
        console.error('Failed to load reviews for maid', e);
        setReviews([]);
        setReviewsCount(0);
      } finally {
        setLoadingReviews(false);
      }
    })();
  }, [selected?.id]);

  const filtered = maids.filter((m) => {
    const term = search.toLowerCase();
    return (
      (m.full_name || '').toLowerCase().includes(term) ||
      (m.location || '').toLowerCase().includes(term) ||
      (m.skills || '').toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading available maids...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 safe-top">
      {/* Header */}
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
                <h1 className="text-2xl font-bold text-gray-900">Find Maids</h1>
                <p className="text-sm text-gray-600">Only verified, enabled and currently available maids</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">{filtered.length} Maids</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="card mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, location, or skill..."
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="card text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No maids available</h3>
            <p className="text-gray-600">Try changing your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((m) => (
              <div key={m.id} className="card hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="flex items-start space-x-4 mb-4">
                  <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-gray-200">
                    {m.profile_photo ? (
                      <img src={getMediaUrl(m.profile_photo)} alt={m.full_name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                        <User className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{m.full_name || 'Maid'}</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="inline-flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {m.location || 'Location not set'}
                      </span>
                      {(() => {
                        const d = m.distance_km != null ? Number(m.distance_km) : NaN;
                        if (Number.isNaN(d)) return null;
                        return (
                          <span className="text-xs text-gray-500 px-2 py-0.5 rounded-full bg-gray-100">
                            ~{d.toFixed(1)} km away
                          </span>
                        );
                      })()}
                    </p>
                    <div className="mt-1 text-xs text-gray-600 flex items-center gap-2">
                      <span>{m.gender ? m.gender.charAt(0).toUpperCase() + m.gender.slice(1) : 'Gender: N/A'}</span>
                      <span>•</span>
                      <span>Age: {m.age ?? 'N/A'}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500"></span> Available</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Verified</span>
                      {m.category && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {m.category === 'live_in' ? 'Live-in' : 'Temporary'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="space-y-2 mb-4 text-sm text-gray-700">
                  {m.skills && (
                    <p>
                      <span className="font-medium">Services Offered:</span>{' '}
                      {m.skills
                        .split(',')
                        .map((s) => s.trim())
                        .filter((s) => s.length > 0)
                        .map((service, index, arr) => {
                          const rates = parseServiceRates(m.service_pricing);
                          const rate = rates[service];
                          return (
                            <span key={service}>
                              {service}
                              {rate ? ` (Starting Service fee: ${rate})` : ''}
                              {index < arr.length - 1 ? ', ' : ''}
                            </span>
                          );
                        })}
                    </p>
                  )}
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 text-yellow-500" /> {Number(m.rating || 0).toFixed(1)}</span>
                    {m.experience_years ? <span>{m.experience_years} yrs exp</span> : null}
                  </div>
                  {m.bio && (
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {m.bio}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={() => setSelected(m)} className="w-full btn-primary">View Details</button>
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
              <h2 className="text-xl font-bold text-gray-900">Maid Details</h2>
              <button onClick={() => { setSelected(null); setShowContact(false); }} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-gray-200">
                  {selected.profile_photo ? (
                    <img src={getMediaUrl(selected.profile_photo)} alt={selected.full_name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                      <User className="h-10 w-10 text-gray-500" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selected.full_name}</h3>
                  <p className="text-gray-600 flex items-center gap-2">
                    <span className="inline-flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {selected.location || 'Location not set'}
                    </span>
                    {(() => {
                      const d = selected && selected.distance_km != null ? Number(selected.distance_km) : NaN;
                      if (Number.isNaN(d)) return null;
                      return (
                        <span className="text-xs text-gray-500 px-2 py-0.5 rounded-full bg-gray-100">
                          ~{d.toFixed(1)} km away
                        </span>
                      );
                    })()}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500"></span> Available</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Verified</span>
                    {selected.category && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 inline-flex items-center gap-1">{selected.category === 'live_in' ? 'Live-in' : 'Temporary'}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Experience</p>
                  <p className="font-medium">{selected.experience_years || 0} years</p>
                </div>
                <div>
                  <p className="text-gray-600">Rating</p>
                  <p className="font-medium flex items-center gap-2">
                    <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 text-yellow-500" />{Number(selected.rating || 0).toFixed(1)}</span>
                    {reviewsCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setReviewsExpanded(true);
                          const el = document.getElementById('maid-reviews');
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className="text-xs text-primary-600 hover:text-primary-700 underline"
                      >
                        View Reviews
                      </button>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Jobs Completed</p>
                  <p className="font-medium">{selected.total_jobs_completed || 0}</p>
                </div>
                <div>
                  <p className="text-gray-600">Gender</p>
                  <p className="font-medium">{selected.gender ? selected.gender.charAt(0).toUpperCase() + selected.gender.slice(1) : 'Not set'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Age</p>
                  <p className="font-medium">{selected.age ?? 'Not set'}</p>
                </div>
                {selected.skills && (
                  <div className="col-span-2">
                    <p className="text-gray-600">Services Offered</p>
                    <p className="font-medium">
                      {selected.skills
                        .split(',')
                        .map((s) => s.trim())
                        .filter((s) => s.length > 0)
                        .map((service, index, arr) => {
                          const rates = parseServiceRates(selected.service_pricing);
                          const rate = rates[service];
                          return (
                            <span key={service}>
                              {service}
                              {rate ? ` (Starting Service fee: ${rate})` : ''}
                              {index < arr.length - 1 ? ', ' : ''}
                            </span>
                          );
                        })}
                    </p>
                  </div>
                )}
                {selected.category && (
                  <div className="col-span-2">
                    <p className="text-gray-600">Category</p>
                    <p className="font-medium">{selected.category === 'live_in' ? 'Live-in' : 'Temporary'}</p>
                  </div>
                )}
                {selected.bio && (
                  <div className="col-span-2">
                    <p className="text-gray-600">About</p>
                    <p className="font-medium">{selected.bio}</p>
                  </div>
                )}
              </div>

              {/* Reviews inside modal */}
              <div id="maid-reviews" className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-900 font-medium">Recent Review</p>
                  {reviewsCount > 1 && (
                    <button
                      className="text-sm text-primary-600 hover:text-primary-700"
                      onClick={async () => {
                        if (reviewsExpanded) { setReviewsExpanded(false); return; }
                        try {
                          setLoadingReviews(true);
                          const userId = (selected?.user?.id);
                          const res = await reviewAPI.getAll({ reviewee: userId, ordering: '-created_at' });
                          const data = res.data;
                          const items = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
                          setReviews(items);
                          setReviewsExpanded(true);
                        } catch (e) {
                          console.error('Failed to load more reviews', e);
                        } finally {
                          setLoadingReviews(false);
                        }
                      }}
                    >
                      {reviewsExpanded ? 'Show less' : `View all (${reviewsCount})`}
                    </button>
                  )}
                </div>
                {loadingReviews ? (
                  <div className="text-sm text-gray-500">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                  <div className="text-sm text-gray-500">No reviews yet.</div>
                ) : (
                  <div className="space-y-3">
                    {(reviewsExpanded ? reviews : reviews.slice(0, 1)).map((r) => (
                      <div key={r.id} className="p-3 border rounded-lg bg-gray-50">
                        <div className="flex items-center gap-2 text-yellow-600 text-sm">
                          <Star className="h-4 w-4" />
                          <span className="font-semibold">{r.rating}.0</span>
                        </div>
                        {r.comment && (
                          <p className="mt-1 text-gray-800 text-sm">{r.comment}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          By <span className="font-medium">{r.reviewer?.username || 'Homeowner'}</span>
                          {r.created_at ? ` • ${new Date(r.created_at).toLocaleString()}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {showContact && (
                <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                  <p className="text-gray-600 text-sm mb-1">Contact Number</p>
                  <p className="text-gray-900 font-semibold">{selected.phone_number || 'Not provided'}</p>
                </div>
              )}

              {showPaywall && (
                <div className="mt-2 p-4 border rounded-lg bg-amber-50">
                  <p className="text-sm font-semibold text-amber-900 mb-1">Contact details are locked</p>
                  <p className="text-sm text-amber-800 mb-2">
                    You need an active payment plan for your household before you can view maid contacts. You can
                    still browse profiles and services.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/homeowner-profile-settings')}
                    className="btn-primary text-xs sm:text-sm px-4 py-2"
                  >
                    View payment plans
                  </button>
                </div>
              )}

              {showRate && (
                <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                  <p className="text-gray-900 font-medium mb-2">Rate this maid</p>
                  <div className="space-y-3 mb-3">
                    <div>
                      <p className="text-sm text-gray-700 mb-1">Punctuality</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={`pun-${n}`} type="button" onClick={() => setRatePunctuality(n)} className="focus:outline-none" title={`${n} star${n > 1 ? 's' : ''}`}>
                            <Star className={`h-6 w-6 ${ratePunctuality >= n ? 'text-yellow-500' : 'text-gray-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700 mb-1">Cleanliness / Work Quality</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={`qual-${n}`} type="button" onClick={() => setRateQuality(n)} className="focus:outline-none" title={`${n} star${n > 1 ? 's' : ''}`}>
                            <Star className={`h-6 w-6 ${rateQuality >= n ? 'text-yellow-500' : 'text-gray-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700 mb-1">Communication / Respect</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={`com-${n}`} type="button" onClick={() => setRateCommunication(n)} className="focus:outline-none" title={`${n} star${n > 1 ? 's' : ''}`}>
                            <Star className={`h-6 w-6 ${rateCommunication >= n ? 'text-yellow-500' : 'text-gray-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700 mb-1">Reliability</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={`rel-${n}`} type="button" onClick={() => setRateReliability(n)} className="focus:outline-none" title={`${n} star${n > 1 ? 's' : ''}`}>
                            <Star className={`h-6 w-6 ${rateReliability >= n ? 'text-yellow-500' : 'text-gray-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <textarea
                    rows="3"
                    placeholder="Optional comment"
                    className="input-field w-full mb-3"
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setShowRate(false); setRatePunctuality(0); setRateQuality(0); setRateCommunication(0); setRateReliability(0); setRatingComment(''); }} className="btn-secondary">Cancel</button>
                    <button
                      disabled={submittingRate || [ratePunctuality, rateQuality, rateCommunication, rateReliability].some(v => v === 0)}
                      onClick={async () => {
                        try {
                          setSubmittingRate(true);
                          await reviewAPI.create({
                            maid_id: selected.id,
                            punctuality: ratePunctuality,
                            quality: rateQuality,
                            communication: rateCommunication,
                            reliability: rateReliability,
                            comment: ratingComment
                          });
                          // trigger backend recompute of maid's average rating, then refresh
                          try { await maidAPI.recomputeRating(selected.id); } catch (_) { }
                          // refresh selected maid & list to reflect new average rating
                          try {
                            const fresh = await maidAPI.getById(selected.id);
                            const updated = fresh.data;
                            setSelected((prev) => ({ ...prev, ...updated }));
                            setMaids((prev) => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
                          } catch (e) {
                            // non-blocking if refresh fails
                          }
                          // clear and show a simple ack
                          setShowRate(false);
                          setRatePunctuality(0); setRateQuality(0); setRateCommunication(0); setRateReliability(0);
                          setRatingComment('');
                          alert('Thanks for your rating!');
                        } catch (e) {
                          console.error('Failed to submit rating', e);
                          alert('Failed to submit rating. Please try again.');
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
                <button
                  onClick={() => {
                    setSelected(null);
                    setShowContact(false);
                    setShowRate(false);
                    setShowPaywall(false);
                  }}
                  className="btn-secondary w-full sm:w-auto"
                >
                  Close
                </button>

                {hasActivePlan && (
                  <>
                    <button onClick={() => setShowRate(true)} className="btn-secondary w-full sm:w-auto">
                      Rate Maid
                    </button>
                    <button
                      disabled={submittingClose}
                      onClick={async () => {
                        if (!selected) return;
                        const ok = confirm('Close job with this maid? This will increase her Jobs Completed count.');
                        if (!ok) return;
                        try {
                          setSubmittingClose(true);
                          const res = await maidAPI.closeJob(selected.id);
                          const newCount = res?.data?.total_jobs_completed ?? ((selected.total_jobs_completed || 0) + 1);
                          setSelected(prev => ({ ...prev, total_jobs_completed: newCount }));
                          setMaids(prev => prev.map(m => m.id === selected.id ? { ...m, total_jobs_completed: newCount } : m));
                        } catch (e) {
                          console.error('Failed to close job', e);
                          alert('Failed to close job. Please try again.');
                        } finally {
                          setSubmittingClose(false);
                        }
                      }}
                      className="btn-secondary w-full sm:w-auto"
                    >
                      {submittingClose ? 'Closing...' : 'Close Job'}
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    if (!hasActivePlan) {
                      setShowPaywall(true);
                      setShowContact(false);
                      return;
                    }
                    setShowContact(true);
                    setShowPaywall(false);
                  }}
                  className="btn-primary w-full sm:w-auto"
                >
                  View Maid's Contact
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindMaids;
