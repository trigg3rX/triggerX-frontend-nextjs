import React from "react";
import ghost from "@/assets/common/ghost.svg";
import Image from "next/image";
import Link from "next/link";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";

export default function Safe() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 py-24 gap-10 text-center">
      <div className="space-y-4 max-w-xl">
        <Typography variant="h2" color="primary" align="center">
          Safe Wallet coming soon
        </Typography>
        <Typography variant="body" align="center">
          We&apos;re polishing the dashboard to give you the best way to manage
          balances, templates, and jobs. Check back soon to explore the full
          Safe wallet experience.
        </Typography>
      </div>
      <Image src={ghost} alt="Ghost" className="w-[50px]" />
      <Link href="/">
        <Button color="yellow">Go Back</Button>
      </Link>
    </div>
  );
}
