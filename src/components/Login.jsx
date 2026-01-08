import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  // Use 'admin' / 'password' as default mock credentials if you like, 
  // or just allow any non-empty input for this demo.
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple validation/mock auth
    if (username === 'admin' && password === 'admin123') {
      onLogin();
    } else {
      setError('Invalid username or password (try: admin / admin123)');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-center text-blue-800 mb-6">Login Admin</h2>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                    {error}
                </div>
            )}

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
                        placeholder="Enter username"
                        required
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
                        placeholder="Enter password"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-800 text-white font-bold py-2 px-4 rounded hover:bg-blue-900 transition duration-200"
                >
                    Login
                </button>
            </form>
            <div className="mt-4 text-center text-xs text-gray-500">
                <p>Default credentials: admin / admin123</p>
            </div>
        </div>
    </div>
  );
};

export default Login;
