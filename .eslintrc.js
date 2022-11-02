module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    "airbnb-typescript",
    "plugin:@typescript-eslint/recommended",
    "plugin:jest/recommended",
    "plugin:prettier/recommended"
  ],
  overrides: [
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    ecmaFeatures: {
      jsx: true,
    },
    sourceType: "module",
    project: "./tsconfig.json",

  },
  plugins: ["react", "@typescript-eslint", "jest", "import"],
  rules: {
    "prettier/prettier": ["error", { endOfLine: "lf", singleQuote: false, printWidth: 120 }],
    "@typescript-eslint/no-use-before-define": "off",
  }
}
