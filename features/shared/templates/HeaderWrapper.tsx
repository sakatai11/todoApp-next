'use client';

import React from 'react';

export const HeaderWrapper: React.FC = () => {
  return (
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Todo App</h1>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <button className="hover:underline">Dashboard</button>
            </li>
            <li>
              <button className="hover:underline">Settings</button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default HeaderWrapper;
