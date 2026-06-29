import React, { useState } from "react";

export default function AuthPage({ onLoginSuccess }) {
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
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Server connection failed");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="bg-white shadow-lg rounded-xl w-full max-w-md p-8">

        {/* Header */}
        <h1 className="text-3xl font-bold text-center text-blue-600">
          ThesisSphere
        </h1>

        <p className="text-center text-gray-500 mt-2 mb-6">
          {isLogin ? "Login to your account" : "Create a new account"}
        </p>

        {/* Role Selection */}
        {!isLogin && (
          <div className="flex gap-3 mb-5">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`flex-1 p-2 rounded border ${
                role === "student"
                  ? "bg-blue-600 text-white"
                  : "bg-white"
              }`}
            >
              Student
            </button>

            <button
              type="button"
              onClick={() => setRole("faculty")}
              className={`flex-1 p-2 rounded border ${
                role === "faculty"
                  ? "bg-blue-600 text-white"
                  : "bg-white"
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
              className="w-full border rounded p-3"
              required
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border rounded p-3"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full border rounded p-3"
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
                className="w-full border rounded p-3"
                required
              />

              <input
                type="text"
                name="department"
                placeholder="Department"
                value={formData.department}
                onChange={handleChange}
                className="w-full border rounded p-3"
              />

              <input
                type="text"
                name="university"
                placeholder="University"
                value={formData.university}
                onChange={handleChange}
                className="w-full border rounded p-3"
              />

              {role === "student" && (
                <>
                  <input
                    type="text"
                    name="studentId"
                    placeholder="Student ID"
                    value={formData.studentId}
                    onChange={handleChange}
                    className="w-full border rounded p-3"
                  />

                  <input
                    type="text"
                    name="semester"
                    placeholder="Semester"
                    value={formData.semester}
                    onChange={handleChange}
                    className="w-full border rounded p-3"
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
                  className="w-full border rounded p-3"
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
        <div className="text-center mt-5">
          {isLogin ? (
            <>
              Don't have an account?{" "}
              <button
                onClick={() => setIsLogin(false)}
                className="text-blue-600 font-semibold"
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => setIsLogin(true)}
                className="text-blue-600 font-semibold"
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