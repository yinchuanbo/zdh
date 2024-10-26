function getSettings(path = '') {
  const setInfo = {
    arrowParens: "always",
    bracketSpacing: true,
    endOfLine: "lf",
    htmlWhitespaceSensitivity: "css",
    insertPragma: false,
    singleAttributePerLine: false,
    bracketSameLine: false,
    jsxBracketSameLine: false,
    jsxSingleQuote: false,
    printWidth: 80,
    proseWrap: "preserve",
    quoteProps: "as-needed",
    requirePragma: false,
    semi: true,
    singleQuote: false,
    tabWidth: 2,
    trailingComma: "es5",
    useTabs: false,
    embeddedLanguageFormatting: "auto",
    vueIndentScriptAndStyle: false,
    experimentalTernaries: false,
    parser: 'babel',
  }

  if (path.endsWith(".tpl")) {
    setInfo.parser = "html"
  }
  if (path.endsWith(".css")) {
    setInfo.parser = "css";
  }
  if (path.endsWith(".scss")) {
    setInfo.parser = "scss";
  }
  if (path.endsWith(".json")) {
    setInfo.parser = "json";
  }
  return setInfo;
}

module.exports = getSettings;
