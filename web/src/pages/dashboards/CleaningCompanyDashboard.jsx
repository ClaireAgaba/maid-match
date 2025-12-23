import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { applicationAPI, cleaningCompanyAPI, jobAPI, paymentAPI } from '../../services/api';
import { Briefcase, Eye, FileText, HelpCircle, Settings, ShieldCheck, Shield, Star, Users } from 'lucide-react';
import Dashboard from '../Dashboard';

export const CleaningCompanyDashboardV2 = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isCleaningCompany = user?.user_type === 'cleaning_company';

  const [companyProfile, setCompanyProfile] = useState(null);

  const localGalleryKey = useMemo(() => (user?.username ? `company_gallery_${user.username}` : null), [user?.username]);
  const [companyGallery, setCompanyGallery] = useState([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const [showCompanyJobsModal, setShowCompanyJobsModal] = useState(false);
  const [companyJobs, setCompanyJobs] = useState([]);
  const [companyJobsLoading, setCompanyJobsLoading] = useState(false);

  const [showCompanyPaymentModal, setShowCompanyPaymentModal] = useState(false);
  const [companyPaymentPlan, setCompanyPaymentPlan] = useState('monthly');
  const [companyPaymentNetwork, setCompanyPaymentNetwork] = useState('mtn');
  const [companyPaymentPhone, setCompanyPaymentPhone] = useState('');
  const [companyPaymentSubmitting, setCompanyPaymentSubmitting] = useState(false);
  const [companyPaymentMessage, setCompanyPaymentMessage] = useState('');

  useEffect(() => {
    if (!isCleaningCompany) return;

    const fetchData = async () => {
      try {
        const me = await cleaningCompanyAPI.me();
        setCompanyProfile(me.data);
      } catch {
        // ignore
      }

      try {
        if (localGalleryKey) {
          const raw = localStorage.getItem(localGalleryKey);
          if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) setCompanyGallery(arr);
          }
        }
      } catch {
        // ignore
      }
    };

    fetchData();
  }, [isCleaningCompany, localGalleryKey]);

  const companyServiceRates = (() => {
    if (!isCleaningCompany || !companyProfile || !companyProfile.service_pricing) return {};
    const raw = String(companyProfile.service_pricing || '');
    const lines = raw
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
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
  })();

  const loadCompanyJobs = async () => {
    if (!isCleaningCompany) return;
    try {
      setCompanyJobsLoading(true);
      const resp = await jobAPI.getAll({ ordering: '-created_at' });
      const data = resp.data?.results || resp.data || [];
      let jobsArray = Array.isArray(data) ? data : [];
      jobsArray = jobsArray.filter((job) => {
        const title = (job.title || '').toLowerCase();
        return title.startsWith('cleaning company');
      });
      setCompanyJobs(jobsArray);
    } catch (e) {
      console.error('Failed to load jobs for cleaning company browse view', e);
    } finally {
      setCompanyJobsLoading(false);
    }
  };

  const headerNotifications = (() => {
    const items = [];
    if (isCleaningCompany && companyProfile) {
      if (!companyProfile.has_active_subscription) {
        items.push({
          id: 'company-no-plan',
          kind: 'billing',
          title: 'Company service payment needed',
          body: 'Pay the company service plan fee so you can show interest in homeowner job requests.',
          onClick: () => {
            setShowCompanyPaymentModal(true);
          },
        });
      }
      if (companyProfile.is_paused) {
        items.push({
          id: 'company-paused',
          kind: 'status',
          title: 'You are taking a break',
          body: 'Resume your company so you can see and apply for jobs again.',
          onClick: () => navigate('/company/profile'),
        });
      }
    }
    return items;
  })();

  if (!isCleaningCompany) return null;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar userProfile={companyProfile} notifications={headerNotifications} />

      <div className="relative bg-white border-b border-gray-100 overflow-hidden">
        <div className="absolute inset-0 bg-brand-gradient-soft opacity-30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Hello,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
                  {user?.username}
                </span>
                !
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl">
                {isCleaningCompany && 'Manage your company profile and showcase your work.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isCleaningCompany && showCompanyPaymentModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Pay Company Service Plan Fee</h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    setShowCompanyPaymentModal(false);
                    setCompanyPaymentMessage('');
                  }}
                >
                  ✕
                </button>
              </div>
              <div className="px-5 py-4 space-y-4">
                <p className="text-sm text-gray-600">
                  Choose a service plan fee and pay via Mobile Money. Paying this service fee lets your company show
                  interest in homeowner job requests.
                </p>
                {companyPaymentMessage && (
                  <p className="text-sm bg-red-50 border border-red-200 text-red-800 rounded-lg px-3 py-2">
                    {companyPaymentMessage}
                  </p>
                )}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Plan</label>
                    <div className="flex items-center gap-3 text-sm">
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="company-plan"
                          value="monthly"
                          checked={companyPaymentPlan === 'monthly'}
                          onChange={() => setCompanyPaymentPlan('monthly')}
                        />
                        <span>
                          Monthly service plan fee — <span className="font-semibold">UGX 30,000</span>
                        </span>
                      </label>
                      <label
                        className="flex items-center gap-1 opacity-60 cursor-not-allowed"
                        title="Annual plan coming soon"
                      >
                        <input type="radio" name="company-plan" value="annual" disabled />
                        <span>
                          Annual service plan fee — <span className="font-semibold">UGX 342,000</span> (coming soon)
                        </span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Network</label>
                    <select
                      className="input-field text-sm"
                      value={companyPaymentNetwork}
                      onChange={(e) => setCompanyPaymentNetwork(e.target.value)}
                    >
                      <option value="mtn">MTN Mobile Money</option>
                      <option value="airtel">Airtel Money</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Mobile Money number</label>
                    <input
                      type="tel"
                      className="input-field text-sm"
                      value={companyPaymentPhone}
                      onChange={(e) => setCompanyPaymentPhone(e.target.value)}
                      placeholder="e.g. 0771234567"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={companyPaymentSubmitting}
                  className="w-full btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  onClick={async () => {
                    if (!companyPaymentPhone.trim()) {
                      setCompanyPaymentMessage('Please enter the mobile number you are paying from.');
                      return;
                    }
                    setCompanyPaymentSubmitting(true);
                    setCompanyPaymentMessage('');
                    try {
                      const res = await paymentAPI.initiateCompanyPayment({
                        plan: companyPaymentPlan,
                        network: companyPaymentNetwork,
                        phone_number: companyPaymentPhone.trim(),
                      });
                      const msg =
                        res.data?.message ||
                        'We have sent your payment request to Pesapal. Follow the Pesapal page to complete payment.';
                      setCompanyPaymentMessage(msg);
                      const redirectUrl = res.data?.redirect_url;
                      if (redirectUrl) {
                        window.open(redirectUrl, '_blank', 'noopener,noreferrer');
                      }
                    } catch (err) {
                      const data = err.response?.data;
                      let msg = data?.error || data?.detail || 'Failed to start payment. Please try again.';
                      setCompanyPaymentMessage(msg);
                    } finally {
                      setCompanyPaymentSubmitting(false);
                    }
                  }}
                >
                  {companyPaymentSubmitting ? 'Starting payment...' : 'Pay service fee via Mobile Money'}
                </button>
                <p className="text-[11px] text-gray-500 mt-1">
                  You will receive a Mobile Money prompt on your phone to enter your PIN. MaidMatch does not see or
                  store your PIN.
                </p>
              </div>
            </div>
          </div>
        )}

        {isCleaningCompany && showCompanyJobsModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Browse Cleaning Jobs</h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setShowCompanyJobsModal(false)}
                >
                  ✕
                </button>
              </div>
              <div className="px-5 py-4">
                {companyJobsLoading ? (
                  <p className="text-sm text-gray-500">Loading jobs...</p>
                ) : companyJobs && companyJobs.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {companyJobs.map((job) => (
                      <li key={job.id} className="py-3 flex flex-col gap-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{job.title}</p>
                            {job.description && (
                              <p className="text-xs text-gray-600 mt-0.5 max-w-xl">{job.description}</p>
                            )}
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                              {job.job_date && <span>{job.job_date}</span>}
                              {job.start_time && job.end_time && (
                                <span>
                                  • {job.start_time} - {job.end_time}
                                </span>
                              )}
                              {job.location && <span>• {job.location}</span>}
                              {job.hourly_rate != null && <span>• Service pay: UGX {job.hourly_rate}</span>}
                              {job.status && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[11px] font-medium">
                                  {job.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-1">
                          <button
                            type="button"
                            disabled={!companyProfile?.has_active_subscription || companyProfile?.is_paused}
                            className={`px-3 py-1 rounded-full text-xs font-medium text-white ${companyProfile?.has_active_subscription && !companyProfile?.is_paused ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-300 cursor-not-allowed'}`}
                            onClick={async () => {
                              if (companyProfile?.is_paused) {
                                alert(
                                  'Your company is currently taking a break, so you cannot show interest in jobs. Resume from your profile when you are ready.',
                                );
                                return;
                              }
                              if (!companyProfile?.has_active_subscription) {
                                alert('You need an active payment plan to show interest in jobs.');
                                return;
                              }
                              try {
                                const note = window.prompt(
                                  'Write a short message to the homeowner about why your company is a good fit for this job (optional):',
                                );
                                await applicationAPI.create({
                                  job: job.id,
                                  cover_letter: note || '',
                                });
                                alert('Your interest and message have been sent to the homeowner.');
                              } catch (err) {
                                console.error('Failed to submit interest', err);
                                alert(
                                  'Could not submit your interest for this job. It may already have your application.',
                                );
                              }
                            }}
                          >
                            Show interest
                          </button>
                          <button
                            type="button"
                            className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                            onClick={() => alert('You have declined this job for now.')}
                          >
                            Decline
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No cleaning jobs found yet. Check back later.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {viewerOpen && companyGallery.length > 0 && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            onClick={() => setViewerOpen(false)}
          >
            <div className="max-w-5xl w-full px-4" onClick={(e) => e.stopPropagation()}>
              <div className="bg-white rounded-lg overflow-hidden shadow-xl">
                <div className="relative">
                  <img
                    src={(companyGallery[viewerIndex] && (companyGallery[viewerIndex].image_url || companyGallery[viewerIndex].image)) || ''}
                    alt={(companyGallery[viewerIndex] && companyGallery[viewerIndex].caption) || 'work'}
                    className="w-full h-auto max-h-[80vh] object-contain bg-black"
                  />
                  <button className="absolute top-3 right-3 btn-secondary" onClick={() => setViewerOpen(false)}>
                    Close
                  </button>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div className="text-sm text-gray-700 truncate">
                    {(companyGallery[viewerIndex] && companyGallery[viewerIndex].caption) || 'No caption'}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn-secondary"
                      onClick={() => setViewerIndex((viewerIndex - 1 + companyGallery.length) % companyGallery.length)}
                    >
                      Prev
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setViewerIndex((viewerIndex + 1) % companyGallery.length)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {companyProfile && (
          <>
            <div className="card mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-4 sm:space-y-0">
                <div className="relative flex-shrink-0">
                  <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg">
                    {companyProfile.display_photo_url ? (
                      <img
                        src={companyProfile.display_photo_url}
                        alt={companyProfile.company_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                        <Users className="h-12 w-12 text-white" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{companyProfile.company_name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <p className="text-gray-600">{companyProfile.location || 'Location not set'}</p>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${companyProfile.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                    >
                      {companyProfile.verified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    <span className="font-semibold">Service plan status: </span>
                    {(() => {
                      const hasSub = companyProfile.has_active_subscription;
                      const type = companyProfile.subscription_type;
                      const exp = companyProfile.subscription_expires_at
                        ? new Date(companyProfile.subscription_expires_at)
                        : null;
                      if (hasSub && exp && exp > new Date()) {
                        if (type === 'annual') {
                          return `Annual service plan active until ${exp.toLocaleDateString()}`;
                        }
                        if (type === 'monthly') {
                          return `Monthly service plan active until ${exp.toLocaleDateString()}`;
                        }
                      }
                      return 'No active service plan. Pay the service plan fee so you can show interest in job requests.';
                    })()}
                  </div>
                  {!companyProfile.has_active_subscription && (
                    <button
                      type="button"
                      onClick={() => setShowCompanyPaymentModal(true)}
                      className="mt-1 inline-flex items-center text-[11px] font-medium text-primary-600 hover:text-primary-700 underline"
                    >
                      Pay service plan fee
                    </button>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button
                    className="btn-secondary flex items-center justify-center w-full sm:w-auto"
                    onClick={() => navigate('/company/profile')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Profile
                  </button>
                  <button
                    className="btn-secondary flex items-center justify-center w-full sm:w-auto"
                    onClick={() => navigate('/company/profile/edit')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>

            <div className="card mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Services Offered</h3>
              {Array.isArray(companyProfile.services) && companyProfile.services.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {companyProfile.services.map((svc) => {
                    const rate = companyServiceRates[svc.name];
                    return (
                      <span key={svc.id} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                        {svc.name}
                        {rate ? ` (Starting Service fee: ${rate})` : ''}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No services listed yet.</p>
              )}
            </div>

            <div className="card mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Company Gallery</h3>
                  <p className="text-xs text-gray-500">
                    Showcase photos of your work. These images are stored on this device only.
                  </p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="w-full md:w-72">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add photos</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border file:border-gray-200 file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
                    disabled={galleryUploading}
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (!files.length) return;
                      setGalleryUploading(true);
                      try {
                        const now = Date.now();
                        const newItems = files.map((file, idx) => ({
                          id: `${now}_${idx}_${file.name}`,
                          image: URL.createObjectURL(file),
                          caption: file.name,
                        }));
                        setCompanyGallery((prev) => {
                          const existing = Array.isArray(prev) ? prev : [];
                          const updated = [...newItems, ...existing];
                          try {
                            if (localGalleryKey) {
                              localStorage.setItem(localGalleryKey, JSON.stringify(updated));
                            }
                          } catch {
                            // ignore storage errors
                          }
                          return updated;
                        });
                        e.target.value = '';
                      } finally {
                        setGalleryUploading(false);
                      }
                    }}
                  />
                  {galleryUploading && <p className="mt-2 text-xs text-gray-500">Uploading images...</p>}
                </div>
                <div className="flex-1">
                  {companyGallery && companyGallery.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {companyGallery.map((item, idx) => (
                        <button
                          key={item.id || idx}
                          type="button"
                          className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50 aspect-video flex items-center justify-center"
                          onClick={() => {
                            setViewerIndex(idx);
                            setViewerOpen(true);
                          }}
                        >
                          {item.image || item.image_url ? (
                            <img
                              src={item.image || item.image_url}
                              alt={item.caption || 'work photo'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-gray-500">No image</span>
                          )}
                          {item.caption && (
                            <div className="absolute inset-x-0 bottom-0 bg-black/50 text-[10px] text-white px-2 py-1 truncate">
                              {item.caption}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      No gallery images yet. Use the uploader to add some photos.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        <div className="card mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <button
              onClick={async () => {
                if (companyProfile?.is_paused) {
                  alert('Your company is currently taking a break. Resume from your profile to browse jobs again.');
                  return;
                }
                setShowCompanyJobsModal(true);
                await loadCompanyJobs();
              }}
              className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200 group"
            >
              <Briefcase className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Browse Jobs</p>
            </button>
            <button
              onClick={() => navigate('/my-reviews')}
              className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200 group"
            >
              <Star className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Rates & Reviews</p>
            </button>
            <button
              onClick={() => navigate('/help-feedback')}
              className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200 group"
            >
              <HelpCircle className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Help &amp; Feedback</p>
            </button>
            <button
              onClick={() => navigate('/legal')}
              className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200 group"
            >
              <FileText className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Legal</p>
            </button>
          </div>
        </div>

        <div className="card mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
          <div className="text-center py-12 text-gray-500">
            <p>No recent activity</p>
            <p className="text-sm mt-2">Your activity will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CleaningCompanyDashboardLegacy = () => {
  return <Dashboard />;
};

const CleaningCompanyDashboard = () => {
  return <CleaningCompanyDashboardV2 />;
};

export default CleaningCompanyDashboard;
