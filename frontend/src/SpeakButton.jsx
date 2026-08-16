import { useEffect, useRef, useState } from "react";
import "./SpeakButton.css";

/* ==========================================================================
   Finds the best available Indian-English voice from the browser.
   Voices load asynchronously in some browsers, so we listen for the
   'voiceschanged' event as a fallback.
   ========================================================================== */

function pickIndianVoice() {
  const voices = window.speechSynthesis.getVoices();

  if (!voices.length) return null;

  // Prefer an explicit India locale, then anything with "India" in the name,
  // then just fall back to any English voice.
  return (
    voices.find((v) => v.lang === "en-IN") ||
    voices.find((v) => /india/i.test(v.name)) ||
    voices.find((v) => v.lang?.startsWith("en")) ||
    voices[0]
  );
}

/* ==========================================================================
   SpeakButton
   Props:
     text      - the string to read aloud (e.g. full delivery address)
     label     - optional aria-label / tooltip text
   ========================================================================== */

export default function SpeakButton({ text, label = "Play address" }) {
  const [speaking, setSpeaking] = useState(false);
  const voiceRef = useRef(null);

  useEffect(() => {
    function loadVoice() {
      voiceRef.current = pickIndianVoice();
    }

    loadVoice();

    // Chrome loads voices async on first call — this fires once they're ready.
    window.speechSynthesis.addEventListener("voiceschanged", loadVoice);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoice);
    };
  }, []);

  function handleClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const synth = window.speechSynthesis;

    // If it's already talking (this button or elsewhere), stop it — acts as toggle.
    if (synth.speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }

    if (!text || !text.trim()) return;

    const utterance = new SpeechSynthesisUtterance(text);

    if (voiceRef.current) {
      utterance.voice = voiceRef.current;
      utterance.lang = voiceRef.current.lang;
    } else {
      utterance.lang = "en-IN";
    }

    utterance.rate = 0.95;
    utterance.pitch = 1;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    synth.speak(utterance);
  }

  return (
    <button
      type="button"
      className={`speak-btn ${speaking ? "speaking" : ""}`}
      onClick={handleClick}
      aria-label={label}
      title={label}
    >
      {speaking ? (
        <span className="speak-bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      ) : (
        <svg viewBox="0 0 24 24" className="speak-icon" aria-hidden="true">
          <path d="M4 9v6h4l5 5V4L8 9H4z" fill="currentColor" />
          <path
            d="M16.5 8.5a5 5 0 0 1 0 7"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M18.8 6.2a8.4 8.4 0 0 1 0 11.6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          />
        </svg>
      )}
    </button>
  );
}