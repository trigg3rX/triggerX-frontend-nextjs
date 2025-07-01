import React from "react";
import { Card } from "../ui/Card";
import { Typography } from "../ui/Typography";

interface PointItem {
  points: number;
  description: string;
  bgColor: string;
}

const pointsData: PointItem[] = [
  {
    points: 20,
    description: "Points for every custom job you create",
    bgColor: "bg-[#F8FF7C]",
  },
  {
    points: 10,
    description: "Points for every job created via a template",
    bgColor: "bg-white",
  },
];

export const PointsSystem: React.FC = () => {
  return (
    <Card>
      <Typography variant="h2" align="left" className="mb-4 w-full">
        Points System
      </Typography>
      <div className="space-y-3">
        {pointsData.map((item, index) => (
          <div key={index} className="flex items-center justify-start gap-3">
            <div
              className={`text-sm md:text-md ${item.bgColor} text-black w-8 h-8 rounded-full flex items-center justify-center`}
            >
              {item.points}
            </div>
            <Typography variant="body" color="secondary" align="left">
              {item.description}
            </Typography>
          </div>
        ))}
        <Typography
          variant="body"
          align="left"
          className="text-gray-400 w-full mt-3 pt-3 border-t border-white/10"
        >
          Earn more by building more. Every job counts.
        </Typography>
      </div>
    </Card>
  );
};
