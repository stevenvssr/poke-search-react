const form = document.querySelector("#grocery-form");
const item = document.querySelector("#item");
const list = document.querySelector("#pokemon-list");
const pokedata = document.querySelector("#pokemon-data");
const info = document.querySelector(".info");
const genButtons = document.querySelectorAll(".gens");

const baseURL = 'https://pokeapi.co/api/v2/pokemon/';

const gens = {
  genOne: [0, 151],
  genTwo: [152, 251],
  genThree: [252, 386],
  genFour: [387, 493],
  genFive: [494, 649],
  genSix: [650, 721],
  genSeven: [722, 809],
  genEight: [810, 898]
};

const pokeDisplay = async (start, finish) => {
await fetch(`https://pokeapi.co/api/v2/pokemon/?offset=${start}&limit=${finish}`)
.then(response => response.json())
.then(data => {
    data.results.forEach(pokemon => {
    list.insertAdjacentHTML("beforeend", `<li><button class="pokebutt btn btn-primary">${pokemon.name[0].toUpperCase() + pokemon.name.substring(1)}</button></li>`)
})
})

const pokebuttons = document.querySelectorAll(".pokebutt");

pokebuttons.forEach(button => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    fetch(baseURL + `${button.innerText.toLowerCase()}`)
  .then(response => response.json())
  .then( data => {
    console.log(data)
    info.insertAdjacentHTML("beforeend", '<ul class="pokemon-data"></ul>')
    list.innerHTML = '';
    info.insertAdjacentHTML("afterbegin",
      `<h3>${data.species.name[0].toUpperCase() + data.species.name.substring(1)}</h3>
      <img src="${data.sprites.front_default}"><hr><div><button onclick="location.reload();">Back</button></div>`)
  })
  item.value = '';
  })
})
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  list.textContent = '';
  info.textContent = '';
  info.insertAdjacentHTML("beforeend", `<ul id="pokemon-list"></ul>
<ul id="pokemon-data"></ul>`)
  try{
  fetch(baseURL + `${item.value.toLowerCase()}`)
  .then(response => response.json())
  .then( data => {
    info.insertAdjacentHTML("beforeend", '<ul class="pokemon-data"></ul>')
    list.innerHTML = '';
    info.insertAdjacentHTML("afterbegin",
      `<h3>${data.species.name[0].toUpperCase() + data.species.name.substring(1)}</h3>
      <img src="${data.sprites.front_default}"><hr><div><button onclick="location.reload();">Back</button></div>`)
  })
} catch(error){
  console.error("Pokemon doesn't excist!");
}
  item.value = '';
})

genButtons.forEach(button => {
  button.addEventListener("click",(event) => {
  event.preventDefault();
  list.textContent = '';
  info.textContent = '';
  info.insertAdjacentHTML("beforeend", `<ul id="pokemon-list"></ul>
<ul id="pokemon-data"></ul>`)
  pokeDisplay(gens[button.getAttribute('id')][0], gens[button.getAttribute('id')][1] )
})
})
