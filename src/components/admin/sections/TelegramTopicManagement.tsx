
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RefreshCw, Plus, Loader2 } from 'lucide-react';
import { useTopicManagement } from '@/hooks/useTopicManagement';
import { TopicMappingForm } from './telegram-topic-management/components/TopicMappingForm';
import { TopicMappingsTab } from './telegram-topic-management/components/TopicMappingsTab';
import { SyncStatusTab } from './telegram-topic-management/components/SyncStatusTab';
import { TopicDiscoveryTab } from './telegram-topic-management/components/TopicDiscoveryTab';
import { MessageRecoveryTab } from './telegram-topic-management/components/MessageRecoveryTab';

export function TelegramTopicManagement() {
  const [selectedMapping, setSelectedMapping] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const {
    topicMappings,
    syncStatus,
    mappingsLoading,
    syncStatusLoading,
    createTopicMapping,
    updateTopicMapping,
    deleteTopicMapping,
    enhancedSync,
    stopSync,
    isCreating,
    isUpdating,
    isDeleting,
    isSyncing,
    isStopping
  } = useTopicManagement();

  return (
    <div className="space-y-6 bg-background text-foreground min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Telegram Topic Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage topic mappings and synchronization between Python bot and dashboard
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => enhancedSync({ includeTopicDiscovery: true, forceRefresh: true })}
            disabled={isSyncing}
            variant="outline"
            className="border-border hover:bg-accent hover:text-accent-foreground"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Enhanced Sync
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Create Mapping
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Topic Mapping</DialogTitle>
                <DialogDescription>
                  Create a custom mapping for a Telegram topic to display meaningful names in the chat interface.
                </DialogDescription>
              </DialogHeader>
              <TopicMappingForm
                onSubmit={(data) => {
                  createTopicMapping(data);
                  setIsCreateDialogOpen(false);
                }}
                isLoading={isCreating}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="recovery" className="space-y-6">
        <TabsList className="bg-muted text-muted-foreground border border-border">
          <TabsTrigger 
            value="recovery" 
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
          >
            Message Recovery
          </TabsTrigger>
          <TabsTrigger 
            value="mappings" 
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
          >
            Topic Mappings
          </TabsTrigger>
          <TabsTrigger 
            value="sync-status" 
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
          >
            Sync Status
          </TabsTrigger>
          <TabsTrigger 
            value="discovery" 
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
          >
            Topic Discovery
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recovery" className="space-y-4">
          <MessageRecoveryTab />
        </TabsContent>

        <TabsContent value="mappings" className="space-y-4">
          <TopicMappingsTab
            topicMappings={topicMappings}
            mappingsLoading={mappingsLoading}
            selectedMapping={selectedMapping}
            setSelectedMapping={setSelectedMapping}
            isEditDialogOpen={isEditDialogOpen}
            setIsEditDialogOpen={setIsEditDialogOpen}
            updateTopicMapping={updateTopicMapping}
            deleteTopicMapping={deleteTopicMapping}
            isUpdating={isUpdating}
            isDeleting={isDeleting}
          />
        </TabsContent>

        <TabsContent value="sync-status" className="space-y-4">
          <SyncStatusTab
            syncStatus={syncStatus}
            syncStatusLoading={syncStatusLoading}
            onStopSync={stopSync}
            isStopping={isStopping}
          />
        </TabsContent>

        <TabsContent value="discovery" className="space-y-4">
          <TopicDiscoveryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
