import React from "react";
import { Link } from "react-router-dom";

const Starter = () => {
    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h1>Joc Extrem</h1>
            <p>Please log in to continue.</p>
            <div>
                <Link to="/login" style={{ textDecoration: "none" }}>
                    <button>Log In</button>
                </Link>
            </div>
            <p>Or register if you don't have an account.</p>
            <div>
                <Link to="/register" style={{ textDecoration: "none" }}>
                    <button>Register</button>
                </Link>
            </div>
        </div>
    );
}

export default Starter;