require("dotenv").config();

const transporter = require("./src/config/mail");

async function testMail() {
  try {
    await transporter.verify();
    console.log("SMTP connection successful");

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: process.env.MAIL_USER,
      subject: "TripSync Mail Test",
      text: "Email is working!",
    });

    console.log("Test email sent");
  } catch (error) {
    console.error("Mail test failed:", error.message);
  }
}

testMail();