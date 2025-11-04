import React, { useState, useEffect, Suspense, useCallback } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient, // Added for manually invalidating queries on error retry
} from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

// --- Global Setup ---
// QueryClient is initialized here, acting as the single root of the application.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configure Suspense to trigger loading/error states
      suspense: true,
      staleTime: 1000 * 60 * 5, // Data is considered fresh for 5 minutes
    },
  },
});

const baseURL = "https://pokeapi.co/api/v2/pokemon/";

// Utility function for capitalization
const capitalize = (s) => (s && s.charAt(0).toUpperCase() + s.slice(1)) || "";

// --- Data & Colors ---

const gens = {
  genOne: [1, 151],
  genTwo: [152, 251],
  genThree: [252, 386],
  genFour: [387, 493],
  genFive: [494, 649],
  genSix: [650, 721],
  genSeven: [722, 809],
  genEight: [810, 898],
  genNine: [899, 1010],
};

const typeColors = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#7AC74C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD",
};

// --- CUSTOM CSS STYLES (Converted from SCSS) ---
const styles = `
    /* Global Styles */
    body {
        margin: 0;
        padding: 0;
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        background: linear-gradient(to right, #1e1e2f, #2c2c45);
        color: #fff;
        text-align: center;
    }

    .app.container {
        max-width: 1200px;
        margin: auto;
        padding: 20px;
    }

    /* Logo */
    #logo-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        margin-bottom: 20px;
    }

    #logo-container #logo {
        width: 100px;
        height: 100px;
        margin-bottom: 10px;
        animation: spin 20s linear infinite;
    }

    #logo-container #logo-text {
        font-size: 2rem;
        font-weight: bold;
        color: #ff3e3e;
        text-shadow: 2px 2px #000;
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    /* --- Search Wrapper (For Autocomplete Positioning) --- */
    .search-container-wrapper {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        margin-bottom: 20px;
    }

    /* Search Form */
    form {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        gap: 10px;
        margin-bottom: 0;
    }

    form .search-input {
        padding: 0.5rem 1rem;
        border-radius: 25px;
        border: 2px solid #ccc;
        width: 250px;
        font-size: 1rem;
        transition: all 0.3s ease;
        background-color: #fff; /* Ensure contrast for input */
        color: #333; /* Ensure text is visible */
    }
    form .search-input:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 10px rgba(0, 123, 255, 0.4);
    }

    form .search-btn {
        border-radius: 25px;
        padding: 0.5rem 1.5rem;
        font-weight: bold;
        border: none;
        background: #007bff;
        color: #fff;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    form .search-btn:hover {
        background: #0056b3;
        transform: scale(1.05);
    }

    /* --- Autocomplete Dropdown --- */
    .autocomplete-list {
        position: absolute;
        top: 100%;
        margin-top: 5px;
        background: rgba(30, 30, 45, 0.8);
        border-radius: 10px;
        max-width: 250px;
        width: 250px;
        padding: 0;
        list-style: none;
        z-index: 10;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);
        text-align: left; /* Ensure text starts on the left */
        overflow: hidden;
    }

    .autocomplete-list li {
        padding: 8px 12px;
        cursor: pointer;
        text-transform: capitalize;
        transition: background 0.2s ease;
    }

    .autocomplete-list li:hover {
        background: rgba(50, 50, 70, 0.9);
    }

    .autocomplete-list li.active {
        background: #007bff;
        color: #fff;
        font-weight: bold;
    }

    /* Generation Buttons */
    .gen-buttons {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: stretch;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 20px;
    }

    .gen-buttons .gens {
        padding: 0.5rem 1rem;
        border-radius: 20px;
        border: none;
        font-weight: bold;
        cursor: pointer;
        color: #fff;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .gen-buttons .gens:hover {
        transform: scale(1.1);
        box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
    }

    .gen-buttons .genOne { background: #ffcb05; color: #2a75bb; }
    .gen-buttons .genTwo { background: #ff7f00; color: #fff; }
    .gen-buttons .genThree { background: #3b4cca; color: #fff; }
    .gen-buttons .genFour { background: #f84888; color: #fff; }
    .gen-buttons .genFive { background: #00a170; color: #fff; }
    .gen-buttons .genSix { background: #f85888; color: #fff; }
    .gen-buttons .genSeven { background: #ffa500; color: #000; }
    .gen-buttons .genEight { background: #00bfff; color: #fff; }
    .gen-buttons .genNine { background: #ff69b4; color: #fff; }

    /* Pokémon List */
    .pokemon-list {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: stretch;
        flex-wrap: wrap;
        gap: 15px;
        padding: 0;
    }

    .pokemon-list .pokemon-card {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 120px;
        padding: 10px;
        border-radius: 15px;
        background: rgba(30, 30, 45, 0.8);
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
    }

    .pokemon-list .pokemon-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.7);
    }

    .pokemon-list .pokemon-card img {
        width: 80px;
        height: 80px;
    }

    .pokemon-list .pokemon-card .pokebutt {
        margin-top: 5px;
        font-weight: bold;
        text-transform: capitalize;
    }

    /* --- Pokémon Detail Modal --- */
    #modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 999;
    }

    .pokemon-detail {
        background: rgba(40, 40, 60, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 15px;
        padding: 20px;
        width: 300px;
        max-width: 90%;
        text-align: center;
        position: relative;
    }

    .pokemon-detail .detail-header {
        margin-bottom: 10px;
        text-transform: capitalize;
        font-size: 1.5rem; /* text-xl */
        font-weight: bold;
    }
    
    .pokemon-detail .detail-id {
        font-size: 0.875rem; /* text-sm */
        font-weight: normal;
        color: #ccc; /* text-gray-500 */
        margin-left: 0.5rem;
    }

    .pokemon-detail .detail-content {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .pokemon-detail .detail-image {
        width: 120px;
        height: 120px;
        margin-bottom: 10px;
    }

    .pokemon-detail .types {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
        margin-top: 10px;
        margin-bottom: 15px;

        span {
            padding: 5px 12px;
            border-radius: 15px;
            font-weight: bold;
            color: #fff;
            text-transform: capitalize;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
            font-size: 0.875rem;
            font-weight: 600;
        }
    }

    /* Varieties Section */
    .varieties-section {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        width: 100%;
        max-width: 300px;
    }
    
    .varieties-section p {
        font-size: 1.125rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: #fff;
    }
    
    .varieties-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
    }

    .variety-btn {
        padding: 4px 12px;
        font-size: 0.75rem;
        font-weight: 500;
        border-radius: 8px;
        background-color: #ffeb3b;
        color: #c0841f;
        border: none;
        cursor: pointer;
        transition: background-color 0.15s ease-in-out;
    }
    
    .variety-btn:hover {
        background-color: #fce321;
    }

    /* Stats List */
    .stats {
        list-style: none;
        padding: 0;
        margin: 0 auto 10px auto;
        width: 100%;
        max-width: 300px;
        margin-top: 20px;
        padding: 10px;
        border-radius: 10px;
        background: rgba(50, 50, 70, 0.5);
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .stats h4 {
        font-weight: bold;
        color: #fff;
        margin-bottom: 8px;
        font-size: 1rem;
    }

    .stats li {
        display: flex;
        justify-content: space-between;
        padding: 5px 10px;
        font-weight: bold;
        background: rgba(50, 50, 70, 0.9);
        border-radius: 10px;
        margin-bottom: 5px;
        overflow: hidden;
        position: relative;

        span {
            z-index: 2;
        }

        /* Stat Bar Visual using CSS Variable */
        &::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: var(--stat-width);
            background: linear-gradient(90deg, #ff6a00, #ee0979);
            border-radius: 10px;
            opacity: 0.7;
            z-index: 1;
            transition: width 0.5s ease-out;
        }
    }
    
    .stats .stat-label {
        width: 35%;
        font-weight: 500;
        color: #ccc;
        text-align: left;
    }
    
    .stats .stat-value {
        width: 15%;
        font-weight: bold;
        color: #fff;
        text-align: right;
        margin-right: 8px;
    }

    /* Fallback/Error Styling */
    .error-alert {
        color: white;
        background-color: #e53e3e;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        max-width: 400px;
        margin: 50px auto;
    }
    
    .error-alert .error-title {
        font-weight: bold;
        margin-bottom: 8px;
    }
    
    .error-alert .error-message {
        font-size: 0.875rem;
        background-color: #c53030;
        padding: 8px;
        border-radius: 4px;
        overflow: auto;
    }
    
    .error-alert .error-button {
        margin-top: 16px;
        padding: 8px 16px;
        background-color: white;
        color: #c53030;
        font-weight: 600;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        transition: background-color 0.15s;
    }
    
    .error-alert .error-button:hover {
        background-color: #f7fafc;
    }

    /* Loading Fallback Styles */
    .loading-fallback {
        color: white;
        text-align: center;
        margin-top: 50px;
    }
    
    .loading-fallback img {
        width: 50px;
        animation: spin 1s linear infinite;
    }
    
    /* Media Queries for responsiveness */
    @media (max-width: 800px) {
        .gen-buttons {
            flex-direction: column;
        }
        form {
            flex-direction: column;
            gap: 10px;
        }
        form .search-input {
            width: 90%;
            max-width: 300px;
        }
        .autocomplete-list {
            width: 90%;
            max-width: 300px;
        }
    }
`;

// --- React Query Fetcher Functions ---

// 1. Fetcher for ALL Pokémon (for Autocomplete)
const fetchAllPokemon = async () => {
  const res = await fetch(`${baseURL}?limit=1010`);
  if (!res.ok) throw new Error("Failed to fetch all Pokemon list.");
  const data = await res.json();

  // Pre-process data to include ID
  return data.results.map((p) => {
    const segments = p.url.split("/");
    const id = segments.filter(Boolean).pop();
    return {
      ...p,
      id: id,
    };
  });
};

// 2. Fetcher for a Specific Pokémon Details (for Modal)
const fetchPokemonDetails = async (name) => {
  const safeName = name ?? "";

  if (!safeName) {
    return Promise.resolve(null);
  }

  const res = await fetch(baseURL + safeName.toLowerCase());
  if (!res.ok)
    throw new Error(`Pokémon "${safeName}" not found. (Status: ${res.status})`);
  return res.json();
};

// 3. NEW: Fetcher for a Specific Pokémon Species (to get regional varieties)
const fetchPokemonSpecies = async (speciesUrl) => {
  if (!speciesUrl) return Promise.resolve(null);

  const res = await fetch(speciesUrl);
  if (!res.ok) throw new Error(`Failed to fetch Pokémon species data.`);
  return res.json();
};

// 4. Fetcher for a Generation Range (for List)
const fetchGenerationRange = async (start, finish) => {
  const offset = start - 1;
  const limit = finish - start + 1;
  const res = await fetch(`${baseURL}?offset=${offset}&limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch generation range.");
  return res.json();
};

// --- The Main Component Logic (AppContent) ---

function AppContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPokemon, setFilteredPokemon] = useState([]);
  const [selectedPokemonName, setSelectedPokemonName] = useState(null);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [currentGenRange, setCurrentGenRange] = useState(gens.genOne);

  // RQ: Query 1: Fetch ALL Pokemon List
  const { data: allPokemon = [] } = useQuery({
    queryKey: ["allPokemonList"],
    queryFn: fetchAllPokemon,
  });

  // RQ: Query 2: Fetch the CURRENT Generation List
  const { data: pokemonList = [] } = useQuery({
    queryKey: ["pokemonList", currentGenRange],
    queryFn: () => fetchGenerationRange(currentGenRange[0], currentGenRange[1]),
    select: (data) => data.results,
    enabled: !!currentGenRange,
  });

  // RQ: Query 3: Fetch Selected Pokemon Details (The actual Pokémon object)
  const { data: selectedPokemon, error: detailsError } = useQuery({
    queryKey: ["pokemonDetails", selectedPokemonName],
    queryFn: () => {
      if (!selectedPokemonName) {
        return Promise.resolve(null);
      }
      return fetchPokemonDetails(selectedPokemonName);
    },
    enabled: !!selectedPokemonName,
  });

  // RQ: Query 4: Fetch Selected Pokémon Species (to get varieties)
  const { data: selectedPokemonSpecies } = useQuery({
    queryKey: ["pokemonSpecies", selectedPokemon?.species?.url],
    queryFn: () => fetchPokemonSpecies(selectedPokemon?.species?.url),
    // Only run this query if the main details fetch was successful and contains a species URL
    enabled: !!selectedPokemon?.species?.url,
  });

  // Effect for Live Filtering (Uses allPokemon from RQ cache)
  useEffect(() => {
    setActiveSuggestionIndex(-1);

    if (!allPokemon || allPokemon.length === 0) {
      setFilteredPokemon([]);
      return;
    }

    const safeSearchTerm = (searchTerm ?? "").toLowerCase();

    if (!safeSearchTerm) {
      setFilteredPokemon([]);
      return;
    }

    const filtered = allPokemon.filter(
      (p) => p && p.name && p.name.toLowerCase().includes(safeSearchTerm)
    );

    setFilteredPokemon(filtered.slice(0, 10));
  }, [searchTerm, allPokemon]);

  // EFFECT: Handle ESC key to close the modal
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === "Escape" && selectedPokemonName) {
        setSelectedPokemonName(null);
      }
    };

    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [selectedPokemonName]);

  const handleSearchClick = useCallback((name) => {
    setSelectedPokemonName(name);

    // Clear filtering state
    setFilteredPokemon([]);
    setSearchTerm("");
  }, []);

  const handleGenClick = (start, finish) => {
    setSelectedPokemonName(null);
    setCurrentGenRange([start, finish]);
    setSearchTerm("");
    setFilteredPokemon([]);
  };

  const handleKeyDown = (e) => {
    if (filteredPokemon.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestionIndex((prevIndex) =>
        prevIndex < filteredPokemon.length - 1 ? prevIndex + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestionIndex((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : filteredPokemon.length - 1
      );
    } else if (e.key === "Enter") {
      if (activeSuggestionIndex !== -1) {
        e.preventDefault();
        const selectedName = filteredPokemon[activeSuggestionIndex].name;
        handleSearchClick(selectedName);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm && activeSuggestionIndex === -1) {
      handleSearchClick(searchTerm);
    }
  };

  const closeModal = (e) => {
    if (e.target.id === "modal-overlay") setSelectedPokemonName(null);
  };

  // Display error from details fetch
  useEffect(() => {
    if (detailsError) {
      // If the error is a 404 (Not Found), we simply clear the selection
      if (detailsError.message.includes("404")) {
        console.warn(
          `Could not find Pokemon for name: ${selectedPokemonName}.`
        );
        setSelectedPokemonName(null);
      } else {
        // Log other errors for debugging
        console.error("Pokemon Details Fetch Error:", detailsError.message);
      }
    }
  }, [detailsError, selectedPokemonName]);

  // Get all forms for this species (including the current one)
  const allForms = selectedPokemonSpecies?.varieties || [];

  return (
    <div className="app container">
      {/* Inject Custom Styles */}
      <style>{styles}</style>

      {/* Logo */}
      <div id="logo-container">
        {/* Placeholder image for Pokeball: https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Pok%C3%A9_Ball_icon.svg/200px-Pok%C3%A9_Ball_icon.svg.png */}
        <img
          id="logo"
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Pok%C3%A9_Ball_icon.svg/200px-Pok%C3%A9_Ball_icon.svg.png"
          alt="PokéFinder"
        />
        <div id="logo-text">PokéFinder</div>
      </div>

      {/* Search Container */}
      <div className="search-container-wrapper">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Search Pokémon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="search-input"
          />
          <button type="submit" className="search-btn">
            Search
          </button>
        </form>

        {/* Autocomplete Dropdown */}
        {filteredPokemon.length > 0 && (
          <ul className="autocomplete-list">
            {filteredPokemon.map((p, index) => (
              <li
                key={p.name}
                onClick={() => handleSearchClick(p.name)}
                className={index === activeSuggestionIndex ? "active" : ""}
                onMouseEnter={() => setActiveSuggestionIndex(index)}
              >
                {capitalize(p.name)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Generation Buttons */}
      <div className="gen-buttons">
        {Object.keys(gens).map((gen) => (
          <button
            key={gen}
            className={`gens ${gen}`}
            onClick={() => handleGenClick(...gens[gen])}
          >
            {gen.replace("gen", "Gen ")}
          </button>
        ))}
      </div>

      {/* Pokémon List */}
      {pokemonList.length > 0 && (
        <ul className="pokemon-list">
          {pokemonList.map((pokemon) => {
            const id = pokemon.url.split("/").filter(Boolean).pop();
            return (
              <li
                key={pokemon.name}
                className="pokemon-card"
                onClick={() => handleSearchClick(pokemon.name)}
              >
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`}
                  alt={pokemon.name}
                  onError={(e) => {
                    // Fallback to simpler sprite if official artwork is missing
                    e.target.onerror = null;
                    e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
                  }}
                />
                <div className="pokebutt">{capitalize(pokemon.name)}</div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Selected Pokémon Modal (NO TAILWIND) */}
      {selectedPokemon && (
        <div id="modal-overlay" onClick={closeModal}>
          <div className="pokemon-detail" onClick={(e) => e.stopPropagation()}>
            <h3 className="detail-header">
              {capitalize(selectedPokemon.species.name)}
              <span className="detail-id">#{selectedPokemon.id}</span>
            </h3>

            <div className="detail-content">
              <img
                src={
                  selectedPokemon.sprites.other["official-artwork"]
                    .front_default || selectedPokemon.sprites.front_default
                }
                alt={selectedPokemon.species.name}
                className="detail-image"
              />
              <div className="types">
                {selectedPokemon.types.map((type) => (
                  <span
                    key={type.type.name}
                    style={{
                      backgroundColor: typeColors[type.type.name] || "#777",
                    }}
                  >
                    {capitalize(type.type.name)}
                  </span>
                ))}
              </div>
            </div>

            {/* Varieties Section */}
            {allForms.length > 1 && (
              <div className="varieties-section">
                <p>Available Forms:</p>
                <div className="varieties-buttons">
                  {allForms.map((v) => {
                    // 1. Skip the form currently being displayed
                    if (v.pokemon.name === selectedPokemon.name) return null;

                    // 2. Determine the display name
                    const nameParts = v.pokemon.name.split("-");
                    let displayName = capitalize(
                      nameParts[nameParts.length - 1]
                    );

                    // Simple logic to improve display name
                    if (v.is_default) {
                      displayName = "Base";
                    } else if (nameParts.length > 1) {
                      displayName = capitalize(nameParts[nameParts.length - 1]);
                    } else {
                      displayName = capitalize(v.pokemon.name);
                    }

                    return (
                      <button
                        key={v.pokemon.name}
                        onClick={() => handleSearchClick(v.pokemon.name)}
                        className="variety-btn"
                      >
                        {displayName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <ul className="stats">
              <h4>Base Stats:</h4>
              {selectedPokemon.stats.map((stat) => {
                // Max stat is 255. Calculate width as a percentage for the CSS variable.
                const statWidth = Math.min(100, (stat.base_stat / 255) * 100);

                return (
                  <li
                    key={stat.stat.name}
                    // Apply the dynamic CSS variable here for the ::before pseudo-element
                    style={{ "--stat-width": `${statWidth}%` }}
                  >
                    <span className="stat-label">
                      {capitalize(stat.stat.name.replace("-", " "))}:
                    </span>
                    <span className="stat-value">{stat.base_stat}</span>
                    {/* The visual bar is now rendered by the ::before pseudo-element in CSS */}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Root Component Wrapping ---

function FallbackComponent({ error, resetErrorBoundary }) {
  const queryClient = useQueryClient();

  // Function to clear React Query cache and reset the Error Boundary
  const handleReset = () => {
    queryClient.clear();
    resetErrorBoundary();
  };

  return (
    <div role="alert" className="error-alert">
      <p className="error-title">⚠️ Error Loading Data</p>
      <pre className="error-message">{error.message}</pre>
      <button onClick={handleReset} className="error-button">
        Try Again
      </button>
    </div>
  );
}

const LoadingFallback = () => (
  <div className="loading-fallback">
    {/* Placeholder image for Pokeball */}
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Pok%C3%A9_Ball_icon.svg/200px-Pok%C3%A9_Ball_icon.svg.png"
      alt="Loading"
    />
    <p>Loading Pokémon...</p>
  </div>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary FallbackComponent={FallbackComponent}>
        <Suspense fallback={<LoadingFallback />}>
          <AppContent />
        </Suspense>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
