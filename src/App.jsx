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
  const [filterOpen, setFilterOpen] = useState(false); // State for filter toggle
  const [selectedTypes, setSelectedTypes] = useState([]); // State for selected filter types
  const [filteredPokemons, setFilteredPokemons] = useState([]); // State for filtered Pokémon
  const [disabledTypes, setDisabledTypes] = useState([]); // State for disabled filter types

  const allTypes = ["Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy"];

  const typeChart = {
    Normal: { weak: ["Fighting"], resist: [], immune: ["Ghost"] },
    Fire: { weak: ["Water", "Ground", "Rock"], resist: ["Fire", "Grass", "Ice", "Bug", "Steel", "Fairy"], immune: [] },
    Water: { weak: ["Electric", "Grass"], resist: ["Fire", "Water", "Ice", "Steel"], immune: [] },
    Electric: { weak: ["Ground"], resist: ["Electric", "Flying", "Steel"], immune: [] },
    Grass: { weak: ["Fire", "Ice", "Poison", "Flying", "Bug"], resist: ["Water", "Electric", "Grass", "Ground"], immune: [] },
    Ice: { weak: ["Fire", "Fighting", "Rock", "Steel"], resist: ["Ice"], immune: [] },
    Fighting: { weak: ["Flying", "Psychic", "Fairy"], resist: ["Bug", "Rock", "Dark"], immune: [] },
    Poison: { weak: ["Ground", "Psychic"], resist: ["Grass", "Fighting", "Poison", "Bug", "Fairy"], immune: [] },
    Ground: { weak: ["Water", "Ice", "Grass"], resist: ["Poison", "Rock"], immune: ["Electric"] },
    Flying: { weak: ["Electric", "Ice", "Rock"], resist: ["Grass", "Fighting", "Bug"], immune: ["Ground"] },
    Psychic: { weak: ["Bug", "Ghost", "Dark"], resist: ["Fighting", "Psychic"], immune: [] },
    Bug: { weak: ["Fire", "Flying", "Rock"], resist: ["Grass", "Fighting", "Ground"], immune: [] },
    Rock: { weak: ["Water", "Grass", "Fighting", "Ground", "Steel"], resist: ["Normal", "Fire", "Poison", "Flying"], immune: [] },
    Ghost: { weak: ["Ghost", "Dark"], resist: ["Poison", "Bug"], immune: ["Normal", "Fighting"] },
    Dragon: { weak: ["Ice", "Dragon", "Fairy"], resist: ["Fire", "Water", "Electric", "Grass"], immune: [] },
    Dark: { weak: ["Fighting", "Bug", "Fairy"], resist: ["Ghost", "Dark"], immune: ["Psychic"] },
    Steel: { weak: ["Fire", "Fighting", "Ground"], resist: ["Normal", "Grass", "Ice", "Flying", "Psychic", "Bug", "Rock", "Dragon", "Steel", "Fairy"], immune: ["Poison"] },
    Fairy: { weak: ["Poison", "Steel"], resist: ["Fighting", "Bug", "Dark"], immune: ["Dragon"] },
  };
  
  const getWeaknesses = (types) => {
    const weaknesses = new Set();
  
    const normalizeTypeName = (name) => name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  
    types.forEach((type) => {
      const normalizedType = normalizeTypeName(type);
      if (typeChart[normalizedType]) {
        typeChart[normalizedType].weak.forEach((weakness) => weaknesses.add(weakness));
      }
    });
  
    // Remove resistances and immunities
    types.forEach((type) => {
      const normalizedType = normalizeTypeName(type);
      if (typeChart[normalizedType]) {
        typeChart[normalizedType].resist.forEach((resistance) => weaknesses.delete(resistance));
        typeChart[normalizedType].immune.forEach((immunity) => weaknesses.delete(immunity));
      }
    });
  
    return Array.from(weaknesses);
  };

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
    setSamplePokemons(initialData);
    setLoadedPokemonCount(10);
  };

  // Fetch initial Pokémon based on sort order
  useEffect(() => {
    fetchInitialPokemons();
  }, [sortOrder]);

  // Load more Pokémon based on sort order
  const loadMorePokemons = async () => {
    if (isLoading) return;
    setIsLoading(true);
  
    let newPokemons = [];
  
    if (filteredPokemons.length > 0) {
      newPokemons = filteredPokemons.slice(loadedPokemonCount, loadedPokemonCount + 10);
    } else {
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
      newPokemons = newData;
    }
  
    setSamplePokemons([...samplePokemons, ...newPokemons]);
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

  const getPokemonApiId = (index) => {
    if (index < 1025) {
      return (index + 1).toString();
    } else {
      return (10001 + (index - 1025)).toString();
    }
  };

  // Filter button
  const handleFilter = async () => {
    if (selectedTypes.length === 0) {
      // If no filters are selected, reset to show initial sample
      setLoadedPokemonCount(0);
      await fetchInitialPokemons(); // Reset the samplePokemons
      setFilteredPokemons([]); // Clear the filteredPokemons state
      setError(''); // Clear any existing error message
      return;
    }
  
    const normalizedSelectedTypes = selectedTypes.map(type => type.toLowerCase());
  
    // Fetch all Pokémon data (consider optimizing this for large datasets)
    const allData = await Promise.all(allPokemonList.map(async (name, index) => {
      try {
        return await getPokemon(getPokemonApiId(index));
      } catch (error) {
        console.error(`Failed to fetch data for Pokémon index ${index}:`, error);
        return null;
      }
    }));
  
    const filteredData = allData
      .filter(pokemon => pokemon && pokemon.types)
      .filter(pokemon =>
        normalizedSelectedTypes.every(type =>
          pokemon.types.some(typeInfo => typeInfo.type.name.toLowerCase() === type)
        )
      );

    if (filteredData.length === 0) {
      setError('No Pokémons exist with these types!');
    } else {
      setError('');
    }
  
    setFilteredPokemons(filteredData);
    setSamplePokemons(filteredData.slice(0, 10));
    setLoadedPokemonCount(10);
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
          value={inputField}
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
      <button onClick={() => setFilterOpen(!filterOpen)}>
        {filterOpen ? 'Close Filters' : 'Open Filters'}
      </button>
      {filterOpen && (
        <div className="filter-options">
        {allTypes.map((type) => (
          <div key={type}>
            <input
              type="checkbox"
              id={type}
              value={type}
              checked={selectedTypes.includes(type)}
              disabled={!selectedTypes.includes(type) && selectedTypes.length >= 2}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedTypes([...selectedTypes, type]);
                } else {
                  setSelectedTypes(selectedTypes.filter((t) => t !== type));
                }
              }}
            />
            <label htmlFor={type}>{type}</label>
          </div>
        ))}
        <button onClick={() => setSelectedTypes([])}>Reset</button>
        <button onClick={() => handleFilter()}>Filter</button>
      </div>
      
      )}
      {error && <p id="txtErr">{error}</p>}
      <div className="pokemon-cards-container">
        {sortedSamplePokemons.map((samplePokemon) => (
          <div key={samplePokemon.id} className="pokemon-card" onClick={() => handleCardClick(samplePokemon)}>
            <p id="card-id">{formatId(samplePokemon.id)}</p>
            <p id="card-name">{fixPokemonName(samplePokemon.name)}</p>
            <img id="card-img" src={samplePokemon.sprites.front_default} alt={samplePokemon.name} />
            <p>{samplePokemon.types.map((typeInfo) => typeInfo.type.name).join(', ')}</p>
          </div>
        ))}
      </div>
      {!searched && samplePokemons.length > 0 && samplePokemons.length >= 10 && (filteredPokemons.length === 0 || samplePokemons.length < filteredPokemons.length) && (
        <button className="btnLoadMore" onClick={loadMorePokemons}>Load More</button>
      )}
      {showOverlay && (
        <>
          <button className="btnBack" onClick={handleCloseOverlay}>Back to Pokédex</button>
          <div className="overlay">
            <button className="btnNavigate" id="btnPrevious" onClick={handlePreviousPokemon}>←</button>
            <div className="modal">
              {pokemon && (
                <>
                  <div id="info-name">{fixPokemonName(pokemon.name)}</div>
                  <div id="info-id">{formatId(pokemon.id)}</div>
                  <img id="info-img" src={pokemon.sprites.front_default} alt={pokemon.name} />
                  <div className="info-container">
                    <div className="info-left">
                      <p className="pInfo">Height: {pokemon.height}</p>
                      <p className="pInfo">Weight: {pokemon.weight}</p>
                      <p className="pInfo">Type: {pokemon.types.map((typeInfo) => typeInfo.type.name).join(', ')}</p>
                      <p className="pInfo">Weaknesses: {getWeaknesses(pokemon.types.map((typeInfo) => typeInfo.type.name)).join(', ')}</p>
                    </div>
                    <div className="info-right">
                      <p className="pInfo">Stats:</p>
                      <ul className="stats-list">
                        {pokemon.stats.map((stat, index) => (
                          <li key={index}>{stat.stat.name}: {stat.base_stat}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
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
