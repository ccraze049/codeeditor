import React, { useState, useEffect } from 'react';
import './styles/App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed'

  const [loading, setLoading] = useState(true);
  
  // Get project ID from URL path
  const projectId = window.location.pathname.split('/')[2] || '68b717a8c25685ccb9d3bc66';

  useEffect(() => {
    // Load todos from API
    const loadTodos = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/data/todos`);
        if (response.ok) {
          const data = await response.json();
          setTodos(data.data || []);
        }
      } catch (error) {
        console.error('Failed to load todos:', error);
        setTodos([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadTodos();
  }, [projectId]);

  useEffect(() => {
    // Save todos to API whenever todos change
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

  const addTodo = () => {
    if (newTodo.trim() !== '') {
      setTodos([...todos, { id: Date.now(), text: newTodo, completed: false }]);
      setNewTodo('');
    }
  };

  const toggleComplete = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const clearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed));
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true; // 'all'
  });

  if (loading) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>lljsdo</h1>
          <p>Loading todos...</p>
        </header>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>lljsdo</h1>
        <p style={{fontSize: '12px', color: '#666', margin: '5px 0'}}>
          ✅ Data saved to MongoDB (no localStorage)
        </p>
      </header>

      <div className="input-section">
        <input
          type="text"
          placeholder="What needs to be done?"
          value={newTodo}
          onChange={handleInputChange}
          onKeyDown={(e) => { if (e.key === 'Enter') addTodo(); }}
        />
        <button onClick={addTodo}>Add</button>
      </div>

      <ul className="todo-list">
        {filteredTodos.map(todo => (
          <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
            <input
              type="checkbox"
              id={`todo-${todo.id}`}
              checked={todo.completed}
              onChange={() => toggleComplete(todo.id)}
            />
            <label htmlFor={`todo-${todo.id}`}>{todo.text}</label>
            <button className="delete-button" onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>

      <div className="footer">
        <div className="filter-buttons">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
          <button className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>Active</button>
          <button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>Completed</button>
        </div>
        <button className="clear-completed" onClick={clearCompleted}>Clear Completed</button>
      </div>
    </div>
  );
}

export default App;