import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const Register = () => {
  const [userData, setUserData] = useState({
    fullName: '',
    email: '',
    role: '',
    password: '',
    confirmPassword: '',
    certifications: '',
  });

  const [roles, setRoles] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

 
  axios.defaults.baseURL = 'http://localhost:3000';
  axios.defaults.headers.common['Content-Type'] = 'application/json';

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await axios.get('/api/user/roles');
        if (Array.isArray(response.data)) {
          setRoles(response.data);
        } else {
          console.error('Invalid roles data received:', response.data);
          setRoles([]);
        }
      } catch (err) {
        console.error('Error fetching roles:', err);
        setRoles([]);
        setError('Failed to load roles. Please refresh the page.');
      }
    };

    fetchRoles();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData({
      ...userData,
      [name]: value,
    });
  };

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (userData.password.length < 8) {
      setError('Password must be at least 8 characters long!');
      return;
    }

    if (userData.password !== userData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    try {
      const payload = {
        name: userData.fullName,
        email: userData.email,
        password: userData.confirmPassword,
        role: userData.role,
      };

      // Only add certifications if role is exporter and field is not empty
      if (userData.role === 'exporter' && userData.certifications) {
        payload.certifications = userData.certifications.split(',').map(c => c.trim());
      }

      const response = await axios.post('/api/user/register', payload);

      if (response.data) {
        setSuccessMessage('User registered successfully!');
        setUserData({
          fullName: '',
          email: '',
          role: '',
          password: '',
          confirmPassword: '',
          certifications: '',
        });

        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'An error occurred while registering.');
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Register</h2>
      <form onSubmit={handleSubmit} className="form">
        {error && <p className="error-msg">{error}</p>}
        {successMessage && <p className="message success">{successMessage}</p>}

        <label htmlFor="fullName">Full Name:</label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          value={userData.fullName}
          onChange={handleChange}
          placeholder="Enter your full name"
          required
        />

        <label htmlFor="role">Role:</label>
        <select
          id="role"
          name="role"
          value={userData.role}
          onChange={handleChange}
          required
        >
          <option value="">Select a role</option>
          {roles.map((role, index) => (
            <option key={index} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
          ))}
        </select>

        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          value={userData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          required
        />

        {userData.role === 'exporter' && (
          <>
            <label htmlFor="certifications">Certifications (optional):</label>
            <input
              type="text"
              id="certifications"
              name="certifications"
              value={userData.certifications}
              onChange={handleChange}
              placeholder="Enter certifications, separated by commas"
            />
          </>
        )}

        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          name="password"
          value={userData.password}
          onChange={handleChange}
          placeholder="Enter your password"
          required
        />

        <label htmlFor="confirmPassword">Confirm Password:</label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={userData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm your password"
          required
        />

        <button type="submit" className="submit-btn">Register</button>
      </form>
      <p>
        Already have an account?{' '}
        <Link to="/login" className="login-link">
          Login
        </Link>
      </p>
    </div>
  );
};

export default Register;
