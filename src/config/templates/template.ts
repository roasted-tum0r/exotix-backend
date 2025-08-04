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
}
