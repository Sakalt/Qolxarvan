//

import * as react from "react";
import {
  MouseEvent,
  ReactNode
} from "react";
import {
  Dictionary,
  SearchResult
} from "soxsot";
import Component from "/client/component/component";
import SuggestionPane from "/client/component/compound/suggestion-pane";
import {
  style
} from "/client/component/decorator";


@style(require("./suggestion-list.scss"))
export default class SuggestionList extends Component<Props, State> {

  public render(): ReactNode {
    let displayedSuggestions = this.props.searchResult.suggestions;
    let suggestionPanes = displayedSuggestions.map((suggestion, index) => {
      let suggestionPane = (
        <SuggestionPane
          dictionary={this.props.dictionary}
          suggestion={suggestion}
          key={index}
          onLinkClick={this.props.onLinkClick}
        />
      );
      return suggestionPane;
    });
    let node = (suggestionPanes.length > 0) && (
      <div styleName="root">
        <ul styleName="list">
          {suggestionPanes}
        </ul>
      </div>
    );
    return node;
  }

}


type Props = {
  dictionary: Dictionary,
  searchResult: SearchResult,
  onLinkClick?: (name: string, event: MouseEvent<HTMLSpanElement>) => void
};
type State = {
};