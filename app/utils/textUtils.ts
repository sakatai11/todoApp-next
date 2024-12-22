type FormatterResult = {
	type: "link" | "linefeed" | "normal";
	content: string;
	index: string;
};

export const formatter = (text: string): FormatterResult[] => {
	const urlPattern = /(https?:\/\/[^\s]+)/g;
	const newlinePattern = /\n/g;
	const result: FormatterResult[] = [];

	text.split(urlPattern).forEach((part, index) => {
		if (part.match(urlPattern)) {
			result.push({ type: "link", content: part, index: `link-${index}` });
		} else {
			// 改行とそれ以外の文字列を分ける
			part.split(newlinePattern).forEach((subPart, subIndex, array) => {
				// 通常のテキスト
				if (subPart !== "") {
					result.push({
						type: "normal",
						content: subPart,
						index: `normal-${index}-${subIndex}`,
					});
				}

				// 改行が存在する場合、次の要素があるか確認して追加
				if (subIndex < array.length - 1) {
					result.push({
						type: "linefeed",
						content: "\n",
						index: `space-${index}-${subIndex}`,
					});
				}
			});
		}
	});

	return result;
};
