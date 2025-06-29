'use client';

import { useState, useCallback } from 'react';
import { StatusListProps, ListPayload, ListResponse } from '@/types/lists';
import { apiRequest } from '@/features/libs/apis';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

export const useLists = (initialLists: StatusListProps[]) => {
  //
  // ***** state ******
  //
  const [lists, setLists] = useState<StatusListProps[]>(initialLists);
  const [input, setInput] = useState<{ status: string }>({ status: '' });
  const [error, setError] = useState<{
    addListNull: boolean;
    addListSame: boolean;
  }>({
    addListNull: false,
    addListSame: false,
  });

  //
  // ***** getters ******
  //
  // 重複するカテゴリが存在するかチェックする関数
  const checkDuplicateCategory = useCallback(
    (category: string) => {
      return lists.some((list) => list.category === category);
    },
    [lists],
  );

  //
  // ***** actions ******
  //
  // list追加
  const addList = useCallback(async () => {
    if (input.status) {
      // 重複チェック
      if (checkDuplicateCategory(input.status)) {
        setError((prevError) => ({
          ...prevError,
          addListNull: false,
          addListSame: true,
        })); // エラー表示
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

      try {
        // server side
        const result = await apiRequest<
          ListPayload<'POST'>,
          ListResponse<'POST'>
        >('/api/lists', 'POST', newList);

        // client
        // 再計算されたリストと新しいリストを追加してセットする
        setLists([...updatedLists, { ...(result as StatusListProps) }]);
        setInput({ status: '' }); //ステータスリセット
        setError((prevError) => ({
          ...prevError,
          addListNull: false,
          addListSame: false,
        })); // エラーをリセット
        return true; // 成功時に true を返す
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
  }, [input.status, lists, checkDuplicateCategory]);

  // ドラック&ドロップでのリストとしてlistsを更新
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = lists.findIndex((list) => list.id === active.id);
        const newIndex = lists.findIndex((list) => list.id === over.id);

        try {
          const updatedLists = arrayMove(lists, oldIndex, newIndex); // 配列を新しい順序に並べ替える

          const tempLists = updatedLists.map((list, index) => ({
            ...list,
            number: index + 1, // 新しいインデックスに基づいて番号を再設定
          }));

          // client
          setLists(tempLists);

          // server side
          const updateListsNumber = tempLists.map((list) => list.id); // 新しい順序の全ID配列

          await apiRequest<ListPayload<'PUT'>, ListResponse<'PUT'>>(
            '/api/lists',
            'PUT',
            {
              type: 'reorder',
              data: updateListsNumber,
            },
          );
        } catch (error) {
          console.error('Error dragEnd list:', error);
        }
      }
    },
    [lists],
  );

  // クリックでの移動のリストとしてlistsを更新
  const handleButtonMove = useCallback(
    async (id: string, direction: 'right' | 'left') => {
      if (id) {
        const currentIndex = lists.findIndex((list) => list.id === id);

        try {
          // 移動先のインデックスを計算
          const newIndex =
            direction === 'right'
              ? Math.min(lists.length - 1, currentIndex + 1)
              : Math.max(0, currentIndex - 1);

          // インデックスが変わらない場合、元のリストを返す
          if (currentIndex === newIndex) return lists;

          // 配列を新しい順序に並べ替える
          const updatedLists = arrayMove(lists, currentIndex, newIndex);

          // インデックスに基づいて番号を再設定してリストを更新
          const tempLists = updatedLists.map((list, index) => ({
            ...list,
            number: index + 1,
          }));

          // client
          setLists(tempLists);

          // servers side
          const updateListsNumber = tempLists.map((list) => list.id); // 新しい順序の全ID配列

          await apiRequest<ListPayload<'PUT'>, ListResponse<'PUT'>>(
            '/api/lists',
            'PUT',
            {
              type: 'reorder',
              data: updateListsNumber,
            },
          );
        } catch (error) {
          console.error('Error ButtonMove list:', error);
        }
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
