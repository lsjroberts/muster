import propTypes from 'prop-types';
import React from 'react';
import Header from '../header';
import List from '../list';
import Footer from '../footer';

export default function App({ itemCount, remainingCount, toggleAll }) {
  return (
    <section className="todoapp">
      <Header />
      {itemCount === 0 ? null : (
        <section className="main">
          <input
            id="toggle-all"
            className="toggle-all"
            type="checkbox"
            readOnly
            onClick={toggleAll}
            checked={remainingCount === 0}
          />
          <label htmlFor="toggle-all">Mark all as complete</label> <List />
        </section>
      ) /* Hide toggle-all button when list empty */}
      {itemCount === 0 ? null : <Footer /> /* Hide footer when list empty */}
    </section>
  );
}

App.propTypes = {
  itemCount: propTypes.number.isRequired,
  remainingCount: propTypes.number.isRequired,
  toggleAll: propTypes.func.isRequired,
};
