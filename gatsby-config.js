module.exports = {
  siteMetadata: {
    title: 'Sanders DeNardi',
    author: 'Sanders DeNardi',
    description: 'Personal blog by Sanders DeNardi. .',
    siteUrl: 'https://www.sandersdenardi.com/',
    social: {
      twitter: 'srednass',
    },
  },
  plugins: [
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        path: `${__dirname}/src/pages`,
        name: 'pages',
      },
    },
    // {
    //   resolve: 'gatsby-source-filesystem',
    //   options: {
    //     path: `${__dirname}/content/assets`,
    //     name: 'assets',
    //   },
    // },
    {
      resolve: 'gatsby-transformer-remark',
      options: {
        plugins: [
          {
            resolve: 'gatsby-remark-images',
            options: {
              maxWidth: 590,
            },
          },
          {
            resolve: 'gatsby-remark-responsive-iframe',
            options: {
              wrapperStyle: 'margin-bottom: 1.0725rem',
            },
          },
          'gatsby-remark-prismjs',
          'gatsby-remark-copy-linked-files',
          'gatsby-remark-smartypants',
        ],
      },
    },
    'gatsby-transformer-sharp',
    'gatsby-plugin-sharp',
    {
      resolve: 'gatsby-plugin-google-analytics',
      options: {
        trackingId: 'UA-43803722-1',
      },
    },
    // 'gatsby-plugin-feed',
    // {
    //   resolve: 'gatsby-plugin-manifest',
    //   options: {
    //     name: 'Sanders DeNardi',
    //     short_name: 'Sanders DeNardi',
    //     start_url: '/',
    //     background_color: '#ffffff',
    //     theme_color: '#663399',
    //     display: 'minimal-ui',
    //     icon: 'content/assets/gatsby-icon.png',
    //     theme_color_in_head: false
    //   },
    // },
    // 'gatsby-plugin-offline',
    'gatsby-plugin-react-helmet',
    'gatsby-plugin-postcss'
  ],
};
