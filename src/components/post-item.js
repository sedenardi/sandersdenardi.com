import React from 'react';
import { Link } from 'gatsby';

const PostItem = function(props) {
  const { post } = props;
  const titleStr = post.frontmatter.title;
  const title = props.index ? (
    <Link className="tw-text-black" to={post.frontmatter.url}>
      {titleStr}
    </Link>
  ) : titleStr;
  const body = props.index ?
    (post.frontmatter.description || post.excerpt) : post.html;
  return (
    <div className="tw-py-6">
      <h3 className="tw-text-3xl tw-font-light">
        {title}
      </h3>
      <div className="tw-mt-1 tw-text-grey-darker tw-font-light">{post.frontmatter.date}</div>
      <p className="tw-text-lg tw-font-light tw-leading-normal"
        dangerouslySetInnerHTML={{
          __html: body,
        }} />
      {props.children}
    </div>
  );
};

export default PostItem;
