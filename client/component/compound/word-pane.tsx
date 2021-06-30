//

import partial from "lodash-es/partial";
import * as react from "react";
import {
  Fragment,
  MouseEvent,
  ReactNode
} from "react";
import {
  Dictionary,
  Equivalent,
  ExampleInformation,
  InformationKindUtil,
  Marker,
  MarkupResolver,
  NormalInformation,
  ParsedWord,
  Parser,
  PhraseInformation,
  Relation,
  Section,
  Word
} from "soxsot";
import Component from "/client/component/component";
import {
  style
} from "/client/component/decorator";


@style(require("./word-pane.scss"))
export default class WordPane extends Component<Props, State> {

  private renderHead(word: ParsedWord<ReactNode>): ReactNode {
    let sort = word.parts[this.props.store!.locale]?.sort ?? null;
    let categoryNode = (sort !== null) && (
      <span styleName="head-sort tag right-margin">{sort}</span>
    );
    let nameNode = (
      <span styleName="head-name right-margin">
        <span styleName="sans">{word.name}</span>
      </span>
    );
    let pronunciationNode = (word.pronunciation !== null) && (
      <span styleName="head-pronunciation right-margin">
        /{word.pronunciation}/
      </span>
    );
    let dateNode = (
      <span styleName="head-date">{word.date}</span>
    );
    let node = (
      <div styleName="head">
        <div styleName="head-left">
          {categoryNode}
          {nameNode}
          {pronunciationNode}
        </div>
        <div styleName="head-right">
          {dateNode}
        </div>
      </div>
    );
    return node;
  }

  private renderSection(section: Section<ReactNode>, index: number): ReactNode {
    let equivalents = section.getEquivalents(true);
    let normalInformations = section.getNormalInformations(true);
    let phraseInformations = section.getPhraseInformations(true);
    let exampleInformations = section.getExampleInformations(true);
    let relations = section.relations;
    let equivalentNodes = equivalents.map((equivalent, index) => this.renderEquivalent(equivalent, index));
    let normalInformationNodes = normalInformations.map((information, index) => this.renderNormalInformation(information, index));
    let phraseInformationNode = this.renderPhraseInformations(phraseInformations);
    let exampleInformationNode = this.renderExampleInformations(exampleInformations);
    let relationNodes = relations.map((relation, index) => this.renderRelation(relation, index));
    let equivalentNode = (equivalents.length > 0) && (
      <ul styleName="equivalents section-item list">
        {equivalentNodes}
      </ul>
    );
    let relationNode = (section.relations.length > 0) && (
      <ul styleName="relations section-item list">
        {relationNodes}
      </ul>
    );
    let node = (
      <div styleName="section" key={`section-${index}`}>
        {equivalentNode}
        {normalInformationNodes}
        {phraseInformationNode}
        {exampleInformationNode}
        {relationNode}
      </div>
    );
    return node;
  }

  private renderEquivalent(equivalent: Equivalent<ReactNode>, index: number): ReactNode {
    let categoryNode = (equivalent.category !== null) && (
      <span styleName="equivalent-category tag right-margin">{equivalent.category}</span>
    );
    let frameNode = (equivalent.frame !== null) && (
      <span styleName="equivalent-frame small right-margin">({equivalent.frame})</span>
    );
    let nameNodes = equivalent.names.map((name, index) => {
      let nameNode = (
        <Fragment key={`equivalent-inner-${index}`}>
          {name}
        </Fragment>
      );
      return nameNode;
    });
    let node = (
      <li styleName="equivalent text list-item" key={`equivalent-${index}`}>
        {categoryNode}
        {frameNode}
        {WordPane.intersperse(nameNodes, ", ")}
      </li>
    );
    return node;
  }

  private renderNormalInformation(information: NormalInformation<ReactNode>, index: number): ReactNode {
    let node = (
      <div styleName="information section-item" key={`information-${index}`}>
        <div styleName="information-kind small-head">
          <span styleName="information-kind-inner small-head-inner">{InformationKindUtil.getName(information.kind, this.props.store!.locale)}</span>
        </div>
        <div styleName="information-text text">
          {information.text}
        </div>
      </div>
    );
    return node;
  }

  private renderPhraseInformations(informations: ReadonlyArray<PhraseInformation<ReactNode>>): ReactNode {
    let innerNodes = informations.map((information, index) => {
      let expressionNode = (
        <dt styleName="phrase-expression">
          {information.expression}
          <span styleName="phrease-divider">—</span>
          {information.equivalentNames.join(", ")}
        </dt>
      );
      let textNode = (information.text !== null) && (
        <dd styleName="phrase-inner-text">
          {information.text}
        </dd>
      );
      let innerNode = (
        <Fragment key={`phrase-inner-${index}`}>
          {expressionNode}
          {textNode}
        </Fragment>
      );
      return innerNode;
    });
    let node = (informations.length > 0) && (
      <div styleName="information section-item" key="information-phrase">
        <div styleName="information-kind small-head">
          <span styleName="information-kind-inner small-head-inner">{InformationKindUtil.getName("phrase", this.props.store!.locale)}</span>
        </div>
        <dl styleName="phrase-text information-text text">
          {innerNodes}
        </dl>
      </div>
    );
    return node;
  }

  private renderExampleInformations(informations: ReadonlyArray<ExampleInformation<ReactNode>>): ReactNode {
    let innerNodes = informations.map((information, index) => {
      let sentenceNode = (
        <dt styleName="example-sentence">
          {information.sentence}
        </dt>
      );
      let translationNode = (
        <dd styleName="example-translation">
          {information.translation}
        </dd>
      );
      let innerNode = (
        <Fragment key={`example-inner-${index}`}>
          {sentenceNode}
          {translationNode}
        </Fragment>
      );
      return innerNode;
    });
    let node = (informations.length > 0) && (
      <div styleName="information section-item" key="information-example">
        <div styleName="information-kind small-head">
          <span styleName="information-kind-inner small-head-inner">{InformationKindUtil.getName("example", this.props.store!.locale)}</span>
        </div>
        <dl styleName="example-text information-text text">
          {innerNodes}
        </dl>
      </div>
    );
    return node;
  }

  private renderRelation(relation: Relation<ReactNode>, index: number): ReactNode {
    let titleNode = (relation.title !== null) && (
      <span styleName="relation-title tag right-margin">{relation.title}</span>
    );
    let entryNodes = relation.entries.map((entry, index) => {
      let referNode = entry.refer && <span styleName="refer">*</span>;
      let entryNode = (
        <Fragment key={`relation-inner-${index}`}>
          {entry.name}
          {referNode}
        </Fragment>
      );
      return entryNode;
    });
    let node = (
      <li styleName="relation text list-item" key={`relation-${index}`}>
        {titleNode}
        {WordPane.intersperse(entryNodes, ", ")}
      </li>
    );
    return node;
  }

  private renderWord(word: ParsedWord<ReactNode>, markers: Array<Marker>): ReactNode {
    let headNode = this.renderHead(word);
    let sectionNodes = word.parts[this.props.store!.locale]?.sections.map((section, index) => this.renderSection(section, index));
    let sectionNode = (sectionNodes !== undefined && sectionNodes.length > 0) && (
      <div styleName="sections">
        {sectionNodes}
        <div styleName="background-name">{WordPane.createGilitString(word.name)}</div>
      </div>
    );
    let node = (
      <div styleName="word">
        {headNode}
        {sectionNode}
      </div>
    );
    return node;
  }

  public render(): ReactNode {
    let resolver = WordPane.createMarkupResolver(this.props.onLinkClick);
    let parser = new Parser(resolver);
    let word = parser.parse(this.props.word);
    let markers = this.props.word.markers;
    let node = this.renderWord(word, markers);
    return node;
  }

  public static createMarkupResolver(onLinkClick?: (name: string, event: MouseEvent<HTMLSpanElement>) => void): MarkupResolver<ReactNode, ReactNode> {
    let resolveLink = function (name: string, children: Array<ReactNode | string>): ReactNode {
      let node = <span styleName="link" key={Math.random()} onClick={onLinkClick && partial(onLinkClick, name)}>{children}</span>;
      return node;
    };
    let resolveBracket = function (children: Array<ReactNode | string>): ReactNode {
      let node = <span styleName="sans" key={Math.random()}>{children}</span>;
      return node;
    };
    let resolveSlash = function (string: string): ReactNode {
      let node = <span styleName="italic" key={Math.random()}>{string}</span>;
      return node;
    };
    let join = function (nodes: Array<ReactNode | string>): ReactNode {
      return nodes;
    };
    let resolver = new MarkupResolver({resolveLink, resolveBracket, resolveSlash, join});
    return resolver;
  }

  public static intersperse(nodes: ReadonlyArray<ReactNode>, separator: ReactNode): Array<ReactNode> {
    let resultNodes = [];
    for (let i = 0 ; i < nodes.length ; i ++) {
      if (i !== 0) {
        resultNodes.push(separator);
      }
      resultNodes.push(nodes[i]);
    }
    return resultNodes;
  }

  private static createGilitString(string: string): string {
    let capital = false;
    let gilitChars = string.split("").reverse().map((char) => {
      if (char !== "x" && char !== "j" && char !== "n" && char !== "m" && char !== "'") {
        capital = !capital;
      }
      let gilitChar = (char === "'") ? "" : (capital) ? char.toUpperCase() : char.toLowerCase();
      return gilitChar;
    });
    let gilitString = gilitChars.reverse().join("");
    console.log(gilitChars);
    return gilitString;
  }

}


type Props = {
  dictionary: Dictionary,
  word: Word,
  onLinkClick?: (name: string, event: MouseEvent<HTMLSpanElement>) => void
};
type State = {
};