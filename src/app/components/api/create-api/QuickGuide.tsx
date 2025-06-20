import React from "react";
import { MainContainer } from "../../ui/MainContainer";
import { Typography } from "../../ui/Typography";

const QuickStartGuide = () => (
  <MainContainer className="p-0 w-full lg:w-[30%]">
    <div className=" md:p-8  p-6 sm:p-6 ">
      <Typography variant="h2" align="left">
        Quick Start Guide
      </Typography>
      <ol className="space-y-4 my-6">
        <li className="flex flex-row gap-5 sm:gap-5 items-center">
          <Typography
            variant="badgeYellow"
            color="black"
            className="py-3 px-4 "
          >
            1
          </Typography>

          <Typography variant="span" align="left">
            Generate an API key in the &quot;API Key Generator&quot; tab
          </Typography>
        </li>
        <li className="flex flex-row gap-5 items-center">
          <Typography variant="badgeWhite" color="black" className="py-3 px-4 ">
            2
          </Typography>
          <Typography variant="span" align="left">
            Review the API documentation for available endpoints
          </Typography>
        </li>
        <li className="flex flex-row gap-5 items-center">
          <Typography
            variant="badgeYellow"
            color="black"
            className="py-3 px-4 "
          >
            3
          </Typography>
          <Typography variant="span" align="left">
            Make API requests using your generated key
          </Typography>
        </li>
        <li className="flex flex-row gap-5 items-center">
          <Typography variant="badgeWhite" color="black" className="py-3 px-4 ">
            4
          </Typography>
          <Typography variant="span" align="left">
            Monitor your usage and rate limits
          </Typography>
        </li>
      </ol>
    </div>
    <div className=" bg-[#242323]  p-5 rounded-bl-xl rounded-br-xl">
      <Typography
        variant="h3"
        className="lg:text-lg font-semibold mb-2 md:text-base sm:text-md text-sm"
        align="left"
      >
        Need Help?
      </Typography>
      <Typography variant="span" align="left">
        If you have any questions or need assistance, please don&apos;t hesitate
        to contact our support team at{" "}
        <a className="underline">hello@triggerx.network</a>
      </Typography>
    </div>
  </MainContainer>
);

export default QuickStartGuide;
