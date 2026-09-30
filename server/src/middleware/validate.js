import { ZodError } from "zod";

export function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation failed.",
          errors: error.flatten().fieldErrors,
        });
      }
      next(error);
    }
  };
}
