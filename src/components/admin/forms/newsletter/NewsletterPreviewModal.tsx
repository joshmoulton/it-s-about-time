
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface NewsletterPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  readTime: number;
  status: string;
}

export function NewsletterPreviewModal({
  open,
  onOpenChange,
  title,
  excerpt,
  content,
  tags,
  readTime,
  status
}: NewsletterPreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl space-y-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Newsletter Preview</span>
            <Badge variant={status === "draft" ? "secondary" : status === "published" ? "default" : "outline"}>
              {status.toUpperCase()}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          <div className="text-2xl font-bold">{title}</div>
          {excerpt && (
            <div className="text-base text-muted-foreground">{excerpt}</div>
          )}
        </div>
        <div className="prose prose-primary max-w-none py-2" style={{ whiteSpace: 'pre-line' }}>
          {content}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs mt-4">
          <span className="inline-block bg-muted px-2 py-0.5 rounded text-muted-foreground">
            {readTime} min read
          </span>
          {tags.map((tag, i) => (
            <span key={i} className="inline-block bg-accent px-2 py-0.5 rounded">
              #{tag.trim()}
            </span>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
