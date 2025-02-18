const isCodeSandbox = !!process.env.SANDBOX_URL

export default {
  root: "src/",
  publicDir: "../public/",
  base: '/soldier-projet/',
  server:
    {
        host: true,
        open: !isCodeSandbox // Open if it's not a CodeSandbox
    },
  build:
    {
        outDir: "../dist",
        emptyOutDir: true,
        sourcemap: true
    }
};
