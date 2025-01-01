'use client';

import { useState } from 'react';
import { StatusListProps } from '@/types/lists';
import { ListPayload } from '@/types/lists';
import { apiRequest } from '@/app/libs/apis';

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

      try {
        // server side
        const result = await apiRequest<ListPayload<'POST'>>(
          '/api/lists',
          'POST',
          newList,
        );
        console.log(result);

        // 再計算されたリストと新しいリストを追加してセットする
        setLists([...updatedLists, { ...(result as StatusListProps) }]);
        setInput({ status: '' }); //ステータスリセット
        setError({ addListArea: false }); // エラーをリセット
      } catch (error) {
        console.error('Error adding todo:', error);
        setError({ addListArea: true }); // エラー表示
      }
    } else {
      setError({ addListArea: true }); // エラー表示
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
