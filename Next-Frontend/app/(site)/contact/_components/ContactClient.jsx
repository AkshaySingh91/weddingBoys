'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useStudioDetails } from '@/Context/StudioDetailsContext.jsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import officeImage1 from '@/Asset/Office/img1.jpg';
import officeImage2 from '@/Asset/Office/img2.jpg';
import officeImage3 from '@/Asset/Office/img3.jpg';
const images = [officeImage1, officeImage2, officeImage3];

const api_url = process.env.NEXT_PUBLIC_API_URL;

const WhatsAppButton = ({ studioContact }) => {
  const phone = studioContact?.[0]?.replace(/[^0-9]/g, '');
  if (!phone) return null;
  return <a href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer"
    className="inline-flex min-h-11 items-center rounded-full bg-green-800 px-5 py-3 text-sm font-semibold text-white shadow-md">
    Chat with us on WhatsApp
  </a>;
};

function ImageCarousel() {
  const [index, setIndex] = useState(0);

  const prev = () => setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const next = () => setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  return (
    <div className="relative w-full h-[22rem] sm:h-[30rem] lg:h-[35rem] overflow-hidden rounded-xl shadow-md">
      {/* Images */}
      <Image
        key={index}
        src={images[index]}
        alt={`Office ${index + 1}`}
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="absolute w-full h-full object-cover"
      />

      {/* Left Arrow */}
      <button
        type="button" aria-label="Previous office photograph"
        onClick={prev}
        className="absolute top-1/2 -translate-y-1/2 left-3 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition"
      >
        <ChevronLeft size={24} />
      </button>

      {/* Right Arrow */}
      <button
        type="button" aria-label="Next office photograph"
        onClick={next}
        className="absolute top-1/2 -translate-y-1/2 right-3 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition"
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-3 w-full flex justify-center gap-2">
        {images.map((_, i) => (
          <button
            type="button" aria-label={`Show office photograph ${i + 1}`} aria-pressed={i === index}
            key={i}
            onClick={() => setIndex(i)}
            className={`w-3 h-3 rounded-full transition ${i === index ? "bg-white" : "bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function ContactPage() {
  const { studioContact } = useStudioDetails();
  const [details, setDetails] = useState({ bride: '', groom: '', contact: '', reach: '', start: '', end: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const request = useRef(null);

  const update = (field) => (event) => {
    setDetails((previous) => ({ ...previous, [field]: event.target.value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    if (status === 'sent') { setStatus('idle'); setMessage(''); }
  };

  async function handleFormSubmit(event) {
    event.preventDefault();
    if (status === 'sending') return;
    const problems = {};
    if (!details.bride.trim()) problems.bride = "Enter the bride's name.";
    if (!details.groom.trim()) problems.groom = "Enter the groom's name.";
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.contact.trim());
    const phone = /^(91)?[0-9]{10}$/.test(details.contact.replace(/[\s()+.-]/g, ''));
    if (!email && !phone) problems.contact = 'Enter a valid email or Indian phone number, with or without +91.';
    if (!details.start) problems.start = 'Choose your event date.';
    if (details.end && details.start && details.end < details.start) problems.end = 'Choose an end date on or after the start date.';
    setErrors(problems);
    if (Object.keys(problems).length) {
      document.getElementById(`enquiry-${Object.keys(problems)[0]}`)?.focus();
      return;
    }
    const payload = { bride: details.bride, groom: details.groom, contact: details.contact,
      reach: details.reach, eventDate: { start: details.start, end: details.end || details.start } };
    const serialized = JSON.stringify(payload);
    if (request.current?.payload !== serialized) request.current = { payload: serialized, key: crypto.randomUUID() };
    setStatus('sending');
    setMessage('');
    try {
      const response = await fetch(`${api_url || ''}/api/enquiry`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': request.current.key },
        body: serialized,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const serverErrors = {};
        for (const error of data.errors || []) serverErrors[error.field.replace('eventDate.', '')] = error.message;
        if (Object.keys(serverErrors).length) setErrors(serverErrors);
        throw new Error(data.message || 'Your enquiry could not be saved. Please try again.');
      }
      setStatus('sent');
      setMessage('Thank you. Your enquiry has been received, and our team will be in touch.');
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Please check your connection and try again.');
    }
  }

  const field = (key, label, type = 'text', required = false, placeholder = '') => (
    <div>
      <label htmlFor={`enquiry-${key}`} className="block text-sm font-medium text-gray-700">{label}{required ? ' *' : ''}</label>
      <input id={`enquiry-${key}`} name={key} type={type} required={required}
        value={details[key]} onChange={update(key)} placeholder={placeholder}
        maxLength={type === 'date' ? undefined : key === 'contact' ? 254 : key === 'reach' ? 200 : 120}
        autoComplete={key === 'contact' ? 'email' : 'off'}
        aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `enquiry-${key}-error` : undefined}
        className="mt-1 block w-full rounded-md border border-gray-300 p-3 text-gray-900 focus:ring-2 focus:ring-tertiary" />
      {errors[key] && <p id={`enquiry-${key}-error`} className="mt-1 text-sm text-state-error">{errors[key]}</p>}
    </div>
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-center font-display text-3xl text-gray-800">Tell us about your wedding</h1>
      <p className="mb-10 text-center text-gray-600">Share a few details and we will help you plan the photography and films. Fields marked * are required.</p>
      <div className="mb-6 text-center"><WhatsAppButton studioContact={studioContact} /></div>
      <div className="grid grid-cols-1 gap-8 overflow-hidden rounded-2xl bg-[#FFEFE4] lg:grid-cols-2">
        <div className="order-last lg:order-first"><ImageCarousel /></div>
        <form onSubmit={handleFormSubmit} noValidate className="space-y-6 p-6" aria-label="Wedding enquiry">
          {field('bride', "Bride's name", 'text', true)}
          {field('groom', "Groom's name", 'text', true)}
          {field('contact', 'Phone or email', 'text', true, '+91 98765 43210 or you@example.com')}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field('start', 'Event date', 'date', true)}
            {field('end', 'End date (optional)', 'date')}
          </div>
          {field('reach', 'Where did you find us? (optional)', 'text', false, 'Google, Instagram, referral…')}
          {errors.eventDate && <p role="alert" className="text-sm text-state-error">{errors.eventDate}</p>}
          {message && <p role={status === 'error' ? 'alert' : 'status'} className={status === 'error' ? 'text-state-error' : 'text-green-900'}>{message}</p>}
          <button type="submit" disabled={status === 'sending' || status === 'sent'}
            className="min-h-11 rounded-control bg-accent px-6 py-3 font-semibold text-white hover:bg-accent-hover disabled:opacity-60">
            {status === 'sending' ? 'Sending…' : status === 'sent' ? 'Enquiry received' : 'Send enquiry'}
          </button>
        </form>
      </div>
    </section>
  );
}
