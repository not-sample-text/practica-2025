import React, { useState, useEffect } from 'react';

const Card = ({ card }) => {
    if (!card) {
        return (
            <div className="card text-white bg-danger" style={{ width: '80px', height: '110px', borderWidth: '3px' }}>
                <div className="card-body d-flex align-items-center justify-content-center">
                    <i className="bi bi-suit-spade-fill fs-2"></i>
                </div>
            </div>
        );
    }
    
    const suitSymbols = { h: '♥', d: '♦', c: '♣', s: '♠' };
    const suit = card.suit;
    const rank = card.rank;
    const colorClass = (suit === 'h' || suit === 'd') ? 'text-danger' : 'text-dark';

    return (
        <div className="card" style={{ width: '80px', height: '110px' }}>
            <div className={`card-body d-flex flex-column justify-content-between p-1 ${colorClass} fw-bold`}>
                <span className="fs-6 lh-1">{rank}</span>
                <span className="fs-2 lh-1 align-self-center">{suitSymbols[suit]}</span>
                <span className="fs-6 lh-1" style={{ transform: 'rotate(180deg)' }}>{rank}</span>
            </div>
        </div>
    );
};

const ShowdownDisplay = ({ players, onNewHand, isCreator }) => {
    const winners = players.filter(p => p.isWinner);
    const winnerNames = winners.map(p => p.username).join(', ');

    return (
        <div className="position-absolute top-50 start-50 translate-middle bg-dark bg-opacity-75 p-4 rounded text-white text-center shadow-lg" style={{zIndex: 100}}>
            <h2 className="text-warning">Showdown!</h2>
            <h4 className="mb-3">
                Câștigător: <span className="text-success">{winnerNames}</span>
            </h4>
            
            <div className="d-flex flex-column gap-3 mb-4" style={{maxHeight: '40vh', overflowY: 'auto'}}>
                {players.filter(p => p.status !== 'folded' && p.hand).map(player => (
                    <div key={player.username}>
                        <strong>{player.username}</strong>
                        {player.isWinner && <span className="badge bg-success ms-2">WIN</span>}
                        <div className="d-flex justify-content-center align-items-center gap-1 mt-1">
                            {player.hand.map((c, i) => <Card key={i} card={c} />)}
                            <span className="ms-2 fst-italic">({player.evaluatedHand?.name})</span>
                        </div>
                    </div>
                ))}
            </div>

            {isCreator && (
                <button className="btn btn-lg btn-primary" onClick={onNewHand}>
                    Începe Mâna Următoare
                </button>
            )}
            {!isCreator && (
                <p className="text-muted fst-italic">Așteaptă ca gazda să înceapă mâna următoare...</p>
            )}
        </div>
    );
};


const PokerTable = ({ pokerState, myHand, username, onPokerAction, onStartGame, onNewHand, onLeaveGame }) => {
    
 
    if (!pokerState) {
        return <div className="d-flex align-items-center justify-content-center h-100">Se încarcă masa...</div>;
    }

   
    if (!pokerState.inProgress) {
        const isCreator = username === pokerState.creatorUsername;
        const players = pokerState.players || []; 

        return (
            <div className="container-fluid d-flex flex-column align-items-center justify-content-center h-100 text-center p-4 bg-light">
                <h1 className="display-5">Masa: <span className="text-primary">{pokerState.gameId}</span></h1>
                <p className="lead">Așteptând jucători... ({players.length} / {pokerState.maxPlayers})</p>
                <div className="col-12 col-md-8 col-lg-6 my-4">
                    <ul className="list-group">
                        {players.map(p => 
                            <li key={p.username} className="list-group-item d-flex justify-content-between align-items-center fs-5">
                                <span>
                                    <i className="bi bi-person-fill me-2"></i>
                                    {p.username} {p.username === username && <span className="badge bg-secondary ms-2">Tu</span>}
                                </span>
                                <span className="badge bg-success rounded-pill">Fise: {p.stack}</span>
                            </li>
                        )}
                    </ul>
                </div>
                {players.length >= pokerState.minPlayers ? (
                     isCreator ? (
                        <button className="btn btn-primary btn-lg" onClick={onStartGame}>
                            <i className="bi bi-play-circle-fill me-2"></i>
                            Începe Jocul
                        </button>
                    ) : (
                        <p className="text-muted fs-5">Așteptând ca {pokerState.creatorUsername} să înceapă jocul...</p>
                    )
                ) : (
                    <p className="text-muted fs-5">Mai este nevoie de {pokerState.minPlayers - players.length} jucător(i).</p>
                )}
                 <div className="mt-4">
                    <button className="btn btn-sm btn-outline-danger" onClick={onLeaveGame}>
                        <i className="bi bi-door-open me-2"></i>
                        Părăsește Masa
                    </button>
                </div>
            </div>
        );
    }
    
  
    const { 
        board = [], 
        pot = 0, 
        players = [], 
        currentPlayerToken = null, 
        round = '',
        options = {}
    } = pokerState;
    
    const [betAmount, setBetAmount] = useState(options.bigBlind * 2 || 20);
    
    const me = players.find(p => p.username === username);
    const isMyTurn = me && me.token === currentPlayerToken;
    const isCreator = username === pokerState.creatorUsername;
    const highestBet = Math.max(0, ...players.map(p => p.currentBet));
    const callAmount = highestBet - (me?.currentBet || 0);

    useEffect(() => {
        const minRaise = highestBet + (options.bigBlind || 20);
        if (betAmount < minRaise) {
            setBetAmount(minRaise);
        }
    }, [highestBet, options.bigBlind]);


    return (
        <div className="d-flex flex-column h-100" style={{ backgroundColor: '#006400', color: 'white' }}>
            
            <div className="flex-grow-1 d-flex align-items-center justify-content-center position-relative p-3">
                
                <div className="text-center">
                    <h2 className="mb-3">
                        Pot: <span className="badge bg-warning text-dark fs-3">{pot}</span>
                    </h2>
                    <div className="d-flex justify-content-center gap-2">
                        {board.map((card, index) => <Card key={index} card={card} />)}
                        {Array(5 - board.length).fill(null).map((_, index) => <Card key={`back-${index}`} card={null} />)}
                    </div>
                </div>

                <div className="position-absolute top-0 start-0 p-3" style={{zIndex: 1}}>
                    <h6>Jucători:</h6>
                    <ul className="list-unstyled">
                    {players.map(player => (
                        <li key={player.username} className={`p-2 rounded mb-1 ${
                            player.token === currentPlayerToken ? 'bg-warning text-dark' : 
                            player.status === 'folded' ? 'bg-secondary bg-opacity-50 text-muted' :
                            player.status === 'all-in' ? 'bg-info text-white' :
                            'bg-dark bg-opacity-75'
                        }`}>
                           <strong>{player.username}</strong>
                           {player.status === 'folded' && <span className="ms-2 badge bg-danger">Fold</span>}
                           {player.status === 'all-in' && <span className="ms-2 badge bg-primary">All-in</span>}
                           <br/>
                           Fise: {player.stack}<br/>
                           {player.currentBet > 0 && `Pariu: ${player.currentBet}`}
                        </li>
                    ))}
                    </ul>
                </div>

                <div className="position-absolute bottom-0 mb-5 d-flex gap-3">
                    {myHand && myHand.length > 0 && (
                        <>
                            <Card card={myHand[0]} />
                            <Card card={myHand[1]} />
                        </>
                    )}
                </div>

                {round === 'showdown' && (
                    <ShowdownDisplay 
                        players={players} 
                        onNewHand={onNewHand} 
                        isCreator={isCreator} 
                    />
                )}
            </div>

            <footer className="py-3 px-4 bg-dark flex-shrink-0">
                {isMyTurn && round !== 'showdown' ? (
                    <div className="d-flex justify-content-center align-items-center gap-2 flex-wrap">
                        <button className="btn btn-lg btn-danger" onClick={() => onPokerAction('fold')}>Fold</button>
                        
                        {callAmount > 0 ? (
                            <button className="btn btn-lg btn-primary" onClick={() => onPokerAction('call')}>
                                Call {callAmount}
                            </button>
                        ) : (
                             <button className="btn btn-lg btn-secondary" onClick={() => onPokerAction('check')}>Check</button>
                        )}

                        <div className="input-group" style={{width: '250px'}}>
                            <input 
                                type="number" 
                                className="form-control form-control-lg"
                                value={betAmount}
                                onChange={(e) => setBetAmount(parseInt(e.target.value, 10))}
                                min={highestBet + (options.bigBlind || 0)}
                                step={options.bigBlind || 10}
                            />
                            <button 
                                className="btn btn-lg btn-warning text-dark" 
                                onClick={() => onPokerAction('raise', betAmount)}
                            >
                                Raise
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-muted">
                        {round === 'showdown' ? 'Mâna s-a terminat.' : 
                         me?.status === 'folded' ? 'Ai foldat.' :
                         'Așteaptă rândul tău...'}
                    </div>
                )}
            </footer>

            <div className="text-center p-2" style={{ backgroundColor: 'rgba(0,0,0,0.2)'}}>
                 <button className="btn btn-sm btn-outline-light" onClick={onLeaveGame}>
                     <i className="bi bi-door-open me-2"></i>
                     Părăsește Masa (Înapoi la Lobby)
                 </button>
            </div>
        </div>
    );
};

export default PokerTable;