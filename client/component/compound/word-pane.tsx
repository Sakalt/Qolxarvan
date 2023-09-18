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
import {
  GregorianDate
} from "talqis";
import Component from "/client/component/component";
import {
  style
} from "/client/component/decorator";


@style(require("./word-pane.scss"))
export default class WordPane extends Component<Props, State> {

  private renderHead(word: ParsedWord<ReactNode>): ReactNode {
    const sort = word.parts[this.props.store!.locale]?.sort ?? null;
    const date = GregorianDate.ofHairia(word.date);
    const dateString = ("0000" + date.getYear()).slice(-4) + "/" + ("00" + date.getMonth()).slice(-2) + "/" + ("00" + date.getDate()).slice(-2);
    const categoryNode = (sort !== null) && (
      <span styleName="head-sort tag right-margin">{sort}</span>
    );
    const nameNode = (
      <span styleName="head-name right-margin">
        <span styleName="sans">{word.name}</span>
      </span>
    );
    const pronunciationNode = (word.pronunciation !== null) && (
      <span styleName="head-pronunciation right-margin">
        /{word.pronunciation}/
      </span>
    );
    const dateNode = (
      <div styleName="head-date">
        <div styleName="hairia">{word.date}</div>
        <div styleName="gregorian">{dateString}</div>
      </div>
    );
    const node = (
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
    const equivalents = section.getEquivalents(true);
    const normalInformations = section.getNormalInformations(true).filter((information) => information.kind !== "task" && information.kind !== "history");
    const phraseInformations = section.getPhraseInformations(true);
    const exampleInformations = section.getExampleInformations(true);
    const relations = section.relations;
    const equivalentNodes = equivalents.map((equivalent, index) => this.renderEquivalent(equivalent, index));
    const normalInformationNodes = normalInformations.map((information, index) => this.renderNormalInformation(information, index));
    const phraseInformationNode = this.renderPhraseInformations(phraseInformations);
    const exampleInformationNode = this.renderExampleInformations(exampleInformations);
    const relationNodes = relations.map((relation, index) => this.renderRelation(relation, index));
    const equivalentNode = (equivalents.length > 0) && (
      <ul styleName="equivalents section-item list">
        {equivalentNodes}
      </ul>
    );
    const relationNode = (section.relations.length > 0) && (
      <ul styleName="relations section-item list">
        {relationNodes}
      </ul>
    );
    const node = (
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
    const categoryNode = (equivalent.category !== null) && (
      <span styleName="equivalent-category tag right-margin">{equivalent.category}</span>
    );
    const frameNode = (equivalent.frame !== null) && (
      <span styleName="equivalent-frame small right-margin">({equivalent.frame})</span>
    );
    const nameNodes = equivalent.names.map((name, index) => {
      const nameNode = (
        <Fragment key={`equivalent-inner-${index}`}>
          {name}
        </Fragment>
      );
      return nameNode;
    });
    const node = (
      <li styleName="equivalent text list-item" key={`equivalent-${index}`}>
        {categoryNode}
        {frameNode}
        {WordPane.intersperse(nameNodes, ", ")}
      </li>
    );
    return node;
  }

  private renderNormalInformation(information: NormalInformation<ReactNode>, index: number): ReactNode {
    const node = (
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
    const innerNodes = informations.map((information, index) => {
      const expressionNode = (
        <dt styleName="phrase-expression">
          {information.expression}
          <span styleName="phrease-divider">—</span>
          {information.equivalentNames.join(", ")}
        </dt>
      );
      const textNode = (information.text !== null) && (
        <dd styleName="phrase-inner-text">
          {information.text}
        </dd>
      );
      const innerNode = (
        <Fragment key={`phrase-inner-${index}`}>
          {expressionNode}
          {textNode}
        </Fragment>
      );
      return innerNode;
    });
    const node = (informations.length > 0) && (
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
    const innerNodes = informations.map((information, index) => {
      const sentenceNode = (
        <dt styleName="example-sentence">
          {information.sentence}
        </dt>
      );
      const translationNode = (
        <dd styleName="example-translation">
          {information.translation}
        </dd>
      );
      const innerNode = (
        <Fragment key={`example-inner-${index}`}>
          {sentenceNode}
          {translationNode}
        </Fragment>
      );
      return innerNode;
    });
    const node = (informations.length > 0) && (
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
    const titleNode = (relation.title !== null) && (
      <span styleName="relation-title tag right-margin">{relation.title}</span>
    );
    const entryNodes = relation.entries.map((entry, index) => {
      const referNode = entry.refer && <span styleName="refer">*</span>;
      const entryNode = (
        <Fragment key={`relation-inner-${index}`}>
          {entry.name}
          {referNode}
        </Fragment>
      );
      return entryNode;
    });
    const node = (
      <li styleName="relation text list-item" key={`relation-${index}`}>
        {titleNode}
        {WordPane.intersperse(entryNodes, ", ")}
      </li>
    );
    return node;
  }

  private renderWord(word: ParsedWord<ReactNode>, markers: Array<Marker>): ReactNode {
    const headNode = this.renderHead(word);
    const sectionNodes = word.parts[this.props.store!.locale]?.sections.map((section, index) => this.renderSection(section, index));
    const sectionNode = (sectionNodes !== undefined && sectionNodes.length > 0) && (
      <div styleName="sections">
        {sectionNodes}
        <div styleName="background-name">{WordPane.createGilitString(word.name)}</div>
      </div>
    );
    const node = (
      <div styleName="word">
        {headNode}
        {sectionNode}
      </div>
    );
    return node;
  }

  public render(): ReactNode {
    const resolver = WordPane.createMarkupResolver(this.props.onLinkClick);
    const parser = new Parser(resolver, {pronouncerConfigs: {showSyllables: true}});
    const word = parser.parse(this.props.word);
    const markers = this.props.word.markers;
    const node = this.renderWord(word, markers);
    return node;
  }

  public static createMarkupResolver(onLinkClick?: (name: string, event: MouseEvent<HTMLSpanElement>) => void): MarkupResolver<ReactNode, ReactNode> {
    const resolveLink = function (name: string, children: Array<ReactNode | string>): ReactNode {
      const node = <span styleName="link" key={Math.random()} onClick={onLinkClick && partial(onLinkClick, name)}>{children}</span>;
      return node;
    };
    const resolveBracket = function (children: Array<ReactNode | string>): ReactNode {
      const node = <span styleName="sans" key={Math.random()}>{children}</span>;
      return node;
    };
    const resolveSlash = function (string: string): ReactNode {
      const node = <span styleName="italic" key={Math.random()}>{string}</span>;
      return node;
    };
    const resolveHairia = function (hairia: number): ReactNode {
      const node = <span styleName="hairia" key={Math.random()}>{hairia}</span>;
      return node;
    };
    const join = function (nodes: Array<ReactNode | string>): ReactNode {
      return nodes;
    };
    const modifyPunctuations = true;
    const resolver = new MarkupResolver({resolveLink, resolveBracket, resolveSlash, resolveHairia, join, modifyPunctuations});
    return resolver;
  }

  public static intersperse(nodes: ReadonlyArray<ReactNode>, separator: ReactNode): Array<ReactNode> {
    const resultNodes = [];
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
    const gilitChars = string.split("").reverse().map((char) => {
      if (char !== "x" && char !== "j" && char !== "n" && char !== "m" && char !== "'") {
        capital = !capital;
      }
      const gilitChar = (char === "'") ? "" : (capital) ? char.toUpperCase() : char.toLowerCase();
      return gilitChar;
    });
    const gilitString = gilitChars.reverse().join("");
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