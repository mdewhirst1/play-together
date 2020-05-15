module.exports = {
    parser: "@typescript-eslint/parser",
    extends: [
        "plugin:@typescript-eslint/recommended",
        "prettier/@typescript-eslint",
        "plugin:prettier/recommended",
    ],
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: "module",
    },
    rules: {
        "sort-keys": 0,
        "no-console": "off",
        "no-empty": 2,
        "quotes": [2, "double"],
        "@typescript-eslint/no-unused-vars": ["error", {"argsIgnorePattern": "^_"}],
        "@typescript-eslint/explicit-member-accessibility": 0,
        "@typescript-eslint/no-namespace": 0,
        "@typescript-eslint/interface-name-prefix": 0,
        "@typescript-eslint/explicit-function-return-type": 0,
        "@typescript-eslint/no-explicit-any": 0,
        "@typescript-eslint/array-type": 0,
        "@typescript-eslint/no-object-literal-type-assertion": 0,
        "@typescript-eslint/no-non-null-assertion": 0,
        "@typescript-eslint/no-var-requires": 0
    }
};
