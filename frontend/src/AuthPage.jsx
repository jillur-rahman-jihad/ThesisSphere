import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
    university: "",
    studentId: "",
    semester: "",
    designation: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLogin && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin
        ? "/api/auth/login"
        : "/api/auth/register";

      const body = isLogin
        ? {
            email: formData.email,
            password: formData.password,
          }
        : {
            fullName: formData.fullName,
            email: formData.email,
            password: formData.password,
            role,
            department: formData.department,
            university: formData.university,
            ...(role === "student" && {
              studentId: formData.studentId,
              semester: formData.semester,
            }),
            ...(role === "faculty" && {
              designation: formData.designation,
            }),
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem(
          "thesisSphereUser",
          JSON.stringify(data.data)
        );

        if (onLoginSuccess) {
          onLoginSuccess(data.data);
        }
        
        // Force redirect to the main dashboard instead of staying on the current URL
        navigate('/');
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Server connection failed");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex justify-center items-center p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-md p-8">

        {/* Header */}
        <h1 className="text-3xl font-bold text-center text-blue-600 dark:text-blue-500">
          ThesisSphere
        </h1>

        <p className="text-center text-slate-500 dark:text-slate-400 mt-2 mb-6">
          {isLogin ? "Login to your account" : "Create a new account"}
        </p>

        {/* Role Selection */}
        {!isLogin && (
          <div className="flex gap-3 mb-5">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`flex-1 p-2 rounded border transition-colors ${
                role === "student"
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              Student
            </button>

            <button
              type="button"
              onClick={() => setRole("faculty")}
              className={`flex-1 p-2 rounded border transition-colors ${
                role === "faculty"
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              Faculty
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {!isLogin && (
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full border border-slate-300 dark:border-slate-600 rounded p-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              required
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border rounded p-3 text-black"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full border rounded p-3 text-black "
            required
          />

          {!isLogin && (
            <>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full border border-slate-300 dark:border-slate-600 rounded p-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                required
              />

              <input
                type="text"
                name="department"
                placeholder="Department"
                value={formData.department}
                onChange={handleChange}
                className="w-full border border-slate-300 dark:border-slate-600 rounded p-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />

              <input
                type="text"
                name="university"
                placeholder="University"
                value={formData.university}
                onChange={handleChange}
                className="w-full border border-slate-300 dark:border-slate-600 rounded p-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />

              {role === "student" && (
                <>
                  <input
                    type="text"
                    name="studentId"
                    placeholder="Student ID"
                    value={formData.studentId}
                    onChange={handleChange}
                    className="w-full border rounded p-3 text-black"
                  />

                  <input
                    type="text"
                    name="semester"
                    placeholder="Semester"
                    value={formData.semester}
                    onChange={handleChange}
                    className="w-full border rounded p-3 text-black"
                  />
                </>
              )}

              {role === "faculty" && (
                <input
                  type="text"
                  name="designation"
                  placeholder="Designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className="w-full border rounded p-3 text-black"
                />
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700"
          >
            {loading
              ? "Please wait..."
              : isLogin
              ? "Login"
              : "Register"}
          </button>
        </form>

        {/* Toggle */}
        <div className="text-center mt-5 text-black">
          {isLogin ? (
            <>
              Don't have an account?{" "}
              <button
                onClick={() => setIsLogin(false)}
                className="text-blue-600 font-semibold text-black"
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => setIsLogin(true)}
                className="text-blue-600 font-semibold text-black"
              >
                Login
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}