import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }
  /**
   *
   * @param from From where/whom the email is being sent
   * @param to To whom the email is being sent to
   * @param subject Subject line of email
   * @param html Html representation of email
   */
  async sendMail(
    from: string,
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    try {
      console.log(`📧 Sending mail to ${to}, from ${from}`);
      const result = await this.resend.emails.send({
        from,
        to,
        subject,
        html,
      });
      console.log(`✅ Mail sent: ${JSON.stringify(result)}`);
    } catch (error) {
      console.error(`❌ Failed to send mail to ${to}`, error);
      throw new InternalServerErrorException('Email sending failed.');
    }
  }
}
