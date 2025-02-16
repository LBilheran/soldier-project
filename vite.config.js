const isCodeSandbox = !!process.env.SANDBOX_URL

export default {
  root: "src/",
  publicDir: "../public/",
  base: '/soldier-project/',
  build:
    {
        outDir: "dist",
        emptyOutDir: true,
        sourcemap: true
    }
};
