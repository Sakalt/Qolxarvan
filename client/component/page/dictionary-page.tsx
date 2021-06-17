//

import axios from "axios";
import * as queryParser from "query-string";
import * as react from "react";
import {
  Fragment,
  ReactNode
} from "react";
import {
  Dictionary,
  NormalParameter,
  Parameter,
  SearchResult
} from "soxsot";
import Component from "/client/component/component";
import Logo from "/client/component/compound/logo";
import Pagination from "/client/component/compound/pagination";
import SearchForm from "/client/component/compound/search-form";
import WordList from "/client/component/compound/word-list";
import {
  style
} from "/client/component/decorator";
import Page from "/client/component/page/page";
import {
  debounce
} from "/client/util/decorator";
import {
  ParameterUtils
} from "/client/util/parameter";


@style(require("./dictionary-page.scss"))
export default class DictionaryPage extends Component<Props, State> {

  public state: State = {
    dictionary: null,
    parameter: NormalParameter.createEmpty("ja"),
    page: 0,
    showExplanation: true,
    searchResult: SearchResult.createEmpty()
  };

  public constructor(props: any) {
    super(props);
    this.deserializeQuery(true);
  }

  public async componentDidMount(): Promise<void> {
    await this.fetchDictionary();
  }

  public async componentDidUpdate(previousProps: any): Promise<void> {
    if (this.props.location!.key !== previousProps.location!.key) {
      this.deserializeQuery(false, () => {
        if (!this.state.showExplanation) {
          this.updateWordsImmediately(false);
        }
      });
    }
  }

  private async fetchDictionary(): Promise<void> {
    this.setState({dictionary: null});
    try {
      let response = await axios.get("/api/dictionary/fetch");
      let dictionary = Dictionary.fromPlain(response.data);
      this.setState({dictionary}, () => {
        this.updateWordsImmediately(false);
      });
    } catch (error) {
      this.setState({dictionary: null});
    }
  }

  private async updateWordsImmediately(serialize: boolean = true): Promise<void> {
    let dictionary = this.state.dictionary;
    if (dictionary !== null) {
      let parameter = this.state.parameter;
      let searchResult = dictionary.search(parameter);
      this.setState({searchResult, showExplanation: false});
      if (serialize) {
        this.serializeQuery();
      }
    }
  }

  @debounce(200)
  private async updateWords(): Promise<void> {
    await this.updateWordsImmediately();
  }

  private updateWordsByName(name: string): void {
    let language = this.props.store!.locale;
    let parameter = new NormalParameter(name, "name", "exact", language, {case: false, diacritic: false});
    this.setState({parameter}, () => {
      this.updateWordsImmediately();
    });
  }

  private deserializeQuery(first: boolean, callback?: () => void): void {
    let queryString = this.props.location!.search;
    let query = queryParser.parse(queryString);
    let language = this.props.store!.locale;
    let parameter = ParameterUtils.deserialize(query, language);
    let page = (typeof query.page === "string") ? +query.page : 0;
    let showExplanation = Object.keys(query).length <= 0;
    if (first) {
      this.state = Object.assign(this.state, {parameter, page, showExplanation});
      if (callback) {
        callback();
      }
    } else {
      this.setState({parameter, page, showExplanation}, callback);
    }
  }

  private serializeQuery(): void {
    let queryString = queryParser.stringify(ParameterUtils.serialize(this.state.parameter)) + `&page=${this.state.page}`;
    this.props.history!.push({search: queryString});
  }

  private async handleParameterSet(parameter: Parameter): Promise<void> {
    let page = 0;
    this.setState({parameter, page}, async () => {
      await this.updateWords();
    });
  }

  private handlePageSet(page: number): void {
    this.setState({page}, async () => {
      window.scrollTo(0, 0);
      await this.updateWordsImmediately(true);
    });
  }

  private renderWordList(): ReactNode {
    let minPage = this.state.searchResult.minPage;
    let maxPage = this.state.searchResult.maxPage;
    let node = (
      <Fragment>
        <div styleName="word-list">
          <WordList
            dictionary={this.state.dictionary!}
            searchResult={this.state.searchResult}
            page={this.state.page}
            onLinkClick={(name) => this.updateWordsByName(name)}
          />
        </div>
        <div styleName="pagination">
          <Pagination page={this.state.page} minPage={minPage} maxPage={maxPage} onSet={this.handlePageSet.bind(this)}/>
        </div>
      </Fragment>
    );
    return node;
  }

  public render(): ReactNode {
    let innerNode = (this.state.dictionary !== null) && (
      (this.state.showExplanation) ? this.renderWordList() : this.renderWordList()
    );
    let node = (
      <Page>
        <div styleName="header">
          <Logo/>
        </div>
        <div styleName="search-form">
          <SearchForm dictionary={this.state.dictionary!} parameter={this.state.parameter} onParameterSet={this.handleParameterSet.bind(this)}/>
        </div>
        {innerNode}
      </Page>
    );
    return node;
  }

}


type Props = {
};
type State = {
  dictionary: Dictionary | null,
  parameter: Parameter,
  page: number,
  showExplanation: boolean,
  searchResult: SearchResult
};