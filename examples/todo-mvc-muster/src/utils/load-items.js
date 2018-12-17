/* global localStorage */

// Function to load saved data
export default function loadItems() {
  const savedItems = localStorage.getItem('items'); // Get item list from localStorage
  return savedItems
    ? JSON.parse(savedItems) // If items exist to be parsed, parse them, else create entries
    : [
        {
          id: new Date().getTime(),
          label: 'Welcome to TodoMVC',
          completed: false,
        },
      ];
}
