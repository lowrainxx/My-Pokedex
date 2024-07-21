import React, { useState, useEffect } from 'react';
import './App.css';
import { getPokemon } from './services/pokeapi';
import pokedexLogo from './assets/pokedex-logo.png';
import allPokemonList from './data/pokemonList.js'; // JSON file with all Pokémon names and IDs

function App() {
  const [pokemonName, setPokemonName] = useState('');
  const [inputField, setinputField] = useState('');
  const [pokemon, setPokemon] = useState(null);
  const [error, setError] = useState('');
  const [showOverlay, setShowOverlay] = useState(false);
  const [samplePokemons, setSamplePokemons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggested, setisSuggested] = useState(false);
  const [sortOrder, setSortOrder] = useState('idAsc'); // State for sorting order
  const [loadedPokemonCount, setLoadedPokemonCount] = useState(0); // State for loaded pokemon count

  // Fetch initial Pokémon based on sort order
  useEffect(() => {
    const fetchInitialPokemons = async () => {
      let initialIds = [];

      if (sortOrder === 'idAsc') {
        initialIds = Array.from({ length: 10 }, (_, i) => (i + 1).toString());
      } else if (sortOrder === 'idDesc') {
        initialIds = Array.from({ length: 10 }, (_, i) => (1025 - i).toString());
      } else {
        const sortedList = [...allPokemonList].sort((a, b) =>
          sortOrder === 'nameAsc' ? a.localeCompare(b) : b.localeCompare(a)
        );
        initialIds = sortedList.slice(0, 10).map((name) => getPokemonIdFromName(name));
      }

      const initialData = await Promise.all(initialIds.map((id) => getPokemon(id)));
      console.log(initialIds);
      console.log(initialData);
      setSamplePokemons(initialData);
      setLoadedPokemonCount(10);
    };

    fetchInitialPokemons();
  }, [sortOrder]);

  // Load more Pokémon based on sort order
  const loadMorePokemons = async () => {
    if (isLoading) return;
    setIsLoading(true);

    let newIds = [];

    if (sortOrder === 'idAsc') {
      newIds = Array.from({ length: 10 }, (_, i) => (loadedPokemonCount + i + 1).toString());
    } else if (sortOrder === 'idDesc') {
      newIds = Array.from({ length: 10 }, (_, i) => (1025 - loadedPokemonCount - i).toString());
    } else {
      const sortedList = [...allPokemonList].sort((a, b) =>
        sortOrder === 'nameAsc' ? a.localeCompare(b) : b.localeCompare(a)
      );
      newIds = sortedList.slice(loadedPokemonCount, loadedPokemonCount + 10).map((name) => getPokemonIdFromName(name));
    }

    const newData = await Promise.all(newIds.map((id) => getPokemon(id)));
    setSamplePokemons([...samplePokemons, ...newData]);
    setLoadedPokemonCount(loadedPokemonCount + 10);
    setIsLoading(false);
  };

  // Fix pokemon name
  const fixPokemonName = (string) => {
    return string
      .toLowerCase()
      .split('-')
      .map((word) => {
        if (word.toLowerCase() === 'gmax') {
          return 'Gigantamax';
        } else {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
      })
      .join(' ');
  };

  // Format ID
  const formatId = (id) => {
    return id.toString().padStart(3, '0');
  };

  // Search
  const handleSearch = async () => {
    if (!pokemonName.trim()) {
      setError('');
      setSamplePokemons([]);
      setSearched(false);
      return;
    }
    const data = await getPokemon(pokemonName.toLowerCase());
    if (data) {
      setSamplePokemons([data]);
      setError('');
      setSearched(true);
    } else {
      setPokemon(null);
      setSamplePokemons([]);
      setError(`Pokémon "${pokemonName}" does not exist!`);
      setSearched(true);
    }
    setisSuggested(false);
    setSuggestions([]); // Clear suggestions after search
  };

  // Key pressed
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // Get pokemon id from name
  const getPokemonIdFromName = (name) => {
    const lowerCaseName = name.toLowerCase();
    const index = allPokemonList.findIndex((pokemonName) => pokemonName.toLowerCase() === lowerCaseName);
    
    if (index === -1) return null;
  
    if (index < 1025) {
      return (index + 1).toString();
    } else {
      return (10001 + (index - 1025)).toString();
    }
  };
  

  // Input field is changed
  const handleInputChange = async (event) => {
    const value = event.target.value;
    setinputField(value);
    setPokemonName(value);

    if (!value) {
      const initialIds = Array.from({ length: 10 }, (_, i) => (i + 1).toString());
      const initialData = await Promise.all(initialIds.map((id) => getPokemon(id)));
      setSamplePokemons(initialData);
      setSearched(false);
      setError('');
      setSuggestions([]);
      return;
    }

    // Filter suggestions based on name or ID
    const filteredSuggestions = allPokemonList
      .filter((pokemonName, index) =>
        pokemonName.toLowerCase().includes(value.toLowerCase()) || formatId(index + 1).startsWith(value)
      )
      .slice(0, 10);
    setSuggestions(filteredSuggestions);

    const pokemonId = getPokemonIdFromName(value);
    if (pokemonId) {
      const data = await getPokemon(pokemonId);
      setSamplePokemons([data]);
    }
  };

  // Suggestion is clicked
  const handleSuggestionClick = (suggestion) => {
    setinputField(suggestion);
    setPokemonName(suggestion);
    setisSuggested(true);
  };

  // Activates when pokemonName is changed
  useEffect(() => {
    if (isSuggested) {
      handleSearch();
    }
  }, [pokemonName]);

  // Handle sort change
  const handleSortChange = (event) => {
    setSortOrder(event.target.value);
    setSamplePokemons([]);
    setLoadedPokemonCount(0); // Reset loaded count
  };

  // Sort samplePokemons based on sortOrder
  const sortedSamplePokemons = [...samplePokemons].sort((a, b) => {
    if (sortOrder === 'idAsc') {
      return a.id - b.id;
    } else if (sortOrder === 'idDesc') {
      return b.id - a.id;
    } else if (sortOrder === 'nameAsc') {
      return a.name.localeCompare(b.name);
    } else {
      return b.name.localeCompare(a.name);
    }
  });

  // Card is clicked
  const handleCardClick = (selectedPokemon) => {
    setPokemon(selectedPokemon);
    setShowOverlay(true);
  };

  // Overlay needs to close
  const handleCloseOverlay = () => {
    setShowOverlay(false);
  };

  // Previous pokemon button
  const handlePreviousPokemon = async () => {
    if (pokemon && pokemon.id > 1) {
      const previousPokemonId = (pokemon.id - 1).toString();
      const previousPokemon = await getPokemon(previousPokemonId);
      setPokemon(previousPokemon);
    }
  };

  // Next pokemon button
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
        <a href="/">
          <img id="imgPokedexLogo" src={pokedexLogo} alt="Pokedex Logo" />
        </a>
      </header>
      <div className="search-container">
        <input
          id="search-field"
          type="text"
          value={fixPokemonName(inputField)}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter Pokémon name or ID"
          autoComplete="off"
        />
        <button id="btnSearch" onClick={handleSearch}>
          <i className="fas fa-search"></i>
          <span className="tooltiptext">Search</span>
        </button>
        <select id="sortOrder" value={sortOrder} onChange={handleSortChange}>
          <option value="idAsc">Sort by ID: Ascending</option>
          <option value="idDesc">Sort by ID: Descending</option>
          <option value="nameAsc">Sort by Name: Ascending</option>
          <option value="nameDesc">Sort by Name: Descending</option>
        </select>
        {suggestions.length > 0 && (
          <div className="suggestions-dropdown">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {fixPokemonName(suggestion)}
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <p id="txtErr">{error}</p>}
      <div className="pokemon-cards-container">
        {sortedSamplePokemons.map((samplePokemon) => (
          <div key={samplePokemon.id} className="pokemon-card" onClick={() => handleCardClick(samplePokemon)}>
            <p id="card-id">ID No: {formatId(samplePokemon.id)}</p>
            <p id="card-name">Name: {fixPokemonName(samplePokemon.name)}</p>
            <img id="card-img" src={samplePokemon.sprites.front_default} alt={samplePokemon.name} />
            <p>Type: {samplePokemon.types.map((typeInfo) => typeInfo.type.name).join(', ')}</p>
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
                  <div id="info-name">{fixPokemonName(pokemon.name)}</div>
                  <img id="info-img" src={pokemon.sprites.front_default} alt={pokemon.name} />
                  <p className="pInfo">Height: {pokemon.height}</p>
                  <p className="pInfo">Weight: {pokemon.weight}</p>
                  <p className="pInfo">Type: {pokemon.types.map((typeInfo) => typeInfo.type.name).join(', ')}</p>
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
