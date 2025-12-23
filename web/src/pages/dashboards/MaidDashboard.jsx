import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { useLiveLocationUpdater } from '../../hooks/useLiveLocationUpdater';
import { applicationAPI, jobAPI, maidAPI, paymentAPI, reviewAPI } from '../../services/api';
import {
  Ban,
  Briefcase,
  FileText,
  HelpCircle,
  Home,
  Settings,
  Shield,
  ShieldCheck,
  Star,
  User,
} from 'lucide-react';
import Dashboard from '../Dashboard';

export const MaidDashboardV2 = () => {
  const { user, isMaid } = useAuth();
  const navigate = useNavigate();

  const [maidProfile, setMaidProfile] = useState(null);
  const [recentClients, setRecentClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);

  const [showHomeRating, setShowHomeRating] = useState(false);
  const [rcRespect, setRcRespect] = useState(0);
  const [rcPayment, setRcPayment] = useState(0);
  const [rcSafety, setRcSafety] = useState(0);
  const [rcFairness, setRcFairness] = useState(0);
  const [rcComment, setRcComment] = useState('');
  const [submittingHomeRating, setSubmittingHomeRating] = useState(false);

  const [showOnboardingPaymentModal, setShowOnboardingPaymentModal] = useState(false);
  const [onboardingNetwork, setOnboardingNetwork] = useState('mtn');
  const [onboardingPhone, setOnboardingPhone] = useState('');
  const [onboardingSubmitting, setOnboardingSubmitting] = useState(false);
  const [onboardingMessage, setOnboardingMessage] = useState('');

  const [showMaidJobsModal, setShowMaidJobsModal] = useState(false);
  const [maidJobs, setMaidJobs] = useState([]);
  const [maidJobsLoading, setMaidJobsLoading] = useState(false);
  const [maidApplicationsByJob, setMaidApplicationsByJob] = useState({});

  const { status: liveLocationStatus, coords: liveLocationCoords, placeName: liveLocationPlace, errorMessage: liveLocationError, retry: retryLiveLocation } =
    useLiveLocationUpdater(user);
  const liveLocationLabel = (() => {
    if (liveLocationStatus === 'updating') return 'Detecting your live location...';
    if (liveLocationStatus === 'error') return liveLocationError || 'Live location unavailable';
    if (liveLocationStatus === 'ok') {
      if (liveLocationPlace) {
        return `Live location: ${liveLocationPlace}`;
      }
      if (liveLocationCoords) {
        const { lat, lng } = liveLocationCoords;
        return `Live location: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      }
    }
    return null;
  })();

  useEffect(() => {
    if (!isMaid) return;

    const fetchData = async () => {
      try {
        const response = await maidAPI.getMyProfile();
        setMaidProfile(response.data);
        try {
          if (response?.data?.id) {
            const rc = await maidAPI.recentClients(response.data.id);
            setRecentClients(Array.isArray(rc.data) ? rc.data : []);
          }
        } catch {
          // ignore
        }
      } catch (error) {
        console.error('Error fetching maid profile:', error);
      }
    };

    fetchData();

    let intervalId;
    const onFocus = () => {
      fetchData();
    };
    intervalId = setInterval(fetchData, 10000);
    window.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);

    return () => {
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
  }, [isMaid]);

  const loadMaidJobs = async () => {
    if (!isMaid || !maidProfile) return;
    try {
      setMaidJobsLoading(true);
      const [jobsResp, appsResp] = await Promise.all([
        jobAPI.getAll({ ordering: '-created_at' }),
        applicationAPI.getAll({}),
      ]);

      const data = jobsResp.data?.results || jobsResp.data || [];
      let jobsArray = Array.isArray(data) ? data : [];
      jobsArray = jobsArray.filter((job) => {
        const title = (job.title || '').toLowerCase();
        return title.startsWith('maid');
      });
      setMaidJobs(jobsArray);

      const appsData = appsResp.data?.results || appsResp.data || [];
      const map = {};
      if (Array.isArray(appsData)) {
        appsData.forEach((app) => {
          if (!app.maid) return;
          const maidId = app.maid.id;
          if (!maidId || maidId !== maidProfile.id) return;
          const jobId =
            app.job && typeof app.job === 'object' && app.job.id !== undefined
              ? app.job.id
              : typeof app.job === 'number'
                ? app.job
                : null;
          if (!jobId) return;
          map[jobId] = app.status || 'pending';
        });
      }
      setMaidApplicationsByJob(map);
    } catch (e) {
      console.error('Failed to load jobs for maid browse view', e);
    } finally {
      setMaidJobsLoading(false);
    }
  };

  const activeProfile = (() => {
    if (isMaid) return maidProfile;
    return user;
  })();

  const maidAge = (() => {
    if (!isMaid || !maidProfile || !maidProfile.date_of_birth) return null;
    try {
      const dob = new Date(maidProfile.date_of_birth);
      if (Number.isNaN(dob.getTime())) return null;
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      return age;
    } catch {
      return null;
    }
  })();

  const maidServiceRates = (() => {
    if (!isMaid || !maidProfile || !maidProfile.service_pricing) return {};
    const raw = String(maidProfile.service_pricing || '');
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

  const headerNotifications = (() => {
    const items = [];
    if (isMaid && maidProfile) {
      if (!maidProfile.is_verified) {
        items.push({
          id: 'maid-verification',
          kind: 'system',
          title: 'Your maid account is not yet verified',
          body:
            maidProfile.verification_notes ||
            'Please upload clear ID and certificate/reference documents so we can verify your account.',
          onClick: () => navigate('/profile-settings'),
        });
      }
      if (!maidProfile.onboarding_fee_paid) {
        items.push({
          id: 'maid-onboarding-unpaid',
          kind: 'billing',
          title: 'Onboarding service payment needed',
          body: 'Complete the UGX 5,000 onboarding service payment to start applying for maid jobs.',
          onClick: () => {
            setOnboardingMessage('');
            setShowOnboardingPaymentModal(true);
          },
        });
      }
    }
    return items;
  })();

  if (!isMaid) return null;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar userProfile={activeProfile} notifications={headerNotifications} />

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
              <p className="text-lg text-gray-600 max-w-2xl">{isMaid && 'Browse available jobs and manage your profile.'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isMaid && maidProfile && !maidProfile.is_verified && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <Shield className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Account Pending Verification</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Your account is currently under review. Please ensure you have uploaded all required documents (ID
                    and certificates) in your profile settings. Once verified, you'll be able to apply for jobs.
                  </p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => navigate('/profile-settings')}
                    className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                  >
                    Complete Your Profile →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isMaid && maidProfile && !maidProfile.is_enabled && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <Ban className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Account Disabled</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>Your account has been temporarily disabled. Please contact support for more information.</p>
                  {maidProfile.verification_notes && (
                    <p className="mt-2 font-medium">Reason: {maidProfile.verification_notes}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {isMaid && showOnboardingPaymentModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Complete Onboarding Payment</h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    setShowOnboardingPaymentModal(false);
                    setOnboardingMessage('');
                  }}
                >
                  ✕
                </button>
              </div>
              <div className="px-5 py-4 space-y-4">
                <p className="text-sm text-gray-600">
                  Pay a one-time onboarding service payment of <span className="font-semibold">UGX 5,000</span> via
                  Mobile Money.
                </p>
                {onboardingMessage && (
                  <p className="text-sm bg-red-50 border border-red-200 text-red-800 rounded-lg px-3 py-2">
                    {onboardingMessage}
                  </p>
                )}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Network</label>
                    <select
                      className="input-field text-sm"
                      value={onboardingNetwork}
                      onChange={(e) => setOnboardingNetwork(e.target.value)}
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
                      value={onboardingPhone}
                      onChange={(e) => setOnboardingPhone(e.target.value)}
                      placeholder="e.g. 0771234567"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={onboardingSubmitting}
                  className="w-full btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  onClick={async () => {
                    if (!onboardingPhone.trim()) {
                      setOnboardingMessage('Please enter the mobile number you are paying from.');
                      return;
                    }
                    setOnboardingSubmitting(true);
                    setOnboardingMessage('');
                    try {
                      const res = await paymentAPI.initiateMaidOnboarding({
                        network: onboardingNetwork,
                        phone_number: onboardingPhone.trim(),
                      });
                      const msg =
                        res.data?.message ||
                        'We have sent your payment request to Pesapal. Follow the Pesapal page to complete payment.';
                      setOnboardingMessage(msg);
                      const redirectUrl = res.data?.redirect_url;
                      if (redirectUrl) {
                        window.open(redirectUrl, '_blank', 'noopener,noreferrer');
                      }
                    } catch (err) {
                      const data = err.response?.data;
                      let msg = data?.error || data?.detail || 'Failed to start payment. Please try again.';
                      if (
                        typeof msg === 'string' &&
                        msg.includes('already have an onboarding payment in progress or completed')
                      ) {
                        msg =
                          'You already have an onboarding payment that is in progress or has been recorded as paid. Please check your earlier payment or contact support if this seems wrong.';
                      }
                      setOnboardingMessage(msg);
                    } finally {
                      setOnboardingSubmitting(false);
                    }
                  }}
                >
                  {onboardingSubmitting ? 'Starting payment...' : 'Pay UGX 5,000 via Mobile Money'}
                </button>
                <p className="text-[11px] text-gray-500 mt-1">
                  You will receive a Mobile Money prompt on your phone to enter your PIN. MaidMatch does not see or
                  store your PIN.
                </p>
              </div>
            </div>
          </div>
        )}

        {isMaid && showMaidJobsModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Browse Homeowner Jobs</h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setShowMaidJobsModal(false)}
                >
                  ✕
                </button>
              </div>
              <div className="px-5 py-4">
                {maidJobsLoading ? (
                  <p className="text-sm text-gray-500">Loading jobs...</p>
                ) : maidJobs && maidJobs.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {maidJobs.map((job) => (
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
                              {maidApplicationsByJob[job.id] && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-medium">
                                  My status: {maidApplicationsByJob[job.id]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-1">
                          <button
                            type="button"
                            className="px-3 py-1 rounded-full text-xs font-medium bg-primary-600 text-white hover:bg-primary-700"
                            disabled={
                              maidApplicationsByJob[job.id] === 'accepted' || maidApplicationsByJob[job.id] === 'pending'
                            }
                            onClick={async () => {
                              try {
                                const note = window.prompt(
                                  'Write a short message to the homeowner about why you are a good fit for this job (optional):',
                                );
                                await applicationAPI.create({
                                  job: job.id,
                                  cover_letter: note || '',
                                });
                                alert('Your interest and message have been sent to the homeowner.');
                                await loadMaidJobs();
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
                  <p className="text-sm text-gray-500">No open jobs found yet. Check back later.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {isMaid && maidProfile && (
          <div className="card mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-4 sm:space-y-0">
              <div className="relative flex-shrink-0">
                <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg">
                  {maidProfile.profile_photo ? (
                    <img
                      src={maidProfile.profile_photo}
                      alt={maidProfile.full_name || maidProfile.user?.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary-400 to-secondary-600 flex items-center justify-center">
                      <User className="h-12 w-12 text-white" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {maidProfile.full_name || maidProfile.user?.full_name || maidProfile.user?.username}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                      {maidProfile.location && (
                        <span className="inline-flex items-center gap-1">
                          <Home className="h-4 w-4" />
                          {maidProfile.location}
                        </span>
                      )}
                      {liveLocationLabel && (
                        <p className="mt-1 text-xs text-gray-500">
                          {liveLocationLabel}
                          {liveLocationStatus === 'error' && (
                            <button
                              type="button"
                              className="ml-2 text-primary-600 hover:text-primary-700 underline"
                              onClick={retryLiveLocation}
                            >
                              Retry location
                            </button>
                          )}
                        </p>
                      )}
                      {maidAge !== null && <span>Age: {maidAge}</span>}
                      {maidProfile.user?.gender && (
                        <span>
                          Gender: {maidProfile.user.gender.charAt(0).toUpperCase() + maidProfile.user.gender.slice(1)}
                        </span>
                      )}
                      {maidProfile.category && (
                        <span>
                          Category:{' '}
                          {maidProfile.category === 'live_in'
                            ? 'Live-in'
                            : maidProfile.category === 'temporary'
                              ? 'Temporary'
                              : 'Placement'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-2">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${maidProfile.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
                      >
                        {maidProfile.is_verified ? (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5" /> Verified
                          </>
                        ) : (
                          <>
                            <Shield className="h-3.5 w-3.5" /> Not Verified
                          </>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const next = !maidProfile.availability_status;
                            await maidAPI.updateMyProfile({ availability_status: next });
                            setMaidProfile((prev) => (prev ? { ...prev, availability_status: next } : prev));
                          } catch {
                            alert('Could not update your availability. Please try again.');
                          }
                        }}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${maidProfile.availability_status ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'}`}
                      >
                        {maidProfile.availability_status
                          ? 'Available for work (tap to hide)'
                          : 'Not currently available (tap to show)'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 mt-1">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <span>{maidProfile.rating ?? '0.0'} / 5.0</span>
                      <span className="text-xs text-gray-500">({maidProfile.total_jobs_completed || 0} jobs completed)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/profile-settings')}
                      className="mt-3 btn-secondary flex items-center justify-center text-sm px-4 py-2"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isMaid && maidProfile && (
          <div className="card mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Onboarding payment</h3>
              {maidProfile.onboarding_fee_paid ? (
                <p className="text-sm text-gray-600">
                  Your one-time onboarding payment has been recorded
                  {maidProfile.onboarding_fee_paid_at && (
                    <>
                      {' '}as paid on {new Date(maidProfile.onboarding_fee_paid_at).toLocaleString()}
                    </>
                  )}
                  .
                </p>
              ) : (
                <p className="text-sm text-gray-600">
                  Complete a one-time onboarding service payment of <span className="font-semibold">UGX 5,000</span> to
                  finish your account setup and start applying for jobs.
                </p>
              )}
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2">
              {maidProfile.onboarding_fee_paid ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                  <ShieldCheck className="h-3.5 w-3.5" /> Onboarding payment completed
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setOnboardingMessage('');
                    setShowOnboardingPaymentModal(true);
                  }}
                  className="btn-primary text-sm flex items-center justify-center px-4 py-2"
                >
                  Pay onboarding (UGX 5,000)
                </button>
              )}
            </div>
          </div>
        )}

        {isMaid && maidProfile && (
          <div className="card mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Services Offered</h3>
            {maidProfile.skills ? (
              <div className="flex flex-wrap gap-2">
                {maidProfile.skills
                  .split(',')
                  .map((s) => s.trim())
                  .filter((s) => s.length > 0)
                  .map((s) => {
                    const rate = maidServiceRates[s];
                    return (
                      <span key={s} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                        {s}
                        {rate ? ` (Starting Service fee: ${rate})` : ''}
                      </span>
                    );
                  })}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No services listed yet.</p>
            )}
          </div>
        )}

        <div className="card mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {isMaid && (
              <>
                <button
                  className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200 group"
                  onClick={async () => {
                    setShowMaidJobsModal(true);
                    await loadMaidJobs();
                  }}
                >
                  <Briefcase className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Browse Jobs</p>
                </button>
                <button
                  onClick={() => navigate('/my-reviews')}
                  className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200 group"
                >
                  <Star className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">My Reviews</p>
                </button>
                <button
                  onClick={() => navigate('/profile-settings')}
                  className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200 group"
                >
                  <Settings className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Profile Settings</p>
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
              </>
            )}
          </div>
        </div>

        <div className="card mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
          {recentClients && recentClients.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {recentClients.map((c, idx) => (
                <li
                  key={idx}
                  className="py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 px-2 rounded"
                  onClick={() => {
                    setSelectedClient(c);
                    setShowClientModal(true);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                      {(c.full_name || c.username || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">{c.full_name || c.username}</p>
                      <p className="text-xs text-gray-500">
                        Closed a job • {c.created_at ? new Date(c.created_at).toLocaleString() : ''}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No recent activity</p>
              <p className="text-sm mt-2">Your activity will appear here</p>
            </div>
          )}
        </div>

        {showClientModal && selectedClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg">
              <div className="flex items-center justify-between p-4 border-b">
                <h4 className="text-lg font-semibold">Homeowner Details</h4>
                <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowClientModal(false)}>
                  ✕
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                    {(selectedClient.full_name || selectedClient.username || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">{selectedClient.full_name || selectedClient.username}</p>
                    <p className="text-xs text-gray-500">
                      Worked together on {selectedClient.created_at ? new Date(selectedClient.created_at).toLocaleString() : ''}
                    </p>
                  </div>
                </div>
                {selectedClient.home_address && (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Address:</span> {selectedClient.home_address}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-700">
                  {selectedClient.home_type && (
                    <span>
                      <span className="font-medium">Home:</span> {selectedClient.home_type}
                    </span>
                  )}
                  {selectedClient.number_of_rooms && <span>• {selectedClient.number_of_rooms} rooms</span>}
                  {selectedClient.is_verified && (
                    <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4 border-t flex flex-col sm:flex-row justify-end gap-2">
                <button
                  className="btn-secondary w-full sm:w-auto"
                  onClick={() => {
                    const subject = encodeURIComponent(`Support: homeowner ${selectedClient.username}`);
                    const body = encodeURIComponent(
                      `Hello Support,\n\nI need help regarding homeowner ${selectedClient.full_name || selectedClient.username}.\nClosed on: ${selectedClient.created_at ? new Date(selectedClient.created_at).toLocaleString() : ''}.\n\nThanks.`,
                    );
                    window.location.href = `mailto:support@maidmatch.local?subject=${subject}&body=${body}`;
                  }}
                >
                  Contact Support
                </button>
                <button className="btn-primary w-full sm:w-auto" onClick={() => setShowHomeRating(true)}>
                  Rate & Review
                </button>
              </div>
              {showHomeRating && (
                <div className="p-4 pt-0">
                  <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                    <p className="text-gray-900 font-medium mb-2">Rate homeowner</p>
                    <div className="space-y-3 mb-3">
                      <div>
                        <p className="text-sm text-gray-700 mb-1">Respect & Communication</p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={`rc-${n}`}
                              type="button"
                              onClick={() => setRcRespect(n)}
                              className="focus:outline-none"
                              title={`${n} star${n > 1 ? 's' : ''}`}
                            >
                              <Star className={`h-6 w-6 ${rcRespect >= n ? 'text-yellow-500' : 'text-gray-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-700 mb-1">Payment Timeliness</p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={`pay-${n}`}
                              type="button"
                              onClick={() => setRcPayment(n)}
                              className="focus:outline-none"
                              title={`${n} star${n > 1 ? 's' : ''}`}
                            >
                              <Star className={`h-6 w-6 ${rcPayment >= n ? 'text-yellow-500' : 'text-gray-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-700 mb-1">Work Environment & Safety</p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={`safe-${n}`}
                              type="button"
                              onClick={() => setRcSafety(n)}
                              className="focus:outline-none"
                              title={`${n} star${n > 1 ? 's' : ''}`}
                            >
                              <Star className={`h-6 w-6 ${rcSafety >= n ? 'text-yellow-500' : 'text-gray-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-700 mb-1">Fairness of Workload</p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={`fair-${n}`}
                              type="button"
                              onClick={() => setRcFairness(n)}
                              className="focus:outline-none"
                              title={`${n} star${n > 1 ? 's' : ''}`}
                            >
                              <Star className={`h-6 w-6 ${rcFairness >= n ? 'text-yellow-500' : 'text-gray-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <textarea
                      rows="3"
                      placeholder="Optional comment"
                      className="input-field w-full mb-3"
                      value={rcComment}
                      onChange={(e) => setRcComment(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          setShowHomeRating(false);
                          setRcRespect(0);
                          setRcPayment(0);
                          setRcSafety(0);
                          setRcFairness(0);
                          setRcComment('');
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        disabled={submittingHomeRating || [rcRespect, rcPayment, rcSafety, rcFairness].some((v) => v === 0)}
                        className="btn-primary"
                        onClick={async () => {
                          if (!selectedClient) return;
                          try {
                            setSubmittingHomeRating(true);
                            await reviewAPI.create({
                              homeowner_id: selectedClient.homeowner_id,
                              respect_communication: rcRespect,
                              payment_timeliness: rcPayment,
                              safety_environment: rcSafety,
                              fairness_workload: rcFairness,
                              comment: rcComment,
                            });
                            setShowHomeRating(false);
                            setRcRespect(0);
                            setRcPayment(0);
                            setRcSafety(0);
                            setRcFairness(0);
                            setRcComment('');
                            alert('Thanks for your review!');
                          } catch (e) {
                            console.error('Failed to submit homeowner review', e);
                            const serverMsg = e?.response?.data
                              ? typeof e.response.data === 'string'
                                ? e.response.data
                                : JSON.stringify(e.response.data)
                              : '';
                            alert(`Failed to submit review. ${serverMsg}`);
                          } finally {
                            setSubmittingHomeRating(false);
                          }
                        }}
                      >
                        {submittingHomeRating ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const MaidDashboardLegacy = () => {
  return <Dashboard />;
};

const MaidDashboard = () => {
  return <MaidDashboardV2 />;
};

export default MaidDashboard;
