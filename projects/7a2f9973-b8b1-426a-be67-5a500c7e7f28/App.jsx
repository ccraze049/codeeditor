import React, { useState, useEffect } from 'react';
import './styles/App.css';
import CarCard from './components/CarCard';
import SearchBar from './components/SearchBar';
import Footer from './components/Footer';

const carsData = [
    { id: 1, make: 'Toyota', model: 'Camry', year: 2020, price: 25000, image: 'https://via.placeholder.com/300x200', description: 'Reliable and fuel-efficient sedan.' },
    { id: 2, make: 'Honda', model: 'Civic', year: 2021, price: 23000, image: 'https://via.placeholder.com/300x200', description: 'Sporty and fun to drive.' },
    { id: 3, make: 'Ford', model: 'F-150', year: 2019, price: 35000, image: 'https://via.placeholder.com/300x200', description: 'Powerful and capable truck.' },
    { id: 4, make: 'Tesla', model: 'Model 3', year: 2022, price: 45000, image: 'https://via.placeholder.com/300x200', description: 'Electric and high-tech sedan.' },
    { id: 5, make: 'Chevrolet', model: 'Tahoe', year: 2020, price: 40000, image: 'https://via.placeholder.com/300x200', description: 'Spacious and comfortable SUV.' },
];

function App() {
    const [cars, setCars] = useState(carsData);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        document.title = "Car Selling Website";
    }, []);

    const handleSearch = (term) => {
        setSearchTerm(term);
        const filteredCars = carsData.filter(car =>
            car.make.toLowerCase().includes(term.toLowerCase()) ||
            car.model.toLowerCase().includes(term.toLowerCase())
        );
        setCars(filteredCars);
    };

    return (
        <div className="app">
            <header className="app-header">
                <h1>Find Your Dream Car</h1>
                <SearchBar onSearch={handleSearch} />
            </header>
            <main className="app-main">
                <div className="car-grid">
                    {cars.map(car => (
                        <CarCard key={car.id} car={car} />
                    ))}
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default App;