import React from 'react';
import '../styles/TodoList.css';

function TodoList({ todos, toggleCompleted }) {
  return (
    <ul className="todo-list">
      {todos.map(todo => (
        <TodoItem key={todo.id} todo={todo} toggleCompleted={toggleCompleted} />
      ))}
    </ul>
  );
}

export default TodoList;