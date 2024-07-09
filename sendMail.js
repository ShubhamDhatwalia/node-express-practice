
const nodemailer = require("nodemailer");


const sendMail = (req, res) => {
    


    nodemailer.createTestAccount((err, account) => {
      if (err) {
        console.error("Failed to create a testing account. " + err.message);
        return process.exit(1);
      }

      console.log("Credentials obtained, sending message...");

      // Create a SMTP transporter object
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        secure: true,
        port: 465,
        auth: {
          user: "shubhamdhatwalia1@gmail.com",
          pass: "fcoi mzsg mpry zmdw",
        },
      });

      // Message object
      let message = {
        from: "Shubham Dhatwalia <shubhamdhatwalia1@gmail.com>",
        to: " <shubhamdhatwalia3@gmail.com>",
        subject: "SMTP TESTING",
        text: "Hello Shubham",
        html: "<p><b>Hello</b> to myself!</p>",
      };

      transporter.sendMail(message, (err, info) => {
        if (err) {
          console.log("Error occurred. " + err.message);
          return process.exit(1);
        }

        console.log("Message sent: %s", info.messageId);
        // Preview only available when sending through an Ethereal account
          console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
          res.json(info);
      });
    });

    

}

module.exports = sendMail;