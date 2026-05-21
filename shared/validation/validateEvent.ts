import fs from "fs";
import path from "path";
import Ajv2020 from "ajv/dist/2020";

const ajv = new Ajv2020();

const schemaPath = path.join(
  process.cwd(),
  "shared/schemas/event.schema.json"
);

const schema = JSON.parse(
  fs.readFileSync(schemaPath, "utf-8")
);

const validate = ajv.compile(schema);

export function validateEvent(event: any) {
  const valid = validate(event);

  if (!valid) {
    console.error("\nEVENT VALIDATION FAILED\n");
    console.error(validate.errors);

    return {
      valid: false,
      errors: validate.errors
    };
  }

  return {
    valid: true,
    errors: null
  };
}