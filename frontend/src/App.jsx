import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FileCode, 
  Database, 
  Server, 
  Activity, 
  UserPlus, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  RefreshCw,
  Terminal,
  Layers,
  ChevronRight,
  Workflow
} from 'lucide-react';

export default function App() {
  const [users, setUsers] = useState([]);
  const [healthStatus, setHealthStatus] = useState({ status: 'LOADING', message: 'Checking server connection...' });
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user' });
  const [loading, setLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // File tree model detailing the roles in the MVC architecture
  const fileTree = [
    { 
      name: 'backend/', 
      type: 'folder', 
      children: [
        { 
          name: 'config/', 
          type: 'folder', 
          children: [
            { 
              name: 'db.js', 
              type: 'file', 
              role: 'Database Connector', 
              desc: 'Initializes connection to MongoDB using Mongoose. Establishes the data pipeline for the Model layer.' 
            }
          ]
        },
        { 
          name: 'models/', 
          type: 'folder', 
          children: [
            { 
              name: 'userModel.js', 
              type: 'file', 
              role: 'Model Layer', 
              desc: 'Defines the User Mongoose Schema and methods (like bcrypt password hashing). Represents the data structures and business rules.' 
            }
          ]
        },
        { 
          name: 'controllers/', 
          type: 'folder', 
          children: [
            { 
              name: 'userController.js', 
              type: 'file', 
              role: 'Controller Layer', 
              desc: 'Contains endpoint request/response logic. Receives requests from routes, orchestrates Model interactions, and sends back formatted JSON responses.' 
            }
          ]
        },
        { 
          name: 'routes/', 
          type: 'folder', 
          children: [
            { 
              name: 'userRoutes.js', 
              type: 'file', 
              role: 'Router', 
              desc: 'Maps URL paths to controller methods. Informs Express which controller handles a GET, POST, PUT, or DELETE request.' 
            }
          ]
        },
        { 
          name: 'middleware/', 
          type: 'folder', 
          children: [
            { 
              name: 'authMiddleware.js', 
              type: 'file', 
              role: 'Middleware / Interceptor', 
              desc: 'Intercepts requests to verify JWT credentials before proceeding to the controller. Guards private routes.' 
            },
            { 
              name: 'errorMiddleware.js', 
              type: 'file', 
              role: 'Global Error Handler', 
              desc: 'Intercepts unhandled route calls (404s) and code errors, mapping them into standard JSON error objects.' 
            }
          ]
        },
        { 
          name: 'server.js', 
          type: 'file', 
          role: 'Application Bootstrap', 
          desc: 'The backend entry point. Connects to the database, registers global middlewares (CORS, Morgan, JSON parsers), and boots the HTTP listener.' 
        }
      ]
    },
    { 
      name: 'frontend/', 
      type: 'folder', 
      children: [
        { 
          name: 'src/', 
          type: 'folder', 
          children: [
            { 
              name: 'App.jsx', 
              type: 'file', 
              role: 'View Layer (Client Dashboard)', 
              desc: 'The primary dashboard. Connects with the Controllers via HTTP fetch requests, rendering model records interactively.' 
            },
            { 
              name: 'index.css', 
              type: 'file', 
              role: 'Global Styles', 
              desc: 'Imports Tailwind CSS v4 directives and defines custom CSS variables, custom typography, and transitions.' 
            }
          ]
        },
        { 
          name: 'vite.config.js', 
          type: 'file', 
          role: 'Build & Proxy Configuration', 
          desc: 'Vite config incorporating `@tailwindcss/vite` and routing proxy settings. Proxies `/api` to avoid CORS issues in development.' 
        }
      ]
    }
  ];

  // Fetch API Health & Users list
  const checkHealthAndFetchUsers = async () => {
    try {
      const healthRes = await fetch('/api/health');
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealthStatus({ status: 'ONLINE', message: healthData.message || 'Connected successfully' });
      } else {
        setHealthStatus({ status: 'OFFLINE', message: 'Server returned a bad status code.' });
      }
    } catch (err) {
      setHealthStatus({ 
        status: 'OFFLINE', 
        message: 'Could not connect to backend server. Make sure "npm run dev" is running from the root.' 
      });
    }

    try {
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.data || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    checkHealthAndFetchUsers();
    // Default select first file to guide the user
    setSelectedFile({
      name: 'userController.js',
      role: 'Controller Layer',
      desc: 'Contains endpoint request/response logic. Receives requests from routes, orchestrates Model interactions, and sends back formatted JSON responses.'
    });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitMessage(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        setSubmitMessage({ type: 'success', text: data.message || 'User added successfully!' });
        setFormData({ name: '', email: '', password: '', role: 'user' });
        checkHealthAndFetchUsers();
      } else {
        setSubmitMessage({ type: 'error', text: data.message || 'Failed to create user.' });
      }
    } catch (err) {
      setSubmitMessage({ type: 'error', text: 'Failed to contact server API.' });
    } finally {
      setLoading(false);
    }
  };

  // Render file tree recursively
  const renderTree = (items, depth = 0) => {
    return items.map((item, index) => {
      const hasChildren = item.children && item.children.length > 0;
      const isSelected = selectedFile && selectedFile.name === item.name;
      
      return (
        <div key={index} style={{ paddingLeft: `${depth * 14}px` }} className="select-none">
          {item.type === 'folder' ? (
            <div className="flex items-center space-x-2 py-1 text-slate-400 font-mono text-sm hover:text-slate-200 transition-colors">
              <Folder className="w-4 h-4 text-indigo-400" />
              <span>{item.name}</span>
            </div>
          ) : (
            <button
              onClick={() => setSelectedFile(item)}
              className={`flex items-center space-x-2 py-1 w-full text-left font-mono text-sm transition-all rounded px-2 ${
                isSelected 
                  ? 'bg-indigo-500/25 border-l-2 border-indigo-500 text-indigo-200 font-semibold' 
                  : 'text-slate-300 hover:bg-slate-800/40 hover:text-slate-100'
              }`}
            >
              <FileCode className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
              <span>{item.name}</span>
            </button>
          )}
          {hasChildren && renderTree(item.children, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 font-sans pb-16">
      {/* Background Glow Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/30 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl shadow-lg shadow-indigo-500/25">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                InsightForge
              </h1>
              <p className="text-xs text-indigo-400 font-mono">MERN MVC Architecture Boilerplate</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Status indicator */}
            <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  healthStatus.status === 'ONLINE' ? 'bg-emerald-400' : healthStatus.status === 'LOADING' ? 'bg-amber-400' : 'bg-rose-500'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  healthStatus.status === 'ONLINE' ? 'bg-emerald-500' : healthStatus.status === 'LOADING' ? 'bg-amber-500' : 'bg-rose-600'
                }`}></span>
              </span>
              <span className="text-xs font-mono text-slate-400">
                API Backend: <strong className={healthStatus.status === 'ONLINE' ? 'text-emerald-400' : 'text-rose-400'}>{healthStatus.status}</strong>
              </span>
            </div>
            <button 
              onClick={checkHealthAndFetchUsers} 
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all hover:scale-105"
              title="Refresh connection"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Tree and MVC explanations */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" /> Directory Structure
            </h2>
            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/60 max-h-[350px] overflow-y-auto">
              {renderTree(fileTree)}
            </div>
            <p className="text-xs text-slate-500 mt-3 italic font-mono">
              * Click a file to inspect its architectural purpose.
            </p>
          </div>

          {/* Detailed inspect card */}
          {selectedFile && (
            <div className="bg-gradient-to-b from-indigo-900/20 to-slate-900/40 border border-indigo-500/20 rounded-2xl p-6 backdrop-blur-md transition-all shadow-md">
              <div className="flex items-center space-x-2 text-indigo-400 mb-2">
                <Workflow className="w-5 h-5" />
                <span className="text-xs font-mono font-bold tracking-wide uppercase">{selectedFile.role}</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-mono">{selectedFile.name}</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{selectedFile.desc}</p>
            </div>
          )}
        </section>

        {/* Center/Right columns: Live MVC flow in action */}
        <section className="lg:col-span-8 flex flex-col gap-8">
          
          {/* MVC Flowchart Banner */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" /> MVC Data Flow Lifecycle
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center text-center text-xs font-mono">
              <div className="p-3 bg-indigo-950/50 rounded-xl border border-indigo-500/20 text-indigo-200">
                <span className="block font-bold text-sm mb-1 text-white">Client View</span>
                React (Vite)
              </div>
              <div className="text-slate-600 flex justify-center rotate-90 md:rotate-0">
                <ArrowRight className="w-5 h-5" />
              </div>
              <div className="p-3 bg-violet-950/50 rounded-xl border border-violet-500/20 text-violet-200">
                <span className="block font-bold text-sm mb-1 text-white">Router & Controller</span>
                Express.js
              </div>
              <div className="text-slate-600 flex justify-center rotate-90 md:rotate-0">
                <ArrowRight className="w-5 h-5" />
              </div>
              <div className="p-3 bg-emerald-950/50 rounded-xl border border-emerald-500/20 text-emerald-200">
                <span className="block font-bold text-sm mb-1 text-white">Model</span>
                MongoDB (Mongoose)
              </div>
            </div>
          </div>

          {/* User Form & List Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Create User Card (View interacts with Controller) */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" /> Register User
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="Min 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Add to Database</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {submitMessage && (
                <div className={`mt-4 p-3 rounded-lg flex items-start space-x-2 text-xs border ${
                  submitMessage.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}>
                  {submitMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{submitMessage.text}</span>
                </div>
              )}
            </div>

            {/* Users List (Model records rendered) */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md flex flex-col">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" /> Database Records (Users)
              </h3>
              
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[350px] pr-1">
                {users.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 font-mono text-sm border border-dashed border-slate-800 rounded-xl">
                    <Database className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    No users found
                  </div>
                ) : (
                  users.map((user) => (
                    <div 
                      key={user._id} 
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                        user._id.startsWith('mock_') 
                          ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700' 
                          : 'bg-indigo-950/20 border-indigo-900/30 hover:border-indigo-500/30'
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-200">{user.name}</span>
                          <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full ${
                            user.role === 'admin' ? 'bg-violet-500/25 text-violet-300' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</div>
                      </div>
                      <div className="text-right">
                        {user._id.startsWith('mock_') ? (
                          <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full font-mono">
                            Mock
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full font-mono">
                            Live DB
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-[10px] font-mono text-slate-500">
                <span>Count: {users.length}</span>
                <span className="flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  MERN Pipeline
                </span>
              </div>
            </div>

          </div>

        </section>

      </main>
    </div>
  );
}
