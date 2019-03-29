import React from 'react';
import { Link } from 'gatsby';
import githubIcon from '../assets/github-square.svg';
import twitterIcon from '../assets/twitter-square.svg';
import envelopeIcon from '../assets/envelope-square.svg';

class Nav extends React.Component {
  state = {
    expand: false
  }
  toggleExpand = () => { this.setState({ expand: !this.state.expand }); }
  projects() {
    if (this.props.projects && this.props.projects.length) {
      let lsCls = 'tw-list-reset lg:tw-pl-4 lg:tw-block';
      if (!this.state.expand) {
        lsCls += ' tw-hidden';
      }
      return (
        <div className="tw-text-center lg:tw-text-left tw-text-2xl tw-font-thin tw-pt-4 lg:tw-pt-8">
          <a className="tw-cursor-pointer lg:tw-cursor-default tw-pt-4" onClick={this.toggleExpand}>
            <span className="tw-hidden lg:tw-inline">Projects</span>
            <span className="lg:tw-hidden">Projects {this.state.expand ? '▲' : '▼'}</span>
          </a>
          <ul className={lsCls}>
            {this.props.projects.map((p) => {
              return (
                <li key={p.name} className="tw-pt-4">
                  <a href={p.url} target="_blank">{p.name}</a>
                </li>
              );
            })}
          </ul>
        </div>
      );
    }
  }
  social() {
    const social = [];
    if (this.props.social.github) {
      social.push(
        <a key="1" href={`https://github.com/${this.props.social.github}`} target="_blank">
          <img className="tw-w-12 lg:tw-w-16" src={githubIcon} />
        </a>
      );
    }
    if (this.props.social.twitter) {
      social.push(
        <a key="2" href={`https://twitter.com/${this.props.social.twitter}`} target="_blank">
          <img className="tw-w-12 lg:tw-w-16" src={twitterIcon} />
        </a>
      );
    }
    if (this.props.social.email) {
      social.push(
        <a key="3" href={`mailto:${this.props.social.email}`}>
          <img className="tw-w-12 lg:tw-w-16" src={envelopeIcon} />
        </a>
      );
    }
    if (social.length) {
      return (
        <div className="tw-flex tw-justify-center lg:tw-justify-start tw-pt-4 lg:tw-pt-8">
          {social}
        </div>
      );
    }
  }
  render() {
    return (
      <nav className="tw-bg-black tw-text-white tw-w-full lg:tw-fixed lg:tw-pin-l lg:tw-pin-y lg:tw-w-96 tw-overflow-y-scroll">
        <div className="tw-p-8">
          <h1 className="tw-text-3xl lg:tw-text-4.5xl tw-font-thin tw-text-center lg:tw-text-left">
            <Link to="/">{this.props.title}</Link>
          </h1>
          {this.projects()}
          {this.social()}
        </div>
      </nav>
    );
  }
}

export default class Layout extends React.Component {
  render() {
    return (
      <div className="tw-flex tw-flex-col tw-min-h-screen tw-font-sans">
        <Nav {...this.props} />
        <main className="lg:tw-ml-96 tw-p-4">
          {this.props.children}
        </main>
      </div>
    );
  }
}
