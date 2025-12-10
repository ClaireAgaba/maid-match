import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeNursingAPI } from '../services/api';

const EditNurseProfile = () => {
  const { isHomeNurse } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({
    nursing_level: '',
    gender: '',
    council_registration_number: '',
    years_of_experience: 0,
    preferred_working_hours: '',
    emergency_availability: false,
    location: '',
    services: [],
    display_photo: null,
    date_of_birth: '',
    service_pricing: '',
    id_document: null,
    nursing_certificate: null,
  });
  const [categories, setCategories] = useState(null);

  // Local map of per-category starting pay, derived from the
  // single service_pricing text field (one "Category: text" per line).
  const [categoryRates, setCategoryRates] = useState({});

  const [exists, setExists] = useState(true);

  useEffect(() => {
    if (!isHomeNurse) { navigate('/dashboard'); return; }
    (async () => {
      try {
        setLoading(true);
        try {
          const res = await homeNursingAPI.me();
          const p = res.data || {};
          setForm({
            nursing_level: p.nursing_level || '',
            gender: p.gender || '',
            council_registration_number: p.council_registration_number || '',
            years_of_experience: p.years_of_experience || 0,
            preferred_working_hours: p.preferred_working_hours || '',
            emergency_availability: !!p.emergency_availability,
            location: p.location || '',
            services: Array.isArray(p.services) ? p.services.map(s=>s.id) : [],
            display_photo: null,
            date_of_birth: p.date_of_birth || '',
            service_pricing: p.service_pricing || '',
            id_document: null,
            nursing_certificate: null,
          });
          setExists(true);
        } catch (e) {
          // 404 -> profile not created yet
          setExists(false);
        }
        // Load categories for multi-select
        try {
          const cat = await homeNursingAPI.categoriesGrouped();
          setCategories(cat.data || {});
        } catch {}
      } catch (e) {
        setErr('Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [isHomeNurse, navigate]);

  // Keep categoryRates in sync with the raw service_pricing text
  useEffect(() => {
    const raw = form.service_pricing || '';
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
    setCategoryRates(map);
  }, [form.service_pricing]);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const fd = new FormData();
      if (form.nursing_level) fd.append('nursing_level', form.nursing_level);
      if (form.gender) fd.append('gender', form.gender);
      if (form.council_registration_number) fd.append('council_registration_number', form.council_registration_number);
      fd.append('years_of_experience', String(Number(form.years_of_experience || 0)));
      if (form.preferred_working_hours) fd.append('preferred_working_hours', form.preferred_working_hours);
      fd.append('emergency_availability', form.emergency_availability ? 'true' : 'false');
      if (form.location) fd.append('location', form.location);
      (form.services || []).forEach((id) => fd.append('services', id));
      if (form.display_photo) fd.append('display_photo', form.display_photo);
      if (form.date_of_birth) fd.append('date_of_birth', form.date_of_birth);
      if (form.service_pricing) fd.append('service_pricing', form.service_pricing);
      if (form.id_document) fd.append('id_document', form.id_document);
      if (form.nursing_certificate) fd.append('nursing_certificate', form.nursing_certificate);
      if (exists) await homeNursingAPI.updateMe(fd); else await homeNursingAPI.register(fd);
      navigate('/nurse/profile');
    } catch (e) {
      setErr('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/nurse/profile')} className="text-gray-600 hover:text-gray-900">← Back</button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Nurse Profile</h1>
          <div />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {err && <div className="mb-4 p-3 rounded border border-red-300 bg-red-50 text-red-700 text-sm">{err}</div>}
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Display image */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">Display image</label>
            <input type="file" accept="image/*" className="input-field" onChange={(e)=> setForm({...form, display_photo: e.target.files?.[0] || null})} />
            {form.display_photo && (
              <p className="text-xs text-green-600 mt-1">Selected: {form.display_photo.name}</p>
            )}
          </div>
          {/* Documents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">ID Document (National ID, Passport, etc.)</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="input-field"
                onChange={(e) => setForm({ ...form, id_document: e.target.files?.[0] || null })}
              />
              {form.id_document && (
                <p className="text-xs text-green-600 mt-1">Selected: {form.id_document.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Nursing certificate / diploma</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="input-field"
                onChange={(e) => setForm({ ...form, nursing_certificate: e.target.files?.[0] || null })}
              />
              {form.nursing_certificate && (
                <p className="text-xs text-green-600 mt-1">Selected: {form.nursing_certificate.name}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Date of Birth</label>
            <input type="date" className="input-field" value={form.date_of_birth} onChange={e=>setForm({...form, date_of_birth: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Gender</label>
            <select
              className="input-field"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="">Select gender</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Nursing level</label>
            <select className="input-field" value={form.nursing_level} onChange={e=>setForm({...form, nursing_level: e.target.value})}>
              <option value="">Select level</option>
              <option value="enrolled">Enrolled Nurse</option>
              <option value="registered">Registered Nurse</option>
              <option value="midwife">Midwife</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Council registration number</label>
            <input className="input-field" value={form.council_registration_number} onChange={e=>setForm({...form, council_registration_number: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Years of experience</label>
            <input type="number" min="0" className="input-field" value={form.years_of_experience} onChange={e=>setForm({...form, years_of_experience: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Preferred working hours</label>
            <input className="input-field" value={form.preferred_working_hours} onChange={e=>setForm({...form, preferred_working_hours: e.target.value})} />
          </div>
          <div className="flex items-center gap-2">
            <input id="emerg" type="checkbox" checked={form.emergency_availability} onChange={e=>setForm({...form, emergency_availability: e.target.checked})} />
            <label htmlFor="emerg" className="text-sm text-gray-700">Available for emergencies</label>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Location</label>
            <input className="input-field" value={form.location} onChange={e=>setForm({...form, location: e.target.value})} />
          </div>
          {/* Services selector */}
          <div>
            <div className="block text-sm text-gray-700 mb-1">Select services</div>
            {!categories ? (
              <p className="text-sm text-gray-500">Loading categories...</p>
            ) : (
              Object.entries(categories).map(([group, items]) => (
                <div key={group} className="mb-3">
                  <div className="font-semibold text-sm mb-1">{group}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map((it) => (
                      <div key={it.id} className="flex flex-col gap-1">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={form.services.includes(it.id)}
                            onChange={() => {
                              const set = new Set(form.services);
                              if (set.has(it.id)) set.delete(it.id); else set.add(it.id);
                              const nextServices = Array.from(set);
                              // When services change, rebuild service_pricing to only
                              // include selected categories that have a rate.
                              setForm((prev) => {
                                const updated = { ...prev, services: nextServices };
                                if (!categories) return updated;
                                const lines = [];
                                Object.entries(categories).forEach(([_g, cats]) => {
                                  cats.forEach((cat) => {
                                    if (!nextServices.includes(cat.id)) return;
                                    const v = categoryRates[cat.name];
                                    if (v && v.trim().length > 0) {
                                      lines.push(`${cat.name}: ${v.trim()}`);
                                    }
                                  });
                                });
                                updated.service_pricing = lines.join('\n');
                                return updated;
                              });
                            }}
                          />
                          <span className="text-sm">{it.name}</span>
                        </label>
                        <input
                          type="text"
                          className="input-field text-xs"
                          placeholder="Starting pay for this category (optional)"
                          value={categoryRates[it.name] || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setCategoryRates((prev) => {
                              const next = { ...prev, [it.name]: value };
                              // Rebuild service_pricing: only selected categories with values
                              setForm((prevForm) => {
                                if (!categories) return { ...prevForm, service_pricing: '' };
                                const lines = [];
                                Object.entries(categories).forEach(([_g, cats]) => {
                                  cats.forEach((cat) => {
                                    if (!prevForm.services.includes(cat.id)) return;
                                    const v = next[cat.name];
                                    if (v && v.trim().length > 0) {
                                      lines.push(`${cat.name}: ${v.trim()}`);
                                    }
                                  });
                                });
                                return { ...prevForm, service_pricing: lines.join('\n') };
                              });
                              return next;
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="pt-2">
            <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditNurseProfile;
