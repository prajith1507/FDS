# Environment Configuration

This application uses environment variables for API configuration. Create a `.env.local` file in the root directory with the following variables:

## Required Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost
NEXT_PUBLIC_SAVE_API_ENDPOINT=/api/apis/create

# Collections API (if different from save API)
NEXT_PUBLIC_COLLECTIONS_URL=https://0shfds9x-4001.inc1.devtunnels.msapi/collections/
NEXT_PUBLIC_BULK_UPDATE_URL=https://0shfds9x-4001.inc1.devtunnels.msapi/collections/bulk-update
```

## API Endpoints

### Save API Request
- **URL**: `${NEXT_PUBLIC_API_BASE_URL}${NEXT_PUBLIC_SAVE_API_ENDPOINT}`
- **Method**: POST
- **Content-Type**: application/json
- **Payload Structure**:

```json
{
  "name": "Request Name",
  "key": "unique-request-id",
  "description": "Request description",
  "url": "https://api.example.com/endpoint",
  "base_url": null,
  "path": null,
  "method": "GET",
  "timeout": 30000,
  "headers": [],
  "query": [],
  "body": {
    "mode": "raw",
    "raw": "{\"data\": \"example\"}"
  },
  "response_schema": {},
  "sample_response": {},
  "token_api": null,
  "mapper_algorithm": "custom_dsl",
  "related_collections": [],
  "requested_schema_style": {},
  "source": {
    "base_url": null,
    "entity": null,
    "auth_kind": "bearer",
    "headers": {}
  },
  "tags": []
}
```

## Usage

1. **Saving Requests**: Use `Ctrl+S` to save the currently active request tab
2. **Toast Notifications**: The application will show success/error toasts with API response data
3. **Unsaved Indicators**: Orange dots appear on tabs with unsaved changes

## Development

Make sure your API server is running on the configured base URL and responds to the save endpoint with appropriate success/error status codes.