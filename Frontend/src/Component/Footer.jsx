import React from "react";
import facebookLogo from "../Asset/facebookLogo.svg";
import instagramLogo from "../Asset/instagramLogo.svg";
import twitterLogo from "../Asset/twitterLogo.svg";
import youtubeLogo from "../Asset/youtubeLogo.svg";
import { useStudioDetails } from "../Context/StudioDetailsContext.jsx";
import { Link } from "react-router-dom";

export default function Footer() {
  const { studioName, studioAddress, studioContact, studioEmail, studioSocials } =
    useStudioDetails();

  const contacts = [
    {
      label: "Phone",
      value: [
        { no: studioContact?.[0], getHref: (value) => `tel:${value}` },
        { no: studioContact?.[1], getHref: (value) => `https://wa.me/${value || ""}` },
      ],
    },
    {
      label: "Address",
      value: studioAddress,
      getHref: (value) =>
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`,
    },
    {
      label: "Email",
      value: studioEmail,
      getHref: (value) => `mailto:${value}`,
    },
  ];

  return (
    <footer className="relative w-full mt-20 bg-gradient-to-tr from-[#FFE9E3] via-[#FFD7D0] to-[#FFB7A1] text-[#2C2C2C] rounded-t-[2.5rem] overflow-hidden">
      <div className="w-full mx-auto px-6 py-10 flex flex-col gap-10">
        {/* Contact Section */}
        <div className="flex flex-col items-center text-center gap-6">
          <div className="w-full lg:grid lg:grid-cols-3 sm:flex sm:flex-col gap-6 p-6 bg-white rounded-2xl shadow-md">
            {/* Phone */}
            <div className="flex flex-col items-center gap-3">
              <h3 className="font-semibold text-base uppercase tracking-wide text-[#FF4D4D]">
                {contacts[0].label}
              </h3>
              {contacts[0].value[0]?.no ? (
                <div className="flex flex-col gap-2">
                  <a
                    href={contacts[0].value[0].getHref(contacts[0].value[0].no)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#FF4D4D] transition-colors"
                  >
                    {contacts[0].value[0].no}
                  </a>
                  <a
                    href={contacts[0].value[1].getHref(contacts[0].value[1].no)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#FF4D4D] transition-colors"
                  >
                    {contacts[0].value[1].no}
                  </a>
                </div>
              ) : (
                <div className="flex flex-col gap-2 items-center">
                  <span className="block animate-pulse bg-slate-300 rounded-xl w-32 h-5" />
                  <span className="block animate-pulse bg-slate-300 rounded-xl w-28 h-5" />
                </div>
              )}
            </div>

            {/* Address + Email */}
            {contacts.slice(1).map((contact, index) => (
              <div key={index} className="flex flex-col items-center gap-3">
                <h3 className="font-semibold text-base uppercase tracking-wide text-[#FF4D4D]">
                  {contact.label}
                </h3>
                {contact.value ? (
                  <a
                    href={contact.getHref(contact.value)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#FF4D4D] transition-colors break-words"
                  >
                    {contact.value}
                  </a>
                ) : (
                  <span className="block animate-pulse bg-slate-300 rounded-xl w-32 h-5" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Social Links */}
        <div className="flex flex-col items-center gap-4">
          <h2 className="font-semibold text-base uppercase tracking-wide text-[#FF4D4D]">
            Social
          </h2>
          <div className="flex gap-6">
            {[
              studioSocials?.instagram,
              studioSocials?.facebook,
              studioSocials?.youtube,
              studioSocials?.x,
            ].map((link, index) => (
              <Link
                key={index}
                to={link || "#"}
                target="_blank"
                className="hover:scale-110 transition-transform"
              >
                <img
                  src={[instagramLogo, facebookLogo, youtubeLogo, twitterLogo][index]}
                  alt="Social Icon"
                  className="w-8 h-8 sm:w-10 sm:h-10"
                />
              </Link>
            ))}
          </div>
        </div>

        {/* Enquire Button */}
        <div className="hidden md:flex justify-center">
          <Link
            to="/contact"
            className="flex items-center bg-[#FF4D4D] text-white px-6 py-3 rounded-3xl hover:scale-105 transition-transform shadow-lg"
          >
            Enquire Now
            <svg
              className="w-6 h-6 ml-2"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 -960 960 960"
              fill="white"
            >
              <path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z" />
            </svg>
          </Link>
        </div>

        {/* Footer Note */}
        <div className="text-center px-4 text-xs sm:text-sm lg:text-base opacity-70 pb-10 md:pb-6">
          © <span id="footer-year">{new Date().getFullYear()}</span> -{" "}
          {studioName || "The Wedding Boys"} | All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
