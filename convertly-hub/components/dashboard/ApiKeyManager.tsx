"use client";

import React, { useState } from "react";
import { Clipboard, RefreshCw } from "lucide-react";

const ApiKeyManager = () => {
  const [apiKey, setApiKey] = useState("ch_xxxxxx_xxxxxxxxxxxxxxxxxxxx");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    // In a real app, this would make an API call
    const newKey = `ch_xxxxxx_${Math.random().toString(36).substring(2)}`;
    setApiKey(newKey);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between">
        <input
          type="text"
          readOnly
          value={apiKey}
          className="w-full p-2 mr-4 font-mono bg-gray-100 border rounded"
        />
        <div className="flex space-x-2">
          <button
            onClick={handleCopy}
            className="p-2 text-gray-600 transition bg-gray-200 rounded-lg hover:bg-gray-300"
            aria-label="Copy API Key"
          >
            {copied ? "Copied!" : <Clipboard size={20} />}
          </button>
          <button
            onClick={handleRegenerate}
            className="p-2 text-gray-600 transition bg-gray-200 rounded-lg hover:bg-gray-300"
            aria-label="Regenerate API Key"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyManager;
