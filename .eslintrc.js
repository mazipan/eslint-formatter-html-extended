module.exports = {
  root: true,
  env: {
    browser: true,
    node: true
  },
  parserOptions: {
    parser: 'babel-eslint'
  },
  extends: [
    'airbnb-base'
  ],
  // add your custom rules here
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-underscore-dangle': 0,
    'no-param-reassign': ['warn', { props: false }],
    'no-underscore-dangle': 0,
    'no-empty': 0,
    'no-trailing-spaces': [2, { 'ignoreComments': true }],
    'comma-dangle': [2, 'always-multiline'],
    'indent': ["error", 2, { "SwitchCase": 1 }],
    'generator-star-spacing': 0,
    'import/no-extraneous-dependencies': 0,
    'import/no-dynamic-require': 0,
    'max-len': [
      'warn',
      {
        code: 400,
        ignoreComments: true,
        ignoreTrailingComments: true,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true
      }
    ],
    'prefer-destructuring': [
      'error',
      {
        AssignmentExpression: {
          array: false
        }
      },
      {
        enforceForRenamedProperties: false
      }
    ]
  }
};
