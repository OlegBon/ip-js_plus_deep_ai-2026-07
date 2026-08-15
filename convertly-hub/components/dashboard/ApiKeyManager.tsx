"use client";

import React, { useState } from "react";
import { Clipboard, RefreshCw } from "lucide-react";
import { Button } from "../ui/Button";
import { toast } from "@/lib/hooks/use-toast";

const ApiKeyManager = () => {
  const [apiKey, setApiKey] = useState("ch_xxxxxx_xxxxxxxxxxxxxxxxxxxx");

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    toast.success("API Key copied to clipboard!");
  };

  const handleRegenerate = () => {
    // In a real app, this would make an API call
    const newKey = `ch_xxxxxx_${Math.random().toString(36).substring(2)}`;
    setApiKey(newKey);
    toast.success("API Key regenerated!");
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
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            aria-label="Copy API Key"
          >
            <Clipboard size={20} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRegenerate}
            aria-label="Regenerate API Key"
          >
            <RefreshCw size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyManager;
