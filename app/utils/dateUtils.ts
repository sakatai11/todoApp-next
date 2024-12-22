// JSTのタイムスタンプ
export const jstTime = () => {
	// 現在のUTC時間を取得
	const now = new Date();
	// 日本標準時に変換
	const jstinTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
	return jstinTime;
};

// JST形式の日付をフォーマットする関数
export const jstFormattedDate = (timestamp: number) => {
	const date = new Date(timestamp); // タイムスタンプをDateオブジェクトに変換
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0"); // 月は0から始まるので+1
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}年${month}月${day}日`;
};
