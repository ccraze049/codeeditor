import React from 'react';
import '../styles/TodoItem.css';

function TodoItem({ todo, toggleCompleted }) {
  return (
    <li className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => toggleCompleted(todo.id)}
      />
      {todo.text}
    </li>
  );
}

export default TodoItem;