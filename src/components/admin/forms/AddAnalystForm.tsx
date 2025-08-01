
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPlus, X } from 'lucide-react';

interface AddAnalystFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddAnalystForm({ onClose, onSuccess }: AddAnalystFormProps) {
  const [email, setEmail] = useState('');
  const [analystName, setAnalystName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error('Please enter a valid email address');
        return;
      }

      // Create analyst user (verification will happen through secure system)
      const { error } = await supabase
        .from('admin_users')
        .insert({
          email: email,
          role: 'analyst',
          permissions: {
            create_signals: true,
            manage_own_signals: true,
            view_signals: true,
            post_to_telegram: true,
            specialization: specialization,
            analyst_name: analystName,
            description: description
          },
          is_active: true,
          user_type: 'analyst'
        });

      if (error) throw error;

      toast.success('Analyst added successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding analyst:', error);
      toast.error('Failed to add analyst');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700 w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Analyst
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-slate-300">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="analyst@example.com"
              required
            />
            <p className="text-xs text-slate-400 mt-1">
              User will verify access through our secure system
            </p>
          </div>

          <div>
            <Label htmlFor="analystName" className="text-slate-300">
              Analyst Display Name
            </Label>
            <Input
              id="analystName"
              value={analystName}
              onChange={(e) => setAnalystName(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <Label htmlFor="specialization" className="text-slate-300">
              Specialization
            </Label>
            <Select value={specialization} onValueChange={setSpecialization}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Select specialization" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="crypto">Cryptocurrency</SelectItem>
                <SelectItem value="stocks">Stock Market</SelectItem>
                <SelectItem value="forex">Forex</SelectItem>
                <SelectItem value="commodities">Commodities</SelectItem>
                <SelectItem value="options">Options Trading</SelectItem>
                <SelectItem value="futures">Futures Trading</SelectItem>
                <SelectItem value="general">General Trading</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description" className="text-slate-300">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="Brief description of the analyst's background and expertise..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? 'Adding...' : 'Add Analyst'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
