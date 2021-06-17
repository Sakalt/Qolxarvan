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
import WordPane from "/client/component/compound/word-pane";
import {
  style
} from "/client/component/decorator";


@style(require("./word-list.scss"))
export default class WordList extends Component<Props, State> {

  public render(): ReactNode {
    let displayedWords = this.props.searchResult.sliceWords(this.props.page);
    let wordPanes = displayedWords.map((word) => {
      let wordPane = (
        <WordPane
          dictionary={this.props.dictionary}
          word={word}
          key={word.uid}
          onLinkClick={this.props.onLinkClick}
        />
      );
      return wordPane;
    });
    let node = (
      <div styleName="root">
        {wordPanes}
      </div>
    );
    return node;
  }

}


type Props = {
  dictionary: Dictionary,
  searchResult: SearchResult,
  page: number,
  onLinkClick?: (name: string, event: MouseEvent<HTMLSpanElement>) => void
};
type State = {
};