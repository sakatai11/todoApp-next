// タイムスタンプの取得処理（共通関数）
export const getTime = (timestamp: unknown) => {
  if (typeof timestamp === 'number') return timestamp;

  // Firebase Timestampオブジェクトの処理
  if (timestamp && typeof timestamp === 'object') {
    const timestampObj = timestamp as {
      toMillis?: () => number;
      _seconds?: number;
      _nanoseconds?: number;
    };

    // toMillis()メソッドが存在する場合
    if (typeof timestampObj.toMillis === 'function') {
      return timestampObj.toMillis();
    }

    // Firebase Timestampの_secondsプロパティが存在する場合
    if (typeof timestampObj._seconds === 'number') {
      return (
        timestampObj._seconds * 1000 +
        (timestampObj._nanoseconds || 0) / 1000000
      );
    }
  }

  return parseInt(String(timestamp), 10) || 0;
};

// JST形式の日付をフォーマットする関数
export const jstFormattedDate = (timestamp: number) => {
  const date = new Date(timestamp); // タイムスタンプをDateオブジェクトに変換
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 月は0から始まるので+1
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
};
