import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandLogo from '../components/BrandLogo';
import Navbar from '../components/Navbar';
import { maidAPI, homeownerAPI, authAPI, reviewAPI, cleaningCompanyAPI, homeNursingAPI, jobAPI, applicationAPI } from '../services/api';
import {
  Briefcase, Users, Star, Settings, LogOut,
  Home, Calendar, DollarSign, TrendingUp, User,
  Shield, ShieldCheck, Ban, CircleOff, Eye
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout, isHomeowner, isMaid, isAdmin, isHomeNurse } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    jobsPosted: 0,
    applications: 0,
    completedJobs: 0,
    rating: 0.0
  });
  const [maidProfile, setMaidProfile] = useState(null);
  const [recentClients, setRecentClients] = useState([]);
  const [homeownerProfile, setHomeownerProfile] = useState(null);
  const [recentMaids, setRecentMaids] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  // homeowner rating state (for maids rating homeowners)
  const [showHomeRating, setShowHomeRating] = useState(false);
  const [rcRespect, setRcRespect] = useState(0);
  const [rcPayment, setRcPayment] = useState(0);
  const [rcSafety, setRcSafety] = useState(0);
  const [rcFairness, setRcFairness] = useState(0);
  const [rcComment, setRcComment] = useState('');
  const [submittingHomeRating, setSubmittingHomeRating] = useState(false);
  const [adminStats, setAdminStats] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [companyGallery, setCompanyGallery] = useState([]);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [editingCaptionId, setEditingCaptionId] = useState(null);
  const [editingCaptionText, setEditingCaptionText] = useState('');
  const localGalleryKey = user?.username ? `company_gallery_${user.username}` : null;
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  // home nurse state
  const [nurseProfile, setNurseProfile] = useState(null);
  // homeowner jobs (service requests)
  const [homeownerJobs, setHomeownerJobs] = useState([]);
  const [homeownerJobsLoading, setHomeownerJobsLoading] = useState(false);
  const [showJobResponsesModal, setShowJobResponsesModal] = useState(false);
  const [jobResponses, setJobResponses] = useState([]);
  const [jobResponsesLoading, setJobResponsesLoading] = useState(false);
  const [jobResponsesFor, setJobResponsesFor] = useState(null); // job object
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceTab, setServiceTab] = useState('post'); // 'post' | 'schedule'
  const [editingJobId, setEditingJobId] = useState(null);
  const [editingJobKind, setEditingJobKind] = useState(null); // 'post' | 'schedule' | null
  // maid: browse homeowner jobs
  const [showMaidJobsModal, setShowMaidJobsModal] = useState(false);
  const [maidJobs, setMaidJobs] = useState([]);
  const [maidJobsLoading, setMaidJobsLoading] = useState(false);
  const [maidApplicationsByJob, setMaidApplicationsByJob] = useState({}); // jobId -> status
  // nurse: browse homeowner jobs
  const [showNurseJobsModal, setShowNurseJobsModal] = useState(false);
  const [nurseJobs, setNurseJobs] = useState([]);
  const [nurseJobsLoading, setNurseJobsLoading] = useState(false);
  const [nurseApplicationsByJob, setNurseApplicationsByJob] = useState({}); // jobId -> status
  // cleaning company: browse homeowner jobs
  const [showCompanyJobsModal, setShowCompanyJobsModal] = useState(false);
  const [companyJobs, setCompanyJobs] = useState([]);
  const [companyJobsLoading, setCompanyJobsLoading] = useState(false);
  const [postJobForm, setPostJobForm] = useState({
    service_target: 'maid', // Maid, cleaning_company, home_nurse
    description: '',
    job_date: '',
    start_time: '',
    end_time: '',
    rate: '',
    location: '',
  });
  const [scheduleForm, setScheduleForm] = useState({
    service_title: '',
    description: '',
    job_date: '',
    start_time: '',
    end_time: '',
    rate: '',
    location: '',
    service_target: 'maid',
  });
  const [submittingService, setSubmittingService] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (isMaid) {
        try {
          const response = await maidAPI.getMyProfile();
          setMaidProfile(response.data);
          // Load recent clients once profile is available
          try {
            if (response?.data?.id) {
              const rc = await maidAPI.recentClients(response.data.id);
              setRecentClients(Array.isArray(rc.data) ? rc.data : []);
            }
          } catch (e) {
            // non-blocking
          }
        } catch (error) {
          console.error('Error fetching maid profile:', error);
        }
      } else if (isHomeowner) {
        try {
          // Fetch fresh user data
          const userResponse = await authAPI.getCurrentUser();
          const homeownerResponse = await homeownerAPI.getMyProfile();
          setCurrentUser(userResponse.data);
          setHomeownerProfile(homeownerResponse.data);
          // Load homeowner jobs (service requests)
          try {
            setHomeownerJobsLoading(true);
            const respJobs = await jobAPI.getAll({ ordering: '-created_at' });
            const data = respJobs.data?.results || respJobs.data || [];
            setHomeownerJobs(Array.isArray(data) ? data : []);
          } catch (e) {
            console.error('Failed to load homeowner jobs', e);
            setHomeownerJobs([]);
          } finally {
            setHomeownerJobsLoading(false);
          }
          try {
            const rm = await homeownerAPI.recentMaids();
            setRecentMaids(Array.isArray(rm.data) ? rm.data : []);
          } catch (e) {
            // ignore
          }
        } catch (error) {
          console.error('Error fetching homeowner profile:', error);
        }
      } else if (isAdmin) {
        try {
          const resp = await maidAPI.adminStats();
          setAdminStats(resp.data);
        } catch (e) {
          console.error('Failed to load admin stats', e);
        }
      } else if (user?.user_type === 'cleaning_company') {
        try {
          const me = await cleaningCompanyAPI.me();
          setCompanyProfile(me.data);
        } catch (e) { /* ignore */ }
        // Load local-only gallery first
        try {
          if (localGalleryKey) {
            const raw = localStorage.getItem(localGalleryKey);
            if (raw) {
              const arr = JSON.parse(raw);
              if (Array.isArray(arr)) setCompanyGallery(arr);
            }
          }
        } catch { }
      } else if (isHomeNurse) {
        try {
          const me = await homeNursingAPI.me();
          setNurseProfile(me.data);
        } catch (e) {
          console.error('Error fetching nurse profile:', e);
        }
      }
    };
    fetchData();
    // On maid dashboard, auto-refresh on interval and on tab focus
    let intervalId;
    const onFocus = () => { if (isMaid) fetchData(); };
    if (isMaid) {
      intervalId = setInterval(fetchData, 10000); // 10s
      window.addEventListener('visibilitychange', onFocus);
      window.addEventListener('focus', onFocus);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
  }, [isMaid, isHomeowner, isHomeNurse, user?.user_type]);

  // Homeowner: load responses (applications) for a given job
  const loadJobResponses = async (job) => {
    if (!isHomeowner || !job) return;
    try {
      setJobResponsesLoading(true);
      setJobResponsesFor(job);
      const resp = await applicationAPI.getAll({ job: job.id });
      const data = resp.data?.results || resp.data || [];
      let appsArray = Array.isArray(data) ? data : [];
      // Backend list currently returns all applications for this homeowner;
      // ensure we only keep applications for this specific job.
      appsArray = appsArray.filter((app) => {
        if (app.job && typeof app.job === 'object' && app.job.id !== undefined) {
          return app.job.id === job.id;
        }
        // Fallback if API ever returns job as a plain id
        if (typeof app.job === 'number') {
          return app.job === job.id;
        }
        return false;
      });
      setJobResponses(appsArray);
      setShowJobResponsesModal(true);
    } catch (e) {
      console.error('Failed to load job responses', e);
      alert('Failed to load responses for this job.');
    } finally {
      setJobResponsesLoading(false);
    }
  };

  // Homeowner: open an existing job in edit mode
  const openEditJob = (job) => {
    if (!job) return;
    // Heuristic: scheduled services have pattern "<Target> - <service>"
    const isSchedule = job.title && job.title.includes(' - ');
    if (isSchedule) {
      const [targetLabel, rest] = job.title.split(' - ');
      let service_target = 'maid';
      if (targetLabel.toLowerCase().includes('cleaning')) service_target = 'cleaning_company';
      else if (targetLabel.toLowerCase().includes('nurse')) service_target = 'home_nurse';

      setScheduleForm({
        service_title: rest || job.title,
        description: job.description || '',
        job_date: job.job_date || '',
        start_time: job.start_time || '',
        end_time: job.end_time || '',
        rate: job.hourly_rate ? String(job.hourly_rate) : '',
        location: job.location || '',
        service_target,
      });
      setEditingJobId(job.id);
      setEditingJobKind('schedule');
      setServiceTab('schedule');
      setShowServiceModal(true);
    } else {
      // Infer service_target from title where possible
      let service_target = 'maid';
      const title = (job.title || '').toLowerCase();
      if (title.includes('cleaning')) service_target = 'cleaning_company';
      else if (title.includes('nurse')) service_target = 'home_nurse';

      setPostJobForm({
        service_target,
        description: job.description || '',
        job_date: job.job_date || '',
        start_time: job.start_time || '',
        end_time: job.end_time || '',
        rate: job.hourly_rate ? String(job.hourly_rate) : '',
        location: job.location || '',
      });
      setEditingJobId(job.id);
      setEditingJobKind('post');
      setServiceTab('post');
      setShowServiceModal(true);
    }
  };

  // Homeowner: reload jobs (service requests)
  const reloadHomeownerJobs = async () => {
    if (!isHomeowner) return;
    try {
      setHomeownerJobsLoading(true);
      const respJobs = await jobAPI.getAll({ ordering: '-created_at' });
      const data = respJobs.data?.results || respJobs.data || [];
      setHomeownerJobs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to reload homeowner jobs', e);
    } finally {
      setHomeownerJobsLoading(false);
    }
  };

  // Maid: load homeowner jobs for browsing
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
      // Only show maid-targeted jobs to maids. We use the title convention:
      // "Maid" or "Maid - ..." for maid jobs.
      jobsArray = jobsArray.filter((job) => {
        const title = (job.title || '').toLowerCase();
        return title.startsWith('maid');
      });
      setMaidJobs(jobsArray);

      // Build map of this maid's applications by job id so they can see status
      const appsData = appsResp.data?.results || appsResp.data || [];
      const map = {};
      if (Array.isArray(appsData)) {
        appsData.forEach((app) => {
          if (!app.maid) return;
          const maidId = app.maid.id;
          if (!maidId || maidId !== maidProfile.id) return;
          const jobId = app.job && typeof app.job === 'object' && app.job.id !== undefined
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

  // Nurse: load homeowner jobs for browsing (only nurse-targeted)
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
      // Only show nurse-targeted jobs to nurses. Titles start with "Home nurse".
      jobsArray = jobsArray.filter((job) => {
        const title = (job.title || '').toLowerCase();
        return title.startsWith('home nurse');
      });
      setNurseJobs(jobsArray);

      // Build map of this nurse's applications by job id so they can see status
      const appsData = appsResp.data?.results || appsResp.data || [];
      const map = {};
      if (Array.isArray(appsData)) {
        appsData.forEach((app) => {
          if (!app.nurse) return;
          const nurseId = app.nurse.id;
          if (!nurseId || nurseId !== nurseProfile.id) return;
          const jobId = app.job && typeof app.job === 'object' && app.job.id !== undefined
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

  // Cleaning company: load homeowner jobs for browsing (only cleaning-company-targeted)
  const loadCompanyJobs = async () => {
    if (user?.user_type !== 'cleaning_company') return;
    try {
      setCompanyJobsLoading(true);
      const resp = await jobAPI.getAll({ ordering: '-created_at' });
      const data = resp.data?.results || resp.data || [];
      let jobsArray = Array.isArray(data) ? data : [];
      // Only show cleaning-company-targeted jobs. Titles start with "Cleaning company".
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

  // Homeowner: create a live-in maid job post
  const handleCreatePostJob = async (e) => {
    e.preventDefault();
    if (!postJobForm.description.trim()) {
      alert('Please describe the kind of maid you are looking for.');
      return;
    }
    if (!postJobForm.job_date) {
      alert('Please select a preferred date for this request.');
      return;
    }
    setSubmittingService(true);
    try {
      // backend requires times; use a broad default day range but do not show fields to user
      const startTime = postJobForm.start_time || '08:00';
      const endTime = postJobForm.end_time || '17:00';

      const targetLabel = postJobForm.service_target === 'cleaning_company'
        ? 'Cleaning company'
        : postJobForm.service_target === 'home_nurse'
          ? 'Home nurse'
          : 'Maid';

      const payload = {
        title: targetLabel,
        description: postJobForm.description,
        location: postJobForm.location || currentUser?.address || '',
        job_date: postJobForm.job_date,
        start_time: startTime,
        end_time: endTime,
        hourly_rate: postJobForm.rate ? Number(postJobForm.rate) : 0,
      };
      if (editingJobId && editingJobKind === 'post') {
        await jobAPI.update(editingJobId, payload);
      } else {
        await jobAPI.create(payload);
      }
      await reloadHomeownerJobs();
      setShowServiceModal(false);
      setPostJobForm({
        service_target: 'maid',
        description: '',
        job_date: '',
        start_time: '',
        end_time: '',
        rate: '',
        location: '',
      });
      setEditingJobId(null);
      setEditingJobKind(null);
    } catch (err) {
      console.error('Failed to create job', err);
      alert('Failed to submit your job. Please try again.');
    } finally {
      setSubmittingService(false);
    }
  };

  // Homeowner: create a scheduled one-off service
  const handleCreateScheduledService = async (e) => {
    e.preventDefault();
    if (!scheduleForm.service_title.trim()) {
      alert('Please enter the type of service you are interested in.');
      return;
    }
    if (!scheduleForm.job_date || !scheduleForm.start_time || !scheduleForm.end_time) {
      alert('Please select a date and time for this service.');
      return;
    }
    setSubmittingService(true);
    try {
      const targetLabel = scheduleForm.service_target === 'cleaning_company'
        ? 'Cleaning company'
        : scheduleForm.service_target === 'home_nurse'
          ? 'Home nurse'
          : 'Maid';

      const payload = {
        title: `${targetLabel} - ${scheduleForm.service_title}`,
        description: scheduleForm.description || 'Scheduled home service request',
        location: scheduleForm.location || currentUser?.address || '',
        job_date: scheduleForm.job_date,
        start_time: scheduleForm.start_time,
        end_time: scheduleForm.end_time,
        hourly_rate: scheduleForm.rate ? Number(scheduleForm.rate) : 0,
      };
      if (editingJobId && editingJobKind === 'schedule') {
        await jobAPI.update(editingJobId, payload);
      } else {
        await jobAPI.create(payload);
      }
      await reloadHomeownerJobs();
      setShowServiceModal(false);
      setScheduleForm({
        service_title: '',
        description: '',
        job_date: '',
        start_time: '',
        end_time: '',
        rate: '',
        location: '',
      });
    } catch (err) {
      console.error('Failed to create scheduled service', err);
      alert('Failed to submit your scheduled service. Please try again.');
    } finally {
      setSubmittingService(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const onExportMaids = async () => {
    try {
      const resp = await maidAPI.exportMaids();
      downloadBlob(resp.data, 'maids_export.csv');
    } catch (e) {
      alert('Failed to export maids');
    }
  };
  const onExportHomeowners = async () => {
    try {
      const resp = await homeownerAPI.exportHomeowners();
      downloadBlob(resp.data, 'homeowners_export.csv');
    } catch (e) {
      alert('Failed to export homeowners');
    }
  };

  const activeProfile = (() => {
    if (isMaid) return maidProfile;
    if (isHomeowner) return { ...homeownerProfile, ...currentUser };
    if (isHomeNurse) return nurseProfile;
    if (user?.user_type === 'cleaning_company') return companyProfile;
    return user;
  })();

  // Helper: compute maid age from date_of_birth, if available
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

  // Map of per-service starting pay for maids, parsed from the
  // free-text service_pricing field (one "Service: value" per line).
  const maidServiceRates = (() => {
    if (!isMaid || !maidProfile || !maidProfile.service_pricing) return {};
    const raw = String(maidProfile.service_pricing || '');
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
  })();

  // Map of per-service starting pay for cleaning companies, parsed from
  // companyProfile.service_pricing (one "Service: value" per line).
  const companyServiceRates = (() => {
    if (user?.user_type !== 'cleaning_company' || !companyProfile || !companyProfile.service_pricing) return {};
    const raw = String(companyProfile.service_pricing || '');
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
  })();

  // Map of per-category starting pay for nurses, parsed from
  // nurseProfile.service_pricing (one "Category: value" per line).
  const nurseServiceRates = (() => {
    if (!isHomeNurse || !nurseProfile || !nurseProfile.service_pricing) return {};
    const raw = String(nurseProfile.service_pricing || '');
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
  })();

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar userProfile={activeProfile} />

      {/* Welcome Header */}
      <div className="relative bg-white border-b border-gray-100 overflow-hidden">
        <div className="absolute inset-0 bg-brand-gradient-soft opacity-30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">{user?.username}</span>! 
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl">
                {isHomeowner && "Manage your jobs and find the perfect maid for your home."}
                {isMaid && "Browse available jobs and manage your profile."}
                {isHomeNurse && "Manage your nursing profile, services and find home care jobs."}
                {user?.user_type === 'cleaning_company' && "Manage your company profile and showcase your work."}
                {isAdmin && "Manage the MaidMatch platform."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Verification Status Banner */}
        {isMaid && maidProfile && !maidProfile.is_verified && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <Shield className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Account Pending Verification
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Your account is currently under review. Please ensure you have uploaded all required documents
                    (ID and certificates) in your profile settings. Once verified, you'll be able to apply for jobs.
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

        {/* Cleaning Company: Browse Jobs modal (view cleaning-company-targeted homeowner jobs) */}
        {user?.user_type === 'cleaning_company' && showCompanyJobsModal && (
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
                                <span>• {job.start_time} - {job.end_time}</span>
                              )}
                              {job.location && <span>• {job.location}</span>}
                              {job.hourly_rate != null && (
                                <span>• Service pay: UGX {job.hourly_rate}</span>
                              )}
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
                            className="px-3 py-1 rounded-full text-xs font-medium bg-primary-600 text-white hover:bg-primary-700"
                            onClick={async () => {
                              try {
                                const note = window.prompt('Write a short message to the homeowner about why your company is a good fit for this job (optional):');
                                await applicationAPI.create({
                                  job: job.id,
                                  cover_letter: note || '',
                                });
                                alert('Your interest and message have been sent to the homeowner.');
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
                  <p className="text-sm text-gray-500">No cleaning jobs found yet. Check back later.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Home Nurse: Browse Jobs modal (view nurse-targeted homeowner jobs) */}
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
                                <span>• {job.start_time} - {job.end_time}</span>
                              )}
                              {job.location && <span>• {job.location}</span>}
                              {job.hourly_rate != null && (
                                <span>• Service pay: UGX {job.hourly_rate}</span>
                              )}
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
                            disabled={nurseApplicationsByJob[job.id] === 'accepted' || nurseApplicationsByJob[job.id] === 'pending'}
                            onClick={async () => {
                              try {
                                const note = window.prompt('Write a short message to the homeowner about why you are a good fit for this home care job (optional):');
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

        {/* Maid: Browse Jobs modal (view homeowner jobs) */}
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
                                <span>• {job.start_time} - {job.end_time}</span>
                              )}
                              {job.location && <span>• {job.location}</span>}
                              {job.hourly_rate != null && (
                                <span>• Service pay: UGX {job.hourly_rate}</span>
                              )}
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
                            disabled={maidApplicationsByJob[job.id] === 'accepted' || maidApplicationsByJob[job.id] === 'pending'}
                            onClick={async () => {
                              try {
                                const note = window.prompt('Write a short message to the homeowner about why you are a good fit for this job (optional):');
                                await applicationAPI.create({
                                  job: job.id,
                                  cover_letter: note || '',
                                });
                                alert('Your interest and message have been sent to the homeowner.');
                                // Refresh map so status shows as pending
                                await loadMaidJobs();
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
                  <p className="text-sm text-gray-500">No open jobs found yet. Check back later.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Image Viewer Modal */}
        {viewerOpen && companyGallery.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setViewerOpen(false)}>
            <div className="max-w-5xl w-full px-4" onClick={(e) => e.stopPropagation()}>
              <div className="bg-white rounded-lg overflow-hidden shadow-xl">
                <div className="relative">
                  <img
                    src={(companyGallery[viewerIndex] && (companyGallery[viewerIndex].image_url || companyGallery[viewerIndex].image)) || ''}
                    alt={(companyGallery[viewerIndex] && companyGallery[viewerIndex].caption) || 'work'}
                    className="w-full h-auto max-h-[80vh] object-contain bg-black"
                  />
                  <button className="absolute top-3 right-3 btn-secondary" onClick={() => setViewerOpen(false)}>Close</button>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div className="text-sm text-gray-700 truncate">
                    {(companyGallery[viewerIndex] && companyGallery[viewerIndex].caption) || 'No caption'}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn-secondary"
                      onClick={() => setViewerIndex((viewerIndex - 1 + companyGallery.length) % companyGallery.length)}
                    >Prev</button>
                    <button
                      className="btn-secondary"
                      onClick={() => setViewerIndex((viewerIndex + 1) % companyGallery.length)}
                    >Next</button>
                  </div>
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
                <h3 className="text-sm font-medium text-red-800">
                  Account Disabled
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    Your account has been temporarily disabled. Please contact support for more information.
                  </p>
                  {maidProfile.verification_notes && (
                    <p className="mt-2 font-medium">
                      Reason: {maidProfile.verification_notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cleaning Company: Profile row */}
        {user?.user_type === 'cleaning_company' && companyProfile && (
          <div className="card mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-4 sm:space-y-0">
              <div className="relative flex-shrink-0">
                <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg">
                  {companyProfile.display_photo_url ? (
                    <img src={companyProfile.display_photo_url} alt={companyProfile.company_name} className="h-full w-full object-cover" />
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
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${companyProfile.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {companyProfile.verified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button className="btn-secondary flex items-center justify-center w-full sm:w-auto" onClick={() => navigate('/company/profile')}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Profile
                </button>
                <button className="btn-secondary flex items-center justify-center w-full sm:w-auto" onClick={() => navigate('/company/profile/edit')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cleaning Company: Services row */}
        {user?.user_type === 'cleaning_company' && companyProfile && (
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
              <p className="text-sm text-gray-600">No services added.</p>
            )}
          </div>
        )}

        {/* Home Nurse: Profile row */}
        {isHomeNurse && (
          <div className="card mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-4 sm:space-y-0">
              <div className="relative flex-shrink-0">
                <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg">
                  {nurseProfile?.display_photo ? (
                    <img src={nurseProfile.display_photo.startsWith('http') ? nurseProfile.display_photo : `http://localhost:8000${nurseProfile.display_photo}`}
                      alt={nurseProfile.username || 'nurse'} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center">
                      <User className="h-12 w-12 text-white" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {nurseProfile?.username || user?.username}
                  {(nurseProfile?.gender || typeof nurseProfile?.age === 'number') && (
                    <span className="ml-2 text-sm font-normal text-gray-600">
                      {nurseProfile?.gender && (
                        <>
                          {nurseProfile.gender.charAt(0).toUpperCase() + nurseProfile.gender.slice(1)}
                          {typeof nurseProfile?.age === 'number' ? ' • ' : ''}
                        </>
                      )}
                      {typeof nurseProfile?.age === 'number' && `${nurseProfile.age} yrs`}
                    </span>
                  )}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-gray-600">{nurseProfile?.location || 'Location not set'}</p>
                  {/* Availability badge (fallback to emergency_availability) */}
                  {typeof nurseProfile?.emergency_availability !== 'undefined' && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${nurseProfile.emergency_availability ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {nurseProfile.emergency_availability ? 'Available' : 'Unavailable'}
                    </span>
                  )}
                  {/* Verification badge: show only if backend provides is_verified; else default Not Verified visually subtle */}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${nurseProfile?.is_verified ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {nurseProfile?.is_verified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button className="btn-secondary flex items-center justify-center w-full sm:w-auto" onClick={() => navigate('/nurse/profile')}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Profile
                </button>
                <button className="btn-secondary flex items-center justify-center w-full sm:w-auto" onClick={() => navigate('/nurse/profile/edit')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
                {/* Availability quick toggle uses emergency_availability as availability */}
                <button
                  className={`btn-secondary flex items-center justify-center w-full sm:w-auto ${savingAvailability ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={savingAvailability}
                  onClick={async () => {
                    try {
                      setSavingAvailability(true);
                      const next = !nurseProfile?.emergency_availability;
                      const fd = new FormData();
                      fd.append('emergency_availability', next ? 'true' : 'false');
                      await homeNursingAPI.updateMe(fd);
                      // locally update to feel instant
                      setNurseProfile((prev) => ({ ...(prev || {}), emergency_availability: next }));
                    } catch (e) {
                      console.error('Failed to update availability', e);
                    } finally {
                      setSavingAvailability(false);
                    }
                  }}
                >
                  {nurseProfile?.emergency_availability ? 'Set Unavailable' : 'Set Available'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Home Nurse: Services row */}
        {isHomeNurse && (
          <div className="card mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Services Offered</h3>
            {Array.isArray(nurseProfile?.services) && nurseProfile.services.length > 0 ? (
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
              <p className="text-sm text-gray-600">No services added.</p>
            )}
          </div>
        )}

        {/* Cleaning Company: Gallery row */}
        {user?.user_type === 'cleaning_company' && (
          <div className="card mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Our Works</h3>
            {/* Upload form */}
            <form
              className="flex flex-col sm:flex-row gap-2 mb-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const fileInput = e.currentTarget.querySelector('input[name="gallery_image"]');
                const captionInput = e.currentTarget.querySelector('input[name="gallery_caption"]');
                if (!fileInput.files[0]) return;
                setGalleryUploading(true);
                try {
                  const file = fileInput.files[0];
                  const reader = new FileReader();
                  reader.onload = () => {
                    const dataUrl = reader.result; // base64 data URL
                    const newItem = {
                      id: `local-${Date.now()}`,
                      image_url: dataUrl,
                      caption: captionInput.value || '',
                      _local: true,
                    };
                    const next = [newItem, ...companyGallery];
                    setCompanyGallery(next);
                    if (localGalleryKey) localStorage.setItem(localGalleryKey, JSON.stringify(next));
                    fileInput.value = '';
                    captionInput.value = '';
                    setGalleryUploading(false);
                  };
                  reader.onerror = (e) => {
                    console.error('File read error', e);
                    setGalleryUploading(false);
                    alert('Failed to read file');
                  };
                  reader.readAsDataURL(file);
                  return; // early return; we'll unset uploading in onload/onerror
                } catch (err) {
                  console.error('Gallery upload failed', err?.response || err);
                  alert('Failed to upload image');
                } finally {
                  // no-op; handled in reader callbacks
                }
              }}
            >
              <input name="gallery_image" type="file" accept="image/*" className="input-field" />
              <input name="gallery_caption" type="text" className="input-field" placeholder="Caption (optional)" />
              <button disabled={galleryUploading} className="btn-primary">{galleryUploading ? 'Uploading...' : 'Add your work'}</button>
            </form>

            {companyGallery && companyGallery.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {companyGallery.map((item, idx) => (
                  <div key={item.id} className="relative">
                    <img
                      src={item.image_url || item.image}
                      alt={item.caption || 'work'}
                      className="w-full h-40 object-cover rounded cursor-pointer"
                      onClick={() => { setViewerIndex(idx); setViewerOpen(true); }}
                    />
                    {editingCaptionId === item.id ? (
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          className="input-field"
                          value={editingCaptionText}
                          onChange={(e) => setEditingCaptionText(e.target.value)}
                        />
                        <button
                          className="btn-primary"
                          onClick={async () => {
                            try {
                              let next = companyGallery.map((g) => g.id === item.id ? { ...g, caption: editingCaptionText } : g);
                              setCompanyGallery(next);
                              if (localGalleryKey) localStorage.setItem(localGalleryKey, JSON.stringify(next));
                              setEditingCaptionId(null);
                              setEditingCaptionText('');
                            } catch (e) { alert('Failed to save'); }
                          }}
                        >Save</button>
                        <button className="btn-secondary" onClick={() => { setEditingCaptionId(null); setEditingCaptionText(''); }}>Cancel</button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <div className="text-xs text-gray-600 truncate">{item.caption || 'No caption'}</div>
                        <div className="flex gap-2">
                          <button
                            className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                            onClick={() => { setEditingCaptionId(item.id); setEditingCaptionText(item.caption || ''); }}
                          >Edit</button>
                          <button
                            className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50"
                            onClick={async () => {
                              if (!confirm('Delete this image?')) return;
                              try {
                                const next = companyGallery.filter((g) => g.id !== item.id);
                                setCompanyGallery(next);
                                if (localGalleryKey) localStorage.setItem(localGalleryKey, JSON.stringify(next));
                              } catch (e) { alert('Failed to delete'); }
                            }}
                          >Delete</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No gallery items yet.</p>
            )}
          </div>
        )}

        {/* Maid Profile Card */}
        {isMaid && maidProfile && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8 transition-all hover:shadow-md">
            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">My Profile</h3>
              <button
                onClick={async () => {
                  try {
                    const newStatus = !maidProfile.availability_status;
                    await maidAPI.updateMyProfile({ availability_status: newStatus });
                    setMaidProfile({ ...maidProfile, availability_status: newStatus });
                  } catch (error) { console.error(error); }
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${maidProfile.availability_status ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
              >
                {maidProfile.availability_status ? '● Available' : '● Unavailable'}
              </button>
            </div>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="relative flex-shrink-0">
                  <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-gray-100">
                    {maidProfile.profile_photo ? (
                      <img
                        src={maidProfile.profile_photo}
                        alt={maidProfile.full_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400 bg-gray-50">
                        <User className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{maidProfile.full_name || user?.username}</h2>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {maidProfile.category === 'live_in' ? 'Live-in Maid' : maidProfile.category === 'placement' ? 'Domestic Staff Placement' : 'Temporary Maid'}
                        </span>
                        {maidProfile.experience_years > 0 && (
                          <span>• {maidProfile.experience_years} years exp.</span>
                        )}
                        {maidProfile.user?.gender && (
                          <span>• {maidProfile.user.gender}</span>
                        )}
                        {typeof maidAge === 'number' && maidAge > 0 && (
                          <span>• {maidAge} yrs</span>
                        )}
                        {maidProfile.is_verified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Verified Account
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => navigate('/my-profile')} className="btn-secondary text-sm py-2 px-4">View Public Profile</button>
                      <button onClick={() => navigate('/profile-settings')} className="btn-primary text-sm py-2 px-4">Edit Profile</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm text-primary-600 border border-gray-100">
                        <Home className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Location</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{maidProfile.location || 'Not set'}</p>
                          {!maidProfile.location && (
                            <button
                              onClick={async () => {
                                if ('geolocation' in navigator) {
                                  navigator.geolocation.getCurrentPosition(async (position) => {
                                    const { latitude, longitude } = position.coords;
                                    try {
                                      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                                      const data = await response.json();
                                      const location = data.address.city || data.address.town || data.address.county || 'Unknown location';
                                      await maidAPI.updateMyProfile({ location, latitude: latitude.toFixed(6), longitude: longitude.toFixed(6) });
                                      setMaidProfile({ ...maidProfile, location, latitude, longitude });
                                    } catch (error) { console.error(error); }
                                  },
                                    (error) => alert('Unable to get location.')
                                  );
                                }
                              }}
                              className="text-xs text-primary-600 hover:underline"
                            >Detect</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Homeowner Profile Card */}
        {isHomeowner && currentUser && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8 transition-all hover:shadow-md">
            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">My Household</h3>
              {homeownerProfile && (
                homeownerProfile.is_verified ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
                    <Shield className="h-3.5 w-3.5" /> Not Verified
                  </span>
                )
              )}
            </div>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Profile Image */}
                <div className="relative flex-shrink-0">
                  <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-gray-100">
                    {currentUser.profile_picture ? (
                      <img
                        src={currentUser.profile_picture}
                        alt={currentUser.full_name || currentUser.username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400 bg-gray-50">
                        <Home className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                </div>

        {/* Homeowner: Job Responses Modal */}
        {isHomeowner && showJobResponsesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Responses</h3>
                  {jobResponsesFor && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      For: {jobResponsesFor.title} — {jobResponsesFor.job_date} {jobResponsesFor.location && `• ${jobResponsesFor.location}`}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    setShowJobResponsesModal(false);
                    setJobResponsesFor(null);
                    setJobResponses([]);
                  }}
                >
                  ✕
                </button>
              </div>
              <div className="px-5 py-4">
                {jobResponsesLoading ? (
                  <p className="text-sm text-gray-500">Loading responses...</p>
                ) : jobResponses && jobResponses.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {jobResponses.map((app) => {
                      const maid = app.maid;
                      const company = app.cleaning_company;
                      const nurse = app.nurse;

                      return (
                        <li key={app.id} className="py-3 flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              {maid?.profile_photo && (
                                <img
                                  src={maid.profile_photo}
                                  alt={maid.full_name || maid.username || 'Maid'}
                                  className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                />
                              )}
                              {company?.display_photo_url && (
                                <img
                                  src={company.display_photo_url}
                                  alt={company.company_name || company.username || 'Cleaning company'}
                                  className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                />
                              )}
                              {nurse?.display_photo && (
                                <img
                                  src={nurse.display_photo}
                                  alt={nurse.username || 'Home nurse'}
                                  className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                />
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {maid?.full_name || maid?.username || company?.company_name || company?.username || nurse?.username || 'Applicant'}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                                  {maid?.gender && <span>{maid.gender}</span>}
                                  {maid?.age && <span>• {maid.age} yrs</span>}
                                  {maid?.location && <span>• {maid.location}</span>}
                                  {typeof maid?.rating === 'number' && (
                                    <span>• Rating: {maid.rating.toFixed ? maid.rating.toFixed(1) : maid.rating}/5</span>
                                  )}
                                  {typeof maid?.total_jobs_completed === 'number' && (
                                    <span>• Jobs: {maid.total_jobs_completed}</span>
                                  )}
                                  {company?.location && <span>{company.location}</span>}
                                  {nurse?.location && <span>{nurse.location}</span>}
                                </div>
                                {maid?.skills && (
                                  <p className="text-[11px] text-gray-500 mt-1">
                                    Services offered: {maid.skills}
                                  </p>
                                )}
                                {company?.service_pricing && (
                                  <p className="text-[11px] text-gray-500 mt-1">
                                    Services offered: {company.service_pricing}
                                  </p>
                                )}
                                {nurse?.service_pricing && (
                                  <p className="text-[11px] text-gray-500 mt-1">
                                    Services offered: {nurse.service_pricing}
                                  </p>
                                )}
                                {app.proposed_rate && (
                                  <p className="text-xs text-gray-600 mt-0.5">
                                    Proposed pay: UGX {app.proposed_rate}
                                  </p>
                                )}
                                {app.cover_letter && (
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                    {app.cover_letter}
                                  </p>
                                )}
                                {app.status && (
                                  <p className="text-[11px] text-gray-500 mt-0.5">Status: {app.status}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs text-gray-500">
                              {app.status === 'accepted' && (
                                <p className="text-xs text-green-700 font-medium">
                                  {maid && (
                                    <>Maid contact: {maid.phone_number || maid.user?.phone_number || maid.user?.email || 'Contact details on file'}</>
                                  )}
                                  {company && !maid && (
                                    <>Company contact: {company.phone_number || company.email || 'Contact details on file'}</>
                                  )}
                                  {nurse && !maid && !company && (
                                    <>Nurse contact: {nurse.phone_number || nurse.email || 'Contact details on file'}</>
                                  )}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className="px-3 py-1 rounded-full text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                                disabled={app.status === 'accepted'}
                                onClick={async () => {
                                  try {
                                    await applicationAPI.accept(app.id);
                                    await loadJobResponses(jobResponsesFor);
                                  } catch (err) {
                                    console.error('Failed to accept application', err);
                                    alert('Could not accept this application.');
                                  }
                                }}
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                                disabled={app.status === 'rejected'}
                                onClick={async () => {
                                  try {
                                    await applicationAPI.reject(app.id);
                                    await loadJobResponses(jobResponsesFor);
                                  } catch (err) {
                                    console.error('Failed to reject application', err);
                                    alert('Could not reject this application.');
                                  }
                                }}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No one has responded to this request yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

                {/* Info */}
                <div className="flex-1 w-full">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{currentUser.full_name || currentUser.username}</h2>
                      <p className="text-gray-500 flex items-center gap-1 mt-1 text-sm">
                        <Home className="h-4 w-4" />
                        {currentUser.address || 'Location not set'}
                      </p>
                    </div>
                    <div className="w-full sm:w-auto">
                      <button
                        onClick={() => navigate('/profile-settings')}
                        className="btn-secondary w-full sm:w-auto flex items-center justify-center text-sm py-2 px-4"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Profile
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                    {/* Home Type */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm text-primary-600 border border-gray-100">
                        <Home className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Home Type</p>
                        <p className="text-sm font-medium text-gray-900">
                          {homeownerProfile?.home_type ? homeownerProfile.home_type.charAt(0).toUpperCase() + homeownerProfile.home_type.slice(1) : 'Not set'}
                        </p>
                      </div>
                    </div>
                    {/* Rooms */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm text-secondary-600 border border-gray-100">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Rooms</p>
                        <p className="text-sm font-medium text-gray-900">{homeownerProfile?.number_of_rooms || 'Not set'} rooms</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {isMaid && (
            <>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Jobs Completed</p>
                    <p className="text-3xl font-bold text-gray-900">{Number(maidProfile?.total_jobs_completed || 0)}</p>
                  </div>
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <Briefcase className="w-8 h-8 text-primary-600" />
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Rating</p>
                    <p className="text-3xl font-bold text-gray-900">{Number(maidProfile?.rating || 0).toFixed(1)}</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <Star className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
              </div>
            </>
          )}
          {isAdmin && adminStats && (
            <>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Maids</p>
                    <p className="text-3xl font-bold text-gray-900">{adminStats.total_maids}</p>
                    <p className="text-xs text-gray-500 mt-1">Verified: {adminStats.verified_maids} • Not verified: {adminStats.unverified_maids}</p>
                  </div>
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <Users className="w-8 h-8 text-primary-600" />
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Homeowners</p>
                    <p className="text-3xl font-bold text-gray-900">{adminStats.total_homeowners}</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <Home className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Cleaning Companies</p>
                    <p className="text-3xl font-bold text-gray-900">{adminStats.total_cleaning_companies}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Users className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Home Nurses</p>
                    <p className="text-3xl font-bold text-gray-900">{adminStats.total_home_nurses}</p>
                  </div>
                  <div className="bg-pink-100 p-3 rounded-lg">
                    <Users className="w-8 h-8 text-pink-600" />
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Temporary Available</p>
                    <p className="text-3xl font-bold text-gray-900">{adminStats.temporary_available_maids}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Briefcase className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Live-in Available</p>
                    <p className="text-3xl font-bold text-gray-900">{adminStats.live_in_available_maids}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Home className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed Jobs</p>
                    <p className="text-3xl font-bold text-gray-900">{adminStats.completed_jobs}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Star className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Maid: Services Offered row (above Quick Actions) */}
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
                      <span
                        key={s}
                        className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                      >
                        {s}
                        {rate ? ` (Starting Service fee: ${rate})` : ''}
                      </span>
                    );
                  })}
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                You have not added any services yet. Go to{' '}
                <button
                  type="button"
                  onClick={() => navigate('/profile-settings')}
                  className="text-primary-600 hover:underline"
                >
                  Profile Settings
                </button>{' '}
                to update your services.
              </p>
            )}
          </div>
        )}

        {/* Homeowner: My Service Requests */}
        {isHomeowner && (
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">My Service Requests</h3>
              <button
                type="button"
                onClick={reloadHomeownerJobs}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Refresh
              </button>
            </div>
            {homeownerJobsLoading ? (
              <p className="text-sm text-gray-500">Loading your requests...</p>
            ) : homeownerJobs && homeownerJobs.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {homeownerJobs.map((job) => (
                  <li
                    key={job.id}
                    className="py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 px-2 rounded"
                    onClick={() => openEditJob(job)}
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{job.title}</p>
                      {job.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{job.description}</p>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        {job.job_date && <span>{job.job_date}</span>}
                        {job.start_time && job.end_time && (
                          <span>• {job.start_time} - {job.end_time}</span>
                        )}
                        {job.location && <span>• {job.location}</span>}
                        {job.hourly_rate != null && (
                          <span>• Service pay: UGX {job.hourly_rate}</span>
                        )}
                        {job.status && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[11px] font-medium">
                            {job.status}
                          </span>
                        )}
                        {isHomeowner && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              loadJobResponses(job);
                            }}
                            className="text-[11px] font-medium text-primary-600 hover:text-primary-700 underline ml-1"
                          >
                            View responses
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                You have not posted any jobs or scheduled services yet. Use the <span className="font-medium">Post/Schedule Service</span> button below to create your first request.
              </p>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {isHomeowner && (
              <>
                <button
                  onClick={() => setShowServiceModal(true)}
                  className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200 group"
                >
                  <Briefcase className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Post/Schedule Service</p>
                </button>
                <button onClick={() => navigate('/find-maids')} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200 group">
                  <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Find Maids</p>
                </button>
                <button onClick={() => navigate('/find-cleaning-companies')} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200 group">
                  <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Find Cleaning Companies</p>
                </button>
                <button onClick={() => navigate('/find-home-nurses')} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200 group">
                  <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Find Home Nurses</p>
                </button>
                <button onClick={() => navigate('/my-reviews')} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200 group">
                  <Star className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">My Reviews</p>
                </button>
                <button
                  onClick={() => navigate('/homeowner-profile-settings')}
                  className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200 group"
                >
                  <Settings className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Settings</p>
                </button>
              </>
            )}

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
                <button onClick={() => navigate('/my-reviews')} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200 group">
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
              </>
            )}

            {isAdmin && (
              <>
                <button
                  onClick={() => navigate('/manage-maids')}
                  className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200 group"
                >
                  <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Manage Maids</p>
                </button>
                <button
                  onClick={() => navigate('/manage-homeowners')}
                  className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200 group"
                >
                  <Home className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Manage Homeowners</p>
                </button>
                <button
                  onClick={() => navigate('/manage-cleaning-companies')}
                  className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200 group"
                >
                  <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Manage Cleaning Companies</p>
                </button>
                <button
                  onClick={() => navigate('/manage-home-nurses')}
                  className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200 group"
                >
                  <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Manage Home Nurses</p>
                </button>
                <button onClick={onExportMaids} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200 group">
                  <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Export Maids (CSV)</p>
                </button>
                <button onClick={onExportHomeowners} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200 group">
                  <Home className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Export Homeowners (CSV)</p>
                </button>
              </>
            )}

            {user?.user_type === 'cleaning_company' && (
              <>
                <button
                  onClick={async () => {
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
              </>
            )}

            {isHomeNurse && (
              <>
                <button
                  onClick={async () => {
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
              </>
            )}
          </div>
        </div>

        {/* Homeowner: Post/Schedule Service Modal */}
        {isHomeowner && showServiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Post / Schedule Service</h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    setShowServiceModal(false);
                    setEditingJobId(null);
                    setEditingJobKind(null);
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="px-5 pt-4">
                <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1 text-xs mb-4">
                  <button
                    type="button"
                    onClick={() => setServiceTab('post')}
                    className={`px-3 py-1 rounded-full ${serviceTab === 'post' ? 'bg-primary-600 text-white' : 'text-gray-700'}`}
                  >
                    Post Job (live-in maid)
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceTab('schedule')}
                    className={`px-3 py-1 rounded-full ${serviceTab === 'schedule' ? 'bg-primary-600 text-white' : 'text-gray-700'}`}
                  >
                    Schedule Service
                  </button>
                </div>
              </div>

              {serviceTab === 'post' ? (
                <form onSubmit={handleCreatePostJob} className="px-5 pb-5 space-y-4">
                  <p className="text-xs text-gray-500">
                    Describe the kind of live-in maid you are looking for (experience, age, language,
                    duties, working hours, days off, etc.). This will be visible to maids.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                      <select
                        className="input-field"
                        value={postJobForm.service_target}
                        onChange={(e) => setPostJobForm({ ...postJobForm, service_target: e.target.value })}
                      >
                        <option value="maid">Maid</option>
                        <option value="cleaning_company">Cleaning company</option>
                        <option value="home_nurse">Home nurse</option>
                      </select>
                    </div>
                    <div className="hidden sm:block"></div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      rows="4"
                      className="input-field"
                      placeholder="Describe the maid you are looking for..."
                      value={postJobForm.description}
                      onChange={(e) => setPostJobForm({ ...postJobForm, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preferred date</label>
                      <input
                        type="date"
                        className="input-field"
                        value={postJobForm.job_date}
                        onChange={(e) => setPostJobForm({ ...postJobForm, job_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Your location</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Kampala, Ntinda"
                        value={postJobForm.location}
                        onChange={(e) => setPostJobForm({ ...postJobForm, location: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">What you can pay</label>
                    <input
                      type="number"
                      min="0"
                      className="input-field"
                      placeholder="Amount in UGX"
                      value={postJobForm.rate}
                      onChange={(e) => setPostJobForm({ ...postJobForm, rate: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowServiceModal(false)}
                      disabled={submittingService}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={submittingService}
                    >
                      {submittingService ? 'Submitting...' : 'Post Job'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCreateScheduledService} className="px-5 pb-5 space-y-4">
                  <p className="text-xs text-gray-500">
                    Schedule a one-off home service (e.g. deep cleaning, laundry, babysitting). We will
                    share this request with available maids.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service for</label>
                      <select
                        className="input-field"
                        value={scheduleForm.service_target}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, service_target: e.target.value })}
                      >
                        <option value="maid">Maid</option>
                        <option value="cleaning_company">Cleaning company</option>
                        <option value="home_nurse">Home nurse</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type of service</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Deep cleaning, Laundry"
                        value={scheduleForm.service_title}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, service_title: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional details (optional)</label>
                    <textarea
                      rows="3"
                      className="input-field"
                      placeholder="Any special instructions for this visit..."
                      value={scheduleForm.description}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        className="input-field"
                        value={scheduleForm.job_date}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, job_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Your location</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Kampala, Ntinda"
                        value={scheduleForm.location}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start time</label>
                      <input
                        type="time"
                        className="input-field"
                        value={scheduleForm.start_time}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End time</label>
                      <input
                        type="time"
                        className="input-field"
                        value={scheduleForm.end_time}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">What you can pay</label>
                      <input
                        type="number"
                        min="0"
                        className="input-field"
                        placeholder="Amount in UGX"
                        value={scheduleForm.rate}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, rate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowServiceModal(false)}
                      disabled={submittingService}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={submittingService}
                    >
                      {submittingService ? 'Submitting...' : 'Schedule Service'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="card mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
          {isMaid ? (
            recentClients && recentClients.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {recentClients.map((c, idx) => (
                  <li
                    key={idx}
                    className="py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 px-2 rounded"
                    onClick={() => { setSelectedClient(c); setShowClientModal(true); }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                        {(c.full_name || c.username || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">{c.full_name || c.username}</p>
                        <p className="text-xs text-gray-500">Closed a job • {c.created_at ? new Date(c.created_at).toLocaleString() : ''}</p>
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
            )
          ) : isHomeowner ? (
            recentMaids && recentMaids.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {recentMaids.map((m, idx) => (
                  <li key={idx} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                        {(m.full_name || m.username || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">{m.full_name || m.username}</p>
                        <p className="text-xs text-gray-500">Worked together on {m.created_at ? new Date(m.created_at).toLocaleString() : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          navigate(`/find-maids?maidId=${m.maid_id}`);
                        }}
                      >Re-contact Maid</button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No recent activity</p>
                <p className="text-sm mt-2">Your activity will appear here</p>
              </div>
            )
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No recent activity</p>
              <p className="text-sm mt-2">Your activity will appear here</p>
            </div>
          )}
        </div>
        {/* Homeowner brief modal */}
        {showClientModal && selectedClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg">
              <div className="flex items-center justify-between p-4 border-b">
                <h4 className="text-lg font-semibold">Homeowner Details</h4>
                <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowClientModal(false)}>✕</button>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                    {(selectedClient.full_name || selectedClient.username || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">{selectedClient.full_name || selectedClient.username}</p>
                    <p className="text-xs text-gray-500">Worked together on {selectedClient.created_at ? new Date(selectedClient.created_at).toLocaleString() : ''}</p>
                  </div>
                </div>
                {selectedClient.home_address && (
                  <p className="text-sm text-gray-700"><span className="font-medium">Address:</span> {selectedClient.home_address}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-700">
                  {selectedClient.home_type && <span><span className="font-medium">Home:</span> {selectedClient.home_type}</span>}
                  {selectedClient.number_of_rooms && <span>• {selectedClient.number_of_rooms} rooms</span>}
                  {selectedClient.is_verified && <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Verified</span>}
                </div>
              </div>
              <div className="p-4 border-t flex flex-col sm:flex-row justify-end gap-2">
                <button
                  className="btn-secondary w-full sm:w-auto"
                  onClick={() => {
                    const subject = encodeURIComponent(`Support: homeowner ${selectedClient.username}`);
                    const body = encodeURIComponent(`Hello Support,\n\nI need help regarding homeowner ${selectedClient.full_name || selectedClient.username}.\nClosed on: ${selectedClient.created_at ? new Date(selectedClient.created_at).toLocaleString() : ''}.\n\nThanks.`);
                    window.location.href = `mailto:support@maidmatch.local?subject=${subject}&body=${body}`;
                  }}
                >
                  Contact Support
                </button>
                <button
                  className="btn-primary w-full sm:w-auto"
                  onClick={() => { setShowHomeRating(true); }}
                >
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
                          {[1, 2, 3, 4, 5].map(n => (
                            <button key={`rc-${n}`} type="button" onClick={() => setRcRespect(n)} className="focus:outline-none" title={`${n} star${n > 1 ? 's' : ''}`}>
                              <Star className={`h-6 w-6 ${rcRespect >= n ? 'text-yellow-500' : 'text-gray-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-700 mb-1">Payment Timeliness</p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(n => (
                            <button key={`pay-${n}`} type="button" onClick={() => setRcPayment(n)} className="focus:outline-none" title={`${n} star${n > 1 ? 's' : ''}`}>
                              <Star className={`h-6 w-6 ${rcPayment >= n ? 'text-yellow-500' : 'text-gray-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-700 mb-1">Work Environment & Safety</p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(n => (
                            <button key={`safe-${n}`} type="button" onClick={() => setRcSafety(n)} className="focus:outline-none" title={`${n} star${n > 1 ? 's' : ''}`}>
                              <Star className={`h-6 w-6 ${rcSafety >= n ? 'text-yellow-500' : 'text-gray-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-700 mb-1">Fairness of Workload</p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(n => (
                            <button key={`fair-${n}`} type="button" onClick={() => setRcFairness(n)} className="focus:outline-none" title={`${n} star${n > 1 ? 's' : ''}`}>
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
                        onClick={() => { setShowHomeRating(false); setRcRespect(0); setRcPayment(0); setRcSafety(0); setRcFairness(0); setRcComment(''); }}
                      >Cancel</button>
                      <button
                        disabled={submittingHomeRating || [rcRespect, rcPayment, rcSafety, rcFairness].some(v => v === 0)}
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
                              comment: rcComment
                            });
                            setShowHomeRating(false);
                            setRcRespect(0); setRcPayment(0); setRcSafety(0); setRcFairness(0); setRcComment('');
                            alert('Thanks for your review!');
                          } catch (e) {
                            console.error('Failed to submit homeowner review', e);
                            const serverMsg = e?.response?.data ? (typeof e.response.data === 'string' ? e.response.data : JSON.stringify(e.response.data)) : '';
                            alert(`Failed to submit review. ${serverMsg}`);
                          } finally {
                            setSubmittingHomeRating(false);
                          }
                        }}
                      >{submittingHomeRating ? 'Submitting...' : 'Submit Review'}</button>
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

export default Dashboard;
