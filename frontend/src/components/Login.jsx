import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { showNotification } from "./Notification";

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validasi field kosong
    if (!username.trim() || !password.trim()) {
      showNotification("Username dan password harus diisi", "error");
      setIsLoading(false);
      return;
    }

    try {
      const response = await authAPI.login(username, password);
      if (response.success) {
        onLogin(response.data.admin);
      }
    } catch (err) {
      // Determine error type and redirect to error page for server errors
      const errorMessage = err.message || "";
      const isServerError = 
        errorMessage.toLowerCase().includes("server") ||
        errorMessage.toLowerCase().includes("network") ||
        errorMessage.toLowerCase().includes("database") ||
        errorMessage.toLowerCase().includes("timeout") ||
        errorMessage.toLowerCase().includes("failed to fetch") ||
        errorMessage.toLowerCase().includes("connection") ||
        err.status >= 500;

      if (isServerError) {
        // Determine specific error type
        let errorType = "server";
        if (errorMessage.toLowerCase().includes("database") || errorMessage.toLowerCase().includes("db")) {
          errorType = "database";
        } else if (errorMessage.toLowerCase().includes("network") || errorMessage.toLowerCase().includes("failed to fetch") || errorMessage.toLowerCase().includes("connection")) {
          errorType = "network";
        } else if (errorMessage.toLowerCase().includes("timeout")) {
          errorType = "timeout";
        }

        navigate("/error", {
          state: {
            errorDetails: {
              type: errorType,
              message: errorMessage
            }
          }
        });
      } else {
        // For auth errors, show notification
        showNotification(err.message || "Login gagal. Periksa username dan password.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold text-center text-blue-800 mb-6">Login Admin</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Masukkan username"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Masukkan password"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-800 text-white font-bold py-2 px-4 rounded hover:bg-blue-900 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
