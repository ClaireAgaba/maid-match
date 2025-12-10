import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { FileText, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const Legal = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar userProfile={user} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Legal</h1>
                <p className="text-sm text-gray-600">Read our terms, policies and other important legal information.</p>
              </div>
            </div>
            <Link
              to="/dashboard"
              className="text-xs font-medium text-primary-600 hover:text-primary-700 underline"
            >
              ← Back to dashboard
            </Link>
          </div>
          <div className="space-y-4 mt-2">
            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/60">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Terms &amp; Conditions</p>
                  <p className="text-xs text-gray-500">The rules for using MaidMatch as a homeowner, maid or provider.</p>
                </div>
              </div>
              <Link
                to="/terms"
                className="text-xs font-medium text-primary-600 hover:text-primary-700 underline"
              >
                View terms
              </Link>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/40">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Privacy Policy</p>
                  <p className="text-xs text-gray-500">How we handle your data. Coming soon — we will add details here.</p>
                </div>
              </div>
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Coming soon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Legal;
