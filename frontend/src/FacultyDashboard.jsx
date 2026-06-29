export default function FacultyDashboard({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-blue-600">
        Hello, {user.fullName}
      </h1>

      <p className="text-gray-600 mt-2">
        Welcome to the Faculty Dashboard
      </p>

      <button
        onClick={onLogout}
        className="mt-6 bg-red-500 text-white px-5 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
}