"use client"

import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { AuthContext } from "../context/AuthContext";
import "./Auth.css";

const loginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email address").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

const Login = () => {
  const { login, loading } = useContext(AuthContext);
  const [loginError, setLoginError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (values, { setSubmitting }) => {
    setLoginError(null);
    const result = await login(values.email, values.password);

    if (result === true) {
      navigate("/");
    } else {
      setLoginError(result);  // Show error message
    }

    setSubmitting(false);
  };

  if (loading) {
    return <div className="auth-loading">Loading...</div>;
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Trend Engage</h1>
          <p>Connect with friends and the world around you</p>
        </div>

        <Formik initialValues={{ email: "", password: "" }} validationSchema={loginSchema} onSubmit={handleSubmit}>
          {({ isSubmitting }) => (
            <Form className="auth-form">
              {loginError && <div className="auth-error">{loginError}</div>}

              <div className="form-group">
                <Field type="email" name="email" placeholder="Email" className="form-control" />
                <ErrorMessage name="email" component="div" className="form-error" />
              </div>

              <div className="form-group">
                <Field type="password" name="password" placeholder="Password" className="form-control" />
                <ErrorMessage name="password" component="div" className="form-error" />
              </div>

              <button type="submit" className="auth-button" disabled={isSubmitting}>
                {isSubmitting ? "Logging in..." : "Log In"}
              </button>
            </Form>
          )}
        </Formik>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
