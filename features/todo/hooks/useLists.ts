'use client';

import { useState } from 'react';
import { StatusListProps } from '@/types/lists';
import { db } from '@/app/libs/firebase';
import { collection, addDoc } from 'firebase/firestore';

export const useLists = (initialLists: StatusListProps[]) => {
  const [lists, setLists] = useState<StatusListProps[]>(initialLists);
  const [input, setInput] = useState({ status: '' });
  const [error, setError] = useState({
    addListArea: false,
  });

  // list追加
  const addList = async () => {
    if (input.status) {
      // リストの数を再計算して連続番号を振り直す
      const updatedLists = lists.map((list, index) => ({
        ...list,
        number: index + 1,
      }));

      const newList = {
        category: input.status,
        number: updatedLists.length + 1,
      };
      console.log(newList.number);
      const docRef = await addDoc(collection(db, 'lists'), newList);

      // 再計算されたリストと新しいリストを追加してセットする
      setLists([...updatedLists, { id: docRef.id, ...newList }]);
      setInput({ ...input, status: '' }); //ステータスリセット
      setError({ ...error, addListArea: false }); // エラーをリセット
    } else {
      setError({ ...error, addListArea: true }); // エラー表示
      return;
    }
  };

  return {
    lists,
    input,
    error,
    setLists,
    addList,
    setInput,
    setError,
  };
};
