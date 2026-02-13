"use client";

import { useState, useMemo } from "react";

interface MessageTemplate {
  id: string;
  type: string;
  name: string;
  subject: string;
  body: string;
}

export default function MessageGenerator({
  templates,
}: {
  templates: MessageTemplate[];
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [placeholderValues, setPlaceholderValues] = useState<
    Record<string, string>
  >({});
  const [copied, setCopied] = useState(false);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  // Extract placeholders from template body and subject
  const placeholders = useMemo(() => {
    if (!selectedTemplate) return [];
    const text = `${selectedTemplate.subject} ${selectedTemplate.body}`;
    const matches = text.match(/\{\{(\w+)\}\}/g) || [];
    const unique = [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, "")))];
    return unique;
  }, [selectedTemplate]);

  // Generate the message by replacing placeholders
  const generatedSubject = useMemo(() => {
    if (!selectedTemplate) return "";
    let result = selectedTemplate.subject;
    placeholders.forEach((p) => {
      const value = placeholderValues[p] || `{{${p}}}`;
      result = result.replace(new RegExp(`\\{\\{${p}\\}\\}`, "g"), value);
    });
    return result;
  }, [selectedTemplate, placeholders, placeholderValues]);

  const generatedBody = useMemo(() => {
    if (!selectedTemplate) return "";
    let result = selectedTemplate.body;
    placeholders.forEach((p) => {
      const value = placeholderValues[p] || `{{${p}}}`;
      result = result.replace(new RegExp(`\\{\\{${p}\\}\\}`, "g"), value);
    });
    return result;
  }, [selectedTemplate, placeholders, placeholderValues]);

  const handleTemplateChange = (id: string) => {
    setSelectedTemplateId(id);
    setPlaceholderValues({});
    setCopied(false);
  };

  const handlePlaceholderChange = (placeholder: string, value: string) => {
    setPlaceholderValues((prev) => ({ ...prev, [placeholder]: value }));
    setCopied(false);
  };

  const handleCopy = async () => {
    const fullMessage = `Subject: ${generatedSubject}\n\n${generatedBody}`;
    try {
      await navigator.clipboard.writeText(fullMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = fullMessage;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatPlaceholderLabel = (p: string) => {
    return p
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case "game_reminder":
        return "Game Reminder";
      case "weather_change":
        return "Weather Update";
      case "schedule_update":
        return "Schedule Change";
      case "general":
        return "General";
      default:
        return type;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Template Selection & Placeholder Form */}
      <div className="space-y-6">
        {/* Template Dropdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-primary-dark mb-4">
            Select Template
          </h2>
          <select
            value={selectedTemplateId}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">Choose a template...</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({typeLabel(t.type)})
              </option>
            ))}
          </select>
        </div>

        {/* Placeholder Fields */}
        {selectedTemplate && placeholders.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-primary-dark mb-4">
              Fill In Details
            </h2>
            <div className="space-y-4">
              {placeholders.map((p) => (
                <div key={p}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {formatPlaceholderLabel(p)}
                  </label>
                  <input
                    type="text"
                    value={placeholderValues[p] || ""}
                    onChange={(e) =>
                      handlePlaceholderChange(p, e.target.value)
                    }
                    placeholder={`Enter ${formatPlaceholderLabel(p).toLowerCase()}...`}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="space-y-4">
        {selectedTemplate ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-primary-dark">
                Message Preview
              </h2>
              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  copied
                    ? "bg-green-500 text-white"
                    : "bg-primary-dark text-white hover:bg-primary"
                }`}
              >
                {copied ? "Copied!" : "Copy to Clipboard"}
              </button>
            </div>
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="mb-3 pb-3 border-b border-slate-100">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Subject
                </span>
                <p className="text-sm font-semibold text-slate-800 mt-1">
                  {generatedSubject}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Message
                </span>
                <div className="text-sm text-slate-700 mt-1 whitespace-pre-wrap leading-relaxed">
                  {generatedBody}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <svg
              className="w-12 h-12 text-slate-300 mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <p className="text-slate-400">
              Select a template to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
