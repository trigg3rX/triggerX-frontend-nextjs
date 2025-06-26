import { KeyboardEvent, useCallback } from "react";

type FocusableElement =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLButtonElement
  | HTMLElement;

const isDisabled = (element: FocusableElement): boolean => {
  if ("disabled" in element) {
    return element.disabled;
  }
  return element.hasAttribute("disabled");
};

export const useFormKeyboardNavigation = () => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const target = event.target as HTMLElement;

    // Early return if not Enter key or if in textarea
    if (event.key !== "Enter" || target.tagName === "TEXTAREA") {
      return;
    }

    event.preventDefault();

    const form = target.closest("form");
    if (!form) return;

    // Cache the selector for better performance
    const focusableSelector =
      'input:not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([readonly]):not([disabled])';

    // Use Set for O(1) lookup performance
    const focusableElements = new Set<FocusableElement>(
      Array.from(
        form.querySelectorAll<FocusableElement>(focusableSelector),
      ).filter((el) => {
        const style = window.getComputedStyle(el);
        return (
          !isDisabled(el) &&
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0"
        );
      }),
    );

    // Early return if no focusable elements
    if (focusableElements.size === 0) return;

    const currentElement = target;
    const elementsArray = Array.from(focusableElements);
    const currentIndex = elementsArray.indexOf(currentElement);

    // Handle dropdown elements
    if (
      currentElement.getAttribute("role") === "button" ||
      currentElement.closest('[role="button"]') ||
      currentElement.classList.contains("cursor-pointer")
    ) {
      currentElement.click();
      return;
    }

    // Focus next element if available
    if (currentIndex !== -1 && currentIndex < elementsArray.length - 1) {
      const nextElement = elementsArray[currentIndex + 1];
      nextElement.focus();
    }
  }, []);

  return { handleKeyDown };
};
