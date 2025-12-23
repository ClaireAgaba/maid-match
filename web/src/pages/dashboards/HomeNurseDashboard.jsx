import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { applicationAPI, homeNursingAPI, jobAPI, paymentAPI } from '../../services/api';
import { Briefcase, FileText, HelpCircle, ShieldCheck, Star } from 'lucide-react';
import Dashboard from '../Dashboard';

export const HomeNurseDashboardV2 = () => {
  const { user, isHomeNurse } = useAuth();
  const navigate = useNavigate();

  const [nurseProfile, setNurseProfile] = useState(null);

  const [showNurseOnboardingModal, setShowNurseOnboardingModal] = useState(false);
  const [nurseOnboardingNetwork, setNurseOnboardingNetwork] = useState('mtn');
  const [nurseOnboardingPhone, setNurseOnboardingPhone] = useState('');
  const [nurseOnboardingSubmitting, setNurseOnboardingSubmitting] = useState(false);
  const [nurseOnboardingMessage, setNurseOnboardingMessage] = useState('');

  const [showNurseJobsModal, setShowNurseJobsModal] = useState(false);
  const [nurseJobs, setNurseJobs] = useState([]);
  const [nurseJobsLoading, setNurseJobsLoading] = useState(false);
  const [nurseApplicationsByJob, setNurseApplicationsByJob] = useState({});

  useEffect(() => {
    if (!isHomeNurse) return;
    const fetchData = async () => {
      try {
        const me = await homeNursingAPI.me();
        setNurseProfile(me.data);
      } catch (e) {
        console.error('Error fetching nurse profile:', e);
      }
    };
    fetchData();
  }, [isHomeNurse]);

  const nurseServiceRates = (() => {
    if (!isHomeNurse || !nurseProfile || !nurseProfile.service_pricing) return {};
    const raw = String(nurseProfile.service_pricing || '');
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

  const loadNurseJobs = async () => {
    if (!isHomeNurse || !nurseProfile) return;
    try {
      setNurseJobsLoading(true);
      const [jobsResp, appsResp] = await Promise.all([
        jobAPI.getAll({ ordering: '-created_at' }),
        applicationAPI.getAll({}),
      ]);

      const data = jobsResp.data?.results || jobsResp.data || [];
      let jobsArray = Array.isArray(data) ? data : [];
      jobsArray = jobsArray.filter((job) => {
        const title = (job.title || '').toLowerCase();
        return title.startsWith('home nurse');
      });
      setNurseJobs(jobsArray);

      const appsData = appsResp.data?.results || appsResp.data || [];
      const map = {};
      if (Array.isArray(appsData)) {
        appsData.forEach((app) => {
          if (!app.nurse) return;
          const nurseId = app.nurse.id;
          if (!nurseId || nurseId !== nurseProfile.id) return;
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
      setNurseApplicationsByJob(map);
    } catch (e) {
      console.error('Failed to load jobs for nurse browse view', e);
    } finally {
      setNurseJobsLoading(false);
    }
  };

  const headerNotifications = (() => {
    const items = [];
    if (isHomeNurse && nurseProfile) {
      if (!nurseProfile.is_verified) {
        items.push({
          id: 'nurse-verification',
          kind: 'system',
          title: 'Your home nurse account is not yet verified',
          body: 'Please ensure your ID and nursing certificate are uploaded so we can verify your account.',
          onClick: () => navigate('/nurse/profile/edit'),
        });
      }
      if (!nurseProfile.onboarding_fee_paid) {
        items.push({
          id: 'nurse-premium-unpaid',
          kind: 'billing',
          title: 'Premium onboarding service payment needed',
          body: 'Complete the UGX 10,000 premium onboarding service payment to start receiving home nursing job requests.',
          onClick: () => {
            setNurseOnboardingMessage('');
            setShowNurseOnboardingModal(true);
          },
        });
      }
    }
    return items;
  })();

  if (!isHomeNurse) return null;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar userProfile={nurseProfile} notifications={headerNotifications} />

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
                {isHomeNurse && 'Manage your nursing profile, services and find home care jobs.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isHomeNurse && showNurseOnboardingModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Complete Premium Onboarding Payment</h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    setShowNurseOnboardingModal(false);
                    setNurseOnboardingMessage('');
                  }}
                >
                  ✕
                </button>
              </div>
              <div className="px-5 py-4 space-y-4">
                <p className="text-sm text-gray-600">
                  Pay a one-time <span className="font-semibold">premium onboarding service payment of UGX 10,000</span>
                  {' '}via Mobile Money.
                </p>
                {nurseOnboardingMessage && (
                  <p className="text-sm bg-red-50 border border-red-200 text-red-800 rounded-lg px-3 py-2">
                    {nurseOnboardingMessage}
                  </p>
                )}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Network</label>
                    <select
                      className="input-field text-sm"
                      value={nurseOnboardingNetwork}
                      onChange={(e) => setNurseOnboardingNetwork(e.target.value)}
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
                      value={nurseOnboardingPhone}
                      onChange={(e) => setNurseOnboardingPhone(e.target.value)}
                      placeholder="e.g. 0771234567"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={nurseOnboardingSubmitting}
                  className="w-full btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  onClick={async () => {
                    if (!nurseOnboardingPhone.trim()) {
                      setNurseOnboardingMessage('Please enter the mobile number you are paying from.');
                      return;
                    }
                    setNurseOnboardingSubmitting(true);
                    setNurseOnboardingMessage('');
                    try {
                      const res = await paymentAPI.initiateHomeNurseOnboarding({
                        network: nurseOnboardingNetwork,
                        phone_number: nurseOnboardingPhone.trim(),
                      });
                      const msg =
                        res.data?.message ||
                        'We have sent your payment request to Pesapal. Follow the Pesapal page to complete payment.';
                      setNurseOnboardingMessage(msg);
                      const redirectUrl = res.data?.redirect_url;
                      if (redirectUrl) {
                        window.open(redirectUrl, '_blank', 'noopener,noreferrer');
                      }
                    } catch (err) {
                      const data = err.response?.data;
                      setNurseOnboardingMessage(
                        (data && (data.error || data.detail)) || 'Failed to initiate payment. Please try again.',
                      );
                    } finally {
                      setNurseOnboardingSubmitting(false);
                    }
                  }}
                >
                  {nurseOnboardingSubmitting ? 'Starting payment...' : 'Pay UGX 10,000 via Mobile Money'}
                </button>
                <p className="text-[11px] text-gray-500 mt-1">
                  You will receive a Mobile Money prompt on your phone to enter your PIN. MaidMatch does not see or store
                  your PIN.
                </p>
              </div>
            </div>
          </div>
        )}

        {isHomeNurse && showNurseJobsModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Browse Home Care Jobs</h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setShowNurseJobsModal(false)}
                >
                  ✕
                </button>
              </div>
              <div className="px-5 py-4">
                {nurseJobsLoading ? (
                  <p className="text-sm text-gray-500">Loading jobs...</p>
                ) : nurseJobs && nurseJobs.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {nurseJobs.map((job) => (
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
                              {nurseApplicationsByJob[job.id] && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-medium">
                                  My status: {nurseApplicationsByJob[job.id]}
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
                              nurseApplicationsByJob[job.id] === 'accepted' ||
                              nurseApplicationsByJob[job.id] === 'pending'
                            }
                            onClick={async () => {
                              try {
                                const note = window.prompt(
                                  'Write a short message to the homeowner about why you are a good fit for this home care job (optional):',
                                );
                                await applicationAPI.create({
                                  job: job.id,
                                  cover_letter: note || '',
                                });
                                alert('Your interest and message have been sent to the homeowner.');
                                await loadNurseJobs();
                              } catch (err) {
                                console.error('Failed to submit interest', err);
                                alert('Could not submit your interest for this job. It may already have your application.');
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
                  <p className="text-sm text-gray-500">No home care jobs found yet. Check back later.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {isHomeNurse && nurseProfile && (
          <>
            <div className="card mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-4 sm:space-y-0">
                <div className="relative flex-shrink-0">
                  <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-primary-100 bg-gray-100 flex items-center justify-center text-xl font-semibold text-primary-600">
                    {nurseProfile.display_photo ? (
                      <img src={nurseProfile.display_photo} alt={nurseProfile.username} className="h-full w-full object-cover" />
                    ) : (
                      (nurseProfile.username || '?').charAt(0).toUpperCase()
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{nurseProfile.username}</h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        nurseProfile.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {nurseProfile.is_verified ? 'Verified' : 'Not verified'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
                    {nurseProfile.nursing_level && (
                      <span>
                        {nurseProfile.nursing_level === 'registered'
                          ? 'Registered Nurse'
                          : nurseProfile.nursing_level === 'midwife'
                            ? 'Midwife'
                            : 'Enrolled Nurse'}
                      </span>
                    )}
                    {nurseProfile.years_of_experience > 0 && <span>• {nurseProfile.years_of_experience} yrs experience</span>}
                    {nurseProfile.location && <span>• {nurseProfile.location}</span>}
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    <span className="font-semibold">Contact: </span>
                    <span>{nurseProfile.phone_number || 'No phone set'}</span>
                    {nurseProfile.email && <span> • {nurseProfile.email}</span>}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  <button
                    type="button"
                    className="btn-secondary flex items-center justify-center w-full sm:w-auto"
                    onClick={() => navigate('/nurse/profile')}
                  >
                    View Profile
                  </button>
                  <button
                    type="button"
                    className="btn-secondary flex items-center justify-center w-full sm:w-auto"
                    onClick={() => navigate('/nurse/profile/edit')}
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>

            <div className="card mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Premium onboarding</h3>
                {nurseProfile.onboarding_fee_paid ? (
                  <p className="text-sm text-gray-600">
                    Your premium onboarding payment has been recorded
                    {nurseProfile.onboarding_fee_paid_at && (
                      <> {' '}on {new Date(nurseProfile.onboarding_fee_paid_at).toLocaleString()}</>
                    )}
                    .
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    Complete a one-time <span className="font-semibold">premium onboarding service payment of UGX 10,000</span> to finish setup and start receiving job requests.
                  </p>
                )}
              </div>
              <div className="flex flex-col items-start sm:items-end gap-2">
                {nurseProfile.onboarding_fee_paid ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                    <ShieldCheck className="h-3.5 w-3.5" /> Premium onboarding payment completed
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setNurseOnboardingMessage('');
                      setShowNurseOnboardingModal(true);
                    }}
                    className="btn-primary text-sm flex items-center justify-center px-4 py-2"
                  >
                    Pay premium onboarding (UGX 10,000)
                  </button>
                )}
              </div>
            </div>

            <div className="card mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Services Offered</h3>
              {Array.isArray(nurseProfile.services) && nurseProfile.services.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {nurseProfile.services.map((svc) => {
                    const rate = nurseServiceRates[svc.name];
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
          </>
        )}

        <div className="card mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <button
              onClick={async () => {
                if (!nurseProfile?.onboarding_fee_paid) {
                  alert('Premium onboarding service payment is required before you can receive home nursing job requests.');
                  setNurseOnboardingMessage('');
                  setShowNurseOnboardingModal(true);
                  return;
                }
                setShowNurseJobsModal(true);
                await loadNurseJobs();
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
              <p className="font-medium text-gray-900">My Reviews</p>
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

export const HomeNurseDashboardLegacy = () => {
  return <Dashboard />;
};

const HomeNurseDashboard = () => {
  return <HomeNurseDashboardV2 />;
};

export default HomeNurseDashboard;
