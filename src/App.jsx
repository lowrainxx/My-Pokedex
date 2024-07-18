import React, { useState } from 'react';
import './App.css';
import { getPokemon } from './services/pokeapi';

// é

function App() {
  const [pokemonName, setPokemonName] = useState('');
  const [pokemon, setPokemon] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    const data = await getPokemon(pokemonName.toLowerCase());
    if (data) {
      setPokemon(data);
      setError('');
    } else {
      setPokemon(null);
      setError(`Pokémon "${pokemonName}" does not exist!`);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Pokedex</h1>
        <input 
          type="text" 
          value={pokemonName} 
          onChange={(e) => setPokemonName(e.target.value)} 
          onKeyDown={handleKeyPress}
          placeholder="Enter Pokémon name" 
        />
        <button onClick={handleSearch}>Search</button>
        {error && <p style={{color: 'red'}}>{error}</p>}
        {pokemon && (
          <div>
            <h2>{pokemon.name}</h2>
            <img src={pokemon.sprites.front_default} alt={pokemon.name} />
            <p>Height: {pokemon.height}</p>
            <p>Weight: {pokemon.weight}</p>
            <p>Type: {pokemon.types.map(typeInfo => typeInfo.type.name).join(', ')}</p>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;