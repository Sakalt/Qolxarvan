//

import partial from "lodash-es/partial";
import * as react from "react";
import {
  MouseEvent,
  ReactNode
} from "react";
import {
  Dictionary,
  Suggestion
} from "soxsot";
import Component from "/client/component/component";
import WordPane from "/client/component/compound/word-pane";
import {
  style
} from "/client/component/decorator";


@style(require("./suggestion-pane.scss"))
export default class SuggestionPane extends Component<Props, State> {

  public render(): ReactNode {
    const suggestion = this.props.suggestion;
    const language = this.props.store!.locale;
    const descriptionNames = suggestion.getDescriptionNames(language).filter((name) => name !== undefined);
    const keywordNode = (descriptionNames.length > 0) && (
      <span styleName="keyword">
        ({descriptionNames.join(", ").toLowerCase()})
      </span>
    );
    const nameNodes = suggestion.names.map((name) => {
      const nameNode = <span styleName="link sans" key={Math.random()} onClick={this.props.onLinkClick && partial(this.props.onLinkClick, name)}>{name}</span>;
      return nameNode;
    });
    const nameNode = WordPane.intersperse(nameNodes, ", ");
    const node = (
      <li styleName="suggestion">
        {suggestion.getKindName(language)?.toLowerCase()}
        {keywordNode}
        <span styleName="divider">—</span>
        {nameNode}
      </li>
    );
    return node;
  }

}


type Props = {
  dictionary: Dictionary,
  suggestion: Suggestion,
  onLinkClick?: (name: string, event: MouseEvent<HTMLSpanElement>) => void
};
type State = {
};