import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  Plus,
  Filter,
  RefreshCw,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Bookmark,
} from 'lucide-react';
import {
  getForumPosts,
  getForumPostById,
  createForumPost,
  addComment,
  toggleLikePost,
  toggleResolvedStatus,
  deleteForumPost,
  deleteComment,
} from '../services/forumService';
import ForumPostCard from '../components/forum/ForumPostCard';
import CreatePostModal from '../components/forum/CreatePostModal';
import ForumPostDetailModal from '../components/forum/ForumPostDetailModal';

const CATEGORIES = [
  'All',
  'General Discussion',
  'Thesis & Research Topics',
  'Methodology & Analysis',
  'Literature Review',
  'Academic Writing',
  'Supervisor Guidance',
];

const DiscussionForum = () => {
  const { currentUser } = useOutletContext();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState('latest');

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const [selectedPost, setSelectedPost] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);

  // Fetch Forum Posts
  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getForumPosts(currentUser, {
        search,
        category: selectedCategory,
        sort: sortOption,
      });
      setPosts(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load forum posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory, sortOption]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPosts();
  };

  // Create Post
  const handleCreateSubmit = async (postData) => {
    setCreateLoading(true);
    try {
      await createForumPost(postData, currentUser);
      setIsCreateOpen(false);
      fetchPosts();
    } catch (err) {
      alert(err.message || 'Failed to create post');
    } finally {
      setCreateLoading(false);
    }
  };

  // Select & View Detail
  const handleSelectPost = async (post) => {
    setSelectedPost(post);
    setIsDetailOpen(true);
    try {
      const res = await getForumPostById(post._id, currentUser);
      if (res.data) {
        setSelectedPost(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Like
  const handleToggleLike = async (postId) => {
    try {
      const res = await toggleLikePost(postId, currentUser);
      if (res.data) {
        setPosts((prev) =>
          prev.map((p) => (p._id === postId ? res.data : p))
        );
        if (selectedPost && selectedPost._id === postId) {
          setSelectedPost(res.data);
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to update upvote');
    }
  };

  // Toggle Resolution
  const handleToggleResolve = async (postId) => {
    try {
      const res = await toggleResolvedStatus(postId, currentUser);
      if (res.data) {
        setPosts((prev) =>
          prev.map((p) => (p._id === postId ? res.data : p))
        );
        if (selectedPost && selectedPost._id === postId) {
          setSelectedPost(res.data);
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to update resolution status');
    }
  };

  // Add Comment
  const handleAddComment = async (postId, commentText) => {
    setCommentLoading(true);
    try {
      const res = await addComment(postId, commentText, currentUser);
      if (res.data) {
        setPosts((prev) =>
          prev.map((p) => (p._id === postId ? res.data : p))
        );
        setSelectedPost(res.data);
      }
    } catch (err) {
      alert(err.message || 'Failed to post comment');
    } finally {
      setCommentLoading(false);
    }
  };

  // Delete Post
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this discussion post?')) return;
    try {
      await deleteForumPost(postId, currentUser);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      if (selectedPost?._id === postId) {
        setIsDetailOpen(false);
        setSelectedPost(null);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete post');
    }
  };

  // Delete Comment
  const handleDeleteComment = async (postId, commentId) => {
    try {
      const res = await deleteComment(postId, commentId, currentUser);
      if (res.data) {
        setPosts((prev) =>
          prev.map((p) => (p._id === postId ? res.data : p))
        );
        setSelectedPost(res.data);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete comment');
    }
  };

  // Computed Stats
  const currentUserId = currentUser?._id || currentUser?.id;
  const myPostsCount = posts.filter(
    (p) => (p.author?._id || p.author?.id || p.author) === currentUserId
  ).length;
  const resolvedCount = posts.filter((p) => p.isResolved).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md">
              <Sparkles size={14} />
              <span>Academic Knowledge Exchange</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Academic Discussion Forum</h1>
            <p className="text-indigo-200/90 text-sm leading-relaxed">
              Ask questions, discuss thesis methodologies, share research findings, and collaborate with peers & supervisors across disciplines.
            </p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 flex-shrink-0"
          >
            <Plus size={18} />
            <span>Start Discussion</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <MessageSquare size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wider">Total Discussions</p>
            <h4 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{posts.length}</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wider">My Contributions</p>
            <h4 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{myPostsCount}</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wider">Resolved Topics</p>
            <h4 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{resolvedCount}</h4>
          </div>
        </div>
      </div>

      {/* Search & Sort Bar */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4 transition-colors">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search size={18} className="absolute left-4 top-3 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search discussions by keyword, question, or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
            />
          </form>

          {/* Sort Tabs & Refresh */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 transition-colors">
              <button
                onClick={() => setSortOption('latest')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  sortOption === 'latest' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Latest
              </button>
              <button
                onClick={() => setSortOption('popular')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  sortOption === 'popular' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Most Liked
              </button>
              <button
                onClick={() => setSortOption('unanswered')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  sortOption === 'unanswered' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Unanswered
              </button>
            </div>

            <button
              onClick={fetchPosts}
              title="Refresh Discussions"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 scrollbar-none border-t border-slate-100 dark:border-slate-700/60">
          <Filter size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Forum Posts List Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                </div>
              </div>
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
              <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-8 text-center space-y-3">
          <AlertCircle size={32} className="mx-auto text-rose-500 dark:text-rose-400" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Unable to load discussions</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">{error}</p>
          <button
            onClick={fetchPosts}
            className="px-4 py-2 bg-rose-600 text-white font-semibold text-sm rounded-xl hover:bg-rose-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-12 text-center border border-slate-200/80 dark:border-slate-700/80 space-y-4 transition-colors">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto">
            <HelpCircle size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">No discussions found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Be the first academic member to start a discussion in this topic or try searching with different keywords!
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} />
            <span>Create Discussion</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post) => (
            <ForumPostCard
              key={post._id}
              post={post}
              currentUser={currentUser}
              onSelect={handleSelectPost}
              onLike={handleToggleLike}
              onDelete={handleDeletePost}
            />
          ))}
        </div>
      )}

      {/* Create Discussion Modal */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        loading={createLoading}
      />

      {/* Post Detail Modal */}
      <ForumPostDetailModal
        post={selectedPost}
        currentUser={currentUser}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onLike={handleToggleLike}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        onToggleResolve={handleToggleResolve}
        loadingComment={commentLoading}
      />
    </div>
  );
};

export default DiscussionForum;
