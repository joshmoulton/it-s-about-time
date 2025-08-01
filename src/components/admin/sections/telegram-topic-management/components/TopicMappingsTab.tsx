
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import { TopicMappingForm } from './TopicMappingForm';

interface TopicMappingsTabProps {
  topicMappings: any[];
  mappingsLoading: boolean;
  selectedMapping: any;
  setSelectedMapping: (mapping: any) => void;
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (open: boolean) => void;
  updateTopicMapping: (id: string, data: any) => void;
  deleteTopicMapping: (id: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function TopicMappingsTab({
  topicMappings,
  mappingsLoading,
  selectedMapping,
  setSelectedMapping,
  isEditDialogOpen,
  setIsEditDialogOpen,
  updateTopicMapping,
  deleteTopicMapping,
  isUpdating,
  isDeleting
}: TopicMappingsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMappings = topicMappings?.filter(mapping =>
    mapping.custom_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.original_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Topic Mappings
        </CardTitle>
        <CardDescription>
          Manage custom names and categories for Telegram topics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search mappings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {mappingsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredMappings.length > 0 ? (
          <div className="space-y-4">
            {filteredMappings.map((mapping) => (
              <div key={mapping.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{mapping.custom_name}</h3>
                      <Badge variant="secondary">{mapping.category}</Badge>
                      {!mapping.is_active && (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Topic ID: {mapping.telegram_topic_id}</p>
                      {mapping.original_name && (
                        <p>Original: {mapping.original_name}</p>
                      )}
                      {mapping.description && (
                        <p>Description: {mapping.description}</p>
                      )}
                      <p>Created: {formatDateTime(mapping.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={isEditDialogOpen && selectedMapping?.id === mapping.id} onOpenChange={(open) => {
                      setIsEditDialogOpen(open);
                      if (!open) setSelectedMapping(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedMapping(mapping)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Topic Mapping</DialogTitle>
                          <DialogDescription>
                            Update the topic mapping details
                          </DialogDescription>
                        </DialogHeader>
                        <TopicMappingForm
                          initialData={selectedMapping}
                          onSubmit={(data) => {
                            updateTopicMapping(mapping.id, data);
                            setIsEditDialogOpen(false);
                            setSelectedMapping(null);
                          }}
                          isLoading={isUpdating}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteTopicMapping(mapping.id)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No topic mappings found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
