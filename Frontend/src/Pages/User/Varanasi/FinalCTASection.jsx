import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import grainTexture from "./graintexture.avif";

export default function FinalCTASection({ ctaRef }) {
  
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    date: "",
    story: ""
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, handle API submission here
    setIsSubmitted(true);
  };

  const handleInputChange = (e) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value
    });
  };

function useGrainBackground() {
  return useMemo(() => {
    return {
      // Re-engineered for a tighter, high-density film grain look
      backgroundImage: `
        radial-gradient(circle at 50% 50%, rgba(0,0,0,0.15) 0.5px, transparent 1px),
        radial-gradient(circle at 0 0, rgba(255,255,255,0.01) 0.5px, transparent 1px),
        radial-gradient(circle at 100% 100%, rgba(0,0,0,0.08) 0.5px, transparent 1.5px),
        radial-gradient(circle at 30% 70%, rgba(255,255,255,0.12) 0.5px, transparent 1px)
      `,
      backgroundSize: `
        4px 4px,
        7px 7px,
        9px 9px,
        13px 13px
      `,
    };
  }, []);
}
 const inputClasses = `
    w-full bg-transparent border-b py-4 text-[#1C1410] font-light text-lg 
    focus:outline-none transition-all duration-300 rounded-none placeholder-[#8C7B6E]/60
  `;
  const grainStyle = useGrainBackground();

  return (
    <section 
      ref={ctaRef}
      // Updated background to seamlessly melt into your pink/peach footer
      className="relative w-full min-h-screen py-32 px-6 flex flex-col items-center justify-center overflow-hidden"
    >
{/* Animated Grain Layer */}
<motion.div
  animate={{
    x: [0, -2, 4, -1, 3, 0],
    y: [0, 3, -2, 2, -4, 0],
  }}
  transition={{
    duration: 0.5,
    repeat: Infinity,
    ease: "linear",
  }}
  className="
    absolute
    inset-0
    w-full
    h-full
    opacity-[1]          /* Adjusted for perfect visibility */
    mix-blend-overlay       /* Better than multiply for realistic light/dark noise */
    pointer-events-none
    z-1000                    
  "
  style={grainStyle}
/>
      <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center">
        
        {/* Animated Sacred Thread (Now matching the brand red/pink) */}
        <motion.div 
          initial={{ height: 0 }}
          whileInView={{ height: 60 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="w-[1px] bg-gradient-to-b from-transparent via-[#eb4b55]/60 to-transparent mb-8"
        />

        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.div 
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
              transition={{ duration: 1 }}
              className="w-full flex flex-col items-center text-center"
            >
              {/* Premium 20% Off Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 backdrop-blur-sm border border-[#eb4b55]/20 mb-8 shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#eb4b55] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#eb4b55]"></span>
                  </span>
                  <span className="text-[#eb4b55] text-xs font-bold tracking-widest uppercase">
                    Launch Offer: 20% Off Varanasi Bookings
                  </span>
              </div>

              <h2 className="font-['Cormorant_Garamond'] text-[clamp(40px,5vw,70px)] text-[#1C1410] leading-[1.05] font-light mb-4">
                Begin your <br />
                <span className="italic text-[#eb4b55]">
                  Varanasi story
                </span>
              </h2>

              <p className="text-[#8C7B6E] text-lg font-light mb-16 max-w-md">
                Be among the first couples to have your love witnessed by the oldest city in the world. Claim your 20% exclusive discount by inquiring below.
              </p>

              {/* Minimalist Editorial Form */}
              <form onSubmit={handleSubmit} className="w-full max-w-xl text-left space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="relative">
                    <input 
                      type="text" 
                      name="name"
                      required
                      placeholder="Your Names (e.g. Priya & Arjun)"
                      value={formState.name}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedInput('name')}
                      onBlur={() => setFocusedInput(null)}
                      className={`${inputClasses} ${focusedInput === 'name' ? 'border-[#eb4b55] border-b-2' : 'border-[#1C1410]/20'}`}
                    />
                  </div>
                  <div className="relative">
                    <input 
                      type="email" 
                      name="email"
                      required
                      placeholder="Email Address"
                      value={formState.email}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedInput('email')}
                      onBlur={() => setFocusedInput(null)}
                      className={`${inputClasses} ${focusedInput === 'email' ? 'border-[#eb4b55] border-b-2' : 'border-[#1C1410]/20'}`}
                    />
                  </div>
                </div>

                <div className="relative">
                  <input 
                    type="text" 
                    name="date"
                    placeholder="Approximate Wedding / Shoot Date"
                    value={formState.date}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedInput('date')}
                    onBlur={() => setFocusedInput(null)}
                    className={`${inputClasses} ${focusedInput === 'date' ? 'border-[#eb4b55] border-b-2' : 'border-[#1C1410]/20'}`}
                  />
                </div>

                <div className="relative pb-8">
                  <textarea 
                    name="story"
                    rows={3}
                    placeholder="Tell us a few words about your vision, your ceremony, or what Varanasi means to you..."
                    value={formState.story}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedInput('story')}
                    onBlur={() => setFocusedInput(null)}
                    className={`${inputClasses} resize-none ${focusedInput === 'story' ? 'border-[#eb4b55] border-b-2' : 'border-[#1C1410]/20'}`}
                  />
                </div>

                {/* Primary Action Button - Color harmonized to the navbar "Get Quote" button */}
                <div className="flex justify-center pt-8">
                  <motion.button 
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative group overflow-hidden px-12 py-4 bg-[#eb4b55] rounded-full shadow-[0_10px_30px_-10px_rgba(235,75,85,0.4)] transition-all duration-300 hover:bg-[#d43c46]"
                  >
                    <span className="relative text-[12px] tracking-[0.25em] text-white uppercase font-semibold">
                      Claim 20% Off & Send Story
                    </span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          ) : (
            /* The Sacred Success State */
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="flex flex-col items-center text-center py-20"
            >
              {/* Glowing Pulse - Updated to Brand Red */}
              <motion.div 
                animate={{ 
                  boxShadow: ["0px 0px 20px rgba(235,75,85,0.3)", "0px 0px 60px rgba(235,75,85,0.7)", "0px 0px 20px rgba(235,75,85,0.3)"] 
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-4 h-4 rounded-full bg-[#eb4b55] mb-12"
              />
              <h3 className="font-['Cormorant_Garamond'] text-5xl md:text-6xl text-[#1C1410] font-light mb-6">
                The Ganga has heard you.
              </h3>
              <p className="text-[#8C7B6E] text-lg font-light max-w-sm">
                Your 20% offer is secured. We will reach out within 48 hours to begin crafting your story.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Reduced Footer space here so it flows naturally into your main global footer shown in the image */}
    </section>
  );
}