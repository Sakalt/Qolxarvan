//

import * as react from "react";
import {
  ReactNode
} from "react";
import {
  Dictionary,
  NormalParameter,
  Parameter,
  WordMode,
  WordType
} from "soxsot";
import Checkbox from "/client/component/atom/checkbox";
import Input from "/client/component/atom/input";
import RadioGroup from "/client/component/atom/radio-group";
import Component from "/client/component/component";
import {
  style
} from "/client/component/decorator";
import {
  ParameterUtils
} from "/client/util/parameter";


@style(require("./search-form.scss"))
export default class SearchForm extends Component<Props, State> {

  private handleParameterSet(nextParameter: {search?: string, mode?: WordMode, type?: WordType, ignoreDiacritic?: boolean}): void {
    if (this.props.onParameterSet) {
      let oldParameter = ParameterUtils.getNormal(this.props.parameter);
      let search = nextParameter.search ?? oldParameter.search;
      let mode = nextParameter.mode ?? oldParameter.mode;
      let type = nextParameter.type ?? oldParameter.type;
      let language = this.props.store!.locale;
      let ignoreCase = oldParameter.ignoreOptions.case;
      let ignoreDiacritic = nextParameter.ignoreDiacritic ?? oldParameter.ignoreOptions.diacritic;
      let ignoreOptions = {case: ignoreCase, diacritic: ignoreDiacritic};
      let parameter = new NormalParameter(search, mode, type, language, ignoreOptions);
      this.props.onParameterSet(parameter);
    }
  }

  public render(): ReactNode {
    let modes = ["both", "name", "equivalent", "content"] as const;
    let types = ["prefix", "part", "exact", "regular", "pair"] as const;
    let modeSpecs = modes.map((mode) => ({value: mode, label: this.trans(`searchForm.${mode}`)}));
    let typeSpecs = types.map((type) => ({value: type, label: this.trans(`searchForm.${type}`)}));
    let parameter = ParameterUtils.getNormal(this.props.parameter);
    let node = (
      <form styleName="root" onSubmit={(event) => event.preventDefault()}>
        <div styleName="input-wrapper">
          <Input value={parameter.search} onSet={(search) => this.handleParameterSet({search})}/>
        </div>
        <div styleName="radio-wrapper">
          <RadioGroup name="mode" value={parameter.mode} specs={modeSpecs} onSet={(mode) => this.handleParameterSet({mode})}/>
          <RadioGroup name="type" value={parameter.type} specs={typeSpecs} onSet={(type) => this.handleParameterSet({type})}/>
          <Checkbox
            name="ignoreDiacritic"
            value="true"
            label={this.trans("searchForm.ignoreDiacritic")}
            checked={parameter.ignoreOptions.diacritic}
            onSet={(ignoreDiacritic) => this.handleParameterSet({ignoreDiacritic})}
          />
        </div>
      </form>
    );
    return node;
  }

}


type Props = {
  dictionary: Dictionary,
  parameter: Parameter,
  onParameterSet?: (parameter: Parameter) => void;
};
type State = {
};