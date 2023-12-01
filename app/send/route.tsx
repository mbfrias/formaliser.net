import Email from "@/emails/incoming";
import { render } from '@react-email/render';
import nodemailer from 'nodemailer';
import axios from 'axios';
export const dynamic = 'force-dynamic';

// export const runtime = "edge";
// you know what, screw that ^ - it's just fucking nodemailer over. lets see if plain text rendering is the issue

export async function POST(req: Request) {
    const { name, email, subject, message } = await req.json();
    const { searchParams } = new URL(req.url);
    const sendto = searchParams.get('to');

    if (sendto === null) {
        // send norecipient.html
        const html: string = await axios.get('https://formaliser.net/emptyfields.html');
        return new Response(html, { status: 500 });
    }

    if (!name || !email || !subject || !message) {
        // send missingfields.html
        const html: string = await axios.get('https://formaliser.net/emptyfields.html');
        return new Response(html, { status: 500 });
    }

    if (!email.includes('@') || !email.includes('.')) {
        // send invalidemail.html
        const html: string = await axios.get('https://formaliser.net/invalidemail.html');
        return new Response(html, { status: 500 });
    }

    const html = render(<Email name={name} email={email} subject={subject} message={message} />);
    const plain = `NEW FORMALISER.NET MESSAGE\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}\nThis message is better viewed on a client that supports HTML emails.`

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        }
    });
    const emailOptions = {
        from: 'incoming@formaliser.net',
        to: sendto,
        replyTo: email,
        subject: `New message from ${name}`,
        html: html,
        text: plain,
    }

    transporter.sendMail(emailOptions, async (err, info) => {
        if (err) {
            console.log(err);
            const html: string = await axios.get('https://formaliser.net/servererror.html');
            return new Response(html, { status: 500 });
        }
        console.log(info);
        const html: string = await axios.get('https://formaliser.net/success.html');
        return new Response(html, { status: 200 });
    });
}
