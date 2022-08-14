//


export class Validator<A, O> {

  public readonly name: string;
  public readonly go: (input: unknown, path: string) => ValidationResult<O>;
  public readonly assertionType!: A;
  public readonly outputType!: O;

  public constructor(name: string, go: (input: unknown, path: string) => ValidationResult<O>) {
    this.name = name;
    this.go = go;
  }

  public validate(input: unknown): [O, undefined] | [undefined, Array<ValidationFailInvalid>] {
    const result = this.go(input, "");
    if (Validator.isSuccess(result)) {
      return [result.output, undefined];
    } else {
      return [undefined, result.invalids];
    }
  }

  public coerce(input: unknown): O {
    const result = this.go(input, "");
    if (Validator.isSuccess(result)) {
      return result.output;
    } else {
      throw new ValidationError(result.invalids);
    }
  }

  public check(input: unknown): input is A {
    const result = this.go(input, "");
    const predicate = Validator.isSuccess(result);
    return predicate;
  }

  public assert(input: unknown): asserts input is A {
    const result = this.go(input, "");
    if (Validator.isFail(result)) {
      throw new ValidationError(result.invalids);
    }
  }

  public static success<O>(output: O): ValidationSuccess<O> {
    return {status: "success", output};
  }

  public static fail(invalids: Array<ValidationFailInvalid>): ValidationFail {
    return {status: "fail", invalids};
  }

  public static isSuccess<O>(result: ValidationResult<O>): result is ValidationSuccess<O> {
    return result.status === "success";
  }

  public static isFail(result: ValidationResult<unknown>): result is ValidationFail {
    return result.status === "fail";
  }

}


export class ValidationError extends Error {

  public readonly invalids: Array<ValidationFailInvalid>;

  public constructor(invalids: Array<ValidationFailInvalid>) {
    super("validation failed");
    this.name = new.target.name;
    this.invalids = invalids;
    Object.setPrototypeOf(this, new.target.prototype);
  }

}


export type ValidationResult<O> = ValidationSuccess<O> | ValidationFail;
export type ValidationSuccess<O> = {status: "success", output: O};
export type ValidationFail = {status: "fail", invalids: Array<ValidationFailInvalid>};
export type ValidationFailInvalid = {path: string, message: string};

export type AnyValidator = Validator<any, any>;
export type AnyValidatorObject = {[K in string]: AnyValidator};

export type AssertionType<V extends AnyValidator> = V["assertionType"];
export type OutputType<V extends AnyValidator> = V["outputType"];