//

import {
  AnyValidator,
  AnyValidatorObject,
  AssertionType,
  OutputType,
  Validator
} from "/server/util/validator/validator";


export let string = new Validator<string, string>("string", (input, path) => {
  if (typeof input === "string") {
    return Validator.success(input);
  } else {
    let invalid = {path, message: "expected string"};
    return Validator.fail([invalid]);
  }
});

export let number = new Validator<number, number>("number", (input, path) => {
  if (typeof input === "number") {
    return Validator.success(input);
  } else {
    let invalid = {path, message: "expected number"};
    return Validator.fail([invalid]);
  }
});

export let int = new Validator<number, number>("int", (input, path) => {
  if (typeof input === "number") {
    if (Number.isInteger(input)) {
      return Validator.success(input);
    } else {
      let invalid = {path, message: "expected int"};
      return Validator.fail([invalid]);
    }
  } else {
    let invalid = {path, message: "expected int"};
    return Validator.fail([invalid]);
  }
});

export let numberFromString = new Validator<string, number>("string coercible to number", (input, path) => {
  if (typeof input === "string") {
    let output = parseFloat(input);
    if (!isNaN(output)) {
      return Validator.success(output);
    } else {
      let invalid = {path, message: "cannot coerce to number"};
      return Validator.fail([invalid]);
    }
  } else {
    let invalid = {path, message: "expected string coercible to number"};
    return Validator.fail([invalid]);
  }
});

export let intFromString = new Validator<string, number>("string coercible to int", (input, path) => {
  if (typeof input === "string") {
    let output = parseInt(input);
    if (!isNaN(output)) {
      return Validator.success(output);
    } else {
      let invalid = {path, message: "cannot coerce to int"};
      return Validator.fail([invalid]);
    }
  } else {
    let invalid = {path, message: "expected string coercible to int"};
    return Validator.fail([invalid]);
  }
});

export let enums = function <E extends string>(...values: Array<E>): Validator<E, E> {
  let validator = new Validator<any, any>(`one of ${values.map((value) => `'${value}'`).join(", ")}`, (input, path) => {
    if (typeof input === "string" && values.some((value) => value === input)) {
      return Validator.success(input);
    } else {
      let invalid = {path, message: `expected one of ${values.map((value) => `'${value}'`).join(", ")}`};
      return Validator.fail([invalid]);
    }
  });
  return validator;
};

export function array<V extends AnyValidator>(elementValidator: V): Validator<Array<AssertionType<V>>, Array<OutputType<V>>> {
  let validator = new Validator<any, any>(`array of ${elementValidator.name}`, (input, path) => {
    if (Array.isArray(input)) {
      let output = [];
      let invalids = [];
      for (let i = 0 ; i < input.length ; i ++) {
        let result = elementValidator.go(input[i], `${path}[${i}]`);
        if (Validator.isSuccess(result)) {
          output.push(result.output);
        } else {
          invalids.push(...result.invalids);
        }
      }
      if (invalids.length <= 0) {
        return Validator.success(output);
      } else {
        return Validator.fail(invalids);
      }
    } else {
      let invalid = {path, message: `expected array of ${elementValidator.name}`};
      return Validator.fail([invalid]);
    }
  });
  return validator;
};

export function arrayOrSingle<V extends AnyValidator>(elementValidator: V): Validator<Array<AssertionType<V>> | AssertionType<V>, Array<OutputType<V>>> {
  let validator = new Validator<any, any>(`array of ${elementValidator.name} or ${elementValidator.name} itself`, (input, path) => {
    if (Array.isArray(input)) {
      let result = array(elementValidator).go(input, path);
      return result;
    } else {
      let result = elementValidator.go(input, path);
      if (Validator.isSuccess(result)) {
        let output = [result.output];
        return Validator.success(output);
      } else {
        let invalid = {path, message: `expected array of ${elementValidator.name} or ${elementValidator.name} itself`};
        return Validator.fail([invalid]);
      }
    }
  });
  return validator;
};

export function object<S extends AnyValidatorObject>(schema: S): Validator<{[K in keyof S]: AssertionType<S[K]>}, {[K in keyof S]: OutputType<S[K]>}> {
  let validator = new Validator<any, any>("object", (input, path) => {
    if (typeof input === "object" && input !== null) {
      let output = {} as any;
      let invalids = [];
      let anyInput = input as any;
      for (let [key, elementValidator] of Object.entries(schema)) {
        if (key in input) {
          let result = elementValidator.go(anyInput[key], (path === "") ? key : `${path}.${key}`);
          if (Validator.isSuccess(result)) {
            output[key] = result.output;
          } else {
            invalids.push(...result.invalids);
          }
        } else {
          let error = {path: (path === "") ? key : `${path}.${key}`, message: "value undefined"};
          invalids.push(error);
        }
      }
      if (invalids.length <= 0) {
        return Validator.success(output);
      } else {
        return Validator.fail(invalids);
      }
    } else {
      let invalid = {path, message: "expected object"};
      return Validator.fail([invalid]);
    }
  });
  return validator;
};