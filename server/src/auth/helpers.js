import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';
import JWT from 'jsonwebtoken'
// ** Helper for reauthenticating admin access token
async function generateAccessToken(admin) {
  return JWT.sign(admin, process.env.JWT_ACCESS_TOKEN_SECRET, { expiresIn: '72h' })
}
const mail = async ({ email, subject, message, header }) => {
  const MAILER_USERNAME = process.env.MAILER_USERNAME;
  const MAILER_PASSWORD = process.env.MAILER_PASSWORD;
  const DKIM_PRIVATE_KEY = process.env.DKIM_PRIVATE_KEY;

  const transporter = nodemailer.createTransport({
    host: 'mail.privateemail.com',
    port: 465,
    secure: true,
    auth: {
      user: MAILER_USERNAME,
      pass: MAILER_PASSWORD,
    },
    dkim: {
      domainName: 'genesisio.net',
      keySelector: 'default',
      privateKey: DKIM_PRIVATE_KEY,
    },
  });

  // Auto-detect if it's a bulk send
  const isBulk = Array.isArray(email) && email.length > 1;

  try {
    const toField = isBulk ? '' : (Array.isArray(email) ? email[0] : email);

    const info = await transporter.sendMail({
      from: {
        name: "Genesisio",
        address: MAILER_USERNAME,
      },
      to: toField, // Empty if bulk, direct if single
      bcc: isBulk ? [...email, MAILER_USERNAME] : MAILER_USERNAME,
      subject,
      html: generateEmailHTML({ message, header }),
    });

    return {
      success: true,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
      messageId: info.messageId,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};


export function generateEmailHTML(details) {
  const { message, header } = details;
  const messageHTML = message
    .map(item => `<p style="margin: 0 0 25px 0; white-space: pre-wrap;">${item}</p>`)
    .join('');
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 0; background-color: #1A283C;">
<table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto;">
  <tr>
    <td>
      <!-- Hero Section -->
      <table width="100%" border="0" cellspacing="0" cellpadding="0" 
             style="background-image: url('https://www.genesisio.net/logo.png'); 
                    background-size: cover; 
                    background-position: center;
                    background-color: #1A283C; /* Fallback */">
        <tr>
          <td style="padding: 40px 25px; background-color: rgba(26,40,60,0.85);">
            <!-- Logo -->
            <div style="text-align: center; margin-bottom: 25px;">
              <img src="https://www.genesisio.net/logo.png" alt="Genesisio" 
                   style="width: 40px; height: 40px; display: inline-block;">
            </div>

            <!-- Motto -->
            <p style="font-size: 11px; text-align: center; margin: 0 0 30px 0; 
                     letter-spacing: 1.8px; text-transform: uppercase; color: #FFD700;">
              A Smarter Approach To Trading & Investing
            </p>

            <!-- Header -->
            <h1 style="font-size: 26px; text-align: center; margin: 0 0 40px 0; 
                      color: #FFFFFF; line-height: 1.3; font-weight: 600;">
              ${header}
            </h1>

            <!-- Content -->
            <div style="font-size: 15px; line-height: 1.6; color: #d8d8d8;">
              ${messageHTML}
            </div>

            <!-- CTA Button -->
            <div style="text-align: center;">
              <a href="https://www.genesisio.net/auth/login"
                 style="display: inline-block; padding: 14px 40px; background-color: #FFD700; 
                        color: #1A283C; text-decoration: none; border-radius: 4px; font-size: 15px; 
                        font-weight: 700; border: 2px solid #FFD700;">
                Sign In to Your Account
              </a>
            </div>
          </td>
        </tr>
      </table>

      <!-- Footer -->
      <table width="100%" border="0" cellspacing="0" cellpadding="30" style="background-color: #0E1724;">
        <tr>
          <td align="center">
            <table border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td style="padding-right: 15px; vertical-align: middle;">
                  <img src="https://www.genesisio.net/Help.png" alt="Support" 
                       style="width: 40px; height: 45px;">
                </td>
                <td style="vertical-align: middle;">
                  <p style="font-size: 15px; margin: 0 0 8px 0; color: #FFD700;">
                    Have a question?
                  </p>
                  <a href="mailto:support@genesisio.net" 
                     style="color: #d8d8d8; text-decoration: none; font-size: 14px;">
                    Contact support
                  </a>
                </td>
              </tr>
            </table>
            <p style="font-size: 12px; color: #8794A8; margin: 25px 0 0 0;">
              © 2025 Genesisio. All rights reserved
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export { generateAccessToken, mail }
