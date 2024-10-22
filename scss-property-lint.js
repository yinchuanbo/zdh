const stylelint = require('stylelint');
const fs = require('fs').promises;

const config = {
    plugins: [
        "stylelint-scss" // 支持 SCSS 语法
    ],
    rules: {
        // 检查属性是否存在
        "property-no-unknown": true,
        // 检查属性值是否有效
        "declaration-property-value-no-unknown": true,
        // 检查颜色值是否有效
        "color-no-invalid-hex": true,
    }
};

async function checkScssProperties(input, options = { fix: false }) {
    try {
        let content;
        let filePath;
        let isFileInput = false;

        if (typeof input === 'string') {
            filePath = input;
            content = await fs.readFile(filePath, 'utf8');
            isFileInput = true;
        } else if (input && typeof input === 'object' && input.content) {
            content = input.content;
            filePath = 'input.scss';
        } else {
            throw new Error('Invalid input. Expected file path or content object');
        }

        const result = await stylelint.lint({
            code: content,
            config: config,
            fix: options.fix,
            formatter: "string"
        });

        console.log('result++++++++++++', result.results[0].warnings)

        const warnings = [];
        let fixedContent;

        if (result.results && result.results.length > 0) {
            const fileResult = result.results[0];
            if (fileResult.warnings) {
                for (const warning of fileResult.warnings) {
                    warnings.push({
                        line: warning.line,
                        column: warning.column,
                        rule: warning.rule,
                        severity: warning.severity,
                        text: warning.text
                    });
                }
            }
            if (options.fix && fileResult.output) {
                fixedContent = fileResult.output;
                if (isFileInput) {
                    await fs.writeFile(filePath, fixedContent, 'utf8');
                }
            }
        }
        return {
            isValid: warnings.length === 0,
            warnings: warnings,
            ...(fixedContent && { fixed: fixedContent })
        };
    } catch (error) {
        return {
            isValid: false,
            warnings: [{
                line: 0,
                column: 0,
                text: `Error: ${error.message}`,
                severity: 'error'
            }]
        };
    }
}

function formatResults(result) {
    if (result.isValid) {
        return "CSS properties are all valid!";
    }

    let output = "Found the following issues:\n\n";

    result.warnings.forEach((warning, index) => {
        output += `${index + 1}. Line ${warning.line}, Column ${warning.column}\n`;
        output += `   Rule: ${warning.rule}\n`;
        output += `   Severity: ${warning.severity}\n`;
        output += `   ${warning.text}\n\n`;
    });

    if (result.fixed) {
        output += "\nFixed content has been generated/saved.\n";
    }

    return output;
}

/**
 * 检查目录中的所有 SCSS 文件
 * @param {string} directory - 目录路径
 * @param {Object} options - 配置选项
 * @returns {Promise<Object>} 检查结果
 */
async function checkScssDirectory(directory, options = { fix: false, recursive: true }) {
    const results = {
        isValid: true,
        fileResults: []
    };

    try {
        const files = await fs.readdir(directory);

        for (const file of files) {
            const fullPath = `${directory}/${file}`;
            const stat = await fs.stat(fullPath);

            if (stat.isDirectory() && options.recursive) {
                const subResults = await checkScssDirectory(fullPath, options);
                if (!subResults.isValid) {
                    results.isValid = false;
                }
                results.fileResults.push(...subResults.fileResults);
            } else if (file.endsWith('.scss')) {
                const fileResult = await checkScssProperties(fullPath, options);
                if (!fileResult.isValid) {
                    results.isValid = false;
                }
                results.fileResults.push({
                    file: fullPath,
                    ...fileResult
                });
            }
        }
    } catch (error) {
        results.isValid = false;
        results.error = error.message;
    }

    return results;
}

module.exports = {
    checkScssProperties,
    checkScssDirectory,
    formatResults
};