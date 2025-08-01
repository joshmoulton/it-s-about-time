
import React from 'react';
import { CreateCourseForm } from '../forms/CreateCourseForm';

interface CourseCreationProps {
  onCancel: () => void;
}

export function CourseCreation({ onCancel }: CourseCreationProps) {
  return <CreateCourseForm onCancel={onCancel} />;
}
