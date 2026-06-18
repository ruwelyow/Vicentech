# OpenAI Chat Integration Setup

This guide will help you set up the OpenAI chat integration for your church website.

## Prerequisites

1. An OpenAI API key (get one from https://platform.openai.com/api-keys)
2. Laravel application with the required packages installed

## Setup Steps

### 1. Environment Configuration

Add the following variables to your `.env` file:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_ORGANIZATION=your_organization_id_optional
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_REQUEST_TIMEOUT=30
```

### 2. Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key and add it to your `.env` file

### 3. Test the Integration

1. Start your Laravel development server:
   ```bash
   php artisan serve
   ```

2. Navigate to your homepage and test the chat feature

3. Try asking questions like:
   - "What are your mass schedules?"
   - "Where are you located?"
   - "How can I contact you?"

## Features

- **AI-Powered Responses**: Uses OpenAI's GPT-3.5-turbo model for intelligent responses
- **Fallback System**: If OpenAI is unavailable, falls back to predefined responses
- **Loading States**: Shows typing indicators while waiting for responses
- **Error Handling**: Graceful error handling with user-friendly messages
- **Church-Specific Context**: AI is trained to provide church-related information

## API Endpoint

The chat API is available at: `POST /api/chat`

Request body:
```json
{
  "message": "Your message here"
}
```

Response:
```json
{
  "success": true,
  "response": "AI response here"
}
```

## Customization

You can customize the AI's behavior by modifying the system prompt in `app/Http/Controllers/ChatController.php`:

```php
$systemPrompt = "You are a helpful assistant for the Diocesan Shrine of San Vicente Ferrer Church...";
```

## Troubleshooting

1. **API Key Issues**: Make sure your OpenAI API key is valid and has sufficient credits
2. **Rate Limiting**: OpenAI has rate limits. The system includes fallback responses for such cases
3. **Network Issues**: Check your internet connection and firewall settings

## Security Notes

- Never commit your API key to version control
- Consider implementing rate limiting for the chat endpoint
- Monitor API usage to control costs

## Cost Considerations

- OpenAI charges per token used
- GPT-3.5-turbo is relatively inexpensive (~$0.002 per 1K tokens)
- Monitor your usage in the OpenAI dashboard 