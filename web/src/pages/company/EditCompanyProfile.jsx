import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cleaningCompanyAPI, authAPI } from '../../services/api';

const EditCompanyProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [cats, setCats] = useState(null);
  const [saving, setSaving] = useState(false);
  // Local map of per-service starting pay, keyed by service name
  const [serviceRates, setServiceRates] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const me = await cleaningCompanyAPI.me();
        setProfile(me.data);
        // Parse existing service_pricing into the local map
        const raw = String(me.data?.service_pricing || '');
        const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const map = {};
        lines.forEach(line => {
          const idx = line.indexOf(':');
          if (idx !== -1) {
            const name = line.slice(0, idx).trim();
            const value = line.slice(idx + 1).trim();
            if (name) map[name] = value;
          }
        });
        setServiceRates(map);
      } catch {}
      try {
        const cg = await cleaningCompanyAPI.categoriesGrouped();
        setCats(cg.data);
      } catch {}
    };
    load();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const company_name = form.company_name.value.trim();
    const location = form.location.value.trim();
    const services = Array.from(form.querySelectorAll('input[name="svc"]:checked')).map(el => Number(el.value));
    const idDocumentFile = form.id_document?.files?.[0] || null;

    // Build service_pricing from selected services and serviceRates
    let service_pricing;
    if (cats && services.length > 0) {
      const idToName = {};
      Object.values(cats).forEach(items => {
        items.forEach(it => {
          idToName[it.id] = it.name;
        });
      });
      const lines = [];
      services.forEach((id) => {
        const name = idToName[id];
        const rate = name ? serviceRates[name] : null;
        if (name && rate && rate.trim().length > 0) {
          lines.push(`${name}: ${rate.trim()}`);
        }
      });
      if (lines.length > 0) {
        service_pricing = lines.join('\n');
      }
    }

    const fd = new FormData();
    fd.append('company_name', company_name);
    fd.append('location', location);
    services.forEach((id) => fd.append('services', id));
    if (service_pricing) fd.append('service_pricing', service_pricing);
    if (idDocumentFile) fd.append('id_document', idDocumentFile);

    setSaving(true);
    try {
      await authAPI.getCsrfToken();
      await cleaningCompanyAPI.meUpdate(fd);
      navigate('/company/profile');
    } catch (err) {
      alert('Failed to update company');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return (
    <div className="max-w-5xl mx-auto p-6 safe-top-8">
      <h1 className="text-2xl font-semibold mb-4">Edit Company Profile</h1>
      <p className="text-gray-600">Loading...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 safe-top-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Company Profile</h1>
        <button className="btn-secondary" onClick={() => navigate('/company/profile')}>Cancel</button>
      </div>

      <form className="card space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Company Name</label>
            <input name="company_name" className="input-field" defaultValue={profile.company_name} placeholder="Company name" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input name="location" className="input-field" defaultValue={profile.location} placeholder="Location" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Company ID / Registration document</label>
            {profile.id_document && (
              <p className="text-xs text-gray-600 mb-1">
                Current document:{' '}
                <a
                  href={profile.id_document}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-800 underline"
                >
                  View document
                </a>
              </p>
            )}
            <input
              type="file"
              name="id_document"
              className="block w-full text-sm text-gray-700"
              accept=".pdf,.jpg,.jpeg,.png,.heic,.heif"
            />
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Services</div>
          {cats ? (
            Object.entries(cats).map(([groupLabel, items]) => (
              <div key={groupLabel} className="mb-3">
                <div className="font-semibold text-sm mb-1">{groupLabel}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {items.map((item) => {
                    const checked = Array.isArray(profile.services) && profile.services.find(s => s.id === item.id);
                    return (
                      <div key={item.id} className="flex flex-col gap-1">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" name="svc" value={item.id} defaultChecked={!!checked} />
                          <span className="text-sm">{item.name}</span>
                        </label>
                        <input
                          type="text"
                          className="input-field text-xs"
                          placeholder="Starting pay for this service (optional)"
                          defaultValue={serviceRates[item.name] || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setServiceRates((prev) => ({ ...prev, [item.name]: value }));
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">Loading categories...</p>
          )}
        </div>

        <div>
          <button disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  );
};

export default EditCompanyProfile;
