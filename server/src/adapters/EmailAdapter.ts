import nodemailer from "nodemailer";
import CommunicationLog from "../models/CommunicationLog";

export class EmailAdapter {
  private static transporter: any = null;

  private static async getTransporter() {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      console.log(`[EmailAdapter] Initializing SMTP transporter (${host}:${port})`);
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });
    } else {
      console.log("[EmailAdapter] SMTP credentials not fully configured in env. Creating Ethereal SMTP test account...");
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        console.log(`[EmailAdapter] Generated Ethereal Test Credentials: User=${testAccount.user}`);
      } catch (err) {
        console.error("[EmailAdapter] Failed to generate Ethereal SMTP test account:", err);
      }
    }

    return this.transporter;
  }

  // Parses raw email body text
  public static parseEmailBody(body: string): string {
    return body;
  }

  // Formats the response email subject and HTML content
  public static formatEmailResponse(
    matches: any[],
    profile: any
  ): { subject: string; text: string; html: string } {
    const subject = `Eligible Government Schemes Recommendations for ${profile.name || "Kamla Devi"}`;
    
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <h2 style="color: #14b8a6; border-bottom: 2px solid #14b8a6; padding-bottom: 10px; margin-top: 0;">Setu AI Schemes Recommendations</h2>
        <p>Hello <strong>${profile.name || "Kamla Devi"}</strong>,</p>
        <p>Based on your profile details:</p>
        <ul style="background-color: #f8fafc; padding: 15px; list-style-type: none; border-radius: 6px; border-left: 4px solid #14b8a6;">
          <li><strong>Age:</strong> ${profile.age || "63"}</li>
          <li><strong>State:</strong> ${profile.state || "Uttar Pradesh"}</li>
          <li><strong>Occupation:</strong> ${profile.occupation || "Farmer"}</li>
          <li><strong>Annual Income:</strong> ₹${profile.annual_income || profile.income || "90,000"}</li>
        </ul>
        <p>Here are the top government welfare schemes you qualify for:</p>
    `;

    let text = `Hello ${profile.name || "Kamla Devi"},\n\nBased on your profile, here are the top schemes you qualify for:\n\n`;

    if (matches.length === 0) {
      const fallbackMsg = "We could not find any matching schemes at this moment. Please verify details or try again.";
      html += `<p style="color: #64748b;">${fallbackMsg}</p>`;
      text += fallbackMsg;
    } else {
      matches.slice(0, 3).forEach((scheme, index) => {
        const docs = scheme.required_documents?.map((d: string) => `<li>${d}</li>`).join("") || "<li>Aadhaar Card</li>";
        
        html += `
          <div style="background-color: #fafaf9; border: 1px solid #f5f5f4; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
            <h3 style="margin-top: 0; color: #0f172a;">${index + 1}. ${scheme.scheme_name}</h3>
            <p style="font-size: 14px; color: #475569; line-height: 1.5;">${scheme.summary}</p>
            <p><strong>🎯 Match Score:</strong> <span style="color: #22c55e; font-weight: bold;">${scheme.score}%</span></p>
            <p><strong>📄 Documents Required:</strong></p>
            <ul style="margin-top: 5px; padding-left: 20px;">${docs}</ul>
            ${
              scheme.official_link
                ? `<p style="margin-top: 15px;"><a href="${scheme.official_link}" style="background-color: #14b8a6; color: white; padding: 8px 15px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 13px; font-weight: bold;">Visit Official Portal</a></p>`
                : ""
            }
          </div>
        `;

        text += `${index + 1}. ${scheme.scheme_name}\n`;
        text += `Summary: ${scheme.summary}\n`;
        text += `Match Score: ${scheme.score}%\n`;
        if (scheme.official_link) text += `Link: ${scheme.official_link}\n`;
        text += `\n`;
      });
    }

    html += `
        <p style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12px; color: #94a3b8; text-align: center;">
          Sent by Setu AI - Bridging citizens with welfare schemes.
        </p>
      </div>
    `;

    text += `\nSent by Setu AI.`;

    return { subject, text, html };
  }

  // Sends the email using SMTP (Custom or Ethereal test sandbox)
  public static async sendMail(
    to: string,
    subject: string,
    text: string,
    html: string,
    userId?: string
  ): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();
      const from = process.env.EMAIL_FROM || "welfare@setu-ai.org";

      if (transporter) {
        console.log(`[EmailAdapter] Transmitting real email to ${to}...`);
        const info = await transporter.sendMail({
          from: `"Setu AI Assistant" <${from}>`,
          to,
          subject,
          text,
          html
        });
        console.log(`[EmailAdapter] Email sent. MessageId: ${info.messageId}`);
        
        // Ethereal sandbox link generator
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log(`✉️ Ethereal SMTP Sandbox Preview URL: ${previewUrl}`);
        }
      } else {
        console.warn("[EmailAdapter] Failed to initialize email transporter. Logging email text.");
      }

      // Log in CommunicationLog
      const outgoingLog = new CommunicationLog({
        channel: "Email",
        sender: to,
        direction: "Outgoing",
        text: `Subject: ${subject}\n\n${text}`,
        user_id: userId,
      });
      await outgoingLog.save();
      return true;
    } catch (err) {
      console.error("[EmailAdapter] Critical error during email transmission:", err);
      return false;
    }
  }
}
