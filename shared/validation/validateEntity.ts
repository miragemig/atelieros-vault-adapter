import fs from "fs";
import path from "path";
import Ajv2020 from "ajv/dist/2020";

const ajv = new Ajv2020();

const schemaPath = path.join(
  process.cwd(),
  "shared/schemas/entity.schema.json"
);

const schema = JSON.parse(
  fs.readFileSync(schemaPath, "utf-8")
);

const validate = ajv.compile(schema);

export function validateEntity(entity: any) {
  const valid = validate(entity);

  if (!valid) {
    console.error("\nENTITY VALIDATION FAILED\n");
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