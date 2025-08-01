
export async function deleteWebhook(botToken: string): Promise<boolean> {
  try {
    const deleteWebhookUrl = `https://api.telegram.org/bot${botToken}/deleteWebhook`;
    const deleteResponse = await fetch(deleteWebhookUrl, { method: 'POST' });
    const deleteData = await deleteResponse.json();
    console.log('Webhook deletion response:', deleteData);

    if (!deleteData.ok) {
      console.error('Failed to delete webhook:', deleteData);
      throw new Error(`Failed to delete webhook: ${deleteData.description}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting webhook:', error);
    throw error;
  }
}

export async function setWebhook(botToken: string, webhookUrl: string): Promise<boolean> {
  try {
    const setWebhookUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;
    const webhookResponse = await fetch(setWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url: webhookUrl,
        allowed_updates: ["message"]
      }),
    });
    const webhookData = await webhookResponse.json();
    console.log('Webhook set response:', webhookData);
    return webhookData.ok;
  } catch (error) {
    console.error('Error setting webhook:', error);
    return false;
  }
}
