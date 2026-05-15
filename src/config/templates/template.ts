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
    shippingAddress: any;
    frontendUrl: string;
    paymentMethod?: string;
    paymentStatus?: string;
    createdAt?: Date;
  }): string {
    const { firstName, orderNumber, status, totalAmount, items, shippingAddress, frontendUrl, paymentMethod, paymentStatus, createdAt } = params;

    const statusConfig: Record<string, { title: string; color: string; icon: string; msg: string }> = {
      'PENDING': { title: 'Order Received', color: '#e67e22', icon: '📦', msg: 'We have received your order and it is currently awaiting confirmation.' },
      'CONFIRMED': { title: 'Order Confirmed', color: '#27ae60', icon: '✅', msg: 'Your order has been confirmed and is now in our queue.' },
      'PROCESSING': { title: 'Preparing Your Order', color: '#2980b9', icon: '👨‍🍳', msg: 'Our team is carefully preparing your exotic selection.' },
      'SHIPPED': { title: 'Out for Delivery', color: '#8e44ad', icon: '🚚', msg: 'Your package has been handed over to our courier partner.' },
      'DELIVERED': { title: 'Delivered', color: '#2ecc71', icon: '🏠', msg: 'Enjoy your purchase! Your order has been successfully delivered.' },
      'CANCELLED': { title: 'Order Cancelled', color: '#c0392b', icon: '❌', msg: 'This order has been cancelled.' },
      'RETURNED': { title: 'Order Returned', color: '#7f8c8d', icon: '🔄', msg: 'We have processed the return for this order.' },
    };

    const config = statusConfig[status] || { title: `Update: ${status}`, color: '#1a4031', icon: '🔔', msg: `Your order status is now ${status}.` };

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 15px 0; border-bottom: 1px solid #edf2f7;">
          <div style="font-weight: 600; color: #2d3748; font-size: 15px;">${item.itemName || 'Exotic Item'}</div>
          <div style="font-size: 13px; color: #718096; margin-top: 2px;">Qty: ${item.quantity}</div>
        </td>
        <td style="padding: 15px 0; border-bottom: 1px solid #edf2f7; text-align: right; font-weight: 600; color: #2d3748;">
          ₹${Number(item.priceAtPurchase || 0).toLocaleString('en-IN')}
        </td>
      </tr>
    `).join('');

    const address = typeof shippingAddress === 'string' ? shippingAddress : 
      `${shippingAddress?.houseNo || ''} ${shippingAddress?.streetName || ''}, ${shippingAddress?.city || ''}, ${shippingAddress?.state || ''} - ${shippingAddress?.zipcode || shippingAddress?.postalCode || ''}`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    body { font-family: 'Inter', -apple-system, sans-serif; background-color: #f7fafc; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f7fafc; padding: 40px 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .header { background-color: #1a4031; color: #ffffff; padding: 40px 30px; text-align: center; }
    .content { padding: 40px 30px; color: #4a5568; }
    .status-banner { background-color: ${config.color}15; border-left: 4px solid ${config.color}; padding: 15px 20px; border-radius: 8px; margin-bottom: 30px; }
    .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #a0aec0; margin-bottom: 15px; border-bottom: 1px solid #edf2f7; padding-bottom: 8px; }
    .info-grid { display: table; width: 100%; margin-bottom: 30px; }
    .info-col { display: table-cell; width: 50%; vertical-align: top; padding-right: 15px; }
    .footer { background-color: #f8fafc; padding: 30px; text-align: center; color: #718096; font-size: 13px; border-top: 1px solid #edf2f7; }
    .btn { display: inline-block; padding: 14px 28px; background-color: #1a4031; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div style="font-size: 40px; margin-bottom: 15px;">${config.icon}</div>
        <h1 style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.02em;">${config.title}</h1>
        <p style="margin: 10px 0 0; opacity: 0.9; font-size: 15px;">Order #${orderNumber}</p>
      </div>

      <div class="content">
        <p style="font-size: 16px; margin-top: 0;">Hi <strong>${firstName}</strong>,</p>
        <div class="status-banner">
          <p style="margin: 0; color: ${config.color}; font-weight: 600; font-size: 15px;">${config.msg}</p>
        </div>

        <div class="section-title">Shipping To</div>
        <p style="font-size: 14px; line-height: 1.6; margin-bottom: 30px; color: #2d3748;">
          ${address}
        </p>

        <div class="section-title">Order Summary</div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          ${itemsHtml}
          <tr>
            <td style="padding: 20px 0 0; font-weight: 700; color: #1a4031; font-size: 18px;">Total Paid</td>
            <td style="padding: 20px 0 0; text-align: right; font-weight: 700; color: #1a4031; font-size: 18px;">₹${totalAmount.toLocaleString('en-IN')}</td>
          </tr>
        </table>

        <div class="info-grid">
          <div class="info-col">
            <div class="section-title">Payment</div>
            <div style="font-size: 14px; color: #2d3748;"><strong>Method:</strong> ${paymentMethod || 'N/A'}</div>
            <div style="font-size: 14px; color: ${paymentStatus === 'PAID' ? '#27ae60' : '#e67e22'}; font-weight: 600; margin-top: 4px;">${paymentStatus || 'PENDING'}</div>
          </div>
          <div class="info-col">
            <div class="section-title">Date</div>
            <div style="font-size: 14px; color: #2d3748;">${createdAt ? new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today'}</div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 10px;">
          <a href="${frontendUrl}/order/${orderNumber}" class="btn">View Full Order Details</a>
        </div>
      </div>

      <div class="footer">
        <div style="font-weight: 700; color: #1a4031; margin-bottom: 5px;">Anandini's Exotica</div>
        <p style="margin: 0;">Premium International Dry Fruits & Nuts</p>
        <p style="margin: 15px 0 0; font-size: 11px;">&copy; ${new Date().getFullYear()} Anandini. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  static paymentFailedEmail(params: {
    firstName: string;
    orderNumber: string;
    totalAmount: number;
    paymentLink: string;
    expiryMinutes: number;
  }): string {
    const { firstName, orderNumber, totalAmount, paymentLink, expiryMinutes } = params;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; background-color: #fff5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #feb2b2; }
    .header { background-color: #c53030; color: #ffffff; padding: 40px; text-align: center; }
    .content { padding: 40px; text-align: center; color: #4a5568; }
    .amount-box { background: #fef2f2; border-radius: 12px; padding: 25px; margin: 25px 0; }
    .btn { display: inline-block; padding: 16px 32px; background-color: #1a4031; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; margin-top: 10px; }
    .timer { font-weight: 700; color: #c53030; font-size: 18px; display: block; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 50px; margin-bottom: 10px;">⚠️</div>
      <h1 style="margin: 0;">Action Required</h1>
      <p style="margin: 10px 0 0; opacity: 0.9;">Payment Failed for #${orderNumber}</p>
    </div>
    <div class="content">
      <p style="font-size: 16px;">Hi ${firstName},</p>
      <p>We encountered an issue while processing your payment. Don't worry, your exotic items are **on hold** for you, but only for a limited time.</p>
      
      <div class="amount-box">
        <div style="font-size: 13px; text-transform: uppercase; color: #9b2c2c; letter-spacing: 0.05em; font-weight: 700;">Total Payable</div>
        <div style="font-size: 32px; font-weight: 800; color: #2d3748; margin: 5px 0;">₹${totalAmount.toLocaleString('en-IN')}</div>
        <span class="timer">⏱️ Window expires in ${expiryMinutes} minutes</span>
      </div>

      <p style="margin-bottom: 30px;">Please click below to retry the payment using a different card or method.</p>
      
      <a href="${paymentLink}" class="btn">Retry Payment Now</a>
      
      <p style="font-size: 13px; color: #a0aec0; margin-top: 40px;">If you face any issues, contact us at info@anandini.org.in</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  static orderCancelledEmail(params: {
    firstName: string;
    orderNumber: string;
    totalAmount: number;
    frontendUrl: string;
  }): string {
    const { firstName, orderNumber, frontendUrl } = params;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    .header { background-color: #4a5568; color: #ffffff; padding: 40px; text-align: center; }
    .content { padding: 40px; text-align: center; color: #4a5568; }
    .btn { display: inline-block; padding: 14px 28px; border: 2px solid #1a4031; color: #1a4031; text-decoration: none; border-radius: 8px; font-weight: 700; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 40px; margin-bottom: 10px;">📉</div>
      <h1 style="margin: 0; font-size: 24px;">Order Cancelled</h1>
      <p style="margin: 10px 0 0; opacity: 0.8;">Order #${orderNumber}</p>
    </div>
    <div class="content">
      <p style="font-size: 16px;">Hi ${firstName},</p>
      <p>As requested, your order <strong>#${orderNumber}</strong> has been cancelled.</p>
      
      <div style="margin: 30px 0; color: #718096; font-size: 14px;">
        Any amount deducted (if any) will be refunded within 5-7 business days to your original payment method.
      </div>

      <p>Changed your mind? We have plenty more exotic treats waiting for you.</p>
      
      <a href="${frontendUrl}" class="btn">Return to Store</a>
    </div>
    <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #a0aec0;">
      &copy; ${new Date().getFullYear()} Anandini's Exotica
    </div>
  </div>
</body>
</html>
    `;
  }
}
