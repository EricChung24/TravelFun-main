module.exports = {
  extends: '@antfu',
  rules: {
    'semi': ['error', 'always'],
    '@typescript-eslint/semi': 'off',
    'no-console': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    'vue/no-unused-vars': 'off',
    'vue/no-unused-refs': 'off',
  },
};
