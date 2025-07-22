import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = ({ username }) => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center p-4 bg-light">
      <h1 className="display-4 fw-bold">Bun venit, {username}!</h1>
      <p className="lead mt-3 mb-4">
        Ce dorești să faci în continuare?
      </p>
      <div className="d-grid gap-3 d-sm-flex justify-content-sm-center">
        <Link to="/home/poker" className="btn btn-primary btn-lg px-4 gap-3 d-flex align-items-center">
          <i className="bi bi-suit-spade-fill fs-4"></i>
          Joacă Poker
        </Link>
        <Link to="/home/global" className="btn btn-outline-secondary btn-lg px-4 d-flex align-items-center">
          <i className="bi bi-chat-dots-fill fs-4"></i>
          Intră pe Chat
        </Link>
      </div>
    </div>
  );
};

export default HomePage;