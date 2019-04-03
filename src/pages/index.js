import React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import SEO from '../components/seo';
import PostItem from '../components/post-item';

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
        return (
          <PostItem key={node.frontmatter.title} index post={node} />
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
          excerpt(pruneLength: 160)
          frontmatter {
            date(formatString: "MMMM DD, YYYY")
            title
            url
          }
        }
      }
    }
  }
`;
