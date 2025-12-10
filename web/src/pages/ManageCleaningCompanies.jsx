import React, { useEffect, useMemo, useState } from 'react';
import { cleaningCompanyAPI, authAPI } from '../services/api';
import { Search, ShieldCheck, Shield, Power, PowerOff, RefreshCcw } from 'lucide-react';

const ManageCleaningCompanies = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [counts, setCounts] = useState({ total: 0, verified: 0, unverified: 0, active: 0, disabled: 0 });

  // filters
  const [q, setQ] = useState('');
  const [verified, setVerified] = useState('all');
  const [active, setActive] = useState('all');

  // selection
  const [selected, setSelected] = useState([]);

  // detail modal
  const [selectedCompany, setSelectedCompany] = useState(null);

  // debounce search input
  const debouncedParams = useMemo(() => ({ q, verified, active, page }), [q, verified, active, page]);

  const load = async (params) => {
    setLoading(true);
    try {
      const res = await cleaningCompanyAPI.adminList({
        page: params.page,
        q: params.q || undefined,
        verified: params.verified !== 'all' ? params.verified : undefined,
        active: params.active !== 'all' ? params.active : undefined,
      });
      const data = res.data;
      const results = Array.isArray(data) ? data : (data.results || []);
      setItems(results);
      setHasNext(Boolean(data?.next));
      setHasPrev(Boolean(data?.previous));
      setTotalCount(typeof data?.count === 'number' ? data.count : results.length);
      if (data?.counts) setCounts(data.counts);
      setError('');
    } catch (e) {
      console.error(e);
      setItems([]);
      if (e?.response?.status === 403) setError('You need admin permissions to view this page.');
      else setError('Failed to load cleaning companies.');
    } finally {
      setLoading(false);
    }
  };

  // Helper: parse service_pricing into a map of service -> starting fee
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
    const id = setTimeout(() => load(debouncedParams), 250);
    return () => clearTimeout(id);
  }, [debouncedParams.q, debouncedParams.verified, debouncedParams.active, debouncedParams.page]);

  const allSelected = items.length > 0 && selected.length === items.map(i=>i.id).length;

  const toggleRow = (id, checked) => {
    setSelected((prev) => checked ? Array.from(new Set([...prev, id])) : prev.filter(x => x !== id));
  };

  const toggleAllOnPage = (checked) => {
    const pageIds = items.map(i => i.id);
    setSelected((prev) => checked ? Array.from(new Set([...prev, ...pageIds])) : prev.filter(id => !pageIds.includes(id)));
  };

  const bulk = async (payload) => {
    if (selected.length === 0) return;
    await authAPI.getCsrfToken();
    await cleaningCompanyAPI.adminBulk({ ids: selected, ...payload });
    setSelected([]);
    load(debouncedParams);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Manage Cleaning Companies</h1>
        <div className="flex gap-2">
          <a href="/dashboard" className="btn-secondary">← Back to Dashboard</a>
          <button className="btn-secondary inline-flex items-center" onClick={()=>load(debouncedParams)}>
            <RefreshCcw className="w-4 h-4 mr-1"/>Refresh
          </button>
        </div>

      {/* Company Details Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-lg">
            <div className="border-b px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Company Details</h2>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700 text-sm"
                onClick={() => setSelectedCompany(null)}
              >
                Close
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedCompany.company_name}</h3>
                <p className="text-sm text-gray-600">{selectedCompany.location || 'Location not set'}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded-full ${selectedCompany.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {selectedCompany.verified ? 'Verified' : 'Not Verified'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full ${selectedCompany.user_active ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {selectedCompany.user_active ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Services Offered</h4>
                {Array.isArray(selectedCompany.services) && selectedCompany.services.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedCompany.services.map((svc) => {
                      const rates = parseServiceRates(selectedCompany.service_pricing);
                      const rate = rates[svc.name];
                      return (
                        <span
                          key={svc.id}
                          className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                        >
                          {svc.name}
                          {rate ? ` (Starting Service fee: ${rate})` : ''}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">No services listed.</p>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Documents</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    Company ID / registration:{' '}
                    {selectedCompany.id_document ? (
                      <a
                        href={selectedCompany.id_document}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-800 underline"
                      >
                        View document
                      </a>
                    ) : (
                      <span className="text-gray-500">Not uploaded</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {error && <div className="mb-4 p-3 rounded border border-red-300 bg-red-50 text-red-700 text-sm">{error}</div>}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="p-4 bg-white rounded border"><div className="text-xs text-gray-500">Total</div><div className="text-2xl font-bold">{counts.total}</div></div>
        <div className="p-4 bg-white rounded border"><div className="text-xs text-gray-500 flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-green-600"/>Verified</div><div className="text-2xl font-bold">{counts.verified}</div></div>
        <div className="p-4 bg-white rounded border"><div className="text-xs text-gray-500 flex items-center gap-1"><Shield className="w-4 h-4 text-yellow-600"/>Not Verified</div><div className="text-2xl font-bold">{counts.unverified}</div></div>
        <div className="p-4 bg-white rounded border"><div className="text-xs text-gray-500 flex items-center gap-1"><Power className="w-4 h-4 text-blue-600"/>Active</div><div className="text-2xl font-bold">{counts.active}</div></div>
        <div className="p-4 bg-white rounded border"><div className="text-xs text-gray-500 flex items-center gap-1"><PowerOff className="w-4 h-4 text-red-600"/>Disabled</div><div className="text-2xl font-bold">{counts.disabled}</div></div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400"/>
          <input value={q} onChange={(e)=>{ setPage(1); setQ(e.target.value); }} placeholder="Search by company name" className="input-field pl-8"/>
        </div>
        <select className="input-field" value={verified} onChange={(e)=>{ setPage(1); setVerified(e.target.value); }}>
          <option value="all">All</option>
          <option value="true">Verified</option>
          <option value="false">Not Verified</option>
        </select>
        <select className="input-field" value={active} onChange={(e)=>{ setPage(1); setActive(e.target.value); }}>
          <option value="all">All</option>
          <option value="true">Active</option>
          <option value="false">Disabled</option>
        </select>
      </div>

      {/* Bulk actions */}
      <div className="flex flex-wrap gap-2 items-center mb-2">
        <span className="text-sm text-gray-600">Selected: {selected.length}</span>
        <button className="btn-secondary" disabled={selected.length===0} onClick={()=>bulk({ verified: true })}>Verify</button>
        <button className="btn-secondary" disabled={selected.length===0} onClick={()=>bulk({ verified: false })}>Unverify</button>
        <button className="btn-secondary" disabled={selected.length===0} onClick={()=>bulk({ enable: true })}>Enable</button>
        <button className="btn-secondary" disabled={selected.length===0} onClick={()=>bulk({ enable: false })}>Disable</button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3"><input type="checkbox" checked={allSelected} onChange={(e)=>toggleAllOnPage(e.target.checked)} /></th>
              <th className="text-left p-3">Company</th>
              <th className="text-left p-3">User</th>
              <th className="text-left p-3">Location</th>
              <th className="text-left p-3">Verified</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4" colSpan={7}>Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="p-4" colSpan={7}>No companies found.</td></tr>
            ) : (
              items.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-3"><input type="checkbox" checked={selected.includes(c.id)} onChange={(e)=>toggleRow(c.id, e.target.checked)} /></td>
                  <td className="p-3 font-medium">{c.company_name}</td>
                  <td className="p-3">{c.username}#{c.user_id}</td>
                  <td className="p-3">{c.location}</td>
                  <td className="p-3">{c.verified ? 'Yes' : 'No'}</td>
                  <td className="p-3">{c.user_active ? 'Active' : 'Disabled'}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      className="text-primary-600 hover:underline text-sm"
                      onClick={() => setSelectedCompany(c)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-3">
        <div className="text-sm text-gray-600">Total companies: {totalCount}</div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" disabled={!hasPrev} onClick={()=> setPage(p => Math.max(1, p-1))}>Prev</button>
          <span className="text-sm">Page {page}</span>
          <button className="btn-secondary" disabled={!hasNext} onClick={()=> setPage(p => p+1)}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default ManageCleaningCompanies;
