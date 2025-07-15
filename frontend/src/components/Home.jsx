import React from 'react';
// import './App.css'; // Import Pico CSS
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
    const navigate = useNavigate();
  return (
//     <div className="container">
//       <div className="card">
//         <h1>Welcome to the Game!</h1>
//         <p>Please log in or sign up to start playing.</p>
//         <div className="button-group">
//           <button className="secondary">Play Game</button>
//           <button className="secondary">Login</button>
//           <button className="secondary">Sign Up</button>
//         </div>
//       </div>
//     </div>
//   );
// };
    
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <article className="card" style={{ width: '900px', height: '500px' , display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
        <header>
          <h1>Welcome to the Game!</h1>
        </header>
        <div className="body h5" >
          <p>Please log in or sign up to start playing.</p>
        </div>
        <footer style={{ display: 'flex', justifyContent:'space-between',  padding: '10px' }}>
            
          <button className="primary" style={{ marginLeft: '30px' }}>Play Game</button>
            
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="secondary" style={{ marginBottom: '5px' }} onClick={() => navigate('../login')}>Login</button>
            <button className="secondary" style={{ marginBottom: '5px' }}>Sign Up</button>
          </div>
        </footer>
      </article>
    </div>
  );
};

export default HomePage;
