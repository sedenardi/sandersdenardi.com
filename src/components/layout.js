import React from 'react';
import { Link } from 'gatsby';

class Nav extends React.Component {
  projects() {
    if (this.props.projects && this.props.projects.length) {
      return (
        <div className="tw-pt-8 tw-text-xl">
          <a className="tw-cursor-pointer tw-leading-loose">Projects</a>
          <ul className="tw-list-reset tw-pl-4">
            {this.props.projects.map((p) => {
              return (
                <li key={p.name} className="tw-leading-loose">
                  <a href={p.url} target="_blank">{p.name}</a>
                </li>
              );
            })}
          </ul>
        </div>
      );
    }
  }
  render() {
    return (
      <nav className="tw-bg-black tw-text-white tw-w-full lg:tw-fixed lg:tw-pin-l lg:tw-pin-y lg:tw-w-96 tw-p-8">
        <h1 className="tw-text-4xl tw-font-thin tw-text-center lg:tw-text-left">{this.props.title}</h1>
        {this.projects()}
      </nav>
    );
  }
}

export default class Layout extends React.Component {
  render() {
    return (
      <div className="tw-flex tw-flex-col tw-min-h-screen">
        <Nav {...this.props} />
        <main className="lg:tw-ml-96">
          {this.props.children}
        </main>
      </div>
    );
  }
}
