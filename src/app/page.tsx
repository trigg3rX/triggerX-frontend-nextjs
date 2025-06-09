import { Typography } from "./components/ui/Typography";

export default function Home() {
  console.log("Husky test");

  return (
    <div className="min-h-[600px] mt-[200px]">
      <Typography variant="h1" color="primary" className=" mb-6">
        Main Heading
      </Typography>
    </div>
  );
}
