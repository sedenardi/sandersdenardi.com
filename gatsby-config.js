const siteAddress = new URL('https://www.sandersdenardi.com');

module.exports = {
  siteMetadata: {
    title: 'Sanders DeNardi',
    author: 'Sanders DeNardi',
    description: 'Personal blog by Sanders DeNardi.',
    siteUrl: siteAddress.origin,
    siteImage: `${siteAddress.origin}/twitter-card.jpg`,
    social: {
      twitter: 'srednass',
      github: 'sedenardi',
      email: 'sandersdenardi@gmail.com'
    },
    projects: [
      { name: 'Scaffmap', url: 'https://www.sprinkmap.com/scaff' },
      { name: 'Central Walk', url: 'https://www.sandersdenardi.com/projects/central-walk/' },
      { name: 'E-Bikes', url: 'https://www.sandersdenardi.com/projects/ebike/' },
      { name: 'SVUViz', url: 'https://svuviz.sandersdenardi.com/' },
      { name: 'Festival Guide', url: 'https://www.sandersdenardi.com/projects/festival-guide/' },
      { name: 'Score Tweets', url: 'https://github.com/sedenardi/score-tweets' },
      { name: 'All Projects', url: 'https://www.sandersdenardi.com/projects/' }
    ]
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
          {
            resolve: 'gatsby-remark-external-links',
            options: {
              target: '_blank',
              rel: 'noopener noreferrer'
            }
          }
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
    {
      resolve: 'gatsby-plugin-sass',
      options: {
        postCssPlugins: [require('tailwindcss')('./tailwind.js')],
      },
    },
    { 
      resolve: 'gatsby-plugin-purgecss',
      options: {
        printRejected: true, // Print removed selectors and processed file names
        // develop: true, // Enable while using `gatsby develop`
        tailwind: true, // Enable tailwindcss support
        whitelistPatternsChildren: [
          /^code/,
          /^pre/,
          /^token/,
          /^gatsby-highlight/,
          /^\[class*="language-"\]/
        ]
        // ignore: ['/src/styles/prism.css'], // Ignore files/folders
        // purgeOnly : ['components/', '/main.css', 'bootstrap/'], // Purge only these files/folders
      }
    },
    'gatsby-plugin-catch-links',
    'gatsby-plugin-sitemap',
    {
      resolve: 'gatsby-plugin-s3',
      options: {
        bucketName: 'sandersdenardi.com',
        protocol: siteAddress.protocol.slice(0, -1),
        hostname: siteAddress.hostname,
        removeNonexistentObjects: false
      },
    }
  ],
};
