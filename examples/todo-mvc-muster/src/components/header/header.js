/* eslint-disable jsx-a11y/no-autofocus */
import propTypes from 'prop-types';
import React from 'react';

const ENTER_KEY = 13;

export default function Header({ addItem }) {
  return (
    <header className="header">
      <h1>todos</h1>
      <input
        className="new-todo"
        type="text"
        autoFocus
        placeholder="What needs to be done?"
        onKeyDown={(e) => {
          if (e.keyCode !== ENTER_KEY) return;
          addItem(e.currentTarget.value);
          e.currentTarget.value = '';
        }}
      />
    </header>
  );
}

Header.propTypes = {
  addItem: propTypes.func.isRequired,
};
