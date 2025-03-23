import express from 'express'
import EnquirySchema from '../../Models/EnquirySchema.js';
import nodemailer from "nodemailer"
const Route = express.Router();

const emailHtml = (details) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>New Wedding Inquiry Alert!</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f9f9f9;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background: #ffffff;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
            }
            .header {
                background: #ffe6eb;
                padding: 20px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }
            .header h1 {
                color: #d63384;
                font-family: 'Great Vibes', cursive;
                margin: 0;
                font-size: 28px;
            }
            .header p {
                color: #555;
                margin-top: 5px;
                font-size: 14px;
            }
            .content {
                padding: 20px;
                font-size: 16px;
                color: #333;
            }
            .details {
                margin-bottom: 15px;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 8px;
                background: #fdfdfd;
            }
            .details div {
                margin-bottom: 8px;
            }
            .icon {
                color: #d63384;
                margin-right: 8px;
            }
            .footer {
                background: #f1f1f1;
                padding: 15px;
                text-align: center;
                font-size: 14px;
                color: #555;
                border-radius: 0 0 10px 10px;
            }
            .btn {
                background: #d63384;
                color: white;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 5px;
                display: inline-block;
                margin-top: 10px;
            }
            .btn:hover {
                background: #b0246a;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <h1>New Wedding Inquiry! 💍</h1>
                <p>You've received a new wedding planning request</p>
            </div>

            <!-- Content -->
            <div class="content">
                <div class="details">
                    <div><strong>Bride:</strong> ${details.bride}</div>
                    <div><strong>Groom:</strong> ${details.groom}</div>
                    <div><strong>Contact:</strong> <a href="tel:${details.contact}" style="color: #007bff;">${details.contact}</a></div>
                    <div><strong>Wedding Date:</strong> ${details.eventDate.start} - ${details.eventDate.end}</div>
                </div>
                <div class="details">
                    <div><strong>Reach:</strong></div>
                    <p>${details.reach}</p>
                </div>
                <a href="mailto:${details.contact}" class="btn">Contact Client</a>
            </div>

            <!-- Footer -->
            <div class="footer">
                Submitted at: ${new Date().toLocaleDateString()}
            </div>
        </div>
    </body>
    </html>
    `;
};


async function sendEmail(req, res) {
    try {
        // send email to the admin
        console.log(res.locals)
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
            port: 587,
            secure: false
        });
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: res.locals.studioEmail,
            subject: "Client Enquiry",
            html: emailHtml(res.locals.details),
        };
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Enquiry Submited!" })

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function saveClientEnquiry(req, res, next) {
    try {
        const validateEmail = (email) => {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return emailRegex.test(email);
        };
        const validatePhone = (phone) => {
            const phoneRegex = /^[0-9]{10}$/;
            return phoneRegex.test(phone);
        };
        if (req.body.studioEmail && req.body.studioEmail.trim() && req.body.bride && req.body.bride.trim() && req.body.groom && req.body.groom.trim() && req.body.contact && req.body.contact.trim() && req.body.reach && req.body.reach.trim() && req.body.eventDate && req.body.eventDate.start && req.body.eventDate.start.trim() && req.body.eventDate.end && req.body.eventDate.end.trim() && (validateEmail(req.body.contact) || validatePhone(req.body.contact))) {
            // store the data in the database
            const details = req.body;
            await EnquirySchema.create({
                Bride: details.bride,
                Groom: details.groom,
                Contact: details.contact,
                Date: details.eventDate,
                Reach: details.reach,
                isViewed: false,
                SubmittedTime: new Date(Date.now()).toLocaleDateString()
            })
            res.locals = { details, studioEmail: req.body.studioEmail };
            next()
        } else {
            res.status(400).json({ message: "Invalid Field" })
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }

}

Route.post("/api/enquiry", saveClientEnquiry, sendEmail)

export default Route