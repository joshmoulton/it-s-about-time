
import React from 'react';
import { CreateArticleForm } from '../forms/CreateArticleForm';

interface ArticleCreationProps {
  onCancel: () => void;
}

export function ArticleCreation({ onCancel }: ArticleCreationProps) {
  return <CreateArticleForm onCancel={onCancel} />;
}
