import React from "react";
import { Button } from "../ui/Button";

export const ContributorLinkButton: React.FC = () => {
  const GOOGLE_FORM_URL =
    "https://docs.google.com/forms/d/e/1FAIpQLSccVydJ86vR99IlqCsy1q2N1tJaKHxkvkoqgKnK3_UNKjipfw/viewform";

  return (
    <div className="flex md:gap-4 gap-2 md:justify-start justify-center my-10">
      <a href={GOOGLE_FORM_URL} target="_blank" rel="noopener noreferrer">
        <Button color="white">
          <span className="hidden md:inline">Submit Your Contributions</span>
          <span className="inline md:hidden">Submit Contributor</span>
        </Button>
      </a>
      <a
        href="https://triggerx.gitbook.io/triggerx-docs/rewards/contributor-rewards"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button color="white">
          <span className="hidden md:inline">Read Guidelines</span>
          <span className="inline md:hidden">Guidelines</span>
        </Button>
      </a>
    </div>
  );
};

export default ContributorLinkButton;
