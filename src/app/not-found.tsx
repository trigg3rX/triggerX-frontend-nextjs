import React from "react";
import error from "@/app/assets/common/error.gif";
import ghost from "@/app/assets/common/ghost.svg";
import Image from "next/image";
import { Typography } from "./components/ui/Typography";
import { Button } from "./components/ui/Button";
import Link from "next/link";

const NotFound = () => {
  return (
    <div className="my-[20rem]">
      <div className="flex flex-col items-center justify-center  py-10 ">
        <Image src={error} alt="Error" className="w-[50%]" />
      </div>
      <div className="flex items-end flex-col w-[95%] mx-auto gap-10">
        <div className="text-end flex gap-5">
          <div>
            <Typography variant="body" align="left">
              This page seems to have vanished.
            </Typography>
            <Typography variant="body" align="left">
              No worries, our multi-chain navigation system can get you
            </Typography>
            <Typography variant="body" align="left">
              back on track. Head back to the TriggerX homepage.
            </Typography>
          </div>
          <Image src={ghost} alt="Ghost" className="w-[50px]" />
        </div>
        <Link href="/">
          <Button color="yellow">Go Back</Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
