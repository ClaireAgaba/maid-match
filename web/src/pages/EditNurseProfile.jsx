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
    council_registration_number: '',
    years_of_experience: 0,
    preferred_working_hours: '',
    emergency_availability: false,
    location: '',
    services: [],
    display_photo: null,
    date_of_birth: '',
  });
  const [categories, setCategories] = useState(null);

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
            council_registration_number: p.council_registration_number || '',
            years_of_experience: p.years_of_experience || 0,
            preferred_working_hours: p.preferred_working_hours || '',
            emergency_availability: !!p.emergency_availability,
            location: p.location || '',
            services: Array.isArray(p.services) ? p.services.map(s=>s.id) : [],
            display_photo: null,
            date_of_birth: p.date_of_birth || '',
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

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const fd = new FormData();
      if (form.nursing_level) fd.append('nursing_level', form.nursing_level);
      if (form.council_registration_number) fd.append('council_registration_number', form.council_registration_number);
      fd.append('years_of_experience', String(Number(form.years_of_experience || 0)));
      if (form.preferred_working_hours) fd.append('preferred_working_hours', form.preferred_working_hours);
      fd.append('emergency_availability', form.emergency_availability ? 'true' : 'false');
      if (form.location) fd.append('location', form.location);
      (form.services || []).forEach((id) => fd.append('services', id));
      if (form.display_photo) fd.append('display_photo', form.display_photo);
      if (form.date_of_birth) fd.append('date_of_birth', form.date_of_birth);
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
          <div>
            <label className="block text-sm text-gray-700 mb-1">Date of Birth</label>
            <input type="date" className="input-field" value={form.date_of_birth} onChange={e=>setForm({...form, date_of_birth: e.target.value})} />
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {items.map((it) => (
                      <label key={it.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.services.includes(it.id)}
                          onChange={() => {
                            const set = new Set(form.services);
                            if (set.has(it.id)) set.delete(it.id); else set.add(it.id);
                            setForm({...form, services: Array.from(set)});
                          }}
                        />
                        <span className="text-sm">{it.name}</span>
                      </label>
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
