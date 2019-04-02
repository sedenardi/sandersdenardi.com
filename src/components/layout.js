import React, { useState } from 'react';
import { Link } from 'gatsby';
import githubIcon from '../assets/github-square.svg';
import twitterIcon from '../assets/twitter-square.svg';
import envelopeIcon from '../assets/envelope-square.svg';

const Social = function(props) {
  const social = [];
  const itemCls = 'tw-float-left';
  if (props.social.twitter) {
    social.push(
      <li key="2" className={itemCls}>
        <a href={`https://twitter.com/${props.social.twitter}`} target="_blank">
          <img alt="Twitter" className="tw-w-12 lg:tw-w-16" src={twitterIcon} />
        </a>
      </li>
    );
  }
  if (props.social.github) {
    social.push(
      <li key="1" className={itemCls}>
        <a href={`https://github.com/${props.social.github}`} target="_blank">
          <img alt="GitHub" className="tw-w-12 lg:tw-w-16" src={githubIcon} />
        </a>
      </li>
    );
  }
  if (props.social.email) {
    social.push(
      <li key="3" className={itemCls}>
        <a href={`mailto:${props.social.email}`}>
          <img alt="Email" className="tw-w-12 lg:tw-w-16" src={envelopeIcon} />
        </a>
      </li>
    );
  }
  if (social.length) {
    return (
      <div className="tw-flex tw-justify-center lg:tw-justify-start tw-pt-4 lg:tw-pt-8">
        <ul className="tw-list-reset">
          {social}
        </ul>
      </div>
    );
  }
  return social;
};

const Projects = function(props) {
  const [expanded, setExpanded] = useState(false);
  if (!props.projects || !props.projects.length) {
    return null;
  }
  let lsCls = 'tw-list-reset lg:tw-pl-4 lg:tw-block';
  if (!expanded) {
    lsCls += ' tw-hidden';
  }
  return (
    <div className="tw-text-center lg:tw-text-left tw-text-2xl tw-font-thin tw-pt-4 lg:tw-pt-8">
      <a className="tw-cursor-pointer lg:tw-cursor-default tw-pt-4" onClick={() => setExpanded(!expanded)}>
        <span className="tw-hidden lg:tw-inline">Projects</span>
        <span className="lg:tw-hidden">Projects {expanded ? '▲' : '▼'}</span>
      </a>
      <ul className={lsCls}>
        {props.projects.map((p) => {
          return (
            <li key={p.name} className="tw-pt-4">
              <a href={p.url} target="_blank">{p.name}</a>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const Nav = function(props) {
  return (
    <nav className="tw-bg-black tw-text-white tw-w-full lg:tw-fixed lg:tw-pin-l lg:tw-pin-y lg:tw-w-96 tw-overflow-y-scroll">
      <div className="tw-p-8">
        <h1 className="tw-text-3xl lg:tw-text-4.5xl tw-font-thin tw-text-center lg:tw-text-left">
          <Link to="/">{props.title}</Link>
        </h1>
        <Projects {...props} />
        <Social {...props} />
      </div>
    </nav>
  );
};

const Layout = function(props) {
  return (
    <div className="tw-flex tw-flex-col tw-min-h-screen tw-font-sans">
      <Nav {...props} />
      <main className="lg:tw-ml-96 tw-p-4">
        {props.children}
      </main>
    </div>
  );
};

export default Layout;
