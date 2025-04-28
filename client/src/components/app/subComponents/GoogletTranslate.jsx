import { useEffect, useState } from "react";
import { LanguageIcon } from "@heroicons/react/24/solid";
function GoogleTranslateToggle() {
  const [isVisible, setIsVisible] = useState(false);

  // Load and initialize Google Translate
  useEffect(() => {
    const loadGoogleTranslateScript = () => {
      if (!document.querySelector("#google-translate-script")) {
        const script = document.createElement("script");
        script.id = "google-translate-script";
        script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        script.async = true;
        document.body.appendChild(script);
      }
    };

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: "en" },
        "google_translate_element"
      );
    };

    loadGoogleTranslateScript();
  }, []);

  return (
    <div className='relative'>
      {/* Icon to toggle visibility */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        title='Translate'
        className='absolute -top-9 right-0 z-50 bg-primary-light hover:bg-white rounded-full p-2 shadow-md hover:scale-110 transition-all duration-300'
        aria-label='Toggle Google Translate'>
        <LanguageIcon className='h-3 w-3 md:h-4 md:w-4 text-text-dark' />
      </button>

      {/* Google Translate container */}
      <div
        id='google_translate_element'
        className={`absolute -top-4 -right-6 z-50 bg-transparent  transition-all duration-300 ${
          isVisible ? "block" : "hidden"
        }`}></div>
    </div>
  );
}

export default GoogleTranslateToggle;
