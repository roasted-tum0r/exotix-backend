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

  static forgotPasswordEmail(params: {
    firstName: string;
    resetLink: string;
    expiryMinutes: number;
  }): string {
    const { firstName, resetLink, expiryMinutes } = params;

    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
      .header { background-color: #1a4031; color: white; padding: 40px 20px; text-align: center; }
      .header h1 { margin: 0; font-size: 28px; }
      .content { padding: 30px; color: #333; }
      .footer { text-align: center; padding: 30px; color: #888; font-size: 12px; background: #fafafa; }
      .btn { display: inline-block; padding: 12px 24px; background-color: #1a4031; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 25px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Forgot Your Password? 🔐</h1>
      </div>
      
      <div class="content">
        <p>Hi ${firstName},</p>
        <p>We received a request to reset your password for your Anandini account. Click the button below to proceed:</p>
        
        <div style="text-align: center;">
          <a href="${resetLink}" class="btn">Reset Password</a>
        </div>
        
        <p style="margin-top: 30px;">This link will expire in <strong>${expiryMinutes} minutes</strong>.</p>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
      
      <div class="footer">
        <strong>Anandini's Exotica</strong><br/>
        Premium International Flavors<br/>
        &copy; ${new Date().getFullYear()} Anandini
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

  /**
   * Generates an HTML template for password reset success email.
   * @param params Object containing dynamic values
   */
  static passwordResetSuccessEmail(params: { firstName: string }): string {
    const { firstName } = params;

    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
      .header { background-color: #1a4031; color: white; padding: 40px 20px; text-align: center; }
      .header h1 { margin: 0; font-size: 28px; }
      .content { padding: 30px; color: #333; }
      .footer { text-align: center; padding: 30px; color: #888; font-size: 12px; background: #fafafa; }
      .caution-box { background-color: #fff4e5; border-left: 4px solid #ffa117; padding: 15px; margin: 20px 0; font-size: 14px; color: #663c00; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Password Reset Successful! ✅</h1>
      </div>
      
      <div class="content">
        <p>Hi ${firstName},</p>
        <p>Your password has been changed successfully.</p>
        
        <div class="caution-box">
          <strong>Security Notice:</strong> All active logins for this account have been cancelled for your security. Please login again with your new password to access the application.
        </div>
        
        <p>If you did not perform this action, please contact our support team immediately.</p>
      </div>
      
      <div class="footer">
        <strong>Anandini's Exotica</strong><br/>
        Premium International Flavors<br/>
        &copy; ${new Date().getFullYear()} Anandini
      </div>
    </div>
  </body>
</html>
    `;
  }

  static orderUpdateEmail(params: {
    firstName: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    items: any[];
    frontendUrl: string;
    paymentMethod?: string;
    paymentStatus?: string;
  }): string {
    const { firstName, orderNumber, status, totalAmount, items, frontendUrl, paymentMethod, paymentStatus } = params;

    let statusTitle = '';
    let statusMessage = '';
    let statusIcon = '';

    switch (status) {
      case 'PENDING':
        statusTitle = 'Order Placed! 📦';
        statusMessage = 'Thank you for your order! We have received it and it is currently pending confirmation.';
        statusIcon = '🛒';
        break;
      case 'CONFIRMED':
        statusTitle = 'Order Confirmed! ✅';
        statusMessage = 'Great news! Your order has been confirmed and is officially in our system.';
        statusIcon = '✨';
        break;
      case 'PROCESSING':
        statusTitle = 'Order is being Prepared! 👨‍🍳';
        statusMessage = 'We are currently preparing your items with care. Almost there!';
        statusIcon = '📦';
        break;
      case 'SHIPPED':
        statusTitle = 'Order Shipped! 🚚';
        statusMessage = 'Your order is on its way to you! It has been handed over to our delivery partner.';
        statusIcon = '✈️';
        break;
      case 'DELIVERED':
        statusTitle = 'Order Delivered! 🎉';
        statusMessage = 'Success! Your order has been delivered. We hope you enjoy your purchase!';
        statusIcon = '🏠';
        break;
      case 'CANCELLED':
        statusTitle = 'Order Cancelled ❌';
        statusMessage = 'Your order has been cancelled. If you have any questions, please reach out to our support.';
        statusIcon = '⚠️';
        break;
      case 'RETURNED':
        statusTitle = 'Order Returned 🔄';
        statusMessage = 'We have processed the return for your order.';
        statusIcon = '🔙';
        break;
      default:
        statusTitle = `Order Update: ${status}`;
        statusMessage = `The status of your order ${orderNumber} has been updated to ${status}.`;
    }

    const itemsHtml = items
      .map(
        (item) => `
      <tr>
        <td style="padding: 12px 10px; border-bottom: 1px solid #eee;">
          <div style="font-weight: bold; color: #333;">${item.itemName || item.name}</div>
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: center; color: #666;">x${item.quantity}</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #333;">$${Number(item.priceAtPurchase || item.price).toFixed(2)}</td>
      </tr>
    `,
      )
      .join('');

    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
      .header { background-color: #1a4031; color: white; padding: 40px 20px; text-align: center; }
      .header h1 { margin: 0; font-size: 28px; }
      .status-badge { display: inline-block; padding: 8px 16px; background: rgba(255,255,255,0.2); border-radius: 20px; margin-top: 15px; font-weight: bold; }
      .content { padding: 30px; color: #333; }
      .order-box { background: #f9f9f9; border-radius: 10px; padding: 20px; margin: 20px 0; border: 1px solid #eee; }
      .item-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
      .total-row { font-weight: bold; font-size: 18px; color: #1a4031; }
      .payment-info { margin-top: 20px; padding-top: 15px; border-top: 1px dashed #ddd; font-size: 14px; }
      .footer { text-align: center; padding: 30px; color: #888; font-size: 12px; background: #fafafa; }
      .btn { display: inline-block; padding: 12px 24px; background-color: #1a4031; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 25px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div style="font-size: 50px; margin-bottom: 10px;">${statusIcon}</div>
        <h1>${statusTitle}</h1>
        <div class="status-badge">Order #${orderNumber}</div>
      </div>
      
      <div class="content">
        <p>Hi ${firstName},</p>
        <p>${statusMessage}</p>
        
        <div class="order-box">
          <div style="font-size: 16px; font-weight: bold; padding-bottom: 10px; border-bottom: 2px solid #1a4031; color: #1a4031;">Order Contents</div>
          <table class="item-table">
            <thead>
              <tr style="text-align: left; font-size: 12px; text-transform: uppercase; color: #999;">
                <th style="padding: 10px;">Item</th>
                <th style="padding: 10px; text-align: center;">Qty</th>
                <th style="padding: 10px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="2" style="padding: 20px 10px 10px 10px;">Total Amount</td>
                <td style="padding: 20px 10px 10px 10px; text-align: right;">$${Number(totalAmount).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <div class="payment-info">
            <div style="margin-bottom: 5px;"><strong>Payment Method:</strong> ${paymentMethod || 'N/A'}</div>
            <div><strong>Payment Status:</strong> <span style="color: ${paymentStatus === 'PAID' ? '#27ae60' : '#e67e22'}">${paymentStatus || 'PENDING'}</span></div>
          </div>
        </div>
        
        <div style="text-align: center;">
          <a href="${frontendUrl}/order/${orderNumber}" class="btn">Track Your Order</a>
        </div>
        
        <p style="margin-top: 30px;">Need help? Contact our support team at <a href="mailto:support@anandini.org.in" style="color: #1a4031;">support@anandini.org.in</a></p>
      </div>
      
      <div class="footer">
        <strong>Anandini's Exotica</strong><br/>
        Premium International Flavors<br/>
        &copy; ${new Date().getFullYear()} Anandini
      </div>
    </div>
  </body>
</html>
    `;
  }
}
