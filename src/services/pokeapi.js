import axios from 'axios';

const API_URL = 'https://pokeapi.co/api/v2';

export const getPokemon = async (name) => {
  try {
    const response = await axios.get(`${API_URL}/pokemon/${name}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching Pokémon:', error);
    return null;
  }
};

export const getPokemonList = async (offset, limit) => {
  try {
    const response = await fetch(`${API_BASE_URL}/pokemon?offset=${offset}&limit=${limit}`);
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};