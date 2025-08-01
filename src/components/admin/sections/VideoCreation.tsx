
import React from 'react';
import { CreateVideoForm } from '../forms/CreateVideoForm';

interface VideoCreationProps {
  onCancel: () => void;
}

export function VideoCreation({ onCancel }: VideoCreationProps) {
  return <CreateVideoForm onCancel={onCancel} />;
}
