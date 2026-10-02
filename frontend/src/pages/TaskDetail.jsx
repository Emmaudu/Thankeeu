import { cpath, marketFromPath, getMarket, prefixOf } from '../utils/market';
import CountrySEO from '../components/country/CountrySEO';
import { minAmount, money, sym } from '../utils/market';
import { useState, useEffect } from 'react';
import { taskPrice, naira, costLines } from '../utils/taskPrice';
import { taskerProfilePath } from '../utils/profileLink';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, Calendar, Users, ChevronRight, AlertCircle, CheckCircle, Download, MapPin, Navigation, Flag } from 'lucide-react';
import { formatDistanceToNow, format, isPast } from 'date-fns';
import { clsx } from 'clsx';
import { tasksApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import SEO, { makeTaskSchema } from '../components/seo/SEO';

const STATUS_CONFIG = {
  open:      { label: 'Open for Bids', cls: 'badge-green', canBid: true },
  bidding:   { label: 'Receiving Bids', cls: 'badge-yellow', canBid: true },
  ongoing:   { label: 'Ongoing', cls: 'badge-blue', canBid: false },
  completed: { label: 'Completed', cls: 'badge-gray', canBid: false },
  cancelled: { label: 'Cancelled', cls: 'badge-red', canBid: false },
};

const TYPE_LABELS = {
  pickup_delivery: 'Pickup & Delivery',
  location_only: 'On-Location Task',
  purchase_ship: 'Purchase & Ship',
  general: 'General Task',
};

function StarRating({ value }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} width={14} height={14} viewBox="0 0 24 24" fill={s <= Math.round(value) ? '#F5A623' : '#E5E7EB'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

function BidCard({ bid, onAccept, onReject, isRequester }) {
  const profile = bid.tasker?.profile;
  const isAccepted = bid.status === 'accepted';
  const isRejected = bid.status === 'rejected';
  return (
    <div className={clsx(
      'p-4 rounded-2xl border-2 transition-all',
      isAccepted ? 'border-rose-400 bg-rose-50' :
      isRejected ? 'border-gray-200 bg-gray-50 opacity-70' :
      'border-gray-100 bg-white hover:border-gray-200'
    )}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-100 overflow-hidden flex-shrink-0">
          {bid.tasker?.avatar_url ? (
            <img src={bid.tasker.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-rose-600 font-bold">
              {bid.tasker?.full_name?.[0]}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={taskerProfilePath({ slug: bid.tasker?.profile_slug, id: bid.tasker?.id })} className="font-semibold text-gray-900 hover:text-rose-600 transition-colors">
              {bid.tasker?.full_name}
            </Link>
            {isAccepted && <span className="badge-green text-xs">Accepted</span>}
            {isRejected && <span className="badge-red text-xs">Rejected</span>}
          </div>
          {profile && (
            <div className="flex items-center gap-3 mt-1 text-xs text-muted">
              <div className="flex items-center gap-1">
                <StarRating value={parseFloat(profile.rating_average) || 0} />
                <span>{parseFloat(profile.rating_average || 0).toFixed(1)}</span>
              </div>
              <span>{profile.task_city}</span>
              <span>{profile.total_tasks_completed} done</span>
            </div>
          )}
          {bid.message && (
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">{bid.message}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-heading font-bold text-lg text-rose-600">
            {money(bid.workmanship_price)}
          </p>
          <p className="text-xs text-muted">workmanship</p>
        </div>
      </div>

      {isRequester && bid.status === 'pending' && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
          <button onClick={() => onAccept(bid.id)} className="flex-1 btn-primary btn-sm text-sm">
            Accept This Tasker
          </button>
          <button onClick={() => onReject(bid.id)} className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors">
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isRequester, isApprovedTasker } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [bidding, setBidding] = useState(false);
  const [hasUserBid, setHasUserBid] = useState(false);

  useEffect(() => {
    loadTask();
  }, [id]);

  const loadTask = async () => {
    setLoading(true);
    try {
      const { data } = await tasksApi.get(id);
      // A task lives on its own country's site. Old or shared links open the right one.
      const taskMarket = getMarket(data.task?.country || 'NG');
      if (taskMarket.code !== marketFromPath(window.location.pathname).code) {
        navigate(`${prefixOf(taskMarket.code)}/tasks/${id}${window.location.search}`, { replace: true });
        return;
      }
      setTask(data.task);
      if (user && data.task.bids) {
        setHasUserBid(data.task.bids.some(b => b.tasker_id === user.id));
      }
    } catch {
      toast.error('Task not found');
      navigate(cpath('/tasks'));
    } finally {
      setLoading(false);
    }
  };

  const handleBid = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate(cpath('/tasker/login')); return; }
    if (!isApprovedTasker) { toast.error('Only approved taskers can bid'); return; }
    if (!bidAmount || parseFloat(bidAmount) < minAmount()) { toast.error(`Minimum bid is ${money(minAmount())}`); return; }

    setBidding(true);
    try {
      await tasksApi.bid(id, { workmanship_price: parseFloat(bidAmount), message: bidMessage });
      toast.success('Bid placed successfully!');
      setHasUserBid(true);
      setBidAmount(''); setBidMessage('');
      loadTask();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place bid');
    } finally {
      setBidding(false);
    }
  };

  const handleAcceptBid = async (bidId) => {
    try {
      await tasksApi.acceptBid(id, bidId);
      toast.success('Tasker accepted! Chat room created.');
      loadTask();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept bid');
    }
  };

  const handleRejectBid = async (bidId) => {
    try {
      await tasksApi.rejectBid(id, bidId);
      toast.success('Bid rejected');
      loadTask();
    } catch (err) {
      toast.error('Failed to reject bid');
    }
  };

  const downloadAuthDocument = () => {
    const doc = `
TASKEEU TASK AUTHORIZATION DOCUMENT
====================================
Task ID: ${task.id}
Task Title: ${task.title}
Date Issued: ${format(new Date(), 'MMMM d, yyyy')}

TASK LOCATION:
${task.from_city ? `From: ${task.from_city}, ${task.from_state}` : ''}
${task.from_address ? `Address: ${task.from_address}` : ''}
${task.to_city ? `To: ${task.to_city}, ${task.to_state}` : ''}
${task.task_full_address ? `Task Address: ${task.task_full_address}` : ''}

DESCRIPTION:
${task.description}

REQUESTER: @${task.requester?.username || 'requester'}
DEADLINE: ${(task.deadline ? format(new Date(task.deadline), 'MMMM d, yyyy HH:mm') : 'Not set')}

This document grants authorization to the assigned Taskeeu tasker to 
perform the above task on behalf of the requester.

Issued by: Taskeeu Platform (taskeeu.com)
    `.trim();

    const blob = new Blob([doc], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `taskeeu-task-auth-${task.id.slice(0,8)}.txt`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Authorization document downloaded!');
  };

  if (loading) return (
    <div className="pt-20 min-h-screen bg-surface">
      <div className="container-xl py-12">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="skeleton h-8 w-1/2 rounded-xl" />
          <div className="skeleton h-64 w-full rounded-2xl" />
          <div className="skeleton h-48 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );

  if (!task) return null;

  const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.open;
  const deadline = new Date(task.deadline);
  const isExpired = isPast(deadline);
  const canBid = statusConfig.canBid && !isExpired && isApprovedTasker && !hasUserBid;
  const taskMk = getMarket(task.country || 'NG');
  const userMk = getMarket(user?.market || 'NG');
  const wrongCountry = isAuthenticated && user?.role === 'tasker' && userMk.code !== taskMk.code;
  const where = task.is_remote ? `Remote${task.task_state && task.task_state !== 'Remote' ? `, ${task.task_state}` : ''}` : [task.task_city, task.task_state].filter(Boolean).join(', ');
  const isOwner = task.requester_id === user?.id;
  const acceptedBids = task.bids?.filter(b => b.status === 'accepted') || [];
  const pendingBids  = task.bids?.filter(b => b.status === 'pending')  || [];
  const rejectedBids = task.bids?.filter(b => b.status === 'rejected') || [];

  const taskSEO = task ? makeTaskSchema(task) : null;
  return (
    <>
      {taskMk.slug ? (
        <CountrySEO market={taskMk} title={`${task.title} | ${where} | Taskeeu`} description={`${(task.description || '').substring(0, 150)}`}
          path={`/${taskMk.slug}/tasks/${task.id}`}
          breadcrumbs={[{ name: taskMk.name, path: `/${taskMk.slug}` }, { name: 'Tasks', path: `/${taskMk.slug}/tasks` }, { name: task.title, path: `/${taskMk.slug}/tasks/${task.id}` }]} />
      ) : (
      <SEO
        title={task ? `${task.title} | ${task.task_city}, ${task.task_state}` : 'Task Details'}
        description={task ? `${task.description?.substring(0,155)}...` : 'View task details on Taskeeu.'}
        canonical={task ? `https://taskeeu.com/tasks/${task.id}` : undefined}
        structuredData={taskSEO}
        breadcrumbs={task ? [{name:'Home',url:'https://taskeeu.com'},{name:'Tasks',url:'https://taskeeu.com/tasks'},{name:task.title,url:`https://taskeeu.com/tasks/${task.id}`}] : []}
      />
      )}
    <div className="pt-20 pb-16 min-h-screen bg-surface">
      <div className="container-xl py-8">
        <div className="max-w-5xl mx-auto">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted mb-6">
            <Link to={cpath("/tasks")} className="hover:text-rose-600 transition-colors">Tasks</Link>
            <ChevronRight size={14} />
            <span className="text-gray-700 truncate">{task.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main content */}
            <div className="lg:col-span-2 space-y-5">

              {/* Task header card */}
              <div className="card p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="badge-gray text-xs">{TYPE_LABELS[task.task_type]}</span>
                      <span className={clsx('badge', statusConfig.cls)}>{statusConfig.label}</span>
                    </div>
                    <h1 className="font-heading text-2xl md:text-3xl font-bold text-dark leading-tight">
                      {task.title}
                    </h1>
                  </div>
                </div>

                {/* Task price: the single total and what it is made of */}
                {taskPrice(task) && <PriceBreakdown task={task} />}

                <p className="text-gray-700 leading-relaxed mb-5">{task.description}</p>

                {/* Location info */}
                <div className="bg-surface rounded-2xl p-4 space-y-3">
                  {task.from_city && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0"><Navigation size={15} className="text-blue-600" /></div>
                      <div>
                        <p className="text-xs font-semibold text-muted uppercase tracking-wide">From</p>
                        <p className="text-sm font-medium text-gray-800">{task.from_city}, {task.from_state}</p>
                        {task.from_address && <p className="text-xs text-muted">{task.from_address}</p>}
                      </div>
                    </div>
                  )}
                  {task.to_city && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0"><Flag size={15} className="text-green-700" /></div>
                      <div>
                        <p className="text-xs font-semibold text-muted uppercase tracking-wide">To</p>
                        <p className="text-sm font-medium text-gray-800">{task.to_city}, {task.to_state}</p>
                        {task.to_address && <p className="text-xs text-muted">{task.to_address}</p>}
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0"><MapPin size={15} className="text-rose-600" /></div>
                    <div>
                      <p className="text-xs font-semibold text-muted uppercase tracking-wide">Task Location</p>
                      <p className="text-sm font-medium text-gray-800">{task.is_remote ? `${where}. Done online, no address needed.` : `${task.task_city}, ${task.task_state}`}</p>
                      {task.task_full_address && <p className="text-xs text-muted">{task.task_full_address}</p>}
                    </div>
                  </div>
                </div>

                {/* Equipment note */}
                {task.is_equipment_required && (
                  <div className="mt-4 p-4 bg-orange-50 rounded-2xl border border-orange-100 flex gap-3">
                    <AlertCircle size={20} className="text-secondary-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-orange-800 text-sm">Equipment purchase required</p>
                      <p className="text-sm text-orange-700 mt-1">{task.equipment_description}</p>
                      <p className="text-xs text-orange-600 mt-1">Requester will fund equipment + shipment costs via escrow.</p>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {task.tags?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {task.tags.map(tag => (
                      <span key={tag} className="badge-gray text-xs">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bids section */}
              <div className="card p-6">
                <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
                  Bids
                  {pendingBids.length > 0 && (
                    <span className="badge-yellow text-xs">{pendingBids.length} pending</span>
                  )}
                  {acceptedBids.length > 0 && (
                    <span className="badge-green text-xs">{acceptedBids.length} accepted</span>
                  )}
                </h2>

                {task.bids?.length === 0 ? (
                  <div className="text-center py-8 text-muted">
                    <div className="text-4xl mb-2"></div>
                    <p className="text-sm">No bids yet. Be the first!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Accepted bids first */}
                    {acceptedBids.map(bid => (
                      <BidCard key={bid.id} bid={bid} isRequester={isOwner}
                        onAccept={handleAcceptBid} onReject={handleRejectBid} />
                    ))}
                    {/* Pending bids — requester can still accept/reject these */}
                    {pendingBids.map(bid => (
                      <BidCard key={bid.id} bid={bid} isRequester={isOwner}
                        onAccept={handleAcceptBid} onReject={handleRejectBid} />
                    ))}
                    {/* Rejected bids — shown dimmed so requester can see full picture */}
                    {rejectedBids.length > 0 && (
                      <>
                        <p className="text-xs text-muted pt-1">Rejected bids</p>
                        {rejectedBids.map(bid => (
                          <BidCard key={bid.id} bid={bid} isRequester={isOwner}
                            onAccept={handleAcceptBid} onReject={handleRejectBid} />
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Place a bid */}
              {!isOwner && task.status !== 'completed' && task.status !== 'cancelled' && (
                <div className="card p-6">
                  <h2 className="font-heading font-semibold text-lg mb-4">Place Your Bid</h2>

                  {!isAuthenticated ? (
                    <div className="text-center py-6">
                      <p className="text-muted mb-4">You need to be logged in to bid</p>
                      <Link to={cpath('/tasker/login')} className="btn-primary">Login to Bid →</Link>
                    </div>
                  ) : wrongCountry ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center" data-testid="wrong-country-bid">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>
                        This task is on Taskeeu {taskMk.name}. Your tasker account is registered in {userMk.name}, so you can bid on tasks there.{' '}
                        <Link to={`${prefixOf(userMk.code)}/tasks`} className="text-rose-600 underline">Browse tasks in {userMk.name}</Link>
                      </p>
                    </div>
                  ) : !isApprovedTasker ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
                      <p className="text-yellow-800 font-medium text-sm">Only approved taskers can place bids.{' '}
                        {user?.role !== 'tasker' ? (
                          <Link to={cpath("/tasker/signup")} className="text-rose-600 underline">Become a tasker →</Link>
                        ) : 'Your application is under review.'}
                      </p>
                    </div>
                  ) : hasUserBid ? (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center">
                      <CheckCircle size={24} className="text-rose-500 mx-auto mb-2" />
                      <p className="text-rose-800 font-medium text-sm">You've already placed a bid on this task!</p>
                    </div>
                  ) : !statusConfig.canBid ? (
                    <div className="bg-gray-50 rounded-2xl p-4 text-center">
                      <p className="text-muted text-sm">This task is no longer accepting bids.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleBid} className="space-y-4">
                      {taskPrice(task) && (
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 flex gap-2.5">
                          <AlertCircle size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-blue-800 leading-relaxed">
                            {Number(task.cost_workmanship) > 0
                              ? <>The requester offers <span className="font-semibold">{naira(task.cost_workmanship)}</span> for workmanship (task total {naira(taskPrice(task))}).</>
                              : <>The requester's price is <span className="font-semibold">{naira(taskPrice(task))}</span>.</>}
                            {' '}Fair, competitive bids are accepted more often and keep Taskeeu affordable for everyone.
                          </p>
                        </div>
                      )}
                      <div>
                        <label className="label">Your Workmanship Price ({sym()})</label>
                        <input
                          type="number" value={bidAmount}
                          onChange={e => setBidAmount(e.target.value)}
                          placeholder={`e.g. ${minAmount() * 25}`} min={minAmount()} step="any" className="input" required
                        />
                        {taskPrice(task) && (
                          <p className="text-xs text-muted mt-1">
                            {Number(task.cost_workmanship) > 0 ? `Requester's workmanship offer: ${naira(task.cost_workmanship)}` : `Task price: ${naira(taskPrice(task))}`}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="label">Message to Requester (optional)</label>
                        <textarea
                          value={bidMessage}
                          onChange={e => setBidMessage(e.target.value)}
                          placeholder="Introduce yourself, explain your approach, and why you're the best fit..." rows={3}
                          className="input resize-none" maxLength={500}
                        />
                      </div>
                      <button type="submit" disabled={bidding} className="btn-primary w-full">
                        {bidding ? 'Placing bid...' : 'Do This Task: Place Bid'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-5">

              {/* Task summary */}
              <div className="card p-5">
                <h3 className="font-heading font-semibold mb-4">Task Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted flex items-center gap-2"><Calendar size={14} />Deadline</span>
                    <span className={clsx('font-medium', isExpired ? 'text-red-500' : 'text-gray-800')}>
                      {format(deadline, 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted flex items-center gap-2"><Clock size={14} />Time left</span>
                    <span className={clsx('font-medium', isExpired ? 'text-red-500' : 'text-rose-600')}>
                      {isExpired ? 'Expired' : formatDistanceToNow(deadline, { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted flex items-center gap-2"><Users size={14} />Total bids</span>
                    <span className="font-medium text-gray-800">{task.bids?.length || 0}</span>
                  </div>
                  {taskPrice(task) && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Price</span>
                      <span className="font-semibold text-rose-600">{naira(taskPrice(task))}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Posted</span>
                    <span className="font-medium text-gray-800 text-xs">
                      {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Download auth doc (taskers who are accepted or just DO button) */}
              {isApprovedTasker && task.accepted_tasker_id === user?.id && (
                <button onClick={downloadAuthDocument} className="card p-5 w-full text-left hover:shadow-md transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                      <Download size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">Download Authorization</p>
                      <p className="text-xs text-muted">Show this at the task location</p>
                    </div>
                  </div>
                </button>
              )}

              {/* Requester info */}
              {task.requester && (
                <div className="card p-5">
                  <h3 className="font-heading font-semibold mb-4 text-sm">Posted by</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-rose-100 overflow-hidden flex-shrink-0">
                      {task.requester.avatar_url ? (
                        <img src={task.requester.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-rose-600 font-bold">
                          {task.requester.username?.[0]?.toUpperCase() || 'R'}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">@{task.requester.username || 'requester'}</p>
                      <p className="text-xs text-muted">
                        Member since {(task.requester.created_at ? format(new Date(task.requester.created_at), 'MMM yyyy') : 'Unknown')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Safety note */}
              <div className="card p-4 bg-rose-50 border border-rose-100">
                <div className="flex gap-3">
                  <span className="text-2xl"></span>
                  <div>
                    <p className="font-semibold text-rose-800 text-sm">Taskeeu Protection</p>
                    <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                      All payments go through Taskeeu escrow. Funds only release when you share your completion code.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

/* Task price card: one total, then the four parts that make it up. */
function PriceBreakdown({ task }) {
  const total = taskPrice(task);
  const hasBreakdown = Number(task.cost_workmanship) > 0;
  const rows = [
    ['Workmanship', task.cost_workmanship, "The tasker's pay for the work"],
    ['Transportation', task.cost_transport, 'Getting to and from the task location'],
    ['Waybill', task.cost_waybill, 'Sending or delivering items'],
    ['Items or equipment', task.cost_items, 'Items the tasker buys for the task'],
  ];
  return (
    <section className="mb-6 rounded-2xl border overflow-hidden" style={{ borderColor: '#e5e7eb' }} aria-label="Task price" data-testid="price-breakdown">
      <div className="flex items-end justify-between gap-3 flex-wrap px-5 py-4 bg-white">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Task price</p>
          <p className="text-sm text-gray-500 mt-0.5">{hasBreakdown ? 'Total of the costs below' : 'Total offered by the requester'}</p>
        </div>
        <p className="font-black text-3xl md:text-4xl tracking-tight" style={{ color: 'var(--primary)' }} data-testid="task-price">{naira(total)}</p>
      </div>
      {hasBreakdown && (
        <table className="w-full text-sm" style={{ borderTop: '1px solid #e5e7eb' }}>
          <tbody>
            {rows.map(([label, value, hint]) => {
              const n = Number(value) || 0;
              return (
                <tr key={label} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td className="px-5 py-3">
                    <p className="font-bold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500">{hint}</p>
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    {n > 0
                      ? <span className="font-bold text-gray-900 text-base">{naira(n)}</span>
                      : <span className="text-gray-400">Not needed</span>}
                  </td>
                </tr>
              );
            })}
            <tr style={{ background: '#f9fafb' }}>
              <td className="px-5 py-3 font-black text-gray-900">Total</td>
              <td className="px-5 py-3 text-right font-black text-lg whitespace-nowrap" style={{ color: 'var(--primary)' }}>{naira(total)}</td>
            </tr>
          </tbody>
        </table>
      )}
    </section>
  );
}
