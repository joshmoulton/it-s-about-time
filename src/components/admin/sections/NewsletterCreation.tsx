
import React from 'react';
import { CreateNewsletterForm } from '../forms/CreateNewsletterForm';

interface NewsletterCreationProps {
  onCancel: () => void;
}

export function NewsletterCreation({ onCancel }: NewsletterCreationProps) {
  return <CreateNewsletterForm onCancel={onCancel} />;
}
