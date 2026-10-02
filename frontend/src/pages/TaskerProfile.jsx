import { sym } from '../utils/market';
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Star, CheckCircle, Phone, Calendar, Award, MessageSquare, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import SEO, { makeTaskerSchema } from '../components/seo/SEO';
import { taskersApi, tasksApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

function StarRow({ value }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} width={16} height={16} viewBox="0 0 24 24" fill={s <= Math.round(value) ? '#F5A623' : '#E5E7EB'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

export default function TaskerProfile() {
  const { id, username } = useParams();
  const [searchParams] = useSearchParams();
  const param = username || id;
  const { isAuthenticated, isRequester } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null); // { code, message } shown on the page
  const [applyOpen, setApplyOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
  const [applyForm, setApplyForm] = useState({
    title: '',
    description: '',
    task_city: '',
    task_state: '',
    deadline: tomorrow,
    budget: '',
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        setLoadError(null);
        const { data } = await taskersApi.get(param);
        setProfile(data.profile);
        // Show the permanent, readable address (e.g. /tasker/emmanuel-uduebholo)
        // even if the visitor arrived through an older id/username link.
        const slug = data.profile?.user?.profile_slug;
        if (slug && param !== slug) navigate(`/tasker/${slug}${window.location.search}`, { replace: true });
        setReviews(data.reviews || []);
        setReviewStats(data.review_stats || null);
        setRecentTasks(data.recentTasks || []);
      } catch (err) {
        // Show the real reason on the page (e.g. "not approved yet") instead of
        // a generic toast followed by an unexplained redirect.
        const status = err.response?.status;
        setProfile(null);
        setLoadError({
          code: err.response?.data?.code || (status ? String(status) : 'NETWORK'),
          message: err.response?.data?.message
            || (status ? 'We could not find this tasker.' : 'Could not load this profile. Please check your connection and try again.'),
        });
      } finally { setLoading(false); }
    };
    load();
  }, [param]);

  // Auto-open hire modal when user returns from login with ?hire=1
  useEffect(() => {
    if (isAuthenticated && isRequester && searchParams.get('hire') === '1' && !loading && profile) {
      setApplyOpen(true);
    }
  }, [isAuthenticated, isRequester, loading, profile]);

  const setField = (key, val) => setApplyForm(f => ({ ...f, [key]: val }));

  const handleApply = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/auth?redirect=/taskers/' + (username || id)); return; }
    if (!isRequester) { toast.error('Only requesters can hire taskers'); return; }
    if (!applyForm.title.trim())       { toast.error('Please enter a task title'); return; }
    if (!applyForm.description.trim()) { toast.error('Please describe the task'); return; }
    if (!applyForm.task_city.trim())   { toast.error('Please enter the task city'); return; }
    if (!applyForm.task_state.trim())  { toast.error('Please enter the state'); return; }
    if (!applyForm.deadline)           { toast.error('Please set a deadline'); return; }
    setApplying(true);
    try {
      await tasksApi.directHire({
        tasker_id: profile.user_id || profile.user?.id,
        title: applyForm.title.trim(),
        description: applyForm.description.trim(),
        task_city: applyForm.task_city.trim(),
        task_state: applyForm.task_state.trim(),
        deadline: new Date(applyForm.deadline).toISOString(),
        budget: applyForm.budget || null,
      });
      toast.success(`Task created and ${profile.user?.full_name} hired! Check your dashboard.`);
      setApplyOpen(false);
      navigate('/requester');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally { setApplying(false); }
  };

  if (loading) {
    return (
      <div className="pt-24 min-h-screen bg-surface">
        <div className="container-xl py-10">
          <div className="max-w-4xl mx-auto">
            <div className="card p-8 space-y-5">
              <div className="flex gap-6">
                <div className="skeleton w-24 h-24 rounded-3xl" />
                <div className="flex-1 space-y-3">
                  <div className="skeleton h-6 w-1/2" />
                  <div className="skeleton h-4 w-1/3" />
                  <div className="skeleton h-4 w-2/3" />
                </div>
              </div>
              <div className="skeleton h-20 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    if (!loadError) return null;
    return (
      <div className="pt-24 min-h-screen bg-surface">
        <div className="container-xl py-16">
          <div className="max-w-lg mx-auto card p-8 text-center">
            <p className="font-heading font-bold text-xl text-gray-900 mb-2">
              {loadError.code === 'NOT_APPROVED' ? 'Profile not public yet' : 'Tasker not found'}
            </p>
            <p className="text-sm text-gray-500 mb-6">{loadError.message}</p>
            <Link to="/taskers" className="btn-primary btn-sm">Browse taskers</Link>
          </div>
        </div>
      </div>
    );
  }
  const user = profile.user;
  const ratingVal = parseFloat(profile.rating_average) || 0;

  // Rating distribution
  // Uses the server's breakdown over ALL reviews when available; falls back
  // to the reviews loaded on the page.
  const ratingDist = [5,4,3,2,1].map((star) => {
    if (reviewStats?.count) {
      const count = reviewStats.distribution.find((d) => d.star === star)?.count || 0;
      return { star, count, pct: (count / reviewStats.count) * 100 };
    }
    const count = reviews.filter((r) => r.rating === star).length;
    return { star, count, pct: reviews.length ? (count / reviews.length) * 100 : 0 };
  });

  return (
    <>
      <SEO
        title={profile ? `${profile.user?.full_name} | Verified Tasker in ${profile.task_city}` : 'Tasker Profile'}
        description={profile ? `Hire ${profile.user?.full_name}, a verified tasker in ${profile.task_city}, ${profile.task_state}. ${parseFloat(profile.rating_average||0).toFixed(1)} rating · ${profile.total_tasks_completed} tasks completed.` : 'View tasker profile on Taskeeu.'}
        canonical={profile ? (profile.user?.profile_slug ? `https://taskeeu.com/tasker/${profile.user.profile_slug}` : `https://taskeeu.com/taskers/${profile.user_id}`) : undefined}
        structuredData={profile ? makeTaskerSchema(profile) : null}
        noindex={false}
      />
    <div className="pt-20 min-h-screen bg-surface">
      <div className="container-xl py-10">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Profile Card */}
          <div className="card overflow-visible">
            {/* Cover gradient */}
            <div className="h-28 bg-gradient-to-br from-rose-600 to-rose-400 rounded-t-2xl relative">
              <div className="absolute -bottom-10 left-8">
                <div className="w-20 h-20 rounded-3xl border-4 border-white bg-rose-100 overflow-hidden shadow-lg">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-rose-600 font-bold text-3xl">
                      {user?.full_name?.[0]}
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute top-4 right-4">
                {profile.is_available ? (
                  <span className="badge bg-white/20 text-white border border-white/30">Available</span>
                ) : (
                  <span className="badge bg-white/10 text-white/70 border border-white/20">Unavailable</span>
                )}
              </div>
            </div>

            <div className="pt-14 pb-6 px-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-heading text-2xl font-bold text-dark">{user?.full_name}</h1>
                    <span className="badge-green">Verified Tasker</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <div className="flex items-center gap-1 text-muted text-sm">
                      <MapPin size={14} className="text-rose-500" />
                      {profile.task_city}, {profile.task_state}
                    </div>
                    <div className="flex items-center gap-1">
                      <StarRow value={ratingVal} />
                      <span className="text-sm font-semibold text-gray-700">{ratingVal.toFixed(1)}</span>
                      <span className="text-sm text-muted">({profile.total_ratings} reviews)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted">
                    <span className="flex items-center gap-1">
                      <CheckCircle size={14} className="text-rose-500" />
                      {profile.total_tasks_completed} tasks completed
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      Joined {(profile.created_at ? format(new Date(profile.created_at), 'MMM yyyy') : 'Unknown')}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:items-end">
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        navigate('/requester/login?redirect=' + encodeURIComponent('/taskers/' + param + '?hire=1'));
                      } else if (!isRequester) {
                        toast.error('Only requesters can hire taskers');
                      } else {
                        setApplyOpen(true);
                      }
                    }}
                    className="btn-primary">Hire This Tasker
                  </button>
                  <Link to="/tasks?post=1" className="btn-outline btn-sm text-center">Post a Task Instead
                  </Link>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <div className="mt-5 p-4 bg-surface rounded-2xl">
                  <p className="text-gray-700 text-sm leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {/* Skills */}
              {profile.skills?.length > 0 && (
                <div className="mt-5">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Skills & Services</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <span key={skill} className="badge-gray capitalize">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { emoji: '', value: profile.total_tasks_completed, label: 'Tasks Done' },
              { emoji: '', value: ratingVal.toFixed(1), label: 'Avg Rating' },
              { emoji: '', value: profile.total_ratings, label: 'Reviews' },
            ].map((s) => (
              <div key={s.label} className="card p-5 text-center">
                <div className="text-2xl mb-1">{s.emoji}</div>
                <p className="font-heading font-bold text-2xl text-dark">{s.value}</p>
                <p className="text-xs text-muted mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Reviews */}
          <div className="card p-6">
            <h2 className="font-heading font-bold text-lg text-dark mb-5">Reviews & Ratings</h2>

            {reviews.length === 0 ? (
              <div className="empty-state py-8">
                <div className="text-4xl mb-2"></div>
                <p className="text-muted text-sm">No reviews yet. Be the first!</p>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-6">
                {/* Rating breakdown */}
                <div className="md:w-48 flex-shrink-0">
                  <div className="text-center mb-4">
                    <p className="font-heading font-bold text-5xl text-dark">{ratingVal.toFixed(1)}</p>
                    <StarRow value={ratingVal} />
                    <p className="text-xs text-muted mt-1">{profile.total_ratings} reviews</p>
                  </div>
                  <div className="space-y-1.5">
                    {ratingDist.map((d) => (
                      <div key={d.star} className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500 w-3">{d.star}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-gold h-full rounded-full transition-all" style={{ width: `${d.pct}%` }}
                          />
                        </div>
                        <span className="text-gray-400 w-4">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Review list */}
                <div className="flex-1 space-y-4 max-h-80 overflow-y-auto pr-1">
                  {reviews.map((rev, i) => (
                    <div key={i} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-rose-100 overflow-hidden flex-shrink-0">
                          {rev.requester?.avatar_url ? (
                            <img src={rev.requester.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-rose-600 text-xs font-bold">
                              {(rev.reviewer_name || rev.requester?.username || '?').replace('@', '')[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-sm text-gray-800">{rev.reviewer_name || (rev.requester?.username ? '@' + rev.requester.username : 'Requester')}</p>
                            <span className="text-xs text-muted">{(rev.created_at ? format(new Date(rev.created_at), 'MMM d, yyyy') : '')}</span>
                          </div>
                          <StarRow value={rev.rating} />
                          {rev.comment && (
                            <p className="text-sm text-gray-600 mt-1 leading-relaxed">{rev.comment}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent completed tasks */}
          {recentTasks.length > 0 && (
            <div className="card p-6">
              <h2 className="font-heading font-bold text-lg text-dark mb-4">Recent Completed Tasks</h2>
              <div className="space-y-3">
                {recentTasks.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-surface rounded-xl">
                    <CheckCircle size={16} className="text-rose-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{t.title}</p>
                      <p className="text-xs text-muted">{t.task_city}, {t.task_state}</p>
                    </div>
                    {t.completed_at && (
                      <span className="text-xs text-muted flex-shrink-0">
                        {(t.completed_at ? format(new Date(t.completed_at), 'MMM d') : '')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Direct Apply Modal */}
      {applyOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-slide-up">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-heading font-bold text-xl">Hire {user?.full_name}</h3>
                <button onClick={() => setApplyOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"></button>
              </div>
              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="label">Task Title *</label>
                  <input
                    type="text"required
                    placeholder="e.g. Grocery run at Shoprite Lekki" value={applyForm.title}
                    onChange={(e) => setField('title', e.target.value)}
                    className="input"/>
                </div>
                <div>
                  <label className="label">Task Description *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe exactly what needs to be done..." value={applyForm.description}
                    onChange={(e) => setField('description', e.target.value)}
                    className="input resize-none"/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">City *</label>
                    <input
                      type="text"required
                      placeholder="e.g. Lekki" value={applyForm.task_city}
                      onChange={(e) => setField('task_city', e.target.value)}
                      className="input"/>
                  </div>
                  <div>
                    <label className="label">State *</label>
                    <input
                      type="text"required
                      placeholder="e.g. Lagos" value={applyForm.task_state}
                      onChange={(e) => setField('task_state', e.target.value)}
                      className="input"/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Deadline *</label>
                    <input
                      type="datetime-local"required
                      value={applyForm.deadline}
                      onChange={(e) => setField('deadline', e.target.value)}
                      className="input"/>
                  </div>
                  <div>
                    <label className="label">Budget ({sym()})</label>
                    <input
                      type="number" min="0" placeholder="e.g. 5000" value={applyForm.budget}
                      onChange={(e) => setField('budget', e.target.value)}
                      className="input"/>
                  </div>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl text-xs text-rose-700">A real task is created and assigned directly to {profile?.user?.full_name}. Payment is held in escrow until you confirm completion.
                </div>
                <button type="submit" disabled={applying} className="btn-primary w-full">
                  {applying ? 'Creating Task...' : `Hire ${profile?.user?.full_name?.split(' ')[0]} Now`}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}