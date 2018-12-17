/* eslint-disable jsx-a11y/no-autofocus, jsx-a11y/label-has-for */
import classNames from 'classnames';
import propTypes from 'prop-types';
import React from 'react';

const ENTER_KEY = 13;
const ESC_KEY = 27;

export default function List({ itemList, remove }) {
  return (
    <ul className="todo-list">
      {itemList.map(
        ({ label, completed, editing, id, temp, setCompleted, setLabel, setEditing, setTemp }) => (
          <li key={id} className={classNames({ completed }, { editing })}>
            <div className="view">
              <input
                className="toggle"
                type="checkbox"
                onChange={() => setCompleted(!completed)}
                checked={completed}
              />
              <label
                onDoubleClick={() => {
                  setTemp(label);
                  setEditing(true);
                }}
              >
                {' '}
                {label}{' '}
              </label>
              <button type="button" className="destroy" onClick={() => remove(id)} />
            </div>
            {editing && (
              <input
                className="edit" // re-renders component when editing==true
                type="text"
                autoFocus
                onBlur={() => setEditing(false)}
                value={label}
                onChange={(e) => setLabel(e.currentTarget.value)}
                onKeyDown={(e) => {
                  switch (e.keyCode) {
                    case ENTER_KEY:
                      setEditing(false);
                      break;
                    case ESC_KEY:
                      setLabel(temp);
                      setEditing(false);
                      break;
                    default:
                  }
                }}
              />
            )}
          </li>
        ),
      )}
    </ul>
  );
}

List.propTypes = {
  itemList: propTypes.arrayOf(
    propTypes.shape({
      label: propTypes.string.isRequired,
      completed: propTypes.bool.isRequired,
      editing: propTypes.bool.isRequired,
      id: propTypes.number.isRequired,
      temp: propTypes.string.isRequired,
      setCompleted: propTypes.func.isRequired,
      setLabel: propTypes.func.isRequired,
      setEditing: propTypes.func.isRequired,
      setTemp: propTypes.func.isRequired,
    }),
  ).isRequired,
  remove: propTypes.func.isRequired,
};
