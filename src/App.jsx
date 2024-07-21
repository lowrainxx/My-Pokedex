import React, { useState, useEffect } from 'react';
import './App.css';
import { getPokemon } from './services/pokeapi';
import pokedexLogo from './assets/pokedex-logo.png';
import allPokemonList from './data/pokemonList.js'; // JSON file with all Pokémon names and IDs

function App() {
  const [pokemonName, setPokemonName] = useState('');
  const [pokemon, setPokemon] = useState(null);
  const [error, setError] = useState('');
  const [showOverlay, setShowOverlay] = useState(false);
  const [samplePokemons, setSamplePokemons] = useState([]);
  const [isLoading, setIsLoading] = useState(false); 
  const [searched, setSearched] = useState(false); 

  // Fetch initial Pokémon with IDs 1-10
  useEffect(() => {
    const fetchInitialPokemons = async () => {
      const initialIds = Array.from({ length: 10 }, (_, i) => (i + 1).toString());
      const initialData = await Promise.all(initialIds.map(id => getPokemon(id)));
      setSamplePokemons(initialData);
    };
    fetchInitialPokemons();
  }, []);

  // Load More
  const loadMorePokemons = async () => {
    if (isLoading) return; // Prevent multiple calls if already loading
    setIsLoading(true); 
    const newCount = samplePokemons.length + 10;
    const newIds = Array.from({ length: 10 }, (_, i) => (i + samplePokemons.length + 1).toString());
    const newData = await Promise.all(newIds.map(id => getPokemon(id)));
    setSamplePokemons([...samplePokemons, ...newData]);
    setIsLoading(false);
  };

  // Fix name
  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  // Search bar
  const handleSearch = async () => {
    // Empty field
    if (!pokemonName.trim()) {
      setError('');
      setSamplePokemons([data]);
      setSearched(false);
      return;
    }
    const data = await getPokemon(pokemonName.toLowerCase());
    if (data) { // Exists
      setSamplePokemons([data]);
      setError('');
      setSearched(true);
    } else { // DNE
      setPokemon(null);
      setSamplePokemons([]);
      setError(`Pokémon "${pokemonName}" does not exist!`);
      setSearched(true);
    }
  };

  // Keydown Handler
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // Input Change Handler
  const handleInputChange = async (event) => {
    const value = event.target.value;
    setPokemonName(value);

    if (value) { // Input exists
      const filteredPokemons = allPokemonList
        .filter(p => p.name.toLowerCase().startsWith(value.toLowerCase()))
        .map(p => p.id);
      
      if (filteredPokemons.length > 0) {
        const filteredData = await Promise.all(filteredPokemons.map(id => getPokemon(id)));
        setSamplePokemons(filteredData);
        setSearched(false);
      } else {
        setSamplePokemons([]);
        setSearched(true);
      }
    } else { // Input cleared
      const initialIds = Array.from({ length: 10 }, (_, i) => (i + 1).toString());
      const initialData = await Promise.all(initialIds.map(id => getPokemon(id)));
      setSamplePokemons(initialData);
      setSearched(false);
      setError('');
    }
  };

  // Card click Handler
  const handleCardClick = (selectedPokemon) => {
    setPokemon(selectedPokemon);
    setShowOverlay(true);
  };

  // Overlay Close Handler
  const handleCloseOverlay = () => {
    setShowOverlay(false);
  };

  // Previous Pokemon Handler
  const handlePreviousPokemon = async () => {
    if (pokemon && pokemon.id > 1) {
      const previousPokemonId = (pokemon.id - 1).toString();
      const previousPokemon = await getPokemon(previousPokemonId);
      setPokemon(previousPokemon);
    }
  };

  // Next Pokemon Handler
  const handleNextPokemon = async () => {
    if (pokemon) {
      const nextPokemonId = (pokemon.id + 1).toString();
      const nextPokemon = await getPokemon(nextPokemonId);
      setPokemon(nextPokemon);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <img id="imgPokedexLogo" src={pokedexLogo} alt="Pokedex Logo" />
      </header>
      <div className="search-container">
        <input 
          id="search-field"
          type="text" 
          value={pokemonName} 
          onChange={handleInputChange} 
          onKeyDown={handleKeyDown} 
          placeholder="Enter Pokémon name" 
          autoComplete="off"
        />
        <button id="btnSearch" onClick={handleSearch}>
          <i className="fas fa-search"></i>
          <span className="tooltiptext">Search</span>
        </button>
      </div>
      {error && <p id="txtErr">{error}</p>}
      <div className="pokemon-cards-container">
        {samplePokemons.map(samplePokemon => (
          <div key={samplePokemon.id} className="pokemon-card" onClick={() => handleCardClick(samplePokemon)}>
            <p id="card-id">ID No: {samplePokemon.id}</p>
            <p id="card-name">Name: {capitalizeFirstLetter(samplePokemon.name)}</p>
            <img id="card-img" src={samplePokemon.sprites.front_default} alt={samplePokemon.name} />
            <p>Type: {samplePokemon.types.map(typeInfo => typeInfo.type.name).join(', ')}</p>
          </div>
        ))}
      </div>
      {!searched && samplePokemons.length > 0 && <button className="btnLoadMore" onClick={loadMorePokemons}>Load More</button>}
      {showOverlay && (
        <>
          <button className="btnBack" onClick={handleCloseOverlay}>Back to Pokédex</button>
          <div className="overlay">
            <button className="btnNavigate" id="btnPrevious" onClick={handlePreviousPokemon}>←</button>
            <div className="modal">
              {pokemon && (
                <>
                  <div id="info-name">{capitalizeFirstLetter(pokemon.name)}</div>
                  <img id="info-img" src={pokemon.sprites.front_default} alt={pokemon.name} />
                  <p className='pInfo'>Height: {pokemon.height}</p>
                  <p className='pInfo'>Weight: {pokemon.weight}</p>
                  <p className='pInfo'>Type: {pokemon.types.map(typeInfo => typeInfo.type.name).join(', ')}</p>
                </>
              )}
            </div>
            <button className="btnNavigate" id="btnNext" onClick={handleNextPokemon}>→</button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
