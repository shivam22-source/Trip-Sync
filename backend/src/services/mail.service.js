const transporter = require("../config/mail");

const sendMail = async ({ to, subject, text }) => {
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to,
    subject,
    text,
  });
};

module.exports = {
  sendMail,
};