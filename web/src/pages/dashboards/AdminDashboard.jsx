import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { cleaningCompanyAPI, homeNursingAPI, homeownerAPI, maidAPI } from '../../services/api';
import { HelpCircle, Home, Search, TrendingUp, Users } from 'lucide-react';
import Dashboard from '../Dashboard';

export const AdminDashboardV2 = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [adminStats, setAdminStats] = useState(null);
  const [directoryRows, setDirectoryRows] = useState([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryTypeFilter, setDirectoryTypeFilter] = useState('all');
  const [directoryPage, setDirectoryPage] = useState(1);

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
    } catch {
      alert('Failed to export maids');
    }
  };

  const onExportHomeowners = async () => {
    try {
      const resp = await homeownerAPI.exportHomeowners();
      downloadBlob(resp.data, 'homeowners_export.csv');
    } catch {
      alert('Failed to export homeowners');
    }
  };

  const buildHomeownerPaymentStatus = (profile) => {
    if (!profile) return 'No plan';
    const type = profile.subscription_type || 'none';
    const expRaw = profile.subscription_expires_at;
    const hasLiveIn = !!profile.has_live_in_credit;
    if (type === 'none' && !hasLiveIn) return 'No active plan';
    if (type !== 'none' && expRaw) {
      const exp = new Date(expRaw);
      if (!Number.isNaN(exp.getTime()) && exp > new Date()) {
        return type === 'monthly' ? 'Monthly (active)' : 'Day pass (active)';
      }
      return 'Plan expired';
    }
    if (hasLiveIn) return 'Live-in credit available';
    return 'No active plan';
  };

  const loadAdminDirectory = async () => {
    if (!isAdmin) return;
    try {
      setDirectoryLoading(true);
      const [maidsResp, homeownersResp, companiesResp, nursesResp] = await Promise.all([
        maidAPI.getAll({ page_size: 200 }),
        homeownerAPI.getAll({ page_size: 200 }),
        cleaningCompanyAPI.adminList({ page_size: 200 }),
        homeNursingAPI.adminList({ page_size: 200 }),
      ]);

      const extractList = (resp) => {
        const data = resp?.data;
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.results)) return data.results;
        return [];
      };

      const maids = extractList(maidsResp).map((m) => {
        let age = null;
        if (m.date_of_birth) {
          const dob = new Date(m.date_of_birth);
          if (!Number.isNaN(dob.getTime())) {
            const today = new Date();
            age = today.getFullYear() - dob.getFullYear();
            const mdiff = today.getMonth() - dob.getMonth();
            if (mdiff < 0 || (mdiff === 0 && today.getDate() < dob.getDate())) age--;
          }
        }
        return {
          id: `maid-${m.id}`,
          name: m.full_name || m.user?.full_name || m.user?.username,
          age,
          gender: m.user?.gender || null,
          location: m.location || m.user?.address || '-',
          type: 'maid',
          paymentStatus: m.onboarding_fee_paid ? 'Onboarding fee paid' : 'Onboarding pending',
        };
      });

      const homeowners = extractList(homeownersResp).map((h) => ({
        id: `homeowner-${h.id}`,
        name: h.user?.full_name || h.user?.username,
        age: null,
        gender: h.user?.gender || null,
        location: h.user?.address || h.home_address || '-',
        type: 'homeowner',
        paymentStatus: buildHomeownerPaymentStatus(h),
      }));

      const companies = extractList(companiesResp).map((c) => ({
        id: `company-${c.id}`,
        name: c.company_name,
        age: null,
        gender: null,
        location: c.location || '-',
        type: 'cleaning_company',
        paymentStatus: 'N/A',
      }));

      const nurses = extractList(nursesResp).map((n) => {
        let age = null;
        if (n.date_of_birth) {
          const dob = new Date(n.date_of_birth);
          if (!Number.isNaN(dob.getTime())) {
            const today = new Date();
            age = today.getFullYear() - dob.getFullYear();
            const mdiff = today.getMonth() - dob.getMonth();
            if (mdiff < 0 || (mdiff === 0 && today.getDate() < dob.getDate())) age--;
          }
        }
        return {
          id: `nurse-${n.id}`,
          name: n.user?.full_name || n.user?.username,
          age,
          gender: n.gender || n.user?.gender || null,
          location: n.location || n.user?.address || '-',
          type: 'nurse',
          paymentStatus: 'N/A',
        };
      });

      setDirectoryRows([...maids, ...homeowners, ...companies, ...nurses]);
    } catch (e) {
      console.error('Failed to load admin directory', e);
      setDirectoryRows([]);
    } finally {
      setDirectoryLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    const fetchData = async () => {
      try {
        const resp = await maidAPI.adminStats();
        setAdminStats(resp.data);
      } catch (e) {
        console.error('Failed to load admin stats', e);
      }
      await loadAdminDirectory();
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const filteredDirectoryRows = (() => {
    let rows = Array.isArray(directoryRows) ? directoryRows : [];
    if (directoryTypeFilter !== 'all') {
      rows = rows.filter((r) => r.type === directoryTypeFilter);
    }
    if (directorySearch.trim()) {
      const term = directorySearch.trim().toLowerCase();
      rows = rows.filter((r) => {
        const name = (r.name || '').toLowerCase();
        const loc = (r.location || '').toLowerCase();
        return name.includes(term) || loc.includes(term);
      });
    }
    return rows;
  })();

  const directoryPageSize = 10;
  const directoryTotalPages = Math.max(1, Math.ceil(filteredDirectoryRows.length / directoryPageSize));
  const safeDirectoryPage = Math.min(directoryPage, directoryTotalPages);
  const directoryPageRows = filteredDirectoryRows.slice(
    (safeDirectoryPage - 1) * directoryPageSize,
    safeDirectoryPage * directoryPageSize,
  );

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar userProfile={user} notifications={[]} />

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
              <p className="text-lg text-gray-600 max-w-2xl">{isAdmin && 'Manage the MaidMatch platform.'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">People Directory</h3>
              <p className="text-xs text-gray-500">Browse everyone registered on MaidMatch.</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
              {Array.isArray(directoryRows) ? directoryRows.length : 0} people
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="relative w-full md:max-w-xs">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                className="input-field pl-9 text-sm"
                placeholder="Search by name or location..."
                value={directorySearch}
                onChange={(e) => {
                  setDirectorySearch(e.target.value);
                  setDirectoryPage(1);
                }}
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Type:</span>
              <select
                className="input-field text-xs w-40"
                value={directoryTypeFilter}
                onChange={(e) => {
                  setDirectoryTypeFilter(e.target.value);
                  setDirectoryPage(1);
                }}
              >
                <option value="all">All</option>
                <option value="maid">Maids</option>
                <option value="homeowner">Homeowners</option>
                <option value="cleaning_company">Cleaning companies</option>
                <option value="nurse">Home nurses</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2 font-semibold">Name</th>
                  <th className="px-4 py-2 font-semibold">Age</th>
                  <th className="px-4 py-2 font-semibold">Gender</th>
                  <th className="px-4 py-2 font-semibold">Location</th>
                  <th className="px-4 py-2 font-semibold">Type</th>
                  <th className="px-4 py-2 font-semibold">Payment status</th>
                </tr>
              </thead>
              <tbody>
                {directoryLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500 text-xs">
                      Loading directory...
                    </td>
                  </tr>
                ) : directoryPageRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500 text-xs">
                      No people found for this filter.
                    </td>
                  </tr>
                ) : (
                  directoryPageRows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t border-gray-50 hover:bg-gray-50/70 cursor-pointer"
                      onClick={() => {
                        if (row.type === 'maid') navigate('/manage-maids');
                        else if (row.type === 'homeowner') navigate('/manage-homeowners');
                        else if (row.type === 'cleaning_company') navigate('/manage-cleaning-companies');
                        else if (row.type === 'nurse') navigate('/manage-home-nurses');
                      }}
                    >
                      <td className="px-4 py-2 text-gray-900 font-medium whitespace-nowrap">{row.name || '-'}</td>
                      <td className="px-4 py-2 text-gray-700">{row.age ?? '-'}</td>
                      <td className="px-4 py-2 text-gray-700 capitalize">{row.gender || '-'}</td>
                      <td className="px-4 py-2 text-gray-700 max-w-xs truncate">{row.location || '-'}</td>
                      <td className="px-4 py-2 text-gray-700 capitalize">{row.type?.replace('_', ' ')}</td>
                      <td className="px-4 py-2 text-gray-700">{row.paymentStatus}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
            <div>Page {safeDirectoryPage} of {directoryTotalPages}</div>
            <div className="inline-flex gap-1">
              <button
                type="button"
                className="px-2 py-1 rounded border border-gray-200 bg-white disabled:opacity-40"
                disabled={safeDirectoryPage <= 1}
                onClick={() => setDirectoryPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <button
                type="button"
                className="px-2 py-1 rounded border border-gray-200 bg-white disabled:opacity-40"
                disabled={safeDirectoryPage >= directoryTotalPages}
                onClick={() => setDirectoryPage((p) => Math.min(directoryTotalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
            <button
              onClick={onExportMaids}
              className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200 group"
            >
              <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Export Maids (CSV)</p>
            </button>
            <button
              onClick={onExportHomeowners}
              className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200 group"
            >
              <Home className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Export Homeowners (CSV)</p>
            </button>
            <button
              onClick={() => navigate('/help-feedback')}
              className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200 group"
            >
              <HelpCircle className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Help &amp; Feedback</p>
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('admin-stats');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200 group"
            >
              <TrendingUp className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900">View Statistics</p>
            </button>
          </div>
        </div>

        <div id="admin-stats" className="card mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Platform Statistics</h3>
          <p className="text-xs text-gray-500 mb-4">High-level overview of people and activity on MaidMatch.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-xs font-medium text-gray-500 mb-1">Total maids</p>
              <p className="text-2xl font-bold text-gray-900">{adminStats?.total_maids ?? 0}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-xs font-medium text-gray-500 mb-1">Homeowners</p>
              <p className="text-2xl font-bold text-gray-900">{adminStats?.total_homeowners ?? 0}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-xs font-medium text-gray-500 mb-1">Cleaning companies</p>
              <p className="text-2xl font-bold text-gray-900">{adminStats?.total_cleaning_companies ?? 0}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-xs font-medium text-gray-500 mb-1">Home nurses</p>
              <p className="text-2xl font-bold text-gray-900">{adminStats?.total_home_nurses ?? 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="font-medium text-gray-900 mb-2">Maid verification</p>
              {(() => {
                const total = adminStats?.total_maids ?? 0;
                const verified = adminStats?.verified_maids ?? 0;
                const unverified = adminStats?.unverified_maids ?? Math.max(0, total - verified);
                const vPct = total > 0 ? Math.round((verified / total) * 100) : 0;
                const uPct = total > 0 ? 100 - vPct : 0;
                return (
                  <>
                    <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden mb-2">
                      <div className="h-full bg-emerald-500 inline-block" style={{ width: `${vPct}%` }} />
                      <div className="h-full bg-amber-400 inline-block" style={{ width: `${uPct}%` }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-600">
                      <span>
                        Verified: {verified} ({vPct}%)
                      </span>
                      <span>
                        Not verified: {unverified} ({uPct}%)
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="font-medium text-gray-900 mb-2">Available maids by category</p>
              {(() => {
                const liveIn = adminStats?.live_in_available_maids ?? 0;
                const temp = adminStats?.temporary_available_maids ?? 0;
                const maxVal = Math.max(liveIn, temp, 1);
                const lWidth = Math.round((liveIn / maxVal) * 100);
                const tWidth = Math.round((temp / maxVal) * 100);
                return (
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-[11px] text-gray-600">Live-in maids</span>
                        <span className="text-[11px] text-gray-700 font-medium">{liveIn}</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full bg-primary-500" style={{ width: `${lWidth}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-[11px] text-gray-600">Temporary maids</span>
                        <span className="text-[11px] text-gray-700 font-medium">{temp}</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full bg-secondary-500" style={{ width: `${tWidth}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="font-medium text-gray-900 mb-2">Jobs closed (all time)</p>
              <div className="flex items-end gap-1 h-20">
                {Array.from({ length: 10 }).map((_, idx) => {
                  const base = adminStats?.completed_jobs ?? 0;
                  const fraction = base > 0 ? (idx + 1) / 10 : 0.1;
                  const height = Math.max(10, Math.round(60 * fraction));
                  return <div key={idx} className="flex-1 bg-primary-100 rounded-t-sm" style={{ height: `${height}px` }} />;
                })}
              </div>
              <p className="mt-2 text-[11px] text-gray-600">
                Total closed jobs: <span className="font-semibold text-gray-900">{adminStats?.completed_jobs ?? 0}</span>
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="font-medium text-gray-900 mb-2">User mix</p>
              {(() => {
                const maids = adminStats?.total_maids ?? 0;
                const homeowners = adminStats?.total_homeowners ?? 0;
                const companies = adminStats?.total_cleaning_companies ?? 0;
                const nurses = adminStats?.total_home_nurses ?? 0;
                const total = Math.max(maids + homeowners + companies + nurses, 1);
                const parts = [
                  { label: 'Maids', value: maids, color: 'bg-primary-500' },
                  { label: 'Homeowners', value: homeowners, color: 'bg-emerald-500' },
                  { label: 'Cleaning companies', value: companies, color: 'bg-indigo-500' },
                  { label: 'Home nurses', value: nurses, color: 'bg-rose-500' },
                ];
                return (
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden flex">
                      {parts.map((p) => {
                        const pct = total > 0 ? (p.value / total) * 100 : 0;
                        return <div key={p.label} className={`${p.color} h-full`} style={{ width: `${pct}%` }} />;
                      })}
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[11px] text-gray-600">
                      {parts.map((p) => {
                        const pct = total > 0 ? Math.round((p.value / total) * 100) : 0;
                        return (
                          <div key={p.label} className="flex items-center gap-1">
                            <span className={`h-2 w-2 rounded-full ${p.color}`} />
                            <span>
                              {p.label}: {p.value} ({pct}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AdminDashboardLegacy = () => {
  return <Dashboard />;
};

const AdminDashboard = () => {
  return <AdminDashboardV2 />;
};

export default AdminDashboard;
