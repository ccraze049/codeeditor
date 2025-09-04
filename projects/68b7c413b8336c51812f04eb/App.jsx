import React, { useState, useEffect } from 'react';
import './styles/App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Get project ID from URL path
  const projectId = window.location.pathname.split('/')[2] || '68b7c413b8336c51812f04eb';

  // Load todos from API
  useEffect(() => {
    const loadTodos = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/data/todos`);
        if (response.ok) {
          const data = await response.json();
          setTodos(data.data || []);
        }
      } catch (error) {
        console.error('Failed to load todos:', error);
        // Fallback to empty array if API fails
        setTodos([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadTodos();
  }, [projectId]);

  // Save todos to API whenever todos change
  useEffect(() => {
    if (!loading && todos.length >= 0) {
      const saveTodos = async () => {
        try {
          await fetch(`/api/projects/${projectId}/data/todos`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: todos }),
          });
        } catch (error) {
          console.error('Failed to save todos:', error);
        }
      };
      
      saveTodos();
    }
  }, [todos, loading, projectId]);

  const handleInputChange = (e) => {
    setNewTodo(e.target.value);
  };

  const handleAddTodo = () => {
    if (newTodo.trim() !== '') {
      setTodos([...todos, { id: Date.now(), text: newTodo.trim(), completed: false }]);
      setNewTodo('');
    }
  };

  const handleToggleComplete = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const handleDeleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  if (loading) {
    return (
      <div className="app">
        <h1>Tudo</h1>
        <p>Loading todos...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <h1>Tudo</h1>
      <p style={{fontSize: '12px', color: '#666', marginBottom: '10px'}}>
        ✅ Data saved to MongoDB (no localStorage)
      </p>
      <div className="input-section">
        <input
          type="text"
          placeholder="Add a new todo"
          value={newTodo}
          onChange={handleInputChange}
          className="todo-input"
        />
        <button onClick={handleAddTodo} className="add-button">Add</button>
      </div>
      <ul className="todo-list">
        {todos.map(todo => (
          <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
            <input
              type="checkbox"
              id={`todo-${todo.id}`}
              checked={todo.completed}
              onChange={() => handleToggleComplete(todo.id)}
              className="todo-checkbox"
            />
            <label htmlFor={`todo-${todo.id}`} className="todo-text">
              {todo.text}
            </label>
            <button onClick={() => handleDeleteTodo(todo.id)} className="delete-button">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;