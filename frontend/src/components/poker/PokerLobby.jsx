import React, { useState, useEffect } from 'react';
const GameCard = ({ game, onJoin }) => {
    return (
        <div className="card h-100 shadow-sm">
            <div className="card-body d-flex flex-column">
                <h5 className="card-title d-flex justify-content-between">
                    <span>{game.gameId}</span>
                    {game.hasPassword && <span className="badge bg-secondary"><i className="bi bi-lock-fill"></i></span>}
                </h5>
                <p className="card-text text-muted">
                    Jucători: {game.players.length} / {game.maxPlayers}
                </p>
                <p className="card-text text-muted">
                    Status: {game.inProgress ? 'În progres' : 'Așteptând jucători'}
                </p>
                <button 
                    className="btn btn-primary mt-auto" 
                    onClick={() => onJoin(game.gameId, game.hasPassword)}
                    disabled={game.players.length >= game.maxPlayers}
                >
                    {game.players.length >= game.maxPlayers ? 'Masă Plină' : 'Intră la Masă'}
                </button>
            </div>
        </div>
    );
};

const CreateGameModal = ({ show, onClose, onCreate }) => {
    const [gameId, setGameId] = useState('');
    const [password, setPassword] = useState('');
    const [smallBlind, setSmallBlind] = useState(10);
    const [bigBlind, setBigBlind] = useState(20);
    const [maxPlayers, setMaxPlayers] = useState(9);
    const [stack, setStack] = useState(1000);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!gameId.trim()) {
            alert('Te rog introdu un nume pentru masă');
            return;
        }
        onCreate(gameId.trim(), password || null, smallBlind, bigBlind, maxPlayers, stack);
        onClose();
        setGameId('');
        setPassword('');
        setSmallBlind(10);
        setBigBlind(20);
        setMaxPlayers(9);
        setStack(1000);
    };

    if (!show) return null;

    return (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <form onSubmit={handleSubmit}>
                        <div className="modal-header">
                            <h5 className="modal-title">Creează o Masă Nouă</h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label">Nume Masă *</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    value={gameId}
                                    onChange={(e) => setGameId(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Parolă (opțional)</label>
                                <input 
                                    type="password" 
                                    className="form-control" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Small Blind</label>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        value={smallBlind}
                                        onChange={(e) => setSmallBlind(parseInt(e.target.value))}
                                        min="1"
                                    />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Big Blind</label>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        value={bigBlind}
                                        onChange={(e) => setBigBlind(parseInt(e.target.value))}
                                        min="2"
                                    />
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Max Jucători</label>
                                <select 
                                    className="form-select" 
                                    value={maxPlayers}
                                    onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                                >
                                    {[2,3,4,5,6,7,8,9].map(n => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Fise de Start</label>
                                <input 
                                    type="number" 
                                    className="form-control" 
                                    value={stack}
                                    onChange={(e) => setStack(parseInt(e.target.value))}
                                    min="100"
                                    max="10000"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Anulează</button>
                            <button type="submit" className="btn btn-primary">Creează Masa</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const JoinGameModal = ({ show, gameId, onClose, onJoin }) => {
    const [password, setPassword] = useState('');
    const [stack, setStack] = useState(1000);

    const handleSubmit = (e) => {
        e.preventDefault();
        onJoin(gameId, password, stack);
        onClose();
        setPassword('');
        setStack(1000);
    };

    if (!show) return null;

    return (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <form onSubmit={handleSubmit}>
                        <div className="modal-header">
                            <h5 className="modal-title">Intră la Masa: {gameId}</h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label">Parolă</label>
                                <input 
                                    type="password" 
                                    className="form-control" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Fise de Start</label>
                                <input 
                                    type="number" 
                                    className="form-control" 
                                    value={stack}
                                    onChange={(e) => setStack(parseInt(e.target.value))}
                                    min="100"
                                    max="10000"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Anulează</button>
                            <button type="submit" className="btn btn-primary">Intră la Masă</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};


const PokerLobby = ({ availableGames, onCreateGame, onJoinGame, onRefresh }) => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [selectedGame, setSelectedGame] = useState(null);

    useEffect(() => {
        if (onRefresh) {
            onRefresh();
        }
    }, [onRefresh]);

    const handleJoinClick = (gameId, hasPassword) => {
        if (hasPassword) {
            setSelectedGame(gameId);
            setShowJoinModal(true);
        } else {
            onJoinGame(gameId, null, 1000);
        }
    };

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="display-6">Lobby Poker</h1>
                <div>
                    <button className="btn btn-outline-primary me-2" onClick={onRefresh}>
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Reîmprospătează
                    </button>
                    <button className="btn btn-success" onClick={() => setShowCreateModal(true)}>
                        <i className="bi bi-plus-circle me-2"></i>
                        Creează o Masă Nouă
                    </button>
                </div>
            </div>

            <hr />

            {availableGames.length > 0 ? (
                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">
                    {availableGames.map(game => (
                        <div className="col" key={game.gameId}>
                            <GameCard game={game} onJoin={handleJoinClick} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-muted mt-5">
                    <p className="fs-4">Nu există nicio masă de joc activă.</p>
                    <p>Fii primul care creează una!</p>
                </div>
            )}

            <CreateGameModal 
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreate={onCreateGame}
            />

            <JoinGameModal 
                show={showJoinModal}
                gameId={selectedGame}
                onClose={() => setShowJoinModal(false)}
                onJoin={onJoinGame}
            />
        </div>
    );
};

export default PokerLobby;