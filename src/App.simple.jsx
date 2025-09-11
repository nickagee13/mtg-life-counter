import React from 'react';

// Very simple version with minimal features for maximum compatibility
function SimpleApp() {
  const [players, setPlayers] = React.useState([
    { id: 1, name: 'Player 1', life: 40 },
    { id: 2, name: 'Player 2', life: 40 }
  ]);

  const changeLife = (playerId, amount) => {
    setPlayers(players.map(p => 
      p.id === playerId ? { ...p, life: Math.max(0, p.life + amount) } : p
    ));
  };

  return React.createElement('div', {
    style: {
      minHeight: '100vh',
      backgroundColor: '#2d3748',
      color: 'white',
      padding: '1rem',
      fontFamily: 'Arial, sans-serif'
    }
  }, [
    React.createElement('h1', {
      key: 'title',
      style: {
        textAlign: 'center',
        marginBottom: '2rem',
        fontSize: '2rem'
      }
    }, 'MTG Life Counter'),
    
    React.createElement('div', {
      key: 'players',
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }
    }, players.map(player => 
      React.createElement('div', {
        key: player.id,
        style: {
          backgroundColor: '#4a5568',
          borderRadius: '1rem',
          padding: '2rem',
          textAlign: 'center'
        }
      }, [
        React.createElement('div', {
          key: 'name',
          style: { fontSize: '1.5rem', marginBottom: '1rem' }
        }, player.name),
        
        React.createElement('div', {
          key: 'life',
          style: { fontSize: '4rem', fontWeight: 'bold', marginBottom: '1rem' }
        }, player.life),
        
        React.createElement('div', {
          key: 'buttons',
          style: { display: 'flex', gap: '1rem', justifyContent: 'center' }
        }, [
          React.createElement('button', {
            key: 'minus',
            onClick: () => changeLife(player.id, -1),
            style: {
              padding: '1rem 2rem',
              fontSize: '2rem',
              backgroundColor: '#e53e3e',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }
          }, '-1'),
          
          React.createElement('button', {
            key: 'plus',
            onClick: () => changeLife(player.id, 1),
            style: {
              padding: '1rem 2rem',
              fontSize: '2rem',
              backgroundColor: '#38a169',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }
          }, '+1')
        ])
      ])
    ))
  ]);
}

export default SimpleApp;