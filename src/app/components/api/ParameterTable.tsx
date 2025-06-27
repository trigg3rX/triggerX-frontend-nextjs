import React from "react";
import { ApiParameter } from "@/data/apiData";
import { Typography } from "../ui/Typography";
import { Card } from "../ui/Card";

interface ParameterTableProps {
  title: string;
  parameters: ApiParameter[];
}

const ParameterTable: React.FC<ParameterTableProps> = ({
  title,
  parameters,
}) => {
  return (
    <div>
      <Typography variant="h4" className="mb-2" align="left">
        {title}
      </Typography>
      <Card className="border-none">
        <table className="w-full text-sm">
          <tbody>
            {parameters.map((param) => (
              <tr key={param.name}>
                <td className="py-2 w-1/3">
                  <Typography variant="body" color="gray" align="left">
                    {param.name}
                  </Typography>
                </td>
                <td className="pl-4">
                  <Typography variant="body" color="success" align="left">
                    {param.type}
                  </Typography>
                </td>
                {param.required !== undefined && (
                  <td className="pl-4">
                    <Typography
                      variant="body"
                      color={param.required ? "error" : "gray"}
                      align="left"
                    >
                      {param.required ? "required" : "optional"}
                    </Typography>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default ParameterTable;
