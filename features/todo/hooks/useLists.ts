'use client';

import { useState, useCallback } from 'react';
import { StatusListProps } from '@/types/lists';
import { ListPayload } from '@/types/lists';
import { apiRequest } from '@/app/libs/apis';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

export const useLists = (initialLists: StatusListProps[]) => {
  const [lists, setLists] = useState<StatusListProps[]>(initialLists);
  const [input, setInput] = useState({ status: '' });
  const [error, setError] = useState({
    addListNull: false,
    addListSame: false,
  });

  // 重複するカテゴリが存在するかチェックする関数
  const checkDuplicateCategory = useCallback(
    (category: string) => {
      return lists.some((list) => list.category === category);
    },
    [lists],
  );

  // list追加
  const addList = useCallback(async () => {
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
  }, [input.status, lists, checkDuplicateCategory, error]);

  // ドラック&ドロップでのリストとしてlistsを更新
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = lists.findIndex((list) => list.id === active.id);
        const newIndex = lists.findIndex((list) => list.id === over.id);
        console.log(oldIndex + ':oldIndex');
        console.log(newIndex + ':newIndex');

        // client
        setLists((prevLists) => {
          const updatedLists = arrayMove(prevLists, oldIndex, newIndex); // 配列を新しい順序に並べ替える
          return updatedLists.map((list, index) => ({
            ...list,
            number: index + 1, // 新しいインデックスに基づいて番号を再設定
          }));
        });
      }
    },
    [lists],
  );

  // クリックでの移動のリストとしてlistsを更新
  const handleButtonMove = useCallback(
    (id: string, direction: 'right' | 'left') => {
      if (id) {
        const currentIndex = lists.findIndex((list) => list.id === id);
        console.log(lists);

        // client
        setLists((prevLists) => {
          // 移動先のインデックスを計算
          console.log(`test`);
          const newIndex =
            direction === 'right'
              ? Math.min(prevLists.length - 1, currentIndex + 1)
              : Math.max(0, currentIndex - 1);

          // インデックスが変わらない場合、元のリストを返す
          if (currentIndex === newIndex) return prevLists;

          // 配列を新しい順序に並べ替える
          const updatedLists = arrayMove(prevLists, currentIndex, newIndex);

          // インデックスに基づいて番号を再設定してリストを更新
          return updatedLists.map((list, index) => ({
            ...list,
            number: index + 1,
          }));
        });
      }
    },
    [lists],
  );

  return {
    lists,
    input,
    error,
    setLists,
    addList,
    setInput,
    setError,
    handleDragEnd,
    handleButtonMove,
  };
};
