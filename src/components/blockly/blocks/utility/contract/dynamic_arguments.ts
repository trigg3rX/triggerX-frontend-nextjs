import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

const dynamicArgumentsJson = {
  type: "dynamic_arguments",
  message0: "fetch values dynmically from %1",
  args0: [
    {
      type: "field_input",
      name: "IPFS_URL",
      text: "ipfs://...",
    },
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 190,
  tooltip:
    "Specify the IPFS URL link from which the values of arguments have to be fetched.",
  helpUrl: "",
};

Blockly.Blocks["dynamic_arguments"] = {
  init: function () {
    this.jsonInit(dynamicArgumentsJson);
  },
};

export const dynamicArgumentsGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const functionName = block.getFieldValue("FUNCTION_NAME");
  const ipfsUrl = block.getFieldValue("IPFS_URL");

  const json = JSON.stringify({
    function_name: functionName,
    argument_type: "dynamic",
    ipfs_url: ipfsUrl,
  });

  return [`// Dynamic Arguments: ${json}`, Order.NONE];
};

export default dynamicArgumentsJson;
