const welcomeEmailTemplate = (userName) => `
<div style="background-color: #0B0E11; color: white; padding: 40px; font-family: sans-serif; border-radius: 10px;">
  <h1 style="color: #00F2C3;">NIRSHUX</h1>
  <hr style="border: 0.5px solid #1A1D23;" />
  <h2>Welcome to the Future, ${userName}!</h2>
  <p style="color: #94A3B8; font-size: 16px; line-height: 1.6;">
    Thank you for joining Nirshux. You’ve just taken the first step toward intelligence-driven crypto investing. 
    Your account is now active and ready for action.
  </p>
  <div style="margin: 30px 0;">
    <a href="https://your-site.com/dashboard" style="background-color: #00F2C3; color: black; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
      Explore Dashboard
    </a>
  </div>
  <p style="color: #64748B; font-size: 12px;">If you did not create this account, please ignore this email.</p>
</div>
`;

module.exports = welcomeEmailTemplate;