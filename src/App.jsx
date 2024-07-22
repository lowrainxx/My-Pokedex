import React, { useState, useEffect } from 'react';
import './App.css';
import { getPokemon } from './services/pokeapi';
import pokedexLogo from './assets/pokedex-logo.png';
import allPokemonList from './data/pokemonList.js'; // JSON file with all Pokémon names and IDs
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import typeIcons from './services/icons';

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
  const [sortOrder, setSortOrder] = useState('idAsc'); 
  const [loadedPokemonCount, setLoadedPokemonCount] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([]); 
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [filteredPokemons, setFilteredPokemons] = useState([]);
  const [pokemonNumberRange, setPokemonNumberRange] = useState([1, 1025]);
  const [rangeValue, setRangeValue] = useState([1, 1025]);
  const [alphabeticalRange, setAlphabeticalRange] = useState(['a', 'z']);
  const [previousPokemon, setPreviousPokemon] = useState(null);
  const [nextPokemon, setNextPokemon] = useState(null);
  
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

  const alphabeticalMarks = {
    1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E', 6: 'F', 7: 'G', 8: 'H', 9: 'I', 10: 'J',
    11: 'K', 12: 'L', 13: 'M', 14: 'N', 15: 'O', 16: 'P', 17: 'Q', 18: 'R', 19: 'S', 20: 'T',
    21: 'U', 22: 'V', 23: 'W', 24: 'X', 25: 'Y', 26: 'Z'
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
        newIds = Array.from({ length: 10 }, (_, i) => (loadedPokemonCount + i + 1).toString())
          .filter(id => parseInt(id) <= pokemonNumberRange[1]);
      } else if (sortOrder === 'idDesc') {
        newIds = Array.from({ length: 10 }, (_, i) => (1025 - loadedPokemonCount - i).toString())
          .filter(id => parseInt(id) >= pokemonNumberRange[0]);
      } else {
        const sortedList = [...allPokemonList].sort((a, b) =>
          sortOrder === 'nameAsc' || filteredPokemons.length > 0 ? a.localeCompare(b) : b.localeCompare(a)
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
      setSearched(false);
      return;
    }

    let data;
    if (!isNaN(pokemonName)) { // Check if the input is a number
      data = await getPokemon(pokemonName);
    } else {
      data = await getPokemon(pokemonName.toLowerCase());
    }

    console.log(pokemonName) // name
    if (data) {
      setSamplePokemons([data]);
      setError('');
      setSearched(true);
    } else {
      setPokemon(null);
      setSamplePokemons([]);
      setSearched(true);
      if (isNaN(pokemonName)) setError(`Pokémon "${pokemonName}" does not exist!`);
      else setError(`Pokémon with ID ${pokemonName} does not exist!`);
    }
    setisSuggested(false);
    setSuggestions([]); // Clear suggestions after search
  };

  // Key pressed
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      if (selectedSuggestionIndex >= 0) {
        handleSuggestionClick(suggestions[selectedSuggestionIndex]);
      } else {
        handleSearch();
      }
    } else if (event.key === 'ArrowDown') {
      setSelectedSuggestionIndex((prevIndex) =>
        prevIndex < suggestions.length - 1 ? prevIndex + 1 : 0
      );
    } else if (event.key === 'ArrowUp') {
      setSelectedSuggestionIndex((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : suggestions.length - 1
      );
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
    } else if (sortOrder === 'nameAsc' || filteredPokemons.length > 0) { // Ensure sorting by name when filtered by name range
      return a.name.localeCompare(b.name);
    } else if (sortOrder === 'nameDesc') {
      return b.name.localeCompare(a.name);
    }
  });

  // Card is clicked
  const handleCardClick = async (selectedPokemon) => {
    setPokemon(selectedPokemon);
    setShowOverlay(true);

    // Fetch previous Pokémon
    if (selectedPokemon.id > 1) {
      const previousPokemonId = selectedPokemon.id === 10001 ? "1025" : (selectedPokemon.id - 1).toString();
      const previousPokemonData = await getPokemon(previousPokemonId);
      setPreviousPokemon(previousPokemonData);
    } else {
      setPreviousPokemon(null);
    }

    // Fetch next Pokémon
    if (selectedPokemon.id < 1025 || (selectedPokemon.id >= 10001 && selectedPokemon.id < 10008)) {
      const nextPokemonId = (selectedPokemon.id + 1).toString();
      const nextPokemonData = await getPokemon(nextPokemonId);
      setNextPokemon(nextPokemonData);
    } else {
      setNextPokemon(null);
    }
  };

  // Overlay needs to close
  const handleCloseOverlay = () => {
    setShowOverlay(false);
  };

  const getRandomPokemon = async () => {
    const randomId = Math.floor(Math.random() * 1025) + 1;
    const randomData = await getPokemon(randomId.toString());
    handleCardClick(randomData);
  };

  // Previous pokemon button
  const handlePreviousPokemon = async () => {
    if (pokemon) {
      const previousPokemonId = pokemon.id === 10001 ? "1025" : (pokemon.id - 1).toString();
      const previousPokemon = await getPokemon(previousPokemonId);
      setPokemon(previousPokemon);
      
      // Update previous and next Pokemon
      if (previousPokemon.id > 1) {
        const prevPrevPokemonId = previousPokemon.id === 10001 ? "1025" : (previousPokemon.id - 1).toString();
        const prevPrevPokemonData = await getPokemon(prevPrevPokemonId);
        setPreviousPokemon(prevPrevPokemonData);
      } else {
        setPreviousPokemon(null);
      }
      
      const nextPokemonData = await getPokemon((previousPokemon.id + 1).toString());
      setNextPokemon(nextPokemonData);
    }
  };

  // Next pokemon button
  const handleNextPokemon = async () => {
    if (pokemon) {
      const nextPokemonId = (pokemon.id + 1).toString();
      const nextPokemon = await getPokemon(nextPokemonId);
      setPokemon(nextPokemon);
      
      // Update previous and next Pokemon
      const previousPokemonData = await getPokemon(pokemon.id.toString());
      setPreviousPokemon(previousPokemonData);
      
      if (nextPokemon.id < 1025 || (nextPokemon.id >= 10001 && nextPokemon.id < 10008)) {
        const nextNextPokemonId = (nextPokemon.id + 1).toString();
        const nextNextPokemonData = await getPokemon(nextNextPokemonId);
        setNextPokemon(nextNextPokemonData);
      } else {
        setNextPokemon(null);
      }
    }
  };

  const handleAlphabeticalChange = (values) => {
    const alphaRange = [String.fromCharCode(values[0] + 96), String.fromCharCode(values[1] + 96)];
    setAlphabeticalRange(alphaRange);
  }; 

  // Reset button
  const handleResetFilter = () => {
    setSelectedTypes([]); 
    setRangeValue([1, 1025]); 
    setAlphabeticalRange(['a', 'z']);
  };

  // Filter button
  const handleFilter = async () => {
    const normalizedSelectedTypes = selectedTypes.map(type => type.toLowerCase());
  
    // Fetch all Pokémon data
    const allData = await Promise.all(
      allPokemonList.slice(0, 1025).map(async (name, index) => {
        try {
          return await getPokemon((index + 1).toString());
        } catch (error) {
          console.error(`Failed to fetch data for Pokémon ID ${index + 1}:`, error);
          return null;
        }
      })
    );
  
    let filteredData = allData
      .filter(pokemon => pokemon && pokemon.types)
      .filter(pokemon => 
        pokemon.id >= rangeValue[0] && pokemon.id <= rangeValue[1]
      )
      .filter(pokemon => 
        pokemon.name[0].toLowerCase() >= alphabeticalRange[0] && pokemon.name[0].toLowerCase() <= alphabeticalRange[1]
      );
  
    if (normalizedSelectedTypes.length > 0) {
      filteredData = filteredData.filter(pokemon =>
        normalizedSelectedTypes.every(type =>
          pokemon.types.some(typeInfo => typeInfo.type.name.toLowerCase() === type)
        )
      );
    }
  
    if (filteredData.length === 0) {
      setError('No Pokemons exist with these criteria!');
    } else {
      setError('');
    }
  
    // Sort filteredData by name
    filteredData.sort((a, b) => a.name.localeCompare(b.name));
  
    console.log("allData "+allData.length)
    console.log(rangeValue[0]+"-"+rangeValue[1])
    console.log(alphabeticalRange[0]+"-"+alphabeticalRange[1])
    console.log("filteredData "+filteredData.length)
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
        <div className="search-wrapper">
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
        </div>
        <button id="btnShuffle" onClick={getRandomPokemon}>
          <i className="fas fa-random"></i>
          <span className="tooltiptext">Surprise me!</span>
        </button>
        <div className="sort-filter-container">
          <select id="sortOrder" value={sortOrder} onChange={handleSortChange}>
            <option value="idAsc">Sort by ID: Ascending</option>
            <option value="idDesc">Sort by ID: Descending</option>
            <option value="nameAsc">Sort by Name: Ascending</option>
            <option value="nameDesc">Sort by Name: Descending</option>
          </select>
        </div>
        <button id="filter-toggle-btn" onClick={() => setFilterOpen(!filterOpen)}>
          {filterOpen ? 'Close Filters' : 'Open Filters'}
        </button>
        {suggestions.length > 0 && (
          <div className="suggestions-dropdown">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`suggestion-item ${
                  index === selectedSuggestionIndex ? 'selected' : ''
                }`}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {fixPokemonName(suggestion)}
              </div>
            ))}
          </div>
        )}
      </div>
      {filterOpen && (
        <div className="filter-options">
          <p>Type:</p>
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
          <div className="slider-container-id">
            <p>ID Number:</p>
            <div className="slider-label-id">
              <span>{rangeValue[0]}</span>
              <span>-</span>
              <span>{rangeValue[1]}</span>
            </div>
            <Slider
              range
              min={1}
              max={1025}
              value={rangeValue}
              onChange={(value) => setRangeValue(value)}
            />
          </div>
          <div className="slider-container-name">
            <p>Name Range:</p>
            <div className="slider-label-name">
              <span>{alphabeticalRange[0].toUpperCase()}</span>
              <span>-</span>
              <span>{alphabeticalRange[1].toUpperCase()}</span>
            </div>
            <Slider
              range
              min={1}
              max={26}
              marks={alphabeticalMarks}
              value={[alphabeticalRange[0].charCodeAt(0) - 96, alphabeticalRange[1].charCodeAt(0) - 96]}
              onChange={handleAlphabeticalChange}
              handleRender={(node) => {
                return React.cloneElement(node, {
                  style: {
                    ...node.props.style,
                    borderColor: 'blue',
                  },
                });
              }}
            />
          </div>
          <button onClick={() => handleResetFilter()}>Reset</button>
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
            <div className="card-type-container">
              {samplePokemon.types.map((typeInfo) => (
                <img
                  key={typeInfo.type.name.charAt(0).toUpperCase() + typeInfo.type.name.slice(1)}
                  src={typeIcons[typeInfo.type.name.charAt(0).toUpperCase() + typeInfo.type.name.slice(1)]}
                  alt={typeInfo.type.name.charAt(0).toUpperCase() + typeInfo.type.name.slice(1)}
                  className={`card-type-icon ${typeInfo.type.name.charAt(0).toUpperCase() + typeInfo.type.name.slice(1)}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      {!searched && 
        samplePokemons.length > 0 && 
        samplePokemons.length >= 10 && 
        (filteredPokemons.length === 0 || samplePokemons.length < filteredPokemons.length) && (
          <button className="btnLoadMore" onClick={loadMorePokemons}>Load More</button>
        )}
      {showOverlay && (
        <>
          <button className="btnBack" onClick={handleCloseOverlay}>Back to Pokédex</button>
          <div className="overlay">
          <button className="btnNavigate" id="btnPrevious" onClick={handlePreviousPokemon}>
            {previousPokemon ? `← ${formatId(previousPokemon.id)} ${fixPokemonName(previousPokemon.name)}` : '←'}
          </button>
          <div className="modal">
            {pokemon && (
              <>
                <div className="modal-header">
                  <div id="info-id">{formatId(pokemon.id)}</div>
                  <div className="info-hw">
                    <p className="info-ht">Height: {pokemon.height}</p>
                    <p className="info-wt">Weight: {pokemon.weight}</p>
                  </div>
                </div>
                <div id="info-name">{fixPokemonName(pokemon.name)}</div>
                <div id="info-img">
                  <img src={pokemon.sprites.front_default} alt={pokemon.name} />
                </div>
                <div className="info-container">
                <div className="info-twa">
                  <p className="info-infoName">Information:</p>
                  <p className="info-type">
                    <span className="info-label">Type:</span> 
                    <br></br>
                    {pokemon.types.map((typeInfo) => typeInfo.type.name.charAt(0).toUpperCase() + typeInfo.type.name.slice(1)).join(', ')}
                  </p>
                  <p className="info-weak">
                    <span className="info-label">Weaknesses:</span> 
                    <br></br>
                    {getWeaknesses(pokemon.types.map((typeInfo) => typeInfo.type.name)).join(', ')}
                  </p>
                  <p className="info-abilities">
                    <span className="info-label">Abilities:</span> 
                    <br></br>
                    {pokemon.abilities.map((abilityInfo) => abilityInfo.ability.name.charAt(0).toUpperCase() + abilityInfo.ability.name.slice(1)).join(', ')}
                  </p>
                </div>
                <div className="info-stats">
                  <p className="info-statsName">Stats:</p>
                  <ul className="stats-list">
                    {pokemon.stats.map((stat, index) => {
                      const statName = stat.stat.name
                        .replace('hp', 'HP')
                        .replace('special-attack', 'Special Atk')
                        .replace('special-defense', 'Special Def')
                        .replace(/\b\w/g, (char) => char.toUpperCase());
                      return (
                        <li key={index} className="stat-bar-container">
                          <span className={`stat-bar-label ${stat.stat.name.replace('special-attack', 'special-attack').replace('special-defense', 'special-defense')}`}>{statName}:</span>
                          <div className="stat-bar">
                            <div
                              className={`stat-bar-fill ${stat.stat.name}`}
                              style={{ width: `${stat.base_stat / 2}%` }} // Assuming 200 is the maximum base stat for scaling
                            ></div>
                          </div>
                          <span className="stat-bar-value">{stat.base_stat}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </>
          )}
          </div>
            <button className="btnNavigate" id="btnNext" onClick={handleNextPokemon}>
              {nextPokemon ? `${formatId(nextPokemon.id)} ${fixPokemonName(nextPokemon.name)} →` : '→'}
            </button>
          </div>
        </>
      )}
    <footer className="app-footer">
        <p>
          Made by: <a href="https://www.linkedin.com/in/loranebmfausto" target="_blank" rel="noopener noreferrer">Lorane Fausto</a>
        </p>
        <p>©Pokémon. ©Nintendo/Creatures Inc./GAME FREAK inc.</p>
      </footer>
    </div>
  );
}

export default App;