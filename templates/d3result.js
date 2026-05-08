const axios = require('axios');

const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID_1;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

async function d3CampaignMessage(to, name, score, riskLevel) {
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
          name: "d3_campaign_1",
          language: { code: "en_US" },
          components: [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: name        // {{1}} → name
                },
                {
                  type: "text",
                  text: String(score)      // {{2}} → score
                },
                {
                  type: "text",
                  text: riskLevel   // {{3}} → risk level
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

module.exports = d3CampaignMessage;
