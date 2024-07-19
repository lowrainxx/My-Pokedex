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
  const [showOverlay, setShowOverlay] = useState(false);
  const [samplePokemons, setSamplePokemons] = useState([]);

  useEffect(() => {
    // Fetch sample Pokemon with IDs 1-10
    const fetchSamplePokemons = async () => {
      const sampleIds = Array.from({ length: 10 }, (_, i) => (i + 1).toString());
      const sampleData = await Promise.all(sampleIds.map(id => getPokemon(id)));
      setSamplePokemons(sampleData);
    };
    fetchSamplePokemons();
  }, []);

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  const handleSearch = async () => {
    if (!pokemonName.trim()) {
      setError('Please enter a Pokémon name.');
      return;
    }
    const data = await getPokemon(pokemonName.toLowerCase());
    if (data) {
      setPokemon(data);
      setError('');
      setShowOverlay(true);
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

  const handleCardClick = (selectedPokemon) => {
    setPokemon(selectedPokemon);
    setShowOverlay(true);
  };

  const handleCloseOverlay = () => {
    setShowOverlay(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <img id="imgPokedexLogo" src={pokedexLogo} alt="Pokedex Logo" />
      </header>
      <div className="search-container">
        <input 
          id="barSearch"
          type="text" 
          value={pokemonName} 
          onChange={handleInputChange} 
          onKeyDown={handleKeyDown} 
          placeholder="Enter Pokémon name" 
          autoComplete="off"
        />
        <button className="btnSearch" onClick={handleSearch}>
          <i className="fas fa-search"></i>
          <span className="tooltiptext">Search</span>
        </button>
      </div>
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
      <div className="pokemon-cards-container">
        {samplePokemons.map(samplePokemon => (
          <div key={samplePokemon.id} className="pokemon-card" onClick={() => handleCardClick(samplePokemon)}>
            <p>ID No: {samplePokemon.id}</p>
            <p>Name: {capitalizeFirstLetter(samplePokemon.name)}</p>
            <img src={samplePokemon.sprites.front_default} alt={samplePokemon.name} />
            <p>Type: {samplePokemon.types.map(typeInfo => typeInfo.type.name).join(', ')}</p>
          </div>
        ))}
      </div>
      {showOverlay && (
        <>
          <button className="btnBack" onClick={handleCloseOverlay}>Back to Pokédex</button>
          <div className="overlay" onClick={handleCloseOverlay}>
            <div className="modal">
              {pokemon && (
                <>
                  <div id="txtPokemonName">{capitalizeFirstLetter(pokemon.name)}</div>
                  <img id="imgPokemon" src={pokemon.sprites.front_default} alt={pokemon.name} />
                  <p className='pInfo'>Height: {pokemon.height}</p>
                  <p className='pInfo'>Weight: {pokemon.weight}</p>
                  <p className='pInfo'>Type: {pokemon.types.map(typeInfo => typeInfo.type.name).join(', ')}</p>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
