// Temporary script to close REKT and LONG signals
const supabaseUrl = "https://wrvvlmevpvcenauglcyz.supabase.co";

async function closeSignals() {
  console.log('Closing REKT signal...');
  const rektResponse = await fetch(`${supabaseUrl}/functions/v1/telegram-bot`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndydnZsbWV2cHZjZW5hdWdsY3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTM5NTAsImV4cCI6MjA2NTQyOTk1MH0.iR1E5RqVrH7OsDdIqDvMWsc5d2jK9Qg9Ck-2lpi3E2g'
    },
    body: JSON.stringify({
      action: 'manual_close',
      ticker: 'REKT'
    })
  });
  const rektResult = await rektResponse.json();
  console.log('REKT result:', rektResult);

  console.log('Closing LONG signal...');
  const longResponse = await fetch(`${supabaseUrl}/functions/v1/telegram-bot`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndydnZsbWV2cHZjZW5hdWdsY3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTM5NTAsImV4cCI6MjA2NTQyOTk1MH0.iR1E5RqVrH7OsDdIqDvMWsc5d2jK9Qg9Ck-2lpi3E2g'
    },
    body: JSON.stringify({
      action: 'manual_close',
      ticker: 'LONG'
    })
  });
  const longResult = await longResponse.json();
  console.log('LONG result:', longResult);
}

closeSignals();