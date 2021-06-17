//

import {
  NormalParameter,
  Parameter,
  WORD_MODES,
  WORD_TYPES,
  WordMode,
  WordType
} from "soxsot";


export class ParameterUtils {

  public static deserialize(query: Record<string, unknown>, language: string): Parameter {
    let search = (typeof query.search === "string") ? query.search : "";
    let mode = (typeof query.mode === "string") ? ParameterUtils.castMode(query.mode) : "both";
    let type = (typeof query.type === "string") ? ParameterUtils.castType(query.type) : "prefix";
    let parameter = new NormalParameter(search, mode, type, language);
    return parameter;
  }

  public static serialize(parameter: Parameter): Record<string, unknown> {
    if (parameter instanceof NormalParameter) {
      let query = {search: parameter.search, mode: parameter.mode, type: parameter.type};
      return query;
    } else {
      return {};
    }
  }

  private static castMode(rawMode: string): WordMode {
    let anyRawMode = rawMode as any;
    if (WORD_MODES.includes(anyRawMode)) {
      return anyRawMode as WordMode;
    } else {
      return "both";
    }
  }

  private static castType(rawType: string): WordType {
    let anyRawType = rawType as any;
    if (WORD_TYPES.includes(anyRawType)) {
      return anyRawType as WordType;
    } else {
      return "prefix";
    }
  }

}