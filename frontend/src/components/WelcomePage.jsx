
import React from 'react';
import { Link } from 'react-router-dom';

const WelcomePage = () => {
  return (
    <div className="vh-100 d-flex justify-content-center align-items-center text-center">
      
      <div>
        <h1 className="display-4 fw-bold">Bine ai venit!</h1>

        <p className="lead mt-3">
          Pentru a merge mai departe, te rugăm să te înregistrezi sau să te autentifici.
        </p>

        <div className="mt-4">
          
          
          <Link to="/register" className="btn btn-primary btn-lg mx-2">
            Înregistrare
          </Link>

          <Link to="/login" className="btn btn-secondary btn-lg mx-2">
            Autentificare
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;