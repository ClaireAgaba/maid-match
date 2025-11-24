import { useEffect, useState } from 'react';
import { reviewAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';

const MyReviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError('');
        const res = await reviewAPI.mine();
        const data = res.data;
        // Support both paginated { results: [...] } and array responses
        const items = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
        setReviews(items);
      } catch (e) {
        console.error('Failed to load reviews', e);
        setError('Failed to load reviews. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Reviews</h1>
            <p className="text-sm text-gray-600">What homeowners have written about you</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="card text-center py-12 text-gray-600">Loading reviews...</div>
        ) : error ? (
          <div className="card text-center py-12 text-red-600">{error}</div>
        ) : reviews.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600">You don't have any reviews yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-yellow-600">
                      <Star className="h-5 w-5"/>
                      <span className="font-semibold">{r.rating}.0</span>
                    </div>
                    {r.comment && (
                      <p className="mt-2 text-gray-800">{r.comment}</p>
                    )}
                    <p className="mt-2 text-sm text-gray-500">
                      By <span className="font-medium">{r.reviewer?.username || 'Homeowner'}</span>
                      {r.created_at ? ` • ${new Date(r.created_at).toLocaleString()}` : ''}
                      {r.job_title ? ` • Job: ${r.job_title}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReviews;
