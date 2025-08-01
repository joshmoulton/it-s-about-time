
export async function processMessageMedia(
  message: any,
  botToken: string
): Promise<{ messageType: string; mediaUrl: string | null; mediaType: string | null }> {
  let messageType = 'text';
  let mediaUrl = null;
  let mediaType = null;

  if (message.photo && message.photo.length > 0) {
    messageType = 'photo';
    mediaType = 'image';
    // Get the largest photo
    const largestPhoto = message.photo[message.photo.length - 1];
    
    try {
      // Get file path from Telegram
      const fileResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${largestPhoto.file_id}`);
      const fileData = await fileResponse.json();
      if (fileData.ok && fileData.result.file_path) {
        mediaUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
      }
    } catch (error) {
      console.error('Error getting photo file path:', error);
    }
  } else if (message.document) {
    messageType = 'document';
    mediaType = message.document.mime_type || 'application/octet-stream';
    
    try {
      // Get file path from Telegram
      const fileResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${message.document.file_id}`);
      const fileData = await fileResponse.json();
      if (fileData.ok && fileData.result.file_path) {
        mediaUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
      }
    } catch (error) {
      console.error('Error getting document file path:', error);
    }
  }

  return { messageType, mediaUrl, mediaType };
}
