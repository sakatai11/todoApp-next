'use client';

import { useState, useCallback } from 'react';
import { StatusListProps, ListPayload, ListResponse } from '@/types/lists';
import { apiRequest } from '@/features/libs/apis';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useError } from '@/features/todo/contexts/ErrorContext';
import { ERROR_MESSAGES } from '@/constants/errorMessages';

export const useLists = (initialLists: StatusListProps[]) => {
  //
  // ***** state ******
  //
  const { showError } = useError(); // グローバルエラー（APIエラー等）
  const [lists, setLists] = useState<StatusListProps[]>(initialLists);
  const [input, setInput] = useState<{ status: string }>({ status: '' });
  const [validationError, setValidationError] = useState<{
    addListNull: boolean;
    addListSame: boolean;
  }>({
    addListNull: false,
    addListSame: false,
  });

  //
  // ***** helpers ******
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
    // バリデーション: 空入力チェック（半角・全角スペースのみも含む）
    if (!input.status.trim()) {
      setValidationError((prevError) => ({
        ...prevError,
        addListNull: true,
        addListSame: false,
      }));
      return false;
    }

    // バリデーション: 重複チェック
    if (checkDuplicateCategory(input.status.trim())) {
      setValidationError((prevError) => ({
        ...prevError,
        addListNull: false,
        addListSame: true,
      }));
      return false;
    }

    // リストの数を再計算して連続番号を振り直す
    const updatedLists = lists.map((list, index) => ({
      ...list,
      number: index + 1,
    }));

    const newList = {
      category: input.status.trim(),
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
      setValidationError((prevError) => ({
        ...prevError,
        addListNull: false,
        addListSame: false,
      })); // バリデーションエラーをリセット
      return true; // 成功時に true を返す
    } catch (error) {
      console.error('Error adding list:', error);
      showError(ERROR_MESSAGES.LIST.ADD_FAILED);
      return false;
    }
  }, [input.status, lists, checkDuplicateCategory, showError]);

  // ドラック&ドロップでのリストとしてlistsを更新
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = lists.findIndex((list) => list.id === active.id);
        const newIndex = lists.findIndex((list) => list.id === over.id);

        // ロールバック用に現在のデータを保存
        const previousLists = lists;

        try {
          const updatedLists = arrayMove(lists, oldIndex, newIndex); // 配列を新しい順序に並べ替える

          const tempLists = updatedLists.map((list, index) => ({
            ...list,
            number: index + 1, // 新しいインデックスに基づいて番号を再設定
          }));

          // client（楽観的更新）
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
          // ロールバック
          setLists(previousLists);
          showError(ERROR_MESSAGES.LIST.SORT_FAILED);
        }
      }
    },
    [lists, showError],
  );

  // クリックでの移動のリストとしてlistsを更新
  const handleButtonMove = useCallback(
    async (id: string, direction: 'right' | 'left') => {
      if (!id) return lists;

      const currentIndex = lists.findIndex((list) => list.id === id);
      if (currentIndex === -1) return;

      // ロールバック用に現在のデータを保存
      const previousLists = lists;

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

        // client（楽観的更新）
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
        // ロールバック
        setLists(previousLists);
        showError(ERROR_MESSAGES.LIST.MOVE_FAILED);
      }
    },
    [lists, showError],
  );

  return {
    lists,
    input,
    validationError,
    setLists,
    addList,
    setInput,
    setValidationError,
    handleDragEnd,
    handleButtonMove,
  };
};
