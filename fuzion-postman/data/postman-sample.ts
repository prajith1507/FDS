export const postmanSample = {
  info: {
    _postman_id: "cc249c51-df80-44b0-ae5a-f1012b9c9172",
    name: "OBL",
    schema:
      "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  item: [
    {
      name: "PM Assist",
      item: [
        {
          name: "PM Assist req",
          request: {
            method: "POST",
            header: [],
            body: {
              mode: "raw",
              raw: '{\t\r\n"platform":"slack",\r\n"platform_thread_id":"b22f3234-758d-4ed1-a2ac-36da6e951c22",\r\n"message":"hello",\r\n"platform_user_id":"U097H2Y3MLP"\r\n}',
            },
            url: {
              raw: "https://n8n.fuzionest.com/webhook/10d95d44-b0fa-4433-aa90-71f5008e6502",
            },
          },
          response: [],
        },
      ],
    },
    {
      name: "Slack messager",
      item: [
        {
          name: "Send Message",
          request: {
            method: "POST",
            header: [],
            body: {
              mode: "raw",
              raw: '{\r\n"userId": "U12345678",\r\n"platform":"slack",\r\n"slackId": "U097H2Y3MLP", \r\n"message": "What about the today\'s report"\r\n}',
            },
            url: {
              raw: "https://n8n.fuzionest.com/webhook/b1766d7c-f7fc-4dca-a1ea-0bda9d250e00",
            },
          },
          response: [],
        },
      ],
    },
  ],
} as const;
