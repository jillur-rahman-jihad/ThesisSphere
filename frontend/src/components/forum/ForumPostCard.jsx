import React from 'react';
import { MessageSquare, ThumbsUp, Eye, CheckCircle2, Tag, Clock, Trash2 } from 'lucide-react';

const ForumPostCard = ({ post, currentUser, onSelect, onLike, onDelete }) => {
  const isLiked = post.likes?.some(
    (id) => (typeof id === 'object' ? id._id : id) === (currentUser?._id || currentUser?.id)
  );

  const isAuthor =
    (post.author?._id || post.author?.id) === (currentUser?._id || currentUser?.id);
  const canDelete = isAuthor || currentUser?.role === 'faculty' || currentUser?.role === 'admin';

  const authorName = post.author?.fullName || post.author?.name || 'Anonymous User';
  const authorRole = post.author?.role || 'student';
  const authorAvatar =
    post.author?.profilePicture ||
    post.author?.avatar ||
    post.author?.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=6366f1&color=fff`;

  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      onClick={() => onSelect(post)}
      className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
    >
      <div>
        {/* Top Header Row: Author info & Resolution badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img
              src={authorAvatar}
              alt={authorName}
              className="w-10 h-10 rounded-full object-cover border border-slate-200"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 text-sm">{authorName}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                    authorRole === 'faculty'
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}
                >
                  {authorRole}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                <Clock size={12} />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {post.isResolved && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                <CheckCircle2 size={13} />
                Resolved
              </span>
            )}

            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(post._id);
                }}
                title="Delete Post"
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Category & Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
            {post.category || 'General Discussion'}
          </span>
          {post.tags &&
            post.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1"
              >
                <Tag size={10} />
                {tag}
              </span>
            ))}
        </div>

        {/* Post Title */}
        <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2">
          {post.title}
        </h3>

        {/* Post Excerpt */}
        <p className="text-sm text-slate-600 line-clamp-3 mb-4 leading-relaxed">
          {post.content}
        </p>
      </div>

      {/* Card Footer Metrics & Actions */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike(post._id);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-colors ${
              isLiked
                ? 'bg-indigo-50 text-indigo-600'
                : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <ThumbsUp size={14} className={isLiked ? 'fill-indigo-600' : ''} />
            <span>{post.likes?.length || 0}</span>
          </button>

          <div className="flex items-center gap-1.5">
            <MessageSquare size={14} />
            <span>{post.comments?.length || 0} Comments</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <Eye size={14} />
          <span>{post.views || 0} Views</span>
        </div>
      </div>
    </div>
  );
};

export default ForumPostCard;
