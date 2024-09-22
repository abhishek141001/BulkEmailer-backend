import express from 'express';
import multer from 'multer';
import cors from 'cors';
import nodemailer from 'nodemailer';
import csv from 'csv-parser';
import fs from 'fs';
import User from '../modal/User.js';
import { verifyToken } from '../middleware/verifyToken.js';
import crypto from 'crypto';
import pLimit from 'p-limit';



const bulkMail = express.Router();
bulkMail.use(cors());
const upload = multer({ dest: 'uploads/' });
const limit = pLimit(5); // Adjust the concurrency limit


bulkMail.post('/send', upload.fields([
  { name: 'csvFile', maxCount: 1 },
  { name: 'attachments[]', maxCount: 10 }
]), verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id);
  const { emailBulk, emailPassword } = user;
  // const decryptedPassword = decrypt(emailPassword);

  try {
    const csvFile = req.files['csvFile'] ? req.files['csvFile'][0] : null;
    const attachments = req.files['attachments[]'] || [];
    const subject = req.body.subject;
    const emailBodyTemplate = req.body.emailBody;
    const customEmailList = JSON.parse(req.body.customEmailList);

    let emails = [];
    let nameColumn = [];

    // Process CSV File
    if (csvFile) {
      const csvFilePath = csvFile.path;
      await new Promise((resolve, reject) => {
        fs.createReadStream(csvFilePath)
          .pipe(csv())
          .on('data', (row) => {
            nameColumn.push(row.name || '');
            emails.push(row.email);
          })
          .on('end', () => {
            fs.unlinkSync(csvFilePath); // Clean up CSV file
            resolve();
          })
          .on('error', (err) => {
            reject(new Error('Error processing CSV file: ' + err.message));
          });
      });
    }

    // Add custom email list
    customEmailList.forEach(email => {
      emails.push(email);
      nameColumn.push('');
    });

    // Setup nodemailer transporter
    // const transporter = nodemailer.createTransport({
    //   host: 'smtpout.secureserver.net',
    //   port: 465,
    //   secure: true,
    //   auth: {
    //     user: emailBulk,
    //     pass: emailPassword
    //   },
 
    // });
    let transporter;
switch (user.emailService) {
    case 'gmail':
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: emailBulk,
                pass: emailPassword,
            },
        });
        break;
    case 'outlook':
        transporter = nodemailer.createTransport({
            service: 'hotmail',
            auth: {
                user: emailBulk,
                pass: emailPassword,
            },
        });
        break;
    // Add more cases for other services as needed
    case 'GoDaddy':
      transporter = nodemailer.createTransport({
        host: 'smtpout.secureserver.net',
        port: 465,
        secure: true,
        auth: {
            user: emailBulk,
            pass: emailPassword,
        },
    });
      break;
    default:
        transporter = nodemailer.createTransport({
            host: 'smtpout.secureserver.net',
            port: 465,
            secure: true,
            auth: {
                user: emailBulk,
                pass: emailPassword,
            },
        });
        break;
}


    // Function to send an email
    const sendEmail = async (mailOptions) => {
      try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to: ${mailOptions.to}`);
      } catch (error) {
        console.error(`Failed to send email to ${mailOptions.to}:`, error);
      }
    };

    // Prepare email promises with concurrency limit
    const emailPromises = emails.map((email, index) => {
      const name = nameColumn[index];
      const personalizedEmailBody = emailBodyTemplate.replace(/{name}/g, name || 'Customer');

      const mailOptions = {
        from: 'support@socialsynchub.com',
        to: email,
        subject: subject,
        html: personalizedEmailBody,
        attachments: attachments.map((file) => ({
          filename: file.originalname,
          path: file.path
        }))
      };

      return limit(() => sendEmail(mailOptions));
    });

    // Wait for all emails to be sent
    await Promise.all(emailPromises);

    // Clean up attachments
    attachments.forEach((file) => {
      fs.unlinkSync(file.path);
    });

    res.status(200).json({ message: 'Emails sent successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'An error occurred while sending emails' });
  }
});

export default bulkMail;
