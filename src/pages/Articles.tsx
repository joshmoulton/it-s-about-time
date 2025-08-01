
import React from 'react';
import { Navigate } from 'react-router-dom';

const Articles = () => {
  // Redirect articles page to dashboard content section
  return <Navigate to="/dashboard?section=content&tab=articles" replace />;
};

export default Articles;
