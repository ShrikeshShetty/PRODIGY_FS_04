"use client";

import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { AuthContext } from "../context/AuthContext";
import "./Auth.css";

const registerSchema = Yup.object().shape({
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  username: Yup.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters")
    .matches(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores")
    .required("Username is required"),
  email: Yup.string().email("Invalid email address").required("Email is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Confirm password is required"),
});

const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    try {
      const formData = new FormData();
      formData.append("firstName", values.firstName);
      formData.append("lastName", values.lastName);
      formData.append("username", values.username);
      formData.append("email", values.email);
      formData.append("password", values.password);
      if (values.bio) formData.append("bio", values.bio);
      if (values.profileImage) formData.append("profileImage", values.profileImage);
      if (values.coverImage) formData.append("coverImage", values.coverImage);

      const success = await register(formData);

      if (success) {
        navigate("/");
      }
    } catch (error) {
      setStatus({ error: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Trend Engage</h1>
          <p>Create a new account</p>
        </div>

        <Formik
          initialValues={{
            firstName: "",
            lastName: "",
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
            bio: "",
            profileImage: null,
            coverImage: null,
          }}
          validationSchema={registerSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, setFieldValue, status }) => (
            <Form className="auth-form">
              {status && status.error && <div className="auth-error">{status.error}</div>}

              <div className="form-row">
                <div className="form-group">
                  <Field type="text" name="firstName" placeholder="First Name" className="form-control" />
                  <ErrorMessage name="firstName" component="div" className="form-error" />
                </div>

                <div className="form-group">
                  <Field type="text" name="lastName" placeholder="Last Name" className="form-control" />
                  <ErrorMessage name="lastName" component="div" className="form-error" />
                </div>
              </div>

              <div className="form-group">
                <Field type="text" name="username" placeholder="Username" className="form-control" />
                <ErrorMessage name="username" component="div" className="form-error" />
              </div>

              <div className="form-group">
                <Field type="email" name="email" placeholder="Email" className="form-control" />
                <ErrorMessage name="email" component="div" className="form-error" />
              </div>

              <div className="form-group">
                <Field type="password" name="password" placeholder="Password" className="form-control" />
                <ErrorMessage name="password" component="div" className="form-error" />
              </div>

              <div className="form-group">
                <Field type="password" name="confirmPassword" placeholder="Confirm Password" className="form-control" />
                <ErrorMessage name="confirmPassword" component="div" className="form-error" />
              </div>

              <div className="form-group">
                <textarea
                  name="bio"
                  placeholder="Short Bio"
                  className="form-control"
                  onChange={(e) => setFieldValue("bio", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Profile Image</label>
                <input
                  type="file"
                  name="profileImage"
                  accept="image/*"
                  onChange={(e) => setFieldValue("profileImage", e.target.files[0])}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Cover Image</label>
                <input
                  type="file"
                  name="coverImage"
                  accept="image/*"
                  onChange={(e) => setFieldValue("coverImage", e.target.files[0])}
                  className="form-control"
                />
              </div>

              <button type="submit" disabled={isSubmitting} className="submit-btn">
                Register
              </button>

              <p className="auth-footer">
                Already have an account? <Link to="/login">Login</Link>
              </p>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default Register;
