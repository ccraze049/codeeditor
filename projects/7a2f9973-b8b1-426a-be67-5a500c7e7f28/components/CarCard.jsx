import React from 'react';
import '../styles/CarCard.css';

function CarCard({ car }) {
    return (
        <div className="car-card">
            <img src={car.image} alt={`${car.make} ${car.model}`} className="car-image" />
            <div className="car-details">
                <h2 className="car-title">{car.make} {car.model}</h2>
                <p className="car-year">Year: {car.year}</p>
                <p className="car-price">Price: ${car.price}</p>
                <p className="car-description">{car.description}</p>
                <button className="car-button">View Details</button>
            </div>
        </div>
    );
}

export default CarCard;