import twilio from 'twilio'
import nodemailer from 'nodemailer'


const emailHtml = (otp, name) => {
    return `<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>OTP Email</title> 
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <script
        src="https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio,line-clamp,container-queries"></script>
    <style>
    body {
  font-family: Arial, sans-serif;
  background-color: #f4f4f4;
  padding: 0;
  margin: 0;
}
.container-sec {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
  margin-top: 30px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  text-align:center;
}
.otp-code {
  font-size: 24px;
  font-weight: bold;
  background-color: #f8f9fa;
  padding: 15px;
  text-align: center;
  border-radius: 8px;
  border: 1px dashed #007bff;
  color: #007bff;
  text-align:center;
  text-align:center;
}
.btn-verify {
  display: inline-block;
  padding: 10px 20px;
  color: #ffffff;
  background-color: #007bff;
  border-radius: 6px;
  text-decoration: none;
  font-weight: bold;
  text-align:center;
  
}
.footer-text {
  color: #6c757d;
  font-size: 14px;
  text-align: center;
  margin-top: 20px;
  text-align:center;
}
.footer-text a {
  color: #007bff;
  text-decoration: none;
  text-align:center;
}
.otp-lock {
  color: #333;
  font-size: 80px;
  text-align:center;
}
.welcome-section {
  background: #144fa9db;
  padding: 30px;
  border-radius: 4px;
  color: #fff;
  font-size: 20px;
  margin: 20px 0px;
  text-align:center;
}
.welcome-text {
  font-family: monospace;
}
.app-name {
  font-size: 30px;
  font-weight: 800;
  margin: 7px 0px;
}
.verify-text {
  margin-top: 25px;
  font-size: 25px;
  letter-spacing: 3px;
  text-align:center;
}
i.fas.fa-envelope-open {
  font-size: 35px !important;
  color: #ffffff;
  text-align:center;
}
    </style>
</head>
<body>
    <div class="shadow-md border-2 bg-white rounded-md w-96 py-4 border-2 border-gray-400">
        <div class="w-96">
            <div class="welcome-section flex flex-col items-center">
                <div class="app-name font-bold text-xl p-2">
                    Ankit Studios
                </div>
                <div class="welcome-text text-xs tracking-wider mb-3">
                    Thanks for signing up !
                </div>
                <div class="verify-text tracking-wide text-sm font-light">
                    Please Verify Your Email Address
                </div>
                <div class="email-icon w-20 h-20 flex justify-center">
                    <i class="fas fa-envelope-open text-2xl p-2"></i>
                </div>
            </div>
            <div class="flex flex-col items-center justify-center w-96">
                <h2 style="text-align:center;" class="text-xl font-mono">Hello, ${name}</h2>
                <p class="text-xs mb-3">Your One-Time Password (OTP) for verification is:</p>
                <div
                    class="otp-code px-10 py-2 border-dashed border-2 rounded-lg border-blue-800 tracking-widest bg-slate-100">
                    ${otp}</div>
                <p  class="mt-4 text-xs text-center">Please use this OTP to complete your verification. The OTP is valid
                    for the next 5 minutes.
                </p>
            </div>
        </div>
        <div class="footer-text flex flex-col w-96 mt-6">
            <p class="text-center text-xs text-slate-400">Thank you,<br>The Ankit studios Team</p>
        </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz"
        crossorigin="anonymous"></script>
</body>

</html>`
}

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
export async function sendSmsOtp(phone, otp) {
    try {
        const message = await client.messages.create({
            body: `Dear Admin greeting from Ankit Studios, your One Time Passcode for phone verification to access admin dashboard is: ${otp}.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone
        })
        console.log("SMS sent:", message.sid);
        return true;
    } catch (error) {
        console.error("Error sending SMS:", error.message);
        return false;
    }
}
export const sendEmailOtp = async (email, otp, name = 'Aman singh') => {
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
        
        port: 587,
        secure: false
    })
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: "Ankit Studios Verification Code", 
            html: emailHtml(otp, name),
        };
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.response);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};
export const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};
