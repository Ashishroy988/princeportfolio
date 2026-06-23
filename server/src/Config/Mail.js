import SibApiV3Sdk from "sib-api-v3-sdk";
import dotenv from "dotenv";

dotenv.config();

const defaultClient = SibApiV3Sdk.ApiClient.instance;

defaultClient.authentications["api-key"].apiKey =
  process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

export const sendMail = async ({
  name,
  email,
  projectType,
  message,
}) => {
  await apiInstance.sendTransacEmail({
    sender: {
      email: process.env.BREVO_SENDER_EMAIL,
      name: "Sonu Kumar Portfolio",
    },

    to: [
      {
        email: process.env.BREVO_RECEIVER_EMAIL,
      },
    ],

    replyTo: {
      email,
      name,
    },

    subject: `🎬 New Inquiry from ${name}`,

    htmlContent: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 650px;
        margin: auto;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        overflow: hidden;
        background: #ffffff;
      ">

        <!-- Header -->
        <div style="
          background: linear-gradient(135deg, #14b8a6, #0f766e);
          color: white;
          padding: 30px;
          text-align: center;
        ">
          <h1 style="margin: 0; font-size: 32px;">
          📩 Portfolio Inquiry
          </h1>

          <p style="
            margin-top: 10px;
            font-size: 16px;
            opacity: 0.9;
          ">
            A potential client has contacted you through your portfolio.
          </p>
        </div>

        <!-- Body -->
        <div style="padding: 30px;">

          <h2 style="
            color: #111827;
            margin-bottom: 20px;
          ">
            👤 Client Details
          </h2>

          <div style="
            line-height: 2;
            color: #374151;
            font-size: 16px;
          ">
            <p style="margin: 0 0 12px;">
              <strong>👤 Name:</strong> ${name}
            </p>

            <p style="margin: 0 0 12px;">
              <strong>📧 Email:</strong>
              <a href="mailto:${email}" style="
                color: #14b8a6;
                text-decoration: none;
              ">
                ${email}
              </a>
            </p>

            <p style="margin: 0;">
              <strong>🎞 Service:</strong> ${projectType}
            </p>
          </div>

          <!-- Project Requirements -->
          <div style="margin-top: 35px;">

            <h2 style="
              color: #111827;
              margin-bottom: 15px;
            ">
              📝 Project Requirements
            </h2>

            <div style="
              background: #f9fafb;
              border-left: 5px solid #14b8a6;
              padding: 20px;
              border-radius: 10px;
              line-height: 1.8;
              color: #374151;
              white-space: pre-wrap;
            ">
              ${message.replace(/\n/g, "<br>")}
            </div>

          </div>

          <!-- Reply Button -->
          <div style="
            text-align: center;
            margin-top: 35px;
          ">
            <a
              href="mailto:${email}"
              style="
                background: #14b8a6;
                color: white;
                text-decoration: none;
                padding: 14px 28px;
                border-radius: 10px;
                font-weight: bold;
                display: inline-block;
              "
            >
              Reply to Client
            </a>
          </div>

        </div>

        <!-- Footer -->
        <div style="
          background: #111827;
          color: #9ca3af;
          text-align: center;
          padding: 18px;
          font-size: 14px;
        ">
          Sent from Sonu Kumar's Portfolio Website
          <br><br>
          © ${new Date().getFullYear()} Sonu Kumar. All rights reserved.
        </div>

      </div>
    `,
  });
};