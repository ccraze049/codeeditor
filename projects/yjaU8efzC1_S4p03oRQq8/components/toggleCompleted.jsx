import React from 'react';
import '../styles/toggleCompleted.css';

const toggleCompleted = (id) => {
  setTodos(todos.map(todo => 
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  ));
}

export default toggleCompleted;