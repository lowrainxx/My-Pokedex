import React, { useState, useEffect } from 'react';
import './App.css';
import { getPokemon } from './services/pokeapi';
import pokedexLogo from './assets/pokedex-logo.png';
import pokemonList from './data/pokemonList';

function App() {
  const [pokemonName, setPokemonName] = useState('');
  const [pokemon, setPokemon] = useState(null);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  const handleSearch = async () => {
    const data = await getPokemon(pokemonName.toLowerCase());
    if (data) {
      setPokemon(data);
      setError('');
    } else {
      setPokemon(null);
      setError(`Pokémon "${pokemonName}" does not exist!`);
    }
    setPokemonName(''); // Clear the input field
    setSuggestions([]); // Clear the suggestions
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleInputChange = (event) => {
    const value = event.target.value;
    setPokemonName(value);

    if (value.length > 1) {
      const filteredSuggestions = pokemonList.filter((pokemon) =>
        pokemon.toLowerCase().startsWith(value.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setPokemonName(suggestion);
    setSuggestions([]);
  };

  return (
    <div className="App">
      <header className="App-header">
        <img id="pokedex-logo" src={pokedexLogo} alt="Pokedex Logo" />
        <input 
          id="barSearch"
          type="text" 
          value={pokemonName} 
          onChange={handleInputChange} 
          onKeyDown={handleKeyDown} 
          placeholder="Enter Pokémon name" 
        />
        <button id="btnSearch" onClick={handleSearch}>Search</button>
        {suggestions.length > 0 && (
          <ul className="suggestions">
            {suggestions.map((suggestion, index) => (
              <li key={index} onClick={() => handleSuggestionClick(suggestion)}>
                {suggestion}
              </li>
            ))}
          </ul>
        )}
        {error && <p id="txtErr">{error}</p>}
        {pokemon && (
          <div>
            <div id="txtPokemonName">{capitalizeFirstLetter(pokemon.name)}</div>
            <img id="poke-img" src={pokemon.sprites.front_default} alt={pokemon.name} />
            <p className='pInfo'>Height: {pokemon.height}</p>
            <p className='pInfo'>Weight: {pokemon.weight}</p>
            <p className='pInfo'>Type: {pokemon.types.map(typeInfo => typeInfo.type.name).join(', ')}</p>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
