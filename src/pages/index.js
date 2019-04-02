import React from 'react';
import { Link, graphql } from 'gatsby';

import Layout from '../components/layout';
import SEO from '../components/seo';

const BlogIndex = function(props) {
  const { data } = props;
  const posts = data.allMarkdownRemark.edges;

  return (
    <Layout {...data.site.siteMetadata} location={props.location}>
      <SEO
        title="All posts"
        keywords={['blog', 'gatsby', 'javascript', 'react']}
      />
      {posts.map(({ node }) => {
        const title = node.frontmatter.title || node.fields.slug;
        return (
          <div key={node.fields.slug} className="tw-pt-4 tw-pb-8">
            <h3 className="tw-text-3xl tw-font-light">
              <Link className="tw-text-black" to={node.fields.slug}>
                {title}
              </Link>
            </h3>
            <div className="tw-mt-1 tw-text-grey-dark tw-font-light">{node.frontmatter.date}</div>
            <p className="tw-mt-2 tw-text-lg tw-font-light tw-leading-normal"
              dangerouslySetInnerHTML={{
                __html: node.frontmatter.description || node.excerpt,
              }} />
          </div>
        );
      })}
    </Layout>
  );
};

export default BlogIndex;

export const pageQuery = graphql`
  query {
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
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      edges {
        node {
          excerpt
          fields {
            slug
          }
          frontmatter {
            date(formatString: "MMMM DD, YYYY")
            title
          }
        }
      }
    }
  }
`;
