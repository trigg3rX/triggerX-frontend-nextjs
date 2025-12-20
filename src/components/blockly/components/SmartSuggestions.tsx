"use client";

import React, { useEffect, useState, useCallback } from "react";
import * as Blockly from "blockly/core";
import { Lightbulb, X, ChevronRight } from "lucide-react";
import {
  analyzeWorkspaceAndSuggest,
  type BlockSuggestion,
} from "../utils/smartSuggestions";

interface SmartSuggestionsProps {
  workspace: Blockly.Workspace | null;
}

export function SmartSuggestions({ workspace }: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<BlockSuggestion[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  const updateSuggestions = useCallback(() => {
    if (!workspace) {
      setSuggestions([]);
      return;
    }

    const newSuggestions = analyzeWorkspaceAndSuggest(workspace);
    setSuggestions(newSuggestions.slice(0, 3)); // Show top 3 suggestions
  }, [workspace]);

  useEffect(() => {
    if (!workspace) return;

    // Update suggestions when workspace changes
    updateSuggestions();

    // Listen to workspace events
    const onChange = () => {
      // Debounce updates
      setTimeout(updateSuggestions, 100);
    };

    workspace.addChangeListener(onChange);

    return () => {
      workspace.removeChangeListener(onChange);
    };
  }, [workspace, updateSuggestions]);

  if (!workspace || suggestions.length === 0) {
    return null;
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-[#C07AF6] hover:bg-[#a46be0] text-white p-3 rounded-full shadow-lg transition-transform hover:translate-y-[-2px] inline-flex items-center justify-center"
          aria-label="Show suggestions"
        >
          <Lightbulb className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm">
      <div className="bg-[#1C1C1C] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[#C07AF6]" />
            <h3 className="text-white font-semibold text-sm">
              Smart Suggestions
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? "−" : "+"}
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Minimize"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="p-4 space-y-3">
            {suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.blockType}-${index}`}
                className={`p-3 rounded-lg border ${
                  index === 0
                    ? "bg-[#C07AF6]/10 border-[#C07AF6]/30"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-[#C07AF6] uppercase tracking-wide">
                        {suggestion.category}
                      </span>
                      {index === 0 && (
                        <span className="text-xs bg-[#C07AF6] text-white px-2 py-0.5 rounded-full">
                          Next
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-200 leading-relaxed">
                      {suggestion.description}
                    </p>
                    {suggestion.reason === "required" && (
                      <span className="inline-block mt-2 text-xs text-orange-400">
                        Required
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {isExpanded && (
          <div className="px-4 py-3 border-t border-white/10 bg-white/5">
            <p className="text-xs text-gray-400 text-center">
              Suggestions update as you build
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
