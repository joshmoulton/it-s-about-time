
import React from 'react';
import { Navigate } from 'react-router-dom';

const Courses = () => {
  // Redirect courses page to dashboard content section
  return <Navigate to="/dashboard?section=content&tab=courses" replace />;
};

export default Courses;
