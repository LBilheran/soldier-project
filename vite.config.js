/**
* @type {import('vite').UserConfig}
*/
import { VitePWA } from 'vite-plugin-pwa';

export default {
  base: process.env.NODE_ENV === 'production' ? '/soldier-project/' : '',
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Soldier Project",
        short_name: "Soldier",
        description: "Intancing game",
        theme_color: "#ffffff",
        background_color: "#000000",
        display: "standalone",
        icons: [
          {
            src: "images/robot-144.png",
            sizes: "144x144",
            type: "image/png",
          },
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg}"],
      }
    })
  ]
};
