import { defineConfig } from 'vitepress'

export default defineConfig({
    title: "FlagControl SDKs",
    description: "Official documentation for FlagControl SDKs",

    themeConfig: {
        nav: [
            { text: 'Home', link: '/' },
            { text: 'Getting Started', link: '/getting-started' },
            {
                text: 'SDKs', items: [
                    { text: 'Node.js', link: '/node-sdk' },
                    { text: 'React', link: '/react-sdk' }
                ]
            }
        ],

        sidebar: [
            {
                text: 'Introduction',
                items: [
                    { text: 'Getting Started', link: '/getting-started' },
                    { text: 'Core Concepts', link: '/core-concepts' }
                ]
            },
            {
                text: 'SDKs',
                items: [
                    { text: 'Node.js SDK', link: '/node-sdk' },
                    { text: 'React SDK', link: '/react-sdk' }
                ]
            },
            {
                text: 'Guides',
                items: [
                    { text: 'Type Generation', link: '/type-generation' },
                    { text: 'Best Practices', link: '/best-practices' }
                ]
            }
        ],

        socialLinks: [
            { icon: 'github', link: 'https://github.com/princecodes247/flagcontrol-js' }
        ],

        search: {
            provider: 'local'
        },

        footer: {
            message: 'Released under the MIT License.',
            copyright: 'Copyright © 2024 FlagControl'
        }
    }
})
