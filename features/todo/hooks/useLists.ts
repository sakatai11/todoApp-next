'use client';

import { useState } from 'react';
import { StatusListProps } from '@/types/lists';
import { ListPayload } from '@/types/lists';
import { apiRequest } from '@/app/libs/apis';

export const useLists = (initialLists: StatusListProps[]) => {
  const [lists, setLists] = useState<StatusListProps[]>(initialLists);
  const [input, setInput] = useState({ status: '' });
  const [error, setError] = useState({
    addListNull: false,
    addListSame: false,
  });

  // 重複するカテゴリが存在するかチェックする関数
  const checkDuplicateCategory = (category: string) => {
    return lists.some((list) => list.category === category);
  };

  // list追加
  const addList = async () => {
    if (input.status) {
      // 重複チェック
      if (checkDuplicateCategory(input.status)) {
        setError({ ...error, addListNull: false, addListSame: true }); // エラー表示
        return false;
      }

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

        // client
        // 再計算されたリストと新しいリストを追加してセットする
        setLists([...updatedLists, { ...(result as StatusListProps) }]);
        setInput({ status: '' }); //ステータスリセット
        setError((prevError) => ({
          ...prevError,
          addListNull: false,
          addListSame: false,
        })); // エラーをリセット
        return true;
      } catch (error) {
        console.error('Error adding todo:', error);
        setError((prevError) => ({
          ...prevError,
          addListNull: true,
          addListSame: true,
        })); // エラー表示
        return false;
      }
    } else {
      setError((prevError) => ({
        ...prevError,
        addListNull: true,
        addListSame: false,
      })); // エラー表示
      return false;
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
