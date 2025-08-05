import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Ban, Plus, Trash2, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface BlacklistedNewsletter {
  id: string;
  beehiiv_post_id: string;
  title: string;
  reason: string;
  blacklisted_by: string;
  blacklisted_at: string;
  created_at: string;
}

export function NewsletterBlacklistSection() {
  const [blacklistedNewsletters, setBlacklistedNewsletters] = useState<BlacklistedNewsletter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    beehiiv_post_id: '',
    title: '',
    reason: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadBlacklistedNewsletters();
  }, []);

  const loadBlacklistedNewsletters = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletter_blacklist')
        .select('*')
        .order('blacklisted_at', { ascending: false });

      if (error) throw error;
      setBlacklistedNewsletters(data || []);
    } catch (error: any) {
      console.error('Error loading blacklisted newsletters:', error);
      toast({
        title: 'Error',
        description: 'Failed to load blacklisted newsletters',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToBlacklist = async () => {
    if (!formData.beehiiv_post_id.trim() || !formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'BeehiIV Post ID and title are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.rpc('blacklist_newsletter', {
        p_beehiiv_post_id: formData.beehiiv_post_id.trim(),
        p_title: formData.title.trim(),
        p_reason: formData.reason.trim() || 'Manually blacklisted via admin panel'
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Newsletter added to blacklist',
      });

      setShowAddDialog(false);
      setFormData({ beehiiv_post_id: '', title: '', reason: '' });
      loadBlacklistedNewsletters();
    } catch (error: any) {
      console.error('Error adding to blacklist:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add newsletter to blacklist',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveFromBlacklist = async (id: string) => {
    try {
      const { error } = await supabase
        .from('newsletter_blacklist')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Newsletter removed from blacklist',
      });

      setDeleteId(null);
      loadBlacklistedNewsletters();
    } catch (error: any) {
      console.error('Error removing from blacklist:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove newsletter from blacklist',
        variant: 'destructive',
      });
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Ban className="h-5 w-5" />
                  <CardTitle>Newsletter Blacklist</CardTitle>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                {!isOpen && blacklistedNewsletters.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {blacklistedNewsletters.length} blacklisted
                  </Badge>
                )}
              </div>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddDialog(true);
                }} 
                size="sm" 
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add to Blacklist
              </Button>
            </div>
            <CardDescription>
              Prevent specific newsletters from syncing from BeehiIV
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading blacklisted newsletters...</p>
                </div>
              ) : blacklistedNewsletters.length === 0 ? (
                <div className="text-center py-8">
                  <Ban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No newsletters are currently blacklisted</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>BeehiIV Post ID</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Blacklisted By</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blacklistedNewsletters.map((newsletter) => (
                        <TableRow key={newsletter.id}>
                          <TableCell className="font-medium">{newsletter.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {newsletter.beehiiv_post_id}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={newsletter.reason}>
                              {newsletter.reason || 'No reason provided'}
                            </div>
                          </TableCell>
                          <TableCell>{newsletter.blacklisted_by}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDistanceToNow(new Date(newsletter.blacklisted_at), { addSuffix: true })}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteId(newsletter.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">How it works:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Blacklisted newsletters will be completely skipped during sync</li>
                  <li>• The sync function checks the blacklist before processing each newsletter</li>
                  <li>• Blacklisted newsletters won't appear even if they're updated in BeehiIV</li>
                  <li>• You can remove newsletters from the blacklist to allow them to sync again</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>

        {/* Add to Blacklist Dialog */}
        <AlertDialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Add Newsletter to Blacklist</AlertDialogTitle>
              <AlertDialogDescription>
                Enter the BeehiIV post ID and title of the newsletter you want to prevent from syncing.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="beehiiv_post_id">BeehiIV Post ID</Label>
                <Input
                  id="beehiiv_post_id"
                  value={formData.beehiiv_post_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, beehiiv_post_id: e.target.value }))}
                  placeholder="e.g., monthly-report-october-2023"
                />
              </div>
              <div>
                <Label htmlFor="title">Newsletter Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Monthly Report: October 2023"
                />
              </div>
              <div>
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Why is this newsletter being blacklisted?"
                  rows={3}
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleAddToBlacklist}>
                Add to Blacklist
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Remove from Blacklist Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove from Blacklist</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this newsletter from the blacklist? 
                It will be able to sync from BeehiIV again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && handleRemoveFromBlacklist(deleteId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remove from Blacklist
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </Collapsible>
  );
}