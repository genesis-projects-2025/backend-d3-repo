const axios = require('axios');

const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID_1;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

async function finalMessage(to, name) {
  try {
    const response = await axios({
      method: "post",
      url: `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: {
        messaging_product: "whatsapp",
        to: to,
        type: "template",
        template: {
          name: "account_creation_confirmation_5",
          language: { code: "en_US" },
          components: [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: name        // {{1}} in body → "John"
                }
              ]
            },
            {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [
                {
                  type: "text",
                  text: to          // {{1}} in URL → /dashboard/{phone}
                }
              ]
            }
          ]
        }
      }
    });

    console.log("✅ Message sent to", to);
    return response.data;

  } catch (error) {
    const errorData = error.response?.data || error.message;
    console.error("❌ WhatsApp Template Error:", errorData);
    throw new Error(JSON.stringify(errorData));
  }
}

module.exports = finalMessage;