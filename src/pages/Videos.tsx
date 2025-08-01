
import React from 'react';
import { Navigate } from 'react-router-dom';

const Videos = () => {
  // Redirect videos page to dashboard content section
  return <Navigate to="/dashboard?section=content&tab=videos" replace />;
};

export default Videos;
