"use client";

import React, { useState } from "react";

const PrivacySettings = () => {
  const [saveFiles, setSaveFiles] = useState(true);

  const handleToggle = () => {
    setSaveFiles(!saveFiles);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="w-full">
          <h3 className="text-lg font-semibold">File Storage</h3>
          <p className="text-sm text-gray-500">
            Allow Convertly to save your uploaded files for faster access.
          </p>
        </div>
        <div className="w-full flex justify-end md:w-auto">
            <button
            onClick={handleToggle}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none flex-shrink-0 ${
                saveFiles ? "bg-indigo-600" : "bg-gray-300"
            }`}
            >
            <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${
                saveFiles ? "translate-x-6" : "translate-x-1"
                }`}
            />
            </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
