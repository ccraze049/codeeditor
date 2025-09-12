import React from 'react';

function Testimonials() {
  return (
    <section className="testimonials">
      <h2>What Our Customers Say</h2>
      <div className="testimonial-grid">
        <div className="testimonial">
          <p>"This product has changed my life! I can't imagine going back."</p>
          <cite>- John Doe</cite>
        </div>
        <div className="testimonial">
          <p>"Easy to use and incredibly effective. Highly recommend!"</p>
          <cite>- Jane Smith</cite>
        </div>
      </div>
    </section>
  );
}

export default Testimonials;