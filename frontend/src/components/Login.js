import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import axios from 'axios'; 
import '../App.css';

const Login = () => {
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const navigate = useNavigate(); 

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData({
      ...loginData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('/api/user/login', loginData);

      if (response.data.token) {
        // Store user data and token in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify({
          id: response.data.user._id,
          name: response.data.user.name,
          email: response.data.user.email,
          role: response.data.user.role
        }));
        
        // Redirect user based on role
        if (response.data.user.role === 'exporter') {
          navigate('/exporter-dashboard');
        } else if (response.data.user.role === 'buyer') {
          navigate('/buyer-dashboard');
        }
      } else {
        setError('Login failed: No token received');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Invalid email or password');
      setLoginData({ email: '', password: '' });
    }
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="form-container">
      <h2 className="form-title">Login</h2>
                      {error && typeof error === 'string' && <p className="error-msg">{error}</p>}
      <form onSubmit={handleSubmit} className="form">
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          value={loginData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          required
        />

        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          name="password"
          value={loginData.password}
          onChange={handleChange}
          placeholder="Enter your password"
          required
        />
        <button type="submit" className="submit-btn">Login</button>
      </form>

      <p>
        Don't have an account?{' '}
        <Link to="/register" className="register-link">
          Register here
        </Link>
      </p>
    </div>
  );
};

export default Login;
