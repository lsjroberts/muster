import propTypes from 'prop-types';
import React from 'react';

export default function Footer({ clearCompleted, footerClasses, itemCount, remainingCount }) {
  return (
    <footer className="footer">
      <span className="todo-count">
        <strong>{getRemainingItemsText(remainingCount)}</strong>
      </span>
      <ul className="filters">
        <li>
          <a className={footerClasses.allClass} href="#/">
            All
          </a>
        </li>
        <li>
          <a className={footerClasses.activeClass} href="#/active">
            Active
          </a>
        </li>
        <li>
          <a className={footerClasses.completedClass} href="#/completed">
            Completed
          </a>
        </li>
      </ul>
      {itemCount === remainingCount ? null : ( // Only display clear completed if completed exists
        <button type="button" className="clear-completed" onClick={clearCompleted}>
          Clear completed
        </button>
      )}
    </footer>
  );
}

Footer.propTypes = {
  clearCompleted: propTypes.func.isRequired,
  footerClasses: propTypes.shape({
    activeClass: propTypes.string.isRequired,
    allClass: propTypes.string.isRequired,
    completedClass: propTypes.string.isRequired,
  }).isRequired,
  itemCount: propTypes.number.isRequired,
  remainingCount: propTypes.number.isRequired,
};

function getRemainingItemsText(remainingCount) {
  return `${remainingCount} ${remainingCount === 1 ? 'item' : 'items'} left`;
}
