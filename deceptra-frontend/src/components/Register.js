import React, { useState } from 'react';

const Register = ({ onSwitchToLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://127.0.0.1:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Account created! Please log in.');
        setTimeout(() => onSwitchToLogin(), 2000);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-black/40 backdrop-blur-xl p-8 rounded-2xl border border-white/20 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
          ScamShield AI
        </h2>
        <h3 className="text-xl text-center mb-6">Register</h3>
        {error && <div className="bg-red-500/20 text-red-400 p-2 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-500/20 text-green-400 p-2 rounded mb-4">{success}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 mb-4 rounded-lg bg-white/5 border border-white/20 focus:border-cyan-400 outline-none"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 mb-4 rounded-lg bg-white/5 border border-white/20 focus:border-cyan-400 outline-none"
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full p-3 mb-6 rounded-lg bg-white/5 border border-white/20 focus:border-cyan-400 outline-none"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 transition font-semibold"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="text-center mt-4 text-gray-400">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="text-cyan-400 hover:underline">
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;