import { useState, useEffect, useCallback } from "react";

type SerializedState = {
  xml: string;
};

const LOCAL_STORAGE_KEY = "triggerx:blockly-demo:xml";

/**
 * Custom hook to manage Blockly workspace state and local storage persistence
 */
export function useBlocklyWorkspace() {
  const [xml, setXml] = useState<string>(
    '<xml xmlns="https://developers.google.com/blockly/xml"></xml>',
  );

  // Load any previously saved workspace
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed: SerializedState = JSON.parse(saved);
        if (parsed?.xml) setXml(parsed.xml);
      } catch {
        // ignore corrupt state
      }
    }
  }, []);

  const onXmlChange = useCallback((newXml: string) => {
    setXml(newXml);
    // persist
    try {
      const snapshot: SerializedState = { xml: newXml };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify(snapshot),
        );
      }
    } catch {
      // ignore quota errors
    }
  }, []);

  return { xml, onXmlChange };
}
