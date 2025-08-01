-- Create notification templates table
CREATE TABLE public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL, -- 'degen_call', 'newsletter_alert', 'general', etc.
  channel TEXT NOT NULL, -- 'telegram', 'email', 'sms', 'push'
  template_content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb, -- Array of variable names that can be used in template
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(template_type, channel, is_default) -- Only one default template per type/channel
);

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage notification templates" 
ON public.notification_templates 
FOR ALL
USING (is_current_user_admin());

CREATE POLICY "Users can view active notification templates" 
ON public.notification_templates 
FOR SELECT 
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_notification_templates_updated_at
BEFORE UPDATE ON public.notification_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default degen call template for Telegram
INSERT INTO public.notification_templates (
  name,
  description,
  template_type,
  channel,
  template_content,
  variables,
  is_default
) VALUES (
  'Degen Call Alert - Telegram',
  'Default template for degen call alerts sent via Telegram',
  'degen_call',
  'telegram',
  '🚨 DEGEN CALL ALERT 🚨

💎 {{market}} {{ticker}} {{entry_type}} {{trade_direction}}

🎯 Entry: {{entry_display}}
❌ Stop Loss: {{stop_loss_display}}
🚀 Targets: {{targets_display}}
⚖️ Risk: {{risk_percentage}}%

📝 {{description}}

🔥 This is a DEGEN CALL - Trade at your own risk!
📈 Not financial advice - DYOR!',
  '["market", "ticker", "entry_type", "trade_direction", "entry_display", "stop_loss_display", "targets_display", "risk_percentage", "description"]'::jsonb,
  true
);

-- Insert default degen call template for Email
INSERT INTO public.notification_templates (
  name,
  description,
  template_type,
  channel,
  template_content,
  variables,
  is_default
) VALUES (
  'Degen Call Alert - Email',
  'Default template for degen call alerts sent via Email',
  'degen_call',
  'email',
  '<h2>🚨 DEGEN CALL ALERT 🚨</h2>

<p><strong>Market:</strong> {{market}} {{ticker}}</p>
<p><strong>Direction:</strong> {{trade_direction}}</p>
<p><strong>Entry Type:</strong> {{entry_type}}</p>

<hr>

<p><strong>🎯 Entry:</strong> {{entry_display}}</p>
<p><strong>❌ Stop Loss:</strong> {{stop_loss_display}}</p>
<p><strong>🚀 Targets:</strong> {{targets_display}}</p>
<p><strong>⚖️ Risk:</strong> {{risk_percentage}}%</p>

<hr>

<p><strong>Analysis:</strong></p>
<p>{{description}}</p>

<hr>

<p><em>🔥 This is a DEGEN CALL - Trade at your own risk!</em></p>
<p><em>📈 Not financial advice - DYOR!</em></p>',
  '["market", "ticker", "entry_type", "trade_direction", "entry_display", "stop_loss_display", "targets_display", "risk_percentage", "description"]'::jsonb,
  true
);