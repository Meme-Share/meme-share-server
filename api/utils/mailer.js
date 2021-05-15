const nodemailer = require("nodemailer");

exports.sendEmail = async (from, to, subject, body) => {
  const { AUTH_USER, AUTH_PASS } = process.env;
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: AUTH_USER,
      pass: AUTH_PASS,
    },
  });

  let info = await transporter.sendMail({
    from: from,
    to: to,
    subject: subject,
    html: body,
  });

  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
};
