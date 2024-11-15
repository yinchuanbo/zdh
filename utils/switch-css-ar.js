const postcss = require('postcss');
const postcssSCSS = require('postcss-scss');

class RTLConverter {
	constructor() {
		this.cssDirectionProperties = new Map([
			['left', 'right'],
			['right', 'left'],
			['margin-left', 'margin-right'],
			['margin-right', 'margin-left'],
			['padding-left', 'padding-right'],
			['padding-right', 'padding-left'],
			['border-left', 'border-right'],
			['border-right', 'border-left'],
			['text-align', value => (value === 'left' ? 'right' : value === 'right' ? 'left' : value)],
			['border-radius', this.convertBorderRadius.bind(this)],
			['border-top-left-radius', 'border-top-right-radius'],
			['border-top-right-radius', 'border-top-left-radius'],
			['border-bottom-left-radius', 'border-bottom-right-radius'],
			['border-bottom-right-radius', 'border-bottom-left-radius'],
		]);

		this.transformFunctions = new Map([
			['translate', this.convertTranslate.bind(this)],
			['translate3d', this.convertTranslate3d.bind(this)],
			['translateX', this.convertTranslateX.bind(this)],
			['rotate', this.convertRotate.bind(this)],
			['skew', this.convertSkew.bind(this)],
			['matrix', this.convertMatrix.bind(this)],
		]);
	}

	convertTextAlign(value) {
		if (value === 'left') return 'right';
		if (value === 'right') return 'left';
		return value;
	}

	convertFloat(value) {
		if (value === 'left') return 'right';
		if (value === 'right') return 'left';
		return value;
	}

	convertTransform(value) {
		return value
			.split(/\)\s+/) // Split transform functions
			.map(transform => {
				const match = transform.match(/^(\w+)\((.*?)\)?$/);
				if (!match) return transform;

				const [, funcName, params] = match;
				const converter = this.transformFunctions.get(funcName);

				if (converter) {
					return `${funcName}(${converter(params)})`; // Apply specific conversion
				}

				return transform; // Keep unchanged if no converter found
			})
			.join(' )') // Rebuild transform string
			.trim();
	}


	convertTranslate(params) {
		const values = params.split(/,\s*/).map(v => v.trim());
		if (values.length >= 1) {
			values[0] = this.invertNumber(values[0]);
		}
		return values.join(', ');
	}

	convertTranslate3d(params) {
		const values = params.split(/,\s*/).map(v => v.trim());
		if (values.length >= 1) {
			values[0] = this.invertNumber(values[0]);
		}
		return values.join(', ');
	}

	convertTranslateX(params) {
		const match = params.match(/^(-?\d*\.?\d+)(\D*)$/); // Match numeric and unit parts
		if (match) {
			const [, value, unit = ''] = match;
			return `${-parseFloat(value)}${unit}`; // Invert only the X value
		}
		return params;
	}

	convertRotate(params) {
		const match = params.match(/^(-?\d*\.?\d+)(deg|rad|grad|turn)?$/);
		if (match) {
			const [, value, unit = ''] = match;
			return `${-parseFloat(value)}${unit}`;
		}
		return params;
	}

	convertSkew(params) {
		const values = params.split(/,\s*/).map(v => v.trim());
		if (values.length >= 1) {
			values[0] = this.invertAngle(values[0]);
		}
		return values.join(', ');
	}

	convertMatrix(params) {
		const values = params.split(/,\s*/).map(v => v.trim());
		if (values.length === 6) {
			values[0] = -parseFloat(values[0]);
			values[2] = -parseFloat(values[2]);
			values[4] = -parseFloat(values[4]);
		}
		return values.join(', ');
	}

	convertBorderRadius(value) {
		// 处理单个值的情况
		if (!value.includes(' ')) {
			return value;
		}

		// 分割四个角的值
		const values = value.split(' ').map(v => v.trim());

		switch (values.length) {
			case 2:
				// 10px 5px -> 5px 10px
				return `${values[1]} ${values[0]}`;
			case 3:
				// 10px 5px 8px -> 5px 10px 5px 8px
				return `${values[1]} ${values[0]} ${values[1]} ${values[2]}`;
			case 4:
				// 10px 5px 8px 15px -> 5px 10px 15px 8px
				return `${values[1]} ${values[0]} ${values[3]} ${values[2]}`;
			default:
				return value;
		}
	}

	invertNumber(value) {
		const match = value.match(/^(-?\d*\.?\d+)(\D*)$/);
		if (match) {
			const [, num, unit = ''] = match;
			return `${-parseFloat(num)}${unit}`;
		}
		return value;
	}

	invertAngle(value) {
		const match = value.match(/^(-?\d*\.?\d+)(deg|rad|grad|turn)?$/);
		if (match) {
			const [, num, unit = ''] = match;
			return `${-parseFloat(num)}${unit}`;
		}
		return value;
	}

	async convertStyles(content, syntax = 'scss') {
		const plugin = postcss.plugin('rtl-converter', () => {
			return (root) => {
				root.walkDecls(decl => {
					// 处理 transform
					if (decl.prop === 'transform') {
						decl.value = this.convertTransform(decl.value);
						return;
					}

					// 处理方向相关属性
					if (this.cssDirectionProperties.has(decl.prop)) {
						const converter = this.cssDirectionProperties.get(decl.prop);
						if (typeof converter === 'function') {
							decl.value = converter(decl.value);
						} else {
							const oldProp = decl.prop;
							decl.prop = converter;
							if (oldProp === 'border-radius') {
								decl.value = this.convertBorderRadius(decl.value);
							}
						}
					}

					// 处理包含 left/right 的值
					if (decl.value.includes('left') || decl.value.includes('right')) {
						decl.value = this.convertCSSValue(decl.value);
					}
				});
			};
		});

		const options = {
			from: undefined,
			syntax: syntax === 'scss' ? postcssSCSS : null
		};

		const result = await postcss([plugin]).process(content, options);
		return result.css;
	}

	convertCSSValue(value) {
		return value
			.replace(/left/g, '_TMP_RIGHT_')
			.replace(/right/g, 'left')
			.replace(/_TMP_RIGHT_/g, 'right');
	}
}

module.exports = RTLConverter;