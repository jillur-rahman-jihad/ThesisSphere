import React, { useState } from 'react';
import {
  X,
  ThumbsUp,
  MessageSquare,
  Eye,
  CheckCircle2,
  Send,
  Trash2,
  Clock,
  User,
  Tag,
  AlertCircle,
} from 'lucide-react';

const ForumPostDetailModal = ({
  post,
  currentUser,
  isOpen,
  onClose,
  onLike,
  onAddComment,
  onDeleteComment,
  onToggleResolve,
  loadingComment,
}) => {
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !post) return null;

  const currentUserId = currentUser?._id || currentUser?.id;
  const isLiked = post.likes?.some(
    (id) => (typeof id === 'object' ? id._id : id) === currentUserId
  );
  const isAuthor =
    (post.author?._id || post.author?.id) === currentUserId;
  const canToggleResolve =
    isAuthor || currentUser?.role === 'faculty' || currentUser?.role === 'admin';

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
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) {
      setError('Comment cannot be empty.');
      return;
    }
    setError('');
    onAddComment(post._id, commentText.trim());
    setCommentText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              {post.category || 'General Discussion'}
            </span>
            {post.isResolved && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                <CheckCircle2 size={12} />
                Resolved
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Author Details & Resolution Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={authorAvatar}
                alt={authorName}
                className="w-11 h-11 rounded-full object-cover border border-slate-200"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">{authorName}</span>
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

            {canToggleResolve && (
              <button
                onClick={() => onToggleResolve(post._id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  post.isResolved
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                <CheckCircle2 size={14} />
                <span>{post.isResolved ? 'Mark Unresolved' : 'Mark as Resolved'}</span>
              </button>
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-slate-900 leading-snug">{post.title}</h2>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md flex items-center gap-1"
                >
                  <Tag size={11} />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Main Body Content */}
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/60 p-4 rounded-xl border border-slate-100">
            {post.content}
          </div>

          {/* Engagement Bar */}
          <div className="flex items-center justify-between py-3 border-y border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <button
                onClick={() => onLike(post._id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  isLiked
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ThumbsUp size={15} className={isLiked ? 'fill-indigo-700' : ''} />
                <span>{post.likes?.length || 0} Upvotes</span>
              </button>

              <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                <MessageSquare size={15} />
                <span>{post.comments?.length || 0} Comments</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <Eye size={15} />
              <span>{post.views || 0} Views</span>
            </div>
          </div>

          {/* Comments Thread */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Discussion & Answers ({post.comments?.length || 0})
            </h4>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Write a constructive answer or response..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-800"
              />
              <button
                type="submit"
                disabled={loadingComment || !commentText.trim()}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm disabled:opacity-50 transition-colors"
              >
                <Send size={15} />
                <span>Post</span>
              </button>
            </form>

            {/* List of Comments */}
            <div className="space-y-3 pt-2">
              {post.comments && post.comments.length > 0 ? (
                post.comments.map((c) => {
                  const commentUserId = c.userId?._id || c.userId?.id || c.userId;
                  const commentAuthorName = c.userId?.fullName || c.userId?.name || 'Academic Member';
                  const commentAuthorRole = c.userId?.role || 'student';
                  const commentAvatar =
                    c.userId?.profilePicture ||
                    c.userId?.avatar ||
                    c.userId?.profileImage ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      commentAuthorName
                    )}&background=6366f1&color=fff`;

                  const canDeleteComment =
                    commentUserId === currentUserId ||
                    isAuthor ||
                    currentUser?.role === 'faculty' ||
                    currentUser?.role === 'admin';

                  return (
                    <div
                      key={c._id}
                      className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/60 flex items-start justify-between gap-3 group"
                    >
                      <div className="flex gap-3 flex-1">
                        <img
                          src={commentAvatar}
                          alt={commentAuthorName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 flex-shrink-0 mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-slate-800 text-xs">
                              {commentAuthorName}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full capitalize ${
                                commentAuthorRole === 'faculty'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {commentAuthorRole}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(c.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 leading-normal">{c.comment}</p>
                        </div>
                      </div>

                      {canDeleteComment && (
                        <button
                          onClick={() => onDeleteComment(post._id, c._id)}
                          title="Delete Comment"
                          className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-slate-400 text-sm italic">
                  No comments yet. Be the first to share your insights!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumPostDetailModal;
