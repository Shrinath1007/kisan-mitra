// src/components/common/LanguageSelector.jsx
import React from 'react';
import './LanguageSelector.css';

const LanguageSelector = ({ currentLang, onChangeLang }) => {
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'mr', name: 'Marathi' },
    { code: 'kn', name: 'Kannada' },
    { code: 'hi', name: 'Hindi' },
  ];

  return (
    <div className="language-selector">
      <select value={currentLang} onChange={(e) => onChangeLang(e.target.value)}>
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
