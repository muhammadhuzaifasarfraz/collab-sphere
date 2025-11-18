const nodemailer = require('nodemailer');

const sendWelcomeEmail = async (to, name) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Collab Sphere" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Welcome to Collab Sphere!',
      html: `
        <h2>Hello ${name},</h2>
        <p>Welcome to Collab Sphere! We're excited to have you on board.</p>
        <p>Start connecting with alumni or students today.</p>
        <br/>
        <p>Cheers,</p>
        <p>Collab Sphere Team</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent:', info.response);
  } catch (err) {
    console.error('❌ Email sending failed:', err.message);
  }
};

module.exports = sendWelcomeEmail;
