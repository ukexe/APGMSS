import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

let transporter: any = null;

async function createTestAccount() {
  if (!transporter) {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
  return transporter;
}

export async function POST(req: Request) {
  try {
    const { email, subject, text, html } = await req.json();

    if (!email || !subject || !text) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const transport = await createTestAccount();
    const info = await transport.sendMail({
      from: '"Grievance System" <notifications@grievance-system.com>',
      to: email,
      subject,
      text,
      html,
    });

    return NextResponse.json({
      success: true,
      previewUrl: nodemailer.getTestMessageUrl(info),
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
} 