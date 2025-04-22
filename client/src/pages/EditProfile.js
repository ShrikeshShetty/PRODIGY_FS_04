"use client"

import { useState, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { FaCamera } from "react-icons/fa"
import { AuthContext } from "../context/AuthContext"
import "./EditProfile.css"

const profileSchema = Yup.object().shape({
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  bio: Yup.string().max(150, "Bio must be less than 150 characters"),
})

const EditProfile = () => {
  const { currentUser, updateProfile } = useContext(AuthContext)
  const [profileImage, setProfileImage] = useState(null)
  const [profileImagePreview, setProfileImagePreview] = useState(currentUser.profileImage)
  const [coverImage, setCoverImage] = useState(null)
  const [coverImagePreview, setCoverImagePreview] = useState(currentUser.coverImage)
  const navigate = useNavigate()

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setProfileImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setCoverImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const formData = new FormData()
      formData.append("firstName", values.firstName)
      formData.append("lastName", values.lastName)
      formData.append("bio", values.bio)

      if (profileImage) {
        formData.append("profileImage", profileImage)
      }

      if (coverImage) {
        formData.append("coverImage", coverImage)
      }

      const success = await updateProfile(formData)

      if (success) {
        navigate(`/profile/${currentUser.username}`)
      }
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="edit-profile-container">
      <div className="edit-profile-card">
        <h1>Edit Profile</h1>

        <div className="cover-image-container">
          <div className="cover-image-preview">
            {coverImagePreview && <img src={coverImagePreview || "/placeholder.svg"} alt="Cover" />}
          </div>
          <label className="cover-image-upload">
            <FaCamera />
            <span>Change Cover</span>
            <input type="file" accept="image/*" onChange={handleCoverImageChange} style={{ display: "none" }} />
          </label>
        </div>

        <div className="profile-image-container">
          <div className="profile-image-preview">
            <img src={profileImagePreview || "/placeholder-user.jpg"} alt={currentUser.username} />
          </div>
          <label className="profile-image-upload">
            <FaCamera />
            <input type="file" accept="image/*" onChange={handleProfileImageChange} style={{ display: "none" }} />
          </label>
        </div>

        <Formik
          initialValues={{
            firstName: currentUser.firstName || "",
            lastName: currentUser.lastName || "",
            bio: currentUser.bio || "",
          }}
          validationSchema={profileSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="edit-profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <Field type="text" name="firstName" id="firstName" className="form-control" />
                  <ErrorMessage name="firstName" component="div" className="form-error" />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <Field type="text" name="lastName" id="lastName" className="form-control" />
                  <ErrorMessage name="lastName" component="div" className="form-error" />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <Field as="textarea" name="bio" id="bio" className="form-control textarea" rows="4" />
                <ErrorMessage name="bio" component="div" className="form-error" />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => navigate(`/profile/${currentUser.username}`)}
                >
                  Cancel
                </button>
                <button type="submit" className="save-button" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  )
}

export default EditProfile
