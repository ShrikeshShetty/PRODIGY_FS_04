"use client"

import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      const response = await axios.get("http://localhost:5000/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCurrentUser(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Auth check error:", error);
      localStorage.removeItem("token");
      setCurrentUser(null);
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);  // Clear any previous errors
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });
  
      // Check if response contains the necessary data (token and user)
      if (response.data.token && response.data.user) {
        localStorage.setItem("token", response.data.token);  // Store token in localStorage
        setCurrentUser(response.data.user);  // Set current user
        toast.success("Login successful!");  // Show success message
        return true;  // Return success
      } else {
        const msg = "Unexpected response data";  // In case data is not as expected
        console.error(msg);
        setError(msg);
        toast.error(msg);
        return false;  // Return failure
      }
    } catch (error) {
      // Handle errors when the response is not as expected
      const msg = error.response?.data?.message || error.message || "Login failed";  // Improved error handling
      console.error("Login error:", msg);  // Log the error for debugging
      setError(msg);
      toast.error(msg);  // Show error message
      return false;  // Return failure in case of an error
    }
  };
  

  const register = async (userData) => {
    try {
      setError(null);
      const response = await axios.post("http://localhost:5000/api/auth/register", userData);

      localStorage.setItem("token", response.data.token);
      setCurrentUser(response.data.user);
      toast.success("Registration successful!");
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.response?.data?.message || "Registration failed");
      toast.error(error.response?.data?.message || "Registration failed");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setCurrentUser(null);
    toast.info("You have been logged out");
  };

  const updateProfile = async (userData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put("http://localhost:5000/api/users/profile", userData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setCurrentUser(response.data);
      toast.success("Profile updated successfully!");
      return true;
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
      return false;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
