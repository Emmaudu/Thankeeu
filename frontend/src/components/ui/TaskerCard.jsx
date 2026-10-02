import { Link } from 'react-router-dom';
import { taskerProfilePath } from '../../utils/profileLink';
import { MapPin, CheckCircle, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

const SKILL_EMOJIS = {
  delivery: '', errand: '', shopping: '', courier: '',
  logistics: '', pickup: '', photography: '', cleaning: '',
  tech: '', printing: '', banking: '', admin: '',
};

function StarRating({ value, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24" fill={s <= Math.round(value) ? '#F5A623' : '#E5E7EB'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export default function TaskerCard({ tasker }) {
  const profile = tasker;
  const user = tasker.user;

  return (
    <Link to={taskerProfilePath({ slug: user?.profile_slug, username: user?.username, id: profile.user_id })} className="card-hover block group">
      <div className="p-5">
        {/* Avatar + name */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-rose-600 font-bold text-xl">
                  {user?.full_name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            {profile.is_available && (
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white" title="Available" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-heading font-semibold text-gray-900 group-hover:text-rose-600 transition-colors truncate">
                {user?.full_name}
              </h3>
              <span className="badge-green text-xs">Verified</span>
              {profile.enterprise_certified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Enterprise</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-1">
              <MapPin size={12} className="text-rose-500 flex-shrink-0" />
              <span className="text-xs text-muted truncate">
                {profile.task_city}, {profile.task_state}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1.5">
              <StarRating value={parseFloat(profile.rating_average) || 0} />
              <span className="text-xs text-muted">
                {parseFloat(profile.rating_average || 0).toFixed(1)}
                {profile.total_ratings > 0 && ` (${profile.total_ratings})`}
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
            {profile.bio}
          </p>
        )}

        {/* Skills */}
        {profile.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {profile.skills.slice(0, 4).map((skill) => (
              <span key={skill} className="badge-gray text-xs capitalize">
                {SKILL_EMOJIS[skill.toLowerCase()] || ''} {skill}
              </span>
            ))}
            {profile.skills.length > 4 && (
              <span className="badge-gray text-xs">+{profile.skills.length - 4} more</span>
            )}
          </div>
        )}

        {/* Stats footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1">
              <CheckCircle size={12} className="text-rose-500" />
              {profile.total_tasks_completed} tasks done
            </span>
          </div>

          <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center group-hover:bg-rose-500 transition-colors">
            <ChevronRight size={15} className="text-rose-600 group-hover:text-white transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
}
