export class Templates {
  /**
   * Generates an HTML template for login OTP email.
   * @param params Object containing dynamic values
   */
  static loginOtpEmail(params: {
    firstName: string;
    otp: string;
    hash: string;
    expirySeconds: number;
  }): string {
    const { firstName, otp, hash, expirySeconds } = params;

    return `
      <div style="font-family: sans-serif; padding: 20px; background-color: #f9f9f9;">
        <h2 style="color: #333;">🔐 Your Login OTP</h2>
        <p>Hi ${firstName},</p>
        <p>Your one-time password (OTP) is:</p>
        <div style="font-size: 40px; font-weight: bold; margin: 12px 0; color: #1a73e8;">${otp}</div>
        <p><strong>Verification Code:</strong> <code>${hash}</code></p>
        <p>This OTP will expire in <strong>${Math.floor(expirySeconds / 60)} minutes</strong>.</p>
        <p style="color: #555;">If you didn't request this OTP, please ignore this email.</p>
        <br/>
        <p>Thanks,<br/>Anandini's Team</p>
      </div>
    `;
  }

  // Example future template
  static welcomeEmail(userName: string): string {
    return `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2 style="color: #1a73e8;">👋 Welcome to Anandini's, ${userName}!</h2>
        <p>Thank you for joining our platform.</p>
        <p>You can now explore this website for exotic collection of dry fruits, place orders, and enjoy international taste.</p>
        <p style="margin-top: 20px;">Enjoy your journey with us!</p>
        <br />
        <p>Cheers,<br />Anandini's Team</p>
      </div>
    `;
  }

  static welcomeEmailBySubscription(
    email: string,
    unsubscribeApiUrl: string,
  ): string {
    const unsubscribeLink = `${unsubscribeApiUrl}?email=${encodeURIComponent(
      email,
    )}`;

    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f7f7f7;
        padding: 20px;
      }
      .container {
        max-width: 600px;
        margin: auto;
        background: #ffffff;
        padding: 24px;
        border-radius: 8px;
      }
      h1 {
        color: #2c2c2c;
      }
      p {
        color: #555;
        line-height: 1.6;
      }
      ul {
        color: #555;
        padding-left: 20px;
      }
      .unsubscribe {
        margin-top: 30px;
        font-size: 12px;
        color: #888;
      }
      .unsubscribe a {
        color: #888;
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Welcome to Anandini's 🎉</h1>

      <p>
        Thank you for subscribing! You’ll now receive updates about:
      </p>

      <ul>
        <li>New product launches</li>
        <li>Exclusive discounts</li>
        <li>Price drops & special offers</li>
      </ul>

      <p>
        We promise — no spam, only meaningful updates.
      </p>

      <div class="unsubscribe">
  If you ever wish to unsubscribe,
  <a href="${unsubscribeLink}" target="_blank" rel="noopener noreferrer">
    click here
  </a>.
</div>
    </div>
  </body>
</html>
    `;
  }

   static unsubscribeConfirmationEmail(email: string): string {
    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f7f7f7;
        padding: 20px;
      }
      .container {
        max-width: 600px;
        margin: auto;
        background: #ffffff;
        padding: 24px;
        border-radius: 8px;
      }
      h1 {
        color: #2c2c2c;
      }
      p {
        color: #555;
        line-height: 1.6;
      }
      .footer {
        margin-top: 30px;
        font-size: 12px;
        color: #888;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>You’ve been unsubscribed 👋</h1>

      <p>
        Hi ${email},<br/>
        You have successfully unsubscribed from Anandini’s newsletter.
      </p>

      <p>
        We’re sad to see you go, but you can always resubscribe in the future if you change your mind!
      </p>

      <div class="footer">
        Anandini Team<br/>
        &copy; ${new Date().getFullYear()} Anandini
      </div>
    </div>
  </body>
</html>
    `;
  }
}
