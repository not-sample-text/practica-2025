import React, { useEffect, useRef } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import ActiveUsers from './ActiveUsers';

const Header = ({ onLogout, connectionStatus, username, users, onPrivateNavigation, onRoomNavigation, onPokerNavigation }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const dropdownElement = dropdownRef.current;
    if (dropdownElement && window.bootstrap) {
      const bsDropdown = new window.bootstrap.Dropdown(dropdownElement);
      return () => bsDropdown.dispose();
    }
  }, []);

  const getConnectionStatusClass = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-success';
      case 'disconnected': return 'text-danger';
      default: return 'text-muted';
    }
  };

  return (
    <div className="vh-100 d-flex flex-column">
      <header className="py-3 px-4 border-bottom d-flex justify-content-between align-items-center bg-white shadow-sm flex-shrink-0">
        <div>
          <h1 className="m-0 fs-4 fw-semibold text-dark">Chat Game</h1>
          <p className="m-0 mt-1 text-muted">
            Logat ca <strong className="fw-bold">{username}</strong>
            <span className={`ms-3 fw-bold small ${getConnectionStatusClass()}`}>● {connectionStatus.toUpperCase()}</span>
          </p>
        </div>
        <div className="d-flex align-items-center">
          <div className="dropdown">
            <button ref={dropdownRef} className="btn btn-outline-primary rounded-pill px-3 me-3 dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              <i className="bi bi-people-fill me-1"></i>
              Utilizatori Online <span className="badge bg-primary text-white ms-2 rounded-circle">{users.length}</span>
            </button>
            <div className="dropdown-menu dropdown-menu-end shadow border-0" style={{minWidth: '280px'}}>
              <ActiveUsers users={users} />
            </div>
          </div>
          <button onClick={onLogout} className="btn btn-danger rounded-pill px-4">
            <i className="bi bi-box-arrow-right me-2"></i>
            Logout
          </button>
        </div>
      </header>

      <nav className="py-2 px-4 bg-light border-bottom flex-shrink-0">
        <ul className="nav nav-pills nav-fill">
          <li className="nav-item">
            <NavLink 
              to="/home/global" 
              className="nav-link d-flex align-items-center justify-content-center gap-2"
            >
              <i className="bi bi-globe fs-5"></i>
              <span className="fw-medium">Chat Global</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <button 
              onClick={onRoomNavigation}
              className="nav-link d-flex align-items-center justify-content-center gap-2 btn btn-link text-decoration-none border-0 w-100"
            >
              <i className="bi bi-door-open-fill fs-5"></i>
              <span className="fw-medium">Camere</span>
            </button>
          </li>
          <li className="nav-item">
            <button 
              onClick={onPrivateNavigation}
              className="nav-link d-flex align-items-center justify-content-center gap-2 btn btn-link text-decoration-none border-0 w-100"
            >
              <i className="bi bi-person-hearts fs-5"></i>
              <span className="fw-medium">Chat Privat</span>
            </button>
          </li>
          <li className="nav-item">
            <button 
              onClick={onPokerNavigation}
              className="nav-link d-flex align-items-center justify-content-center gap-2 btn btn-link text-decoration-none border-0 w-100"
            >
              <i className="bi bi-suit-spade-fill fs-5"></i>
              <span className="fw-medium">Poker</span>
            </button>
          </li>
        </ul>
      </nav>

      <main className="flex-grow-1 d-flex flex-column" style={{ overflowY: 'hidden' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Header;