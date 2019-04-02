import React from 'react';
import { Link, graphql } from 'gatsby';

import Layout from '../components/layout';
import SEO from '../components/seo';

const BlogPostTemplate = function(props) {
  const post = props.data.markdownRemark;
  const { previous, next } = props.pageContext;

  return (
    <Layout {...props.data.site.siteMetadata} location={props.location}>
      <SEO
        title={post.frontmatter.title}
        description={post.frontmatter.description || post.excerpt}
      />
      <h1 className="tw-text-3xl tw-font-light">{post.frontmatter.title}</h1>
      <div className="tw-mt-1 tw-text-grey-dark tw-font-light">
        {post.frontmatter.date}
      </div>
      <div className="tw-mt-4 tw-text-lg tw-font-light tw-leading-normal"
        dangerouslySetInnerHTML={{ __html: post.html }} />
      <br />
      <br />
      {previous && (
        <Link to={previous.fields.slug} rel="prev">
          ← {previous.frontmatter.title}
        </Link>
      )}
      <br />
      <br />
      {next && (
        <Link className="tw-block tw-text-right" to={next.fields.slug} rel="next">
          {next.frontmatter.title} →
        </Link>
      )}
    </Layout>
  );
};

export default BlogPostTemplate;

export const pageQuery = graphql`
  query BlogPostBySlug($slug: String!) {
    site {
      siteMetadata {
        title
        projects {
          name
          url
        }
        social {
          twitter
          github
          email
        }
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      excerpt(pruneLength: 160)
      html
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
      }
    }
  }
`;
