// src/components/CopyButton.jsx
import React, { useState } from 'react';
import { useNotificationStore } from '../stores/useNotificationStore';
import Icon from './Icon';

const CopyButton = ({ textToCopy }) => {
  const [copied, setCopied] = useState(false);
  const showNotification = useNotificationStore(state => state.showNotification);

  const handleCopy = () => {
    const textArea = document.createElement('textarea');
    textArea.value = textToCopy;
    // Make the textarea out of viewport
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      showNotification('¡Copiado al portapapeles!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showNotification('No se pudo copiar el texto', 'error');
    }
    document.body.removeChild(textArea);
  };

  const iconPath = copied
    ? "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" // Check mark
    : "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"; // Content copy

  return (
    <button onClick={handleCopy} className={`ml-2 p-1 rounded-full transition-colors ${copied ? 'text-green-500 bg-green-100' : 'text-gray-500 hover:bg-gray-200'}`} title="Copiar">
      <Icon path={iconPath} className="w-4 h-4" />
    </button>
  );
};

export default CopyButton;
