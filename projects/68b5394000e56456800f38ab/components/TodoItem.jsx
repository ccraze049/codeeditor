import React from 'react';
import '../styles/TodoItem.css';

function TodoItem({ todo, toggleComplete, deleteTodo }) {
  return (
    <li className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        id={`todo-${todo.id}`}
        checked={todo.completed}
        onChange={() => toggleComplete(todo.id)}
      />
      <label htmlFor={`todo-${todo.id}`} className="todo-text">
        {todo.text}
      </label>
      <button className="delete-button" onClick={() => deleteTodo(todo.id)}>
        Delete
      </button>
    </li>
  );
}

export default TodoItem;